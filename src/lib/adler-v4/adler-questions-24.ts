// QM 阿德勒指数 v4.0 — 24 题题库
// 保留 DS2 原始题目文本与计分逻辑
// RAW_ASSESSMENT_READ_ONLY = true
// 0-4 评分，0-100 只称"本次维度位置"，不是人口百分位

import type { AdlerQuestion } from './adler-types';

export const QUESTIONNAIRE_VERSION = 'adler-v4.0';

export const LIKERT_SCALE = {
  min: 0,
  max: 4,
  labels: ['非常不符合', '不太符合', '一般', '比较符合', '非常符合'],
} as const;

// 24 题，4 维各 6 题，与 DS2 v3.0 完全一致
export const adlerQuestions24: AdlerQuestion[] = [
  // A 选择与行动感
  { id: 'A1', text: '遇到挫折时，我通常能找到一个自己还能做的小行动。', dimension: 'A' },
  { id: 'A2', text: '我能区分无法改变的事实，和我仍然可以选择的回应。', dimension: 'A' },
  { id: 'A3', text: '即使过去的经历正在影响我，我仍然能尝试新的做法。', dimension: 'A' },
  { id: 'A4', text: '遇到问题时，我更容易问"接下来我想怎么做"，而不只是反复想"为什么会这样"。', dimension: 'A' },
  { id: 'A5', text: '我可以允许自己暂时做不到，同时保留以后重新选择的空间。', dimension: 'A' },
  { id: 'A6', text: '做决定时，我愿意承担属于自己的那部分后果。', dimension: 'A' },
  // B 课题与边界感
  { id: 'B1', text: '别人不认同我时，我能区分"他的看法"和"我的选择"。', dimension: 'B' },
  { id: 'B2', text: '我可以关心别人，但不会把解决对方所有问题都当成自己的责任。', dimension: 'B' },
  { id: 'B3', text: '我表达自己的需要后，能允许对方有自己的回应。', dimension: 'B' },
  { id: 'B4', text: '我比较能识别一件事里哪些是我能控制的，哪些不是。', dimension: 'B' },
  { id: 'B5', text: '在关系中，我能设置边界，而不是主要靠讨好维持关系。', dimension: 'B' },
  { id: 'B6', text: '我能区分"支持别人"和"替别人承担"之间的不同。', dimension: 'B' },
  // C 勇气与成长感
  { id: 'C1', text: '看到别人比我优秀时，我更容易想"我可以学什么"，而不是马上否定自己。', dimension: 'C' },
  { id: 'C2', text: '失败后，我比较能把它看成反馈，而不是证明"我不行"。', dimension: 'C' },
  { id: 'C3', text: '我愿意做一点有风险、但符合自己方向的尝试。', dimension: 'C' },
  { id: 'C4', text: '我能承认自己的不足，同时不把"不足"直接等同于"没有价值"。', dimension: 'C' },
  { id: 'C5', text: '我更关注自己有没有比昨天前进一步，而不是一定要赢过别人。', dimension: 'C' },
  { id: 'C6', text: '即使害怕，我有时仍然能去做对自己重要的事情。', dimension: 'C' },
  // D 连接与共同体感
  { id: 'D1', text: '我的生活中至少有一些关系，让我感到"我属于这里"。', dimension: 'D' },
  { id: 'D2', text: '我能感受到自己对别人有价值，即使只是很小的贡献。', dimension: 'D' },
  { id: 'D3', text: '我既能帮助别人，也能在需要时接受别人的帮助。', dimension: 'D' },
  { id: 'D4', text: '我比较能把别人看作伙伴，而不只是竞争者或评审者。', dimension: 'D' },
  { id: 'D5', text: '我能在关系中感受到平等，而不是总觉得自己高人一等或低人一等。', dimension: 'D' },
  { id: 'D6', text: '我知道哪些人或群体，是我愿意持续建立连接的共同体。', dimension: 'D' },
];

// 按维度索引
export const questionsByDimension = adlerQuestions24.reduce(
  (acc, q) => {
    if (!acc[q.dimension]) acc[q.dimension] = [];
    acc[q.dimension].push(q);
    return acc;
  },
  {} as Record<string, AdlerQuestion[]>,
);

// 题目总数验证
export const QUESTION_COUNT = adlerQuestions24.length; // 24
