// QM 情绪树洞 v2.0 - 记忆引擎
// L0当日 / L1 7天 / L2 30天 / L3长期opt-in / L4原文独立
// 召回排序：recency30% + explicit_importance25% + unresolved_thread20% + recurrence15% + current_relevance10%
import type { TreeholeMemory, DimensionCode, DailyRecord, SensitivityLevel } from "./th-types";
import { getAllMemories, saveMemories, cleanupExpiredMemories } from "./th-storage";

/** 召回权重配置 */
const RECALL_WEIGHTS = {
  recency: 0.3,
  explicitImportance: 0.25,
  unresolvedThread: 0.2,
  recurrence: 0.15,
  currentRelevance: 0.1,
};

/**
 * 生成唯一记忆 ID
 */
export function generateMemoryId(): string {
  return `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * 从 check-in + 日记文本提取当日记忆（L0）
 * 注：POC版本为关键词和规则提取，MVP版本应调用AI
 */
export function extractDailyMemories(
  date: string,
  checkinAnswers: { questionId?: string; dimension: DimensionCode; answer: string }[],
  diaryText: string,
): TreeholeMemory[] {
  const memories: TreeholeMemory[] = [];

  // 从 check-in 答案生成事实记忆（L0）
  for (const ans of checkinAnswers) {
    if (!ans.answer || ans.answer === "跳过" || ans.answer === "不想回答") continue;

    // 检测是否为未完线索（负面/未解决的状态）
    const unresolvedKeywords = ["很沉", "低", "没充到", "没怎么睡", "很乱", "绕不出去", `非常难", "几乎停住", "苛刻", "很陌生", "有摩擦", "很消耗", "快超载"`,
      "完全放不下", "没有", "很强烈", "完全看不清", "什么都没有"];

    const isUnresolved = unresolvedKeywords.some((k) => ans.answer.includes(k));

    memories.push({
      id: generateMemoryId(),
      level: "L0",
      fact: `在「${ans.questionId}」的回答中选择了「${ans.answer}」`,
      sourceDate: date,
      sourceType: "checkin",
      sensitivity: "medium",
      confidence: 0.95,
      expiryAt: getExpiryDate(date, "L0"),
      userEditable: true,
      dimensions: [ans.dimension],
      isUnresolvedThread: isUnresolved,
      explicitImportance: 0.5,
      recurrenceCount: 1,
      consentScope: "treehole_only",
    });
  }

  // 日记文本在 POC 中不做自动提取（仅作为 L4 原文存储）
  // 这里只生成一条「今天写了日记」的元记忆
  if (diaryText && diaryText.trim().length > 0) {
    memories.push({
      id: generateMemoryId(),
      level: "L0",
      fact: `今天写了 ${diaryText.length} 字日记`,
      aiHypothesis: "用户愿意花时间表达，说明有想整理的内容",
      sourceDate: date,
      sourceType: "diary",
      sensitivity: "low",
      confidence: 0.6,
      expiryAt: getExpiryDate(date, "L0"),
      userEditable: true,
      dimensions: [],
      isUnresolvedThread: false,
      explicitImportance: 0.3,
      recurrenceCount: 1,
      consentScope: "treehole_only",
    });
  }

  return memories;
}

/**
 * 计算记忆过期时间
 */
function getExpiryDate(sourceDate: string, level: string): string {
  const date = new Date(sourceDate);
  switch (level) {
    case "L0":
      date.setDate(date.getDate() + 1); // 当日记忆保留1天（L1升级时更新）
      return date.toISOString();
    case "L1":
      date.setDate(date.getDate() + 7);
      return date.toISOString();
    case "L2":
      date.setDate(date.getDate() + 30);
      return date.toISOString();
    case "L3":
      return ""; // 长期记忆不自动过期
    case "L4":
      date.setDate(date.getDate() + 30); // 原文默认保留30天，opt-in后更长
      return date.toISOString();
    default:
      date.setDate(date.getDate() + 7);
      return date.toISOString();
  }
}

/**
 * 升级记忆层级（每日运行）
 * L0 -> L1（当日有意义的内容）
 * L1 -> L2（7天后仍反复出现的主题）
 */
export function promoteMemoryLevels(today: string): void {
  const all = getAllMemories();
  const todayDate = new Date(today);

  const updated = all.map((mem) => {
    const sourceDate = new Date(mem.sourceDate);
    const daysPassed = Math.floor(
      (todayDate.getTime() - sourceDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    // L0 升级为 L1：24小时后且用户未删除
    if (mem.level === "L0" && daysPassed >= 1 && daysPassed < 7) {
      return { ...mem, level: "L1" as const, expiryAt: getExpiryDate(mem.sourceDate, "L1") };
    }

    // L1 升级为 L2：7天后且重复出现 >= 2 次
    if (mem.level === "L1" && daysPassed >= 7 && (mem.recurrenceCount || 0) >= 2) {
      return { ...mem, level: "L2" as const, expiryAt: getExpiryDate(mem.sourceDate, "L2") };
    }

    return mem;
  });

  // 清理过期的
  cleanupExpiredMemories(today);

  // 保存升级的
  const changed = updated.filter((m, i) => m.level !== all[i]?.level);
  if (changed.length > 0) {
    saveMemories(updated);
  }
}

/**
 * 召回记忆：根据当前上下文和排序权重返回最相关的记忆
 *
 * @param count 返回数量
 * @param currentDimensions 当前关注的维度（用于 relevance 计算）
 * @param includeLevels 包含哪些层级
 */
export function recallMemories(
  count: number = 5,
  currentDimensions: DimensionCode[] = [],
  includeLevels: string[] = ["L0", "L1", "L2", "L3"],
): TreeholeMemory[] {
  const all = getAllMemories();
  const today = new Date();

  // 过滤层级和未过期
  const valid = all.filter((m) => {
    if (!includeLevels.includes(m.level)) return false;
    if (m.expiryAt && new Date(m.expiryAt) < today) return false;
    return true;
  });

  // 计算每条记忆的得分
  const scored = valid.map((mem) => {
    // recency：越近越高（0-1）
    const sourceDate = new Date(mem.sourceDate);
    const daysAgo = Math.floor((today.getTime() - sourceDate.getTime()) / (1000 * 60 * 60 * 24));
    const recencyScore = Math.max(0, 1 - daysAgo / 30);

    // explicit_importance：用户标记的重要性（0-1）
    const importanceScore = mem.explicitImportance ?? 0.5;

    // unresolved_thread：未完线索加权
    const unresolvedScore = mem.isUnresolvedThread ? 1 : 0;

    // recurrence：出现频率（归一化到 0-1）
    const recurrenceScore = Math.min(1, (mem.recurrenceCount || 1) / 5);

    // current_relevance：与当前维度的相关性
    const relevanceScore =
      currentDimensions.length > 0 && mem.dimensions.length > 0
        ? mem.dimensions.filter((d) => currentDimensions.includes(d)).length /
          Math.max(currentDimensions.length, mem.dimensions.length)
        : 0;

    const totalScore =
      recencyScore * RECALL_WEIGHTS.recency +
      importanceScore * RECALL_WEIGHTS.explicitImportance +
      unresolvedScore * RECALL_WEIGHTS.unresolvedThread +
      recurrenceScore * RECALL_WEIGHTS.recurrence +
      relevanceScore * RECALL_WEIGHTS.currentRelevance;

    return { memory: mem, score: totalScore };
  });

  // 按得分降序排列
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, count).map((s) => s.memory);
}

/**
 * 获取昨日未完线索记忆
 */
export function getYesterdayUnresolved(yesterday: string): TreeholeMemory[] {
  const all = getAllMemories();
  return all.filter(
    (m) =>
      m.sourceDate === yesterday &&
      m.isUnresolvedThread &&
      m.level !== "L3" && // L3 长期记忆不做日常 follow-up
      m.sensitivity !== "critical",
  );
}

/**
 * 检测重复主题并增加 recurrence count
 */
export function bumpRecurrence(dimension: DimensionCode, themeKeyword: string): void {
  const all = getAllMemories();
  let bumped = false;
  const updated = all.map((m) => {
    if (m.dimensions.includes(dimension) && m.fact.includes(themeKeyword)) {
      bumped = true;
      return { ...m, recurrenceCount: (m.recurrenceCount || 1) + 1 };
    }
    return m;
  });
  if (bumped) {
    saveMemories(updated);
  }
}

/**
 * 把用户明确要求记住的内容升级为 L3 长期记忆
 * （必须用户主动 opt-in）
 */
export function promoteToLongTerm(memoryId: string): boolean {
  const all = getAllMemories();
  const idx = all.findIndex((m) => m.id === memoryId);
  if (idx < 0) return false;

  all[idx] = {
    ...all[idx],
    level: "L3",
    expiryAt: null,
    consentScope: "long_term_opt_in",
  };

  return saveMemories(all);
}

/**
 * 记忆审计：返回记忆来源、置信度等信息
 */
export function getMemoryAuditInfo(memory: TreeholeMemory): {
  source: string;
  confidenceDisplay: string;
  sensitivityDisplay: string;
  editable: boolean;
} {
  const sourceNames: Record<string, string> = {
    checkin: "每日情绪收集",
    diary: "日记原文",
    letter: "小酷回信",
    user_explicit: "你主动告诉小酷的",
    bridge: "来自自由对话",
  };

  const confidenceLabels: Record<number, string> = {
    0.9: "你明确说过的事实",
    0.7: "根据你的描述整理",
    0.5: "小酷的理解，可能不准",
  };

  const sensitivityLabels: Record<SensitivityLevel, string> = {
    low: "低敏感",
    medium: "中敏感",
    high: "高敏感",
    critical: "极高敏感",
  };

  const confKey = Object.keys(confidenceLabels)
    .map(Number)
    .sort((a, b) => b - a)
    .find((k) => memory.confidence >= k) as number | undefined;

  return {
    source: sourceNames[memory.sourceType] || memory.sourceType,
    confidenceDisplay: confKey ? confidenceLabels[confKey] : "待确认",
    sensitivityDisplay: sensitivityLabels[memory.sensitivity],
    editable: memory.userEditable,
  };
}

export { saveMemories } from "./th-storage";
