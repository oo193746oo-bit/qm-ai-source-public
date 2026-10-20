/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// QM AI 多元智能测评 v4.0 — 类型定义
// questionnaire_version: 'quick-v4.0'
// raw_read_only: true
// norm_status: 'unapproved'

// ===== 8 个智能维度 =====
export type DimensionCode =
  | 'linguistic'
  | 'logical'
  | 'spatial'
  | 'musical'
  | 'bodily'
  | 'interpersonal'
  | 'intrapersonal'
  | 'naturalist';

export const DIMENSION_ORDER: DimensionCode[] = [
  'linguistic',
  'logical',
  'spatial',
  'musical',
  'bodily',
  'interpersonal',
  'intrapersonal',
  'naturalist',
];

// 表达方向聚合（QM Visual Lens，非理论标准）
export type ExpressionDirection = 'symbolic' | 'object' | 'people';

export const EXPRESSION_DIRECTION_MAP: Record<DimensionCode, ExpressionDirection> = {
  linguistic: 'symbolic',
  logical: 'symbolic',
  spatial: 'object',
  musical: 'symbolic',
  bodily: 'object',
  interpersonal: 'people',
  intrapersonal: 'people',
  naturalist: 'object',
};

// ===== 题库版本 =====
export type QuestionnaireVersion = 'quick-v4.0' | 'enhanced-v4.0';
export const QUESTIONNAIRE_VERSION: QuestionnaireVersion = 'quick-v4.0';
export const RAW_READ_ONLY = true;
export const NORM_STATUS = 'unapproved' as const;

// ===== 题目 =====
export interface MIQuestion {
  id: string;
  text: string;
  dimension: DimensionCode;
  reverse?: boolean;
}

// ===== 维度内容标准 =====
export interface DimensionContent {
  code: DimensionCode;
  name: string;         // 中文名
  shortName: string;    // 短名称
  description: string;
  color: string;        // QM 品牌紫深浅色阶
  icon: string;
  whatItMayMean: {
    high: string[];     // 当前更常使用时可能意味着（3-5条，中性描述）
    low: string[];      // 本次较少显现时可能意味着（3-5条，非能力判断）
  };
  scenes: {
    learning: string;   // 学习场景表现
    work: string;       // 工作场景表现
    relationship: string; // 关系场景表现
  };
  resourceInContext: string[];  // 场景中的可能资源（3-5条）
  frictionInContext: string[];  // 场景中的可能摩擦（3-5条）
  bridgeStrategy: string[];     // 搭桥策略（3-5条）
  observationQuestion: string;  // 一个观察问题
}

// ===== 评分结果 =====
export interface DimensionScore {
  dimension: DimensionCode;
  score: number;         // 0-100 连续分（本次维度位置，非人口百分位）
  rawScore: number;      // 原始分 3-15
  rawAverage: number;    // 原始平均分 1-5
  manifestation: 'more_visible' | 'moderate' | 'less_visible'; // 当前显现程度
}

// ===== Response Quality =====
export interface ResponseQuality {
  missingQuestions: number;
  straightLineRisk: boolean;
  uniformAnswerRisk: boolean;
  allSameScore: boolean;
  answerSpread: number;  // 答案标准差
  responseTimeSeconds?: number;
  flags: string[];
}

// ===== Result Confidence Note =====
export interface ResultConfidenceNote {
  questionCount: number;
  perDimensionQuestions: number;
  tiesCount: number;
  spread: number;        // 维度间分数标准差
  responseQualityFlags: string[];
  noteText: string;      // 用户可见的解释文字
}

// ===== Profile Signature =====
export interface ProfileSignature {
  top3: DimensionCode[];
  bottom2: DimensionCode[];
  ties: Array<{ dimensions: DimensionCode[]; score: number }>;
  spread: number;          // 维度间分数标准差
  balance: number;         // 0-100，越高越均衡
  expressionLens: {
    symbolic: number;
    object: number;
    people: number;
  };
  pairPatterns: PairPattern[];
  contextFit: SceneFit[];
  responseQuality: ResponseQuality;
  resultConfidenceNote: ResultConfidenceNote;
  headline: string;        // 一句话 Profile Headline
}

// ===== 28 组 Pair Matrix =====
export type PairRelationType = 'synergy' | 'complement' | 'context_switch' | 'possible_friction';

export interface PairPattern {
  pair: [DimensionCode, DimensionCode];
  relation: PairRelationType;
  strength: number;        // 0-100
  description: string;
  examples: string[];
  bridgeIfFriction?: string;
}

export interface PairMatrixDefinition {
  pair: [DimensionCode, DimensionCode];
  relation: PairRelationType;
  synergyText: string;     // 协同描述
  complementText?: string; // 互补描述
  contextSwitchText?: string; // 场景切换描述
  frictionText?: string;   // 可能摩擦描述
  commonScenarios: string[];
  bridgeStrategy: string;
}

// ===== 14 类场景 =====
export type SceneCode =
  | 'reading_learning'
  | 'exam'
  | 'project_solving'
  | 'meeting'
  | 'public_expression'
  | 'team_collaboration'
  | 'independent_work'
  | 'creative_expression'
  | 'physical_practice'
  | 'travel_navigation'
  | 'emotional_processing'
  | 'relationship_communication'
  | 'leadership'
  | 'nature_outdoor';

export interface SceneDefinition {
  code: SceneCode;
  name: string;
  description: string;
  primaryIntelligence: DimensionCode;   // 主调用智能
  secondaryIntelligences: DimensionCode[]; // 辅助调用智能
  energySmoothWhen: string;             // 什么情况下感到顺畅
  frictionWhen: string;                 // 什么情况下感到费力
  bridgeTip: string;                    // 搭桥建议
}

export interface SceneFit {
  scene: SceneCode;
  fitScore: number;       // 0-100 场景适配度
  smoothIntelligences: DimensionCode[];
  frictionIntelligences: DimensionCode[];
  bridgeSuggestion: string;
}

// ===== Learning Mode / Expression / Environment =====
export type LearningMode =
  | 'verbal'       // 文字阅读
  | 'discussion'   // 讨论交流
  | 'visual'       // 图像/空间
  | 'logical'      // 逻辑推理
  | 'kinesthetic'  // 动手实践
  | 'rhythmic'     // 节奏/音乐
  | 'reflective'   // 内省反思
  | 'naturalistic';// 自然观察

export interface LearningModeMap {
  mode: LearningMode;
  name: string;
  relevantDimension: DimensionCode;
  fitLevel: 'high' | 'medium' | 'low';
  recipeSuggestion: string;
}

export type ExpressionChannel =
  | 'language'
  | 'sound'
  | 'image'
  | 'body'
  | 'relationship'
  | 'structure'
  | 'nature';

export interface ExpressionMapEntry {
  channel: ExpressionChannel;
  name: string;
  relevantDimension: DimensionCode;
  usageFrequency: 'high' | 'medium' | 'low';
  example: string;
}

export interface EnvironmentFitEntry {
  dimension: 'independence_collaboration' | 'abstract_concrete' | 'static_dynamic' | 'indoor_nature' | 'structured_open';
  name: string;
  leftLabel: string;
  rightLabel: string;
  position: number; // 0-100，0偏左，100偏右
  description: string;
}

export interface EnergyFrictionEntry {
  scene: SceneCode;
  smoothLevel: number;  // 0-100
  frictionLevel: number; // 0-100
  bridgeIntelligence: DimensionCode;
  bridgeStrategy: string;
}

// ===== 行动工具 =====
export interface LearningRecipe {
  id: string;
  title: string;
  description: string;
  steps: string[];
  bestFor: DimensionCode[];
}

export interface ProjectRoleCard {
  role: string;
  description: string;
  strengths: string[];
  watchOut: string[];
  bestFor: DimensionCode[];
}

export interface CommunicationTranslation {
  from: DimensionCode;
  to: DimensionCode;
  scenario: string;
  originalStyle: string;
  translationTip: string;
}

export interface SkillPracticeMenu {
  dimension: DimensionCode;
  level: 'beginner' | 'intermediate' | 'advanced';
  practices: string[];
}

export interface WeeklyExperiment {
  day: number;
  title: string;
  scene: string;
  tryThis: string;
  observe: string;
  alternativePath: string;
}

// ===== 模块池 =====
export type ModuleId =
  | 'hero'
  | 'radar'
  | 'profile_table'
  | 'top3_triangle'
  | 'top3_synergy_explanation'
  | 'bottom2'
  | 'profile_signature'
  | 'pair_matrix'
  | 'top_synergy'
  | 'complement'
  | 'context_switch'
  | 'possible_friction'
  | 'context_heatmap'
  | 'learning_mode_map'
  | 'expression_map'
  | 'environment_fit'
  | 'energy_friction'
  | 'selected_scenes'
  | 'whispers'
  | 'story_mirror_people'
  | 'story_mirror_media'
  | 'why_you_reasoning'
  | 'weekly_experiment'
  | 'learning_recipe'
  | 'project_role_card'
  | 'communication_translation'
  | 'skill_practice_menu'
  | 'result_confidence_note'
  | 'retest_change'
  | 'png_export'
  | 'pdf_export'
  | 'share_card'
  | 'chat_with_ku'
  | 'retest';

export interface ModuleDefinition {
  id: ModuleId;
  name: string;
  description: string;
  screen: 1 | 2 | 3 | 4 | 5;
  required: boolean;
  minDimensionalSupport: number; // 需要的最低维数支持
  category: 'core' | 'visual' | 'narrative' | 'action' | 'export';
}

// ===== 耳语 =====
export interface WhisperUnit {
  id: string;
  category:
    | 'single_dimension'
    | 'pair_combination'
    | 'top3_synergy'
    | 'scene'
    | 'life_domain'
    | 'identity_culture'
    | 'experiment'
    | 'open_question';
  dimension?: DimensionCode;
  intensity?: 'low' | 'mid_low' | 'mid_high' | 'high';
  tone?: 'gentle' | 'curious' | 'practical';
  pair?: [DimensionCode, DimensionCode];
  scene?: SceneCode;
  text: string;
  forbiddenWords: boolean; // 是否经过禁词检查
}

// ===== Story Mirror =====
export type IdentityBucket =
  | 'cis_man'
  | 'cis_woman'
  | 'trans_man'
  | 'trans_woman'
  | 'nonbinary_gender_diverse'
  | 'unknown_or_not_used';

export interface PeopleStoryMirror {
  id: string;
  name_cn: string;
  name_en: string;
  field: string;
  culture_region: string;
  age_generation?: string;
  identity_bucket: IdentityBucket;
  identity_source_url?: string;
  identity_review_status: 'verified' | 'unverified' | 'corpus_gap';
  public_story_summary: string;
  story_scene: string;
  behavior_tags: string[];
  universal_story_tags: string[];
  possible_intelligence_connections: DimensionCode[]; // 2-3
  pair_connections: Array<[DimensionCode, DimensionCode]>;
  context_tags: string[];
  tension_or_cost_tags: string[];
  growth_tags: string[];
  source_urls: string[];
  review_status: 'public_ready';
  last_reviewed_at: string;
  recent_exposure_key: string;
}

export type MediaType = 'movie' | 'tv' | 'documentary' | 'literature' | 'animation';

export interface MediaStoryMirror {
  id: string;
  title_cn: string;
  title_en: string;
  character_name: string;
  media_type: MediaType;
  year: number;
  story_scene_summary: string;
  key_scenes: string[];
  behavior_tags: string[];
  universal_story_tags: string[];
  possible_intelligence_connections: DimensionCode[];
  pair_connections: Array<[DimensionCode, DimensionCode]>;
  context_tags: string[];
  content_warnings: string[];
  source_urls: string[];
  review_status: 'public_ready';
}

export interface MirrorReasoningResult {
  story: string;
  match: string;           // 连接 2-3 维/组合
  whyYou: string;          // 为什么本次选中
  difference: string;      // 差异提醒
  transfer: string;        // 迁移场景
  observationQuestion: string; // 一个观察问题
}

// ===== 个人化选项 =====
export interface PersonalizationOptions {
  opt_in_example_personalization: boolean; // 默认 false
  gender_identity?: IdentityBucket;
  age_range?: string;
  culture_background?: string;
  current_focus?: string;   // 当前关注领域
}

// ===== 导出配置 =====
export interface ExportConfig {
  png: {
    width: number;
    height: number;
    includeBottom2: boolean;
    includeUserId: boolean;
    includeAnswers: boolean;
  };
  pdf: {
    format: 'A4';
    includeFullDashboard: boolean;
    includePrivateData: boolean;
  };
  shareCard: {
    width: number;
    height: number;
    showBottom2: boolean;
    showScoreDetails: boolean;
  };
  brandColor: string;
  brandName: string;
}

// ===== 完整结果 =====
export interface MIResult {
  questionnaireVersion: QuestionnaireVersion;
  normStatus: 'unapproved';
  scores: DimensionScore[];
  profileSignature: ProfileSignature;
  pairMatrix: PairPattern[];
  sceneFits: SceneFit[];
  learningModeMap: LearningModeMap[];
  expressionMap: ExpressionMapEntry[];
  environmentFit: EnvironmentFitEntry[];
  energyFriction: EnergyFrictionEntry[];
  selectedModules: ModuleId[];
  whispers: string[];
  storyMirror: {
    people: Array<PeopleStoryMirror & MirrorReasoningResult>;
    media: Array<MediaStoryMirror & MirrorReasoningResult>;
  };
  actionTools: {
    learningRecipes: LearningRecipe[];
    projectRoleCards: ProjectRoleCard[];
    communicationTranslations: CommunicationTranslation[];
    skillPracticeMenu: SkillPracticeMenu[];
    weeklyExperiment: WeeklyExperiment[];
  };
  exportConfig: ExportConfig;
  personalization: PersonalizationOptions;
}

// ===== 品牌常量 =====
export const QM_BRAND_COLOR = '#6B4C9A';
export const QM_BRAND_NAME = 'QM AI';
export const QM_AI_NAME = '小酷';
export const QM_HOTLINE = '15001930070';
export const QM_WECHAT = '';
export const QM_REFERRAL = 'QM 上海酷儿心理咨询中心';

// 禁词列表（用户可见文案中不得出现）
export const FORBIDDEN_WORDS = [
  '天生',
  '核心天赋',
  '你不在意人',
  '你最适合',
  '你不擅长',
  '超过多少的人',
  '超过 X% 的人',
  '咨询师',
  '400',
  '120',
  '110',
  '北京心理危机中心',
  'Susan',
  '陈瑜倩',
  'Candice',
  'Christy',
  'IQ最高',
  '最聪明',
  '最弱',
  '冠军',
  '金色',
];
