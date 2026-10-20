/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// QM 职业价值观测评 v4.0 — 24题 Quick 版题库
// questionnaire_version: 'quick-v4.0'
// 每维 3 题，共 24 题，5点 Likert（1-5）
// raw_read_only: true — 核心题库不改动，仅版本化封装

import type { WVQuestion, DimensionCode } from './wv-types';

export const QUESTIONNAIRE_VERSION = 'quick-v4.0';
export const QUESTION_COUNT = 24;
export const QUESTIONS_PER_DIMENSION = 3;
export const LIKERT_SCALE = { min: 1, max: 5 } as const;

export const wvQuestions24: WVQuestion[] = [
  // ===== achievement 成就满足（3题）=====
  {
    id: 'WV_Q01',
    text: '对我来说，工作做出成绩很重要',
    dimension: 'achievement',
  },
  {
    id: 'WV_Q09',
    text: '我享受完成有挑战的任务后的满足感',
    dimension: 'achievement',
  },
  {
    id: 'WV_Q17',
    text: '做出别人认可的成果让我有动力',
    dimension: 'achievement',
  },

  // ===== security 稳定安全（3题）=====
  {
    id: 'WV_Q02',
    text: '我希望工作是稳定的，不用太担心失业',
    dimension: 'security',
  },
  {
    id: 'WV_Q10',
    text: '变化太多的工作会让我不安',
    dimension: 'security',
  },
  {
    id: 'WV_Q18',
    text: '福利保障（社保、公积金、假期）很重要',
    dimension: 'security',
  },

  // ===== autonomy 自主独立（3题）=====
  {
    id: 'WV_Q03',
    text: '我希望能自主决定怎么做事',
    dimension: 'autonomy',
  },
  {
    id: 'WV_Q11',
    text: '被管太多会让我失去动力',
    dimension: 'autonomy',
  },
  {
    id: 'WV_Q19',
    text: '我喜欢按自己的方式和节奏做事',
    dimension: 'autonomy',
  },

  // ===== growth 成长发展（3题）=====
  {
    id: 'WV_Q04',
    text: '我希望工作中能不断学到新东西',
    dimension: 'growth',
  },
  {
    id: 'WV_Q12',
    text: '我在意职业发展的上升空间',
    dimension: 'growth',
  },
  {
    id: 'WV_Q20',
    text: '我希望工作能让我不断提升自己',
    dimension: 'growth',
  },

  // ===== relation 人际和谐（3题）=====
  {
    id: 'WV_Q05',
    text: '和同事处好关系对我很重要',
    dimension: 'relation',
  },
  {
    id: 'WV_Q13',
    text: '我喜欢在氛围好的团队里工作',
    dimension: 'relation',
  },
  {
    id: 'WV_Q21',
    text: '同事关系不好会严重影响我的工作感受',
    dimension: 'relation',
  },

  // ===== meaning 意义贡献（3题）=====
  {
    id: 'WV_Q06',
    text: '我希望我的工作对别人有帮助',
    dimension: 'meaning',
  },
  {
    id: 'WV_Q14',
    text: '我希望工作有超越赚钱的意义',
    dimension: 'meaning',
  },
  {
    id: 'WV_Q22',
    text: '能帮助他人的工作让我感到满足',
    dimension: 'meaning',
  },

  // ===== balance 生活平衡（3题）=====
  {
    id: 'WV_Q07',
    text: '工作不影响个人生活对我很重要',
    dimension: 'balance',
  },
  {
    id: 'WV_Q15',
    text: '加班太多的工作我很难接受',
    dimension: 'balance',
  },
  {
    id: 'WV_Q23',
    text: '我需要时间和精力照顾自己和家人',
    dimension: 'balance',
  },

  // ===== reward 经济回报（3题）=====
  {
    id: 'WV_Q08',
    text: '高收入是我选择工作的重要因素',
    dimension: 'reward',
  },
  {
    id: 'WV_Q16',
    text: '我愿意为更高的收入付出更多努力',
    dimension: 'reward',
  },
  {
    id: 'WV_Q24',
    text: '薪资水平是我评价一份工作的重要标准',
    dimension: 'reward',
  },
];

// 按维度索引题目
export function getQuestionsByDimension(dim: DimensionCode): WVQuestion[] {
  return wvQuestions24.filter((q) => q.dimension === dim);
}

// 按题号获取题目
export function getQuestionById(id: string): WVQuestion | undefined {
  return wvQuestions24.find((q) => q.id === id);
}

// 验证题库完整性
export function validateQuestionBank(): {
  valid: boolean;
  total: number;
  perDimension: Record<DimensionCode, number>;
  issues: string[];
} {
  const dimensions: DimensionCode[] = [
    'achievement', 'security', 'autonomy', 'growth',
    'relation', 'meaning', 'balance', 'reward',
  ];
  const issues: string[] = [];
  const perDimension = {} as Record<DimensionCode, number>;

  for (const dim of dimensions) {
    const count = wvQuestions24.filter((q) => q.dimension === dim).length;
    perDimension[dim] = count;
    if (count !== QUESTIONS_PER_DIMENSION) {
      issues.push(`${dim}: 期望 ${QUESTIONS_PER_DIMENSION} 题，实际 ${count} 题`);
    }
  }

  const total = wvQuestions24.length;
  if (total !== QUESTION_COUNT) {
    issues.push(`总题数：期望 ${QUESTION_COUNT}，实际 ${total}`);
  }

  // 检查 ID 唯一性
  const ids = wvQuestions24.map((q) => q.id);
  const uniqueIds = new Set(ids);
  if (uniqueIds.size !== ids.length) {
    issues.push('存在重复的题目 ID');
  }

  return {
    valid: issues.length === 0,
    total,
    perDimension,
    issues,
  };
}

// 未来 40 题 Enhanced 版规划（不在此版本实现）
export const ENHANCED_VERSION_PLAN = {
  version: 'enhanced-v4.0-planned',
  plannedQuestions: 40,
  plannedPerDimension: 5,
  note: '40题Enhanced版为未来规划，不在v4.0独立部署包中实现。' +
    '不同版本不得混用阈值、常模或可靠性结论。',
};
