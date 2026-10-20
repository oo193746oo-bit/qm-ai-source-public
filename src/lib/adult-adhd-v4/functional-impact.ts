/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/**
 * QM 成人ADHD评估 v4.0 - 功能影响模块
 *
 * 6个生活领域：工作/学习、行政、关系、财务、健康、整体质量
 * 症状频率与功能影响分开呈现
 */

import type { FunctionalImpactProfile, FIDomain } from './types';

export interface FIDomainModule {
  key: FIDomain;
  name: string;
  fullName: string;
  questionId: string;
  description: string;
  common_impacts: string[];
  support_directions: string[];
  related_ef: string[];
  radar_angle: number; // 雷达图角度
}

export const FUNCTIONAL_IMPACT_DOMAINS_FULL: FIDomainModule[] = [
  {
    key: 'work_study',
    name: '工作/学习',
    fullName: '工作与学习效率',
    questionId: 'F01',
    description: '注意力和执行困难对工作产出、学习质量和职业发展的影响。',
    common_impacts: [
      '任务完成慢、需要加班才能跟上',
      '细节错误多、反复返工',
      '错过截止日期或卡点交付',
      '感觉自己"能力配不上岗位"',
    ],
    support_directions: [
      '环境调整：减少干扰、专注时段',
      '任务设计：拆解步骤、可视化进度',
      '时间管理：时间块、番茄工作法',
    ],
    related_ef: ['start', 'sustain', 'time', 'workingMemory'],
    radar_angle: 90,
  },
  {
    key: 'admin_tasks',
    name: '任务/行政',
    fullName: '日常行政与事务管理',
    questionId: 'F02',
    description: '对邮件、文件、预约、缴费、家务等日常事务处理的影响。',
    common_impacts: [
      '邮箱/消息堆积，越积越怕打开',
      '经常忘记预约、缴费、报销',
      '家务堆到忍无可忍才集中处理',
      '文件找不到，重要单据丢失',
    ],
    support_directions: [
      '自动化：自动扣款、自动归档',
      '极简系统：降低维护成本',
      '固定时间：每周一个"行政小时"',
    ],
    related_ef: ['organize', 'workingMemory', 'time'],
    radar_angle: 30,
  },
  {
    key: 'relationships',
    name: '关系',
    fullName: '人际关系与亲密关系',
    questionId: 'F03',
    description: '对伴侣、家人、朋友和同事之间沟通与信任的影响。',
    common_impacts: [
      '被觉得"不认真听"、"不靠谱"',
      '忘事导致反复争吵',
      '情绪爆发后后悔',
      '社交中容易分心或插话',
    ],
    support_directions: [
      '沟通边界：提前说明注意力模式',
      '共同系统：共享清单和提醒',
      '冲突缓冲：情绪上来时先暂停',
    ],
    related_ef: ['workingMemory', 'switch'],
    radar_angle: 330,
  },
  {
    key: 'finances',
    name: '财务/消费',
    fullName: '财务与消费管理',
    questionId: 'F04',
    description: '对预算、按时付款、冲动消费和长期财务规划的影响。',
    common_impacts: [
      '忘记账单导致逾期费用',
      '冲动消费事后后悔',
      '预算做了但执行不了',
      '怕看账单，财务状况模糊',
    ],
    support_directions: [
      '自动化：自动还款、自动储蓄',
      '冷却期：冲动购买等24小时',
      '简化账户：减少管理复杂度',
    ],
    related_ef: ['impulsivity', 'organize', 'time'],
    radar_angle: 270,
  },
  {
    key: 'health_routine',
    name: '健康规律',
    fullName: '健康与日常规律',
    questionId: 'F05',
    description: '对睡眠规律、运动、饮食、就医和自我照顾的影响。',
    common_impacts: [
      '睡眠不规律，熬夜后第二天更糟',
      '办了健身卡但很少去',
      '忘记吃药或就医预约',
      '饮食不规律，靠外卖或零食',
    ],
    support_directions: [
      '习惯叠加：把新行为绑在已有习惯上',
      '环境设计：让健康选择更容易',
      '身体调节：运动对注意力有帮助',
    ],
    related_ef: ['sustain', 'time', 'workingMemory'],
    radar_angle: 210,
  },
  {
    key: 'overall_quality',
    name: '整体生活质量',
    fullName: '整体生活质量与额外成本',
    questionId: 'F06',
    description: '这些困难让你在日常生活中额外付出的时间、精力和情绪成本。',
    common_impacts: [
      '总觉得自己在"赶"，没有喘息时间',
      '大量精力花在"弥补"上',
      '内心长期处于紧张和自责中',
      '感觉别人都比自己轻松',
    ],
    support_directions: [
      '自我慈悲：减少内耗本身就是支持',
      '降低标准：完成比完美重要',
      '寻求专业评估：了解原因是第一步',
    ],
    related_ef: ['start', 'sustain', 'organize', 'finish'],
    radar_angle: 150,
  },
];

// 按影响程度排序
export function getImpactedDomainsRanked(
  profile: FunctionalImpactProfile
): { domain: FIDomain; score: number }[] {
  return FUNCTIONAL_IMPACT_DOMAINS_FULL
    .map((d) => ({ domain: d.key, score: profile[d.key] }))
    .sort((a, b) => b.score - a.score);
}

// 判断功能影响是否明显（均分≥2.5或有≥3个领域≥3）
export function hasSignificantImpact(profile: FunctionalImpactProfile): boolean {
  if (profile.mean >= 2.5) return true;
  const highCount = FUNCTIONAL_IMPACT_DOMAINS_FULL.filter(
    (d) => profile[d.key] >= 3
  ).length;
  return highCount >= 3;
}
