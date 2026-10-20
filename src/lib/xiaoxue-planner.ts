/**
 * 小雪回复规划器 v13.1
 *
 * 每轮对话前调用，产出本轮对话计划，注入 system prompt。
 * 硬规则见 XiaoxuePlan 文档。
 */

import type { XiaoxueState, XiaoxueSessionState } from "./xiaoxue-state";

export type UserNeed =
  | "reassurance"
  | "information"
  | "orientation"
  | "exploration"
  | "booking_prepare"
  | "clarification";

export type Move =
  | "acknowledge"
  | "empathize_lightly"
  | "answer"
  | "contextualize"
  | "progress_update"
  | "ask_one_question"
  | "give_choice"
  | "summarize";

export type Handoff = "none" | "xiaoku_offer" | "human_required";

export type FactQuery = "pricing" | "process" | "hours" | "address" | "services" | "capabilities";

export interface XiaoxuePlan {
  state: XiaoxueState;
  userNeed: UserNeed;
  primaryGoal: string;
  moves: Move[];
  handoff: Handoff;
  mustAnswerDirectly: boolean;
  progressMessage: string | null;
  factQuery: FactQuery[];
}

export interface PlanParams {
  userMessage: string;
  state: XiaoxueSessionState;
  previousResponse?: string;
  assistantHistory: string[];
}

const PRICING_RE = /费用|价格|多少钱|收费|怎么收费|贵不贵|价位|预算|次卡|退费|退款|打折|优惠/;
const PROCESS_RE = /流程|怎么预约|怎么走|如何预约|预约步骤|预约流程/;
const HOURS_RE = /几点|营业时间|工作时间|什么时候|开门|下班/;
const ADDRESS_RE = /地址|在哪里|哪儿|哪个位置|怎么去/;
const SERVICES_RE = /有什么服务|服务内容|能做什么|提供什么|服务项目/;
const CAPABILITIES_RE = /你能做什么|你会什么|你是什么|你是AI|你到底是什么|是不是AI|机器人/;

const EMOTION_RE = /焦虑|难受|犹豫|害怕|担心|紧张|压力|低落|抑郁|困扰|痛苦|迷茫|不安|烦躁|崩溃|想哭|害怕|恐惧|心碎|难过|伤心/;
const XIAOKU_REQUEST_RE = /找小酷|想找小酷|想聊情绪|找人陪我聊|想找人聊|想倾诉|想找人说话|陪我聊|情绪陪伴/;
const HUMAN_REQUEST_RE = /真人|人工客服|找人工|要人工|接人工|转人工|实时档期|有没有档期|约几点|锁定|确认预约|确认提交|提交给人工/;

function detectFacts(msg: string): FactQuery[] {
  const facts: FactQuery[] = [];
  if (PRICING_RE.test(msg)) facts.push("pricing");
  if (PROCESS_RE.test(msg)) facts.push("process");
  if (HOURS_RE.test(msg)) facts.push("hours");
  if (ADDRESS_RE.test(msg)) facts.push("address");
  if (SERVICES_RE.test(msg)) facts.push("services");
  if (CAPABILITIES_RE.test(msg)) facts.push("capabilities");
  return facts;
}

function isClarification(msg: string): boolean {
  return /你是AI|你到底是什么|你是不是AI|你是机器人|你是谁|你是什么|你能做什么|你会不会|你是真人吗/.test(msg);
}

function wantsBooking(msg: string): boolean {
  return /开始预约|我想预约|我要预约|帮我预约|预约心理师|现在预约|直接预约|我想约|准备预约/.test(msg);
}

function isExploring(msg: string): boolean {
  return /困扰|想解决|不知道怎么办|想了解自己|为什么我|总是|一直以来|想不通/.test(msg);
}

/**
 * 主规划函数
 */
export function planXiaoxueResponse(params: PlanParams): XiaoxuePlan {
  const { userMessage, state, previousResponse, assistantHistory } = params;
  const msg = userMessage.trim();
  const facts = detectFacts(msg);
  const hasFactQuestion = facts.length > 0;
  const hasEmotion = EMOTION_RE.test(msg);
  const asksXiaoku = XIAOKU_REQUEST_RE.test(msg);
  const asksHuman = HUMAN_REQUEST_RE.test(msg);
  const asksClarify = isClarification(msg);
  const wantsBook = wantsBooking(msg);
  const exploring = isExploring(msg);

  // ---- handoff 决策（硬规则）----
  let handoff: Handoff = "none";
  if (asksXiaoku) handoff = "xiaoku_offer";
  else if (asksHuman) handoff = "human_required";

  // ---- userNeed 决策 ----
  let userNeed: UserNeed;
  if (asksClarify) {
    userNeed = "clarification";
  } else if (hasEmotion && !hasFactQuestion && !wantsBook) {
    userNeed = "reassurance";
  } else if (hasFactQuestion) {
    userNeed = "information";
  } else if (wantsBook || state.state === "S3" || state.state === "S4") {
    userNeed = "booking_prepare";
  } else if (exploring || hasEmotion) {
    userNeed = "exploration";
  } else if (state.state === "S0") {
    userNeed = "orientation";
  } else {
    userNeed = "orientation";
  }

  // ---- primaryGoal ----
  let primaryGoal: string;
  if (asksClarify) primaryGoal = "明确AI能力与边界";
  else if (facts.includes("pricing")) primaryGoal = "完整回答费用";
  else if (facts.includes("process")) primaryGoal = "完整回答预约流程";
  else if (facts.includes("hours")) primaryGoal = "回答工作时间";
  else if (facts.includes("address")) primaryGoal = "回答地址";
  else if (facts.includes("services")) primaryGoal = "介绍服务内容";
  else if (hasEmotion && handoff === "none") primaryGoal = "轻承接情绪并回到预约准备";
  else if (wantsBook) primaryGoal = "开始收集预约必要信息";
  else if (state.state === "S3") primaryGoal = "收集缺失的必要字段";
  else if (state.state === "S4") primaryGoal = "生成预约摘要";
  else if (state.state === "S5") primaryGoal = "等待用户确认摘要";
  else primaryGoal = "了解用户需求方向";

  // ---- moves（2-4个）----
  const moves: Move[] = [];

  // 承接
  if (hasEmotion) {
    moves.push("empathize_lightly");
  } else {
    moves.push("acknowledge");
  }

  // 解决
  if (hasFactQuestion) {
    moves.push("answer");
  } else if (asksClarify) {
    moves.push("answer");
  } else if (wantsBook || state.state === "S3") {
    moves.push("progress_update");
  } else if (state.state === "S4") {
    moves.push("summarize");
  } else if (hasEmotion) {
    moves.push("contextualize");
  } else {
    moves.push("answer");
  }

  // 前进
  if (handoff === "none") {
    if (state.state === "S3") {
      moves.push("ask_one_question");
    } else if (state.state === "S5") {
      moves.push("give_choice");
    } else if (wantsBook) {
      moves.push("ask_one_question");
    } else if (!hasFactQuestion && !asksClarify) {
      // 纯事实/澄清问题不需要强行推进
      if (moves.length < 3) moves.push("progress_update");
    }
  } else {
    // 有 handoff 时给选择
    moves.push("give_choice");
  }

  // ---- mustAnswerDirectly ----
  let mustAnswerDirectly = false;
  if (hasFactQuestion) mustAnswerDirectly = true;
  if (asksClarify) mustAnswerDirectly = true;
  // "介绍一下" 如果上一轮在聊费用/流程
  if (/介绍一下|讲讲|说说/.test(msg) && previousResponse) {
    if (/费用|价格|多少钱/.test(previousResponse)) {
      mustAnswerDirectly = true;
      if (!facts.includes("pricing")) facts.push("pricing");
    }
    if (/流程|怎么预约/.test(previousResponse)) {
      mustAnswerDirectly = true;
      if (!facts.includes("process")) facts.push("process");
    }
  }

  // ---- progressMessage ----
  let progressMessage: string | null = null;
  const collected = state.collectedFields;
  const fieldLabels: Record<string, string> = {
    primary_goal: "困扰方向",
    budget_range: "预算范围",
    service_mode: "形式偏好",
    time_pref: "时间偏好",
  };
  const gotFields = Object.keys(collected).filter((k) => collected[k] && fieldLabels[k]);
  const missingFields = ["primary_goal", "service_mode"].filter((f) => !collected[f]);

  if (state.state === "S3" && missingFields.length > 0) {
    progressMessage = `已了解：${gotFields.map((f) => fieldLabels[f]).join("、") || "暂无"}；还差：${missingFields.map((f) => fieldLabels[f]).join("、")}`;
  } else if (state.state === "S4") {
    progressMessage = "必要信息已齐全，可以生成摘要";
  } else if (state.state === "S5") {
    progressMessage = "摘要已生成，等待确认";
  }

  return {
    state: state.state,
    userNeed,
    primaryGoal,
    moves: moves.slice(0, 4),
    handoff,
    mustAnswerDirectly,
    progressMessage,
    factQuery: facts,
  };
}

/**
 * 将 plan 格式化为 XML 块注入 system prompt
 */
export function formatPlanForPrompt(plan: XiaoxuePlan): string {
  const lines = [
    "<dialogue_plan>", `  <state>${plan.state}</state>`, `  <user_need>${plan.userNeed}</user_need>`, `  <primary_goal>${plan.primaryGoal}</primary_goal>`, `  <moves>${plan.moves.join(", ")}</moves>`, `  <handoff>${plan.handoff}</handoff>`, `  <must_answer_directly>${plan.mustAnswerDirectly}</must_answer_directly>`, `  <progress_message>${plan.progressMessage || "无"}</progress_message>`, `  <fact_query>${plan.factQuery.length > 0 ? plan.factQuery.join(", ") : "无"}</fact_query>`,
    "</dialogue_plan>",
  ];
  return lines.join("\n");
}
