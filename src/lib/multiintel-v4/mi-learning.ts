/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// QM AI 多元智能测评 v4.0 — 学习模式 / 表达通道 / 环境适配
// 基于各维度分数计算学习模式偏好、表达通道偏好和环境适配滑块

import type {
  DimensionScore,
  LearningModeMap,
  LearningMode,
  ExpressionMapEntry,
  ExpressionChannel,
  EnvironmentFitEntry,
  EnergyFrictionEntry,
  SceneFit,
  DimensionCode,
} from './mi-types';
import { sceneDefinitions, getSceneDefinition } from './mi-scenes';
import { miDimensions } from './mi-dimensions';

// ===== 学习模式映射 =====
const LEARNING_MODE_MAP: Record<LearningMode, {
  name: string;
  relevantDimension: DimensionCode;
  suggestion: string;
}> = {
  verbal: {
    name: '文字阅读',
    relevantDimension: 'linguistic',
    suggestion: '通过阅读、写作、讨论来学习，用文字和语言作为主要载体。',
  },
  discussion: {
    name: '讨论交流',
    relevantDimension: 'interpersonal',
    suggestion: '通过与人讨论、互相提问、共同探索来学习，在对话中理解。',
  },
  visual: {
    name: '图像空间',
    relevantDimension: 'spatial',
    suggestion: '通过图像、图表、思维导图、视频来学习，用视觉方式构建理解。',
  },
  logical: {
    name: '逻辑推理',
    relevantDimension: 'logical',
    suggestion: '通过分析、推理、找规律来学习，先理解原理再应用。',
  },
  kinesthetic: {
    name: '动手实践',
    relevantDimension: 'bodily',
    suggestion: '通过动手做、实验、实践来学习，做过一遍比听十遍更清楚。',
  },
  rhythmic: {
    name: '节奏音乐',
    relevantDimension: 'musical',
    suggestion: '通过节奏、旋律、声音来学习，有音乐或节奏感的环境让你更专注。',
  },
  reflective: {
    name: '内省反思',
    relevantDimension: 'intrapersonal',
    suggestion: '通过独自思考、反思、关联自己的经验来学习，需要独处消化的时间。',
  },
  naturalistic: {
    name: '自然观察',
    relevantDimension: 'naturalist',
    suggestion: '通过观察实物、在自然环境中、接触真实事物来学习。',
  },
};

export function getLearningModeMap(scores: DimensionScore[]): LearningModeMap[] {
  const scoreMap = new Map<DimensionCode, number>();
  for (const s of scores) scoreMap.set(s.dimension, s.score);

  const modes = Object.entries(LEARNING_MODE_MAP).map(([mode, info]) => {
    const score = scoreMap.get(info.relevantDimension) ?? 50;
    let fitLevel: 'high' | 'medium' | 'low' = 'medium';
    if (score >= 67) fitLevel = 'high';
    else if (score < 34) fitLevel = 'low';

    return {
      mode: mode as LearningMode,
      name: info.name,
      relevantDimension: info.relevantDimension,
      fitLevel,
      recipeSuggestion: info.suggestion,
    };
  });

  // 按适配度排序
  modes.sort((a, b) => {
    const order = { high: 2, medium: 1, low: 0 };
    return order[b.fitLevel] - order[a.fitLevel];
  });

  return modes;
}

// ===== 表达通道映射 =====
const EXPRESSION_MAP: Record<ExpressionChannel, {
  name: string;
  relevantDimension: DimensionCode;
  example: string;
}> = {
  language: {
    name: '语言文字',
    relevantDimension: 'linguistic',
    example: '写日记、发消息、讲故事、做演讲',
  },
  sound: {
    name: '声音音乐',
    relevantDimension: 'musical',
    example: '唱歌、演奏、哼歌、用声音表达情绪',
  },
  image: {
    name: '图像视觉',
    relevantDimension: 'spatial',
    example: '画画、拍照、做设计、用手势表达',
  },
  body: {
    name: '身体动作',
    relevantDimension: 'bodily',
    example: '运动、跳舞、动手做、肢体语言',
  },
  relationship: {
    name: '关系互动',
    relevantDimension: 'interpersonal',
    example: '聊天、合作、一起做事、陪伴',
  },
  structure: {
    name: '结构逻辑',
    relevantDimension: 'logical',
    example: '列清单、做计划、分析问题、找规律',
  },
  nature: {
    name: '自然观察',
    relevantDimension: 'naturalist',
    example: '观察动植物、园艺、户外探索、分类整理',
  },
};

export function getExpressionMap(scores: DimensionScore[]): ExpressionMapEntry[] {
  const scoreMap = new Map<DimensionCode, number>();
  for (const s of scores) scoreMap.set(s.dimension, s.score);

  const channels = Object.entries(EXPRESSION_MAP).map(([channel, info]) => {
    const score = scoreMap.get(info.relevantDimension) ?? 50;
    let usageFrequency: 'high' | 'medium' | 'low' = 'medium';
    if (score >= 67) usageFrequency = 'high';
    else if (score < 34) usageFrequency = 'low';

    return {
      channel: channel as ExpressionChannel,
      name: info.name,
      relevantDimension: info.relevantDimension,
      usageFrequency,
      example: info.example,
    };
  });

  channels.sort((a, b) => {
    const order = { high: 2, medium: 1, low: 0 };
    return order[b.usageFrequency] - order[a.usageFrequency];
  });

  return channels;
}

// ===== 环境适配滑块 =====
export function getEnvironmentFit(scores: DimensionScore[]): EnvironmentFitEntry[] {
  const scoreMap = new Map<DimensionCode, number>();
  for (const s of scores) scoreMap.set(s.dimension, s.score);

  const intrapersonal = scoreMap.get('intrapersonal') ?? 50;
  const interpersonal = scoreMap.get('interpersonal') ?? 50;
  const logical = scoreMap.get('logical') ?? 50;
  const bodily = scoreMap.get('bodily') ?? 50;
  const naturalist = scoreMap.get('naturalist') ?? 50;
  const spatial = scoreMap.get('spatial') ?? 50;
  const musical = scoreMap.get('musical') ?? 50;
  const linguistic = scoreMap.get('linguistic') ?? 50;

  const entries: EnvironmentFitEntry[] = [
    {
      dimension: 'independence_collaboration',
      name: '独立 — 协作',
      leftLabel: '更喜欢独立完成',
      rightLabel: '更喜欢团队协作',
      position: Math.round(50 + (interpersonal - intrapersonal) * 0.5),
      description:
        '这个维度反映了你在工作和学习中，更偏向独立完成还是团队协作。',
    },
    {
      dimension: 'abstract_concrete',
      name: '抽象 — 具象',
      leftLabel: '更喜欢抽象概念',
      rightLabel: '更喜欢动手实物',
      position: Math.round(50 + (bodily - logical) * 0.3 + (spatial - 50) * 0.2),
      description:
        '这个维度反映了你更习惯用抽象概念思考，还是更喜欢接触具体的实物。',
    },
    {
      dimension: 'static_dynamic',
      name: '静态 — 动态',
      leftLabel: '更喜欢安静稳定',
      rightLabel: '更喜欢活动变化',
      position: Math.round(50 + (bodily - intrapersonal) * 0.3 + (musical - 50) * 0.2),
      description:
        '这个维度反映了你更喜欢安静稳定的环境，还是需要活动和变化的环境。',
    },
    {
      dimension: 'indoor_nature',
      name: '室内 — 自然',
      leftLabel: '更喜欢室内环境',
      rightLabel: '更喜欢自然户外',
      position: Math.round(naturalist * 0.8 + bodily * 0.2),
      description:
        '这个维度反映了你在室内还是自然环境中会感到更舒展、更有能量。',
    },
    {
      dimension: 'structured_open',
      name: '结构化 — 开放式',
      leftLabel: '更喜欢有结构有规则',
      rightLabel: '更喜欢自由开放',
      position: Math.round(50 + (spatial - logical) * 0.2 + (naturalist - 50) * 0.3),
      description:
        '这个维度反映了你更喜欢有明确结构和规则的环境，还是自由开放的环境。',
    },
  ];

  // Clamp positions to 0-100
  for (const e of entries) {
    e.position = Math.max(0, Math.min(100, e.position));
  }

  return entries;
}

// ===== 能量/摩擦力分析 =====
export function getEnergyFriction(sceneFits: SceneFit[]): EnergyFrictionEntry[] {
  return sceneFits.map((sf) => {
    const sceneDef = getSceneDefinition(sf.scene);
    const smoothLevel = sf.fitScore;
    const frictionLevel = 100 - sf.fitScore;

    // 找一个搭桥用的智能（用最顺畅的次要智能）
    let bridgeIntelligence = sceneDef?.primaryIntelligence ?? 'linguistic';
    if (sf.smoothIntelligences.length > 0) {
      // 用主智能之外的顺畅智能作为搭桥
      const secondarySmooth = sf.smoothIntelligences.find(
        (d) => d !== sceneDef?.primaryIntelligence,
      );
      if (secondarySmooth) bridgeIntelligence = secondarySmooth;
    }

    const bridgeStrategy = sceneDef?.bridgeTip ?? '试试用你擅长的方式去做这件事。';

    return {
      scene: sf.scene,
      smoothLevel,
      frictionLevel,
      bridgeIntelligence,
      bridgeStrategy,
    };
  });
}
