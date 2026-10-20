// ============================================================
// QM AI v11.5 资源检索引擎
// 纯代码检索（不调外部API），从 KNOWLEDGE_REGISTRY 和测评数据中
// 检索与用户消息相关的已验证资源。
//
// 安全规则：
// 1. 危机/高情绪时返回空数组
// 2. 小雪只返回流程/费用/服务类文章
// 3. 频率控制：max_per_turn=2, max_per_10_turns=2, min_gap=3
// 4. 案例检索暂返回空数组（v12接入脱敏案例），接口预留
// ============================================================

import { KNOWLEDGE_REGISTRY, KnowledgeContent } from "./kb/kb-registry";
import { DOMAINS, SCENARIOS, PURPOSES, getDomain, getScenario, getPurpose } from "./kb/kb-meta";
import { allAssessments, AssessmentInfo } from "./assessments/data";
import { detectCrisis } from "./crisis-detection";

// ---------- 接口定义 ----------

/** 已验证资源（符合 v13 runtime_schemas.json 契约） */
export interface VerifiedResource {
  id: string;
  type: "article" | "tool" | "assessment";
  title: string;
  short_description: string;
  url_or_route: string;
  relevance_score: number; // 0-1
  source_registry: "kb_registry" | "assessment_registry";
  verified: true;
}

/** 案例证据（v12接入，当前预留） */
export interface CaseEvidence {
  case_id: string; // 脱敏ID，不含原始CASE编号
  theme: string;
  interaction_pattern: string;
  effective_intervention: string;
  risk_boundary: string;
  transferable_principle: string;
}

/** v11.5.1: 高情绪分级 */
export type HighEmotionLevel = "none" | "acute" | "severe";

/** 检索结果 */
export interface ResourceRetrievalResult {
  resources: VerifiedResource[];
  caseEvidence: CaseEvidence[]; // v12前始终为空数组
  retrievalMeta: {
    totalCandidates: number;
    filteredByRole: number;
    filteredByFrequency: number;
    crisisBlocked: boolean;
    highEmotionBlocked: boolean;
    /** v11.5.1: 高情绪分级 —— none 正常检索；acute 仅返回CT08情绪急救卡；severe 返回空只陪伴 */
    highEmotionLevel: HighEmotionLevel;
  };
}

// ---------- 频率控制 ----------

const MAX_PER_TURN = 2;
const MAX_PER_10_TURNS = 2;
const MIN_GAP = 3; // 至少间隔3轮才能再次推荐

/**
 * 从对话历史中判断资源推荐频率是否超限
 * @param history 最近的对话历史（assistant消息）
 * @returns 是否允许推荐
 */
function checkFrequency(history: string[]): { allowed: boolean; reason: string } {
  if (!history || history.length === 0) return { allowed: true, reason: "" };

  // 统计最近10轮中助手消息里出现资源推荐的次数
  // 简单启发式：检测"推荐"/"这篇文章"/"可以看看"/"测评"等推荐类语言
  const recommendationPatterns = [
    /推荐你/, /推荐这/, /这篇文章/, /这篇.*文章/, /可以看看/,
    /不妨看看/, /建议阅读/, /这个测评/, /做个测评/, /相关文章/,
    /资源导航/, /了解更多/, /点击.*查看/,
  ];

  const recentTurns = history.slice(-10);
  let recommendationCount = 0;
  let turnsSinceLastRecommendation = 0;
  let foundRecent = false;

  for (let i = recentTurns.length - 1; i >= 0; i--) {
    const msg = recentTurns[i];
    const hasRecommendation = recommendationPatterns.some((p) => p.test(msg));
    if (hasRecommendation) {
      recommendationCount++;
      if (!foundRecent) {
        foundRecent = true;
        turnsSinceLastRecommendation = recentTurns.length - 1 - i;
      }
    } else if (!foundRecent) {
      turnsSinceLastRecommendation++;
    }
  }

  // 最近一轮已有推荐，本轮不再推荐
  if (foundRecent && turnsSinceLastRecommendation < 1) {
    return { allowed: false, reason: "上一轮已推荐资源" };
  }

  // 间隔不足
  if (foundRecent && turnsSinceLastRecommendation < MIN_GAP) {
    return { allowed: false, reason: `距上次推荐仅${turnsSinceLastRecommendation}轮，需间隔${MIN_GAP}轮` };
  }

  // 10轮内超过上限
  if (recommendationCount >= MAX_PER_10_TURNS) {
    return { allowed: false, reason: `最近10轮已推荐${recommendationCount}次，达上限` };
  }

  return { allowed: true, reason: "" };
}

// ---------- 高情绪检测 ----------

/** v11.5.1: 急性情绪关键词（情绪激烈但未到危机，允许返回CT08情绪急救卡） */
const ACUTE_EMOTION_PATTERNS = [
  /我好焦虑/, /我好难受/, /我好害怕/, /我好生气/, /我好累/,
  /我好压抑/, /我好难过/, /我好委屈/, /我好沮丧/,
];

/** v11.5.1: 严重情绪关键词（接近危机，只陪伴不推荐任何资源） */
const SEVERE_EMOTION_PATTERNS = [
  /我受不了/, /我快崩/, /太痛苦/, /我好绝望/, /我撑不住/,
  /我快疯/, /我好崩溃/, /我好无助/, /我不想活/,
];

/**
 * v11.5.1: 高情绪分级
 * - severe → 完全不返回资源（只陪伴）
 * - acute  → 仅允许返回CT08情绪急救卡类文章
 * - none   → 正常检索
 */
function detectHighEmotionLevel(text: string): HighEmotionLevel {
  if (SEVERE_EMOTION_PATTERNS.some((p) => p.test(text))) return "severe";
  if (ACUTE_EMOTION_PATTERNS.some((p) => p.test(text))) return "acute";
  return "none";
}

// ---------- 关键词提取 ----------

/** 从用户消息中提取检索关键词 */
function extractKeywords(text: string): string[] {
  if (!text) return [];

  const keywords: string[] = [];

  // 提取中文词组（2-6字）
  const chineseWords = text.match(/[\u4e00-\u9fa5]{2,6}/g) || [];
  keywords.push(...chineseWords);

  // 提取场景关键词映射
  const scenarioKeywordMap: Record<string, string[]> = {
    "焦虑|紧张|不安|担心": ["焦虑", "情绪"],
    "抑郁|低落|难过|伤心|不开心": ["低落", "情绪"],
    "失眠|睡不|睡不着|熬夜": ["睡眠", "身心"],
    "分手|失恋|离开": ["关系", "亲密关系"],
    "吵架|冲突|矛盾|争吵": ["冲突", "沟通", "关系"],
    "边界|拒绝|讨好": ["边界", "关系"],
    "家庭|父母|原生家庭|妈妈|爸爸": ["家庭", "原生家庭"],
    "出柜|性别|跨性别|非二元": ["性别", "身份"],
    "性取向|同性恋|双性恋|无性": ["性取向", "身份"],
    "拖延|注意力|ADHD|专注": ["拖延", "注意力", "执行功能"],
    "工作|职业|离职|转行|职场": ["工作", "职业", "倦怠"],
    "考试|学习|压力|学生": ["学习", "考试", "压力"],
    "自我|认同|价值|自信|自尊": ["自我", "认同", "成长"],
    "咨询|心理师|治疗|预约": ["求助", "咨询", "入门"],
    "测评|测试|MBTI|人格": ["测评", "测试"],
    "工具|练习|方法|接地|正念": ["工具", "练习", "方法"],
    "饮食|进食|身体": ["饮食", "身心"],
    "创伤|PTSD|创伤后": ["创伤"],
    "人格|防御机制|移情|依恋": ["人格", "依恋", "理论"],
    "孤独|没人理解|社交": ["孤独", "社交", "友谊"],
    "选择|决定|纠结": ["决策", "选择"],
    "失去|丧失|离别|悲伤": ["失去", "转折"],
    "文化|移民|海外|留学": ["文化", "移民"],
    "青春期|成年|转折": ["人生阶段", "转折"],
    "神经多样|自闭|阿斯": ["神经多样性"],
  };

  for (const [patternStr, kws] of Object.entries(scenarioKeywordMap)) {
    const patterns = patternStr.split("|");
    if (patterns.some((p) => text.includes(p))) {
      keywords.push(...kws);
    }
  }

  return [...new Set(keywords)];
}

// ---------- 文章相关度评分 ----------

/** 计算单篇文章与用户消息的相关度 */
function scoreArticle(content: KnowledgeContent, keywords: string[], userMessage: string): number {
  let score = 0;
  const title = content.title.toLowerCase();
  const summary = content.public_summary.toLowerCase();
  const subtopic = (content.subtopic || "").toLowerCase();
  const msg = userMessage.toLowerCase();

  // 标题匹配（最高权重）
  for (const kw of keywords) {
    const kwLower = kw.toLowerCase();
    if (title.includes(kwLower)) {
      score += 0.35;
    }
    if (subtopic.includes(kwLower)) {
      score += 0.25;
    }
    if (summary.includes(kwLower)) {
      score += 0.15;
    }
  }

  // 场景标签匹配
  for (const tagId of content.scenario_tags) {
    const scenario = getScenario(tagId);
    if (scenario) {
      const scenarioName = scenario.name.toLowerCase();
      // 检查用户消息是否包含场景名中的关键词
      const scenarioKeywords = scenarioName.match(/[\u4e00-\u9fa5]{2,}/g) || [];
      for (const sk of scenarioKeywords) {
        if (msg.includes(sk.toLowerCase())) {
          score += 0.15;
          break;
        }
      }
    }
  }

  // 目的标签匹配
  for (const tagId of content.purpose_tags) {
    const purpose = getPurpose(tagId);
    if (purpose) {
      const purposeName = purpose.name.toLowerCase();
      if (msg.includes(purposeName)) {
        score += 0.1;
        break;
      }
    }
  }

  // 领域名称匹配
  const domain = getDomain(content.domain);
  if (domain) {
    const domainName = domain.name.toLowerCase();
    const domainKeywords = domainName.match(/[\u4e00-\u9fa5]{2,}/g) || [];
    for (const dk of domainKeywords) {
      if (msg.includes(dk.toLowerCase())) {
        score += 0.1;
        break;
      }
    }
  }

  return Math.min(1, score);
}

// ---------- 角色过滤 ----------

/** 小雪允许的内容类型（流程/费用/服务类） */
const XIAOXUE_ALLOWED_CONTENT_TYPES = new Set([
  "CT06", // 分步指南
  "CT08", // 情绪急救卡（v11.5.1：高情绪急性场景下小雪也可推荐）
  "CT11", // FAQ问答
  "CT12", // 误区澄清
  "CT24", // 资源导航
]);

/** 小雪排除的深度领域 */
const XIAOXUE_EXCLUDED_DOMAINS = new Set([
  "D16", // 心理学怎么理解人（理论深潜）
  "D12", // 心理工具箱（练习类）
  "D15", // 神经多样性（专业领域）
]);

/** 小雪允许的子议题关键词 */
const XIAOXUE_SUBTOPIC_KEYWORDS = [ `求助", "入门", "流程", "费用", "预约", "服务", "形式"`, `第一次", "准备", "线上", "线下", "视频", "价格", "收费"`, `咨询前", "怎么选", "如何选"`,
];

/** 判断文章是否适合小雪角色 */
function isXiaoxueAppropriate(content: KnowledgeContent): boolean {
  // 排除深度领域
  if (XIAOXUE_EXCLUDED_DOMAINS.has(content.domain)) return false;

  // 排除深度/理论/练习类内容形式
  if (["CT13", "CT14", "CT15", "CT04", "CT05", "CT22"].includes(content.content_type)) {
    return false;
  }

  // 允许的内容类型直接通过
  if (XIAOXUE_ALLOWED_CONTENT_TYPES.has(content.content_type)) return true;

  // 检查子议题是否包含服务类关键词
  const subtopic = content.subtopic || "";
  const title = content.title;
  const combined = subtopic + title;
  if (XIAOXUE_SUBTOPIC_KEYWORDS.some((kw) => combined.includes(kw))) {
    return true;
  }

  // D11领域（危机与求助）中的求助入门类文章允许
  if (content.domain === "D11" && content.depth !== "L5") {
    return true;
  }

  // 轻阅读FAQ类允许
  if (content.reading_load === "Light" && content.content_type === "CT11") {
    return true;
  }

  return false;
}

// ---------- 测评匹配 ----------

/** 测评关键词映射 */
const ASSESSMENT_KEYWORD_MAP: Record<string, string[]> = {
  mbti: ["mbti", "人格", "性格", "16型", "内外向", "直觉", "实感"],
  mood: ["情绪状态", "心情", "焦虑", "抑郁", "心理健康"],
  bigfive: ["大五", "人格", "性格", "开放性", "尽责性", "外倾", "宜人性", "神经质"],
  holland: ["职业", "兴趣", "霍兰德", "职业倾向", "工作", "转行"],
  workvalues: ["工作价值", "职业价值", "工作观", "职场"],
  multipleintel: ["多元智能", "智力", "加德纳", "智能"],
  adler: ["阿德勒", "自卑", "超越", "生活风格", "社会兴趣", "出生顺序"],
};

/** 匹配相关测评 */
function matchAssessments(userMessage: string, role: "xiaoku" | "xiaoxue"): VerifiedResource[] {
  // 小雪不推荐测评（预约顾问角色）
  if (role === "xiaoxue") return [];

  const msg = userMessage.toLowerCase();
  const results: VerifiedResource[] = [];

  for (const assessment of allAssessments) {
    const keywords = ASSESSMENT_KEYWORD_MAP[assessment.id] || [];
    if (keywords.length === 0) continue;

    const matchCount = keywords.filter((kw) => msg.includes(kw.toLowerCase())).length;
    if (matchCount > 0) {
      const score = Math.min(1, matchCount / 3 + 0.3);
      results.push({
        id: `assessment-${assessment.id}`,
        type: "assessment",
        title: assessment.title,
        short_description: assessment.description || assessment.subtitle,
        url_or_route: `/assessments/${assessment.id}`,
        relevance_score: score,
        source_registry: "assessment_registry",
        verified: true,
      });
    }
  }

  return results.sort((a, b) => b.relevance_score - a.relevance_score);
}

// ---------- 主检索函数 ----------

/**
 * 资源检索主函数
 *
 * @param userMessage 用户最新消息
 * @param role 角色（xiaoku/xiaoxue）
 * @param conversationHistory 最近的对话历史（assistant消息文本数组）
 * @returns ResourceRetrievalResult
 */
export function retrieveResources(
  userMessage: string,
  role: "xiaoku" | "xiaoxue",
  conversationHistory?: string[],
): ResourceRetrievalResult {
  const emptyResult: ResourceRetrievalResult = {
    resources: [],
    caseEvidence: [],
    retrievalMeta: {
      totalCandidates: 0,
      filteredByRole: 0,
      filteredByFrequency: 0,
      crisisBlocked: false,
      highEmotionBlocked: false,
      highEmotionLevel: "none",
    },
  };

  if (!userMessage || !userMessage.trim()) return emptyResult;

  // 1. 危机检测（最高优先级，短路）
  const crisisResult = detectCrisis(userMessage);
  if (crisisResult.isCrisis) {
    return { ...emptyResult, retrievalMeta: { ...emptyResult.retrievalMeta, crisisBlocked: true } };
  }

  // 2. 高情绪检测（v11.5.1 分级）
  //    severe  → 返回空，只陪伴
  //    acute   → 继续走检索流程，但最终只保留 CT08 情绪急救卡
  //    none    → 正常检索
  const highEmotionLevel = detectHighEmotionLevel(userMessage);
  if (highEmotionLevel === "severe") {
    return {
      ...emptyResult,
      retrievalMeta: {
        ...emptyResult.retrievalMeta,
        highEmotionBlocked: true,
        highEmotionLevel: "severe",
      },
    };
  }

  // 3. 频率控制
  const history = conversationHistory || [];
  const freqCheck = checkFrequency(history);
  if (!freqCheck.allowed) {
    return {
      ...emptyResult,
      retrievalMeta: {
        ...emptyResult.retrievalMeta,
        filteredByFrequency: 1,
        highEmotionLevel,
      },
    };
  }

  // 4. 关键词提取
  const keywords = extractKeywords(userMessage);
  if (keywords.length === 0) {
    return {
      ...emptyResult,
      retrievalMeta: { ...emptyResult.retrievalMeta, highEmotionLevel },
    };
  }

  // 5. 文章检索与评分
  let candidates: { resource: VerifiedResource; score: number; contentType?: string }[] = [];
  let filteredByRole = 0;

  for (const content of KNOWLEDGE_REGISTRY) {
    // 只推荐公开就绪内容
    if (content.visibility !== "public_ready") continue;

    // 角色过滤
    if (role === "xiaoxue" && !isXiaoxueAppropriate(content)) {
      filteredByRole++;
      continue;
    }

    const score = scoreArticle(content, keywords, userMessage);
    if (score < 0.2) continue; // 相关度阈值

    candidates.push({
      resource: {
        id: content.content_id,
        type: "article",
        title: content.title,
        short_description: content.public_summary,
        url_or_route: `/kb/${content.domain}/${content.content_id}`,
        relevance_score: score,
        source_registry: "kb_registry",
        verified: true,
      },
      score,
      contentType: content.content_type,
    });
  }

  // 6. 测评匹配（acute 高情绪下不返回测评，只保留CT08文章）
  if (highEmotionLevel !== "acute") {
    const assessmentResources = matchAssessments(userMessage, role);
    for (const ar of assessmentResources) {
      candidates.push({ resource: ar, score: ar.relevance_score });
    }
  }

  // 6.5 v11.5.1: acute 级别只保留 CT08 情绪急救卡；没有则返回空
  if (highEmotionLevel === "acute") {
    candidates = candidates.filter(
      (c) => c.resource.type === "article" && c.contentType === "CT08",
    );
    if (candidates.length === 0) {
      return {
        ...emptyResult,
        retrievalMeta: {
          ...emptyResult.retrievalMeta,
          highEmotionBlocked: true,
          highEmotionLevel: "acute",
        },
      };
    }
  }

  // 7. 排序并取前N个
  candidates.sort((a, b) => b.score - a.score);
  const topCandidates = candidates.slice(0, MAX_PER_TURN);

  return {
    resources: topCandidates.map((c) => c.resource),
    caseEvidence: [], // v12前始终为空
    retrievalMeta: {
      totalCandidates: candidates.length,
      filteredByRole,
      filteredByFrequency: 0,
      crisisBlocked: false,
      highEmotionBlocked: highEmotionLevel !== "none",
      highEmotionLevel,
    },
  };
}

/**
 * 将检索结果格式化为注入SP的文本块
 */
export function formatResourcesForPrompt(resources: VerifiedResource[]): string {
  if (!resources || resources.length === 0) return "";

  const lines = ["<available_resources>"];
  lines.push("以下是本轮真实可用的资源。只有列在这里的资源可以推荐给用户。没有列出的资源不存在，禁止编造。");
  lines.push("");

  for (const r of resources) {
    lines.push(`- [${r.type}] ${r.title}`);
    lines.push(`  描述: ${r.short_description}`);
    lines.push(`  路径: ${r.url_or_route}`);
    lines.push("");
  }

  lines.push("规则: 每次最多推荐2个资源；危机时不推荐；用户明确拒绝后不推荐；自然融入对话，不要机械罗列。");
  lines.push("</available_resources>");

  return lines.join("\n");
}
