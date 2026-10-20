// QM 阿德勒指数 v4.0 — 导出配置与品牌信息
// PNG 1080×1920 / Share 1080×1350 / PDF A4
// 禁止前台展示：Prompt、内部权重、数据库 ID、审核 URL、身份字段、assessment_id、user_id、逐题答案

import type { ExportConfig, BrandInfo } from './adler-types';

// ===== 品牌与机构信息 =====
export const QM_BRAND = {
  aiName: '小酷',
  aiFullName: 'QM AI',
  brandColor: '#6B4C9A',
  institution: 'QM 上海酷儿心理咨询中心',
  hotlinePrimary: '15001930070',
  hotlineSecondary: '13601658763',
  wechatSupport: '',
  disclaimer:
    'QM 阿德勒指数是 QM AI 基于阿德勒个体心理学设计的自我探索工具。' +
    '分数反映的是你此刻的回答与生活倾向，也可能随着时间和情境变化。' +
    '本工具不是医疗或心理诊断工具，不用于疾病筛查或心理健康分级。' +
    '它是一个自我觉察的起点，不是终点。',
} as const;

// ===== 导出配置 =====
export const adlerExportConfig: ExportConfig = {
  png: {
    width: 1080,
    height: 1920,
    modules: [
      'hero_headline',
      'four_d_compass',
      'adlerian_profile_table',
      'whispers_featured',
      'courage_micro_step',
      'share_card',
    ],
  },
  shareCard: {
    width: 1080,
    height: 1350,
    modules: [
      'four_d_compass',
      'hero_headline',
      'courage_micro_step',
    ],
    // 分享卡隐藏最低维度
    hideBottomDimension: true,
  },
  pdf: {
    format: 'A4',
    modules: [
      'hero_headline',
      'four_d_compass',
      'adlerian_profile_table',
      'belonging_agency_map',
      'acceptance_purpose_map',
      'six_pair_matrix',
      'top_three_pairs',
      'life_tasks_map',
      'context_heatmap',
      'whispers_featured',
      'story_mirror_people',
      'story_mirror_media',
      'courage_micro_step',
      'seven_day_board',
      'action_tools',
    ],
  },
  privacyDefault: {
    hideName: true,           // 默认隐藏用户姓名
    hideUserId: true,         // 隐藏 user_id
    hideAssessmentId: true,   // 隐藏 assessment_id
    hideAnswers: true,        // 隐藏逐题答案
    hideIdentity: true,       // 隐藏身份字段
    hideWeights: true,        // 隐藏内部权重
    hideDatabaseIds: true,    // 隐藏数据库 ID
    hideReviewUrls: true,     // 隐藏审核 URL
    hidePrompts: true,        // 隐藏 Prompt
  },
};

// ===== 隐私规则 =====
// 前台禁止展示的内容列表
export const FRONTEND_FORBIDDEN_FIELDS = [
  'prompt',              // AI Prompt
  'internal_weights',    // 内部权重
  'database_id',         // 数据库 ID
  'review_url',          // 审核 URL
  'identity_fields',     // 身份字段
  'assessment_id',       // assessment_id
  'user_id',             // user_id
  'raw_answers',         // 逐题答案
  'norm_data',           // 常模数据
  'scoring_formula',     // 计分公式细节
  'content_moderation',  // 内容审核信息
] as const;

// ===== Raw Assessment Read Only =====
export const RAW_ASSESSMENT_READ_ONLY = true;

// ===== Norm Status =====
export const NORM_STATUS = 'unapproved' as const;

// ===== Response Quality Gate 阈值 =====
export const RESPONSE_QUALITY_THRESHOLDS = {
  minCompletionRate: 0.6,    // 至少完成 60%
  maxStraightLineScore: 0.9, // 直线作答不超过 90%
  minVariance: 0.05,         // 最小方差
} as const;

// ===== Quote Governance =====
// 只有 verified_quote + 可靠 source_reference 才允许直接引语+阿德勒署名
// 否则改成"阿德勒取向常强调……"释义

export interface AdlerQuoteItem {
  id: string;
  text: string;
  verified: boolean;
  sourceReference: string;
  paraphraseVersion: string;
}

// verified quotes（有可靠出处的直接引语）
export const verifiedAdlerQuotes: AdlerQuoteItem[] = [
  {
    id: 'q001',
    text: '所有的人生谎言，都是因为缺乏勇气。',
    verified: true,
    sourceReference: '阿尔弗雷德·阿德勒《自卑与超越》',
    paraphraseVersion: '阿德勒取向常强调，很多我们以为的"没办法"，其实可能和勇气有关——不是说你不够勇敢，而是说勇气是一种可以练习的能力。',
  },
  {
    id: 'q002',
    text: '意义不是被找到的，而是被赋予的。',
    verified: true,
    sourceReference: '阿尔弗雷德·阿德勒《自卑与超越》',
    paraphraseVersion: '阿德勒取向常说，意义不是等出来的，是活出来的——你在生活中投入了什么，你就会获得什么样的意义感。',
  },
  {
    id: 'q003',
    text: '共同体感觉，是心理健康的晴雨表。',
    verified: true,
    sourceReference: '阿尔弗雷德·阿德勒个体心理学核心概念',
    paraphraseVersion: '阿德勒取向常强调，一个人感受归属和连接的能力，和心理健康有很密切的关系。',
  },
];

// 非 verified 的释义模板（默认使用）
export const adlerParaphraseTemplates = [
  '阿德勒取向常强调，每个人都在以自己的方式寻找归属感和价值感。',
  '在阿德勒的视角里，行为背后总有一个目标——即使我们自己可能没有意识到。',
  '阿德勒取向认为，人的问题大多和关系有关，解决也需要在关系中发生。',
  '阿德勒常说，课题分离不是冷漠，而是对自己和他人的尊重。',
  '阿德勒取向相信，人有选择的能力——即使在最困难的处境中。',
  '在阿德勒看来，勇气不是没有恐惧，而是即使害怕仍然愿意去做。',
  '阿德勒取向常说，鼓励是让人看见自己已经拥有的资源，而不是告诉你要更努力。',
];

// Quote Governance：根据 verified 状态返回合适的引用方式
export function formatQuote(quote: AdlerQuoteItem): string {
  if (quote.verified && quote.sourceReference) {
    return `"${quote.text}" —— 阿尔弗雷德·阿德勒（${quote.sourceReference}）`;
  }
  return quote.paraphraseVersion;
}

// 获取随机释义（用于日常鼓励中）
export function getRandomParaphrase(): string {
  const idx = Math.floor(Math.random() * adlerParaphraseTemplates.length);
  return adlerParaphraseTemplates[idx];
}

// ===== 热线与危机资源 =====
// 注意：只展示 QM 官方热线，禁止 400 号码、120/110、北京心理危机中心等
export const crisisResources = {
  primaryHotline: QM_BRAND.hotlinePrimary,
  secondaryHotline: QM_BRAND.hotlineSecondary,
  wechatSupport: QM_BRAND.wechatSupport,
  institution: QM_BRAND.institution,
  note: '如果你正在经历心理危机，请及时联系专业心理师或上述资源寻求帮助。',
} as const;

// 品牌合规检查清单
export const BRAND_COMPLIANCE_CHECKLIST = [
  'AI 自称"小酷"，首次自我介绍"QM AI"',
  '品牌主色 #6B4C9A',
  '唯一推荐机构：QM 上海酷儿心理咨询中心',
  '热线 15001930070（主）/ 13601658763（备）',
  '微信客服 ',
  '禁止 400 号码、120/110、北京心理危机中心、任何外部机构',
  '禁止真实心理师姓名',
  '用户可见术语用"心理师"不是"咨询师"',
  '所有用户可见文案使用简体中文',
  '测评是自我觉察工具，不是诊断；不贴疾病标签、不做人格定型',
] as const;
