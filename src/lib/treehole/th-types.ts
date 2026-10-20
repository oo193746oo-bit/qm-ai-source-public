// QM 情绪树洞 v2.0 - 类型定义
// 所有类型命名使用简体中文语境下的 PascalCase

/** 11 个关心维度的代码 */
export type DimensionCode =
  | "VAL" // 情绪色调
  | "ENE" // 睡眠与身体能量
  | "COG" // 认知负荷
  | "MOT" // 动力与行动
  | "SELF" // 自我关系
  | "INT" // 亲密关系
  | "FAM" // 家庭关系
  | "WORK" // 工作学习
  | "SOC" // 人际连接
  | "MEA" // 意义与方向
  | "RES"; // 恢复资源

/** 维度元信息 */
export interface DimensionMeta {
  code: DimensionCode;
  name: string;
  definition: string;
}

/** 单个每日问题 */
export interface DailyQuestion {
  id: string;
  dimension: DimensionCode;
  question: string;
  options: string[];
  /** 是否为 follow-up 题（来自昨日未完线索） */
  isFollowUp?: boolean;
  /** follow-up 对应的原始记忆 ID */
  followUpSourceId?: string;
}

/** 单题回答 */
export interface QuestionAnswer {
  questionId: string;
  dimension: DimensionCode;
  question: string;
  answer: string;
  skipped?: boolean;
  answeredAt: string; // ISO date
}

/** 每日 check-in 记录 */
export interface DailyCheckin {
  date: string; // YYYY-MM-DD
  questions: DailyQuestion[];
  answers: QuestionAnswer[];
  completed: boolean;
  startedAt: string;
  completedAt?: string;
  /** 用户今日不想讨论的主题 */
  avoidTopics: DimensionCode[];
}

/** 日记条目 */
export interface DiaryEntry {
  date: string; // YYYY-MM-DD
  text: string;
  charCount: number;
  createdAt: string;
  updatedAt: string;
  /** 草稿状态 true = 未正式提交 */
  isDraft: boolean;
  /** 是否请求了回信 */
  letterRequested: boolean;
}

/** 小酷回信 */
export interface XiaokuLetter {
  date: string; // YYYY-MM-DD
  text: string;
  charCount: number;
  dailySentence: string;
  createdAt: string;
  /** 危机标记 - 若为 true 则走安全流程回信 */
  isCrisis: boolean;
  crisisLevel?: "direct" | "indirect";
}

/** 记忆层级 */
export type MemoryLevel = "L0" | "L1" | "L2" | "L3" | "L4";

/** 敏感度等级 */
export type SensitivityLevel = "low" | "medium" | "high" | "critical";

/** 单条记忆 */
export interface TreeholeMemory {
  id: string;
  level: MemoryLevel;
  /** 用户明确说过的事实 */
  fact: string;
  /** AI 的推断或假设，单独存储，不混入事实 */
  aiHypothesis?: string;
  sourceDate: string; // YYYY-MM-DD
  sourceType: "checkin" | "diary" | "letter" | "user_explicit" | "bridge";
  sensitivity: SensitivityLevel;
  /** 0-1，AI 对这条记忆事实性的置信度 */
  confidence: number;
  /** 过期时间戳，null 表示长期（仅 L3 用户授权后） */
  expiryAt: string | null;
  /** 用户是否可编辑 */
  userEditable: boolean;
  /** 关联维度 */
  dimensions: DimensionCode[];
  /** 是否为未完线索 */
  isUnresolvedThread?: boolean;
  /** 用户明确标记的重要性 0-1 */
  explicitImportance?: number;
  /** 出现次数（用于 recurrence 排序） */
  recurrenceCount?: number;
  /** 同意范围 */
  consentScope: string;
}

/** Context Capsule - 树洞与自由对话之间的摘要桥梁 */
export interface ContextCapsule {
  date: string; // YYYY-MM-DD
  moodSummary: string;
  energySummary: string;
  topThemes: string[]; // <=5
  unresolvedThreads: string[]; // <=3
  userSelectedQuote?: string;
  trend7d?: string;
  consentScope: string;
  expiresAt: string;
}

/** 题目曝光记录（用于14天去重） */
export interface QuestionExposure {
  questionId: string;
  shownAt: string; // YYYY-MM-DD
  answered: boolean;
  skipped: boolean;
  avoidToday: boolean;
}

/** 7天/30天趋势数据点 */
export interface TrendDataPoint {
  date: string;
  /** 情绪色调分值 1-5 (1很沉 5明亮) */
  moodScore?: number;
  /** 能量分值 1-5 */
  energyScore?: number;
  /** 睡眠分值 1-5 */
  sleepScore?: number;
  /** 动力分值 1-5 */
  motivationScore?: number;
  /** 当天主题标签 */
  themes: string[];
  hasDiary: boolean;
  hasLetter: boolean;
}

/** 趋势汇总 */
export interface TrendSummary {
  period: "7d" | "30d";
  points: TrendDataPoint[];
  /** 主题出现频率排名 */
  themeFrequency: { theme: string; count: number }[];
  /** 日记天数 */
  diaryDays: number;
  /** 叙事式总结（非诊断） */
  narrative: string;
}

/** 一日完整记录 */
export interface DailyRecord {
  date: string;
  checkin?: DailyCheckin;
  diary?: DiaryEntry;
  letter?: XiaokuLetter;
  dailySentence?: string;
}

/** 草稿状态 */
export interface DiaryDraft {
  date: string;
  text: string;
  savedAt: string;
}

/** 存储键名前缀 */
export const STORAGE_KEYS = {
  DAILY_RECORDS: "qm_treehole_records",
  MEMORIES: "qm_treehole_memories",
  QUESTION_EXPOSURE: "qm_treehole_exposure",
  CONTEXT_CAPSULE: "qm_treehole_capsule",
  DIARY_DRAFT: "qm_treehole_draft",
  SETTINGS: "qm_treehole_settings",
} as const;

/** 用户设置 */
export interface TreeholeSettings {
  /** 长期记忆是否开启（默认关闭，需 opt-in） */
  longTermMemoryEnabled: boolean;
  /** 树洞内容是否允许摘要注入自由对话 */
  bridgeToChatEnabled: boolean;
  /** 位置授权（天气用） */
  weatherAuthorized: boolean;
}

export const DEFAULT_SETTINGS: TreeholeSettings = {
  longTermMemoryEnabled: false,
  bridgeToChatEnabled: true,
  weatherAuthorized: false,
};
