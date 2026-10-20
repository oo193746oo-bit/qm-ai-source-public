// QM Big Five 60 | 大五人格特质测评 v3.0 — 类型定义
// license_status: unlicensed
// norm_status: unapproved

// ===== 维度代码 =====
export type BFDimensionCode = 'O' | 'C' | 'E' | 'A' | 'N';

// ===== 题库 =====
export interface BFQuestion {
  id: string;        // 题目编号，如 Q01
  text: string;      // 题目文本（简体中文）
  dimension: BFDimensionCode; // 所属维度
  reverse: boolean;  // 是否反向计分
  facet?: string;    // 可选：子面标签
}

export interface BFQuestionBank {
  version: string;           // 'v3.0'
  name: string;              // 'QM Big Five 60'
  fullTitle: string;         // 'QM Big Five 60｜大五人格特质测评'
  license_status: 'unlicensed' | 'approved'; // 授权状态
  license_note: string;      // 授权说明
  totalQuestions: number;    // 60
  scale: '1-5';              // 5点计分
  dimensions: BFDimensionCode[];
  questions: BFQuestion[];
}

// ===== 五维内容标准 =====
export interface BFDimensionContent {
  code: BFDimensionCode;
  name_cn: string;      // 中文名称
  name_en: string;      // 英文全称
  short_en: string;     // 英文缩写
  color: string;        // 维度辅助色（QM紫体系）
  daily_meaning: string; // 日常意义
  life_scenes: string[]; // 至少2个生活场景
  strength_in_context: string; // 情境资源（高分端）
  cost_in_context: string;     // 情境成本（高分端）
  low_strength_in_context: string; // 情境资源（低分端）
  low_cost_in_context: string;     // 情境成本（低分端）
  observation_direction: string;    // 一个观察方向
  intensity_bands: {
    low: string;       // <25 百分位（相对内部位置）
    mid_low: string;   // 25-50
    mid_high: string;  // 50-75
    high: string;      // >75
  };
}

// ===== 答题与原始分 =====
export interface BFAnswer {
  questionId: string;
  answer: number; // 1-5
  timestamp?: number; // 作答时间戳（ms）
}

export interface BFRawScores {
  O: number;
  C: number;
  E: number;
  A: number;
  N: number;
}

// ===== 连续分（百分制 0-100 内部位置）=====
export interface BFContinuousScores {
  O: number;
  C: number;
  E: number;
  A: number;
  N: number;
}

// ===== Profile Signature =====
export interface BFProfileSignature {
  highest_2: BFDimensionCode[];   // 最高两维（从高到低）
  lowest_2: BFDimensionCode[];    // 最低两维（从低到高）
  spread: number;                 // 最高-最低分差
  balance: number;                // 五维标准差（越低越平衡）
  extreme_dimensions: BFDimensionCode[]; // 极端维度（>80 或 <20）
  tension_pairs: string[];        // 张力双维组合（差异>40的维度对）
  norm_status: 'unapproved' | 'approved';
}

// ===== Response Quality =====
export interface BFResponseQuality {
  missing_items: number;          // 缺题数
  completion_rate: number;        // 完成率 0-1
  straight_lining: boolean;       // 直线作答检测
  straight_lining_score: number;  // 直线作答程度
  total_duration_ms: number;      // 总作答时长
  avg_duration_per_q_ms: number;  // 平均每题时长
  duration_flag: 'normal' | 'too_fast' | 'too_slow';
  reverse_consistency: number;    // 反向题一致性 0-1
  overall_flag: 'reliable' | 'caution' | 'low_quality';
  warnings: string[];
}

// ===== NORM_GATE =====
export interface BFNormGate {
  status: 'unapproved' | 'approved';
  reason: string;
  population?: string;
  percentile_data?: BFRawScores; // 仅 status=approved 时可用
  display_percentile: boolean;   // 是否显示人口百分位
}

// ===== 双维组合 =====
export interface BFPairNarrative {
  pair: string;           // 如 'O×C'
  dim1: BFDimensionCode;
  dim2: BFDimensionCode;
  scenes: string[];       // 场景标签
  narrative: string;      // 组合叙事
  caveat: string;         // 慎用提醒（可能/值得观察）
}

// ===== 模块池 =====
export type BFModuleId =
  | 'hero'
  | 'radar'
  | 'continuous_position'
  | 'profile_signature'
  | 'highest_two_cooperation'
  | 'lowest_two'
  | 'max_tension'
  | 'balance_dimension'
  | 'work'
  | 'learning'
  | 'intimacy'
  | 'friendship'
  | 'conflict'
  | 'boundaries'
  | 'decision_making'
  | 'procrastination'
  | 'creativity'
  | 'stress'
  | 'recovery'
  | 'misunderstood'
  | 'admired_people'
  | 'uncomfortable_env'
  | 'whisper'
  | 'story_mirror_people'
  | 'story_mirror_media'
  | 'seven_day_experiment'
  | 'chat_with_xiaoku'
  | 'save_image'
  | 'pdf_export'
  | 'share';

export interface BFModuleDef {
  id: BFModuleId;
  name: string;          // 模块中文名称
  category: 'core' | 'scene' | 'narrative' | 'action' | 'export';
  min_selection_reason?: string;
  weight: number;        // 默认权重（影响动态选择概率）
}

// ===== 耳语基础单元 =====
export interface BFWhisperUnit {
  id: string;
  category: 'single_dim' | 'pair' | 'scene' | 'context' | 'closing';
  dimension?: BFDimensionCode;    // single_dim 专用
  intensity_band?: 'low' | 'mid_low' | 'mid_high' | 'high';
  tone?: 'warm' | 'direct' | 'curious'; // 语气
  pair?: string;                  // pair 专用
  scene?: string;                 // scene 专用
  context_type?: 'age' | 'culture' | 'identity_safety' | 'transition'; // context 专用
  closing_type?: 'question' | 'experiment' | 'anti_stereotype'; // closing 专用
  content: string;       // 单元内容
}

// ===== Story Mirror - 人物 =====
export interface BFStoryMirrorPerson {
  id: string;
  name_cn: string;
  name_en: string;
  identity_bucket: string[];     // 身份标签（仅公开确认来源）
  identity_source_url?: string;  // 身份来源链接
  culture_region: string;        // 文化区域
  age_generation: string;        // 年代
  field: string;                 // 领域
  public_story_summary: string;  // 公开行为故事摘要
  behavior_tags: string[];       // 公开行为标签
  context_tags: string[];        // 情境标签
  possible_trait_connections: string[]; // 可能的特质连接（推测，非断言）
  trait_pair_connections: string[];    // 双维连接
  tension_tags: string[];        // 张力标签
  growth_tags: string[];         // 成长标签
  source_urls: string[];         // 资料来源
  review_status: 'public_ready' | 'pending_review' | 'corpus_gap';
  last_reviewed_at?: string;
  editorial_quality: number;     // 0-5 编辑质量分
}

// ===== Story Mirror - 影视 =====
export interface BFStoryMirrorMedia {
  id: string;
  title: string;          // 作品名称
  medium: 'film' | 'series' | 'animation';
  character_name?: string; // 角色名（可选）
  scene_description: string; // 场景描述
  behavior_pattern: string;  // 行为模式
  trait_connections: string[]; // 特质连接
  why_relevant: string;      // 为什么相关
  culture_region: string;
  editorial_quality: number;
}

// ===== 个性化 / opt-in =====
export interface BFOptInPersonalization {
  enabled: boolean;              // 默认 false
  age_band?: string;
  culture_background?: string;
  gender_identity?: string;
  current_focus?: string;        // 当前关注领域
}

// ===== 用户签名（耳语生成用）=====
export interface BFUserSignature {
  five_scores: BFContinuousScores;
  score_reliability: BFResponseQuality['overall_flag'];
  norm_status: 'unapproved' | 'approved';
  highest2: BFDimensionCode[];
  lowest2: BFDimensionCode[];
  tension_pairs: string[];
  age_band?: string;
  culture?: string;
  current_focus?: string;
  recent_content_history?: string[];
}

// ===== 完整结果 =====
export interface BFFullResult {
  version: string;
  license_status: 'unlicensed' | 'approved';
  norm_gate: BFNormGate;
  raw_scores: BFRawScores;
  continuous_scores: BFContinuousScores;
  profile_signature: BFProfileSignature;
  response_quality: BFResponseQuality;
  selected_modules: BFModuleId[];
  whisper_units: string[];       // 选中的耳语单元ID
  story_mirror_people_ids?: string[];
  story_mirror_media_ids?: string[];
  generated_at: string;
}

// ===== 转介信息 =====
export interface BFCrisisReferral {
  org_name: string;      // 'QM上海酷儿心理咨询中心'
  hotline: string;       // '15001930070'
  wechat: string;        // ''
  note: string;          // 安全提示
}

export const CRISIS_REFERRAL: BFCrisisReferral = {
  org_name: 'QM上海酷儿心理咨询中心',
  hotline: '15001930070',
  wechat: '',
  note: '如果你正经历强烈的情绪困扰或危机，请联系专业心理支持资源。',
};
