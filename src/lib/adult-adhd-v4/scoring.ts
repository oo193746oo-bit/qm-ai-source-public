/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/**
 * QM 成人ADHD评估 v4.0 - 评分引擎
 *
 * 程序计算，LLM只读
 * RAW_ASSESSMENT_READ_ONLY = true
 * norm_status = 'unapproved'
 */

import type {
  ADHDQuestion,
  QMCoreProfile,
  ExecutiveFunctionProfile,
  EmotionRegulationProfile,
  FunctionalImpactProfile,
  DevelopmentalContext,
  OverlapContext,
  UserSignature,
  ADHDResult,
  EFKey,
} from './types';
import { adhdQuestions48, QUESTION_GROUPS } from './questions-48';
import { EXECUTIVE_FUNCTION_DIMENSIONS } from './dimensions';

// ============================================================
// 答案映射工具
// ============================================================

export function buildAnswerMap(
  answers: Map<string, number> | Record<string, number>
): Map<string, number> {
  if (answers instanceof Map) {
    return new Map(answers);
  }
  const m = new Map<string, number>();
  for (const [k, v] of Object.entries(answers)) {
    m.set(k, v);
  }
  return m;
}

function getAnswer(answerMap: Map<string, number>, id: string): number {
  return answerMap.get(id) ?? 0;
}

// ============================================================
// 均分计算
// ============================================================

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((a, b) => a + b, 0);
  return Math.round((sum / values.length) * 100) / 100;
}

// 0-4 映射到 0-100 视觉位置（不叫人口百分位）
export function scoreToVisualPosition(score: number, max: number = 4): number {
  return Math.round((score / max) * 100);
}

// 计算经常/非常经常(≥3)的题数
function countFrequent(answerMap: Map<string, number>, ids: string[]): number {
  return ids.filter((id) => getAnswer(answerMap, id) >= 3).length;
}

// ============================================================
// QM Core Profile
// ============================================================

export function calculateQMCoreProfile(answerMap: Map<string, number>): QMCoreProfile {
  const inattentionIds = QUESTION_GROUPS.core_inattention;
  const hyperactivityIds = QUESTION_GROUPS.core_hyperactivity;
  const impulsivityIds = QUESTION_GROUPS.core_impulsivity;

  const inattention_values = inattentionIds.map((id) => getAnswer(answerMap, id));
  const hyperactivity_values = hyperactivityIds.map((id) => getAnswer(answerMap, id));
  const impulsivity_values = impulsivityIds.map((id) => getAnswer(answerMap, id));

  const inattention_frequent_count = countFrequent(answerMap, inattentionIds);
  const hyperactivity_frequent_count = countFrequent(answerMap, hyperactivityIds);
  const impulsivity_frequent_count = countFrequent(answerMap, impulsivityIds);
  const hyperimpulsive_frequent_count = hyperactivity_frequent_count + impulsivity_frequent_count;

  return {
    inattention_mean: mean(inattention_values),
    hyperactivity_mean: mean(hyperactivity_values),
    impulsivity_mean: mean(impulsivity_values),
    inattention_frequent_count,
    hyperactivity_frequent_count,
    impulsivity_frequent_count,
    hyperimpulsive_frequent_count,
    // 自评频率计数 ≥5 作为叙事支持，不是诊断
    inattention_pattern_support: inattention_frequent_count >= 5,
    hyperimpulsive_pattern_support: hyperimpulsive_frequent_count >= 5,
  };
}

// ============================================================
// Executive Function Profile
// ============================================================

export function calculateExecutiveFunction(answerMap: Map<string, number>): ExecutiveFunctionProfile {
  // E01=start, E02=time, E03=prioritize, E04=workingMemory, E05=switch, E06=sustain, E07=organize, E08=finish
  return {
    start: getAnswer(answerMap, 'E01'),
    prioritize: getAnswer(answerMap, 'E03'),
    time: getAnswer(answerMap, 'E02'),
    workingMemory: getAnswer(answerMap, 'E04'),
    switch: getAnswer(answerMap, 'E05'),
    sustain: getAnswer(answerMap, 'E06'),
    organize: getAnswer(answerMap, 'E07'),
    finish: getAnswer(answerMap, 'E08'),
  };
}

// ============================================================
// Emotion Regulation
// ============================================================

export function calculateEmotionRegulation(answerMap: Map<string, number>): EmotionRegulationProfile {
  const values = ['R01', 'R02', 'R03', 'R04', 'R05'].map((id) => getAnswer(answerMap, id));
  return {
    frustration_threshold: getAnswer(answerMap, 'R01'),
    recovery_speed: getAnswer(answerMap, 'R02'),
    criticism_trigger: getAnswer(answerMap, 'R03'),
    overwhelm: getAnswer(answerMap, 'R04'),
    action_impact: getAnswer(answerMap, 'R05'),
    mean: mean(values),
    note: '非DSM核心维度',
  };
}

// ============================================================
// Functional Impact
// ============================================================

export function calculateFunctionalImpact(answerMap: Map<string, number>): FunctionalImpactProfile {
  const work_study = getAnswer(answerMap, 'F01');
  const admin_tasks = getAnswer(answerMap, 'F02');
  const relationships = getAnswer(answerMap, 'F03');
  const finances = getAnswer(answerMap, 'F04');
  const health_routine = getAnswer(answerMap, 'F05');
  const overall_quality = getAnswer(answerMap, 'F06');
  return {
    work_study,
    admin_tasks,
    relationships,
    finances,
    health_routine,
    overall_quality,
    mean: mean([work_study, admin_tasks, relationships, finances, health_routine, overall_quality]),
  };
}

// ============================================================
// Developmental Context
// ============================================================

export function calculateDevelopmentalContext(answerMap: Map<string, number>): DevelopmentalContext {
  const d01 = getAnswer(answerMap, 'D01');
  const d02 = getAnswer(answerMap, 'D02');
  const d03 = getAnswer(answerMap, 'D03');
  const d04 = getAnswer(answerMap, 'D04');
  const d05 = getAnswer(answerMap, 'D05');

  const childhoodLabels = ['未回忆到明确童年线索', '不确定/记不清', '报告有童年线索'];
  const crossSettingLabels = ['主要在单一情境', '两个情境', '三个或以上情境'];
  const durationLabels = ['少于3个月', '3-5个月', '6个月或以上'];

  return {
    childhood_onset: d01,
    childhood_external_clues: d02,
    cross_setting_count: d03,
    duration_months: d04,
    continuity: d05,
    childhood_onset_label: childhoodLabels[d01] || childhoodLabels[0],
    cross_setting_label: crossSettingLabels[d03] || crossSettingLabels[0],
    duration_label: durationLabels[d04] || durationLabels[0],
  };
}

// ============================================================
// Overlap Context
// ============================================================

export function calculateOverlapContext(answerMap: Map<string, number>): OverlapContext {
  const sleep = getAnswer(answerMap, 'X01');
  const anxiety_stress = getAnswer(answerMap, 'X02');
  const low_mood_energy = getAnswer(answerMap, 'X03');
  const elevated_mood = getAnswer(answerMap, 'X04');
  const substance_body = getAnswer(answerMap, 'X05');
  const trauma_environment = getAnswer(answerMap, 'X06');

  // 值为 2 (是) 的项目加入讨论清单
  const flagsToDiscuss: string[] = [];
  if (sleep === 2) flagsToDiscuss.push('睡眠问题');
  if (anxiety_stress === 2) flagsToDiscuss.push('焦虑/压力');
  if (low_mood_energy === 2) flagsToDiscuss.push('低落/疲惫');
  if (elevated_mood === 2) flagsToDiscuss.push('情绪高涨周期');
  if (substance_body === 2) flagsToDiscuss.push('物质/药物/身体状况');
  if (trauma_environment === 2) flagsToDiscuss.push('创伤/环境变化');

  return {
    sleep,
    anxiety_stress,
    low_mood_energy,
    elevated_mood,
    substance_body,
    trauma_environment,
    flags_to_discuss: flagsToDiscuss,
  };
}

// ============================================================
// User Signature
// ============================================================

export function buildUserSignature(params: {
  screeningSignal: 'positive' | 'negative' | 'unavailable' | 'incomplete';
  core: QMCoreProfile;
  execFn: ExecutiveFunctionProfile;
  emotion: EmotionRegulationProfile;
  impact: FunctionalImpactProfile;
  dev: DevelopmentalContext;
  overlap: OverlapContext;
  supportPriority: string;
}): UserSignature {
  const { core, execFn, impact, screeningSignal, emotion, dev, overlap, supportPriority } = params;

  // Top 3 功能影响领域
  const impactEntries = Object.entries(impact)
    .filter(([k]) => k !== 'mean')
    .map(([k, v]) => [k, v] as [string, number])
    .sort((a, b) => b[1] - a[1]);

  const top_3_domains = impactEntries.slice(0, 3).map(([k]) => k);
  const bottom_3_domains = impactEntries.slice(-3).map(([k]) => k);

  // Top/最弱 3 执行功能
  const efEntries = Object.entries(execFn)
    .map(([k, v]) => [k, v] as [string, number])
    .sort((a, b) => b[1] - a[1]);

  const top_3_ef = efEntries.slice(0, 3).map(([k]) => k);
  const weakest_3_ef = efEntries.slice(-3).map(([k]) => k);

  return {
    official_screening_signal: screeningSignal,
    qm_core: core,
    executive_function: execFn,
    emotion_regulation: emotion,
    functional_impact: impact,
    developmental: dev,
    overlap,
    support_priority: supportPriority as any,
    top_3_domains,
    bottom_3_domains,
    top_3_ef,
    weakest_3_ef,
    primary_scenes: [], // 由场景模块填充
  };
}

// ============================================================
// 完整评分入口
// ============================================================

export interface ScoringResult {
  core: QMCoreProfile;
  executiveFunction: ExecutiveFunctionProfile;
  emotionRegulation: EmotionRegulationProfile;
  functionalImpact: FunctionalImpactProfile;
  developmental: DevelopmentalContext;
  overlap: OverlapContext;
}

export function calculateADHDScore(
  answers: Map<string, number> | Record<string, number>,
  questions: ADHDQuestion[] = adhdQuestions48
): ScoringResult {
  const answerMap = buildAnswerMap(answers);

  const core = calculateQMCoreProfile(answerMap);
  const executiveFunction = calculateExecutiveFunction(answerMap);
  const emotionRegulation = calculateEmotionRegulation(answerMap);
  const functionalImpact = calculateFunctionalImpact(answerMap);
  const developmental = calculateDevelopmentalContext(answerMap);
  const overlap = calculateOverlapContext(answerMap);

  return {
    core,
    executiveFunction,
    emotionRegulation,
    functionalImpact,
    developmental,
    overlap,
  };
}
