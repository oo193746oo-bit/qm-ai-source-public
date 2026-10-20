/**
 * 服务端树洞上下文消毒器 v13.2
 *
 * 职责：
 * 1. sanitizeTreeholeContext — 校验并截断客户端传来的树洞数据
 * 2. shouldInjectTreehole — 判断当前对话是否需要注入树洞上下文
 * 3. formatTreeholeContext — 格式化为 system prompt XML 块
 *
 * 隐私：树洞数据绝对不注入小雪API，不进入资源检索/案例RAG。
 */

import type { TreeholeClientContext, TreeholeEntry } from "./treehole-context-client";

const MAX_ENTRIES = 8;
const MAX_ENTRY_CHARS = 1200;
const MAX_TOTAL_CHARS = 6000;

export interface SanitizedTreeholeContext {
  source: "treehole";
  available: boolean;
  entries: TreeholeEntry[];
}

/**
 * 消毒：校验 entries 数组，每条 content 截断 1200 字，总计不超过 6000 字，最多 8 条
 */
export function sanitizeTreeholeContext(
  input: TreeholeClientContext | undefined | null,
): SanitizedTreeholeContext {
  const rawEntries = Array.isArray(input?.entries) ? input!.entries : [];
  let total = 0;
  const entries: TreeholeEntry[] = [];

  for (const raw of rawEntries.slice(0, MAX_ENTRIES)) {
    const content = String(raw?.content ?? "").trim().slice(0, MAX_ENTRY_CHARS);
    if (!content) continue;
    if (total + content.length > MAX_TOTAL_CHARS) continue;

    total += content.length;
    entries.push({
      id: String(raw?.id ?? ""),
      date: String(raw?.date ?? ""),
      question: raw?.question ? String(raw.question).slice(0, 300) : undefined,
      content,
      source: raw?.source === "diary" ? "diary" : "answer",
    });
  }

  return {
    source: "treehole",
    available: entries.length > 0,
    entries,
  };
}

/**
 * 关键词触发：判断当前对话是否需要注入树洞上下文
 * 匹配用户消息和最近对话中的关键词
 */
export function shouldInjectTreehole(
  userMessage: string,
  recentConversation = "",
): boolean {
  const combined = `${recentConversation}\n${userMessage}`;
  return /日记|日記|树洞|樹洞|我写的|我寫的|记录|記錄|这几天|這幾天|你看到|你看了|你没看|你沒看/.test(
    combined,
  );
}

/**
 * 格式化为 system prompt XML 块
 */
export function formatTreeholeContext(ctx: SanitizedTreeholeContext): string {
  if (!ctx.available || ctx.entries.length === 0) return "";

  const body = ctx.entries
    .map((e) => {
      const parts = [`- 日期：${e.date || "未标注"}`];
      if (e.question) parts.push(`  题目：${e.question}`);
      parts.push(`  内容：${e.content}`);
      parts.push(`  来源：${e.source === "diary" ? "自由日记" : "每日回答"}`);
      return parts.join("\n");
    })
    .join("\n\n");

  return `<user_private_context type="treehole" visibility="xiaoku_only">
${body}
</user_private_context>`;
}
