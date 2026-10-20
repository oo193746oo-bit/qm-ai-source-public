// QM 阿德勒指数 v4.0 — 4 维内容标准
// 每个维度包含：描述、阿德勒概念、显现、资源、代价、场景、观察问题
// 注意：不是高低好坏，是"本次维度位置"

import type { DimensionProfile, DimensionCode } from './adler-types';
import { DIMENSION_COLORS, DIMENSION_NAMES, DIMENSION_SHORT } from './adler-types';

export const adlerDimensions: Record<DimensionCode, DimensionProfile> = {
  A: {
    code: 'A',
    name: DIMENSION_NAMES.A,
    shortName: DIMENSION_SHORT.A,
    description:
      '面对限制和不确定性时，是否仍能识别自己可以选择和行动的部分。' +
      '这不是行动力强弱，而是一种"在有限中仍能看见选择"的觉察能力。',
    color: DIMENSION_COLORS.A,
    adlerianConcepts: ['目的论', '创造性自我', '主体性', '选择的责任'],
    whatShowsUp: [
      '遇到困境时，倾向于先看"我还能做什么"，而不是停在"为什么是我"',
      '能区分无法改变的事实，和自己仍然可以选择的回应方式',
      '做决定后，愿意承担属于自己的那部分后果',
      '允许自己暂时做不到，同时保留以后重新选择的空间',
      '面对过去的影响，仍然愿意尝试新的做法',
    ],
    possibleResources: [
      '在限制中仍然能找到行动的支点',
      '不容易被"没办法"三个字困住',
      '对自己的选择有清明的承担感',
      '遇到挫折时复原的路径比较清晰',
    ],
    possibleCosts: [
      '有时可能过度强调"我可以选"，而忽略环境和结构性限制',
      '在需要等待、需要他人配合时，可能感到不耐烦',
      '如果行动没有立即效果，可能会有挫败感',
    ],
    commonScenes: [
      '遇到挫折或失败时',
      '需要做重要决定时',
      '面对过去经历的影响时',
      '感到被困住、没有选择时',
    ],
    observationQuestions: [
      '在什么情境下，我更容易想起"我还可以选择"？',
      '什么时候我会觉得"没办法"，那时候我在忽略什么？',
      '我的选择，是出于我想要的，还是出于害怕？',
    ],
  },
  B: {
    code: 'B',
    name: DIMENSION_NAMES.B,
    shortName: DIMENSION_SHORT.B,
    description:
      '能否区分自己的选择、责任和情绪，与他人的选择、反应和情绪。' +
      '课题分离不是冷漠，而是在关系中更清明地知道"什么是我的，什么是对方的"。',
    color: DIMENSION_COLORS.B,
    adlerianConcepts: ['课题分离', '责任归位', '边界', '控制圈'],
    whatShowsUp: [
      '别人不认同我时，能区分"他的看法"和"我的选择"',
      '可以关心别人，但不会把解决对方所有问题都当成自己的责任',
      '表达需要后，能允许对方有自己的回应',
      '比较能识别一件事里哪些是我能控制的，哪些不是',
      '在关系中能设置边界，而不是主要靠讨好维持关系',
    ],
    possibleResources: [
      '不容易为别人的情绪过度负责',
      '在关系中能保持自己的主体性',
      '做选择时比较不容易被他人的期待绑架',
      '能区分支持和替别人承担的不同',
    ],
    possibleCosts: [
      '有时可能因为太强调边界，让身边的人觉得有距离',
      '在需要深度共情的时刻，可能过早地"归位课题"',
      '在紧密关系中，可能需要学习柔软和依赖',
    ],
    commonScenes: [
      '关系中的冲突和分歧',
      '家人或朋友的期待',
      '需要拒绝别人时',
      '感觉被别人的情绪影响时',
    ],
    observationQuestions: [
      '我在替谁承担什么？那真的是我的课题吗？',
      '当我设置边界时，我在害怕什么？',
      '在什么关系里，我最容易模糊边界？',
    ],
  },
  C: {
    code: 'C',
    name: DIMENSION_NAMES.C,
    shortName: DIMENSION_SHORT.C,
    description:
      '如何面对自卑、失败、比较、不完美和新挑战。' +
      '勇气不是没有恐惧，而是即使害怕，仍然愿意去做对自己重要的事。',
    color: DIMENSION_COLORS.C,
    adlerianConcepts: ['自卑与超越', '鼓励', '追求优越', '共同体感觉中的自我接纳'],
    whatShowsUp: [
      '看到别人优秀时，更容易想"我可以学什么"，而不是否定自己',
      '失败后比较能把它看成反馈，而不是证明"我不行"',
      '愿意做一点有风险、但符合自己方向的尝试',
      '能承认自己的不足，同时不把"不足"等同于"没有价值"',
      '更关注自己有没有比昨天前进一步，而不是赢过别人',
    ],
    possibleResources: [
      '面对不完美时有较强的复原力',
      '在挑战中更容易看到成长的可能',
      '不容易被比较和评价击倒',
      '愿意走出舒适区尝试新事物',
    ],
    possibleCosts: [
      '有时可能对自己要求太高，休息时也有负罪感',
      '可能低估环境的难度，对挫折的预期不足',
      '在需要停下来、需要被照顾时，可能不习惯示弱',
    ],
    commonScenes: [
      '失败或犯错后',
      '面对新的挑战时',
      '与他人比较的场合',
      '需要在公众面前表达时',
    ],
    observationQuestions: [
      '当我做不好时，我对自己说的第一句话是什么？',
      '什么情境下，我最容易否定自己？',
      '如果把"我不行"换成"我还在学"，会发生什么？',
    ],
  },
  D: {
    code: 'D',
    name: DIMENSION_NAMES.D,
    shortName: DIMENSION_SHORT.D,
    description:
      '是否体验到归属、合作、接受帮助、贡献以及人与人之间的平等。' +
      '共同体感不是受欢迎程度，而是一种"我在这里，我和别人有关系"的感受。',
    color: DIMENSION_COLORS.D,
    adlerianConcepts: ['社会兴趣', '共同体感', '贡献感', '平等感', '归属'],
    whatShowsUp: [
      '生活中至少有一些关系，让我感到"我属于这里"',
      '能感受到自己对别人有价值，即使只是很小的贡献',
      '既能帮助别人，也能在需要时接受别人的帮助',
      '比较能把别人看作伙伴，而不只是竞争者或评审者',
      '能在关系中感受到平等，而不是总觉得高人一等或低人一等',
    ],
    possibleResources: [
      '在困境中有可以求助的人',
      '做事情时能感受到"和他人一起"的力量',
      '能在贡献中获得意义感',
      '在群体中比较不容易感到孤单',
    ],
    possibleCosts: [
      '有时可能为了维持连接，而忽略自己的需要',
      '在缺少共同体支持的环境里，可能更容易感到无力',
      '如果关系出现裂痕，可能需要更多时间修复',
    ],
    commonScenes: [
      '感到孤单或被排斥时',
      '在新的群体或环境中',
      '需要向别人求助时',
      '想要参与和贡献时',
    ],
    observationQuestions: [
      '在哪些人面前，我能感到"我属于这里"？',
      '当我感到孤单时，我通常会做什么？',
      '对我来说，"贡献"是什么样子的？',
    ],
  },
};

export function getDimensionName(code: DimensionCode): string {
  return adlerDimensions[code]?.name || code;
}

export function getDimensionColor(code: DimensionCode): string {
  return adlerDimensions[code]?.color || '#6B4C9A';
}

export function getDimensionProfile(code: DimensionCode): DimensionProfile {
  return adlerDimensions[code];
}
