import type {
  RealtimeIntent,
  RealtimeSearchResult,
  RealtimeVerification,
  SearchOptions,
  SourceReliability,
} from "./types";

const GENERIC_QUERY_TERMS = new Set([
  "最新", "当前", "目前", "现在", "今天", "今晚", "明天", "昨天", "最近", "事件", "事情", "新闻", "消息", "动态",
  "天气", "天氣", "变化", "變化", "预警", "預警", "交通", "实时交通", "實時交通", "路况", "路況", "延误", "延誤",
  "停运", "停運", "封路", "怎么回事", "怎麼回事", "为什么", "為什麼", "如何", "查询", "查一下", "最新消息",
]);

const LOW_VALUE_DOMAINS_RE = /(?:weibo\.com|xiaohongshu\.com|douyin\.com|toutiao\.com|zhihu\.com|tieba\.baidu\.com|bilibili\.com)/i;
const OFFICIAL_DOMAIN_RE = /(?:\.gov\.cn$|\.gov\.hk$|\.gov\.mo$|\.gov\.tw$|\.gov$|weather\.gov|cma\.gov\.cn|nmc\.cn|hko\.gov\.hk|smg\.gov\.mo|cwb\.gov\.tw|motc\.gov\.tw|mtr\.com\.hk|12306\.cn|airport.*\.com|metro.*\.com)/i;
const ESTABLISHED_MEDIA_RE = /(?:reuters\.com|apnews\.com|bbc\.|cnn\.com|nytimes\.com|theguardian\.com|scmp\.com|caixin\.com|thepaper\.cn|news\.cn|xinhuanet\.com|people\.com\.cn|cctv\.com|chinanews\.com)/i;

const CONTRADICTION_PAIRS: Array<[RegExp, RegExp]> = [
  [/(?:停运|停運|停驶|停駛|取消|封闭|封閉|封路|暂停|暫停)/i, /(?:恢复运行|恢復運行|恢复通车|恢復通車|正常运行|正常運行|恢复开放|恢復開放|解除封闭|解除封閉)/i],
  [/(?:证实|證實|确认|確認|官宣|正式宣布)/i, /(?:否认|否認|辟谣|闢謠|不实|不實|未证实|未證實)/i],
  [/(?:有雨|降雨|暴雨|雷雨|台风|颱風|预警|預警)/i, /(?:无雨|無雨|预警解除|預警解除|天气转晴|天氣轉晴)/i],
  [/(?:拥堵|擁堵|严重拥堵|嚴重擁堵|事故|车祸|車禍)/i, /(?:畅通|暢通|事故已清|恢复畅通|恢復暢通)/i],
];

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "unknown";
  }
}

export function classifyReliability(url: string, source: string): SourceReliability {
  const domain = hostname(url);
  const haystack = `${domain} ${source}`;
  if (OFFICIAL_DOMAIN_RE.test(domain) || /(?:政府|气象局|氣象局|天文台|交通运输|交通運輸|交警|地铁官方|地鐵官方|港铁|港鐵|铁路官方|鐵路官方|机场官方|機場官方)/i.test(source)) return "official";
  if (ESTABLISHED_MEDIA_RE.test(domain)) return "established_media";
  if (LOW_VALUE_DOMAINS_RE.test(domain) || /(?:微博|小红书|小紅書|抖音|知乎|贴吧|貼吧|网友|網友)/i.test(haystack)) return "ugc";
  if (domain !== "unknown") return "general";
  return "unknown";
}

function queryTokens(query: string): string[] {
  return query
    .replace(/[“”"'‘’()（）【】\[\]？?！!，,。；;：:]/g, " ")
    .split(/\s+/)
    .map((x) => x.trim())
    .filter((x) => x.length >= 2 && x.length <= 24 && !GENERIC_QUERY_TERMS.has(x))
    .filter((x) => !/^(?:202\d|\d{1,2}[月日时點点]|天气|天氣|交通|路况|路況)$/.test(x));
}

function relevanceScore(item: RealtimeSearchResult, query: string): number {
  const tokens = queryTokens(query);
  if (tokens.length === 0) return 0.7;
  const haystack = `${item.title} ${item.source} ${item.snippet}`.toLowerCase();
  const compactHaystack = haystack.replace(/[\s\p{P}\p{S}]+/gu, "");
  const matches = tokens.filter((t) => {
    const needle = t.toLowerCase();
    const compactNeedle = needle.replace(/[\s\p{P}\p{S}]+/gu, "");
    return haystack.includes(needle) || (compactNeedle.length >= 2 && compactHaystack.includes(compactNeedle));
  }).length;
  return Math.min(1, 0.25 + (matches / Math.min(tokens.length, 4)) * 0.75);
}

function parseDate(date?: string): number | null {
  if (!date) return null;
  const ms = Date.parse(date);
  return Number.isFinite(ms) ? ms : null;
}

function freshnessScore(item: RealtimeSearchResult, options: SearchOptions): number {
  const t = parseDate(item.publishedAt);
  if (t === null) return options.freshnessRequired || options.intent === "weather" || options.intent === "traffic" ? 0.35 : 0.55;
  const ageHours = Math.max(0, (Date.now() - t) / 3600000);
  const intent = options.intent || "general_realtime";
  if (intent === "weather" || intent === "traffic") {
    if (ageHours <= 6) return 1;
    if (ageHours <= 24) return 0.8;
    if (ageHours <= 72) return 0.45;
    return 0.1;
  }
  if (ageHours <= 24) return 1;
  if (ageHours <= 24 * 7) return 0.85;
  if (ageHours <= 24 * 30) return 0.65;
  return 0.2;
}

function hasContradiction(results: RealtimeSearchResult[]): boolean {
  if (results.length < 2) return false;
  const texts = results.map((r) => `${r.title} ${r.snippet}`);
  for (const [a, b] of CONTRADICTION_PAIRS) {
    const hasA = texts.some((t) => a.test(t));
    const hasB = texts.some((t) => b.test(t));
    if (hasA && hasB) return true;
  }
  return false;
}

function independentDomains(results: RealtimeSearchResult[]): number {
  return new Set(results.map((r) => hostname(r.url)).filter((d) => d !== "unknown")).size;
}

export function verifySearchResults(
  input: RealtimeSearchResult[],
  query: string,
  options: SearchOptions = {},
  secondarySearchUsed = false,
): { results: RealtimeSearchResult[]; verification: RealtimeVerification } {
  const scored = input.map((item) => ({
    ...item,
    reliability: item.reliability || classifyReliability(item.url, item.source),
    relevanceScore: relevanceScore(item, query),
    freshnessScore: freshnessScore(item, options),
  }));

  // 明显实体/主题错配先剔除。保留官方来源时稍放宽，避免权威公告标题未重复全部 query 词。
  const relevant = scored.filter((r) => (r.relevanceScore || 0) >= (r.reliability === "official" ? 0.35 : 0.45));
  const domains = independentDomains(relevant);
  const officialCount = relevant.filter((r) => r.reliability === "official").length;
  const datedCount = relevant.filter((r) => parseDate(r.publishedAt) !== null).length;
  const freshCount = relevant.filter((r) => (r.freshnessScore || 0) >= 0.65).length;
  const conflictDetected = hasContradiction(relevant);
  const possibleEntityMismatch = input.length > 0 && relevant.length < Math.ceil(input.length / 2);
  const strictFreshness = Boolean(options.freshnessRequired || options.intent === "weather" || options.intent === "traffic");
  const staleRisk = strictFreshness && relevant.length > 0 && freshCount === 0;
  const issues: string[] = [];

  if (input.length === 0) issues.push("no_search_result");
  if (possibleEntityMismatch) issues.push("possible_entity_or_topic_mismatch");
  if (domains < 2 && relevant.length > 0) issues.push("single_independent_source");
  if (conflictDetected) issues.push("source_conflict_detected");
  if (staleRisk) issues.push("freshness_not_verified");
  if (strictFreshness && datedCount === 0 && relevant.length > 0) issues.push("source_time_missing");
  if (relevant.some((r) => r.sourceKind === "claim") && officialCount === 0) issues.push("unverified_claim_present");
  if (relevant.every((r) => r.reliability === "ugc") && relevant.length > 0) issues.push("ugc_only_evidence");

  let confidence: RealtimeVerification["confidence"] = "insufficient";
  let accepted = false;

  if (relevant.length === 0 || staleRisk) {
    confidence = "insufficient";
  } else if (conflictDetected || possibleEntityMismatch || relevant.every((r) => r.reliability === "ugc")) {
    confidence = "low";
    accepted = true; // 允许注入，但格式层强制“冲突/低置信度”表述，不能下确定结论。
  } else if ((officialCount >= 1 && domains >= 2) || domains >= 3) {
    confidence = strictFreshness && freshCount === 0 ? "low" : "high";
    accepted = confidence !== "low";
  } else if (domains >= 2 || officialCount >= 1) {
    confidence = "medium";
    accepted = true;
  } else {
    confidence = "low";
    accepted = true;
  }

  const evidenceNote = confidence === "high"
    ? "存在多来源/权威来源支撑，可在标明时间与来源性质后谨慎陈述。"
    : confidence === "medium"
      ? "证据可用但不充分，回答需保留限定词，不扩大结论。"
      : confidence === "low"
        ? "证据存在错配/冲突/单源等风险，只能陈述‘有来源这样报道/显示’，不可作为已确认事实。"
        : "缺少可验证的实时证据，不得使用旧知识或模型记忆补成当前事实。";

  return {
    results: relevant,
    verification: {
      confidence,
      accepted,
      independentSourceCount: domains,
      officialSourceCount: officialCount,
      datedSourceCount: datedCount,
      freshSourceCount: freshCount,
      conflictDetected,
      possibleEntityMismatch,
      staleRisk,
      issues,
      secondarySearchUsed,
      evidenceNote,
    },
  };
}

export function needsSecondarySearch(verification: RealtimeVerification, resultCount: number): boolean {
  if (resultCount === 0) return true;
  return verification.confidence === "insufficient" || verification.possibleEntityMismatch || verification.independentSourceCount < 2;
}

export function buildSecondaryQuery(query: string, intent: RealtimeIntent = "general_realtime"): string {
  const suffix = intent === "weather"
    ? " 官方 气象 更新时间"
    : intent === "traffic"
      ? " 官方 交通 运营方 最新 更新时间"
      : " 官方 回应 权威媒体 最新 核实";
  return `${query}${suffix}`.replace(/\s+/g, " ").trim().slice(0, 220);
}
