/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// QM-GDI-48 v4.1 题库文件
// 48题 / 8维 / 7点李克特 + N/A
// 题目来源：QM_性别多元指数_QM-GDI-48_v4.1_全简体校正版
// ⚠️ 题目文字逐字录入，不可修改
// 反向题计分：8 - raw

import { QuestionItem, DimensionCode } from './gdi-types';

export const GDI_QUESTIONS_48: QuestionItem[] = [
  // ===== IGS 内在性别感 (6题) =====
  {
    id: 'IGS1',
    dimension: 'IGS',
    text: '我能觉察到自己内在的性别感受，即使它很难用一个词说清。',
    reverse: false,
  },
  {
    id: 'IGS2',
    dimension: 'IGS',
    text: '“性别”对我来说，是自我经验中一个能够被感受到的部分。',
    reverse: false,
  },
  {
    id: 'IGS3',
    dimension: 'IGS',
    text: '当我静下来想“我是谁”时，我对自己的性别有某种内在方向感。',
    reverse: false,
  },
  {
    id: 'IGS4',
    dimension: 'IGS',
    text: '我的性别感受有自己的逻辑，不必完全依赖别人如何看我。',
    reverse: false,
  },
  {
    id: 'IGS5',
    dimension: 'IGS',
    text: '我能分辨“别人期待我是什么样”与“我自己内在如何感受”。',
    reverse: false,
  },
  {
    id: 'IGS6',
    dimension: 'IGS',
    text: '我很少能察觉自己是否有任何性别上的内在感受。',
    reverse: true,
  },

  // ===== SDO 自我定义与开放性 (6题) =====
  {
    id: 'SDO1',
    dimension: 'SDO',
    text: '我允许自己用最适合我的语言描述性别，而不必局限于固定选项。',
    reverse: false,
  },
  {
    id: 'SDO2',
    dimension: 'SDO',
    text: '即使暂时没有准确标签，我也能容许自己保持开放。',
    reverse: false,
  },
  {
    id: 'SDO3',
    dimension: 'SDO',
    text: '如果我的性别理解随着时间变化，我仍能把这种变化视为真实经验。',
    reverse: false,
  },
  {
    id: 'SDO4',
    dimension: 'SDO',
    text: '我更在意自己的实际感受，而不是先找到一个“正确答案”。',
    reverse: false,
  },
  {
    id: 'SDO5',
    dimension: 'SDO',
    text: '我能区分“给自己命名”与“被别人替我命名”。',
    reverse: false,
  },
  {
    id: 'SDO6',
    dimension: 'SDO',
    text: '如果我不能立刻确定一个明确标签，我会觉得自己的性别经验不成立。',
    reverse: true,
  },

  // ===== EA 表达真实感 (6题) =====
  {
    id: 'EA1',
    dimension: 'EA',
    text: '我的穿着或外在呈现通常能表达我想呈现的自己。',
    reverse: false,
  },
  {
    id: 'EA2',
    dimension: 'EA',
    text: '我的声音、语言、姿态或社交方式，常让我觉得“这比较像我”。',
    reverse: false,
  },
  {
    id: 'EA3',
    dimension: 'EA',
    text: '当我选择一种性别表达方式时，我更多是在表达自己，而不是扮演给别人看。',
    reverse: false,
  },
  {
    id: 'EA4',
    dimension: 'EA',
    text: '我能根据自己的意愿调整表达，而不只是服从别人对我的期待。',
    reverse: false,
  },
  {
    id: 'EA5',
    dimension: 'EA',
    text: '在相对安全的环境里，我能找到让我感觉真实的性别表达方式。',
    reverse: false,
  },
  {
    id: 'EA6',
    dimension: 'EA',
    text: '我的日常性别表达经常让我觉得与真实的自己有距离。',
    reverse: true,
  },

  // ===== CF 情境流动与弹性 (6题) =====
  {
    id: 'CF1',
    dimension: 'CF',
    text: '我的性别感受会随着不同情境出现细微或明显变化。',
    reverse: false,
  },
  {
    id: 'CF2',
    dimension: 'CF',
    text: '和不同的人相处时，我对自己性别的感受可能会不同。',
    reverse: false,
  },
  {
    id: 'CF3',
    dimension: 'CF',
    text: '我的性别表达会根据场合、关系或安全感自然调整。',
    reverse: false,
  },
  {
    id: 'CF4',
    dimension: 'CF',
    text: '回看不同生命阶段，我能看到自己的性别经验曾发生变化。',
    reverse: false,
  },
  {
    id: 'CF5',
    dimension: 'CF',
    text: '我可以接受性别体验同时包含稳定和变化的部分。',
    reverse: false,
  },
  {
    id: 'CF6',
    dimension: 'CF',
    text: '对我来说，性别应该始终完全固定；一旦变化就意味着之前不真实。',
    reverse: true,
  },

  // ===== GCC 性别一致与舒适 (6题) =====
  {
    id: 'GCC1',
    dimension: 'GCC',
    text: '当别人以我偏好的方式称呼或理解我时，我通常会感到更自在。',
    reverse: false,
  },
  {
    id: 'GCC2',
    dimension: 'GCC',
    text: '我的外在呈现与内在自我之间，常有一种“对得上”的感觉。',
    reverse: false,
  },
  {
    id: 'GCC3',
    dimension: 'GCC',
    text: '在我关注的身体特征上，我能够找到一些与自我感受协调的部分。',
    reverse: false,
  },
  {
    id: 'GCC4',
    dimension: 'GCC',
    text: '当我照镜子、拍照或想象自己被看见时，我有时能认出“这就是我”。',
    reverse: false,
  },
  {
    id: 'GCC5',
    dimension: 'GCC',
    text: '我能找到至少一些让身体、表达与自我感受更协调的方式。',
    reverse: false,
  },
  {
    id: 'GCC6',
    dimension: 'GCC',
    text: '我经常觉得别人看到的性别形象与我自己感受到的自己完全不是一回事。',
    reverse: true,
  },

  // ===== GAE 性别肯定与愉悦 (6题) =====
  {
    id: 'GAE1',
    dimension: 'GAE',
    text: '当我的性别被正确理解或尊重时，我会感到轻松、温暖或开心。',
    reverse: false,
  },
  {
    id: 'GAE2',
    dimension: 'GAE',
    text: '某些衣着、称谓、发型、声音或身体呈现，会让我出现“这就是我”的积极感觉。',
    reverse: false,
  },
  {
    id: 'GAE3',
    dimension: 'GAE',
    text: '我曾因为更接近自己想要的性别表达而感到愉悦。',
    reverse: false,
  },
  {
    id: 'GAE4',
    dimension: 'GAE',
    text: '我能在自己的性别经验里找到值得喜欢、欣赏或庆祝的部分。',
    reverse: false,
  },
  {
    id: 'GAE5',
    dimension: 'GAE',
    text: '当我按自己的方式表达性别时，我有时会感到能量或自由感。',
    reverse: false,
  },
  {
    id: 'GAE6',
    dimension: 'GAE',
    text: '即使处在安全环境里，我也几乎不会从任何与性别有关的体验中感到积极或愉悦。',
    reverse: true,
  },

  // ===== SNA 社会性别规范自主性 (6题) =====
  {
    id: 'SNA1',
    dimension: 'SNA',
    text: '我能觉察社会对“男性/女性/其他性别应该怎样”的期待。',
    reverse: false,
  },
  {
    id: 'SNA2',
    dimension: 'SNA',
    text: '面对性别规范时，我会判断它是否适合我，而不是自动照做。',
    reverse: false,
  },
  {
    id: 'SNA3',
    dimension: 'SNA',
    text: '我允许自己保留一些符合传统规范的部分，也保留一些不符合的部分。',
    reverse: false,
  },
  {
    id: 'SNA4',
    dimension: 'SNA',
    text: '我能区分“这是我的选择”与“这是为了避免别人不满”。',
    reverse: false,
  },
  {
    id: 'SNA5',
    dimension: 'SNA',
    text: '在条件允许时，我愿意用自己的方式重新解释性别规则。',
    reverse: false,
  },
  {
    id: 'SNA6',
    dimension: 'SNA',
    text: '只要社会普遍这样期待，我就觉得自己必须照着做才算合适。',
    reverse: true,
  },

  // ===== BR 归属与被看见 (6题) =====
  {
    id: 'BR1',
    dimension: 'BR',
    text: '我的重要关系中，至少有人愿意尊重我对自己性别的理解。',
    reverse: false,
  },
  {
    id: 'BR2',
    dimension: 'BR',
    text: '在至少一个环境里，我可以不必反复解释自己的性别。',
    reverse: false,
  },
  {
    id: 'BR3',
    dimension: 'BR',
    text: '我有机会接触让我感觉被理解的性别相关信息、社群或人物。',
    reverse: false,
  },
  {
    id: 'BR4',
    dimension: 'BR',
    text: '当别人正确称呼、理解或回应我时，我会感觉自己被看见。',
    reverse: false,
  },
  {
    id: 'BR5',
    dimension: 'BR',
    text: '我能想象自己在某种关系或社群中拥有性别上的归属感。',
    reverse: false,
  },
  {
    id: 'BR6',
    dimension: 'BR',
    text: '在大多数重要关系里，我都觉得自己的性别经验无法被理解或尊重。',
    reverse: true,
  },
];

// 按维度索引
export const getQuestionsByDimension = (
  dimension: DimensionCode
): QuestionItem[] => {
  return GDI_QUESTIONS_48.filter((q) => q.dimension === dimension);
};

// 维度题目数
export const QUESTIONS_PER_DIMENSION = 6;
export const TOTAL_QUESTIONS = 48;

// Likert 量表配置
export const LIKERT_CONFIG = {
  min: 1,
  max: 7,
  labels: ['非常不符合', '比较不符合', '稍微不符合', '中立', '稍微符合', '比较符合', '非常符合'],
  naAllowed: true,
  naLabel: '不适用 / 不想回答',
};
