/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/**
 * QM 成人ADHD评估 v4.0 - 个性化与身份适配
 *
 * 用户身份只有主动提供且 opt-in 时才参与 3% 案例亲近感重排
 * 不影响筛查、不参与分数、不改变 ADHD 信号
 */

export interface OptInIdentity {
  gender_identity?: string;        // 性别认同
  sexual_orientation?: string;     // 性倾向
  age_group?: string;              // 年龄段
  culture_region?: string;         // 文化/地域
  neurodivergent_self_id?: string; // 已有的神经多元自我认同
  occupation?: string;             // 职业领域
}

export const DEFAULT_PERSONALIZATION = {
  opt_in: false,
  identity: {} as OptInIdentity,
  language: 'zh-CN',
  ai_name: '小酷',
  brand_name: 'QM AI',
  primary_color: '#6B4C9A',
};

export type PersonalizationContext = typeof DEFAULT_PERSONALIZATION;

// 获取自我介绍（首次用 QM AI，之后用小酷）
export function getSelfIntroduction(isFirstTime: boolean): string {
  if (isFirstTime) {
    return '你好，我是QM AI，也可以叫我小酷。我会陪你一起完成这份成人ADHD自我观察问卷。';
  }
  return '嗨，我是小酷。';
}

// 获取问候语
export function getGreeting(timeOfDay?: 'morning' | 'afternoon' | 'evening'): string {
  const greetings = {
    morning: '早上好，今天感觉怎么样？',
    afternoon: '下午好，准备好开始了吗？',
    evening: '晚上好，辛苦了一天。',
  };
  return greetings[timeOfDay || 'evening'];
}

// 身份仅 opt-in 时参与 3% 重排权重
export const IDENTITY_WEIGHT = 0.03;

// 检查是否启用身份亲近感重排
export function shouldUseIdentityAffinity(optIn: boolean): boolean {
  return optIn === true;
}

// 身份不参与诊断/筛查判断
export const IDENTITY_NEVER_AFFECTS = [
  'official_screening_signal',
  'qm_core_profile',
  'executive_function_profile',
  'functional_impact_profile',
  'support_priority',
];
