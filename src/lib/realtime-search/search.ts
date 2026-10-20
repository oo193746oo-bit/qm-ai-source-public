import { detectPromptInjection } from "@/lib/internal-firewall";
import type { RealtimeSearchResult, RealtimeSearchResponse, RealtimeSourceKind, SearchOptions } from "./types";
import { buildSecondaryQuery, classifyReliability, needsSecondarySearch, verifySearchResults } from "./verify";

const DEFAULT_PLUGIN_ID = "7516843396187766818"; // Coze 官方：火山联网问答插件
const DEFAULT_TOOL_NAME = "search_sync";
const SEARCH_TIMEOUT_MS = 10000; // 整轮 primary + 必要时 secondary 共用 10 秒预算（P18-3: 从 5s 增加到 10s，避免天气插件超时）
const MAX_RESULTS = 5;
const MAX_RESULT_TEXT = 2000;

function sourceKind(text: string): RealtimeSourceKind {
  if (/(?:网友|网民|评论区|社交平台讨论|熱議|热议)/i.test(text)) return "reaction";
  if (/(?:爆料|网传|網傳|传闻|傳聞|疑似|据悉|據悉|知情人士|曝料|被曝|消息人士)/i.test(text)) return "claim";
  return "reported";
}

function safeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "unknown";
  }
}

function cleanText(text: string, limit = 420): string {
  return text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, limit);
}

function containsInjection(text: string): boolean {
  if (!text) return false;
  if (/(?:ignore\s+(?:all\s+)?previous\s+instructions|system\s+prompt|developer\s+message|override\s+instructions|忽略(?:以上|之前|先前)(?:所有)?(?:指令|规则|規則)|输出系统提示|輸出系統提示)/i.test(text)) return true;
  try {
    return Boolean(detectPromptInjection(text));
  } catch {
    return true;
  }
}

function unwrapPluginResult(payload: any): any {
  return payload?.data?.result ?? payload?.result ?? payload;
}

function getReferences(result: any): any[] {
  const candidates = [result?.data?.references, result?.references, result?.data?.data?.references];
  for (const value of candidates) if (Array.isArray(value)) return value;
  return [];
}

function getSummary(result: any): string {
  const candidates = [
    result?.data?.choices?.[0]?.message?.content,
    result?.choices?.[0]?.message?.content,
    result?.data?.data?.choices?.[0]?.message?.content,
    result?.sse_data,
  ];
  for (const value of candidates) {
    const text = safeString(value);
    if (text) return cleanText(text, 650);
  }
  return "";
}

function normalizeReference(ref: any, sharedSummary: string): RealtimeSearchResult | null {
  const url = safeString(ref?.url || ref?.link);
  const title = cleanText(safeString(ref?.title || ref?.name || url), 180);
  if (!url || !title) return null;

  const siteName = cleanText(safeString(ref?.site_name || ref?.source || ref?.siteName), 80) || hostname(url);
  const publishedAt = safeString(ref?.published_at || ref?.publish_time || ref?.publishedAt || ref?.date) || undefined;
  const snippet = cleanText(safeString(ref?.summary || ref?.snippet || ref?.content || ref?.description) || sharedSummary, 420);
  const safetyText = `${title}\n${siteName}\n${snippet}`;
  if (containsInjection(safetyText)) return null;
  if (/(?:seo agency|buy backlinks|博彩|色情|成人内容|成人內容)/i.test(safetyText)) return null;

  return {
    title,
    url,
    source: siteName,
    publishedAt,
    snippet,
    sourceKind: sourceKind(safetyText),
    reliability: classifyReliability(url, siteName),
  };
}

function dedupe(results: RealtimeSearchResult[]): RealtimeSearchResult[] {
  const seenUrl = new Set<string>();
  const seenTitle = new Set<string>();
  const domainCount = new Map<string, number>();
  const out: RealtimeSearchResult[] = [];

  for (const item of results) {
    const normalizedUrl = item.url.replace(/[?#].*$/, "").replace(/\/$/, "");
    const normalizedTitle = item.title.toLowerCase().replace(/\s+/g, "").slice(0, 80);
    const domain = hostname(item.url);
    if (seenUrl.has(normalizedUrl) || seenTitle.has(normalizedTitle)) continue;
    if ((domainCount.get(domain) || 0) >= 2) continue;
    seenUrl.add(normalizedUrl);
    seenTitle.add(normalizedTitle);
    domainCount.set(domain, (domainCount.get(domain) || 0) + 1);
    out.push(item);
  }
  return out;
}

function enforceTextBudget(results: RealtimeSearchResult[]): RealtimeSearchResult[] {
  let used = 0;
  const out: RealtimeSearchResult[] = [];
  for (const item of results) {
    const cost = item.title.length + item.source.length + item.url.length + item.snippet.length + 70;
    if (out.length >= 3 && used + cost > MAX_RESULT_TEXT) break;
    if (used + cost > MAX_RESULT_TEXT && out.length > 0) break;
    out.push(item);
    used += cost;
    if (out.length >= MAX_RESULTS) break;
  }
  return out;
}

function knowledgeInstruction(intent: SearchOptions["intent"]): string {
  if (intent === "weather") {
    return "这是天气实时查询。优先官方气象机构、权威天气服务和最近更新时间；核对地点和时间窗口。区分观测、预报、预警。不要用旧天气冒充当前天气；若地点/时间不一致视为错误命中。";
  }
  if (intent === "traffic") {
    return "这是交通实时查询。优先交通管理部门、公共交通运营方、机场/铁路官方和高时效路况；核对城市、线路/道路、方向和更新时间。不要用历史路况或其他同名地点冒充当前状态。";
  }
  return "优先当前或近期公开信息。先核对人物/机构/地点是否同一实体，再核对事件发生时间；区分已确认报道、单方说法、网友讨论。若同名、旧闻翻炒、来源冲突或无法核实时不要下确定结论。";
}

async function callPlugin(
  query: string,
  token: string,
  pluginId: string,
  toolName: string,
  signal: AbortSignal,
  options: SearchOptions,
): Promise<{ results: RealtimeSearchResult[]; summary: string }> {
  const response = await fetch(`https://api.coze.cn/v1/plugins/${encodeURIComponent(pluginId)}/tools/call`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      tool_name: toolName,
      arguments: {
        content: query,
      },
    }),
    signal,
  });

  if (!response.ok) throw new Error(`Coze plugin HTTP ${response.status}`);
  const payload = await response.json();
  if (typeof payload?.code === "number" && payload.code !== 0) {
    throw new Error(`Coze plugin code=${payload.code}: ${safeString(payload?.msg).slice(0, 160)}`);
  }

  const result = unwrapPluginResult(payload);
  const summary = getSummary(result);
  if (summary && containsInjection(summary)) throw new Error("Coze search summary rejected by prompt-injection filter");

  const results = getReferences(result)
    .map((ref) => normalizeReference(ref, summary))
    .filter((item): item is RealtimeSearchResult => Boolean(item));
  return { results, summary };
}

export async function searchRealtime(query: string, options: SearchOptions = {}): Promise<RealtimeSearchResponse> {
  const token = process.env.REALTIME_SEARCH_TOKEN?.trim();
  const pluginId = process.env.COZE_REALTIME_PLUGIN_ID?.trim() || DEFAULT_PLUGIN_ID;
  const toolName = process.env.COZE_REALTIME_TOOL_NAME?.trim() || DEFAULT_TOOL_NAME;
  const searchedAt = new Date().toISOString();

  if (!token) {
    console.error("[QM:XIAOKU] realtime search unavailable: REALTIME_SEARCH_TOKEN missing");
    const empty = verifySearchResults([], query, options, false);
    return { results: [], provider: "coze-volcengine-internet-search", searchedAt, verification: empty.verification };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);
  try {
    const primary = await callPlugin(query, token, pluginId, toolName, controller.signal, options);
    let combined = dedupe(primary.results);
    let checked = verifySearchResults(combined, query, options, false);
    let summary = primary.summary;
    let secondarySearchUsed = false;

    // Anti-Hallucination：结果过少、疑似实体错配、只有单一独立来源时，自动做一次“核实型”二次检索。
    // 与 primary 共用 5 秒总预算；超时/失败不影响主链路。
    if (needsSecondarySearch(checked.verification, checked.results.length) && !controller.signal.aborted) {
      try {
        const secondaryQuery = buildSecondaryQuery(query, options.intent || "general_realtime");
        const secondary = await callPlugin(secondaryQuery, token, pluginId, toolName, controller.signal, options);
        combined = dedupe([...combined, ...secondary.results]);
        secondarySearchUsed = true;
        checked = verifySearchResults(combined, query, options, true);
        if (!summary) summary = secondary.summary;
      } catch (secondaryError) {
        console.info("[QM:XIAOKU] realtime verification secondary search skipped/failed", {
          reason: secondaryError instanceof Error ? secondaryError.message.slice(0, 120) : "unknown",
        });
      }
    }

    // 只注入经过实体/主题相关性筛选后的结果；freshness 不通过时直接降为空证据。
    const safeResults = checked.verification.confidence === "insufficient"
      ? []
      : enforceTextBudget(checked.results);

    const finalVerification = safeResults.length === 0 && checked.verification.confidence !== "insufficient"
      ? verifySearchResults([], query, options, secondarySearchUsed).verification
      : { ...checked.verification, secondarySearchUsed };

    return {
      results: safeResults,
      summary: safeResults.length > 0 ? summary : undefined,
      provider: "coze-volcengine-internet-search",
      searchedAt,
      verification: finalVerification,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error("[QM:XIAOKU] realtime search timeout", { timeoutMs: SEARCH_TIMEOUT_MS });
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
