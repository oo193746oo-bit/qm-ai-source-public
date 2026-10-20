/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// QM 职业价值观测评 v4.0 — 评分引擎
// 8 维连续分、Intrinsic/Extrinsic 双指数、Profile Signature、Response Quality
// raw_read_only: true — 原始题目答案直接计分，AI 不得改分

import type {
  DimensionCode,
  DimensionScore,
  ScoringResult,
  ResponseQuality,
} from './wv-types';
import {
  DIMENSION_ORDER,
  INTRINSIC_DIMENSIONS,
  EXTRINSIC_DIMENSIONS,
} from './wv-types';
import { wvQuestions24, QUESTIONNAIRE_VERSION, LIKERT_SCALE } from './wv-questions-24';
import { wvDimensions } from './wv-dimensions';

// ===== 核心计分 =====

// 答案格式：{ questionId: score }，score 为 1-5
export interface RawAnswers {
  [questionId: string]: number;
}

/**
 * 计算单维度原始平均分（1-5）
 */
function calcDimensionRawAvg(
  answers: RawAnswers,
  dimension: DimensionCode,
): number {
  const dimQuestions = wvQuestions24.filter((q) => q.dimension === dimension);
  if (dimQuestions.length === 0) return 0;

  const validScores = dimQuestions
    .map((q) => answers[q.id])
    .filter((s) => typeof s === 'number' && s >= LIKERT_SCALE.min && s <= LIKERT_SCALE.max);

  if (validScores.length === 0) return 0;
  return validScores.reduce((sum, s) => sum + s, 0) / validScores.length;
}

/**
 * 将 1-5 原始分转换为 0-100 连续位置分
 * 转换方式：线性映射 (raw - 1) / 4 * 100
 * 注意：这是连续位置，不是人群百分位，不作常模解释
 */
function rawToScore(raw: number): number {
  if (raw <= 0) return 0;
  const normalized = (raw - LIKERT_SCALE.min) / (LIKERT_SCALE.max - LIKERT_SCALE.min);
  return Math.round(normalized * 100);
}

/**
 * 计算 8 维分数
 */
export function calcDimensionScores(answers: RawAnswers): DimensionScore[] {
  return DIMENSION_ORDER.map((dim) => {
    const rawAvg = calcDimensionRawAvg(answers, dim);
    const score = rawToScore(rawAvg);
    return {
      dimension: dim,
      score,
      rawAverage: rawAvg,
    };
  });
}

// ===== Intrinsic / Extrinsic 双指数 =====

/**
 * 计算 Intrinsic Index（内在价值指数）—— 独立 0-100 指数
 * Intrinsic = achievement + autonomy + growth + meaning 的平均
 * 这是一个独立指数，不与 Extrinsic 强制相加为 100%
 */
export function calcIntrinsicIndex(scores: DimensionScore[]): number {
  const intrinsicScores = scores.filter((s) =>
    INTRINSIC_DIMENSIONS.includes(s.dimension),
  );
  if (intrinsicScores.length === 0) return 0;
  const avg = intrinsicScores.reduce((sum, s) => sum + s.score, 0) / intrinsicScores.length;
  return Math.round(avg);
}

/**
 * 计算 Extrinsic Index（外在价值指数）—— 独立 0-100 指数
 * Extrinsic = security + reward 的平均
 * 这是一个独立指数，不与 Intrinsic 强制相加为 100%
 */
export function calcExtrinsicIndex(scores: DimensionScore[]): number {
  const extrinsicScores = scores.filter((s) =>
    EXTRINSIC_DIMENSIONS.includes(s.dimension),
  );
  if (extrinsicScores.length === 0) return 0;
  const avg = extrinsicScores.reduce((sum, s) => sum + s.score, 0) / extrinsicScores.length;
  return Math.round(avg);
}

/**
 * 可选：归一化内外价值占比（透明说明公式）
 * 仅在明确需要显示"占比"时使用，且必须标注算法
 */
export function calcNormalizedShare(
  intrinsicIndex: number,
  extrinsicIndex: number,
): { intrinsic: number; extrinsic: number; formula: string } {
  const total = intrinsicIndex + extrinsicIndex;
  const intrinsic = total > 0 ? Math.round((intrinsicIndex / total) * 100) : 50;
  const extrinsic = 100 - intrinsic;
  return {
    intrinsic,
    extrinsic,
    formula:
      '归一化占比 = 内在指数 / (内在指数 + 外在指数) × 100%。' +
      '注意：内在价值和外在价值是两个独立指数，并不天然相加为100%。' +
      '此占比仅用于相对参考，不代表一个多另一个就少。',
  };
}

// ===== Profile Signature =====

/**
 * 生成一句话 Profile Signature
 * 基于 Top3、Bottom2 和 spread/balance 特征
 */
export function generateProfileSignature(scores: DimensionScore[]): string {
  const sorted = [...scores].sort((a, b) => b.score - a.score);
  const top3 = sorted.slice(0, 3);
  const bottom2 = sorted.slice(-2);
  const spread = sorted[0].score - sorted[sorted.length - 1].score;

  const topNames = top3.map((s) => wvDimensions[s.dimension].name).join('、');
  const bottomNames = bottom2.map((s) => wvDimensions[s.dimension].name).join('和');

  // 根据离散程度选择描述
  let profileType: string;
  if (spread < 20) {
    profileType = '价值分布比较均衡，各项对你来说都有一定重要性';
  } else if (spread < 40) {
    profileType = '有相对清晰的价值优先级，但不是极端型';
  } else {
    profileType = '价值优先级非常鲜明，知道自己最看重什么';
  }

  return `你最看重的价值是${topNames}，相对最不优先的是${bottomNames}。${profileType}。`;
}

// ===== Response Quality（作答质量检测）=====

/**
 * 检测作答质量：直线作答率、方差、完成度
 */
export function calcResponseQuality(answers: RawAnswers): ResponseQuality {
  const totalQuestions = wvQuestions24.length;
  const answeredCount = Object.values(answers).filter(
    (s) => typeof s === 'number' && s >= 1 && s <= 5,
  ).length;
  const completionRate = answeredCount / totalQuestions;

  // 直线作答检测：同一种答案的比例
  const scores = Object.values(answers).filter((s) => typeof s === 'number');
  const scoreCounts: Record<number, number> = {};
  for (const s of scores) {
    scoreCounts[s] = (scoreCounts[s] || 0) + 1;
  }
  const maxSameCount = Math.max(...Object.values(scoreCounts), 0);
  const straightLineScore = scores.length > 0 ? maxSameCount / scores.length : 0;

  // 方差
  const mean = scores.reduce((a, b) => a + b, 0) / (scores.length || 1);
  const variance =
    scores.length > 0
      ? scores.reduce((sum, s) => sum + (s - mean) ** 2, 0) / scores.length
      : 0;

  const flags: string[] = [];

  if (completionRate < 0.8) {
    flags.push('作答完成度较低，结果参考性可能有限');
  }

  if (straightLineScore > 0.7) {
    flags.push('作答模式较为一致，请确认是真实想法还是惯性选择');
  }

  if (variance < 0.2) {
    flags.push('各题答案差异很小，建议重新审视每题的不同');
  }

  const valid = completionRate >= 0.8 && straightLineScore <= 0.85 && variance >= 0.1;

  return {
    valid,
    straightLineScore,
    variance,
    completionRate,
    flags,
  };
}

// ===== 完整评分计算入口 =====

/**
 * 计算完整评分结果
 * @param answers 原始答案 { questionId: 1-5 }
 * @param includeNormalizedShare 是否计算归一化占比（默认不计算，保持双指数独立）
 */
export function calcFullScore(
  answers: RawAnswers,
  includeNormalizedShare = false,
): ScoringResult {
  const dimensionScores = calcDimensionScores(answers);
  const sortedScores = [...dimensionScores].sort((a, b) => b.score - a.score);
  const top3 = sortedScores.slice(0, 3);
  const bottom2 = sortedScores.slice(-2);

  const intrinsicIndex = calcIntrinsicIndex(dimensionScores);
  const extrinsicIndex = calcExtrinsicIndex(dimensionScores);

  const spread = sortedScores[0].score - sortedScores[sortedScores.length - 1].score;

  // 标准差（离散程度）
  const meanScore =
    dimensionScores.reduce((sum, s) => sum + s.score, 0) / dimensionScores.length;
  const balance = Math.sqrt(
    dimensionScores.reduce((sum, s) => sum + (s.score - meanScore) ** 2, 0) /
      dimensionScores.length,
  );

  const rawScores = {} as Record<DimensionCode, number>;
  for (const s of dimensionScores) {
    rawScores[s.dimension] = s.score;
  }

  const profileSignature = generateProfileSignature(dimensionScores);
  const responseQuality = calcResponseQuality(answers);

  const result: ScoringResult = {
    questionnaireVersion: QUESTIONNAIRE_VERSION,
    rawScores,
    dimensionScores,
    sortedScores,
    top3,
    bottom2,
    intrinsicIndex,
    extrinsicIndex,
    spread,
    balance,
    profileSignature,
    responseQuality,
  };

  if (includeNormalizedShare) {
    result.normalizedShare = calcNormalizedShare(intrinsicIndex, extrinsicIndex);
  }

  return result;
}

// ===== 辅助函数 =====

/**
 * 获取维度分数的文字描述（UI 辅助，不作常模解释）
 * 连续位置为主，等级仅作 UI 辅助
 */
export function getScoreLabel(score: number): string {
  if (score >= 80) return '高度重视';
  if (score >= 60) return '比较重视';
  if (score >= 40) return '中等重视';
  if (score >= 20) return '相对不那么重视';
  return '优先级较低';
}

/**
 * 计算两个维度的分差
 */
export function getScoreGap(
  scores: DimensionScore[],
  dimA: DimensionCode,
  dimB: DimensionCode,
): number {
  const a = scores.find((s) => s.dimension === dimA)?.score ?? 0;
  const b = scores.find((s) => s.dimension === dimB)?.score ?? 0;
  return Math.abs(a - b);
}
