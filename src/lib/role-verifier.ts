/**
 * QM AI 全局角色治理运行时审核器
 * DECISION-ROLE-001 v14.0 — G001-G010
 *
 * 小酷/小雪共用，在流结束后对fullOutput执行审核。
 * P0违规：重试1次注入明确越权警告+正确话术；重试仍违规则用安全模板。
 * P1违规：记录日志但不阻断。
 *
 * v12.0.1 扩充：
 * - 否定词感知：正确分流话术中的"不能帮您预留/需要小雪确认"不被误判
 * - 补齐Lara截图幻觉原话覆盖
 * - G002临床模式扩充
 */

import type { AdminIntentType } from "./role-governance";

// ============================================================
// 文本标准化（与role-governance一致）
// ============================================================

function normalizeForVerify(text: string): string {
  if (!text) return "";
  // 简单繁简映射（高频字）
  const map: Record<string, string> = {
    "預": "预", "約": "约", "錢": "钱", "費": "费", "時": "时",
    "點": "点", "師": "师", "這": "这", "說": "说", "談": "谈",
    "請": "请", "誰": "谁", "為": "为", "個": "个", "聯": "联",
    "繫": "系", "過": "过", "來": "来", "從": "从", "問": "问",
    "營": "营", "業": "业", "處": "处", "務": "务", "員": "员",
    "麼": "么", "辦": "办", "對": "对", "與": "与", "經": "经",
    "歷": "历", "傷": "伤", "殺": "杀", "殘": "残", "懼": "惧",
    "慮": "虑", "鬱": "郁", "療": "疗", "詢": "询", "號": "号",
    "關": "关", "門": "门",
  };
  let result = text;
  for (const [trad, simp] of Object.entries(map)) {
    result = result.split(trad).join(simp);
  }
  return result;
}

// ============================================================
// 类型定义
// ============================================================

export type VerifierSeverity = "P0" | "P1";

export interface RoleViolation {
  ruleId: string;
  severity: VerifierSeverity;
  description: string;
  matchedText: string;
}

export interface RoleVerifyResult {
  pass: boolean;
  p0Violations: RoleViolation[];
  p1Violations: RoleViolation[];
  allViolations: RoleViolation[];
}

export type AgentRole = "xiaoku" | "xiaoxue";

// ============================================================
// 否定词感知：检测匹配文本前后是否有否定语境
// 用于避免"我不能帮您预留"被误判为"帮您预留"
// ============================================================

const NEGATION_WORDS = [
  "不能", "不会", "不可", "不要", "没法", "无法", "没办法",
  "不能直接", "不会直接", "不替", "不自行", "不能帮", "不会帮",
  "无法帮", "没法帮", "不能给", "不会给", "无法直接",
];

/** 检查匹配位置前12字内是否有否定词 */
function hasNegationBefore(text: string, matchIndex: number, window = 12): boolean {
  const before = text.slice(Math.max(0, matchIndex - window), matchIndex);
  return NEGATION_WORDS.some((w) => new RegExp(w).test(before));
}

/** 检查整段文本是否在描述"不能/不会做某事" */
function isNegationContext(text: string): boolean {
  return /(不能|不会|不可|不要|没法|无法|不直接|不替|不自行)/.test(text);
}

// ============================================================
// G001: 小酷输出行政答案而非转小雪
// ============================================================

interface G001Pattern {
  category: string;
  patterns: RegExp[];
  /** 是否需要否定词感知（避免正确话术被误拦） */
  negationAware?: boolean;
}

const G001_XIAOKU_ADMIN_ANSWER: G001Pattern[] = [
  {
    category: "费用数字",
    negationAware: true,
    patterns: [
      /\d{3,4}\s*[元块]\s*[/／每]\s*[次小时段]/,
      /(费用|价格|收费|价位).{0,10}\d{3,4}/,
      /\d{3,4}\s*[元块].{0,6}(一次|每次|每小时|一个小时)/,
      /(400|500|600|700|800|900|1200|1500)\s*[元块]/,
      /(免费|不收费|不花钱|不收钱|不用花钱|不用收费|第一次免费|来了解不收费)/,
      /(收费|费用|价格)(?!.{0,4}(已经|是预约|这边|范畴|问题)).{0,6}(是|为|：:)/,
    ],
  },
  {
    category: "地址",
    negationAware: true,
    patterns: [
      /(上海|北京|广州|深圳).{0,10}(路|街|号|大道|区)/,
      /静安区.{0,20}(路|号|街)/,
      /民立路\d+号/,
      /地址[是为:：].{0,30}/,
      /(我们|机构|中心|具体)?位置?(在|位于).{0,20}(路|号|街|区|大道)/,
      /(在|位于).{0,10}(南京西路|静安区|路\d+号)/,
    ],
  },
  {
    category: "工作时间",
    negationAware: true,
    patterns: [
      /\d{1,2}[:：]\d{2}\s*[-—到至]\s*\d{1,2}[:：]\d{2}/,
      /(10|上午10)[点:：]\s*0?0?\s*[-—到至].{0,6}(22|晚上10|10)\s*点/,
      /工作时间[是为:：].{0,30}/,
      /营业时间[是为:：].{0,30}/,
      /(周一|周二|周三|周四|周五|周六|周日|周一至周日|每天).{0,4}\d{1,2}\s*点/,
      /(周末|工作日|每天).{0,4}(营业|上班|开门|下班)/,
      /(早上|上午|中午|下午|晚上)?\s*\d{1,2}\s*点\s*(半)?\s*(开|关|上班|下班|营业|结束|开始)/,
      /(晚上|早上|上午|下午).{0,4}\d{1,2}\s*点.{0,4}(关|开|下班|上班|结束)/,
    ],
  },
  {
    category: "预约确认",
    negationAware: true,
    patterns: [
      /(帮你|帮您|给你|给您|替你|替您).{0,4}(预约|约好|订好|安排好|预留|留好|确认)/,
      /(已经|已)(帮|给|替|为).{0,4}(预约|约好|订好|安排|预留|确认)/,
      /预约成功/,
      /已预约(?!.*问题)/,
      /(约|订|安排).{0,4}(好了|完了|成功)/,
      /(已经|已)(预约|预订|安排|预留|确认).{0,4}(了|好|成功)/,
      /到了?跟?前台说.{0,10}(约了|提前约|预约|有约)/,
      /到店说一声.{0,6}(预约|有约)/,
      /报我?名字/,
      /直接去前台(登记|签到)/,
    ],
  },
  {
    category: "心理师点名",
    patterns: [
      /\b(Susan|Candice|Christy)\b/gi,
      /陈瑜倩/,
      /(心理师|咨询师|老师).{0,4}(叫|是|姓|名).{0,4}[\u4e00-\u9fa5]{2,4}/,
    ],
  },
  {
    category: "到访邀请",
    negationAware: true,
    patterns: [
      /(可以|随时|直接|欢迎|放心).{0,8}(过来|到店|过来一趟|过来看看|过来吧|过来就行)(?!.*(找我|回来|心理))/,
      /(随时|直接|欢迎|放心)(?!.*回来).{0,4}来(?!.*(找我|回来|心理|继续聊|聊聊?心理))(?![过])/,
      /(过来|来).{0,4}(吧|就行|可以|没问题)(?!.*(找我|回来))/,
      /(你|您).{0,4}(下午|上午|今天|明天|周[一二三四五六日天]).{0,8}(可以|过来|来|到)/,
      /(到店|到现场|过来).{0,6}(看看|聊聊|了解|问|参观|看资料|当面)/,
      /(当面|现场|到了).{0,6}(问|说|聊|沟通|了解|看|说明|问清楚)/,
      /(您|你)有任何疑问.{0,6}(当面|现场|过来)/,
      /(下午|上午|今天|明天).{0,4}(过来|来|到店).{0,6}(看看|了解|资料|问)/,
      /路过.{0,4}(进来|上来|坐坐)/,
      /(来之前|到之前).{0,4}说一声/,
    ],
  },
  {
    category: "预留/确认时间",
    negationAware: true,
    patterns: [
      /(帮你|帮您|给你|给您).{0,4}(预留|留好|锁定|留位|定好|订好)/,
      /(已经|已).{0,4}(预留|留好|锁定|确认了?|安排了?)/,
      /\d{1,2}\s*点.{0,6}(帮你|帮您|给你|给您).{0,4}(留|预留|确认|安排)/,
      /(这个时间|那个时间|周三?|周四?).{0,4}(有空|可以|没问题|帮你留|已预留)/,
      /(约好了|预约成功|已预约|安排好了|帮您留好了?)/,
    ],
  },
  {
    category: "联系方式",
    patterns: [
      /(微信|电话|手机|联系方式).{0,4}[是为:：]?\s*[a-zA-Z0-9]{5,}/,
      /queermental\d*/,
    ],
  },
  {
    category: "服务形式/时长",
    patterns: [
      /(线上|线下).{0,4}(都有|都可以|两种|方式)/,
      /(咨询时长|每次|时长).{0,4}\d{1,3}\s*分钟/,
      /有\s*(\d+|[一二三四五六七八九十两])+\s*位心理师/,
    ],
  },
  {
    category: "前台接待描述",
    negationAware: true,
    patterns: [
      /(前台|工作人员).{0,4}(会|可以|能).{0,8}(聊|沟通|说|谈|接待|看|跟|和|处理|帮)/,
      /前台.{0,4}(跟|和|与).{0,8}(孩子|您|你|家人).{0,4}(聊|沟通|说|谈)/,
      /(到了|到店|到现场).{0,4}(前台|工作人员).{0,8}(聊|沟通|说|谈|接待|说明|处理|帮)/,
      /前台会.{0,8}(安排|接待|沟通|说明|处理|帮)/,
    ],
  },
];

// ============================================================
// G004: 未确认预约邀请walk-in
// ============================================================

const G004_WALKIN_PATTERNS: RegExp[] = [
  /(随时|直接|欢迎|放心).{0,8}(过来|到店|过来一趟|过来吧)(?!.*(找我|回来|心理))/,
  /(随时|直接|欢迎|放心)(?!.*回来).{0,4}来(?!.*(找我|回来|心理|继续聊|聊聊?心理))/,
  /(下午|上午|今天|明天|周[一二三四五六日天]).{0,8}(直接|可以|过来|来一趟|来)(?!.*(找我|回来))/,
  /(先|可以).{0,4}(过来|来).{0,4}(看看|聊聊|了解|问|参观|坐坐)/,
  /(不收费|免费|不用花钱|不花钱).{0,4}(先|来|聊|了解|看|过来|了解一下)/,
  /(前台|工作人员).{0,4}(会|可以|能).{0,8}(聊|沟通|说|谈|接待|看|安排|处理|帮)/,
  /过来吧/,
  /来吧(?![，。！？\s]*$)/,
  /路过.{0,4}(进来|上来|坐坐|来)/,
  /(来之前|到之前).{0,4}说一声/,
  /(您|你)直接到(现场|店|前台)/,
  /到店.{0,4}(有|看|拿|了解).{0,8}(资料|介绍|材料)/,
  /(随时|直接).{0,4}到(店|现场|前台)/,
  /到了?前台.{0,8}(帮|处理|安排|接待|聊|沟通)/,
];

// ============================================================
// G005: LLM预留/确认时间
// ============================================================

const G005_RESERVE_PATTERNS: RegExp[] = [
  /(帮你|帮您|给你|给您).{0,4}(预留|留好|锁定|留位|定好|订好|确认了?|确认好)/,
  /(已经|已).{0,4}(预留|留好|锁定|确认了?|安排了?)/,
  /\d{1,2}\s*点.{0,6}(帮你|帮您|给你|给您).{0,4}(留|预留|确认|安排)/,
  /(这个时间|那个时间|周三?|周四?).{0,4}(有空|可以|没问题|帮你留|已预留|帮您确认)/,
  /(约好了|预约成功|已预约|安排好了|帮您留好|帮你留好|帮您确认了|帮你确认了)/,
  /\d{1,2}\s*点.{0,4}(帮|给|替).{0,4}(留|预留|确认|锁定|安排)/,
  /(这个|那个).{0,4}时间.{0,4}(帮|给|替).{0,4}(确认|留|预留|锁定|安排)/,
];

// ============================================================
// G006: LLM确认付款/实时档期/已通知人工
// ============================================================

const G006_CONFIRM_PATTERNS: RegExp[] = [
  /(已经|已|早就).{0,4}(付款|支付|交费|收款|到账|付了|付过|缴了|缴过)/,
  /(付款|支付|交费).{0,4}(成功|完成|确认|好了|过了)/,
  /付过款?了?/,
  /(已经|已|我).{0,4}(通知|联系|告知).{0,4}(客服|工作人员|人工|心理师|前台)/,
  /(客服|工作人员|人工).{0,4}(会等|在等)/,
  /(通知|联系).{0,4}(好了|完了|过了)/,
  /(实时|现在).{0,4}(档期|空位|时间).{0,4}(有|是|可以)/,
  /(今天|明天|周[一二三四五六日天]).{0,6}(有空|有位置|有档期|可以约)/,
  /工作人员会.{0,8}(等|对接|接待)/,
];

// ============================================================
// G002: 小雪心理咨询式分析/干预/深问
// ============================================================

const G002_CLINICAL_PATTERNS: RegExp[] = [
  /(你|您).{0,6}(焦虑|抑郁|痛苦|创伤|情绪|困扰|问题).{0,6}(来源|根源|因为|由于|来自|始于|造成|源于|导致)/,
  /(可能|看起来|感觉|看上去).{0,6}(是|有|患|属于).{0,8}(抑郁症|焦虑症|PTSD|人格障碍|双相|精神疾病|依恋创伤|心理疾病|临床抑郁|创伤后应激)/,
  /(诊断|确诊|临床诊断|症状表明|表现符合|典型的|临床表现)/,
  /(你的|这种|您的).{0,4}(防御机制|依恋模式|人格结构|移情|投射|解离|回避型|焦虑型|安全型|投射性认同)/,
  /(你|您).{0,6}(在用|使用|表现出|呈现).{0,6}(投射|防御|否认|压抑|解离|回避|投射性认同)/,
  /(童年|幼年|小时候|早年).{0,6}(导致|造成|形成|根源|创伤|经历|影响)/,
  /(第一次|最早|从什么时候).{0,8}(感到|觉得|出现|经历|开始有|有这种)/,
  /(你|您).{0,4}(和|跟).{0,4}(父母|爸爸|妈妈|家人|父亲|母亲).{0,8}(关系|最深|最痛|最受伤|发生过|怎样)/,
  /(深入|详细|具体).{0,4}(说说|谈谈|描述|讲讲).{0,8}(童年|经历|创伤|感受|关系|事件|小时候)/,
  /(建议|应该|需要).{0,4}(接受|进行|寻求).{0,6}(心理治疗|治疗|干预|心理咨询|专业帮助|精神分析|长期咨询)/,
  /(建议|应该|需要|可以).{0,4}(你|您).{0,6}(长期|定期|持续).{0,4}(精神分析|心理治疗|咨询|治疗)/,
  /(可以|试着|试试).{0,4}(用|做|尝试).{0,6}(认知行为|CBT|精神分析|正念|暴露疗法|正念疗法|心理治疗|疗法)/,
  /(我来帮你|我们来?一起|让我们).{0,6}(处理|面对|解决|疗愈|探索).{0,8}(创伤|痛苦|情绪|问题|内心|恐惧|深处)/,
  /(这是|属于|叫做|你正在经历).{0,6}(PTSD|解离|人格障碍|防御机制|移情|反移情|创伤后应激|抑郁症|焦虑症|双相|精神分裂|临床抑郁)/,
  /(你|您).{0,4}(小时候|童年).{0,6}(是不是|有没有|经历过)/,
  /(被抛弃|被忽视).{0,4}感.{0,4}(从|来源|源于)/,
  /(你|您)的(抑郁|焦虑).{0,4}(可能|应该).{0,6}(深层|根本|原因)/,
  /(发生了什么|你怎么了|什么感觉).{0,4}[？?]?$/,
  /(这是|属于).{0,4}(抑郁症|焦虑症|双相|PTSD|人格障碍|精神分裂|强迫症|进食障碍|创伤后应激|临床抑郁)/,
  /(你|您).{0,6}(正在经历|表现出|出现了|存在).{0,6}(创伤后应激|PTSD|抑郁症|焦虑症|人格障碍|解离|精神症状)/,
  /(正念疗法|认知行为疗法|精神分析治疗|暴露疗法|DBT|ACT|EMDR|催眠治疗|沙盘治疗)/,
  // 直接诊断/贴标签
  /(你|您).{0,6}(有|是|患|属于|表现出).{0,8}(抑郁症|焦虑症|双相|精神分裂|强迫症|人格障碍|边缘型|自恋型|回避型|反社会|表演型|依赖型|强迫型|偏执型|分裂样|分裂型|PTSD|创伤后应激|进食障碍|厌食|暴食|惊恐障碍|社交焦虑|广场恐惧|广泛性焦虑|ADHD|多动症|自闭|阿斯伯格|解离|躁狂发作|躁郁)/,
  /(你|您).{0,4}(有|是|患).{0,4}(典型|明显|显著).{0,6}(特征|症状|表现|倾向)/,
  /(这|那).{0,4}(是|属于|为).{0,6}(抑郁症|焦虑症|双相|精神分裂|强迫症|人格障碍|边缘型|自恋型|回避型|反社会|表演型|依赖型|强迫型|偏执型|分裂样|PTSD|创伤后应激|进食障碍|躁狂|躁郁|解离|神经症|精神病)/,
  /(你|您).{0,6}(正在经历|经历着|处于).{0,6}(躁狂|抑郁发作|躁期|郁期|创伤后应激|PTSD|解离|人格解体|精神症状|危机)/,
  /(你|您)的(抑郁|焦虑|进食|睡眠|情绪|强迫|恐惧|惊恐).{0,6}(源于|来自|因为|由于|根源在)/,
  // 评判/否定
  /(你|您).{0,4}(就是|只是).{0,4}(想太多|想开点|太敏感|意志力|不够坚强|矫情|玻璃心)/,
  /(应该|需要).{0,4}(靠|用).{0,4}(意志力|坚强|自己|毅力)/,
  /(不是真的|根本不是|算不上).{0,4}(抑郁|焦虑|病|创伤)/,
  /(吃药|药物).{0,4}(不好|没用|伤身|别吃|停了|不要吃)/,
];

// ============================================================
// G003: 人工客服/前台被描述成提供心理咨询
// ============================================================

const G003_FRONT_DESK_CLINICAL: RegExp[] = [
  /(前台|客服|工作人员|人工).{0,8}(聊|沟通|说|谈|咨询|开导|安慰|心理|接待|评估|了解您?的?(困扰|情况|问题))(?!.*(偏好|确认安排|行政|工作时间))/,
  /(前台|客服|工作人员|人工).{0,4}(会|可以|能|先).{0,6}(聊|沟通|说|谈|咨询|开导|安慰|接待|评估)(?!.*(偏好|确认|行政))/,
  /(到了|到店|到现场).{0,4}(前台|工作人员|他们|客服).{0,8}(帮|处理|安排|接待|聊|沟通|说明|看)/,
  /(前台|客服).{0,4}(和|跟|与).{0,6}(孩子|你|您|家人).{0,4}(聊|沟通|说|谈)/,
  /(前台|工作人员).{0,4}(跟|和|与).{0,8}(孩子|您|你).{0,4}(沟通|聊|说|谈)/,
];

// ============================================================
// G008: 小酷转介过于生硬（P1）
// ============================================================

const G008_HANDOFF_BLUNT: RegExp[] = [
  /^.{0,10}(去问|去找|找|问).{0,4}小雪[。！？\s]*$/,
  /(这个|那).{0,4}(你|您).{0,4}(去问|去找|找).{0,4}小雪[。！？\s]*$/,
  /(我不(管|处理|负责)|不归我管|不关我事|我不管)/,
  /^(小雪|问小雪|找小雪)[。！？\s]*$/,
];

// ============================================================
// G009: 小雪只推人工而不完成可做行政工作（P1）
// ============================================================

const G009_OVER_ESCALATE: RegExp[] = [
  /^(请联系|联系|找|问).{0,4}(人工|客服).{0,10}[。！？\s]*$/,
  /(这个|所有|全部).{0,4}(都|只能).{0,4}(找|联系|问).{0,4}(人工|客服)/,
  /我(帮不了|做不了|没办法|无法回答).{0,10}(人工|客服)/,
];

// ============================================================
// G010: 行政收集深入到咨询内容（P1）
// ============================================================

const G010_OVER_COLLECT: RegExp[] = [
  /(能|可以).{0,4}(详细|具体|深入).{0,4}(说说|谈谈|描述|讲讲).{0,4}(经历|童年|创伤|感受|关系|事件)/,
  /(什么|怎样|如何).{0,4}(时候|情况|场景).{0,4}(开始|出现|第一次)/,
  /(当时|那个时候).{0,4}(发生了什么|你怎么了|什么感觉)/,
];

// ============================================================
// 主审核函数
// ============================================================

export function verifyRoleOutput(
  output: string,
  role: AgentRole,
  options?: {
    userMessage?: string;
    adminIntentDetected?: boolean;
    adminIntents?: AdminIntentType[];
  },
): RoleVerifyResult {
  const p0Violations: RoleViolation[] = [];
  const p1Violations: RoleViolation[] = [];

  const addP0 = (ruleId: string, description: string, matchedText: string) => {
    if (!p0Violations.some((v) => v.ruleId === ruleId && v.matchedText === matchedText)) {
      p0Violations.push({ ruleId, severity: "P0", description, matchedText });
    }
  };

  const addP1 = (ruleId: string, description: string, matchedText: string) => {
    if (!p1Violations.some((v) => v.ruleId === ruleId && v.matchedText === matchedText)) {
      p1Violations.push({ ruleId, severity: "P1", description, matchedText });
    }
  };

  const checkPatterns = (
    patterns: RegExp[],
    ruleId: string,
    description: string,
    severity: VerifierSeverity,
  ) => {
    for (const pattern of patterns) {
      const match = output.match(pattern);
      if (match) {
        if (severity === "P0") {
          addP0(ruleId, description, match[0]);
        } else {
          addP1(ruleId, description, match[0]);
        }
        break;
      }
    }
  };

  /**
   * 带否定词感知的pattern检查：
   * 如果匹配文本前有否定词（"不能/不会/无法"），则不算违规。
   * 用于正确分流话术如"我不能帮您预留"不被误判。
   */
  const checkPatternsNegationAware = (
    patterns: RegExp[],
    ruleId: string,
    description: string,
    severity: VerifierSeverity,
  ) => {
    for (const pattern of patterns) {
      const match = output.match(pattern);
      if (match) {
        // 检查匹配位置前是否有否定词
        const isNegated = hasNegationBefore(output, match.index ?? 0);
        // 也检查整个输出是否在讨论"不能做某事"
        const wholeOutputNegation = isNegationContext(output) ||
          /(不替|不直接|不自行|这边的问题|属于.*?范畴|不归我|不是我).{0,10}(回答|说|讲|决定|安排|确认|处理)/.test(output) ||
          /(不能|不会|不可以|没法|无法|不直接|不替|不自行|需要.{0,6}确认|由.{0,6}确认)/.test(output);

        if (isNegated || wholeOutputNegation) {
          // 否定语境，跳过此匹配
          continue;
        }

        if (severity === "P0") {
          addP0(ruleId, description, match[0]);
        } else {
          addP1(ruleId, description, match[0]);
        }
        break;
      }
    }
  };

  // ---- G004: walk-in邀请（小酷小雪都检查）----
  checkPatterns(G004_WALKIN_PATTERNS, "G004", "未确认预约邀请walk-in", "P0");

  // ---- G005: LLM预留/确认时间 ----
  checkPatternsNegationAware(G005_RESERVE_PATTERNS, "G005", "LLM预留/确认时间", "P0");

  // ---- G006: LLM确认付款/档期/通知人工 ----
  checkPatterns(G006_CONFIRM_PATTERNS, "G006", "LLM确认付款/实时档期/已通知人工", "P0");

  if (role === "xiaoku") {
    // ---- G001: 小酷输出行政答案 ----
    for (const group of G001_XIAOKU_ADMIN_ANSWER) {
      const checker = group.negationAware ? checkPatternsNegationAware : checkPatterns;
      checker(group.patterns, "G001", `小酷输出行政答案（${group.category}）`, "P0");
    }

    // ---- G008: 转介生硬（P1）----
    if (options?.adminIntentDetected) {
      checkPatterns(G008_HANDOFF_BLUNT, "G008", "小酷转介过于生硬未承接", "P1");
    }
  }

  if (role === "xiaoxue") {
    // ---- G002: 小雪心理分析 ----
    checkPatterns(G002_CLINICAL_PATTERNS, "G002", "小雪进行心理咨询式分析/干预", "P0");

    // ---- G003: 前台/客服被描述为心理咨询 ----
    checkPatterns(G003_FRONT_DESK_CLINICAL, "G003", "人工客服/前台被描述成提供心理咨询", "P0");

    // ---- G009: 过度甩人工（P1）----
    checkPatterns(G009_OVER_ESCALATE, "G009", "小雪只推人工而不完成可做行政工作", "P1");

    // ---- G010: 行政收集过深（P1）----
    checkPatterns(G010_OVER_COLLECT, "G010", "行政收集深入到咨询内容", "P1");
  }

  // ---- 英语输出补充检查 ----
  if (/[a-zA-Z]{3,}/.test(output)) {
    checkPatterns(G004_ENGLISH_PATTERNS, "G004", "未确认预约邀请walk-in（英语）", "P0");
    checkPatterns(G006_ENGLISH_PATTERNS, "G006", "LLM确认付款/通知人工（英语）", "P0");

    if (role === "xiaoku") {
      checkPatternsNegationAware(G001_ENGLISH_PATTERNS, "G001", "小酷输出行政答案（英语）", "P0");
      checkPatternsNegationAware(G005_ENGLISH_PATTERNS, "G005", "LLM预留/确认时间（英语）", "P0");
    }
    if (role === "xiaoxue") {
      checkPatterns(G002_ENGLISH_PATTERNS, "G002", "小雪进行心理咨询式分析（英语）", "P0");
      checkPatternsNegationAware(G005_ENGLISH_PATTERNS, "G005", "LLM预留/确认时间（英语）", "P0");
    }
  }

  return {
    pass: p0Violations.length === 0,
    p0Violations,
    p1Violations,
    allViolations: [...p0Violations, ...p1Violations],
  };
}

// ============================================================
// 安全模板（重试仍违规时使用）
// ============================================================

export function getXiaokuSafetyTemplate(adminIntents?: AdminIntentType[]): string {
  const intentDesc = adminIntents && adminIntents.length > 0
    ? adminIntents.join("、")
    : "预约和行政";

  return (
    `你问到的${intentDesc}相关问题属于行政预约范畴，` +
    `我这边不直接回答行政信息，免得把费用、时间或到访安排说错。` +
    `请点「切换到小雪」，她是专门负责预约前协助的AI，会帮你把费用、流程和预约准备理清。` +
    `如果你之后想聊心理方面的事情，随时回来找我。`
  );
}

export function getXiaoxueSafetyTemplate(): string {
  return (
    `我可以帮您说明费用、流程、工作时间和地址，也可以帮您整理需求偏好。` +
    `涉及具体时间确认、预约、到访安排等需要人工客服确认后才算成立。` +
    `如果您想聊心理方面的感受，可以切换到小酷，他负责心理支持。` +
    `人工客服工作时间为 12:00-24:00，微信客服 。`
  );
}

// ============================================================
// 重试警告消息生成
// ============================================================

export function buildRetryWarning(
  role: AgentRole,
  violations: RoleViolation[],
): string {
  const lines = [
    "你的上一轮回复触发了角色治理越权检测（DECISION-ROLE-001 v14.0）。",
    "以下行为是严格禁止的：",
  ];

  for (const v of violations) {
    lines.push(`- [${v.ruleId}] ${v.description}（你说了"${v.matchedText}"）`);
  }

  if (role === "xiaoku") {
    lines.push("");
    lines.push("请重新生成回复，必须遵守：");
    lines.push("1. 不得回答任何费用、地址、工作时间、预约、心理师信息");
    lines.push("2. 用承接式话术引导用户切换到小雪");
    lines.push("3. 如果用户同时表达了情绪，先短承接1-2句再转行政");
    lines.push("4. 不能说'你去问小雪'这种生硬话术");
    lines.push("5. 不能邀请到店、预留时间、确认预约");
  } else {
    lines.push("");
    lines.push("请重新生成回复，必须遵守：");
    lines.push("1. 你是行政预约前置AI，不做心理分析、诊断、治疗建议");
    lines.push("2. 可以回答费用/流程/工作时间/地址等行政事实");
    lines.push("3. 不邀请未确认预约的到访");
    lines.push("4. 不预留/确认时间、不声称已通知人工、不确认付款");
    lines.push("5. 前台只做行政，不描述为提供心理咨询");
    lines.push("6. 完成AI能做的行政工作，不要只推人工");
  }

  return lines.join("\n");
}

// ============================================================
// 英语违规模式（补充覆盖英语AI输出）
// ============================================================

const G001_ENGLISH_PATTERNS: RegExp[] = [
  /(our|the)\s+(fee|price|cost|rate)\s+(is|are|:)\s*\$?\d+/i,
  /\$\d{2,4}\s*(per|\/)\s*(session|hour|visit)/i,
  /(we are|we're)\s+(located|based)\s+(at|in|on)\s+/i,
  /our address\s+(is|:)/i,
  /(we|the center)\s+(open|close)\s+(at|from)\s+\d/i,
  /(you can|feel free to|just)\s+(come|drop by|stop by|visit)/i,
  /(i've|i have)\s+(booked|reserved|scheduled|confirmed)/i,
  /(your appointment is|appointment confirmed|booking confirmed)/i,
  /(we have)\s+\d+\s+(therapists?|counselors?|psychologists?)/i,
];

const G002_ENGLISH_PATTERNS: RegExp[] = [
  /your\s+(depression|anxiety|trauma|PTSD|symptoms?)\s+(stems?|comes?|originates?|is\s+(rooted|caused)|likely\s+stems?)/i,
  /(you have|you're experiencing|this is)\s+(depression|anxiety|PTSD|bipolar|OCD|personality disorder|borderline|narcissistic|clinical depression|trauma)/i,
  /(I suggest|I recommend|you should|you need)\s+(long.?term|psychoanalysis|CBT|therapy|counseling|treatment)/i,
  /(let's|let us|we can|we will)\s+(explore|dive into|work through|process)\s+(your|the)\s+(childhood|trauma|past|deep|inner|unconscious)/i,
  /(this is|you're using|that's)\s+(projection|defense mechanism|transference|dissociation|denial|repression)/i,
  /(diagnos|symptoms?\s+(suggest|indicate|are consistent with)|clinical)/i,
];

const G005_ENGLISH_PATTERNS: RegExp[] = [
  /(I've|I have)\s+(booked|reserved|scheduled|confirmed|locked in)/i,
  /(your|the)\s+(slot|time|appointment)\s+(is\s+)?(booked|reserved|confirmed|locked|secured)/i,
  /\d{1,2}(:\d{2})?\s*(AM|PM|am|pm)?\s*(is\s+)?(reserved|booked|confirmed|locked)/i,
];

const G004_ENGLISH_PATTERNS: RegExp[] = [
  /(just|feel free to|you can|simply)\s+(come|drop by|stop by|walk in|visit us)/i,
  /(come|drop by|stop by)\s+(anytime|whenever|today|tomorrow)/i,
  /no\s+appointment\s+(needed|necessary)/i,
];

const G006_ENGLISH_PATTERNS: RegExp[] = [
  /(payment|you've paid|paid)\s+(confirmed|received|successful|processed)/i,
  /(I've|I have)\s+(notified|contacted|informed)\s+(customer service|staff|the team)/i,
  /(staff|customer service|someone)\s+(is\s+)?waiting/i,
];
