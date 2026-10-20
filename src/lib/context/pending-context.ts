/**
 * 跨模块上下文桥（pending context bridge）v1.0
 *
 * 各模块（心理测试 / 知识 / 工具 / 树洞）在「带结果 / 问问题 / 继续聊聊」时，
 * 把一段人话摘要写入本地存储（不经过 URL，避免敏感数据暴露）；
 * 小酷桌面对话在下一条消息读取摘要，收到完整回复后确认并清除；
 * 其他旧入口仍可能在发送时消费，不能把桌面修复扩大为全站已完成。
 *
 * 契约见 src/lib/cross-flow/cross-flow-registry.ts。
 */

export type PendingContextSource = "assessment" | "knowledge" | "tool" | "treehole" | "therapist";

export interface PendingContext {
  source: PendingContextSource;
  schemaVersion?: "1.0";
  /** 小酷可直接阅读的人话摘要（限制长度，防止污染上下文） */
  summary: string;
  /** 结构化信息（可选，不允许包含敏感原始文本） */
  payload?: Record<string, unknown>;
  createdAt?: string;
}

const STORAGE_KEY = "qm_pending_xiaoku_context_v1";
const MAX_SUMMARY = 1000;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/** 写入待消费的跨模块上下文（覆盖旧的，单实例桥） */
export function savePendingContext(ctx: PendingContext): void {
  if (!isBrowser()) return;
  try {
    const normalized: PendingContext = {
      source: ctx.source,
      schemaVersion: "1.0",
      summary: String(ctx.summary || "").slice(0, MAX_SUMMARY),
      payload: ctx.payload ?? undefined,
      createdAt: ctx.createdAt || new Date().toISOString(),
    };
    if (!normalized.summary.trim()) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    // 存储不可用则不阻塞跳转
  }
}

/** 只读取不清除（供注册表/调试） */
export function peekPendingContext(): PendingContext | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingContext;
    if (!parsed || typeof parsed.summary !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

/** 一次性消费并清除（小酷下一条消息时调用） */
export function consumePendingContext(): PendingContext | null {
  const ctx = peekPendingContext();
  if (ctx) {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
  return ctx;
}

/** 只确认本次成功使用的摘要；请求期间新写入的摘要留给下一条消息。 */
export function acknowledgePendingContext(expected: PendingContext): boolean {
  if (!isBrowser()) return false;
  try {
    const current = peekPendingContext();
    if (!current || current.source !== expected.source ||
        current.createdAt !== expected.createdAt ||
        current.summary !== expected.summary) return false;
    window.localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

/**
 * 各跨模块入口统一跳转：先落盘 pending 上下文，再整页跳转主页小酷。
 * 整页跳转（非 Link/router 客户端导航）保证消费端全新挂载；
 * 存储失败时仍跳转，但不能声称摘要已送达。
 */
export function goChatWithContext(ctx: PendingContext): void {
  savePendingContext(ctx);
  if (isBrowser()) {
    window.location.assign("/chat");
  }
}
