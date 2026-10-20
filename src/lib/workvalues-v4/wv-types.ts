/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// QM 职业价值观测评 v4.0 — 类型定义
// questionnaire_version: 'quick-v4.0'
// raw_read_only: true

// ===== 8 个价值维度 =====
export type DimensionCode =
  | 'achievement'
  | 'security'
  | 'autonomy'
  | 'growth'
  | 'relation'
  | 'meaning'
  | 'balance'
  | 'reward';

export const DIMENSION_ORDER: DimensionCode[] = [
  'achievement',
  'security',
  'autonomy',
  'growth',
  'relation',
  'meaning',
  'balance',
  'reward',
];

// 内在价值维度（用于 Intrinsic Index）
export const INTRINSIC_DIMENSIONS: DimensionCode[] = [
  'achievement',
  'autonomy',
  'growth',
  'meaning',
];

// 外在价值维度（用于 Extrinsic Index）
export const EXTRINSIC_DIMENSIONS: DimensionCode[] = [
  'security',
  'reward',
];

// 生活/关系维度（单独呈现，不归入内外）
export const LIFE_RELATION_DIMENSIONS: DimensionCode[] = [
  'balance',
  'relation',
];

// ===== 题目 =====
export interface WVQuestion {
  id: string;
  text: string;
  dimension: DimensionCode;
  reverse?: boolean;
}

// ===== 维度内容标准 =====
export interface DimensionProfile {
  code: DimensionCode;
  name: string;      // 中文名
  shortName: string; // 短名称
  description: string;
  color: string;     // QM 品牌色系
  category: 'intrinsic' | 'extrinsic' | 'life' | 'relation';
  valueMap: {
    x: number; // -1 内在 → 1 外在
    y: number; // -1 自我导向 → 1 关系/社会导向
  };
  whatMatters: string[];      // 在意什么（3-5条）
  whenSatisfied: string[];    // 被满足时的感受（3-5条）
  whenMissing: string[];      // 长期缺失时的感受（3-5条）
  workScenes: string[];       // 典型工作场景（3-5条）
  observationQuestions: string[]; // 观察问题（3-5条）
}

// ===== 评分结果 =====
export interface DimensionScore {
  dimension: DimensionCode;
  score: number;        // 0-100 连续分
  rawAverage: number;   // 原始平均分 1-5
  percentile?: number;  // 相对位置（可选，不作常模）
}

export interface ScoringResult {
  questionnaireVersion: string; // 'quick-v4.0'
  rawScores: Record<DimensionCode, number>; // 0-100
  dimensionScores: DimensionScore[];
  sortedScores: DimensionScore[]; // 从高到低排序
  top3: DimensionScore[];
  bottom2: DimensionScore[];
  intrinsicIndex: number;  // 0-100 独立指数
  extrinsicIndex: number;  // 0-100 独立指数
  normalizedShare?: {      // 可选归一化占比
    intrinsic: number;     // %
    extrinsic: number;     // %
    formula: string;       // 透明公式说明
  };
  spread: number;          // 最高分 - 最低分
  balance: number;         // 标准差（离散程度）
  profileSignature: string; // 一句话 Profile
  responseQuality: ResponseQuality;
}

export interface ResponseQuality {
  valid: boolean;
  straightLineScore: number; // 相同答案比例
  variance: number;
  completionRate: number;
  flags: string[];
}

// ===== 28 组 Value Pair Matrix =====
export type PairCategory = 'synergy' | 'tradeoff' | 'conditional_tension';

export interface ValuePair {
  pair: [DimensionCode, DimensionCode];
  category: PairCategory;
  description: string;       // 组合特征描述
  synergyWhen: string;       // 何时协同
  tensionWhen: string;       // 何时冲突
  typicalScenarios: string[]; // 典型职业场景
  observation: string;       // 一个观察
}

// ===== Trade-off 第二层（可选）=====
export type TradeoffStatus = 'must_have' | 'nice_to_have' | 'deal_breaker' | 'negotiable';

export interface TradeoffQuestion {
  id: string;
  dimensionA: DimensionCode;
  dimensionB: DimensionCode;
  scenario: string;  // 情境描述
}

export interface TradeoffResult {
  completed: boolean;
  mustHave: DimensionCode[];
  niceToHave: DimensionCode[];
  dealBreaker: DimensionCode[];
  negotiable: DimensionCode[];
  forcedChoicePattern: Record<string, DimensionCode>; // pair_id → 选择的维度
}

// ===== 职业场景 =====
export type SceneCode =
  | 'job_search'      // 求职
  | 'offer'           // offer选择
  | 'onboarding'      // 入职
  | 'promotion'       // 晋升
  | 'transfer'        // 转岗
  | 'career_change'   // 转行
  | 'entrepreneur'    // 创业/自由职业
  | 'remote'          // 远程工作
  | 'salary'          // 薪资谈判
  | 'team_conflict'   // 团队冲突
  | 'burnout'         // 倦怠
  | 'work_family';    // 工作家庭

export interface CareerScene {
  code: SceneCode;
  name: string;
  icon: string;
  description: string;
  keyValues: DimensionCode[]; // 该场景核心价值维度
  guidance: string;           // 通用指导
  valueSpecific: Partial<Record<DimensionCode, string>>; // 按维度的具体建议
  reflectionQuestions: string[];
}

// ===== Work Environment Fit =====
export type EnvParamCode =
  | 'autonomy'
  | 'feedback_speed'
  | 'stability'
  | 'income_upside'
  | 'collaboration_density'
  | 'innovation_space'
  | 'social_impact'
  | 'time_boundary';

export interface EnvParameter {
  code: EnvParamCode;
  name: string;
  description: string;
  lowLabel: string;   // 低分端描述
  highLabel: string;  // 高分端描述
  mappedFrom: DimensionCode[]; // 映射自哪些价值维度
}

export interface EnvFitResult {
  params: Record<EnvParamCode, number>; // 0-100
  interpretation: string;
  jdChecklist: string[]; // 看 JD 时的检查清单
}

// ===== 结果模块池 =====
export type ModuleCode =
  | 'hero'
  | 'radar'
  | 'ranking'
  | 'dual_index'
  | 'value_map'
  | 'top3_cards'
  | 'bottom2'
  | 'profile_signature'
  | 'pair_matrix'
  | 'top_synergy'
  | 'top_tension'
  | 'must_have_table'
  | 'env_fit'
  | 'scene_job_search'
  | 'scene_offer'
  | 'scene_promotion'
  | 'scene_career_change'
  | 'scene_salary'
  | 'scene_team'
  | 'scene_burnout'
  | 'scene_work_family'
  | 'scene_remote'
  | 'whispers'
  | 'story_people'
  | 'story_media'
  | 'seven_day'
  | 'interview_questions'
  | 'communication_script'
  | 'offer_comparison'
  | 'png_export'
  | 'pdf_export'
  | 'share_chat';

export interface ResultModule {
  code: ModuleCode;
  name: string;
  category: 'core' | 'dynamics' | 'scene' | 'narrative' | 'action' | 'export';
  requiredScore: number; // 显示优先级 0-10
  description: string;
}

// ===== 小酷耳语 =====
export interface WhisperUnit {
  id: string;
  category: 'dimension' | 'pair' | 'scene' | 'stage' | 'culture' | 'safety';
  relatedDimensions?: DimensionCode[];
  relatedScene?: SceneCode;
  relatedPair?: [DimensionCode, DimensionCode];
  careerStage?: 'entry' | 'mid' | 'senior' | 'transition';
  opening: string;   // 我看见……
  sceneContext: string; // 职业场景……
  dynamic: string;   // 两个价值如何合作/拉扯
  painPoint: string; // 现实痛点
  observation: string; // 一个观察
  question: string;  // 只问1个问题
  safetyNote?: string; // 安全语境
}

// ===== Story Mirror =====
export interface PersonStory {
  id: string;
  nameCn: string;
  nameEn?: string;
  field: string;
  cultureRegion: string;
  publicStorySummary: string;
  connectedValues: DimensionCode[]; // 2-3个
  difference: string;
  costLimitation: string;
  observation: string;
  reviewStatus: 'public_ready' | 'draft' | 'review';
  diversityTags?: string[];
  source?: string;
}

export interface MediaStory {
  id: string;
  title: string;
  type: 'movie' | 'tv' | 'book' | 'anime' | 'play';
  sceneDescription: string;
  valuePattern: DimensionCode[];
  whyRelevant: string;
  observation: string;
  reviewStatus: 'public_ready' | 'draft' | 'review';
  cultureRegion?: string;
}

// ===== 决策工具 =====
export interface InterviewQuestion {
  dimension: DimensionCode;
  question: string;
  purpose: string;
  whatToListen: string;  // 听什么信号
}

export interface NegotiationScript {
  scene: string;
  dimension: DimensionCode;
  opening: string;
  valueStatement: string;
  proposal: string;
  fallback: string;
}

export interface OfferComparisonItem {
  label: string;
  envParam: EnvParamCode;
  weight: number; // 来自价值观权重
}

export interface GreenRedFlags {
  dimension: DimensionCode;
  greenFlags: string[];
  redFlags: string[];
}

export interface CommunicationTemplate {
  situation: string;
  audience: 'manager' | 'hr' | 'colleague';
  template: string;
  valueAnchor: DimensionCode;
}

// ===== 7天实验 =====
export interface SevenDayPractice {
  title: string;
  description: string;
  focusDimension: DimensionCode;
  dailySteps: string[]; // 7步
  dailyQuestion: string;
}

// ===== 导出配置 =====
export interface ExportConfig {
  png: { width: number; height: number; modules: ModuleCode[] };
  shareCard: { width: number; height: number; modules: ModuleCode[] };
  pdf: { format: string; modules: ModuleCode[] };
  privacyDefault: {
    hideName: boolean;
    hideUserId: boolean;
    hideAssessmentId: boolean;
    hideAnswers: boolean;
    hideIdentity: boolean;
  };
}

// ===== 个性化 =====
export interface PersonalizationOptIn {
  culture: boolean;       // 文化背景 opt-in
  gender: boolean;        // 性别多元 opt-in
  careerStage: boolean;   // 职业阶段 opt-in
  currentFocus?: SceneCode; // 当前关注场景
}

// ===== 完整结果 =====
export interface WVFullResult {
  scoring: ScoringResult;
  tradeoff?: TradeoffResult;
  pairMatrix: ValuePair[];
  envFit: EnvFitResult;
  selectedModules: ModuleCode[];
  personalization: PersonalizationOptIn;
  timestamp: string;
}
