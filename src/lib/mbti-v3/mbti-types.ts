/**
 * QM 93题MBTI风格人格偏好测试 - 类型定义 v3.0
 *
 * 注意：本测试为 MBTI 风格的人格偏好探索工具，
 * 非官方 MBTI® 测评，licensed = false
 */

// ============================================================
// 基础类型
// ============================================================

export type Dimension = 'EI' | 'SN' | 'TF' | 'JP';

export type Pole = 'E' | 'I' | 'S' | 'N' | 'T' | 'F' | 'J' | 'P';

export type TypeCode =
  | 'ISTJ' | 'ISFJ' | 'INFJ' | 'INTJ'
  | 'ISTP' | 'ISFP' | 'INFP' | 'INTP'
  | 'ESTP' | 'ESFP' | 'ENFP' | 'ENTP'
  | 'ESTJ' | 'ESFJ' | 'ENFJ' | 'ENTJ';

export type ClarityLevel = 'borderline' | 'mild' | 'moderate' | 'clear' | 'strong';

export type ReviewStatus = 'source_verified' | 'editorial_reviewed';

export type TypeAttribution = 'popularly_associated' | 'self_reported' | 'documented';

// ============================================================
// 题库相关
// ============================================================

export interface MBTIQuestion {
  id: string;
  dimension: Dimension;
  question: string;
  options: [
    { text: string; direction: Pole },
    { text: string; direction: Pole }
  ];
  reverseScored?: boolean;
}

// ============================================================
// 评分相关
// ============================================================

export interface DimensionScore {
  dimension: Dimension;
  poleA: Pole;
  poleB: Pole;
  countA: number;
  countB: number;
  percentA: number;
  percentB: number;
  clarity: number;        // abs(percentA - percentB)
  clarityLevel: ClarityLevel;
  isBorderline: boolean;  // clarity < 20
  dominantPole: Pole;
  // 场景化描述
  scenario1: string;
  scenario2: string;
  nonFixedNote: string;
}

export interface MBTIScoreResult {
  typeCode: TypeCode;
  typeLabelCn: string;
  typeLabelEn: string;
  dimensions: Record<Dimension, DimensionScore>;
  borderlineDimensions: Dimension[];
  adjacentTypes: TypeCode[];
  totalQuestions: number;
  answeredQuestions: number;
}

// ============================================================
// 16型字典相关
// ============================================================

export interface TypeInfo {
  code: TypeCode;
  nameCn: string;
  nameEn: string;
  tagline: string;
  accentColor: string;
  imageKey: string;
  briefDescription: string;
}

// ============================================================
// 结果模块池相关
// ============================================================

export type ModuleCategory =
  | 'personality_narrative'
  | 'work_style'
  | 'learning_style'
  | 'relationship_pattern'
  | 'stress_reaction'
  | 'decision_style'
  | 'communication_style'
  | 'leadership'
  | 'creativity'
  | 'conflict_handling'
  | 'growth_direction'
  | 'shadow_side'
  | 'energy_management'
  | 'social_pattern'
  | 'life_philosophy'
  | 'emotional_pattern'
  | 'perfectionism'
  | 'adaptability'
  | 'self_awareness'
  | 'values'
  | 'intimacy'
  | 'team_role'
  | 'leisure_preference'
  | 'motivation_driver'
  | 'communication_advice'
  | 'development_advice';

export interface ResultModule {
  id: string;
  category: ModuleCategory;
  title: string;
  icon: string;
  content: string;
  applicableTypes: TypeCode[]; // 空数组表示全部适用
  priority: number; // 1-10, 越高越优先被选中
}

// ============================================================
// 小酷心理耳语相关
// ============================================================

export interface WhisperModule {
  id: string;
  typeCode: TypeCode;
  clarityMin?: number;
  clarityMax?: number;
  ageGroup?: string;
  culturalContext?: string;
  focusArea?: string;
  content: {
    seeing: string;       // 看见你
    scenario: string;     // 具体场景
    tension: string;      // 可能的拉扯
    growth: string;       // 成长视角
    question: string;     // 1个问题
  };
}

// ============================================================
// Story Mirror - 名人
// ============================================================

export interface CelebrityStory {
  id: string;
  typeCode: TypeCode;
  nameCn: string;
  nameEn: string;
  public_story_summary: string;
  connection_point: string;
  difference_reminder: string;
  takeaway: string;
  type_attribution: TypeAttribution;
  review_status: ReviewStatus;
  source?: string;
}

// ============================================================
// Story Mirror - 影视
// ============================================================

export interface MediaStory {
  id: string;
  typeCode: TypeCode;
  title: string;
  character?: string;
  scene_description: string;
  behavior_pattern: string;
  why_relevant: string;
}

// ============================================================
// 个性化相关
// ============================================================

export interface PersonalizationContext {
  optInExamplePersonalization: boolean;
  genderIdentity?: string;
  pronouns?: string;
  ageGroup?: string;
  currentConcern?: string;
  culturalBackground?: string;
  shownWhisperIds: string[];
}

// ============================================================
// 导出相关
// ============================================================

export type ExportFormat = 'png_long' | 'pdf_a4' | 'share_card';

export interface ExportConfig {
  format: ExportFormat;
  width: number;
  height: number;
  includeSensitiveInfo: boolean;
}

// ============================================================
// 完整报告
// ============================================================

export interface MBTIFullReport {
  scoreResult: MBTIScoreResult;
  typeInfo: TypeInfo;
  selectedModules: ResultModule[];
  whispers: WhisperModule[];
  celebrityStories: CelebrityStory[];
  mediaStories: MediaStory[];
  generatedAt: string;
  version: string;
  licensed: false;
  productName: string;
}
