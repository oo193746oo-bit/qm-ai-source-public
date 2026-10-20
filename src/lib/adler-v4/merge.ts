// QM 阿德勒指数 v4.0 — 集成钩子
// 覆盖现有 adler-index 的结果体验层，保留 24 题计分
// assessment_id: 'adler-index'，slug 保持 adler-index，不新建 id
// RAW_ASSESSMENT_READ_ONLY = true
// norm_status = 'unapproved'

import type { AssessmentInfo } from '../assessments/data';
import { adlerQuestions24, QUESTIONNAIRE_VERSION } from './adler-questions-24';
import { adlerDimensions } from './adler-dimensions';
import { DIMENSION_ORDER, DIMENSION_NAMES, QM_BRAND_COLOR } from './adler-types';
import { MODULE_COUNT, MODULES_PER_RESULT_MIN } from './adler-module-pool';
import { VISUAL_COUNT } from './adler-visuals';
import { WHISPER_COUNT } from './adler-whispers';
import { PEOPLE_PUBLIC_READY } from './adler-story-people';
import { MEDIA_PUBLIC_READY } from './adler-story-media';

/**
 * v4.0 阿德勒指数测评定义（覆盖更新）
 * 兼容现有 AssessmentInfo 接口，同时包含 v4.0 专用扩展
 * 保留 24 题 / 4 维 / 原始程序计分
 * 重做结果体验层：文案、阿德勒辨识度、组合算法、可视化、Story Mirror、互动行动与导出
 */
export const adlerV4Assessment = {
  id: 'adler-index', // 覆盖更新，使用同一 ID
  title: '阿德勒指数',
  subtitle: 'v4.0 · Adlerian Self-Reflection Profile｜阿德勒取向自我探索画像',
  description:
    '这不是在测你是不是一个"够不够阿德勒"的人。' +
    '它只是想看看，当你面对选择、关系、自卑、失败和他人的目光时，' +
    '现在的你通常会怎么做。没有标准答案，请选择最接近"现在的你"的答案。',
  duration: '4-6 分钟',
  questionCount: 24,
  icon: '🌱',
  color: 'from-purple-500 to-purple-600',
  type: 'growth',
  questionnaireVersion: QUESTIONNAIRE_VERSION,
  rawAssessmentReadOnly: true,
  version: 'v4.0',
  normStatus: 'unapproved',
  dimensions: DIMENSION_ORDER.map((code) => ({
    code,
    name: DIMENSION_NAMES[code],
    description: adlerDimensions[code].description,
    color: adlerDimensions[code].color,
  })),
  questions: adlerQuestions24.map((q) => ({
    id: q.id,
    text: q.text,
    dimension: q.dimension,
  })),
  scoring: {
    min: 0,
    max: 100,
    labels: ['正在探索', '正在练习', '相对稳定'],
    scale: '0-4',
  },
  resultNote:
    'QM 阿德勒指数是 QM AI 基于阿德勒个体心理学设计的自我探索工具。' +
    '分数反映的是你此刻的回答与生活倾向，也可能随着时间和情境变化。' +
    '本工具不是医疗或心理诊断工具，不用于疾病筛查或心理健康分级。' +
    '0-100 是本次维度位置，不是人口百分位。',
  // v4.0 专用扩展
  v4Features: {
    assessmentId: 'adler-index',
    overlayMode: 'DS2_RESULT_EXPERIENCE_REPLACE',
    preserve: ['24题', '4维', '原始程序计分'],
    pairEngine: 6, // 6 组 Pair Engine
    pairCategories: ['synergy', 'conditional_tension', 'compensation', 'context_switch'],
    adlerianLenses: 7, // 7 个阿德勒 Lens
    hypotheticalLenses: ['private_logic', 'goal_orientation'],
    scenes: 16, // 16 类场景
    scenesPerResult: 6, // 每次至少 6 类
    whispers: WHISPER_COUNT, // 小酷耳语基础单元数
    storyMirrorPeople: PEOPLE_PUBLIC_READY,
    storyMirrorMedia: MEDIA_PUBLIC_READY,
    seedPeople: 12,
    seedMedia: 10,
    modulePool: MODULE_COUNT, // 36 个结果模块
    modulesPerResult: MODULES_PER_RESULT_MIN, // 每次 ≥ 20 个
    visualizations: VISUAL_COUNT, // 16 类可视化
    hasGoldMedal: false, // 取消冠军金色
    hasGoodBadLabel: false, // 取消优势/弱项好坏暗示
    brandColor: QM_BRAND_COLOR,
    actionTools: 7, // 7 个行动工具
    exportFormats: ['PNG 1080x1920', 'Share 1080x1350', 'PDF A4'],
    quoteGovernance: true,
    identityOptIn: true,
    identityWeightMax: 0.03, // 权重 ≤3%
    responseQualityGate: true,
    profileSignature: true,
    diversityPolicy: {
      identityOptInOnly: true,
      maxWeight: 0.03,
      publicFigureVerification: true,
      corpusGapLabel: true,
      minorityStressNotCourageFailure: true,
    },
    privacy: {
      hidePrompts: true,
      hideWeights: true,
      hideDatabaseIds: true,
      hideReviewUrls: true,
      hideIdentityFields: true,
      hideAssessmentId: true,
      hideUserId: true,
      hideRawAnswers: true,
    },
    disclaimer:
      '本测评是自我觉察工具，不是诊断；不贴疾病标签、不做人格定型。',
  },
  growthLevels: {
    dimension: { low: '正在探索', mid: '正在练习', high: '相对稳定' },
    total: { low: '起步探索', mid: '练习与重构', high: '较稳定运用' },
  },
  sevenDayPractice: {
    title: '7 天阿德勒练习',
    description: '根据你目前的生活任务，每天一个小行动。',
    steps: [],
  },
  disclaimer:
    'QM 阿德勒指数是 QM AI 基于阿德勒个体心理学设计的自我探索工具。' +
    '分数反映的是你此刻的回答与生活倾向，也可能随着时间和情境变化。' +
    '本工具不是医疗或心理诊断工具，不用于疾病筛查或心理健康分级。',
} as const;

/**
 * 将 v4.0 阿德勒指数覆盖更新到测评列表
 * @param existingAssessments 现有测评列表
 * @returns 覆盖更新后的测评列表
 *
 * 注意：v4.0 使用同一 ID 'adler-index'，覆盖 DS2 v3.0 的结果体验层。
 * 保留 24 题 / 4 维 / 原始程序计分。
 */
export function addAdlerV4(
  existingAssessments: AssessmentInfo[],
): AssessmentInfo[] {
  // 替换已有的 adler-index
  const index = existingAssessments.findIndex((a) => a.id === 'adler-index');

  if (index >= 0) {
    const updated = [...existingAssessments];
    updated[index] = adlerV4Assessment as unknown as AssessmentInfo;
    return updated;
  }

  // 如果不存在则添加
  return [...existingAssessments, adlerV4Assessment as unknown as AssessmentInfo];
}

/**
 * 单独获取 v4.0 阿德勒指数定义
 */
export function getAdlerV4() {
  return adlerV4Assessment;
}

/**
 * 验证 v4.0 模块完整性
 */
export function validateAdlerV4(): {
  questions: number;
  dimensions: number;
  version: string;
  features: Record<string, boolean | number>;
  normStatus: string;
  rawAssessmentReadOnly: boolean;
  ready: boolean;
} {
  const v4 = adlerV4Assessment as any;
  const features: Record<string, boolean | number> = {};

  if (v4.v4Features) {
    Object.assign(features, v4.v4Features);
  }

  const questionCount = adlerV4Assessment.questions.length;
  const dimensionCount = adlerV4Assessment.dimensions.length;

  const ready =
    questionCount === 24 &&
    dimensionCount === 4 &&
    features.pairEngine === 6 &&
    features.adlerianLenses === 7 &&
    features.scenes === 16 &&
    features.modulePool === 36 &&
    features.visualizations === 16 &&
    Number(features.whispers) >= 600 &&
    Number(features.storyMirrorPeople) >= 600 &&
    Number(features.storyMirrorMedia) >= 360 &&
    features.hasGoldMedal === false &&
    features.hasGoodBadLabel === false &&
    v4.normStatus === 'unapproved' &&
    v4.rawAssessmentReadOnly === true;

  return {
    questions: questionCount,
    dimensions: dimensionCount,
    version: v4.questionnaireVersion || 'unknown',
    features,
    normStatus: v4.normStatus,
    rawAssessmentReadOnly: v4.rawAssessmentReadOnly,
    ready,
  };
}
