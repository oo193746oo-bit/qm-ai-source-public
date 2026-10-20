/**
 * QM 93题MBTI风格人格偏好测试 - 16型字典 v3.0
 *
 * 包含：中文名称、英文名称、标语、辅助色、配图 key、简要描述
 * 品牌主色：QM紫 #6B4C9A
 * 每型配图：image_key MBTI_XXXX_V1
 */

import type { TypeInfo, TypeCode } from './mbti-types';

export const TYPE_DICTIONARY: Record<TypeCode, TypeInfo> = {
  ISTJ: {
    code: 'ISTJ',
    nameCn: '物流师',
    nameEn: 'Logistician',
    tagline: '事实是我最可靠的锚点',
    accentColor: '#5B7DB1',
    imageKey: 'MBTI_ISTJ_V1',
    briefDescription: '你是那种让人安心的存在——务实、可靠、说到做到。你尊重传统和秩序，喜欢用经过验证的方法处理事情，对细节有惊人的记忆力。在你眼里，承诺就是承诺，责任就是责任。',
  },
  ISFJ: {
    code: 'ISFJ',
    nameCn: '守卫者',
    nameEn: 'Defender',
    tagline: '我用温柔的方式守护重要的人',
    accentColor: '#7DA18C',
    imageKey: 'MBTI_ISFJ_V1',
    briefDescription: '你是低调的守护者——温暖、细心、默默付出。你善于观察他人的需要，常常在别人开口之前就已经准备好了帮助。你重视和谐与稳定，对在乎的人有着深沉的忠诚。',
  },
  INFJ: {
    code: 'INFJ',
    nameCn: '提倡者',
    nameEn: 'Advocate',
    tagline: '我看见光，也想成为光',
    accentColor: '#9B7EBD',
    imageKey: 'MBTI_INFJ_V1',
    briefDescription: '你是安静的理想主义者——深邃、有洞察力、心怀使命。你对人的内心世界有独特的感知力，常常能洞察到别人没说出口的想法。你追求意义和价值，希望自己的存在能让世界变得好一点。',
  },
  INTJ: {
    code: 'INTJ',
    nameCn: '建筑师',
    nameEn: 'Architect',
    tagline: '一切皆可被设计',
    accentColor: '#6B8E9F',
    imageKey: 'MBTI_INTJ_V1',
    briefDescription: '你是战略思考者——独立、有远见、追求卓越。你擅长从全局视角规划长远目标，对知识和能力有很高的标准。在你眼里，大多数事情都有优化的空间，而你享受找到最优解的过程。',
  },
  ISTP: {
    code: 'ISTP',
    nameCn: '鉴赏家',
    nameEn: 'Virtuoso',
    tagline: '动手解决问题的感觉最爽',
    accentColor: '#8B7355',
    imageKey: 'MBTI_ISTP_V1',
    briefDescription: '你是天生的动手达人——冷静、灵活、擅长解决实际问题。你对机械、工具和系统有天然的理解力，喜欢拆解和重组事物。面对危机时你反而格外清醒，总能快速找到破局点。',
  },
  ISFP: {
    code: 'ISFP',
    nameCn: '探险家',
    nameEn: 'Adventurer',
    tagline: '活在当下，感受每一刻',
    accentColor: '#C28B8B',
    imageKey: 'MBTI_ISFP_V1',
    briefDescription: '你是温柔的探索者——随性、敏感、有艺术气质。你用五感体验世界，对美有独特的品味，喜欢用行动表达自己胜过用语言。你不喜欢被定义，相信生活应该被感受，而不是被规划。',
  },
  INFP: {
    code: 'INFP',
    nameCn: '调停者',
    nameEn: 'Mediator',
    tagline: '在内心世界，我是自由的',
    accentColor: '#A893C4',
    imageKey: 'MBTI_INFP_V1',
    briefDescription: '你是诗意的理想主义者——温柔、真诚、忠于内心。你的内心世界丰富得像一片森林，有想象、有情感、有坚定的价值观。你追求真实和意义，对理解和共鸣有着深切的渴望。',
  },
  INTP: {
    code: 'INTP',
    nameCn: '逻辑学家',
    nameEn: 'Logician',
    tagline: '我思，故我在',
    accentColor: '#7094A8',
    imageKey: 'MBTI_INTP_V1',
    briefDescription: '你是求知若渴的思考者——好奇、分析力强、热爱真理。你对复杂的概念和系统有天然的兴趣，喜欢追根究底地问「为什么」。在你的头脑里，永远有新的想法在酝酿和碰撞。',
  },
  ESTP: {
    code: 'ESTP',
    nameCn: '企业家',
    nameEn: 'Entrepreneur',
    tagline: '行动就是最好的答案',
    accentColor: '#D48B5C',
    imageKey: 'MBTI_ESTP_V1',
    briefDescription: '你是精力充沛的行动派——大胆、务实、擅长随机应变。你喜欢活在当下，对冒险和挑战充满热情。你有超强的观察力和执行力，总能在关键时刻抓住机会、扭转局面。',
  },
  ESFP: {
    code: 'ESFP',
    nameCn: '表演者',
    nameEn: 'Entertainer',
    tagline: '人生就是一场盛大的派对',
    accentColor: '#E09A9A',
    imageKey: 'MBTI_ESFP_V1',
    briefDescription: '你是天生的乐天派——热情、有趣、感染力十足。你热爱生活中的每一种体验，总能把快乐带给身边的人。你活在当下，对美好事物有敏锐的感知，和你在一起的时光永远不会无聊。',
  },
  ENFP: {
    code: 'ENFP',
    nameCn: '竞选者',
    nameEn: 'Campaigner',
    tagline: '每个人的故事都值得被听见',
    accentColor: '#B89CD4',
    imageKey: 'MBTI_ENFP_V1',
    briefDescription: '你是充满激情的灵感使者——热情、有创造力、以人为本。你对人和可能性充满好奇，总能看到别人身上的闪光点。你的生活像一场永不停歇的探索，充满了新想法、新关系和新梦想。',
  },
  ENTP: {
    code: 'ENTP',
    nameCn: '辩论家',
    nameEn: 'Debater',
    tagline: '想法越辩越明',
    accentColor: '#8F97D4',
    imageKey: 'MBTI_ENTP_V1',
    briefDescription: '你是思维敏捷的挑战者——机智、好奇、不迷信权威。你喜欢为了辩论而辩论，不是为了争输赢，而是享受思维碰撞中产生新想法的快感。对你来说，世界是一个巨大的智力游乐场。',
  },
  ESTJ: {
    code: 'ESTJ',
    nameCn: '总经理',
    nameEn: 'Executive',
    tagline: '把事情做好，是我的原则',
    accentColor: '#5C81A6',
    imageKey: 'MBTI_ESTJ_V1',
    briefDescription: '你是天生的组织者——果断、有条理、注重效率。你擅长建立秩序和规则，喜欢把事情安排得明明白白。你重视责任和承诺，是那种大家在关键时刻都会想到的可靠角色。',
  },
  ESFJ: {
    code: 'ESFJ',
    nameCn: '执政官',
    nameEn: 'Consul',
    tagline: '大家好，才是真的好',
    accentColor: '#A8C493',
    imageKey: 'MBTI_ESFJ_V1',
    briefDescription: '你是温暖的连接者——热心、体贴、有凝聚力。你擅长照顾他人的需要，总能让每个人都感到被重视和欢迎。你重视社群和传统，是把大家凝聚在一起的那个人。',
  },
  ENFJ: {
    code: 'ENFJ',
    nameCn: '主人公',
    nameEn: 'Protagonist',
    tagline: '一起成为更好的自己',
    accentColor: '#C493B8',
    imageKey: 'MBTI_ENFJ_V1',
    briefDescription: '你是富有魅力的引导者——热情、有感召力、真诚。你对人的潜能有强烈的信念，善于激励他人成长。你天然地关心集体的福祉，相信每个人都可以被点亮，而你愿意做那根火柴。',
  },
  ENTJ: {
    code: 'ENTJ',
    nameCn: '指挥官',
    nameEn: 'Commander',
    tagline: '目标明确，勇往直前',
    accentColor: '#7D6BB5',
    imageKey: 'MBTI_ENTJ_V1',
    briefDescription: '你是天生的领袖——果断、有战略眼光、追求卓越。你擅长制定大方向并组织资源去实现它，对低效和混乱没有耐心。你享受挑战更大的目标，相信没有什么是不可能的。',
  },
};

// ============================================================
// 所有类型列表
// ============================================================

export const ALL_TYPE_CODES: TypeCode[] = [
  'ISTJ', 'ISFJ', 'INFJ', 'INTJ',
  'ISTP', 'ISFP', 'INFP', 'INTP',
  'ESTP', 'ESFP', 'ENFP', 'ENTP',
  'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ',
];

// ============================================================
// 辅助函数：获取类型信息
// ============================================================

export function getTypeInfo(typeCode: TypeCode): TypeInfo {
  return TYPE_DICTIONARY[typeCode];
}

export function getTypeFullName(typeCode: TypeCode): string {
  const info = TYPE_DICTIONARY[typeCode];
  return `${info.code} ${info.nameCn} ${info.nameEn}`;
}
