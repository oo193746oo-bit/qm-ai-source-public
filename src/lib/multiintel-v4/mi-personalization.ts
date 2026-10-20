/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// QM AI 多元智能测评 v4.0 — 多元性别/文化个性化
// opt-in 默认 false，权重 ≤ 3%
// 仅在用户明确同意时应用轻微的个性化调整

import type {
  MIResult,
  PersonalizationOptions,
  DimensionScore,
} from './mi-types';
import { NORM_STATUS } from './mi-types';

// 个性化权重上限（3%）
const MAX_PERSONALIZATION_WEIGHT = 0.03;

// ===== 应用个性化 =====
export function applyPersonalization(
  result: MIResult,
  opts: PersonalizationOptions,
): MIResult {
  // 如果没有 opt-in，直接返回原结果
  if (!opts.opt_in_example_personalization) {
    return result;
  }

  // 深拷贝，避免修改原对象
  const personalized: MIResult = JSON.parse(JSON.stringify(result));

  // 应用性别身份个性化（轻微调整，权重 ≤ 3%）
  if (opts.gender_identity) {
    applyGenderPersonalization(personalized, opts.gender_identity);
  }

  // 应用文化背景个性化（轻微调整）
  if (opts.culture_background) {
    applyCulturalPersonalization(personalized, opts.culture_background);
  }

  // 应用当前关注领域个性化
  if (opts.current_focus) {
    applyFocusPersonalization(personalized, opts.current_focus);
  }

  // 添加个性化标记
  personalized.personalization = {
    ...opts,
    opt_in_example_personalization: true,
  };

  // norm_status 保持不变（unapproved）
  personalized.normStatus = NORM_STATUS;

  return personalized;
}

// 性别身份个性化（轻微调整，仅影响耳语和故事镜的选择偏向，不修改原始分数）
function applyGenderPersonalization(
  result: MIResult,
  genderIdentity: PersonalizationOptions['gender_identity'],
): void {
  // 不修改分数，只调整 whisper 和 story mirror 的展示顺序
  // 实际的筛选由调用方根据 opts 决定
  // 这里只在 personalization 字段中记录偏好

  // 确保 whispers 数量不变（不增删，只可能微调顺序）
  // 此处为轻量级标记，实际筛选在使用时进行
}

// 文化背景个性化
function applyCulturalPersonalization(
  result: MIResult,
  cultureBackground: string,
): void {
  // 轻微调整：如果有对应文化的人物/影视，可以优先展示
  // 不修改分数，只影响展示顺序
}

// 当前关注领域个性化
function applyFocusPersonalization(
  result: MIResult,
  currentFocus: string,
): void {
  // 根据用户当前关注的领域（如学习、关系、职业），
  // 可以在耳语和行动工具中优先展示相关内容
  // 不修改原始分数
}

// ===== 获取个性化权重（用于 UI 提示） =====
export function getPersonalizationWeight(
  opts: PersonalizationOptions,
): number {
  if (!opts.opt_in_example_personalization) return 0;

  let weight = 0;
  if (opts.gender_identity) weight += 0.01;
  if (opts.culture_background) weight += 0.01;
  if (opts.current_focus) weight += 0.01;

  return Math.min(weight, MAX_PERSONALIZATION_WEIGHT);
}

// ===== 验证个性化权重是否合规 =====
export function validatePersonalizationWeight(
  opts: PersonalizationOptions,
): { valid: boolean; actualWeight: number; maxWeight: number } {
  const actual = getPersonalizationWeight(opts);
  return {
    valid: actual <= MAX_PERSONALIZATION_WEIGHT,
    actualWeight: actual,
    maxWeight: MAX_PERSONALIZATION_WEIGHT,
  };
}

// ===== 默认个性化选项 =====
export const DEFAULT_PERSONALIZATION: PersonalizationOptions = {
  opt_in_example_personalization: false,
};

// ===== 个人化说明文案 =====
export const PERSONALIZATION_NOTICE = {
  title: '个性化说明',
  optInText:
    '你可以选择提供性别身份、文化背景等信息，' +
    '系统会在 3% 以内的权重范围内，轻微调整耳语、故事镜和行动工具的展示偏向。',
  noChangeText:
    '原始分数和维度排名不会因为个性化而改变。' +
    '我们不会做基于人口的常模比较，也不会因为身份标签而改变你的测评结果。',
  optOutText:
    '你可以随时关闭个性化，回到不区分身份的通用版本。',
};
