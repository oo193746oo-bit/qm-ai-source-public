/**
 * QM 93题MBTI风格人格偏好测试 - 多元性别个性化 v3.0
 *
 * 核心原则（B04）：
 * - 多元性别身份不推断，用户主动 opt-in 才用于个性化
 * - opt_in_example_personalization 默认 false
 * - 不追问、不猜测用户身份
 * - 心理相似度优先于身份
 * - 用户可见文案全部简体中文
 */

import type { PersonalizationContext, TypeCode, WhisperModule } from './mbti-types';

// ============================================================
// 默认上下文
// ============================================================

export const DEFAULT_PERSONALIZATION: PersonalizationContext = {
  optInExamplePersonalization: false,
  shownWhisperIds: [],
};

// ============================================================
// Opt-in 管理
// ============================================================

/**
 * 用户主动开启个性化示例（opt-in）
 * 注意：必须由用户主动触发，系统不得默认开启或诱导开启
 */
export function enablePersonalization(
  context: PersonalizationContext,
  options: {
    genderIdentity?: string;
    pronouns?: string;
    ageGroup?: string;
    currentConcern?: string;
    culturalBackground?: string;
  } = {}
): PersonalizationContext {
  return {
    ...context,
    optInExamplePersonalization: true,
    genderIdentity: options.genderIdentity || context.genderIdentity,
    pronouns: options.pronouns || context.pronouns,
    ageGroup: options.ageGroup || context.ageGroup,
    currentConcern: options.currentConcern || context.currentConcern,
    culturalBackground: options.culturalBackground || context.culturalBackground,
  };
}

/**
 * 关闭个性化，清除所有身份信息
 */
export function disablePersonalization(
  context: PersonalizationContext
): PersonalizationContext {
  return {
    optInExamplePersonalization: false,
    shownWhisperIds: context.shownWhisperIds, // 保留展示历史用于去重
  };
}

// ============================================================
// 示例个性化：代词处理
// ============================================================

/**
 * 获取适当前称代词
 * 如果用户未 opt-in，使用中性表述
 */
export function getAppropriatePronoun(
  context: PersonalizationContext
): {
  subject: string;  // 他/她/TA/你
  possessive: string; // 他的/她的/TA的/你的
  object: string;  // 他/她/TA/你
} {
  // 未开启个性化时，使用第二人称「你」
  if (!context.optInExamplePersonalization) {
    return {
      subject: '你',
      possessive: '你的',
      object: '你',
    };
  }

  const pronouns = context.pronouns?.toLowerCase() || '';

  if (pronouns.includes('she') || pronouns.includes('她')) {
    return { subject: '她', possessive: '她的', object: '她' };
  }
  if (pronouns.includes('he') || pronouns.includes('他')) {
    return { subject: '他', possessive: '他的', object: '他' };
  }

  // 默认中性
  return { subject: 'TA', possessive: 'TA的', object: 'TA' };
}

// ============================================================
// 示例个性化：耳语过滤与排序
// ============================================================

/**
 * 根据个性化上下文对耳语进行过滤和重排序
 * 注意：个性化是锦上添花，核心内容基于心理相似度，不因身份而改变
 */
export function personalizeWhispers(
  whispers: WhisperModule[],
  context: PersonalizationContext
): WhisperModule[] {
  // 未开启个性化时，直接返回（基于心理类型的选择已经足够）
  if (!context.optInExamplePersonalization) {
    return whispers;
  }

  const result = [...whispers];

  // 如果有关注点，相关耳语排前面
  if (context.currentConcern) {
    const concern = context.currentConcern.toLowerCase();
    result.sort((a, b) => {
      const aMatch = a.focusArea?.toLowerCase().includes(concern) ? 1 : 0;
      const bMatch = b.focusArea?.toLowerCase().includes(concern) ? 1 : 0;
      return bMatch - aMatch;
    });
  }

  return result;
}

// ============================================================
// 示例个性化：示例语句生成
// ============================================================

/**
 * 生成个性化的问候语
 * 仅在 opt-in 后使用更贴合的表达
 */
export function getGreeting(context: PersonalizationContext, typeCode: TypeCode): string {
  if (!context.optInExamplePersonalization) {
    return '你好，我是小酷。这是你的 MBTI 风格人格偏好报告。';
  }

  if (context.currentConcern) {
    return `你好，我是小酷。看到你最近在关注「${context.currentConcern}」，希望这份报告能给你带来一些启发。`;
  }

  return '你好，我是小酷。这是为你准备的 MBTI 风格人格偏好报告。';
}

// ============================================================
// 示例个性化：自我介绍
// ============================================================

/**
 * 首次自我介绍文案
 * 注意：AI 自称「小酷」，首次自我介绍「QM AI」
 */
export function getSelfIntroduction(context: PersonalizationContext): string {
  if (!context.optInExamplePersonalization) {
    return '你好，我是小酷（QM AI）。我是 QM AI 的人格探索陪伴者，不是心理师也不是咨询师。我会陪你一起探索你的人格偏好，但最终的答案，永远在你自己心里。';
  }

  return '你好，我是小酷（QM AI）。我是 QM AI 的人格探索陪伴者，不是心理师也不是咨询师。你已经开启了个性化示例，我会在保持专业的前提下，尽量用让你更舒服的方式和你交流。';
}

// ============================================================
// 身份标签管理
// ============================================================

/**
 * 是否显示身份相关的内容
 * 只有 opt-in 后才展示身份相关的个性化元素
 */
export function shouldShowIdentityPersonalization(
  context: PersonalizationContext
): boolean {
  return context.optInExamplePersonalization === true;
}

/**
 * 获取可用的身份选项（用于用户 opt-in 时的选择）
 * 注意：这是示例选项，实际使用中应由用户自由填写
 */
export const GENDER_IDENTITY_OPTIONS = [
  { value: 'cis_female', label: '顺性别女性' },
  { value: 'cis_male', label: '顺性别男性' },
  { value: 'trans_female', label: '跨性别女性' },
  { value: 'trans_male', label: '跨性别男性' },
  { value: 'non_binary', label: '非二元' },
  { value: 'genderqueer', label: '酷儿性别' },
  { value: 'genderfluid', label: '流性别' },
  { value: 'agender', label: '无性别' },
  { value: 'bigender', label: '双性别' },
  { value: 'other', label: '其他（请自填）' },
  { value: 'prefer_not_to_say', label: '不愿透露' },
];

export const PRONOUN_OPTIONS = [
  { value: 'she_her', label: '她 / 她的' },
  { value: 'he_him', label: '他 / 他的' },
  { value: 'they_them', label: 'TA / TA的' },
  { value: 'xe_xem', label: 'Xe / Xem' },
  { value: 'any', label: '都可以' },
  { value: 'prefer_not_to_say', label: '不愿透露' },
];

// ============================================================
// 敏感信息管理
// ============================================================

/**
 * 获取分享/导出时应隐藏的敏感信息列表
 * 隐私优先：默认隐藏内部ID、逐题答案、敏感身份信息
 */
export function getSensitiveFieldsToHide(): string[] {
  return [
    'internalUserId',        // 内部用户ID
    'allAnswers',            // 逐题答案
    'genderIdentity',        // 性别身份
    'rawScores',             // 原始分数（可能包含敏感信息）
    'ipAddress',             // IP地址
    'deviceInfo',            // 设备信息
  ];
}

/**
 * 判断报告中是否包含敏感身份信息
 */
export function hasSensitiveIdentityInfo(context: PersonalizationContext): boolean {
  return !!(context.genderIdentity || context.pronouns);
}
