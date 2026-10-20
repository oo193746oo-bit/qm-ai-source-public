/**
 * 小雪对话状态机 v13.1
 *
 * S0 初始        — 刚进入 booking，未明确意图
 * S1 了解信息    — 询问费用/流程/服务/基本信息
 * S2 需求探索    — 用户提到困扰/焦虑/想解决什么但未开始正式收集
 * S3 信息收集    — 用户同意开始准备预约
 * S4 信息完整    — 必要字段齐
 * S5 摘要确认    — 已生成摘要待用户确认
 * S6 等待人工    — 用户确认提交
 */

export type XiaoxueState = "S0" | "S1" | "S2" | "S3" | "S4" | "S5" | "S6";

export interface XiaoxueSessionState {
  state: XiaoxueState;
  collectedFields: Record<string, string>;
  knownIntents: string[];
  xiaokuOffered: boolean;
  xiaokuDeclined: boolean;
  humanDeclined: boolean;
  lastGoal?: string;
  turnCount: number;
}

export function createInitialState(): XiaoxueSessionState {
  return {
    state: "S0",
    collectedFields: {},
    knownIntents: [],
    xiaokuOffered: false,
    xiaokuDeclined: false,
    humanDeclined: false,
    turnCount: 0,
  };
}

/** 必要字段：困扰方向 + 形式偏好 */
const REQUIRED_FIELDS = ["primary_goal", "service_mode"];

/**
 * 判断用户消息是否表达了明确要预约的意图
 */
function wantsBooking(msg: string): boolean {
  return /开始预约|我想预约|我要预约|帮我预约|预约心理师|预约咨询|现在预约|直接预约|我想约/.test(msg);
}

/**
 * 判断用户是否只是随便看看/暂不预约
 */
function wantsToBackOff(msg: string): boolean {
  return /先不预约|只是看看|先看看|先了解|还没准备好|不急|再想想|考虑考虑|只是问问|先聊聊|还不确定/.test(msg);
}

/**
 * 判断是否为事实类问题（费用/流程/地址/时间等）
 */
function isFactQuestion(msg: string): boolean {
  return /费用|价格|多少钱|收费|怎么收费|流程|怎么预约|怎么走|地址|在哪里|营业时间|工作时间|几点|服务|有什么服务|介绍一下|微信|公众号|客服/.test(msg);
}

/**
 * 判断是否提到情绪困扰但未明确要预约
 */
function mentionsEmotionalConcern(msg: string): boolean {
  return /焦虑|难受|犹豫|害怕|担心|紧张|压力|低落|抑郁|困扰|痛苦|迷茫|害怕|不安|烦躁|崩溃|想哭|失眠/.test(msg);
}

/**
 * 判断是否确认提交
 */
function confirmsSubmission(msg: string): boolean {
  return /确认提交|提交|确认预约|可以了|就这样|确认|没问题|发给.*人工|提交给人工/.test(msg);
}

/**
 * 判断用户是否提供了困扰方向+预算+形式中的任意2项
 */
function hasTwoBookingSignals(msg: string, fields: Record<string, string>): boolean {
  let signals = 0;
  if (fields.primary_goal || /焦虑|关系|家庭|职场|情绪|抑郁|亲密|亲子|婚姻|创伤|进食|睡眠|自我/.test(msg)) signals++;
  if (fields.budget_range || /\d{3,4}.*元|预算|价位|400|500|600|800|900|1000|1500|便宜|贵/.test(msg)) signals++;
  if (fields.service_mode || /线上|线下|视频|面对面|到店|面询/.test(msg)) signals++;
  return signals >= 2;
}

/**
 * 从用户消息中提取收集到的字段
 */
function extractFields(msg: string, existing: Record<string, string>): Record<string, string> {
  const fields = { ...existing };

  // 困扰方向
  if (!fields.primary_goal) {
    const topicMap: [RegExp, string][] = [
      [/焦虑|压力|惊恐/, "焦虑/压力"],
      [/抑郁|低落/, "抑郁/低落"],
      [/恋爱|感情|亲密|分手|失恋|伴侣/, "情感关系"],
      [/家庭|父母|原生/, "家庭/原生家庭"],
      [/职场|工作|职业|拖延/, "职场/发展"],
      [/创伤|阴影|PTSD/, "创伤"],
      [/进食|饮食|减肥|身材|暴食|厌食/, "进食/身体意象"],
      [/失眠|睡眠/, "睡眠"],
      [/婚姻/, "婚姻"],
      [/孩子|儿童|青少年|亲子/, "亲子/青少年"],
      [/身份|认同|自我探索|迷茫|自我成长/, "身份认同/自我成长"],
      [/人际|社交/, "人际关系"],
      [/LGBT|同性恋|出柜|性别|酷儿|跨性别/, "性别多元"],
      [/ADHD|注意力|多动/, "ADHD/注意力"],
    ];
    for (const [re, label] of topicMap) {
      if (re.test(msg)) {
        fields.primary_goal = label;
        break;
      }
    }
  }

  // 预算
  if (!fields.budget_range) {
    if (/400|500|便宜|预算有限|低预算/.test(msg)) fields.budget_range = "400-500";
    else if (/600|700|800|900|中等/.test(msg)) fields.budget_range = "600-900";
    else if (/1500|高端|资深|不在乎钱|最好的/.test(msg)) fields.budget_range = "1500";
  }

  // 形式
  if (!fields.service_mode) {
    if (/线上|视频|远程/.test(msg)) fields.service_mode = "线上";
    else if (/线下|面对面|到店|面询|当面/.test(msg)) fields.service_mode = "线下";
  }

  // 时间偏好
  if (!fields.time_pref) {
    if (/工作日白天|周中.*白天/.test(msg)) fields.time_pref = "工作日白天";
    else if (/工作日晚|周中.*晚|平时晚上/.test(msg)) fields.time_pref = "工作日晚";
    else if (/周末/.test(msg)) fields.time_pref = "周末";
  }

  return fields;
}

/**
 * 根据当前状态和用户消息推进状态
 * @param current 当前完整 session state（从中读取 .state 和 .collectedFields）
 * @param userMessage 用户最新消息
 * @param collectedFields 可选的外部字段覆盖（优先于 current.collectedFields）
 * @returns 新的 XiaoxueState 字符串
 */
export function advanceState(
  current: XiaoxueSessionState,
  userMessage: string,
  collectedFields?: Record<string, string>,
): XiaoxueState {
  const currentState = current.state;
  const msg = userMessage.trim();
  const fields = collectedFields || current.collectedFields;
  const newFields = extractFields(msg, fields);

  // S6 是终态，除非用户说要重新来
  if (currentState === "S6") {
    if (/重新|再来|改一下|修改|重新预约/.test(msg)) return "S3";
    return "S6";
  }

  // 用户说先不预约/只是看看 → 回 S1
  if (wantsToBackOff(msg)) return "S1";

  // S5 用户确认提交 → S6
  if (currentState === "S5" && confirmsSubmission(msg)) return "S6";

  // S5 用户要求修改 → 回 S3
  if (currentState === "S5" && /修改|改一下|不对|换一个|重新整理/.test(msg)) return "S3";

  // S4 → S5（生成摘要后自然推进，通常由 route 显式设置，这里兜底）
  // S4 在生成摘要后应进入 S5，由调用方在生成摘要后直接设置

  // S3 中必要字段齐了 → S4
  if (currentState === "S3") {
    const hasAll = REQUIRED_FIELDS.every((f) => newFields[f] && newFields[f].trim().length > 0);
    if (hasAll) return "S4";
    return "S3";
  }

  // 用户说"开始预约"等 → S3
  if (wantsBooking(msg)) return "S3";

  // 提供了困扰方向+预算+形式中的任意2项 → S3
  if (hasTwoBookingSignals(msg, newFields) && currentState !== "S0") return "S3";

  // 事实问题 → S1（回答后回到原状态由 route 处理，这里先标 S1）
  if (isFactQuestion(msg)) {
    if (currentState === "S0") return "S1";
    return currentState; // 非S0状态保持原状态，事实问答插入
  }

  // 提到情绪困扰但没明确要预约 → S2
  if (mentionsEmotionalConcern(msg) && !wantsBooking(msg)) {
    if (currentState === "S0" || currentState === "S1") return "S2";
    return currentState;
  }

  // S0 默认：如果有任何实质内容，先到 S1
  if (currentState === "S0" && msg.length > 0) return "S1";

  return currentState;
}

/**
 * 更新完整 session state（含字段提取和 turn 计数）
 */
export function updateSessionState(
  current: XiaoxueSessionState,
  userMessage: string,
): XiaoxueSessionState {
  const newFields = extractFields(userMessage, current.collectedFields);
  const newState = advanceState(current, userMessage, newFields);
  return {
    ...current,
    state: newState,
    collectedFields: newFields,
    turnCount: current.turnCount + 1,
    knownIntents: current.knownIntents,
  };
}
