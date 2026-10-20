// SCL-90 评分引擎 — 纯函数，无副作用
// V01 总分等级表：已 approved（中国常模筛查阈值）
// V02 阳性症状痛苦水平（PSDI）：已 approved

import {
  scl90Factors,
  scl90Questions,
  type TotalScreeningLevel,
  type FactorScreeningTier,
} from './scl90-data';

export type Scl90Answers = Record<string, number>; // { Q1: 1..5, ... }

export interface FactorResult {
  factorCode: string;
  factorName: string;
  sum: number;
  mean: number;
  itemCount: number;
  positiveCount: number; // 得分 >=2 的题数
  tier: FactorScreeningTier; // V01 approved: normal / mild / moderate / severe
  tierLabel: string;
}

export interface Scl90ScoreResult {
  totalScore: number;         // 总分，理论范围 90-450
  totalMean: number;          // 总均分 = 总分/90
  gsi: number;                // GSI（全局严重指数）= 总均分
  positiveItems: number;      // 阳性项目数 PST（得分 >= 2 的题数），范围 0-90
  psdi: number | null;        // V02 approved: 阳性症状痛苦水平 = 总分 / 阳性项目数（阳性项目数为 0 时为 null）
  screeningLevel: TotalScreeningLevel; // V01 approved: 总分筛查等级
  screeningLabel: string;              // 等级中文标签
  screeningDescription: string;        // 等级描述
  factorResults: FactorResult[];
  completeness: { answered: number; complete: boolean };
}

/**
 * 计算总分筛查等级（V01 approved，基于中国常模）
 * 总分 < 160: 常规范围
 * 160-219: 轻度症状困扰
 * 220-299: 中度症状困扰
 * >= 300: 较明显症状困扰
 */
function getTotalScreeningLevel(totalScore: number): {
  level: TotalScreeningLevel;
  label: string;
  description: string;
} {
  if (totalScore >= 300) {
    return {
      level: 'severe',
      label: '较明显症状困扰',
      description: '症状困扰较为明显，建议尽快联系专业心理或医疗资源。',
    };
  }
  if (totalScore >= 220) {
    return {
      level: 'moderate',
      label: '中度症状困扰',
      description: '存在中度症状困扰，建议考虑寻求专业心理支持。',
    };
  }
  if (totalScore >= 160) {
    return {
      level: 'mild',
      label: '轻度症状困扰',
      description: '存在轻度症状困扰，建议关注自身状态，加强自我照顾。',
    };
  }
  return {
    level: 'minimal',
    label: '常规范围',
    description: '总分在常规范围内，建议继续保持自我观察。',
  };
}

/**
 * 计算因子筛查档位（V01 approved）
 * 因子均分 < 2.0: 常规范围
 * 2.0-2.9: 轻度
 * 3.0-3.9: 中度
 * >= 4.0: 偏重
 */
function getFactorTier(mean: number): { tier: FactorScreeningTier; label: string } {
  if (mean >= 4.0) return { tier: 'severe', label: '偏重' };
  if (mean >= 3.0) return { tier: 'moderate', label: '中度' };
  if (mean >= 2.0) return { tier: 'mild', label: '轻度' };
  return { tier: 'normal', label: '常规范围' };
}

/**
 * 计算 SCL-90 得分
 * @param answers 90 题答案 { Q1: 1..5, ... }
 * @returns 评分结果（V01/V02 均已 approved）
 */
export function calculateScl90(answers: Scl90Answers): Scl90ScoreResult {
  const validAnswers = scl90Questions
    .map((q) => answers[q.id])
    .filter((v) => typeof v === 'number' && v >= 1 && v <= 5);
  const answered = validAnswers.length;
  const complete = answered === 90;

  // 总分
  const totalScore = validAnswers.reduce((sum, v) => sum + v, 0);

  // 总均分（GSI）
  const totalMean = answered > 0 ? totalScore / answered : 0;
  const gsi = totalMean;

  // 阳性项目数 PST（得分 >= 2）
  const positiveItems = validAnswers.filter((v) => v >= 2).length;

  // V02 approved: 阳性症状痛苦水平 PSDI = 总分 / 阳性项目数
  // 如果阳性项目数为 0（所有题都是 1 分），则 PSDI 无意义，返回 null
  const psdi = positiveItems > 0 ? totalScore / positiveItems : null;

  // V01 approved: 总分筛查等级
  const screening = getTotalScreeningLevel(totalScore);

  // 各因子得分
  const factorResults: FactorResult[] = scl90Factors.map((factor) => {
    const factorQuestions = scl90Questions.filter((q) => q.dimension === factor.code);
    const factorAnswers = factorQuestions
      .map((q) => answers[q.id])
      .filter((v) => typeof v === 'number' && v >= 1 && v <= 5);
    const sum = factorAnswers.reduce((s, v) => s + v, 0);
    const count = factorAnswers.length;
    const mean = count > 0 ? sum / count : 0;
    const positiveCount = factorAnswers.filter((v) => v >= 2).length;
    const { tier, label } = getFactorTier(mean);
    return {
      factorCode: factor.code,
      factorName: factor.name,
      sum,
      mean,
      itemCount: factor.itemCount,
      positiveCount,
      tier,
      tierLabel: label,
    };
  });

  return {
    totalScore,
    totalMean,
    gsi,
    positiveItems,
    psdi,
    screeningLevel: screening.level,
    screeningLabel: screening.label,
    screeningDescription: screening.description,
    factorResults,
    completeness: { answered, complete },
  };
}

/**
 * 安全闸门：检查是否触发危机关键词
 * 当前规则：Q15（想结束自己的生命）得分 >= 阈值 或 Q59（想到死亡的事）得分 >= 阈值
 * 注意：单个风险题不能独立完成风险判定，仅触发安全覆盖 UI
 */
export function checkCrisisRisk(
  answers: Scl90Answers,
  threshold = 4
): {
  hasCrisisRisk: boolean;
  triggeredQuestions: { id: string; score: number }[];
} {
  const crisisQIds = ['Q15', 'Q59'];
  const triggered = crisisQIds
    .map((id) => ({ id, score: answers[id] }))
    .filter((item) => typeof item.score === 'number' && item.score >= threshold);
  return {
    hasCrisisRisk: triggered.length > 0,
    triggeredQuestions: triggered,
  };
}

/**
 * 获取因子叙事档位（用于选择叙事文本）
 * 将 4 档映射为 3 档叙事：normal → low, mild → mid, moderate/severe → high
 * 叙事文本不使用诊断语言，仅作用户视角描述
 */
export function getNarrativeTier(mean: number): 'low' | 'mid' | 'high' {
  if (mean < 2) return 'low';
  if (mean < 3) return 'mid';
  return 'high';
}
