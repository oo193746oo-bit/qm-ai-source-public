/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/**
 * QM 成人ADHD评估 v4.0 - 类型定义
 *
 * 双层循证架构：Evidence Screener + QM Extended Context Profile
 * 程序计分，LLM只读
 */

export const ASSESSMENT_ID = 'adult-adhd';
export const ASSESSMENT_VERSION = '4.0';
export const ESTIMATED_MINUTES = 15;

export interface ADHDQuestion {
  id: string;
  text: string;
  category: QuestionCategory;
  scaleType: ScaleType;
  options: QuestionOption[];
  timeFrame: string;
  purpose: string;
  dimension?: string;
}


export interface ExecutiveFunctionProfile {
  start: number;          // E01 启动
  prioritize: number;     // E03 优先级
  time: number;           // E02 时间感
  workingMemory: number;  // E04 工作记忆
  switch: number;         // E05 切换
  sustain: number;        // E06 持续
  organize: number;       // E07 组织
  finish: number;         // E08 收尾
}

export type EFKey = keyof ExecutiveFunctionProfile;

export interface EmotionRegulationProfile {
  frustration_threshold: number;   // R01
  recovery_speed: number;          // R02
  criticism_trigger: number;       // R03
  overwhelm: number;               // R04
  action_impact: number;           // R05
  mean: number;
  note: string; // "非DSM核心维度"
}

export interface FunctionalImpactProfile {
  work_study: number;    // F01
  admin_tasks: number;   // F02
  relationships: number; // F03
  finances: number;      // F04
  health_routine: number;// F05
  overall_quality: number;// F06
  mean: number;
}

export type FIDomain = keyof Omit<FunctionalImpactProfile, 'mean'>;

export interface DevelopmentalContext {
  childhood_onset: number;          // D01 0-2
  childhood_external_clues: number; // D02 0-2
  cross_setting_count: number;      // D03 0-2
  duration_months: number;          // D04 0-2
  continuity: number;               // D05 0-2
  childhood_onset_label: string;
  cross_setting_label: string;
  duration_label: string;
}

export interface OverlapContext {
  sleep: number;          // X01 0-2
  anxiety_stress: number; // X02
  low_mood_energy: number;// X03
  elevated_mood: number;  // X04
  substance_body: number; // X05
  trauma_environment: number; // X06
  flags_to_discuss: string[];
}










export interface AssessmentPrep {
  top_bothering_scenes: string[];
  self_profile_summary: string;
  executive_stuck_points: string[];
  functional_impact_areas: string[];
  childhood_clues: string;
  cross_setting: string;
  overlap_items: string[];
  tried_supports: string;
  questions_to_professional: string[];
}


