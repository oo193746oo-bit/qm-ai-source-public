// QM 情绪树洞 v2.0 - Daily Variation Engine
// 每日4-6题动态选择：日期/星期/时段/季节/历史曝光/未完线索/avoid_topic 共同决定
import type {
  DailyQuestion,
  DimensionCode,
  QuestionExposure,
  TreeholeMemory,
} from "./th-types";
import {
  QUESTION_BANK,
  DIMENSION_GROUPS,
  WEEKDAY_WEIGHTS,
  getQuestionsByDimension,
} from "./th-questions";

/** 同题14天不重复 */
const SAME_QUESTION_COOLDOWN_DAYS = 14;

/** 最近3天高频维度降权系数 */
const RECENT_DIMENSION_PENALTY = 0.4;

/** 基础题数范围 */
const MIN_QUESTIONS = 4;
const MAX_QUESTIONS = 6;

export interface SelectDailyQuestionsInput {
  /** 目标日期 YYYY-MM-DD */
  date: string;
  /** 星期 0-6（周日=0） */
  weekday: number;
  /** 时段 morning/afternoon/evening/night */
  timeSegment?: "morning" | "afternoon" | "evening" | "night";
  /** 季节 spring/summer/autumn/winter */
  season?: "spring" | "summer" | "autumn" | "winter";
  /** 历史曝光记录 */
  exposureHistory: QuestionExposure[];
  /** 昨日未完线索记忆 */
  yesterdayUnresolvedMemories?: TreeholeMemory[];
  /** 用户今日不想讨论的维度 */
  avoidTopics: DimensionCode[];
  /** 是否周日/月末回顾期 */
  isReviewPeriod?: boolean;
}

/**
 * 计算某题在最近 N 天内是否出现过
 */
function isQuestionInCooldown(
  questionId: string,
  exposureHistory: QuestionExposure[],
  targetDate: string,
  cooldownDays: number,
): boolean {
  const target = new Date(targetDate);
  return exposureHistory.some((ex) => {
    if (ex.questionId !== questionId) return false;
    const shown = new Date(ex.shownAt);
    const diffDays = Math.floor(
      (target.getTime() - shown.getTime()) / (1000 * 60 * 60 * 24),
    );
    return diffDays >= 0 && diffDays < cooldownDays;
  });
}

/**
 * 统计最近 N 天每个维度出现的次数
 */
function getRecentDimensionFrequency(
  exposureHistory: QuestionExposure[],
  targetDate: string,
  days: number,
): Record<DimensionCode, number> {
  const target = new Date(targetDate);
  const freq = {} as Record<DimensionCode, number>;
  for (const q of QUESTION_BANK) {
    freq[q.dimension] = 0;
  }
  for (const ex of exposureHistory) {
    if (!ex.answered) continue;
    const shown = new Date(ex.shownAt);
    const diffDays = Math.floor(
      (target.getTime() - shown.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffDays < 0 || diffDays >= days) continue;
    const question = QUESTION_BANK.find((q) => q.id === ex.questionId);
    if (question) {
      freq[question.dimension] = (freq[question.dimension] || 0) + 1;
    }
  }
  return freq;
}

/**
 * 从给定维度列表中选择题目的加权随机选择
 */
function selectQuestionFromDimensions(
  dimensions: DimensionCode[],
  weights: Partial<Record<DimensionCode, number>>,
  exposureHistory: QuestionExposure[],
  targetDate: string,
  recentFreq: Record<DimensionCode, number>,
  avoidTopics: DimensionCode[],
): DailyQuestion | null {
  // 过滤掉今日 avoid 的维度
  const availableDims = dimensions.filter((d) => !avoidTopics.includes(d));
  if (availableDims.length === 0) return null;

  // 为每个维度计算有效权重
  const dimScores: { dim: DimensionCode; score: number }[] = [];
  for (const dim of availableDims) {
    const baseWeight = weights[dim] ?? 1.0;
    const recentCount = recentFreq[dim] || 0;
    // 最近3天高频维度降权
    const penalty = recentCount > 0 ? Math.pow(RECENT_DIMENSION_PENALTY, recentCount) : 1;
    dimScores.push({ dim, score: baseWeight * penalty });
  }

  // 按权重排序（确定性：用日期 hash 做种子，保证同一天相同输入得到相同结果）
  const seed = hashStringToNumber(targetDate + availableDims.join(","));
  dimScores.sort((a, b) => b.score - a.score);

  // 从得分最高的维度开始，找一个14天内没出现过的题目
  for (const { dim } of dimScores) {
    const questions = getQuestionsByDimension(dim);
    // 打乱顺序（使用种子）
    const shuffled = shuffleWithSeed([...questions], seed + dim.charCodeAt(0));
    for (const q of shuffled) {
      if (!isQuestionInCooldown(q.id, exposureHistory, targetDate, SAME_QUESTION_COOLDOWN_DAYS)) {
        return q;
      }
    }
  }

  // 如果所有维度的所有题都在冷却期，选得分最高维度的第一个（fallback）
  if (dimScores.length > 0) {
    const topDim = dimScores[0].dim;
    const questions = getQuestionsByDimension(topDim);
    return questions[0] || null;
  }

  return null;
}

/**
 * 基于昨日未完线索生成 follow-up 题
 */
function generateFollowUpQuestions(
  memories: TreeholeMemory[],
  avoidTopics: DimensionCode[],
): DailyQuestion[] {
  const followUps: DailyQuestion[] = [];
  // 最多1个follow-up
  const unresolved = memories
    .filter((m) => m.isUnresolvedThread)
    .filter((m) => m.dimensions.some((d) => !avoidTopics.includes(d)))
    .slice(0, 1);

  for (const mem of unresolved) {
    const primaryDim = mem.dimensions.find((d) => !avoidTopics.includes(d));
    if (!primaryDim) continue;

    const followUpText = generateFollowUpText(mem, primaryDim);
    followUps.push({
      id: `followup_${mem.id}`,
      dimension: primaryDim,
      question: followUpText,
      options: ["有变化，好一些", "差不多", "有变化，更难了", "今天不想聊这个"],
      isFollowUp: true,
      followUpSourceId: mem.id,
    });
  }

  return followUps;
}

function generateFollowUpText(memory: TreeholeMemory, dim: DimensionCode): string {
  const fact = memory.fact;

  const templates: Record<DimensionCode, string> = {
    VAL: "昨天的情绪状态，今天有变化吗？",
    ENE: "昨天你提到身体/睡眠的事，今天感觉怎么样？",
    COG: "昨天那个反复的念头，今天还占位置吗？",
    MOT: "昨天的动力状态，今天有变化吗？",
    SELF: "昨天关于你和自己的那件事，今天距离有没有变化？",
    INT: "昨天你提到和伴侣/重要的人的那段，今天有变化吗？",
    FAM: "昨天那通家里的事，今天你和它的距离有没有变化？",
    WORK: "昨天工作/学习里那件事，今天它还占着多少位置？",
    SOC: "昨天关于人际/孤单的感受，今天有变化吗？",
    MEA: "昨天关于方向的那种感觉，今天视线有没有不一样？",
    RES: "昨天关于休息/恢复的事，今天有没有好一点？",
  };

  // 如果 fact 里有具体且短的线索，可以更具体
  if (fact && fact.length < 30) {
    return `昨天你说「${fact}」，今天有变化吗？`;
  }

  return templates[dim] || "昨天提到的那件事，今天有变化吗？";
}

/**
 * 字符串 hash 为数字（用于确定性随机种子）
 */
function hashStringToNumber(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * 带种子的数组打乱（Fisher-Yates）
 */
function shuffleWithSeed<T>(arr: T[], seed: number): T[] {
  const result = [...arr];
  let s = seed;
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * 获取月份对应的季节（北半球）
 */
export function getSeason(month: number): "spring" | "summer" | "autumn" | "winter" {
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter";
}

/**
 * 获取时段
 */
export function getTimeSegment(hour: number): "morning" | "afternoon" | "evening" | "night" {
  if (hour >= 5 && hour < 11) return "morning";
  if (hour >= 11 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 22) return "evening";
  return "night";
}

/**
 * 选择今日的 4-6 道题
 *
 * 选题规则：
 * 1. 固定 1 个 VAL（情绪色调）
 * 2. ENE/COG/MOT 选 1 个
 * 3. INT/FAM/WORK/SOC 选 1 个
 * 4. SELF/MEA/RES 选 1 个
 * 5. 有昨日未完线索时增加 1 个 follow-up
 * 6. 周日/月末回顾期可加 1 题（总题数不超过 6）
 */
export function selectDailyQuestions(
  input: SelectDailyQuestionsInput,
): DailyQuestion[] {
  const {
    date,
    weekday,
    exposureHistory,
    yesterdayUnresolvedMemories = [],
    avoidTopics,
    isReviewPeriod = false,
  } = input;

  const result: DailyQuestion[] = [];

  // 计算最近 3 天各维度频率
  const recent3dFreq = getRecentDimensionFrequency(exposureHistory, date, 3);

  // 获取星期权重
  const weekdayWeight = WEEKDAY_WEIGHTS[weekday] || {};

  // 1. VAL - 固定 1 题
  const valQuestion = selectQuestionFromDimensions(
    DIMENSION_GROUPS.mood,
    weekdayWeight,
    exposureHistory,
    date,
    recent3dFreq,
    avoidTopics,
  );
  if (valQuestion) result.push(valQuestion);

  // 2. ENE/COG/MOT - 三选一
  const bodyQuestion = selectQuestionFromDimensions(
    DIMENSION_GROUPS.bodyState,
    weekdayWeight,
    exposureHistory,
    date,
    recent3dFreq,
    avoidTopics,
  );
  if (bodyQuestion) result.push(bodyQuestion);

  // 3. INT/FAM/WORK/SOC - 四选一
  const relationalQuestion = selectQuestionFromDimensions(
    DIMENSION_GROUPS.relational,
    weekdayWeight,
    exposureHistory,
    date,
    recent3dFreq,
    avoidTopics,
  );
  if (relationalQuestion) result.push(relationalQuestion);

  // 4. SELF/MEA/RES - 三选一
  const selfQuestion = selectQuestionFromDimensions(
    DIMENSION_GROUPS.selfMeaning,
    weekdayWeight,
    exposureHistory,
    date,
    recent3dFreq,
    avoidTopics,
  );
  if (selfQuestion) result.push(selfQuestion);

  // 5. 昨日未完线索 follow-up（最多 1 题）
  if (yesterdayUnresolvedMemories.length > 0 && result.length < MAX_QUESTIONS) {
    const followUps = generateFollowUpQuestions(yesterdayUnresolvedMemories, avoidTopics);
    for (const f of followUps) {
      if (result.length < MAX_QUESTIONS) {
        result.push(f);
      }
    }
  }

  // 6. 回顾期额外加 1 题
  if (isReviewPeriod && result.length < MAX_QUESTIONS) {
    const coveredDims = new Set(result.map((q) => q.dimension));
    const allDims = Object.keys(weekdayWeight) as DimensionCode[];
    const extraDim = allDims.find((d) => !coveredDims.has(d) && !avoidTopics.includes(d));
    if (extraDim) {
      const extraQuestion = selectQuestionFromDimensions(
        [extraDim],
        weekdayWeight,
        exposureHistory,
        date,
        recent3dFreq,
        avoidTopics,
      );
      if (extraQuestion) result.push(extraQuestion);
    }
  }

  // 确保至少 4 题，最多 6 题
  return result.slice(0, MAX_QUESTIONS);
}

/**
 * 判断是否为回顾期（周日或月末）
 */
export function isReviewPeriod(dateStr: string): boolean {
  const date = new Date(dateStr);
  const weekday = date.getDay();
  if (weekday === 0) return true;
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  if (date.getDate() === lastDay) return true;
  return false;
}

export { MIN_QUESTIONS, MAX_QUESTIONS, SAME_QUESTION_COOLDOWN_DAYS };
