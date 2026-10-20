/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/**
 * QM 成人ADHD评估 v4.0 - 安全门与专业支持门
 *
 * Safety Gate 只由"当前自伤/伤人/急性失控/现实检验严重异常"触发
 * 高功能损害、筛查阳性、情绪调节高都不能单独触发危机
 * Professional Support Gate 由筛查阳性/功能影响明显/重叠复杂等触发
 */

import type { SupportPriority, OverlapContext, FunctionalImpactProfile } from './types';

// ============================================================
// Safety Gate - 只有真实当前风险才触发
// ============================================================

export interface SafetyGateInput {
  // 注意：本测评不直接询问自伤问题
  // Safety Gate 主要用于 chat 交互场景中检测到危机信号时触发
  // 此处保留接口定义
  current_self_harm_risk: boolean;
  current_harm_others_risk: boolean;
  acute_reality_testing_issue: boolean;
  acute_loss_of_control: boolean;
}

export function checkSafetyGate(input: SafetyGateInput): {
  triggered: boolean;
  level: 'none' | 'safety';
  message: string;
  hotline: {
    primary: string;
    backup: string;
    wechat: string;
    organization: string;
  };
} {
  const triggered =
    input.current_self_harm_risk ||
    input.current_harm_others_risk ||
    input.acute_reality_testing_issue ||
    input.acute_loss_of_control;

  return {
    triggered,
    level: triggered ? 'safety' : 'none',
    message: triggered
      ? '如果你当前正在经历伤害自己或他人的想法，或感到完全失控，请立即联系支持热线或前往最近的急诊。你值得被帮助。'
      : '当前未触发安全流程。',
    hotline: {
      primary: '15001930070',
      backup: '13601658763',
      wechat: '',
      organization: 'QM上海酷儿心理咨询中心',
    },
  };
}

// ============================================================
// Professional Support Gate
// ============================================================

export interface ProfSupportGateInput {
  official_screening_signal: 'positive' | 'negative' | 'unavailable' | 'incomplete';
  functional_impact_mean: number;
  functional_impact_high_domains_count: number;
  developmental_childhood_clarity: 'clear_yes' | 'unclear' | 'clear_no';
  cross_setting_count: number; // 0-2
  overlap_flags_count: number; // 有多少个 "是" 的重叠因素
}

export function checkProfessionalSupportGate(
  input: ProfSupportGateInput
): {
  triggered: boolean;
  priority: SupportPriority;
  headline: string;
  description: string;
} {
  const {
    official_screening_signal,
    functional_impact_mean,
    functional_impact_high_domains_count,
    developmental_childhood_clarity,
    cross_setting_count,
    overlap_flags_count,
  } = input;

  const hasSignificantImpact = functional_impact_mean >= 2.0 || functional_impact_high_domains_count >= 3;
  const hasScreeningPositive = official_screening_signal === 'positive';
  const hasComplexContext =
    developmental_childhood_clarity === 'clear_yes' && cross_setting_count >= 2;
  const hasMultipleOverlap = overlap_flags_count >= 2;

  // 触发条件：满足任一
  const triggered =
    hasScreeningPositive ||
    hasSignificantImpact ||
    hasComplexContext ||
    hasMultipleOverlap;

  let priority: SupportPriority = 'observe';
  let headline = '持续自我观察';
  let description = '当前你的报告中，筛查信号和功能影响都在较低水平。可以把这份结果作为自我观察的基线。';

  if (hasScreeningPositive && hasSignificantImpact) {
    priority = 'professional_assessment';
    headline = '建议考虑专业评估';
    description =
      '这份结果不能告诉你是否有ADHD，但已经提供了值得带去专业评估的线索。' +
      '建议保存这份报告，和心理师或精神科医生一起深入讨论。';
  } else if (hasScreeningPositive) {
    priority = 'professional_assessment';
    headline = '筛查信号值得进一步确认';
    description =
      '你在筛查中呈现了值得关注的信号。完整评估需要发展史、跨情境和功能信息，' +
      '建议寻求专业评估来获得更清楚的理解。';
  } else if (hasSignificantImpact) {
    priority = 'functional_support';
    headline = '优先处理明显的功能困难';
    description =
      '即使筛查信号不明确，你报告的功能困难本身就值得认真对待。' +
      '建议先从影响最大的领域入手调整，同时可以考虑专业评估来理解原因。';
  } else if (hasComplexContext || hasMultipleOverlap) {
    priority = 'professional_assessment';
    headline = '情境信息较为复杂，建议专业评估',
    description =
      '你报告了较多的发展线索或重叠因素，这些信息在专业评估中可以帮助更全面地理解你的困难。' +
      '这不是说问题更严重，而是说有更多值得一起探索的内容。';
  }

  return { triggered, priority, headline, description };
}

// ============================================================
// 热线与转介信息（唯一来源）
// ============================================================

export const REFERRAL_INFO = {
  organization: 'QM上海酷儿心理咨询中心',
  hotline_primary: '15001930070',
  hotline_backup: '13601658763',
  wechat: '',
  role: '心理师', // 用户可见术语用"心理师"不是"咨询师"
  note: '这是本测评唯一推荐的专业支持机构。',
};

// 禁止出现的号码（安全校验用）
export const FORBIDDEN_PHONES = [
  '400', // 400号码
  '120', // 急救
  '110', // 报警
];
