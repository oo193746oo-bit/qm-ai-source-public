/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// QM AI 多元智能测评 v4.0 — 评分引擎
// 8 维连续分、Profile Signature、Response Quality、Result Confidence Note
// 28 组 Pair Matrix 计算
// raw_read_only: true — 程序计分，AI 不得修改原始分

import {
  DIMENSION_ORDER,
  NORM_STATUS,
  EXPRESSION_DIRECTION_MAP,
  QUESTIONNAIRE_VERSION,
} from './mi-types';
import type {
  DimensionCode,
  DimensionScore,
  ProfileSignature,
  ResponseQuality,
  ResultConfidenceNote,
  PairPattern,
} from './mi-types';
import {
  miQuestions24,
  QUESTIONS_PER_DIMENSION,
  RAW_SCORE_MIN_PER_DIM,
  RAW_SCORE_MAX_PER_DIM,
  TOTAL_QUESTIONS,
} from './mi-questions-24';
import { pairMatrixDefinitions } from './mi-pair-matrix';

// ===== 原始分 → 0-100 线性映射 =====
// 注意：0-100 是本次题库量尺位置，不是人口百分位
// norm_status = 'unapproved'
export function rawToScaled(rawScore: number): number {
  const clamped = Math.max(RAW_SCORE_MIN_PER_DIM, Math.min(RAW_SCORE_MAX_PER_DIM, rawScore));
  const ratio = (clamped - RAW_SCORE_MIN_PER_DIM) / (RAW_SCORE_MAX_PER_DIM - RAW_SCORE_MIN_PER_DIM);
  return Math.round(ratio * 100);
}

// ===== 显现程度分级（仅 UI 辅助，不作诊断） =====
export function scoreToManifestation(score: number): 'more_visible' | 'moderate' | 'less_visible' {
  if (score >= 67) return 'more_visible';
  if (score >= 34) return 'moderate';
  return 'less_visible';
}

// ===== 计算单维得分 =====
export function calculateDimensionScore(
  dimension: DimensionCode,
  answers: Record<string, number>,
): DimensionScore {
  const dimQuestions = miQuestions24.filter((q) => q.dimension === dimension);
  let rawScore = 0;
  let answered = 0;

  for (const q of dimQuestions) {
    const ans = answers[q.id];
    if (typeof ans === 'number' && ans >= 1 && ans <= 5) {
      rawScore += ans;
      answered++;
    }
  }

  // 缺题时按已答比例推算（仅用于展示，会在 confidence note 中说明）
  if (answered < QUESTIONS_PER_DIMENSION && answered > 0) {
    rawScore = Math.round((rawScore / answered) * QUESTIONS_PER_DIMENSION);
  }

  const score = rawToScaled(rawScore);
  const rawAverage = answered > 0 ? rawScore / QUESTIONS_PER_DIMENSION : 0;

  return {
    dimension,
    score,
    rawScore,
    rawAverage,
    manifestation: scoreToManifestation(score),
  };
}

// ===== 计算所有 8 维得分 =====
export function calculateAllScores(answers: Record<string, number>): DimensionScore[] {
  return DIMENSION_ORDER.map((dim) => calculateDimensionScore(dim, answers));
}

// ===== Response Quality =====
export function calculateResponseQuality(
  answers: Record<string, number>,
  responseTimeSeconds?: number,
): ResponseQuality {
  const allAnswers = Object.values(answers).filter((v) => typeof v === 'number');
  const missing = TOTAL_QUESTIONS - allAnswers.length;

  // 直线/全同分检测
  const uniform = allAnswers.length > 0 && allAnswers.every((v) => v === allAnswers[0]);

  // 答案分布 spread
  let spread = 0;
  if (allAnswers.length > 1) {
    const mean = allAnswers.reduce((a, b) => a + b, 0) / allAnswers.length;
    const variance = allAnswers.reduce((s, v) => s + (v - mean) ** 2, 0) / allAnswers.length;
    spread = Math.sqrt(variance);
  }

  const flags: string[] = [];
  if (missing > 0) flags.push(`缺题 ${missing} 道`);
  if (uniform) flags.push('所有题目选择相同');
  if (spread < 0.5 && allAnswers.length >= 20) flags.push('答案分布较窄');
  if (responseTimeSeconds && responseTimeSeconds < 60) flags.push('作答时间较短');

  return {
    missingQuestions: missing,
    straightLineRisk: uniform,
    uniformAnswerRisk: spread < 0.5 && allAnswers.length >= 20,
    allSameScore: uniform,
    answerSpread: spread,
    responseTimeSeconds,
    flags,
  };
}

// ===== Result Confidence Note =====
export function buildResultConfidenceNote(
  scores: DimensionScore[],
  rq: ResponseQuality,
): ResultConfidenceNote {
  // 同分数量
  const scoreCounts: Record<number, DimensionCode[]> = {};
  for (const s of scores) {
    if (!scoreCounts[s.score]) scoreCounts[s.score] = [];
    scoreCounts[s.score].push(s.dimension);
  }
  const tiesCount = Object.values(scoreCounts).filter((dims) => dims.length >= 2).length;

  // spread
  const mean = scores.reduce((s, x) => s + x.score, 0) / scores.length;
  const variance = scores.reduce((s, x) => s + (x.score - mean) ** 2, 0) / scores.length;
  const spread = Math.sqrt(variance);

  const parts: string[] = [];
  parts.push(`本测评共 24 题，每维 3 题，为轻量探索版。`);
  parts.push(`0-100 为本次题目量尺位置，不是人口百分位，norm_status = unapproved。`);

  if (rq.missingQuestions > 0) {
    parts.push(`你有 ${rq.missingQuestions} 道题未作答，分数按已答比例推算，结果仅供参考。`);
  }
  if (rq.allSameScore) {
    parts.push(`所有题目作答相同，结果区分度有限，可作为一次整体倾向参考。`);
  }
  if (tiesCount > 0) {
    parts.push(`有 ${tiesCount} 组维度分数接近或相同，说明这些方式在你目前状态中调用程度相似。`);
  }

  parts.push(`建议把结果当作一次自我观察的起点，而不是最终结论。`);

  return {
    questionCount: TOTAL_QUESTIONS,
    perDimensionQuestions: QUESTIONS_PER_DIMENSION,
    tiesCount,
    spread,
    responseQualityFlags: rq.flags,
    noteText: parts.join(''),
  };
}

// ===== Profile Signature =====
export function buildProfileSignature(scores: DimensionScore[], rq: ResponseQuality): ProfileSignature {
  const sorted = [...scores].sort((a, b) => b.score - a.score);
  const top3 = sorted.slice(0, 3).map((s) => s.dimension);
  const bottom2 = sorted.slice(-2).map((s) => s.dimension);

  // 同分检测（差距 ≤ 5 视为近似同分）
  const ties: Array<{ dimensions: DimensionCode[]; score: number }> = [];
  const scoreMap = new Map<number, DimensionCode[]>();
  for (const s of scores) {
    const bucket = Math.round(s.score / 5) * 5; // 5 分一挡
    if (!scoreMap.has(bucket)) scoreMap.set(bucket, []);
    scoreMap.get(bucket)!.push(s.dimension);
  }
  for (const [score, dims] of scoreMap) {
    if (dims.length >= 2) {
      ties.push({ dimensions: dims, score });
    }
  }

  // spread 与 balance
  const mean = scores.reduce((s, x) => s + x.score, 0) / scores.length;
  const variance = scores.reduce((s, x) => s + (x.score - mean) ** 2, 0) / scores.length;
  const spread = Math.sqrt(variance);
  // balance: 越高越均衡，100 表示全相等，0 表示极端分化
  const balance = Math.max(0, 100 - spread * 2);

  // 表达方向聚合（QM Visual Lens，非理论标准）
  const expr = { symbolic: 0, object: 0, people: 0 };
  for (const s of scores) {
    const dir = EXPRESSION_DIRECTION_MAP[s.dimension];
    expr[dir] += s.score;
  }
  const totalExpr = expr.symbolic + expr.object + expr.people;
  const expressionLens = {
    symbolic: Math.round((expr.symbolic / totalExpr) * 100),
    object: Math.round((expr.object / totalExpr) * 100),
    people: Math.round((expr.people / totalExpr) * 100),
  };

  // Pair Patterns（基于 28 组定义和实际分数）
  const pairPatterns = calculatePairPatterns(scores);

  // Headline
  const headline = generateHeadline(top3, expressionLens);

  const confidenceNote = buildResultConfidenceNote(scores, rq);

  return {
    top3,
    bottom2,
    ties,
    spread,
    balance,
    expressionLens,
    pairPatterns,
    contextFit: [], // 由场景模块补充
    responseQuality: rq,
    resultConfidenceNote: confidenceNote,
    headline,
  };
}

// ===== 28 组 Pair Matrix 计算 =====
export function calculatePairPatterns(scores: DimensionScore[]): PairPattern[] {
  const scoreMap = new Map<DimensionCode, number>();
  for (const s of scores) scoreMap.set(s.dimension, s.score);

  const patterns: PairPattern[] = [];

  for (const def of pairMatrixDefinitions) {
    const [d1, d2] = def.pair;
    const s1 = scoreMap.get(d1) ?? 50;
    const s2 = scoreMap.get(d2) ?? 50;
    const avg = (s1 + s2) / 2;
    const diff = Math.abs(s1 - s2);

    let relation = def.relation;
    let strength = avg;

    // 如果两个维度都高 → 更倾向 synergy / complement
    // 如果差距大 → 更倾向 context_switch / possible_friction
    if (avg >= 60 && diff <= 20) {
      relation = 'synergy';
      strength = avg;
    } else if (avg >= 50 && diff > 20 && diff <= 40) {
      relation = 'complement';
      strength = avg;
    } else if (diff > 40) {
      relation = 'context_switch';
      strength = 100 - diff; // 差距越大切换成本越高，强度越低
    } else if (avg < 40 && diff < 20) {
      relation = 'possible_friction';
      strength = 100 - avg;
    } else {
      // 保持定义中的基础关系
      strength = avg;
    }

    let description = def.synergyText;
    if (relation === 'complement' && def.complementText) description = def.complementText;
    if (relation === 'context_switch' && def.contextSwitchText) description = def.contextSwitchText;
    if (relation === 'possible_friction' && def.frictionText) description = def.frictionText;

    patterns.push({
      pair: def.pair,
      relation,
      strength: Math.round(strength),
      description,
      examples: def.commonScenarios,
      bridgeIfFriction: def.bridgeStrategy,
    });
  }

  return patterns;
}

// ===== Headline 生成 =====
function generateHeadline(
  top3: DimensionCode[],
  expressionLens: { symbolic: number; object: number; people: number },
): string {
  const dimNames: Record<DimensionCode, string> = {
    linguistic: '语言',
    logical: '逻辑',
    spatial: '空间',
    musical: '音乐',
    bodily: '动觉',
    interpersonal: '人际',
    intrapersonal: '内省',
    naturalist: '自然',
  };

  // 找主导表达方向
  const dirs = Object.entries(expressionLens) as [keyof typeof expressionLens, number][];
  dirs.sort((a, b) => b[1] - a[1]);
  const topDir = dirs[0][0];

  const dirLabel: Record<string, string> = {
    symbolic: '符号与表达',
    object: '物体与空间',
    people: '人际与内省',
  };

  return `你的当前轮廓：${top3.map((d) => dimNames[d]).join(' + ')} 更为显著，整体偏向${dirLabel[topDir]}方向调用。`;
}

// ===== 完整评分入口 =====
export function scoreAssessment(
  answers: Record<string, number>,
  options?: { responseTimeSeconds?: number },
): {
  questionnaireVersion: string;
  normStatus: string;
  scores: DimensionScore[];
  responseQuality: ResponseQuality;
  profileSignature: ProfileSignature;
  pairMatrix: PairPattern[];
} {
  const scores = calculateAllScores(answers);
  const rq = calculateResponseQuality(answers, options?.responseTimeSeconds);
  const signature = buildProfileSignature(scores, rq);

  return {
    questionnaireVersion: QUESTIONNAIRE_VERSION,
    normStatus: NORM_STATUS,
    scores,
    responseQuality: rq,
    profileSignature: signature,
    pairMatrix: signature.pairPatterns,
  };
}
