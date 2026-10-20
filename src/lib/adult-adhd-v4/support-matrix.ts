/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/**
 * QM 成人ADHD评估 v4.0 - Screening × Functional Impact 支持矩阵
 *
 * 2×2 + unavailable 共 5 种组合
 * 只做路径建议，不做诊断
 */

import type { SupportMatrixCell, SupportPriority, ScreeningSignal } from './types';

// 根据官方筛查信号和功能影响均值判断单元格
export function getSupportMatrixCell(
  screeningSignal: ScreeningSignal,
  functionalImpactMean: number
): SupportMatrixCell {
  // 功能影响阈值：≥2.5 视为"明显"
  const isHighImpact = functionalImpactMean >= 2.0;

  if (screeningSignal === 'unavailable' || screeningSignal === 'incomplete') {
    return {
      priority: isHighImpact ? 'functional_support' : 'observe',
      headline: 'QM Context Profile（官方筛查模块未启用）',
      description:
        '官方筛查模块需由项目方另行配置经批准的ASRS版本。当前结果仅呈现QM扩展问卷的自我观察画像，' +
        (isHighImpact
          ? '即使没有官方筛查结果，你报告的功能影响本身也值得认真对待，可以考虑寻求专业评估来理解这些困难的原因。'
          : '你可以把这份报告作为自我观察的起点，如果困扰增加或影响扩大，再进一步寻求支持。'),
    };
  }

  if (screeningSignal === 'positive' && isHighImpact) {
    return {
      priority: 'professional_assessment',
      headline: '筛查信号 + 明显功能影响',
      description:
        '你在筛查中呈现了值得关注的信号，同时这些困难对你的生活多个领域都有明显影响。' +
        '建议把这份报告带去专业评估，和心理师或精神科医生一起深入理解。' +
        '这份结果不能告诉你是否有ADHD，但已经提供了值得带去专业评估的线索。',
    };
  }

  if (screeningSignal === 'positive' && !isHighImpact) {
    return {
      priority: 'professional_assessment',
      headline: '筛查信号值得确认，功能影响目前有限',
      description:
        '你在筛查中呈现了值得进一步确认的信号，但目前这些困难对你生活的整体影响还比较有限。' +
        '完整评估仍需要发展史、跨情境和功能信息。可以先从自我观察和环境调整入手，' +
        '如果影响扩大或困扰增加，再寻求专业评估。',
    };
  }

  if (screeningSignal === 'negative' && isHighImpact) {
    return {
      priority: 'functional_support',
      headline: '筛查信号不强，但功能困难明显',
      description:
        '即使筛查信号不强，你报告的明显功能困难本身就值得认真对待。' +
        '注意力困难可能有很多原因，包括睡眠、压力、情绪、生活节奏变化等。' +
        '建议先从改善功能影响最大的领域入手，同时可以考虑专业评估来探索原因。',
    };
  }

  // negative + low impact
  return {
    priority: 'observe',
    headline: '暂未出现强筛查信号，功能影响有限',
    description:
      '当前你的自我报告中，筛查相关信号和功能影响都在较低水平。' +
      '如果你是因为好奇或某些特定困扰来做测评，可以把这份结果作为基线。' +
      '如果未来困扰增加或影响扩大，随时可以再测或寻求专业支持。持续困扰时仍可讨论。',
  };
}

// 优先级对应的行动建议
export const SUPPORT_PRIORITY_ACTIONS: Record<SupportPriority, {
  primary_action: string;
  secondary_actions: string[];
  urgency: '低' | '中' | '高' | '紧急';
}> = {
  observe: {
    primary_action: '持续自我观察',
    secondary_actions: [
      '尝试一些环境调整和任务设计方法',
      '记录哪些场景最困扰你',
      '8-12周后可复测看变化',
    ],
    urgency: '低',
  },
  functional_support: {
    primary_action: '优先处理明显的功能困难',
    secondary_actions: [
      '从影响最大的1-2个领域开始调整',
      '考虑执行功能教练或心理咨询',
      '排查睡眠、压力等可能的叠加因素',
    ],
    urgency: '中',
  },
  professional_assessment: {
    primary_action: '建议考虑专业评估',
    secondary_actions: [
      '保存这份报告，就诊时可以带去',
      '使用"专业评估准备表"整理你的观察',
      '可以先从心理师访谈开始，必要时转介精神科',
    ],
    urgency: '中',
  },
  safety: {
    primary_action: '立即寻求安全支持',
    secondary_actions: [
      '如果你有伤害自己或他人的想法，请立即联系热线或就医',
      'QM上海酷儿心理咨询中心热线：15001930070',
      '请确保身边有人陪伴，不要独处',
    ],
    urgency: '紧急',
  },
};
