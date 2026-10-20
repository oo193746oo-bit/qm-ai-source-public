// ============================================================
// QM AI 知识库 v3.0 七维推荐算法
// Score = topicSim*0.28 + purposeMatch*0.18 + scenarioMatch*0.16
//       + typePref*0.10 + depthMatch*0.10 + recentBehavior*0.08
//       + novelty*0.06 + editorialQuality*0.04
// ============================================================
// 安全规则：
// 1. 危机状态不运行普通推荐，返回空数组
// 2. 敏感身份（sensitive_identity_tags）不自动推断用户身份
// 3. 身份重排必须用户主动 opt-in
// 4. 只推荐 visibility=public_ready 的内容
// ============================================================

import { KnowledgeContent, getPublicContent, getContentById } from "./kb-registry";
import { getPurpose, getScenario, getContentType, getDomain } from "./kb-meta";
import { getArticleBody } from "./article-bodies";

export interface RecommendInput {
  /** 主题关键词（用户输入或当前浏览主题） */
  topic?: string;
  /** 用户当前目的 P01-P24 */
  purpose?: string;
  /** 用户当前场景 S01-S36 */
  scenario?: string;
  /** 偏好的内容形式 CT01-CT24 */
  preferredTypes?: string[];
  /** 偏好深度 L1-L5 */
  preferredDepth?: string;
  /** 最近浏览的内容ID列表（用于去重和行为权重） */
  recentContentIds?: string[];
  /** 用户是否主动选择身份相关推荐（opt-in），默认 false */
  userOptedInIdentity?: boolean;
  /** 是否处于危机状态（危机状态不运行推荐） */
  isCrisis?: boolean;
  /** 最大返回数量，默认 5 */
  limit?: number;
}

export interface RecommendResult {
  content: KnowledgeContent;
  score: number;
  /** 用户能理解的推荐理由 */
  reason: string;
}

// 各维度权重
const WEIGHTS = {
  topicSim: 0.28,
  purposeMatch: 0.18,
  scenarioMatch: 0.16,
  typePref: 0.10,
  depthMatch: 0.10,
  recentBehavior: 0.08,
  novelty: 0.06,
  editorialQuality: 0.04,
};

// ---------- 各维度评分函数 ----------

/** 主题相关度：基于标题/摘要/子议题/场景标签/目的标签关键词匹配 */
function calcTopicSim(content: KnowledgeContent, topic?: string): number {
  if (!topic || !topic.trim()) return 0.5; // 无主题时给中性分
  const t = topic.toLowerCase().trim();
  const title = content.title.toLowerCase();
  const summary = content.public_summary.toLowerCase();
  const subtopic = (content.subtopic || "").toLowerCase();

  let score = 0;
  // 标题完全包含
  if (title.includes(t)) score += 1.0;
  // 子议题完全包含
  else if (subtopic && subtopic.includes(t)) score += 0.8;
  // 摘要包含
  else if (summary.includes(t)) score += 0.5;

  // 部分关键词匹配
  const keywords = t.split(/\s+/).filter((k) => k.length >= 2);
  if (keywords.length > 1) {
    let matchCount = 0;
    for (const kw of keywords) {
      if (title.includes(kw) || (subtopic && subtopic.includes(kw)) || summary.includes(kw)) {
        matchCount++;
      }
    }
    const partialScore = matchCount / keywords.length;
    score = Math.max(score, partialScore * 0.6);
  }

  // 场景标签和目的标签纳入相似度计算（空数组时跳过）
  if (content.scenario_tags && content.scenario_tags.length > 0) {
    for (const tagId of content.scenario_tags) {
      const sc = getScenario(tagId);
      if (sc) {
        const tagName = sc.name.toLowerCase();
        if (tagName.includes(t) || t.includes(tagName)) {
          score = Math.max(score, 0.45);
        }
      }
    }
  }

  if (content.purpose_tags && content.purpose_tags.length > 0) {
    for (const tagId of content.purpose_tags) {
      const p = getPurpose(tagId);
      if (p) {
        const tagName = p.name.toLowerCase();
        if (tagName.includes(t) || t.includes(tagName)) {
          score = Math.max(score, 0.4);
        }
      }
    }
  }

  return Math.min(1, score);
}

/** 目的匹配度 */
function calcPurposeMatch(content: KnowledgeContent, purpose?: string): number {
  if (!purpose) return 0.4; // 无目的时给基础分
  return content.purpose_tags.includes(purpose) ? 1.0 : 0.2;
}

/** 场景匹配度 */
function calcScenarioMatch(content: KnowledgeContent, scenario?: string): number {
  if (!scenario) return 0.4; // 无场景时给基础分
  return content.scenario_tags.includes(scenario) ? 1.0 : 0.2;
}

/** 内容形式偏好 */
function calcTypePref(content: KnowledgeContent, preferredTypes?: string[]): number {
  if (!preferredTypes || preferredTypes.length === 0) return 0.5;
  return preferredTypes.includes(content.content_type) ? 1.0 : 0.3;
}

/** 深度匹配 */
function calcDepthMatch(content: KnowledgeContent, preferredDepth?: string): number {
  if (!preferredDepth) return 0.5;
  const depthOrder = ["L1", "L2", "L3", "L4", "L5"];
  const userIdx = depthOrder.indexOf(preferredDepth);
  const contentIdx = depthOrder.indexOf(content.depth);
  if (userIdx === -1 || contentIdx === -1) return 0.5;

  // 差一级扣 0.3
  const diff = Math.abs(userIdx - contentIdx);
  return Math.max(0, 1 - diff * 0.3);
}

/** 最近行为：最近看过的内容降权（避免重复推荐） */
function calcRecentBehavior(
  content: KnowledgeContent,
  recentContentIds?: string[]
): number {
  if (!recentContentIds || recentContentIds.length === 0) return 0.5;
  // 最近浏览过的内容降权
  if (recentContentIds.includes(content.content_id)) return 0.1;
  // 同一领域最近看过的给小幅降权（但仍可能有相关性）
  const recentDomains = new Set<string>();
  // 注：这里只基于ID简单判断，完整实现可基于内容关联
  return 0.6;
}

/** 新颖性：内容编号越大表示越新（简化版） */
function calcNovelty(content: KnowledgeContent): number {
  // 基于 content_id 末尾序号，大致反映内容新旧
  const match = content.content_id.match(/-(\d+)$/);
  if (!match) return 0.5;
  const num = parseInt(match[1], 10);
  // 序号越大越新，映射到 0.3-1.0
  return Math.min(1, 0.3 + (num / 20) * 0.7);
}

/** 编辑质量：所有public_ready内容基础分一致，预留扩展 */
function calcEditorialQuality(content: KnowledgeContent): number {
  // 当前所有 public_ready 内容给统一分
  // 未来可引入编辑评分、来源分级等
  if (content.source_class === "public_research") return 1.0;
  if (content.source_class === "public_education") return 0.85;
  return 0.7;
}

// ---------- 生成推荐理由 ----------

function generateReason(
  content: KnowledgeContent,
  input: RecommendInput,
  scores: Record<string, number>
): string {
  const reasons: string[] = [];

  // 最高维度的理由
  const topDims = Object.entries(scores)
    .filter(([_, v]) => v >= 0.7)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([k]) => k);

  if (topDims.includes("scenarioMatch") && input.scenario) {
    const sc = getScenario(input.scenario);
    if (sc) reasons.push(`和「${sc.name}」有关`);
  }
  if (topDims.includes("purposeMatch") && input.purpose) {
    const p = getPurpose(input.purpose);
    if (p) reasons.push(`适合你想${p.name}的需求`);
  }
  if (topDims.includes("topicSim") && input.topic) {
    reasons.push(`和你关注的「${input.topic}」相关`);
  }
  if (topDims.includes("typePref") && input.preferredTypes?.length) {
    const ct = getContentType(content.content_type);
    if (ct) reasons.push(`是你偏好的${ct.name}形式`);
  }

  // 领域相关
  const domain = getDomain(content.domain);
  if (domain && reasons.length === 0) {
    reasons.push(`来自${domain.name}领域`);
  }

  // 默认理由
  if (reasons.length === 0) {
    reasons.push("也许对你有帮助");
  }

  return reasons.join("，");
}

// ---------- 主推荐函数 ----------

/**
 * 七维推荐算法主函数
 * 危机状态直接返回空数组（不运行普通推荐）
 */
export function recommendContent(input: RecommendInput): RecommendResult[] {
  // 安全规则：危机状态不运行普通推荐
  if (input.isCrisis) {
    return [];
  }

  const allContent = getPublicContent();
  const limit = input.limit ?? 5;

  const scored = allContent.map((content) => {
    const topicSim = calcTopicSim(content, input.topic);
    const purposeMatch = calcPurposeMatch(content, input.purpose);
    const scenarioMatch = calcScenarioMatch(content, input.scenario);
    const typePref = calcTypePref(content, input.preferredTypes);
    const depthMatch = calcDepthMatch(content, input.preferredDepth);
    const recentBehavior = calcRecentBehavior(content, input.recentContentIds);
    const novelty = calcNovelty(content);
    const editorialQuality = calcEditorialQuality(content);

    const score =
      topicSim * WEIGHTS.topicSim +
      purposeMatch * WEIGHTS.purposeMatch +
      scenarioMatch * WEIGHTS.scenarioMatch +
      typePref * WEIGHTS.typePref +
      depthMatch * WEIGHTS.depthMatch +
      recentBehavior * WEIGHTS.recentBehavior +
      novelty * WEIGHTS.novelty +
      editorialQuality * WEIGHTS.editorialQuality;

    const dimScores = {
      topicSim,
      purposeMatch,
      scenarioMatch,
      typePref,
      depthMatch,
      recentBehavior,
      novelty,
      editorialQuality,
    };

    return {
      content,
      score,
      reason: generateReason(content, input, dimScores),
    };
  });

  // 按分数降序，取前 N 个
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * 获取相关内容（用于内容详情页底部推荐，2-4条）
 * 优先使用文章正文里的 related_ids；为空时回退到七维算法推荐
 */
export function getRelatedContent(
  contentId: string,
  limit: number = 3
): KnowledgeContent[] {
  const current = getPublicContent().find((c) => c.content_id === contentId);
  if (!current) return [];

  // 优先使用文章的 related_ids
  const articleBody = getArticleBody(contentId);
  if (articleBody && articleBody.related_ids && articleBody.related_ids.length > 0) {
    const related = articleBody.related_ids
      .map((id) => getContentById(id))
      .filter(
        (c): c is KnowledgeContent =>
          c !== undefined && c !== null && c.visibility === "public_ready"
      )
      .slice(0, limit);
    if (related.length > 0) return related;
  }

  // 回退：算法推荐（subtopic为空时用title作为主题）
  const topic = current.subtopic && current.subtopic.trim()
    ? current.subtopic
    : current.title;

  const related = recommendContent({
    topic,
    scenario: current.scenario_tags[0],
    purpose: current.purpose_tags[0],
    recentContentIds: [contentId],
    limit: limit + 1, // +1 因为可能包含自身
  })
    .filter((r) => r.content.content_id !== contentId)
    .slice(0, limit)
    .map((r) => r.content);

  return related;
}

/**
 * 首页「随便看看」推荐
 * 从各领域随机选高质量内容
 */
export function getExploreRecommendations(limit: number = 5): RecommendResult[] {
  const allContent = getPublicContent();
  // 简单随机 + 编辑质量加权
  const shuffled = [...allContent].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, limit).map((c) => ({
    content: c,
    score: 0.5,
    reason: "随便看看，也许有新发现",
  }));
}
