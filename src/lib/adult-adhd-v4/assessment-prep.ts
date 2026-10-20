/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/**
 * QM 成人ADHD评估 v4.0 - 专业评估准备表
 *
 * 自动汇总就诊有用信息：
 * - 最困扰的3个场景
 * - 注意力/多动/冲动自评轮廓
 * - 执行功能最卡的2-3环节
 * - 工作/关系/行政/财务/健康等影响
 * - 12岁前线索与学校/家庭反馈
 * - 是否跨两个以上情境
 * - 睡眠、焦虑/压力、低落/疲惫、情绪高涨、物质/药物/身体状况、创伤/环境变化
 * - 我尝试过的支持方法
 * - 我想问专业人员的3个问题
 */

import type {
  AssessmentPrep,
  QMCoreProfile,
  ExecutiveFunctionProfile,
  FunctionalImpactProfile,
  DevelopmentalContext,
  OverlapContext,
} from './types';
import { getTopChallenges } from './executive-function';
import { FUNCTIONAL_IMPACT_DOMAINS_FULL } from './functional-impact';
import { SCENES_16, estimateSceneChallenge, getTopScenes } from './scenes';

export function buildAssessmentPrep(params: {
  core: QMCoreProfile;
  execFn: ExecutiveFunctionProfile;
  impact: FunctionalImpactProfile;
  dev: DevelopmentalContext;
  overlap: OverlapContext;
}): AssessmentPrep {
  const { core, execFn, impact, dev, overlap } = params;

  // 最困扰的3个场景
  const sceneChallenges = estimateSceneChallenge(
    {
      inattention: core.inattention_mean,
      hyperactivity: core.hyperactivity_mean,
      impulsivity: core.impulsivity_mean,
    },
    execFn as any
  );
  const topSceneIds = getTopScenes(sceneChallenges, 3);
  const topSceneNames = topSceneIds
    .map((id) => SCENES_16.find((s) => s.id === id)?.name || id)
    .filter(Boolean);

  // 执行功能最卡的2-3环节
  const topEFKeys = getTopChallenges(execFn, 3);
  const efNames: Record<string, string> = {
    start: '启动',
    prioritize: '优先级',
    time: '时间感',
    workingMemory: '工作记忆',
    switch: '切换',
    sustain: '持续',
    organize: '组织',
    finish: '收尾',
  };

  // 功能影响排序
  const impactedDomains = FUNCTIONAL_IMPACT_DOMAINS_FULL
    .filter((d) => impact[d.key] >= 2)
    .map((d) => d.name);

  // 重叠因素中"是"的项目
  const overlapItems: string[] = [];
  if (overlap.sleep === 2) overlapItems.push('睡眠问题');
  if (overlap.anxiety_stress === 2) overlapItems.push('焦虑/压力');
  if (overlap.low_mood_energy === 2) overlapItems.push('低落/疲惫');
  if (overlap.elevated_mood === 2) overlapItems.push('情绪高涨周期');
  if (overlap.substance_body === 2) overlapItems.push('物质/药物/身体状况');
  if (overlap.trauma_environment === 2) overlapItems.push('创伤/环境变化');

  // 童年线索
  let childhoodClues = '未回忆到明确童年线索';
  if (dev.childhood_onset === 2 && dev.childhood_external_clues === 2) {
    childhoodClues = '报告有12岁前线索，且有老师/家人/同伴的外部反馈';
  } else if (dev.childhood_onset === 2 || dev.childhood_external_clues === 2) {
    childhoodClues = '报告有部分童年线索，但记忆或外部反馈不完全明确';
  } else if (dev.childhood_onset === 1 || dev.childhood_external_clues === 1) {
    childhoodClues = '童年记忆不够清晰，不确定是否有相关线索';
  }

  // 跨情境
  const crossSetting = dev.cross_setting_label;

  // 自评轮廓总结
  const profileSummary = `注意力均分 ${core.inattention_mean}/4（自评"经常/非常经常" ${core.inattention_frequent_count} 题），多动均分 ${core.hyperactivity_mean}/4（${core.hyperactivity_frequent_count} 题），冲动均分 ${core.impulsivity_mean}/4（${core.impulsivity_frequent_count} 题）。均为自我报告频率，不等于临床诊断标准。`;

  return {
    top_bothering_scenes: topSceneNames,
    self_profile_summary: profileSummary,
    executive_stuck_points: topEFKeys.map((k) => efNames[k] || k),
    functional_impact_areas: impactedDomains.length > 0 ? impactedDomains : ['暂无明显影响的领域'],
    childhood_clues: childhoodClues,
    cross_setting: crossSetting,
    overlap_items: overlapItems.length > 0 ? overlapItems : ['暂未报告明显的重叠因素'],
    tried_supports: '（请自行填写：你之前尝试过哪些方法来应对这些困难？效果如何？）',
    questions_to_professional: [
      '根据我的报告，你觉得我需要进一步做哪些评估来理解这些困难？',
      '我的困难模式中，哪些部分最值得先关注和尝试调整？',
      '如果考虑专业支持，有哪些方向可以选择？',
    ],
  };
}
