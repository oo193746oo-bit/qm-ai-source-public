/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// QM AI 多元智能测评 v4.0 — 14 类场景定义与适配计算
// 每个场景关联主调用智能 + 辅助智能
// 场景适配度基于相关维度分数加权计算

import type {
  SceneCode,
  SceneDefinition,
  SceneFit,
  DimensionCode,
  DimensionScore,
} from './mi-types';
import { miDimensions } from './mi-dimensions';

export const sceneDefinitions: SceneDefinition[] = [
  // 1. 阅读学习
  {
    code: 'reading_learning',
    name: '阅读学习',
    description: '通过阅读、听讲、研究来获取新知识的场景。',
    primaryIntelligence: 'linguistic',
    secondaryIntelligences: ['logical', 'intrapersonal'],
    energySmoothWhen: '内容有清晰的文字说明、可以边读边思考、有结构有条理时，学习起来比较顺畅。',
    frictionWhen: '纯图片/视频教学、需要大量动手操作、或者信息没有文字脉络时，可能感到抓不住。',
    bridgeTip: '如果学习材料偏视觉或动手，可以边学边做笔记、用自己的话复述，让语言通道参与进来。',
  },
  // 2. 考试
  {
    code: 'exam',
    name: '考试测评',
    description: '在限时、有压力的环境下完成测试或考核的场景。',
    primaryIntelligence: 'logical',
    secondaryIntelligences: ['linguistic', 'intrapersonal'],
    energySmoothWhen: '题目有清晰的逻辑结构、可以一步步推理、自己的状态比较稳定时，发挥会比较好。',
    frictionWhen: '题目表述模糊、需要大量死记硬背、或者压力过大影响思考时，可能感到卡顿。',
    bridgeTip: '考试前做几次深呼吸稳定状态；遇到卡壳的题先标记跳过，让逻辑思维有节奏地工作。',
  },
  // 3. 项目解决
  {
    code: 'project_solving',
    name: '项目解决',
    description: '面对复杂问题，需要拆解、规划、执行并完成的场景。',
    primaryIntelligence: 'logical',
    secondaryIntelligences: ['spatial', 'bodily'],
    energySmoothWhen: '问题可以拆成步骤、有可视化的进度、能动手试错时，推进起来比较有感觉。',
    frictionWhen: '问题模糊不清、没有抓手、只能坐着想而不能行动时，可能感到卡住。',
    bridgeTip: '把大问题画成思维导图或流程图，再挑最小的一步先动手做起来，让空间和动觉也参与解题。',
  },
  // 4. 会议
  {
    code: 'meeting',
    name: '会议沟通',
    description: '多人聚集讨论、决策或同步信息的场景。',
    primaryIntelligence: 'interpersonal',
    secondaryIntelligences: ['linguistic', 'logical'],
    energySmoothWhen: '会议氛围开放、大家能充分表达、讨论有逻辑脉络时，参与度会比较高。',
    frictionWhen: '气氛紧张、有人被压制、或者讨论跑题没有结构时，可能感到消耗。',
    bridgeTip: '可以试着在心里默默梳理讨论的逻辑线，或者用提问的方式帮会议找回节奏，照顾关系也照顾内容。',
  },
  // 5. 公开表达
  {
    code: 'public_expression',
    name: '公开表达',
    description: '面对观众进行演讲、汇报、表演的场景。',
    primaryIntelligence: 'linguistic',
    secondaryIntelligences: ['interpersonal', 'musical'],
    energySmoothWhen: '内容准备充分、能感受到观众的积极回应、表达有节奏感时，状态会很顺。',
    frictionWhen: '紧张到大脑空白、观众反应冷淡、或者忘词卡壳时，可能感到慌张。',
    bridgeTip: '上台前先哼一段熟悉的旋律找节奏，开场先和观众做一个连接，让声音和关系通道同时 warm up。',
  },
  // 6. 团队协作
  {
    code: 'team_collaboration',
    name: '团队协作',
    description: '与他人一起分工合作、共同完成目标的场景。',
    primaryIntelligence: 'interpersonal',
    secondaryIntelligences: ['bodily', 'logical'],
    energySmoothWhen: '团队氛围好、大家各有所长、一起做事有节奏时，会很有干劲。',
    frictionWhen: '分工不清、有人划水、或者冲突得不到解决时，可能感到疲惫。',
    bridgeTip: '可以主动发起一次"一起做一件小事"的活动，让身体先动起来；也可以帮团队梳理分工和流程，让逻辑也到位。',
  },
  // 7. 独立工作
  {
    code: 'independent_work',
    name: '独立工作',
    description: '一个人专注完成需要深度投入的任务的场景。',
    primaryIntelligence: 'intrapersonal',
    secondaryIntelligences: ['logical', 'spatial'],
    energySmoothWhen: '环境安静、有清晰的目标、可以按自己的节奏推进时，效率会很高。',
    frictionWhen: '被频繁打扰、任务没有方向、或者长时间独处感到孤独时，可能感到低落。',
    bridgeTip: '给自己设定专注时段和休息节奏，中间安排一小段与人连接的时间，让内省和人际都得到照顾。',
  },
  // 8. 创意表达
  {
    code: 'creative_expression',
    name: '创意表达',
    description: '通过艺术、设计、写作等方式进行创作和表达的场景。',
    primaryIntelligence: 'spatial',
    secondaryIntelligences: ['musical', 'linguistic'],
    energySmoothWhen: '有灵感、材料丰富、可以自由尝试时，创作会很流畅。',
    frictionWhen: '没有灵感、被要求严格按规则来、或者过度自我批判时，可能感到卡顿。',
    bridgeTip: '卡住时换一种媒介试试——写不出来就画画，画不出来就听音乐，让不同的表达通道轮流工作。',
  },
  // 9. 运动实践
  {
    code: 'physical_practice',
    name: '运动实践',
    description: '通过身体活动、运动、动手操作来学习或完成事情的场景。',
    primaryIntelligence: 'bodily',
    secondaryIntelligences: ['spatial', 'naturalist'],
    energySmoothWhen: '身体状态好、环境合适、可以边做边调整时，会感到很投入。',
    frictionWhen: '身体疲劳、空间受限、或者只能看不能动手时，可能感到坐不住。',
    bridgeTip: '如果必须久坐学习或工作，设置定时起身活动，让身体也参与到认知过程中。',
  },
  // 10. 旅行导航
  {
    code: 'travel_navigation',
    name: '旅行导航',
    description: '在陌生环境中找路、规划行程、探索新地方的场景。',
    primaryIntelligence: 'spatial',
    secondaryIntelligences: ['naturalist', 'interpersonal'],
    energySmoothWhen: '方向感在线、环境有自然线索、能和当地人交流获取信息时，旅行会很顺畅。',
    frictionWhen: '迷路、环境混乱、或者语言不通又没人可问时，可能感到焦虑。',
    bridgeTip: '迷路时先停下观察周围的自然和建筑特征，也可以试着问问路人，让空间感知和人际都帮你找方向。',
  },
  // 11. 情绪整理
  {
    code: 'emotional_processing',
    name: '情绪整理',
    description: '处理复杂情绪、从低落或焦虑中恢复的场景。',
    primaryIntelligence: 'intrapersonal',
    secondaryIntelligences: ['musical', 'linguistic'],
    energySmoothWhen: '有独处空间、能通过音乐或书写释放情绪、允许自己慢慢消化时，会逐渐平复。',
    frictionWhen: '被催促"快点好起来"、没有空间独处、或者情绪说不清楚时，可能感到更压抑。',
    bridgeTip: '允许自己有独处整理的时间，可以用写日记或听音乐的方式帮情绪找到出口，不要急着"好起来"。',
  },
  // 12. 关系沟通
  {
    code: 'relationship_communication',
    name: '关系沟通',
    description: '在亲密关系、友谊或家庭中进行深度沟通的场景。',
    primaryIntelligence: 'interpersonal',
    secondaryIntelligences: ['intrapersonal', 'linguistic'],
    energySmoothWhen: '双方都愿意倾听、能表达真实感受、沟通有来有回时，关系会更亲近。',
    frictionWhen: '有误解不解释、一方只顾说不听、或者回避重要话题时，可能感到疏远。',
    bridgeTip: '沟通前先花一点时间和自己在一起，弄清楚自己真正想说什么，然后再带着这份清楚去和对方连接。',
  },
  // 13. 领导组织
  {
    code: 'leadership',
    name: '领导组织',
    description: '带领团队、组织活动、做出决策并推动执行的场景。',
    primaryIntelligence: 'interpersonal',
    secondaryIntelligences: ['logical', 'intrapersonal'],
    energySmoothWhen: '团队信任你、有清晰的方向、同时能照顾到每个人的状态时，领导力会自然发挥。',
    frictionWhen: '团队有矛盾、目标不清晰、或者自己也不确定方向时，可能感到压力很大。',
    bridgeTip: '做决策前先和自己核对：这是我真正认同的方向吗？想清楚了再和团队沟通，让内省和人际同时在线。',
  },
  // 14. 自然户外
  {
    code: 'nature_outdoor',
    name: '自然户外',
    description: '在自然环境中活动、探索、放松的场景。',
    primaryIntelligence: 'naturalist',
    secondaryIntelligences: ['bodily', 'spatial'],
    energySmoothWhen: '天气适宜、环境优美、可以自由走动和观察时，会感到特别舒展。',
    frictionWhen: '天气恶劣、环境被破坏、或者只能在室内待着时，可能感到压抑。',
    bridgeTip: '如果无法经常去户外，可以在身边创造"自然小角落"——养植物、晒太阳、听自然录音，让自然通道也得到滋养。',
  },
];

// 场景权重：主智能权重 0.5，辅助智能平均分配剩余 0.5
const PRIMARY_WEIGHT = 0.5;

// 计算单个场景的适配度
function calculateSceneFit(
  scene: SceneDefinition,
  scoreMap: Map<DimensionCode, number>,
): SceneFit {
  const primaryScore = scoreMap.get(scene.primaryIntelligence) ?? 50;
  const secondaryCount = scene.secondaryIntelligences.length;
  const secondaryWeight = (1 - PRIMARY_WEIGHT) / secondaryCount;

  let fitScore = primaryScore * PRIMARY_WEIGHT;
  const smoothIntelligences: DimensionCode[] = [];
  const frictionIntelligences: DimensionCode[] = [];

  // 主智能
  if (primaryScore >= 60) {
    smoothIntelligences.push(scene.primaryIntelligence);
  } else if (primaryScore < 40) {
    frictionIntelligences.push(scene.primaryIntelligence);
  }

  // 辅助智能
  for (const dim of scene.secondaryIntelligences) {
    const s = scoreMap.get(dim) ?? 50;
    fitScore += s * secondaryWeight;
    if (s >= 60) {
      smoothIntelligences.push(dim);
    } else if (s < 40) {
      frictionIntelligences.push(dim);
    }
  }

  // 搭桥建议：用最顺畅的智能去辅助最费力的
  let bridgeSuggestion = scene.bridgeTip;
  if (smoothIntelligences.length > 0 && frictionIntelligences.length > 0) {
    const smoothDim = smoothIntelligences[0];
    const frictionDim = frictionIntelligences[0];
    const smoothName = miDimensions[smoothDim]?.shortName ?? smoothDim;
    const frictionName = miDimensions[frictionDim]?.shortName ?? frictionDim;
    bridgeSuggestion = `在这个场景中，你可以试试用${smoothName}的方式来辅助${frictionName}的部分：${scene.bridgeTip}`;
  }

  return {
    scene: scene.code,
    fitScore: Math.round(fitScore),
    smoothIntelligences,
    frictionIntelligences,
    bridgeSuggestion,
  };
}

// 计算所有场景的适配度
export function calculateSceneFits(scores: DimensionScore[]): SceneFit[] {
  const scoreMap = new Map<DimensionCode, number>();
  for (const s of scores) scoreMap.set(s.dimension, s.score);

  return sceneDefinitions.map((s) => calculateSceneFit(s, scoreMap));
}

// 获取 Top N 场景
export function getTopScenes(scores: DimensionScore[], n = 5): SceneFit[] {
  const fits = calculateSceneFits(scores);
  return fits.sort((a, b) => b.fitScore - a.fitScore).slice(0, n);
}

// 获取场景定义
export function getSceneDefinition(code: SceneCode): SceneDefinition | undefined {
  return sceneDefinitions.find((s) => s.code === code);
}

// 验证：14 个场景
export function validateSceneCount(): { count: number; valid: boolean } {
  const count = sceneDefinitions.length;
  return { count, valid: count === 14 };
}
