/**
 * 行政状态机 v13.3
 *
 * A0 普通对话
 * A1 信息说明（工作时间/地址属于A1，不代表到访许可）
 * A2 偏好已记录（用户说了时间偏好，但未确认）
 * A3 待人工确认（已整理需求，等待真实人工确认）
 * A4 已由真实人工/确定性系统确认（LLM永远不能自行进入）
 *
 * LLM只能推进 A0→A1→A2→A3，永远不能 A3→A4。
 * 只有 verified_human_confirmation_event 才能进入A4。
 */

export type AdminState = "A0" | "A1" | "A2" | "A3" | "A4";

export const ADMIN_STATE_LABELS: Record<AdminState, string> = {
  A0: "普通对话",
  A1: "信息说明",
  A2: "偏好已记录",
  A3: "待人工确认",
  A4: "已由真实人工/确定性系统确认",
};

/** LLM可以推进的状态转移 */
const LLM_ALLOWED_TRANSITIONS: ReadonlySet<string> = new Set([
  "A0->A1", // 普通对话 → 说明事实
  "A0->A2", // 普通对话 → 直接记录偏好
  "A1->A2", // 信息说明 → 记录偏好
  "A1->A3", // 信息说明 → 待人工确认（用户表达到访意向）
  "A2->A3", // 偏好已记录 → 待人工确认（整理完需求）
  "A0->A3", // 普通对话 → 直接待确认
  "A2->A1", // 偏好已记录 → 回退到信息说明
  "A3->A2", // 待确认 → 回退到偏好记录（用户修改偏好）
  "A3->A1", // 待确认 → 回退到信息说明
  "A1->A0", // 信息说明 → 回退普通对话
  "A2->A0", // 偏好已记录 → 回退普通对话
]);

/** A3→A4 是禁止的，只有 verified_human_confirmation_event 才能进入 */
const HUMAN_ONLY_TRANSITIONS: ReadonlySet<string> = new Set([
  "A3->A4",
]);

export interface StateTransitionResult {
  allowed: boolean;
  from: AdminState;
  to: AdminState;
  reason: string;
  /** 标记是否需要真实人工确认事件 */
  requiresHumanConfirmation: boolean;
}

/**
 * 检查LLM是否可以推进行政状态。
 *
 * 关键安全规则：
 * - LLM永远不能 A3→A4
 * - 只有 verified_human_confirmation_event 才能进入A4
 * - 工作时间/地址属于A1，不代表到访许可
 */
export function canAdvance(
  from: AdminState,
  to: AdminState,
  options?: { isVerifiedHumanConfirmation?: boolean },
): StateTransitionResult {
  const key = `${from}->${to}`;

  // 相同状态，允许
  if (from === to) {
    return {
      allowed: true,
      from,
      to,
      reason: "状态未变化",
      requiresHumanConfirmation: false,
    };
  }

  // A3→A4：只有真实人工确认才能推进
  if (HUMAN_ONLY_TRANSITIONS.has(key)) {
    if (options?.isVerifiedHumanConfirmation) {
      return {
        allowed: true,
        from,
        to,
        reason: "已收到verified_human_confirmation_event，进入已确认状态",
        requiresHumanConfirmation: false,
      };
    }
    return {
      allowed: false,
      from,
      to,
      reason:
        "LLM不能自行推进A3→A4。只有verified_human_confirmation_event（真实人工/确定性系统确认）才能进入A4。",
      requiresHumanConfirmation: true,
    };
  }

  // 任何目标为A4的转移，如果不是从A3来的，也是非法的
  if (to === "A4") {
    return {
      allowed: false,
      from,
      to,
      reason: "A4只能通过A3 + verified_human_confirmation_event进入",
      requiresHumanConfirmation: true,
    };
  }

  // 检查LLM允许的转移
  if (LLM_ALLOWED_TRANSITIONS.has(key)) {
    return {
      allowed: true,
      from,
      to,
      reason: `LLM可推进 ${from}→${to}`,
      requiresHumanConfirmation: false,
    };
  }

  // A4是终态，不能从A4转到其他状态（除非有明确的重置逻辑）
  if (from === "A4") {
    return {
      allowed: false,
      from,
      to,
      reason: "A4是终态，需要明确的重置事件才能离开",
      requiresHumanConfirmation: false,
    };
  }

  // 其他未明确允许的转移，默认拒绝
  return {
    allowed: false,
    from,
    to,
    reason: `未授权的状态转移 ${from}→${to}`,
    requiresHumanConfirmation: false,
  };
}

/**
 * 根据用户消息和当前状态，推断下一个行政状态。
 * 这是LLM可以做的最大推进——永远不会推进到A4。
 */
export function suggestNextState(
  current: AdminState,
  userIntent: {
    hasFactQuery?: boolean;
    hasPreference?: boolean;
    hasVisitIntent?: boolean;
    hasBookingRequest?: boolean;
  },
): AdminState {
  const { hasFactQuery, hasPreference, hasVisitIntent, hasBookingRequest } =
    userIntent;

  // 如果有到访意向或预约请求，最多推进到A3
  if (hasVisitIntent || hasBookingRequest) {
    if (current === "A0" || current === "A1" || current === "A2") {
      return "A3";
    }
    if (current === "A3") return "A3"; // 已经在待确认，保持
  }

  // 如果有偏好记录，推进到A2
  if (hasPreference) {
    if (current === "A0" || current === "A1") {
      return "A2";
    }
  }

  // 如果有事实查询，推进到A1
  if (hasFactQuery) {
    if (current === "A0") {
      return "A1";
    }
  }

  // 默认保持当前状态
  return current;
}

/**
 * verified_human_confirmation_event 处理器。
 * 这是唯一能把状态推进到A4的函数。
 *
 * 在真实系统中，这个事件应该来自：
 * - 人工客服点击"确认"按钮
 * - 确定性系统（如预约系统API返回confirmed=true）
 * - 绝不能来自LLM文本
 */
export function applyHumanConfirmation(
  current: AdminState,
  event: {
    source: "human_agent" | "deterministic_system";
    confirmedBy?: string;
    confirmationId?: string;
    timestamp?: string;
  },
): StateTransitionResult {
  if (current !== "A3") {
    return {
      allowed: false,
      from: current,
      to: "A4",
      reason: `只有A3状态可以接收人工确认，当前状态为${current}`,
      requiresHumanConfirmation: false,
    };
  }

  if (event.source !== "human_agent" && event.source !== "deterministic_system") {
    return {
      allowed: false,
      from: current,
      to: "A4",
      reason: "确认事件来源必须是human_agent或deterministic_system",
      requiresHumanConfirmation: true,
    };
  }

  return {
    allowed: true,
    from: current,
    to: "A4",
    reason: `已收到来自${event.source}的确认${event.confirmedBy ? `（${event.confirmedBy}）` : ""}`,
    requiresHumanConfirmation: false,
  };
}

/**
 * 判断当前状态是否允许表述"已确认"。
 * 只有A4才允许，其他状态必须使用"待确认"措辞。
 */
export function canStateConfirmed(state: AdminState): boolean {
  return state === "A4";
}

/**
 * 获取当前状态下应使用的确认状态措辞。
 */
export function getConfirmationWording(state: AdminState): string {
  switch (state) {
    case "A0":
      return "尚未涉及预约";
    case "A1":
      return "仅提供信息，未涉及预约确认";
    case "A2":
      return "已记录偏好，尚未确认";
    case "A3":
      return "待人工确认";
    case "A4":
      return "已由人工确认";
  }
}
