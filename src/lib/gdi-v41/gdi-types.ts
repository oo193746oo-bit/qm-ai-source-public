/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// QM-GDI-48 v4.1 Type Definitions
// 性别多元指数 48题/8维 类型系统
// 研究知情版 · 非诊断 · 非身份判定

export type DimensionCode = 'IGS' | 'SDO' | 'EA' | 'CF' | 'GCC' | 'GAE' | 'SNA' | 'BR';

export interface QuestionItem {
  id: string;
  dimension: DimensionCode;
  text: string;
  reverse: boolean;
}

export interface DimensionInfo {
  code: DimensionCode;
  name: string;
  shortName: string;
  definition: string;
  highLabel: string;
  lowLabel: string;
  color: string;
}

export type AnswerValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 'N/A';

export interface AnswerMap {
  [questionId: string]: AnswerValue;
}

export interface DimensionScore {
  code: DimensionCode;
  name: string;
  validCount: number;
  totalCount: number;
  dimensionMean: number | null;
  plotScore: number | null;
  incomplete: boolean;
  items: {
    id: string;
    raw: AnswerValue;
    scored: number | null;
    valid: boolean;
  }[];
}

export type CompletionStatus = 'full' | 'partial' | 'insufficient';
export type SpeedFlag = 'normal' | 'fast' | 'very_fast';

export interface QualityGateResult {
  completionRate: number;
  completionStatus: CompletionStatus;
  answeredCount: number;
  totalCount: number;
  durationSeconds: number;
  speedFlag: SpeedFlag;
  longstringFlag: boolean;
  longstringLength: number;
}

export interface AssessmentProfile {
  scores: Record<DimensionCode, DimensionScore>;
  quality: QualityGateResult;
  plotScores: Record<DimensionCode, number | null>;
  answeredAt?: Date;
  durationSeconds: number;
}

export interface PairCombination {
  dimensions: [DimensionCode, DimensionCode];
  key: string;
  narratives: {
    highHigh: string;
    highLow: string;
    lowHigh: string;
    lowLow: string;
    mixed: string;
  };
}

export type ModuleId =
  | 'headline'
  | 'radar_chart'
  | 'dimension_details'
  | 'pair_narratives'
  | 'contextual_fluidity_map'
  | 'expression_authenticity_analysis'
  | 'gender_euphoria_moments'
  | 'social_norm_autonomy'
  | 'belonging_recognition'
  | 'safety_environment'
  | 'open_question'
  | 'story_mirror_people'
  | 'story_mirror_media'
  | 'ku_whispers'
  | 'exploration_actions'
  | 'result_disclaimer'
  | 'export_png'
  | 'export_pdf'
  | 'share_card'
  | 'chat_with_ku'
  | 'dimension_bar_chart'
  | 'fluidity_timeline'
  | 'expression_gauge'
  | 'belonging_network'
  | 'affirmation_timeline'
  | 'norm_autonomy_map'
  | 'pair_heatmap'
  | 'module_waterfall';

export interface ModuleDefinition {
  id: ModuleId;
  title: string;
  description: string;
  requiredDimensions?: DimensionCode[];
  conditionalShow?: (profile: AssessmentProfile) => boolean;
  priority: number;
  minScoreThreshold?: Partial<Record<DimensionCode, number>>;
  maxScoreThreshold?: Partial<Record<DimensionCode, number>>;
}

export interface Whisper {
  id: string;
  text: string;
  category: 'single_dimension' | 'pair' | 'context' | 'identity_culture' | 'open_question';
  dimension?: DimensionCode;
  dimensions?: DimensionCode[];
  context?: string;
  tone: 'gentle' | 'curious' | 'affirming' | 'reflective';
}

export interface StoryPerson {
  id: string;
  name: string;
  chineseName: string;
  field: string;
  description: string;
  behavioralThemes: string[];
  sourceUrls: string[];
  reviewStatus: 'public_ready' | 'draft' | 'needs_review';
  selfDisclosedIdentities?: string[];
  notes?: string;
}

export interface StoryMedia {
  id: string;
  title: string;
  chineseTitle: string;
  type: 'film' | 'tv' | 'literature' | 'documentary';
  year: number;
  description: string;
  themes: string[];
  contentWarnings: string[];
  behavioralMirrors: string[];
  reviewStatus: 'public_ready' | 'draft';
}

export type MirrorMatchType = 'behavioral' | 'thematic';

export interface MirrorMatchResult {
  item: StoryPerson | StoryMedia;
  type: MirrorMatchType;
  matchingThemes: string[];
  rationale: string;
}

export interface NarrativeResult {
  headline: string;
  summary: string;
  dimensionInsights: Record<DimensionCode, string>;
  pairInsights: string[];
}

export interface VisualizationConfig {
  id: string;
  type: string;
  title: string;
  dataKeys: string[];
  colorScheme: string;
}

export interface ExportOptions {
  format: 'png' | 'pdf' | 'share';
  includeCharts: boolean;
  includeWhispers: boolean;
  includeStoryMirror: boolean;
  language: 'zh-Hans';
}

// Assessment interface compatible with main app AssessmentInfo
export interface AssessmentInfo {
  id: string;
  title: string;
  subtitle: string;
  version: string;
  description: string;
  route: string;
  validated: boolean;
  normStatus: string;
  rawReadOnly: boolean;
  questionCount: number;
  dimensionCount: number;
  estimatedMinutes: string;
  likertScale: {
    min: number;
    max: number;
    labels: string[];
    naAllowed: boolean;
    naLabel: string;
  };
  qualityGate: {
    minCompletionFull: number;
    minCompletionPartial: number;
    veryFastSeconds: number;
    fastSeconds: number;
    longstringFlag: number;
  };
  brandColor: string;
  hotline: {
    primary: string;
    backup: string;
  };
  wechatSupport: string;
  referral: string;
}
