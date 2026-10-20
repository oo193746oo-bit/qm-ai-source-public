/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/**
 * QM 成人ADHD评估 v4.0 - 发展与情境模块
 *
 * 童年起始、外部线索、跨情境、持续时间、发展连续性
 * 用于 Diagnostic-context gate，不做诊断判断
 */

import type { DevelopmentalContext } from './types';

export interface DevelopmentalItem {
  key: keyof Omit<DevelopmentalContext,
    | 'childhood_onset_label'
    | 'cross_setting_label'
    | 'duration_label'
  >;
  name: string;
  questionId: string;
  description: string;
  labels: string[]; // 索引对应 0/1/2
  timeline_period: string; // 对应时间线的哪个时期
}

export const DEVELOPMENTAL_ITEMS: DevelopmentalItem[] = [
  {
    key: 'childhood_onset',
    name: '12岁前线索',
    questionId: 'D01',
    description: '在12岁以前是否已经出现相似的注意力、多动或组织困难。',
    labels: ['未回忆到', '不确定/记不清', '报告有'],
    timeline_period: 'childhood',
  },
  {
    key: 'childhood_external_clues',
    name: '童年外部反馈',
    questionId: 'D02',
    description: '童年时老师、家人或同伴是否经常提到相关困难。',
    labels: ['没有提到', '不确定/记不清', '经常提到'],
    timeline_period: 'childhood',
  },
  {
    key: 'cross_setting_count',
    name: '跨情境',
    questionId: 'D03',
    description: '当前困难出现在多少类不同场景中。',
    labels: ['主要单一情境', '两个情境', '三个或以上'],
    timeline_period: 'current',
  },
  {
    key: 'duration_months',
    name: '持续时间',
    questionId: 'D04',
    description: '这组困难以相似形式持续了多久。',
    labels: ['少于3个月', '3-5个月', '6个月或以上'],
    timeline_period: 'current',
  },
  {
    key: 'continuity',
    name: '发展连续性',
    questionId: 'D05',
    description: '从青少年到成年，核心模式是否一直存在（形式可能变化）。',
    labels: ['未观察到', '不确定/记不清', '能观察到'],
    timeline_period: 'adolescent_to_adult',
  },
];

// 发展时间线阶段
export const DEVELOPMENT_TIMELINE = [
  { id: 'childhood', name: '12岁以前', description: '童年学校与家庭' },
  { id: 'adolescent', name: '青少年期', description: '中学与青春期' },
  { id: 'young_adult', name: '青年期', description: '大学与初入社会' },
  { id: 'adult', name: '成年期', description: '工作与独立生活' },
  { id: 'recent_6m', name: '最近6个月', description: '当前主要困扰' },
];

// 汇总发展线索是否"充分"（仅作叙事参考，不是诊断）
export function summarizeDevelopmentalContext(d: DevelopmentalContext): {
  childhood_clarity: 'clear_yes' | 'unclear' | 'clear_no';
  cross_setting: 'single' | 'two' | 'multiple';
  duration_category: 'short' | 'medium' | 'long';
  overall_context_note: string;
} {
  const childhood_score = d.childhood_onset + d.childhood_external_clues;
  let childhood_clarity: 'clear_yes' | 'unclear' | 'clear_no';
  if (childhood_score >= 3) childhood_clarity = 'clear_yes';
  else if (childhood_score >= 1) childhood_clarity = 'unclear';
  else childhood_clarity = 'clear_no';

  let cross_setting: 'single' | 'two' | 'multiple';
  if (d.cross_setting_count >= 2) cross_setting = 'multiple';
  else if (d.cross_setting_count === 1) cross_setting = 'two';
  else cross_setting = 'single';

  let duration_category: 'short' | 'medium' | 'long';
  if (d.duration_months >= 2) duration_category = 'long';
  else if (d.duration_months === 1) duration_category = 'medium';
  else duration_category = 'short';

  let overall = '童年与发展史信息是专业评估的重要部分。';
  if (childhood_clarity === 'clear_yes' && cross_setting === 'multiple' && duration_category === 'long') {
    overall += '你报告了明确的童年线索、多情境和长期持续，这些都值得在专业评估中深入讨论。';
  } else if (childhood_clarity === 'unclear') {
    overall += '童年记忆可能因为各种原因不够清晰，这不代表什么，专业评估中可以一起探索。';
  } else if (childhood_clarity === 'clear_no') {
    overall += '你没有回忆到明确的童年线索，这提示我们需要更仔细地考虑其他可能的解释。';
  }

  return { childhood_clarity, cross_setting, duration_category, overall_context_note: overall };
}
