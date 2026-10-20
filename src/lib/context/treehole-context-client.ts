/**
 * 旧聊天桥的兼容外形。
 *
 * 旧实现会直接读取 qm_treehole_records 中的日记原文/回答并随每条聊天请求
 * 发送；它没有逐次原文授权，也绕开了已批准的“默认只共享摘要”边界。
 * 在脑线确认摘要的来源、同意与服务端消费合同前，必须保持空上下文。
 * 用户主动从其他模块带来的摘要仍走独立 pending-context 桥。
 */
export interface TreeholeEntry {
  id: string;
  date: string;
  question?: string;
  content: string;
  source: "answer" | "diary";
}

export interface TreeholeClientContext {
  source: "treehole";
  schemaVersion: "1.0";
  entries: TreeholeEntry[];
  readAt: string;
}

/** 不再从原始树洞记录生成隐式聊天上下文。 */
export function readRecentTreeholeContext(
  _days = 7,
  _maxEntries = 8,
): TreeholeClientContext {
  return {
    source: "treehole",
    schemaVersion: "1.0",
    entries: [],
    readAt: new Date().toISOString(),
  };
}
