/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/**
 * QM 成人ADHD评估 v4.0 - 叙事生成引擎
 *
 * 基于结构化事实生成个性化叙述
 * 严格遵守：不诊断、不贴标签、非道德化
 */

import type {
  ADHDResult,
  UserSignature,
  QMCoreProfile,
  ExecutiveFunctionProfile,
  FunctionalImpactProfile,
  DevelopmentalContext,
  OverlapContext,
} from './types';
import { scoreToVisualPosition } from './scoring';
import { EXECUTIVE_FUNCTION_DIMENSIONS } from './dimensions';

// ============================================================
// 核心症状叙事
// ============================================================

export function generateCoreNarrative(core: QMCoreProfile): {
  headline: string;
  body: string;
  caveat: string;
} {
  const inattentionPos = scoreToVisualPosition(core.inattention_mean);
  const hyperPos = scoreToVisualPosition(core.hyperactivity_mean);
  const impulsivityPos = scoreToVisualPosition(core.impulsivity_mean);

  let pattern = '';
  if (core.inattention_mean >= 2.5 && core.hyperimpulsive_frequent_count < 5) {
    pattern = '你报告的注意力困难相对更突出一些。';
  } else if (core.hyperimpulsive_frequent_count >= 5 && core.inattention_frequent_count < 5) {
    pattern = '你报告的多动和冲动体验相对更突出一些。';
  } else if (core.inattention_mean >= 2.5 && core.hyperimpulsive_frequent_count >= 5) {
    pattern = '你报告了注意力、多动和冲动三方面的明显困扰。';
  } else {
    pattern = '你报告的核心症状频率整体处于中低水平。';
  }

  const frequentNote = `在注意力的9道题中，你有 ${core.inattention_frequent_count} 题选择了"经常"或"非常经常"；` + `在多动+冲动的9道题中，有 ${core.hyperimpulsive_frequent_count} 题选择了"经常"或"非常经常"。`;

  return {
    headline: '核心症状自评轮廓',
    body: `${pattern}${frequentNote}`,
    caveat:
      '注意：这里的计数是你自我报告的频率，不等于临床诊断的症状标准。' +
      'ADHD的诊断需要专业人员结合发展史、多情境和功能影响综合判断。',
  };
}

// ============================================================
// 执行功能叙事
// ============================================================

export function generateExecutiveNarrative(
  execFn: ExecutiveFunctionProfile
): {
  headline: string;
  top_challenges: { name: string; description: string; score: number }[];
  body: string;
} {
  const entries = Object.entries(execFn)
    .map(([k, v]) => ({ key: k, score: v }))
    .sort((a, b) => b.score - a.score);

  const top3 = entries.slice(0, 3).map((e) => ({
    name: EXECUTIVE_FUNCTION_DIMENSIONS[e.key as keyof typeof EXECUTIVE_FUNCTION_DIMENSIONS]?.name || e.key,
    description: EXECUTIVE_FUNCTION_DIMENSIONS[e.key as keyof typeof EXECUTIVE_FUNCTION_DIMENSIONS]?.description || '',
    score: e.score,
  }));

  const topNames = top3.map((t) => t.name).join('、');

  return {
    headline: '执行功能画像',
    top_challenges: top3,
    body: `如果把"注意力差"拆开来看，你这次报告中最突出的环节是${topNames}。` + `这意味着你的困难不是笼统的"不专心"，而是在具体的执行环节上遇到了挑战。` + `知道卡在哪一步，比知道"注意力差"更能帮你找到有效的支持方式。`,
  };
}

// ============================================================
// 功能影响叙事
// ============================================================

export function generateImpactNarrative(
  impact: FunctionalImpactProfile
): {
  headline: string;
  body: string;
} {
  const mean = impact.mean;
  const highDomains = Object.entries(impact)
    .filter(([k]) => k !== 'mean')
    .filter(([, v]) => v >= 3)
    .map(([k]) => k);

  let body = '';
  if (mean >= 2.5) {
    body = `这些困难对你的日常生活产生了明显的影响。` + `功能影响整体均分为 ${mean.toFixed(1)}/4，` + `其中${highDomains.length > 0 ? '影响最大的领域是' + highDomains.join('、') : '多个领域都有中等以上的影响'}。` + `功能影响高本身就值得认真对待，不管筛查结果如何。`;
  } else if (mean >= 1.5) {
    body = `这些困难对你的生活有一定影响，但目前整体还在中等水平。` + `有些领域可能已经开始让你付出额外的精力或情绪成本。`;
  } else {
    body = `目前这些困难对你生活的整体影响还比较有限。` + `你可以把这份结果作为自我观察的起点。`;
  }

  return {
    headline: '功能影响概况',
    body,
  };
}

// ============================================================
// 发展与情境叙事
// ============================================================

export function generateDevelopmentalNarrative(dev: DevelopmentalContext): {
  headline: string;
  body: string;
  caveat: string;
} {
  let body = '';

  if (dev.childhood_onset === 2) {
    body += '你回忆到12岁以前已经有相似的困难。';
  } else if (dev.childhood_onset === 1) {
    body += '你对童年是否有相关困难记得不太清楚，这很常见。';
  } else {
    body += '你没有回忆到明确的童年线索。';
  }

  body += ` 当前困难出现在${dev.cross_setting_label}中，`;
  body += `且以相似形式持续了${dev.duration_label}。`;

  return {
    headline: '发展与跨情境线索',
    body,
    caveat:
      '童年记忆可能因为各种原因不够清晰，这不代表什么。' +
      '专业评估中，心理师会和你一起探索这些信息，而不是仅凭回忆做判断。',
  };
}

// ============================================================
// 重叠因素叙事
// ============================================================

export function generateOverlapNarrative(overlap: OverlapContext): {
  headline: string;
  flagged: string[];
  uncertain: string[];
  caveat: string;
} {
  const flagged: string[] = [];
  const uncertain: string[] = [];

  const nameMap: Record<string, string> = {
    sleep: '睡眠',
    anxiety_stress: '焦虑/压力',
    low_mood_energy: '低落/疲惫',
    elevated_mood: '情绪高涨',
    substance_body: '物质/身体状况',
    trauma_environment: '创伤/环境变化',
  };

  for (const key of Object.keys(nameMap)) {
    const value = overlap[key as keyof Omit<OverlapContext, 'flags_to_discuss'>];
    if (value === 2) flagged.push(nameMap[key]);
    else if (value === 1) uncertain.push(nameMap[key]);
  }

  return {
    headline: '其他可能相关的因素',
    flagged,
    uncertain,
    caveat:
      '这些因素可能和注意力困难有重叠，也可能各自独立存在。' +
      '这不等于说你的困难是这些因素引起的，而是说在专业评估中值得一起讨论。',
  };
}

// ============================================================
// 完整报告生成入口
// ============================================================

export interface ADHDReport {
  core_narrative: ReturnType<typeof generateCoreNarrative>;
  executive_narrative: ReturnType<typeof generateExecutiveNarrative>;
  impact_narrative: ReturnType<typeof generateImpactNarrative>;
  developmental_narrative: ReturnType<typeof generateDevelopmentalNarrative>;
  overlap_narrative: ReturnType<typeof generateOverlapNarrative>;
  non_diagnostic_disclaimer: string;
}

export function generateADHDReport(result: {
  qm_core_profile: QMCoreProfile;
  executive_function_profile: ExecutiveFunctionProfile;
  functional_impact_profile: FunctionalImpactProfile;
  developmental_context: DevelopmentalContext;
  overlap_context: OverlapContext;
}): ADHDReport {
  return {
    core_narrative: generateCoreNarrative(result.qm_core_profile),
    executive_narrative: generateExecutiveNarrative(result.executive_function_profile),
    impact_narrative: generateImpactNarrative(result.functional_impact_profile),
    developmental_narrative: generateDevelopmentalNarrative(result.developmental_context),
    overlap_narrative: generateOverlapNarrative(result.overlap_context),
    non_diagnostic_disclaimer:
      '本报告基于你的自我回答生成，仅供自我觉察和专业评估准备参考。' +
      '它不是诊断，不能仅凭此确认或排除ADHD。',
  };
}
