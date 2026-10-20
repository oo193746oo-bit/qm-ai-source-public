/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/**
 * QM 成人ADHD评估 v4.0 - 重叠因素检查
 *
 * 睡眠、焦虑/压力、低落/疲惫、情绪高涨、物质/身体、创伤/环境
 * 只提示评估议题，绝不生成替代诊断
 */

import type { OverlapContext } from './types';

export interface OverlapItem {
  key: keyof Omit<OverlapContext, 'flags_to_discuss'>;
  name: string;
  questionId: string;
  description: string;
  why_it_matters: string;
  what_to_discuss: string;
  caution: string; // 禁止诊断的说明
}

export const OVERLAP_ITEMS: OverlapItem[] = [
  {
    key: 'sleep',
    name: '睡眠',
    questionId: 'X01',
    description: '长期睡眠不足、昼夜节律混乱、睡眠呼吸问题或失眠。',
    why_it_matters: '睡眠不足本身就会导致注意力差、冲动增加、情绪不稳和疲惫，这些可能和注意困难混淆或叠加。',
    what_to_discuss: '最近的睡眠质量和规律；是否有打鼾、呼吸暂停或入睡困难；调整睡眠后注意力是否改善。',
    caution: '睡眠问题可能是原因、结果，或同时存在，需要专业评估来区分。',
  },
  {
    key: 'anxiety_stress',
    name: '焦虑/压力',
    questionId: 'X02',
    description: '焦虑、巨大压力或持续担忧明显时困难加重。',
    why_it_matters: '焦虑和压力会占用工作记忆、增加分心和难以集中，表现可能和注意力困难很像。',
    what_to_discuss: '困难开始的时间和压力事件的关系；焦虑缓解时注意力是否改善；是否有过度担忧、肌肉紧张等焦虑表现。',
    caution: '焦虑和注意力困难可以同时存在，也可以一个导致另一个，不是二选一的关系。',
  },
  {
    key: 'low_mood_energy',
    name: '低落/疲惫',
    questionId: 'X03',
    description: '持续低落、兴趣下降、明显疲惫或精力不足时困难加重。',
    why_it_matters: '抑郁或精力不足会导致注意力下降、动力缺乏、决策困难，容易被误认为是注意力问题。',
    what_to_discuss: '情绪低落和注意力困难哪个先出现；做喜欢的事时是否还能集中；是否有食欲、睡眠、自尊的变化。',
    caution: '低落和注意力困难常常同时出现，但处理方向可能不同，需要专业区分。',
  },
  {
    key: 'elevated_mood',
    name: '情绪高涨',
    questionId: 'X04',
    description: '是否有过睡得很少却不困、精力异常高、想法特别快或特别冒险的时期。',
    why_it_matters: '情绪高涨期的多动、冲动、睡眠需求减少可能和多动/冲动表现相似，但可能对应不同的状况。',
    what_to_discuss: '这种时期持续多久、出现的频率；是否伴随特别乐观、话多、冒险行为；之后是否会有低落期。',
    caution: '这不是在说你有双相或其他诊断，只是专业评估中值得一起讨论的信息。',
  },
  {
    key: 'substance_body',
    name: '物质/身体',
    questionId: 'X05',
    description: '酒精/其他物质、某些药物、甲状腺/贫血/慢性疼痛等身体状况。',
    why_it_matters: '很多身体状况和物质使用会影响注意力、情绪和冲动控制，需要排除或同时考虑。',
    what_to_discuss: '近期的健康变化；正在使用的药物或补充剂；酒精、咖啡因或其他物质的使用情况；是否有甲状腺、贫血等已知问题。',
    caution: '身体因素是专业评估的常规排查项，有这些不说明注意力困难就是它们引起的。',
  },
  {
    key: 'trauma_environment',
    name: '创伤/环境变化',
    questionId: 'X06',
    description: '创伤事件、关系冲突、搬迁、失业、照护压力等重大环境变化后明显开始或恶化。',
    why_it_matters: '创伤和重大压力事件后出现的注意力、情绪和行为变化，可能有不同的原因和支持方向。',
    what_to_discuss: '困难开始或明显加重的时间点；是否对应某个重大事件；是否有闪回、回避、过度警觉等体验。',
    caution: '创伤和注意力困难可以同时存在，也可能有因果关系，需要专业人士一起理解。',
  },
];

// 获取需要讨论的重叠因素
export function getOverlapFlagsToDiscuss(
  overlap: OverlapContext
): OverlapItem[] {
  return OVERLAP_ITEMS.filter((item) => {
    const value = overlap[item.key];
    return value === 2; // "是"
  });
}

// 获取不确定的重叠因素
export function getUncertainOverlapItems(
  overlap: OverlapContext
): OverlapItem[] {
  return OVERLAP_ITEMS.filter((item) => {
    const value = overlap[item.key];
    return value === 1; // "不确定"
  });
}

// 重叠因素总数（是+不确定）
export function getTotalOverlapConcernCount(overlap: OverlapContext): number {
  return OVERLAP_ITEMS.filter((item) => {
    const value = overlap[item.key];
    return value >= 1;
  }).length;
}
