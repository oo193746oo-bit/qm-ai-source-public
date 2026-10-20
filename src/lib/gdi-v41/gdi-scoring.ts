/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// QM-GDI-48 v4.1 确定性计分引擎
// ⚠️ 后端确定性计算，LLM 不参与评分
// 计分规则：
//   - 正向题 raw = 1~7
//   - 反向题 scored = 8 - raw
//   - dimension_mean = mean(valid_scored_items)
//   - plot_score = (dimension_mean - 1) / 6 * 100
//   - 禁止跨维求和，无总分
//   - 每维 < 4题有效则该维标记 incomplete

import {
  AnswerMap,
  AnswerValue,
  DimensionCode,
  DimensionScore,
  AssessmentProfile,
  QualityGateResult,
  CompletionStatus,
  SpeedFlag,
} from './gdi-types';
import { GDI_QUESTIONS_48, TOTAL_QUESTIONS } from './gdi-questions-48';

const MIN_VALID_PER_DIMENSION = 4;
const TOTAL_DIMENSIONS = 8;

// 单题计分
export const scoreSingleItem = (
  raw: AnswerValue,
  reverse: boolean
): { scored: number | null; valid: boolean } => {
  if (raw === 'N/A') {
    return { scored: null, valid: false };
  }
  if (typeof raw !== 'number' || raw < 1 || raw > 7) {
    return { scored: null, valid: false };
  }
  const scored = reverse ? 8 - raw : raw;
  return { scored, valid: true };
};

// 单维计分
export const scoreDimension = (
  dimension: DimensionCode,
  answers: AnswerMap
): DimensionScore => {
  const questions = GDI_QUESTIONS_48.filter((q) => q.dimension === dimension);
  const items = questions.map((q) => {
    const raw = answers[q.id];
    const { scored, valid } = scoreSingleItem(raw ?? 'N/A', q.reverse);
    return { id: q.id, raw: raw ?? 'N/A', scored, valid };
  });

  const validItems = items.filter((i) => i.valid);
  const validCount = validItems.length;
  const totalCount = items.length;
  const incomplete = validCount < MIN_VALID_PER_DIMENSION;

  let dimensionMean: number | null = null;
  let plotScore: number | null = null;

  if (!incomplete && validCount > 0) {
    const sum = validItems.reduce((acc, i) => acc + (i.scored ?? 0), 0);
    dimensionMean = sum / validCount;
    plotScore = ((dimensionMean - 1) / 6) * 100;
  }

  return {
    code: dimension,
    name: dimension,
    validCount,
    totalCount,
    dimensionMean,
    plotScore,
    incomplete,
    items,
  };
};

// 全维度计分
export const scoreAllDimensions = (
  answers: AnswerMap
): Record<DimensionCode, DimensionScore> => {
  const dimensions: DimensionCode[] = ['IGS', 'SDO', 'EA', 'CF', 'GCC', 'GAE', 'SNA', 'BR'];
  const result: Partial<Record<DimensionCode, DimensionScore>> = {};
  for (const dim of dimensions) {
    result[dim] = scoreDimension(dim, answers);
  }
  return result as Record<DimensionCode, DimensionScore>;
};

// 质量门禁
export const computeQualityGate = (
  answers: AnswerMap,
  durationSeconds: number
): QualityGateResult => {
  const answeredCount = Object.values(answers).filter(
    (v) => typeof v === 'number' && v >= 1 && v <= 7
  ).length;
  const totalCount = TOTAL_QUESTIONS;
  const completionRate = answeredCount / totalCount;

  let completionStatus: CompletionStatus;
  if (completionRate >= 0.9) {
    completionStatus = 'full';
  } else if (completionRate >= 0.75) {
    completionStatus = 'partial';
  } else {
    completionStatus = 'insufficient';
  }

  let speedFlag: SpeedFlag = 'normal';
  if (durationSeconds < 120) {
    speedFlag = 'very_fast';
  } else if (durationSeconds < 240) {
    speedFlag = 'fast';
  }

  // 连续相同答案检测（按答题顺序）
  const orderedAnswers = GDI_QUESTIONS_48
    .map((q) => answers[q.id])
    .filter((v) => typeof v === 'number') as number[];

  let maxLongstring = 0;
  let currentRun = 1;
  for (let i = 1; i < orderedAnswers.length; i++) {
    if (orderedAnswers[i] === orderedAnswers[i - 1]) {
      currentRun++;
      maxLongstring = Math.max(maxLongstring, currentRun);
    } else {
      currentRun = 1;
    }
  }
  const longstringFlag = maxLongstring >= 18;

  return {
    completionRate,
    completionStatus,
    answeredCount,
    totalCount,
    durationSeconds,
    speedFlag,
    longstringFlag,
    longstringLength: maxLongstring,
  };
};

// 生成完整测评画像
export const buildAssessmentProfile = (
  answers: AnswerMap,
  durationSeconds: number
): AssessmentProfile => {
  const scores = scoreAllDimensions(answers);
  const quality = computeQualityGate(answers, durationSeconds);

  const plotScores: Record<DimensionCode, number | null> = {
    IGS: scores.IGS.plotScore,
    SDO: scores.SDO.plotScore,
    EA: scores.EA.plotScore,
    CF: scores.CF.plotScore,
    GCC: scores.GCC.plotScore,
    GAE: scores.GAE.plotScore,
    SNA: scores.SNA.plotScore,
    BR: scores.BR.plotScore,
  };

  return {
    scores,
    quality,
    plotScores,
    answeredAt: new Date(),
    durationSeconds,
  };
};

// 判断某维属于高/中/低分位（基于plot_score）
export const getScoreTertile = (plotScore: number | null): 'high' | 'mid' | 'low' | null => {
  if (plotScore === null) return null;
  if (plotScore >= 66) return 'high';
  if (plotScore >= 33) return 'mid';
  return 'low';
};

// 获取有效维度数量
export const getValidDimensionCount = (
  profile: AssessmentProfile
): number => {
  return Object.values(profile.scores).filter((s) => !s.incomplete).length;
};

// 是否可以生成结果（至少75%完成度）
export const canGenerateResult = (profile: AssessmentProfile): boolean => {
  return profile.quality.completionStatus !== 'insufficient';
};
