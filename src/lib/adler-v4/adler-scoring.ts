/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// QM 阿德勒指数 v4.0 — 评分引擎
// 保留 DS2 原始程序计分逻辑
// 4 维 × 6 题 × 0-4 分 → 0-100 连续位置（不是人口百分位）
// RAW_ASSESSMENT_READ_ONLY = true

import type {
  DimensionCode,
  DimensionScore,
  ScoringResult,
  ResponseQuality,
  PairCode,
  PairPatternResult,
  PairCategory,
  SceneCode,
  LifeTaskCode,
  ProfileSignature,
} from './adler-types';
import {
  DIMENSION_ORDER,
  DIMENSION_NAMES,
} from './adler-types';
import { adlerQuestions24, QUESTIONNAIRE_VERSION, LIKERT_SCALE } from './adler-questions-24';

// ===== 原始答案格式 =====
export interface RawAnswers {
  [questionId: string]: number; // 0-4
}

// ===== 核心计分 =====

/**
 * 计算单维度原始平均分（0-4）
 */
function calcDimensionRawAvg(
  answers: RawAnswers,
  dimension: DimensionCode,
): number {
  const dimQuestions = adlerQuestions24.filter((q) => q.dimension === dimension);
  if (dimQuestions.length === 0) return 0;

  const validScores = dimQuestions
    .map((q) => answers[q.id])
    .filter(
      (s) =>
        typeof s === 'number' &&
        s >= LIKERT_SCALE.min &&
        s <= LIKERT_SCALE.max,
    );

  if (validScores.length === 0) return 0;
  return validScores.reduce((sum, s) => sum + s, 0) / validScores.length;
}

/**
 * 将 0-4 原始分转换为 0-100 连续位置分
 * 注意：这是连续位置，不是人群百分位，不作常模解释
 */
function rawToScore(raw: number): number {
  if (raw <= 0) return 0;
  const range = LIKERT_SCALE.max - LIKERT_SCALE.min;
  if (range === 0) return 0;
  const normalized = raw / range;
  return Math.round(normalized * 100);
}

/**
 * 计算 4 维分数
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

// ===== Response Quality Gate =====

export function calcResponseQuality(answers: RawAnswers): ResponseQuality {
  const allScores = Object.values(answers).filter(
    (s) => typeof s === 'number' && s >= LIKERT_SCALE.min && s <= LIKERT_SCALE.max,
  );

  if (allScores.length === 0) {
    return {
      valid: false,
      straightLineScore: 1,
      variance: 0,
      completionRate: 0,
      flags: ['no_answers'],
    };
  }

  const completionRate = allScores.length / adlerQuestions24.length;

  // 计算直线作答比例（相同答案占比）
  const counts: Record<number, number> = {};
  allScores.forEach((s) => {
    counts[s] = (counts[s] || 0) + 1;
  });
  const maxCount = Math.max(...Object.values(counts));
  const straightLineScore = maxCount / allScores.length;

  // 计算方差
  const mean = allScores.reduce((s, v) => s + v, 0) / allScores.length;
  const variance =
    allScores.reduce((s, v) => s + (v - mean) ** 2, 0) / allScores.length;

  const flags: string[] = [];
  if (completionRate < 0.8) flags.push('low_completion');
  if (straightLineScore > 0.8) flags.push('high_straight_line');
  if (variance < 0.1) flags.push('low_variance');

  return {
    valid: completionRate >= 0.6 && straightLineScore <= 0.9,
    straightLineScore,
    variance,
    completionRate,
    flags,
  };
}

// ===== 完整评分结果 =====

export function calcAdlerScores(answers: RawAnswers): ScoringResult {
  const dimensionScores = calcDimensionScores(answers);
  const sortedScores = [...dimensionScores].sort((a, b) => b.score - a.score);
  const top2 = sortedScores.slice(0, 2);
  const bottom2 = sortedScores.slice(-2);

  const spread = sortedScores[0].score - sortedScores[sortedScores.length - 1].score;

  // 标准差
  const meanScore =
    dimensionScores.reduce((s, d) => s + d.score, 0) / dimensionScores.length;
  const balance = Math.sqrt(
    dimensionScores.reduce((s, d) => s + (d.score - meanScore) ** 2, 0) /
      dimensionScores.length,
  );

  // 并列维度（差 ≤3 分）
  const ties: string[] = [];
  for (let i = 0; i < sortedScores.length - 1; i++) {
    if (Math.abs(sortedScores[i].score - sortedScores[i + 1].score) <= 3) {
      ties.push(`${sortedScores[i].dimension}-${sortedScores[i + 1].dimension}`);
    }
  }

  const responseQuality = calcResponseQuality(answers);

  // 生成 Headline（生活风格只作标题，不作定型）
  const headline = generateHeadline(top2.map((s) => s.dimension) as DimensionCode[]);

  const rawScores: Record<DimensionCode, number> = dimensionScores.reduce(
    (acc, d) => {
      acc[d.dimension] = d.score;
      return acc;
    },
    {} as Record<DimensionCode, number>,
  );

  return {
    assessmentId: 'adler-index',
    questionnaireVersion: QUESTIONNAIRE_VERSION,
    rawScores,
    dimensionScores,
    sortedScores,
    top2,
    bottom2,
    spread,
    balance,
    ties,
    headline,
    responseQuality,
  };
}

/**
 * 生成生活风格 Headline（只作标题，不是定型或认证）
 * 注意：这是基于本次回答的连续画像的一个概括，不是"你的类型"
 */
function generateHeadline(topDims: DimensionCode[]): string {
  const dimNames = topDims.map((d) => DIMENSION_NAMES[d]);
  return `${dimNames[0]} × ${dimNames[1]} 画像`;
}

// ===== 6 组 Pair Engine =====

const ALL_PAIRS: PairCode[] = ['AB', 'AC', 'AD', 'BC', 'BD', 'CD'];

const PAIR_DIMS: Record<PairCode, [DimensionCode, DimensionCode]> = {
  AB: ['A', 'B'],
  AC: ['A', 'C'],
  AD: ['A', 'D'],
  BC: ['B', 'C'],
  BD: ['B', 'D'],
  CD: ['C', 'D'],
};

/**
 * 计算单组 Pair 的分类
 * 规则：
 * - Synergy：两维都高（≥70）且差值 ≤10
 * - Compensation：两维差距大（≥30），一高一低
 * - Conditional Tension：两维都中高，但差值中等（15-25）
 * - Context Switch：两维都中等，差值中等
 */
export function classifyPair(
  pair: PairCode,
  scores: Record<DimensionCode, number>,
): PairPatternResult {
  const [dA, dB] = PAIR_DIMS[pair];
  const scoreA = scores[dA];
  const scoreB = scores[dB];
  const diff = Math.abs(scoreA - scoreB);
  const avg = (scoreA + scoreB) / 2;

  let category: PairCategory;
  let confidence = 0.5;
  let evidence = '';

  if (avg >= 70 && diff <= 10) {
    category = 'synergy';
    confidence = 0.8;
    evidence = `两维均位于较高位置（${scoreA}/${scoreB}），协同显现`;
  } else if (diff >= 30) {
    category = 'compensation';
    confidence = 0.75;
    const higher = scoreA > scoreB ? dA : dB;
    const lower = scoreA > scoreB ? dB : dA;
    evidence = `${DIMENSION_NAMES[higher]}（${Math.max(scoreA, scoreB)}）远高于 ${DIMENSION_NAMES[lower]}（${Math.min(scoreA, scoreB)}），可能存在补偿模式`;
  } else if (avg >= 55 && diff >= 15 && diff <= 25) {
    category = 'conditional_tension';
    confidence = 0.65;
    evidence = `两维均在中高水平（${scoreA}/${scoreB}），在特定情境下可能出现张力`;
  } else {
    category = 'context_switch';
    confidence = 0.6;
    evidence = `两维位置为（${scoreA}/${scoreB}），更可能随情境切换策略`;
  }

  return {
    pair,
    category,
    confidence,
    evidence,
  };
}

export function calcAllPairPatterns(
  scores: Record<DimensionCode, number>,
): PairPatternResult[] {
  return ALL_PAIRS.map((p) => classifyPair(p, scores));
}

// ===== 当前生活任务推断 =====

const LIFE_TASK_DIM_MAP: Record<LifeTaskCode, DimensionCode[]> = {
  friendship: ['D', 'B'],
  work: ['A', 'C'],
  love: ['D', 'B'],
  self: ['C', 'A'],
  community: ['D', 'C'],
};

export function inferCurrentLifeTask(
  scores: Record<DimensionCode, number>,
  preferred?: LifeTaskCode,
): LifeTaskCode {
  if (preferred) return preferred;

  // 简单策略：找最高分两维最匹配的生活任务
  const sorted = DIMENSION_ORDER.map((d) => ({ d, s: scores[d] })).sort(
    (a, b) => b.s - a.s,
  );
  const top2 = [sorted[0].d, sorted[1].d];

  // 找包含 top2 中最多维度的生活任务
  let best: LifeTaskCode = 'self';
  let bestScore = 0;
  (Object.keys(LIFE_TASK_DIM_MAP) as LifeTaskCode[]).forEach((lt) => {
    const dims = LIFE_TASK_DIM_MAP[lt];
    const match = dims.filter((d) => top2.includes(d)).length;
    if (match > bestScore) {
      bestScore = match;
      best = lt;
    }
  });

  return best;
}

// ===== 当前场景推断 =====

const SCENE_DIM_MAP: Record<SceneCode, DimensionCode[]> = {
  friendship: ['D', 'B'],
  intimacy: ['D', 'C'],
  family: ['B', 'D'],
  community: ['D', 'C'],
  work: ['A', 'B'],
  study: ['C', 'A'],
  conflict: ['B', 'C'],
  failure: ['C', 'A'],
  procrastination: ['A', 'C'],
  boundary: ['B', 'A'],
  asking_help: ['D', 'C'],
  rejection: ['C', 'D'],
  public_expression: ['C', 'A'],
  identity_belonging: ['D', 'C'],
  life_transition: ['A', 'D'],
  meaning_direction: ['C', 'D'],
};

export function inferCurrentContext(
  scores: Record<DimensionCode, number>,
  preferred?: SceneCode,
): SceneCode {
  if (preferred) return preferred;

  // 找 bottom2 相关的场景（通常是当前最需要觉察的）
  const sorted = DIMENSION_ORDER.map((d) => ({ d, s: scores[d] })).sort(
    (a, b) => a.s - b.s,
  );
  const bottom2 = [sorted[0].d, sorted[1].d];

  let best: SceneCode = 'meaning_direction';
  let bestScore = 0;
  (Object.keys(SCENE_DIM_MAP) as SceneCode[]).forEach((sc) => {
    const dims = SCENE_DIM_MAP[sc];
    const match = dims.filter((d) => bottom2.includes(d)).length;
    if (match > bestScore) {
      bestScore = match;
      best = sc;
    }
  });

  return best;
}

// ===== Profile Signature =====

export function buildProfileSignature(
  scoring: ScoringResult,
  pairPatterns: PairPatternResult[],
  currentLifeTask: LifeTaskCode,
  currentContext: SceneCode,
): ProfileSignature {
  const signatureString = [
    Object.entries(scoring.rawScores)
      .map(([k, v]) => `${k}:${v}`)
      .join('|'), `top2:${scoring.top2.map((s) => s.dimension).join(',')}`, `bottom2:${scoring.bottom2.map((s) => s.dimension).join(',')}`, `ties:${scoring.ties.join(',')}`, `spread:${scoring.spread}`, `balance:${scoring.balance.toFixed(1)}`, `pairs:${pairPatterns.map((p) => `${p.pair}:${p.category}`).join('|')}`, `task:${currentLifeTask}`, `context:${currentContext}`, `rq:${scoring.responseQuality.valid ? 'ok' : 'flag'}`,
  ].join(';');

  // 简单哈希
  let hash = 0;
  for (let i = 0; i < signatureString.length; i++) {
    hash = (hash << 5) - hash + signatureString.charCodeAt(i);
    hash |= 0;
  }

  return {
    scores4: scoring.rawScores,
    top2: scoring.top2.map((s) => s.dimension),
    bottom2: scoring.bottom2.map((s) => s.dimension),
    ties: scoring.ties,
    spread: scoring.spread,
    balance: scoring.balance,
    pairPatterns,
    currentLifeTask,
    currentContext,
    responseQuality: scoring.responseQuality,
    signatureHash: `adler-v4-${Math.abs(hash).toString(36)}`,
  };
}
