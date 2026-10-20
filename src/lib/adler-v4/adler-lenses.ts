/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// QM 阿德勒指数 v4.0 — 7 个阿德勒 Lens
// Belonging / Contribution / Encouragement / Life Tasks /
// Goal Orientation / Private Logic / Safeguarding Tendencies
// Private Logic 与 Goal Orientation 必须是探索假设，至少给 2 种替代解释

import type { AdlerianLens, LensCode } from './adler-types';

export const adlerianLenses: Record<LensCode, AdlerianLens> = {
  belonging: {
    code: 'belonging',
    name: '归属感',
    description:
      '人最根本的需求之一，是感到"我属于这里"。归属感不是被所有人喜欢，' +
      '而是在至少一些关系中，你可以做真实的自己，同时被接纳。',
    keyQuestions: [
      '在哪些人面前，你觉得"我属于这里"？',
      '什么时候你最感到孤单？那个时候，你在渴望什么？',
      '你用什么方式确认"我是被接纳的"？',
    ],
    relatedDimensions: ['D', 'B'],
    isHypothetical: false,
  },
  contribution: {
    code: 'contribution',
    name: '贡献感',
    description:
      '贡献感是"我对别人有用、我有价值"的感受。它不是做了多少大事，' +
      '而是一种"我的存在对某个人或某个共同体有意义"的体验。',
    keyQuestions: [
      '什么时候你觉得"我对别人有用"？',
      '对你来说，"贡献"是什么样子的？',
      '你能接受别人的帮助吗？还是更习惯只付出？',
    ],
    relatedDimensions: ['D', 'C'],
    isHypothetical: false,
  },
  encouragement: {
    code: 'encouragement',
    name: '鼓励',
    description:
      '鼓励不是"加油"，而是帮助一个人看到自己的资源和可能性。' +
      '阿德勒取向的鼓励，关注的是"你是谁"而不是"你做得怎么样"。',
    keyQuestions: [
      '你最需要鼓励的时候是什么样子？',
      '什么样的话对你来说是真正的鼓励？',
      '你会怎么鼓励一个遇到困难的朋友？你会这样对自己说话吗？',
    ],
    relatedDimensions: ['C', 'D'],
    isHypothetical: false,
  },
  life_tasks: {
    code: 'life_tasks',
    name: '生活任务',
    description:
      '阿德勒认为人有三大生活任务：工作（职业）、社交（友谊）、爱（亲密关系）。' +
      'QM 在此基础上扩展了自我关系和共同体参与。',
    keyQuestions: [
      '目前你在哪个生活任务上投入最多？',
      '哪个生活任务让你最有满足感？',
      '有没有哪个生活任务是你一直在回避的？',
    ],
    relatedDimensions: ['A', 'B', 'C', 'D'],
    isHypothetical: false,
  },
  goal_orientation: {
    code: 'goal_orientation',
    name: '目标取向（假设）',
    description:
      '阿德勒目的论认为：人的行为是被目标驱动的，而不是被过去决定的。' +
      '每个行为背后都有一个"想要达成什么"的目的。' +
      '注意：这是探索性假设，不是事实判断。',
    keyQuestions: [
      '如果你的这个行为有一个目的，它可能想帮你达成什么？',
      '这个行为在保护你免受什么？',
      '有没有可能，你想要的东西和你正在做的事，方向是相反的？',
    ],
    relatedDimensions: ['A', 'C'],
    isHypothetical: true, // 目标取向是假设
  },
  private_logic: {
    code: 'private_logic',
    name: '私人逻辑（假设）',
    description:
      '每个人都有一套自己的"生活哲学"——关于世界是什么样的、人是什么样的、' +
      '我是什么样的、我应该怎么做。这套私人逻辑影响着我们的每一个选择。' +
      '注意：这是探索性假设，不是事实判断。',
    keyQuestions: [
      '在这件事里，你假设了什么？（比如"如果我……别人就会……"）',
      '这个假设是从哪里来的？它一定对吗？',
      '如果换一个假设，会发生什么？',
    ],
    relatedDimensions: ['B', 'C'],
    isHypothetical: true, // 私人逻辑是假设
  },
  safeguarding_tendencies: {
    code: 'safeguarding_tendencies',
    name: '自我保护倾向',
    description:
      '当我们感到自卑或受到威胁时，会使用一些策略来保护自己的自尊。' +
      '阿德勒称之为" safeguarding tendencies"（自我保护倾向）。' +
      '这些策略本身不是问题，但如果过度使用，可能会限制我们的生活。',
    keyQuestions: [
      '当你感到不安时，你通常会怎么做？（回避？攻击？合理化？）',
      '这个保护策略在什么时候是有用的？',
      '什么时候它反而让你更不自由了？',
    ],
    relatedDimensions: ['B', 'C', 'A'],
    isHypothetical: false,
  },
};

// 需要至少 2 种替代解释的 Lens
export const HYPOTHETICAL_LENSES: LensCode[] = ['private_logic', 'goal_orientation'];

// 核心 Lens（用于 Story Mirror 四个核心 ≥100 候选）
export const CORE_LENSES: LensCode[] = [
  'belonging',
  'contribution',
  'encouragement',
  'life_tasks',
];

export function getLens(code: LensCode): AdlerianLens {
  return adlerianLenses[code];
}

export function getLensName(code: LensCode): string {
  return adlerianLenses[code]?.name || code;
}

export function isHypotheticalLens(code: LensCode): boolean {
  return adlerianLenses[code]?.isHypothetical || false;
}
