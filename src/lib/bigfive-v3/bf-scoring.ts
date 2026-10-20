// QM Big Five 60 | 大五人格特质测评 v3.0 — 评分引擎
// 功能：原始分计算、连续分转换、Profile Signature、Response Quality、NORM_GATE
import { BF_QUESTIONS_60, BF_QUESTION_BANK } from './bf-questions-60';
import type {
  BFAnswer,
  BFRawScores,
  BFContinuousScores,
  BFProfileSignature,
  BFResponseQuality,
  BFNormGate,
  BFDimensionCode,
  BFFullResult,
} from './bf-types';

const DIMENSIONS: BFDimensionCode[] = ['O', 'C', 'E', 'A', 'N'];

// ===== 反向计分转换 =====
function reverseScore(raw: number): number {
  // 5点量表：1→5, 2→4, 3→3, 4→2, 5→1
  return 6 - raw;
}

// ===== 计算原始分 =====
export function calcRawScores(answers: BFAnswer[]): BFRawScores {
  const raw: Record<string, number> = { O: 0, C: 0, E: 0, A: 0, N: 0 };
  const answeredCount: Record<string, number> = { O: 0, C: 0, E: 0, A: 0, N: 0 };

  const qMap = new Map(BF_QUESTIONS_60.map(q => [q.id, q]));

  for (const ans of answers) {
    const q = qMap.get(ans.questionId);
    if (!q) continue;
    const score = q.reverse ? reverseScore(ans.answer) : ans.answer;
    raw[q.dimension] += score;
    answeredCount[q.dimension] += 1;
  }

  // 缺题按维度均值估算（仅用于计算，会在 Response Quality 中标记）
  for (const d of DIMENSIONS) {
    const total = BF_QUESTIONS_60.filter(q => q.dimension === d).length;
    if (answeredCount[d] > 0 && answeredCount[d] < total) {
      const avg = raw[d] / answeredCount[d];
      raw[d] = Math.round(raw[d] + avg * (total - answeredCount[d]));
    }
  }

  return raw as unknown as BFRawScores;
}

// ===== 转换为百分制连续分（内部位置 0-100）=====
// 每维12题 × 5分 = 60满分 → 线性映射到 0-100
export function rawToContinuous(raw: BFRawScores): BFContinuousScores {
  const maxPerDim = 60; // 12题 × 5分
  return {
    O: Math.round((raw.O / maxPerDim) * 100),
    C: Math.round((raw.C / maxPerDim) * 100),
    E: Math.round((raw.E / maxPerDim) * 100),
    A: Math.round((raw.A / maxPerDim) * 100),
    N: Math.round((raw.N / maxPerDim) * 100),
  };
}

// ===== Profile Signature =====
export function calcProfileSignature(
  scores: BFContinuousScores,
  normStatus: 'unapproved' | 'approved' = 'unapproved'
): BFProfileSignature {
  const entries = (Object.entries(scores) as [BFDimensionCode, number][])
    .sort((a, b) => b[1] - a[1]);

  const highest_2 = [entries[0][0], entries[1][0]];
  const lowest_2 = [entries[4][0], entries[3][0]]; // 从低到高
  const spread = entries[0][1] - entries[4][1];

  // 标准差（平衡度）
  const values = entries.map(e => e[1]);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  const balance = Math.round(Math.sqrt(variance) * 10) / 10;

  // 极端维度（>80 或 <20）
  const extreme_dimensions = entries
    .filter(([, v]) => v > 80 || v < 20)
    .map(([d]) => d);

  // 张力对（分差 > 40 的维度对）
  const tension_pairs: string[] = [];
  for (let i = 0; i < DIMENSIONS.length; i++) {
    for (let j = i + 1; j < DIMENSIONS.length; j++) {
      const d1 = DIMENSIONS[i];
      const d2 = DIMENSIONS[j];
      if (Math.abs(scores[d1] - scores[d2]) > 40) {
        tension_pairs.push(`${d1}×${d2}`);
      }
    }
  }

  return {
    highest_2,
    lowest_2,
    spread,
    balance,
    extreme_dimensions,
    tension_pairs,
    norm_status: normStatus,
  };
}

// ===== Response Quality 检测 =====
export function calcResponseQuality(
  answers: BFAnswer[],
  startTimeMs?: number,
  endTimeMs?: number
): BFResponseQuality {
  const warnings: string[] = [];
  const totalQ = BF_QUESTIONS_60.length;

  // 缺题检测
  const answeredIds = new Set(answers.map(a => a.questionId));
  const missing_items = totalQ - answeredIds.size;
  const completion_rate = answeredIds.size / totalQ;

  if (missing_items > 0) {
    warnings.push(`有 ${missing_items} 题未作答，已按维度均值估算，结果仅供参考。`);
  }

  // 直线作答检测
  const ansVals = answers.map(a => a.answer);
  const straightCount = ansVals.filter(v => v === ansVals[0]).length;
  const straight_lining = straightCount > Math.floor(totalQ * 0.8) && completion_rate > 0.8;
  const straight_lining_score = Math.round((straightCount / ansVals.length) * 100);

  if (straight_lining) {
    warnings.push('检测到大部分题目选择了相同答案，可能未认真作答，请谨慎解读结果。');
  }

  // 时长检测
  let total_duration_ms = 0;
  let avg_duration_per_q_ms = 0;
  let duration_flag: 'normal' | 'too_fast' | 'too_slow' = 'normal';

  if (startTimeMs && endTimeMs) {
    total_duration_ms = endTimeMs - startTimeMs;
    avg_duration_per_q_ms = total_duration_ms / answeredIds.size;

    if (avg_duration_per_q_ms < 2000) {
      duration_flag = 'too_fast';
      warnings.push('作答速度较快，建议未来测评时多花时间回想真实情境。');
    } else if (avg_duration_per_q_ms > 60000) {
      duration_flag = 'too_slow';
      warnings.push('作答时间较长，可能中途有停顿。');
    }
  }

  // 反向题一致性检测
  const qMap = new Map(BF_QUESTIONS_60.map(q => [q.id, q]));
  const dimRegular: Record<string, number[]> = { O: [], C: [], E: [], A: [], N: [] };
  const dimReverse: Record<string, number[]> = { O: [], C: [], E: [], A: [], N: [] };

  for (const ans of answers) {
    const q = qMap.get(ans.questionId);
    if (!q) continue;
    if (q.reverse) {
      dimReverse[q.dimension].push(reverseScore(ans.answer));
    } else {
      dimRegular[q.dimension].push(ans.answer);
    }
  }

  let consistencySum = 0;
  let consistencyCount = 0;

  for (const d of DIMENSIONS) {
    const reg = dimRegular[d];
    const rev = dimReverse[d];
    if (reg.length > 0 && rev.length > 0) {
      const regAvg = reg.reduce((a, b) => a + b, 0) / reg.length;
      const revAvg = rev.reduce((a, b) => a + b, 0) / rev.length;
      // 一致性：反向题翻转后与正向题均值越接近越一致
      // 差值 0 → 一致性 1；差值 4 → 一致性 0
      const diff = Math.abs(regAvg - revAvg);
      const consistency = Math.max(0, 1 - diff / 4);
      consistencySum += consistency;
      consistencyCount += 1;
    }
  }

  const reverse_consistency = consistencyCount > 0
    ? Math.round((consistencySum / consistencyCount) * 100) / 100
    : 1;

  if (reverse_consistency < 0.4) {
    warnings.push('部分维度的正向题与反向题答案差异较大，可能需要更仔细地理解题意。');
  }

  // 总体质量标记
  let overall_flag: 'reliable' | 'caution' | 'low_quality' = 'reliable';
  const issues = [
    completion_rate < 0.7,
    straight_lining,
    duration_flag === 'too_fast' && avg_duration_per_q_ms < 1500,
    reverse_consistency < 0.3,
  ].filter(Boolean).length;

  if (issues >= 2) {
    overall_flag = 'low_quality';
  } else if (issues === 1) {
    overall_flag = 'caution';
  }

  return {
    missing_items,
    completion_rate: Math.round(completion_rate * 100) / 100,
    straight_lining,
    straight_lining_score,
    total_duration_ms,
    avg_duration_per_q_ms: Math.round(avg_duration_per_q_ms),
    duration_flag,
    reverse_consistency,
    overall_flag,
    warnings,
  };
}

// ===== NORM_GATE =====
// v3.0 当前无 approved 常模，不显示人口百分位
export function getNormGate(): BFNormGate {
  return {
    status: 'unapproved',
    reason: '当前版本未建立与本题库（v3.0/60题/中文/5点计分）完全匹配的approved常模数据，因此不提供人口百分位。',
    display_percentile: false,
  };
}

// ===== 完整结果组装 =====
export function computeFullResult(
  answers: BFAnswer[],
  startTimeMs?: number,
  endTimeMs?: number
): BFFullResult {
  const raw = calcRawScores(answers);
  const continuous = rawToContinuous(raw);
  const normGate = getNormGate();
  const profileSig = calcProfileSignature(continuous, normGate.status);
  const quality = calcResponseQuality(answers, startTimeMs, endTimeMs);

  return {
    version: 'v3.0',
    license_status: BF_QUESTION_BANK.license_status,
    norm_gate: normGate,
    raw_scores: raw,
    continuous_scores: continuous,
    profile_signature: profileSig,
    response_quality: quality,
    selected_modules: [],
    whisper_units: [],
    generated_at: new Date().toISOString(),
  };
}

// ===== 获取强度档位 =====
export function getIntensityBand(score: number): 'low' | 'mid_low' | 'mid_high' | 'high' {
  if (score < 25) return 'low';
  if (score < 50) return 'mid_low';
  if (score < 75) return 'mid_high';
  return 'high';
}

export default {
  calcRawScores,
  rawToContinuous,
  calcProfileSignature,
  calcResponseQuality,
  getNormGate,
  computeFullResult,
  getIntensityBand,
};
