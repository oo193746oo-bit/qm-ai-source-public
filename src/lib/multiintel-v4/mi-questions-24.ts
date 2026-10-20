/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// QM AI 多元智能测评 v4.0 — 24 题 Quick 版题库
// questionnaire_version: 'quick-v4.0'
// 每维 3 题，共 24 题
// raw_read_only: true（程序计分，AI 不得修改）

import type { MIQuestion, DimensionCode, QuestionnaireVersion } from './mi-types';

export const QUESTIONNAIRE_VERSION: QuestionnaireVersion = 'quick-v4.0';
export const QUESTIONS_PER_DIMENSION = 3;
export const TOTAL_QUESTIONS = 24;
export const RAW_SCORE_MIN_PER_DIM = 3;   // 1-5 分 × 3 题，最低 3
export const RAW_SCORE_MAX_PER_DIM = 15;  // 1-5 分 × 3 题，最高 15

export const miQuestions24: MIQuestion[] = [
  // ===== 语言智能 linguistic（3题） =====
  {
    id: 'MI-Q01',
    text: '当我想理解一个新概念时，我更习惯通过阅读文字说明来搞清楚。',
    dimension: 'linguistic',
  },
  {
    id: 'MI-Q02',
    text: '我比较容易注意到别人说话中的用词、语气和言外之意。',
    dimension: 'linguistic',
  },
  {
    id: 'MI-Q03',
    text: '我更愿意用写下来的方式整理自己的想法。',
    dimension: 'linguistic',
  },

  // ===== 逻辑数学智能 logical（3题） =====
  {
    id: 'MI-Q04',
    text: '遇到问题时，我倾向于先找规律、分类或列步骤。',
    dimension: 'logical',
  },
  {
    id: 'MI-Q05',
    text: '我对数字、数据或因果关系比较敏感。',
    dimension: 'logical',
  },
  {
    id: 'MI-Q06',
    text: '在做决定前，我更喜欢先把利弊和前因后果理清楚。',
    dimension: 'logical',
  },

  // ===== 空间智能 spatial（3题） =====
  {
    id: 'MI-Q07',
    text: '我比较容易在脑中想象出物体的形状、颜色或空间布局。',
    dimension: 'spatial',
  },
  {
    id: 'MI-Q08',
    text: '到一个新地方，我通常能比较快地找到方向。',
    dimension: 'spatial',
  },
  {
    id: 'MI-Q09',
    text: '我更喜欢用图像、图表或思维导图来表达信息。',
    dimension: 'spatial',
  },

  // ===== 音乐智能 musical（3题） =====
  {
    id: 'MI-Q10',
    text: '我很容易被一段旋律、节奏或声音质感吸引。',
    dimension: 'musical',
  },
  {
    id: 'MI-Q11',
    text: '音乐或某种声音氛围会明显影响我的情绪和状态。',
    dimension: 'musical',
  },
  {
    id: 'MI-Q12',
    text: '我经常会不自觉地哼歌、打拍子或跟着节奏动。',
    dimension: 'musical',
  },

  // ===== 身体动觉智能 bodily（3题） =====
  {
    id: 'MI-Q13',
    text: '我学新东西时，动手做过一遍会比听或看理解得更深。',
    dimension: 'bodily',
  },
  {
    id: 'MI-Q14',
    text: '我对自己的身体感觉（紧张、放松、疲惫）比较敏感。',
    dimension: 'bodily',
  },
  {
    id: 'MI-Q15',
    text: '我更愿意通过实践、运动或身体活动来处理情绪。',
    dimension: 'bodily',
  },

  // ===== 人际智能 interpersonal（3题） =====
  {
    id: 'MI-Q16',
    text: '我比较容易感受到周围人的情绪变化。',
    dimension: 'interpersonal',
  },
  {
    id: 'MI-Q17',
    text: '与人交流时，我会自然地留意对方的反应和关系氛围。',
    dimension: 'interpersonal',
  },
  {
    id: 'MI-Q18',
    text: '我更喜欢在团队或与人互动的环境中完成事情。',
    dimension: 'interpersonal',
  },

  // ===== 内省智能 intrapersonal（3题） =====
  {
    id: 'MI-Q19',
    text: '我经常会反思自己的感受、动机和行为背后的原因。',
    dimension: 'intrapersonal',
  },
  {
    id: 'MI-Q20',
    text: '独处对我来说是重要的能量来源和整理方式。',
    dimension: 'intrapersonal',
  },
  {
    id: 'MI-Q21',
    text: '我比较清楚自己看重什么、不想要什么。',
    dimension: 'intrapersonal',
  },

  // ===== 自然观察智能 naturalist（3题） =====
  {
    id: 'MI-Q22',
    text: '我对自然界的动植物、天气、环境变化比较敏感。',
    dimension: 'naturalist',
  },
  {
    id: 'MI-Q23',
    text: '身处自然环境中（公园、树林、海边等）会让我感到舒展。',
    dimension: 'naturalist',
  },
  {
    id: 'MI-Q24',
    text: '我喜欢观察事物之间的分类、模式和生态联系。',
    dimension: 'naturalist',
  },
];

// 按维度分组
export function getQuestionsByDimension(dim: DimensionCode): MIQuestion[] {
  return miQuestions24.filter((q) => q.dimension === dim);
}

// 验证题量
export function validateQuestionCount(): {
  total: number;
  perDimension: Record<DimensionCode, number>;
  valid: boolean;
} {
  const perDimension = {} as Record<DimensionCode, number>;
  const dims: DimensionCode[] = [
    'linguistic', 'logical', 'spatial', 'musical',
    'bodily', 'interpersonal', 'intrapersonal', 'naturalist',
  ];
  for (const d of dims) perDimension[d] = 0;
  for (const q of miQuestions24) {
    perDimension[q.dimension]++;
  }
  const allHave3 = Object.values(perDimension).every((v) => v === 3);
  return {
    total: miQuestions24.length,
    perDimension,
    valid: miQuestions24.length === 24 && allHave3,
  };
}
