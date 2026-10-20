/**
 * 小雪完整性守卫 v13.2（hotfix）
 *
 * 流结束后检查 draft 是否通过 8 项完整性检查。
 * P0 失败（C001-C004, C006）触发重试；P1 失败仅记录。
 *
 * ===== 20260918 小雪P0热修说明（本文件即部署包，基于 _src_v3 快照 + 线上探针实锤） =====
 * 背景：线上 /api/xiaoxue 防火墙报 firewallReason=completion_retry_failed（4/4 探针实锤）：
 *   VALID_ENDINGS 写法错误 → has(lastChar) 恒 false → 正常长句全判 C001 → 重试再败
 *   → getSafetyTemplate() 兜底，行政杂问不匹配四分支 → 299 行倾听模板顶替/拼接。
 * 本次改动（共 4 处，均在本文件）：
 *   [F1] VALID_ENDINGS 改为正确单字符 Set（治本：让正常句通过 C001，重试不再触发）
 *   [F2] TRAILING_FRAGMENTS 追加 "我们的"（拦截残句拼接破损）
 *   [F3] C006 豁免放宽为 /人工客服[^。]{0,30}(联系|确认|添加|微信)/g（正常转人工话术不再误杀）
 *   [F4] getSafetyTemplate() 最终兜底改为行政转人工话术（删除倾听模板串台文案）
 * 未动：四分支模板（pricing/process/reassurance/clarification）、C001-C008 检查逻辑主体、
 *       route.ts、危机判定层、小酷侧任何文件。
 * 施工前提：先 diff 线上当前文件，若线上与本快照基线不一致，以线上为准重新定位（禁盲改）。
 */

import type { XiaoxuePlan } from "./xiaoxue-planner";

export type FailureId =
  | "C001"
  | "C002"
  | "C003"
  | "C004"
  | "C005"
  | "C006"
  | "C007"
  | "C008";

export interface CompletionResult {
  pass: boolean;
  failures: FailureId[];
  p0Failures: FailureId[];
  p1Failures: FailureId[];
}

const P0_CHECKS = new Set<FailureId>(["C001", "C002", "C003", "C004", "C006"]);

/** 残句结尾片段 */
const TRAILING_FRAGMENTS = [
  "我们的心理",
  "如果您是想预约",
  "下面",
  "以下是",
  "接下来",
  "然后",
  "比如",
  "例如",
  "以及",
  "还有",
  "我们的", // [F2] hotfix 20260918：拦截"我们的如果…"式残句拼接破损
];

/** [F1] hotfix 20260918：合法结尾字符（原写法把整串标点连引号逗号当成 2 个 Set 元素，恒 miss） */
const VALID_ENDINGS = new Set([
  "。",
  "？",
  "！",
  "」",
  "』",
  "）",
  ")",
  "]",
  "】",
  "”",
  "’",
  "～",
  "—",
  "…",
  ".",
  "?",
  "!",
]);

function isEmoji(ch: string): boolean {
  const cp = ch.codePointAt(0);
  if (cp === undefined) return false;
  return (
    (cp >= 0x1f600 && cp <= 0x1f64f) ||
    (cp >= 0x1f300 && cp <= 0x1f5ff) ||
    (cp >= 0x1f680 && cp <= 0x1f6ff) ||
    (cp >= 0x1f900 && cp <= 0x1f9ff) ||
    (cp >= 0x2600 && cp <= 0x26ff) ||
    (cp >= 0x2700 && cp <= 0x27bf)
  );
}

/** C001: 句子完整 */
function checkSentenceComplete(draft: string): boolean {
  const trimmed = draft.trim();
  if (trimmed.length === 0) return false;

  // 检查残句片段
  for (const frag of TRAILING_FRAGMENTS) {
    if (trimmed.endsWith(frag)) return false;
  }

  // 检查是否以冒号结尾（"：" 或 ":" 表示后面应有内容）
  const lastChar = trimmed[trimmed.length - 1];
  if (lastChar === "：" || lastChar === ":") return false;

  // 检查是否以逗号/顿号结尾
  if (lastChar === "，" || lastChar === "," || lastChar === "、") return false;

  // 检查是否以"的""了""和""与"等助词结尾（残句特征）
  if (trimmed.endsWith("的") && trimmed.length > 10) {
    // "我是小雪的" → 残句，但"这是应该的"这种短句可以接受
    // 简单启发：如果最后10字内有"是...的"完整句式则通过
    const tail = trimmed.slice(-15);
    if (!/是.{0,8}的$/.test(tail)) return false;
  }

  // 最后一个字符必须是合法结尾或emoji
  if (VALID_ENDINGS.has(lastChar) || isEmoji(lastChar)) return true;

  // 中文字符结尾但不是标点：可能是残句
  // 但允许"好的""嗯"等简短回复
  if (trimmed.length <= 10) return true;

  return false;
}

/** C002: Markdown闭合 */
function checkMarkdownBalanced(draft: string): boolean {
  // 粗体 **
  const boldCount = (draft.match(/\*\*/g) || []).length;
  if (boldCount % 2 !== 0) return false;

  // 代码块 ```
  const codeCount = (draft.match(/```/g) || []).length;
  if (codeCount % 2 !== 0) return false;

  // 行内代码 `
  const inlineCodeCount = (draft.match(/(?<!`)`(?!`)/g) || []).length;
  if (inlineCodeCount % 2 !== 0) return false;

  return true;
}

/** C003: 无尾残片 */
function checkNoTrailingFragment(draft: string): boolean {
  const trimmed = draft.trim();
  if (trimmed.length === 0) return false;

  // 检查最后几个字是否是半截词
  const tail = trimmed.slice(-6);

  // 如果以"心理师""咨询师"等完整词结尾则OK
  if (tail.endsWith("心理师") || tail.endsWith("心理咨询师")) return true;

  // 如果以"心理"结尾但不是"心理师"，是残片
  if (tail.endsWith("心理") && !tail.endsWith("心理师")) return false;

  // 如果以"预约"结尾但不是完整句式
  // 检查是否以单字动词结尾（残句特征）
  const lastChar = trimmed[trimmed.length - 1];
  if (/[\u4e00-\u9fa5]/.test(lastChar)) {
    // 中文字符结尾，检查是否是完整句式
    if (VALID_ENDINGS.has(trimmed[trimmed.length - 2] || "")) return true;
    // 简短回复允许
    if (trimmed.length <= 10) return true;
  }

  return true;
}

/** C004: 回答了用户问题 */
function checkAnsweredQuestion(draft: string, plan: XiaoxuePlan): boolean {
  if (!plan.mustAnswerDirectly) return true;

  const lower = draft.toLowerCase();

  if (plan.factQuery.includes("pricing")) {
    // 必须含数字/元/档
    if (!/\d{2,5}/.test(draft) && !/元/.test(draft) && !/档/.test(draft)) return false;
  }

  if (plan.factQuery.includes("process")) {
    // 必须含流程步骤
    if (!/步骤|流程|第一步|然后|接着|最后|→|->/.test(draft)) return false;
  }

  if (plan.factQuery.includes("hours")) {
    if (!/\d{1,2}[:：]\d{2}/.test(draft) && !/10:00|22:00|10点|22点/.test(draft)) return false;
  }

  if (plan.factQuery.includes("address")) {
    if (!/地址|路|号|上海|静安|民立/.test(draft)) return false;
  }

  if (plan.factQuery.includes("capabilities") || plan.userNeed === "clarification") {
    if (!/AI|预约|顾问|不能|无法|可以/.test(draft)) return false;
  }

  return true;
}

/** C005: 有前进动作 */
function checkHasForwardMove(draft: string, plan: XiaoxuePlan): boolean {
  // 纯结束意图（S6/human_required且已确认）不要求前进动作
  if (plan.handoff === "human_required" && plan.state === "S6") return true;

  // 检查是否包含问题/选择/进度说明/下一步
  const hasQuestion = /[？?]/.test(draft);
  const hasChoice = /或者|还是|要么|选择|可以.*也可以/.test(draft);
  const hasProgress = /下一步|接下来|目前|已经确认|还差|进度|整理|摘要/.test(draft);
  const hasNextStep = /可以|建议|不妨|试试|继续/.test(draft.slice(-50));

  return hasQuestion || hasChoice || hasProgress || hasNextStep;
}

/** C006: 无不必要转介 */
function checkNoUnnecessaryHandoff(draft: string, plan: XiaoxuePlan): boolean {
  if (plan.handoff !== "none") return true;

  // [F3] hotfix 20260918：豁免放宽——正常转人工话术（人工客服联系/确认/添加/微信）
  // 不再被误判为不必要转介；g 全局替换覆盖一处话术中多次出现。
  const summaryReadyPhrase = /人工客服[^。]{0,30}(联系|确认|添加|微信)/g;
  const withoutSummary = draft.replace(summaryReadyPhrase, "");

  // 检查是否包含不必要的转介
  const hasHandoff = /联系人工客服|找小酷|转小酷|转人工|找人工|客服确认/.test(withoutSummary);

  return !hasHandoff;
}

/** C007: 状态进度一致 */
function checkStateProgressConsistent(draft: string, plan: XiaoxuePlan): boolean {
  // S3 应该提到收集信息或进度
  if (plan.state === "S3") {
    // 如果 plan 有 progressMessage，draft 应体现进度
    if (plan.progressMessage) {
      // 宽松检查：不要求逐字匹配，但应有收集相关词汇
      return /困扰|方向|预算|形式|偏好|线上|线下|信息|还差|了解/.test(draft);
    }
  }
  // S5 应提到摘要或确认
  if (plan.state === "S5") {
    return /摘要|确认|提交|修改|整理/.test(draft);
  }
  return true;
}

/** C008: 不重复上一轮回答（简单共同词比例） */
function checkNoDuplicate(
  draft: string,
  previousResponse: string | undefined,
): boolean {
  if (!previousResponse || previousResponse.trim().length === 0) return true;

  // 简单分词：按标点和空格拆分，取2字以上片段
  const tokenize = (text: string): Set<string> => {
    const tokens = new Set<string>();
    // 提取2-4字中文片段
    const cleaned = text.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, " ");
    const words = cleaned.split(/\s+/).filter((w) => w.length >= 2);
    for (const w of words) {
      tokens.add(w);
      // 也加入bigram
      for (let i = 0; i < w.length - 1; i++) {
        tokens.add(w.slice(i, i + 2));
      }
    }
    return tokens;
  };

  const draftTokens = tokenize(draft);
  const prevTokens = tokenize(previousResponse);

  if (draftTokens.size === 0 || prevTokens.size === 0) return true;

  let overlap = 0;
  for (const t of draftTokens) {
    if (prevTokens.has(t)) overlap++;
  }

  const similarity = overlap / Math.min(draftTokens.size, prevTokens.size);
  return similarity <= 0.7;
}

/**
 * 主检查函数
 */
export function checkCompletion(
  draft: string,
  userMessage: string,
  plan: XiaoxuePlan,
  previousResponse?: string,
): CompletionResult {
  const failures: FailureId[] = [];

  if (!checkSentenceComplete(draft)) failures.push("C001");
  if (!checkMarkdownBalanced(draft)) failures.push("C002");
  if (!checkNoTrailingFragment(draft)) failures.push("C003");
  if (!checkAnsweredQuestion(draft, plan)) failures.push("C004");
  if (!checkHasForwardMove(draft, plan)) failures.push("C005");
  if (!checkNoUnnecessaryHandoff(draft, plan)) failures.push("C006");
  if (!checkStateProgressConsistent(draft, plan)) failures.push("C007");
  if (!checkNoDuplicate(draft, previousResponse)) failures.push("C008");

  const p0Failures = failures.filter((f) => P0_CHECKS.has(f));
  const p1Failures = failures.filter((f) => !P0_CHECKS.has(f));

  return {
    pass: failures.length === 0,
    failures,
    p0Failures,
    p1Failures,
  };
}

/**
 * P0 失败时的确定性安全模板
 */
export function getSafetyTemplate(plan: XiaoxuePlan): string {
  if (plan.factQuery.includes("pricing")) {
    return "QM 的心理师费用按资历分级，从入门到资深分为不同档位，具体价格会根据心理师级别和服务形式有所不同。详细的价格表已经提供给我了，我可以为您具体说明。您方便告诉我大概的预算范围吗？我可以帮您看看适合的方向。";
  }
  if (plan.factQuery.includes("process")) {
    return "预约流程很简单：第一步，您告诉我想处理的困扰方向和偏好（线上或线下、预算范围等）；第二步，我帮您整理成预约摘要；第三步，人工客服会在工作时间12:00-24:00联系您确认具体档期。您现在想从哪一步开始？";
  }
  if (plan.userNeed === "reassurance") {
    return "我理解您现在的感受。您不用急着做决定，也不用把所有情况一次说清。我可以先帮您梳理一下预约前需要了解的信息，您觉得方便聊哪部分都可以。";
  }
  if (plan.userNeed === "clarification") {
    return "我是AI预约前置顾问小雪。我可以在这里和您连续对话、理解您前面说过的内容、解释费用和流程、帮您梳理需求并整理预约摘要；但我不能实时查看心理师档期、不能替人工确认预约，也不是心理师。有什么我可以帮您了解的吗？";
  }
  // [F4] hotfix 20260918：最终兜底改为行政转人工话术。
  // 原倾听模板（"我在听。你刚才说的这些…你最想先聊哪部分？"）属小酷式多轮文案，
  // 在小雪单轮/行政场景串台（P0），永久移除。
  return "这个问题我帮你转人工客服确认（微信，12:00-24:00），他们能给你准确答复。还有什么我能帮你看的？";
}
