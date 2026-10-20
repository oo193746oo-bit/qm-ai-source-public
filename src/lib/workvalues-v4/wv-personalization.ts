/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// QM 职业价值观测评 v4.0 — 个性化设置
// 多元性别、文化背景、职业阶段 opt-in
// 这些信息只在用户主动提供时用于个性化，不影响 8 维分数

import type { PersonalizationOptIn, DimensionCode, PersonStory, MediaStory } from './wv-types';
import { wvPersonStories, findPeopleByValues } from './wv-story-mirror-people';
import { wvMediaStories, findMediaByValues } from './wv-story-mirror-media';

// 性别多元选项
export const GENDER_OPTIONS = [
  { value: 'cis_male', label: '顺性别男' },
  { value: 'cis_female', label: '顺性别女' },
  { value: 'trans_male', label: '跨性别男' },
  { value: 'trans_female', label: '跨性别女' },
  { value: 'non_binary', label: '非二元' },
  { value: 'genderqueer', label: '性别酷儿' },
  { value: 'genderfluid', label: '性别流动' },
  { value: 'agender', label: '无性别' },
  { value: 'questioning', label: '还在探索' },
  { value: 'prefer_not_say', label: '不愿透露' },
  { value: 'other', label: '其他（请说明）' },
];

// 文化背景选项
export const CULTURE_OPTIONS = [
  { value: 'cn_mainland', label: '中国大陆' },
  { value: 'hk', label: '中国香港' },
  { value: 'tw', label: '中国台湾' },
  { value: 'overseas_chinese', label: '海外华人' },
  { value: 'first_gen', label: '第一代大学生/职场人' },
  { value: 'rural_origin', label: '农村/小镇出身' },
  { value: 'ethnic_minority', label: '少数民族' },
  { value: 'immigrant', label: '移民/外籍' },
  { value: 'disabled', label: '身心障碍者' },
  { value: 'other', label: '其他（请说明）' },
];

// 职业阶段选项
export const CAREER_STAGE_OPTIONS = [
  { value: 'entry', label: '刚入行（0-3年）' },
  { value: 'mid', label: '有一定经验（3-8年）' },
  { value: 'senior', label: '资深/管理岗（8年以上）' },
  { value: 'transition', label: '正在转型/转行' },
  { value: 'returning', label: '重返职场' },
  { value: 'student', label: '学生/未入职' },
];

// 当前关注场景选项
export const CURRENT_FOCUS_OPTIONS = [
  { value: 'job_search', label: '正在找工作' },
  { value: 'offer', label: '在选 offer' },
  { value: 'onboarding', label: '刚入职/适应期' },
  { value: 'promotion', label: '想晋升/在上升期' },
  { value: 'transfer', label: '想转岗' },
  { value: 'career_change', label: '想转行' },
  { value: 'entrepreneur', label: '想创业/做自由职业' },
  { value: 'remote', label: '在做远程工作/想远程' },
  { value: 'salary', label: '想谈薪/加薪' },
  { value: 'team_conflict', label: '团队关系有困扰' },
  { value: 'burnout', label: '感到倦怠' },
  { value: 'work_family', label: '工作家庭平衡' },
  { value: 'curious', label: '就是好奇，想了解自己' },
];

// 默认个性化设置（全部 opt-out）
export const DEFAULT_PERSONALIZATION: PersonalizationOptIn = {
  culture: false,
  gender: false,
  careerStage: false,
};

/**
 * 基于个性化设置对 Story Mirror 结果做 rerank
 * 只在用户 opt-in 时才使用身份信息，且只调整排序，不改变匹配逻辑
 */
export function diversityRerankPeople(
  people: PersonStory[],
  personalization: PersonalizationOptIn,
  diversityTags?: string[],
): PersonStory[] {
  if (!personalization.culture && !personalization.gender) {
    return people;
  }

  if (!diversityTags || diversityTags.length === 0) {
    return people;
  }

  return [...people].sort((a, b) => {
    const aMatch = (a.diversityTags || []).filter((t) =>
      diversityTags.includes(t),
    ).length;
    const bMatch = (b.diversityTags || []).filter((t) =>
      diversityTags.includes(t),
    ).length;
    return bMatch - aMatch; // 匹配度高的排前面
  });
}

/**
 * 获取带多样性重排的人物 Story Mirror
 */
export function getDiversePeopleStories(
  topDimensions: DimensionCode[],
  personalization: PersonalizationOptIn,
  diversityTags?: string[],
  limit = 5,
): PersonStory[] {
  const base = findPeopleByValues(topDimensions, limit * 3); // 先取 3 倍候选
  return diversityRerankPeople(base, personalization, diversityTags).slice(0, limit);
}

/**
 * 生成带文化/身份语境的开头语
 */
export function getCulturalOpening(
  personalization: PersonalizationOptIn,
  cultureContext?: string,
  genderContext?: string,
): string | null {
  const parts: string[] = [];

  if (personalization.gender && genderContext) {
    parts.push(`作为${genderContext}的职场人`);
  }

  if (personalization.culture && cultureContext) {
    parts.push(`有着${cultureContext}背景的你`);
  }

  if (parts.length === 0) return null;

  return `${parts.join('、')}，可能会在职业选择中遇到一些独特的议题。`;
}

// 验证个性化模块
export function validatePersonalization(): {
  genderOptions: number;
  cultureOptions: number;
  careerStages: number;
  focusOptions: number;
  optInByDefault: boolean;
} {
  return {
    genderOptions: GENDER_OPTIONS.length,
    cultureOptions: CULTURE_OPTIONS.length,
    careerStages: CAREER_STAGE_OPTIONS.length,
    focusOptions: CURRENT_FOCUS_OPTIONS.length,
    optInByDefault: false, // 默认全部 opt-out
  };
}
