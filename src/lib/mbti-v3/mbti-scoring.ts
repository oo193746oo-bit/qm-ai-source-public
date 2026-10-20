/**
 * QM 93题MBTI风格人格偏好测试 - 评分引擎 v3.0
 *
 * 核心算法：
 * - 每个维度独立计分，统计两极选项的选择数量
 * - clarity = abs(percent_A - percent_B)  范围 0-100
 * - clarity 五档：0-19边界 / 20-39轻度 / 40-59中度 / 60-79明显 / 80-100强偏好
 * - clarity < 20 标记为「边界维度」，展示邻近类型
 * - 四维都输出：数据、clarity、两种现实场景、非定型说明
 */

import type {
  Dimension,
  Pole,
  ClarityLevel,
  DimensionScore,
  MBTIScoreResult,
  TypeCode,
  MBTIQuestion,
} from './mbti-types';

// ============================================================
// 维度与极性映射
// ============================================================

const DIMENSION_POLES: Record<Dimension, [Pole, Pole]> = {
  EI: ['E', 'I'],
  SN: ['S', 'N'],
  TF: ['T', 'F'],
  JP: ['J', 'P'],
};

// ============================================================
// Clarity 等级映射
// ============================================================

export function getClarityLevel(clarity: number): ClarityLevel {
  if (clarity >= 80) return 'strong';
  if (clarity >= 60) return 'clear';
  if (clarity >= 40) return 'moderate';
  if (clarity >= 20) return 'mild';
  return 'borderline';
}

export const CLARITY_LABELS: Record<ClarityLevel, string> = {
  borderline: '边界维度',
  mild: '轻度偏好',
  moderate: '中度偏好',
  clear: '明显偏好',
  strong: '强偏好',
};

// ============================================================
// 各维度的场景化描述
// ============================================================

interface DimensionScenarios {
  poleA: Pole;
  poleB: Pole;
  scenarios: {
    [key: string]: { scenario1: string; scenario2: string };
  };
  nonFixedNote: string;
}

const DIMENSION_SCENARIOS: Record<Dimension, DimensionScenarios> = {
  EI: {
    poleA: 'E',
    poleB: 'I',
    scenarios: {
      E: {
        scenario1: '在团队协作中，你常常主动发起讨论，通过和他人碰撞来激发新想法，是团队里的「能量放大器」。',
        scenario2: '面对压力时，你倾向于找人聊聊、参加社交活动来疏解情绪，人际互动本身就是你的充电站。',
      },
      I: {
        scenario1: '在深度工作时，你需要独处的空间来集中注意力，思考清楚后再表达，是团队里的「深度输出者」。',
        scenario2: '面对压力时，你更习惯一个人安静梳理，通过阅读、冥想或独处来恢复能量。',
      },
    },
    nonFixedNote: '内向外向不是非黑即白的二元划分，而是能量获取方式的偏好光谱。大多数人在不同情境下会表现出不同倾向，这只是你当下更常使用的模式。',
  },
  SN: {
    poleA: 'S',
    poleB: 'N',
    scenarios: {
      S: {
        scenario1: '在学习和工作中，你擅长处理具体细节和实际问题，喜欢从案例和经验出发，一步一步把事情落地。',
        scenario2: '在沟通中，你习惯用具体的例子和事实说话，更关注「是什么」和「怎么做」。',
      },
      N: {
        scenario1: '在学习和工作中，你擅长捕捉模式和发现新可能，喜欢从整体框架和理论入手，探索事物的深层含义。',
        scenario2: '在沟通中，你习惯用比喻和联想表达想法，更关注「还能是什么」和「未来会怎样」。',
      },
    },
    nonFixedNote: '感觉和直觉是两种互补的信息获取方式。在不同领域和人生阶段，你的偏好可能会发生变化，这反映的是你当下习惯关注什么，而不是你的全部。',
  },
  TF: {
    poleA: 'T',
    poleB: 'F',
    scenarios: {
      T: {
        scenario1: '做决策时，你习惯先从客观逻辑和原则出发分析利弊，追求公平和效率，是大家眼中的「理性派」。',
        scenario2: '在冲突中，你更在意事情本身的对错，愿意据理力争，认为直面问题才能真正解决。',
      },
      F: {
        scenario1: '做决策时，你习惯先考虑对人的影响和关系的和谐，追求理解和共情，是大家眼中的「暖心人」。',
        scenario2: '在冲突中，你更在意彼此的感受，愿意妥协退让，认为维护关系比争输赢更重要。',
      },
    },
    nonFixedNote: '思考和情感都是做决定的重要方式，没有高低之分。你可能在工作中更依赖逻辑，在亲密关系中更看重感受，这是完整人格的不同侧面。',
  },
  JP: {
    poleA: 'J',
    poleB: 'P',
    scenarios: {
      J: {
        scenario1: '在日常生活中，你习惯提前规划、按计划行事，喜欢把事情定下来带来的确定感和掌控感。',
        scenario2: '面对任务时，你倾向于尽早启动、有序推进，deadline之前完成让你感到踏实和安心。',
      },
      P: {
        scenario1: '在日常生活中，你习惯保持灵活开放，喜欢随机应变带来的新鲜感和可能性。',
        scenario2: '面对任务时，你倾向于先收集信息、最后集中冲刺，压力下的爆发力往往让你自己都惊讶。',
      },
    },
    nonFixedNote: '判断和感知是对待生活的两种态度，各有优势。你的偏好可能会随着人生阶段和角色变化而调整，重要的是找到让自己舒服又能成事的节奏。',
  },
};

// ============================================================
// 16型邻近类型映射
// ============================================================

// 每个边界维度对应的邻近类型（只替换该维度的字母）
function getAdjacentTypes(typeCode: TypeCode, borderlineDims: Dimension[]): TypeCode[] {
  const adjacent: TypeCode[] = [];
  const letters = typeCode.split('') as Pole[];

  const dimToIndex: Record<Dimension, number> = {
    EI: 0,
    SN: 1,
    TF: 2,
    JP: 3,
  };

  const oppositePole: Record<Pole, Pole> = {
    E: 'I', I: 'E',
    S: 'N', N: 'S',
    T: 'F', F: 'T',
    J: 'P', P: 'J',
  };

  for (const dim of borderlineDims) {
    const idx = dimToIndex[dim];
    const newLetters = [...letters];
    newLetters[idx] = oppositePole[newLetters[idx]];
    adjacent.push(newLetters.join('') as TypeCode);
  }

  return adjacent;
}

// ============================================================
// 单维度评分
// ============================================================

export function scoreDimension(
  dimension: Dimension,
  answers: Map<string, Pole>,
  questions: MBTIQuestion[]
): DimensionScore {
  const [poleA, poleB] = DIMENSION_POLES[dimension];
  const dimQuestions = questions.filter(q => q.dimension === dimension);

  let countA = 0;
  let countB = 0;
  let answered = 0;

  for (const q of dimQuestions) {
    const answer = answers.get(q.id);
    if (!answer) continue;
    answered++;
    if (answer === poleA) countA++;
    else if (answer === poleB) countB++;
  }

  const total = answered || 1;
  const percentA = Math.round((countA / total) * 100);
  const percentB = 100 - percentA;
  const clarity = Math.abs(percentA - percentB);
  const clarityLevel = getClarityLevel(clarity);
  const isBorderline = clarity < 20;
  const dominantPole = percentA >= percentB ? poleA : poleB;

  const scenarios = DIMENSION_SCENARIOS[dimension].scenarios[dominantPole];
  const nonFixedNote = DIMENSION_SCENARIOS[dimension].nonFixedNote;

  return {
    dimension,
    poleA,
    poleB,
    countA,
    countB,
    percentA,
    percentB,
    clarity,
    clarityLevel,
    isBorderline,
    dominantPole,
    scenario1: scenarios.scenario1,
    scenario2: scenarios.scenario2,
    nonFixedNote,
  };
}

// ============================================================
// 完整评分入口
// ============================================================

export function calculateMBTIScore(
  answers: Map<string, Pole>,
  questions: MBTIQuestion[]
): MBTIScoreResult {
  const eiScore = scoreDimension('EI', answers, questions);
  const snScore = scoreDimension('SN', answers, questions);
  const tfScore = scoreDimension('TF', answers, questions);
  const jpScore = scoreDimension('JP', answers, questions);

  const typeCode = ([
    eiScore.dominantPole,
    snScore.dominantPole,
    tfScore.dominantPole,
    jpScore.dominantPole,
  ].join('') as TypeCode);

  const borderlineDimensions: Dimension[] = [];
  if (eiScore.isBorderline) borderlineDimensions.push('EI');
  if (snScore.isBorderline) borderlineDimensions.push('SN');
  if (tfScore.isBorderline) borderlineDimensions.push('TF');
  if (jpScore.isBorderline) borderlineDimensions.push('JP');

  const adjacentTypes = getAdjacentTypes(typeCode, borderlineDimensions);

  const totalQuestions = questions.length;
  const answeredQuestions = answers.size;

  const typeLabels: Record<TypeCode, { cn: string; en: string }> = {
    ISTJ: { cn: '物流师', en: 'Logistician' },
    ISFJ: { cn: '守卫者', en: 'Defender' },
    INFJ: { cn: '提倡者', en: 'Advocate' },
    INTJ: { cn: '建筑师', en: 'Architect' },
    ISTP: { cn: '鉴赏家', en: 'Virtuoso' },
    ISFP: { cn: '探险家', en: 'Adventurer' },
    INFP: { cn: '调停者', en: 'Mediator' },
    INTP: { cn: '逻辑学家', en: 'Logician' },
    ESTP: { cn: '企业家', en: 'Entrepreneur' },
    ESFP: { cn: '表演者', en: 'Entertainer' },
    ENFP: { cn: '竞选者', en: 'Campaigner' },
    ENTP: { cn: '辩论家', en: 'Debater' },
    ESTJ: { cn: '总经理', en: 'Executive' },
    ESFJ: { cn: '执政官', en: 'Consul' },
    ENFJ: { cn: '主人公', en: 'Protagonist' },
    ENTJ: { cn: '指挥官', en: 'Commander' },
  };

  return {
    typeCode,
    typeLabelCn: typeLabels[typeCode].cn,
    typeLabelEn: typeLabels[typeCode].en,
    dimensions: {
      EI: eiScore,
      SN: snScore,
      TF: tfScore,
      JP: jpScore,
    },
    borderlineDimensions,
    adjacentTypes,
    totalQuestions,
    answeredQuestions,
  };
}

// ============================================================
// 工具函数：从答案数组构建答案 Map
// ============================================================

export function buildAnswerMap(
  answerPairs: Array<{ questionId: string; direction: Pole }>
): Map<string, Pole> {
  const map = new Map<string, Pole>();
  for (const a of answerPairs) {
    map.set(a.questionId, a.direction);
  }
  return map;
}
