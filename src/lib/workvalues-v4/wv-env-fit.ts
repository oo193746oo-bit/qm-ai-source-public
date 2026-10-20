/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// QM 职业价值观测评 v4.0 — Work Environment Fit 8 参数
// 不推荐具体职业名称，输出环境参数供看 JD、面试、offer 时参考

import type {
  EnvParameter,
  EnvParamCode,
  EnvFitResult,
  DimensionCode,
  DimensionScore,
} from './wv-types';

// 8 个环境参数定义
export const wvEnvParameters: Record<EnvParamCode, EnvParameter> = {
  autonomy: {
    code: 'autonomy',
    name: '自主度',
    description: '你对工作方式、节奏、决策的掌控程度',
    lowLabel: '规则明确、层级清晰、按流程办事',
    highLabel: '结果导向、自主决策、灵活方式',
    mappedFrom: ['autonomy'],
  },
  feedback_speed: {
    code: 'feedback_speed',
    name: '反馈速度',
    description: '工作结果得到反馈和认可的速度',
    lowLabel: '长期项目、反馈周期长、慢热型',
    highLabel: '即时反馈、快速迭代、短周期出结果',
    mappedFrom: ['achievement', 'growth'],
  },
  stability: {
    code: 'stability',
    name: '稳定性',
    description: '工作内容、组织、收入的可预期程度',
    lowLabel: '变化快、风险高、不确定性大',
    highLabel: '稳定可预期、风险低、制度完善',
    mappedFrom: ['security'],
  },
  income_upside: {
    code: 'income_upside',
    name: '收入上行空间',
    description: '收入增长的潜力和上限',
    lowLabel: '收入平稳、增长缓慢、天花板低',
    highLabel: '上不封顶、增长快、奖金/期权空间大',
    mappedFrom: ['reward', 'achievement'],
  },
  collaboration_density: {
    code: 'collaboration_density',
    name: '协作密度',
    description: '工作中需要与人协作和社交的频率',
    lowLabel: '独立工作为主、深度专注、少开会',
    highLabel: '高频协作、团队作战、社交密集',
    mappedFrom: ['relation'],
  },
  innovation_space: {
    code: 'innovation_space',
    name: '创新空间',
    description: '尝试新方法、创造新事物的空间和自由度',
    lowLabel: '按成熟流程办事、少变化、重执行',
    highLabel: '鼓励创新、允许试错、探索新领域',
    mappedFrom: ['autonomy', 'growth', 'meaning'],
  },
  social_impact: {
    code: 'social_impact',
    name: '社会影响',
    description: '工作对他人和社会产生正面影响的程度',
    lowLabel: '主要是商业目标、间接影响为主',
    highLabel: '直接服务他人、社会价值明确、使命驱动',
    mappedFrom: ['meaning'],
  },
  time_boundary: {
    code: 'time_boundary',
    name: '时间边界',
    description: '工作和生活的边界清晰度',
    lowLabel: '工作生活融合、随时待命、界限模糊',
    highLabel: '上下班清晰、下班能抽离、假期完整',
    mappedFrom: ['balance'],
  },
};

// 8 个参数的顺序（用于展示）
export const ENV_PARAM_ORDER: EnvParamCode[] = [
  'autonomy',
  'feedback_speed',
  'stability',
  'income_upside',
  'collaboration_density',
  'innovation_space',
  'social_impact',
  'time_boundary',
];

/**
 * 根据 8 维价值观分数计算 Work Environment Fit
 * 每个环境参数由对应的价值维度映射而来
 * 注意：这是基于价值观的环境偏好推导，不代表实际能力匹配
 */
export function calcEnvFit(scores: DimensionScore[]): EnvFitResult {
  const scoreMap = new Map<DimensionCode, number>();
  for (const s of scores) {
    scoreMap.set(s.dimension, s.score);
  }

  const params = {} as Record<EnvParamCode, number>;

  for (const code of ENV_PARAM_ORDER) {
    const param = wvEnvParameters[code];
    const mappedScores = param.mappedFrom
      .map((dim) => scoreMap.get(dim) ?? 50)
      .filter((s) => s > 0);

    if (mappedScores.length === 0) {
      params[code] = 50;
    } else {
      // 加权平均（按映射的维度数量）
      const avg = mappedScores.reduce((sum, s) => sum + s, 0) / mappedScores.length;
      params[code] = Math.round(avg);
    }
  }

  // 生成解读
  const highParams = ENV_PARAM_ORDER.filter((p) => params[p] >= 70);
  const lowParams = ENV_PARAM_ORDER.filter((p) => params[p] < 40);

  let interpretation = '根据你的价值优先级，以下是你可能偏好的工作环境特征：';
  if (highParams.length > 0) {
    interpretation += `你比较看重的环境要素有：${highParams.map((p) => wvEnvParameters[p].name).join('、')}。`;
  }
  if (lowParams.length > 0) {
    interpretation += `相对不太重要的要素有：${lowParams.map((p) => wvEnvParameters[p].name).join('、')}。`;
  }
  interpretation += '这只是基于价值观的偏好推导，实际找工作时还要结合能力、机会和阶段综合考虑。';

  // JD 检查清单
  const jdChecklist = generateJDChecklist(params);

  return { params, interpretation, jdChecklist };
}

/**
 * 生成看 JD 时的检查清单
 * 帮助用户把环境偏好转化为具体的观察点
 */
function generateJDChecklist(params: Record<EnvParamCode, number>): string[] {
  const checklist: string[] = [];

  if (params.autonomy >= 60) {
    checklist.push('这个岗位有多大的决策权限？日常工作的自由度如何？');
  } else {
    checklist.push('这个岗位的工作流程和规范是否清晰？有没有明确的指导？');
  }

  if (params.feedback_speed >= 60) {
    checklist.push('绩效评价周期是多久？多久能收到一次具体的反馈？');
  }

  if (params.stability >= 60) {
    checklist.push('这个团队和业务线的稳定性如何？过去一年人员变动大吗？');
  }

  if (params.income_upside >= 60) {
    checklist.push('调薪机制是怎样的？奖金/期权/提成的结构和上限是什么？');
  }

  if (params.collaboration_density >= 60) {
    checklist.push('团队规模有多大？日常协作的方式和频率是怎样的？');
  } else {
    checklist.push('这个岗位有多少时间是独立工作？需要开多少会？');
  }

  if (params.innovation_space >= 60) {
    checklist.push('团队鼓励尝试新方法吗？失败了会怎样？有没有创新的空间和资源？');
  }

  if (params.social_impact >= 60) {
    checklist.push('这份工作的社会价值体现在哪？用户或服务对象是谁？');
  }

  if (params.time_boundary >= 60) {
    checklist.push('团队的加班文化是怎样的？上下班时间和假期政策是否明确？');
  } else {
    checklist.push('工作的灵活性如何？如果临时有事能不能调整时间？');
  }

  return checklist;
}

/**
 * Offer 比较工具：把用户输入的多个机会按 8 个环境参数打分
 * 注意：只比较不替用户选
 */
export interface OfferOption {
  id: string;
  name: string;
  scores: Partial<Record<EnvParamCode, number>>; // 用户自评 0-100
}

export interface OfferComparisonResult {
  options: Array<{
    id: string;
    name: string;
    weightedScore: number;
    paramScores: Record<EnvParamCode, number>;
    strengths: string[];
    tradeoffs: string[];
  }>;
  note: string;
  disclaimer: string;
}

export function compareOffers(
  offers: OfferOption[],
  valueWeights: Record<EnvParamCode, number>, // 来自价值观的权重
): OfferComparisonResult {
  const totalWeight = Object.values(valueWeights).reduce((a, b) => a + b, 0) || 1;

  const results = offers.map((offer) => {
    const paramScores = {} as Record<EnvParamCode, number>;
    let weightedScore = 0;
    const strengths: string[] = [];
    const tradeoffs: string[] = [];

    for (const code of ENV_PARAM_ORDER) {
      const score = offer.scores[code] ?? 50;
      paramScores[code] = score;
      const weight = valueWeights[code] ?? 50;
      weightedScore += (score * weight) / totalWeight;

      if (score >= 70 && weight >= 60) {
        strengths.push(`${wvEnvParameters[code].name}高且你很看重`);
      }
      if (score < 40 && weight >= 60) {
        tradeoffs.push(`${wvEnvParameters[code].name}低但你很看重`);
      }
    }

    return {
      id: offer.id,
      name: offer.name,
      weightedScore: Math.round(weightedScore),
      paramScores,
      strengths,
      tradeoffs,
    };
  });

  return {
    options: results,
    note: '加权分数只是参考，不是排名。每个offer都有得有失，最终选择取决于你最不能接受的是什么。',
    disclaimer:
      'QM AI 提供比较维度，但不替你做决定。重要的决定建议多和信任的人聊聊，给自己足够的时间。',
  };
}

// 验证 8 个环境参数
export function validateEnvFit(): { total: number; valid: boolean } {
  const total = Object.keys(wvEnvParameters).length;
  return { total, valid: total === 8 };
}
