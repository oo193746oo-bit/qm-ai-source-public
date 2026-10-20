// QM 阿德勒指数 v4.0 — 类型定义
// assessment_id: 'adler-index'
// 覆盖 DS2 v3.0 结果体验层，保留 24 题 / 4 维 / 原始程序计分
// RAW_ASSESSMENT_READ_ONLY = true
// norm_status = 'unapproved'

// ===== 4 个核心维度 =====
export type DimensionCode = 'A' | 'B' | 'C' | 'D';

export const DIMENSION_ORDER: DimensionCode[] = ['A', 'B', 'C', 'D'];

export const DIMENSION_NAMES: Record<DimensionCode, string> = {
  A: '选择与行动感',
  B: '课题与边界感',
  C: '勇气与成长感',
  D: '连接与共同体感',
};

export const DIMENSION_SHORT: Record<DimensionCode, string> = {
  A: '选择行动',
  B: '课题边界',
  C: '勇气成长',
  D: '连接共同体',
};

export const DIMENSION_COLORS: Record<DimensionCode, string> = {
  A: '#8B6FD1',
  B: '#6B8AC9',
  C: '#9B6BC9',
  D: '#C96B9A',
};

// QM 品牌主色
export const QM_BRAND_COLOR = '#6B4C9A';

// ===== 题目 =====
export interface AdlerQuestion {
  id: string;
  text: string;
  dimension: DimensionCode;
}

// ===== 维度画像 =====
export interface DimensionProfile {
  code: DimensionCode;
  name: string;
  shortName: string;
  description: string;
  color: string;
  adlerianConcepts: string[]; // 关联阿德勒概念
  whatShowsUp: string[];      // 当它显现时（3-5条）
  possibleResources: string[]; // 可能的资源（3-5条）
  possibleCosts: string[];    // 可能的代价（3-5条）
  commonScenes: string[];     // 常见场景（3-5条）
  observationQuestions: string[]; // 观察问题（3-5条）
}

// ===== 评分结果 =====
export interface DimensionScore {
  dimension: DimensionCode;
  score: number;        // 0-100 连续位置（不是百分位）
  rawAverage: number;   // 原始平均分 0-4
}

export interface ScoringResult {
  assessmentId: 'adler-index';
  questionnaireVersion: string;
  rawScores: Record<DimensionCode, number>; // 0-100 连续位置
  dimensionScores: DimensionScore[];
  sortedScores: DimensionScore[]; // 从高到低排序
  top2: DimensionScore[];
  bottom2: DimensionScore[];
  spread: number;          // 最高分 - 最低分
  balance: number;         // 标准差（离散程度）
  ties: string[];          // 并列维度（差 ≤3 分）
  headline: string;        // 生活风格 Headline（只作标题，不是定型）
  responseQuality: ResponseQuality;
}

export interface ResponseQuality {
  valid: boolean;
  straightLineScore: number; // 相同答案比例
  variance: number;
  completionRate: number;
  flags: string[];
}

// ===== Profile Signature =====
export interface ProfileSignature {
  scores4: Record<DimensionCode, number>;
  top2: DimensionCode[];
  bottom2: DimensionCode[];
  ties: string[];
  spread: number;
  balance: number;
  pairPatterns: PairPatternResult[];
  currentLifeTask: LifeTaskCode;
  currentContext: SceneCode;
  responseQuality: ResponseQuality;
  recentContentHistory?: string[];
  signatureHash: string;
}

// ===== 6 组 Pair Engine =====
export type PairCode = 'AB' | 'AC' | 'AD' | 'BC' | 'BD' | 'CD';

export type PairCategory =
  | 'synergy'               // 协同
  | 'conditional_tension'   // 条件性张力
  | 'compensation'          // 补偿
  | 'context_switch';       // 情境切换

export interface PairDefinition {
  pair: PairCode;
  dimA: DimensionCode;
  dimB: DimensionCode;
  name: string;
  categories: {
    synergy: PairCategoryDesc;
    conditional_tension: PairCategoryDesc;
    compensation: PairCategoryDesc;
    context_switch: PairCategoryDesc;
  };
  typicalScenes: SceneCode[];
  observation: string;
}

export interface PairCategoryDesc {
  label: string;
  description: string;
  whatItLooksLike: string[];
  possibleResources: string[];
  possibleTensions: string[];
  encouragement: string;
}

export interface PairPatternResult {
  pair: PairCode;
  category: PairCategory;
  confidence: number; // 0-1
  evidence: string;
}

// ===== 7 个阿德勒 Lens =====
export type LensCode =
  | 'belonging'
  | 'contribution'
  | 'encouragement'
  | 'life_tasks'
  | 'goal_orientation'
  | 'private_logic'
  | 'safeguarding_tendencies'
  | 'meaning'
  | 'courage'
  | 'identity'
  | 'forgiveness'
  | 'resilience'
  | 'humor'
  | 'authenticity'
  | 'self_compassion'
  | 'perseverance';

export interface AdlerianLens {
  code: LensCode;
  name: string;
  description: string;
  keyQuestions: string[];
  relatedDimensions: DimensionCode[];
  isHypothetical: boolean; // Private Logic / Goal Orientation 为 true
}

// ===== 16 类场景 =====
export type SceneCode =
  | 'friendship'       // 友谊
  | 'intimacy'         // 亲密
  | 'family'           // 家庭
  | 'community'        // 社群
  | 'work'             // 工作
  | 'study'            // 学习
  | 'conflict'         // 冲突
  | 'failure'          // 失败
  | 'procrastination'  // 拖延
  | 'boundary'         // 边界
  | 'asking_help'      // 求助
  | 'rejection'        // 被拒绝
  | 'public_expression' // 公开表达
  | 'identity_belonging' // 身份与归属
  | 'life_transition'  // 人生转折
  | 'meaning_direction' // 意义与方向
  | 'heartbreak'       // 心碎
  | 'self';            // 自我

export interface SceneDefinition {
  code: SceneCode;
  name: string;
  icon: string;
  description: string;
  keyDimensions: DimensionCode[];
  keyLenses: LensCode[];
  commonPatterns: string[];
  encouragement: string;
  reflectionQuestion: string;
}

// ===== Life Tasks =====
export type LifeTaskCode =
  | 'friendship'
  | 'work'
  | 'love'
  | 'self'
  | 'community'
  | 'study'
  | 'family'
  | 'identity';

export interface LifeTask {
  code: LifeTaskCode;
  name: string;
  description: string;
  relatedDimensions: DimensionCode[];
}

// ===== 结果模块池 (36 个) =====
export type ModuleCode =
  | 'hero_headline'
  | 'four_d_compass'
  | 'adlerian_profile_table'
  | 'belonging_agency_map'
  | 'acceptance_purpose_map'
  | 'six_pair_matrix'
  | 'top_three_pairs'
  | 'life_tasks_map'
  | 'encouragement_map'
  | 'context_heatmap'
  | 'seven_lenses_overview'
  | 'private_logic_reflection'
  | 'goal_orientation_hypothesis'
  | 'safeguarding_awareness'
  | 'purpose_alignment_table'
  | 'current_scene_1'
  | 'current_scene_2'
  | 'current_scene_3'
  | 'scene_friendship'
  | 'scene_intimacy'
  | 'scene_family'
  | 'scene_work'
  | 'scene_conflict'
  | 'scene_boundary'
  | 'scene_rejection'
  | 'scene_identity'
  | 'scene_meaning'
  | 'whispers_featured'
  | 'story_mirror_people'
  | 'story_mirror_media'
  | 'courage_micro_step'
  | 'seven_day_board'
  | 'action_tools'
  | 'retest_delta'
  | 'share_card'
  | 'pdf_dashboard';

export interface ResultModule {
  code: ModuleCode;
  name: string;
  category: 'core' | 'dynamics' | 'lens' | 'scene' | 'narrative' | 'action' | 'export';
  priority: number; // 0-10 显示优先级
  minScore?: number; // 最低相关度
  description: string;
}

// ===== 小酷耳语 =====
export interface WhisperUnit {
  id: string;
  category: 'dimension' | 'pair' | 'scene' | 'lens' | 'lifecycle' | 'safety' | 'encouragement';
  relatedDimensions?: DimensionCode[];
  relatedPair?: PairCode;
  relatedScene?: SceneCode;
  relatedLens?: LensCode;
  seeing: string;          // 看见处境
  pattern: string;         // Pattern
  possibleHypothesis: string; // 可能假设
  alternativeExplanations: string[]; // 替代解释（至少2种）
  encouragement: string;   // Encouragement
  microStep24h: string;    // 24 小时微行动
  question: string;        // 只问 1 个问题
  difficulty: 'gentle' | 'medium' | 'stretch'; // 难度分级
}

// ===== Story Mirror - 人物 =====
export interface PersonStory {
  id: string;
  nameCn: string;
  nameEn: string;
  field: string;
  cultureRegion: string;
  ageGeneration: string;
  identityBucket: string[];
  identitySourceUrl?: string;
  identityReviewStatus: 'verified' | 'self_disclosed' | 'not_relevant' | 'corpus_gap';
  publicStorySummary: string;
  storyEvidence: string;
  lifeTaskTags: LifeTaskCode[];
  adlerianLensTags: LensCode[];
  pairTags: PairCode[];
  contextTags: SceneCode[];
  counterpointTags: string[];
  growthTags: string[];
  sourceReferences: string[];
  reviewStatus: 'public_ready' | 'draft' | 'review';
  lastReviewedAt: string;
  contentWarning?: string;
}

// ===== Story Mirror - 影视/文学/纪录片 =====
export interface MediaStory {
  id: string;
  titleCn: string;
  titleEn: string;
  type: 'movie' | 'tv' | 'book' | 'documentary' | 'anime';
  cultureRegion: string;
  keyPlotDescription: string;
  storyEvidence: string;
  lifeTaskTags: LifeTaskCode[];
  adlerianLensTags: LensCode[];
  pairTags: PairCode[];
  contextTags: SceneCode[];
  counterpointTags: string[];
  sourceReferences: string[];
  reviewStatus: 'public_ready' | 'draft' | 'review';
  contentWarning?: string;
}

// ===== Quote Governance =====
export interface AdlerQuote {
  id: string;
  text: string;
  verified: boolean;
  sourceReference: string;
  paraphraseVersion: string; // 非 verified 时使用的释义版本
}

// ===== 行动工具 =====
export interface ActionTool {
  id: string;
  name: string;
  icon: string;
  description: string;
  relatedLens: LensCode[];
  relatedDimensions: DimensionCode[];
  steps: string[];
  prompt: string;
}

// ===== 7 天 Adlerian Board =====
export interface SevenDayBoard {
  title: string;
  description: string;
  focusLifeTask: LifeTaskCode;
  dailyStructure: {
    day: number;
    lifeTask: string;
    belonging: string;
    actionStep: string;
    acceptance: string;
    direction: string;
    observation: string;
  }[];
}

// ===== 可视化配置 =====
export interface VisualConfig {
  code: ModuleCode;
  name: string;
  type: 'compass' | 'table' | 'matrix' | 'map2d' | 'heatmap' | 'card' | 'board' | 'export';
  dimensions: DimensionCode[];
  hasGoldMedal: false; // 取消冠军金色
  hasGoodBadLabel: false; // 取消优势/弱项好坏暗示
  brandColor: string;
}

// ===== 导出配置 =====
export interface ExportConfig {
  png: { width: number; height: number; modules: ModuleCode[] };
  shareCard: { width: number; height: number; modules: ModuleCode[]; hideBottomDimension?: boolean };
  pdf: { format: string; modules: ModuleCode[] };
  privacyDefault: {
    hideName: boolean;
    hideUserId: boolean;
    hideAssessmentId: boolean;
    hideAnswers: boolean;
    hideIdentity: boolean;
    hideWeights: boolean;
    hideDatabaseIds: boolean;
    hideReviewUrls: boolean;
    hidePrompts: boolean;
  };
}

// ===== 品牌与机构信息 =====
export interface BrandInfo {
  aiName: string;
  aiFullName: string;
  brandColor: string;
  institution: string;
  hotlinePrimary: string;
  hotlineSecondary: string;
  wechatSupport: string;
  disclaimer: string;
}

// ===== 完整结果 =====
export interface AdlerFullResult {
  scoring: ScoringResult;
  profileSignature: ProfileSignature;
  pairPatterns: PairPatternResult[];
  currentLifeTask: LifeTaskCode;
  currentContext: SceneCode;
  selectedModules: ModuleCode[];
  selectedScenes: SceneCode[];
  featuredWhispers: WhisperUnit[];
  storyMirrorPeople: PersonStory[];
  storyMirrorMedia: MediaStory[];
  microStep: CourageMicroStep;
  sevenDayBoard: SevenDayBoard;
  timestamp: string;
  normStatus: 'unapproved';
  rawAssessmentReadOnly: true;
}

export interface CourageMicroStep {
  title: string;
  description: string;
  steps: {
    gentle: string;
    medium: string;
    stretch: string;
  };
  relatedDimension: DimensionCode;
  relatedLens: LensCode;
}

// ===== 多元身份 opt-in =====
export interface IdentityOptIn {
  provided: boolean;
  genderIdentity?: string;
  culturalBackground?: string;
  ageGroup?: string;
  currentLifeTask?: LifeTaskCode;
  currentFocusScene?: SceneCode;
  weight: number; // ≤ 0.03
}

// ===== Why You 算法链路结果 =====
export interface WhyYouResult {
  profile: string;
  pairPattern: string;
  currentLifeTask: string;
  storyEvidence: string;
  similarity: string;
  counterpoint: string;
  whyYou: string;
  difference: string;
  transfer: string;
  question: string;
}
