/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/**
 * QM 成人ADHD评估 v4.0 - 18类可视化配置
 *
 * V01-V18 全部实现配置/渲染
 * 主色 QM 紫 #6B4C9A，取消冠军金色，取消优势/弱项好坏暗示
 */

import type { VisualizationConfig } from './types';

export const PRIMARY_COLOR = '#6B4C9A';
export const PRIMARY_LIGHT = '#8B6FC2';
export const PRIMARY_DARK = '#4A316A';
export const ACCENT_COLOR = '#A78BD1';
export const BG_SOFT = '#F5F1FA';

// 18 类可视化配置
export const VISUALIZATIONS: VisualizationConfig[] = [
  // V01
  {
    id: 'V01',
    name: 'Screening Snapshot',
    purpose: '第一眼看懂"这是筛查，不是诊断"',
    type: 'snapshot_card',
    dataKey: 'screening_snapshot',
  },
  // V02
  {
    id: 'V02',
    name: 'Core Symptom Bars',
    purpose: '区分注意力、多动、冲动三个核心维度',
    type: 'horizontal_bars',
    dataKey: 'core_symptoms',
  },
  // V03
  {
    id: 'V03',
    name: 'Executive Function Heatmap',
    purpose: '把"注意力差"拆成具体执行环节（8格热力表）',
    type: 'heatmap_8',
    dataKey: 'executive_function',
  },
  // V04
  {
    id: 'V04',
    name: 'Task Lifecycle',
    purpose: '看见卡点出现在 Start/Sustain/Switch/Finish 哪一段',
    type: 'lifecycle_flow',
    dataKey: 'task_lifecycle',
  },
  // V05
  {
    id: 'V05',
    name: 'Functional Impact Radar',
    purpose: '症状与实际生活后果分开',
    type: 'radar_6',
    dataKey: 'functional_impact',
  },
  // V06
  {
    id: 'V06',
    name: 'Context Matrix',
    purpose: '看困难在哪些场景出现（跨情境矩阵）',
    type: 'context_matrix',
    dataKey: 'cross_setting',
  },
  // V07
  {
    id: 'V07',
    name: 'Development Timeline',
    purpose: '呈现12岁前、青少年、成年、最近6个月',
    type: 'timeline',
    dataKey: 'developmental',
  },
  // V08
  {
    id: 'V08',
    name: 'Emotion Regulation Panel',
    purpose: '显示与ADHD常见但非核心诊断标准的体验',
    type: 'panel_5',
    dataKey: 'emotion_regulation',
  },
  // V09
  {
    id: 'V09',
    name: 'Overlap Check Table',
    purpose: '提醒其他可能原因（鉴别提示，不是诊断）',
    type: 'check_table',
    dataKey: 'overlap',
  },
  // V10
  {
    id: 'V10',
    name: 'Profile Table',
    purpose: '最重要的可视化表格：完整画像',
    type: 'profile_table',
    dataKey: 'full_profile',
  },
  // V11
  {
    id: 'V11',
    name: 'Scene Heatmap',
    purpose: '把结果映射到现实（12场景×核心/执行）',
    type: 'scene_heatmap_12',
    dataKey: 'scene_profile',
  },
  // V12
  {
    id: 'V12',
    name: 'Support Strategy Matrix',
    purpose: '从结果直接连接可尝试的支持',
    type: 'strategy_matrix',
    dataKey: 'support_strategies',
  },
  // V13
  {
    id: 'V13',
    name: 'Professional Assessment Prep',
    purpose: '把结果变成就诊有用信息',
    type: 'prep_form',
    dataKey: 'assessment_prep',
  },
  // V14
  {
    id: 'V14',
    name: 'Story Mirror Match Card',
    purpose: '名人/人物叙事镜像',
    type: 'story_card',
    dataKey: 'story_mirror_people',
  },
  // V15
  {
    id: 'V15',
    name: 'Media Mirror Card',
    purpose: '影视/文学叙事镜像',
    type: 'media_card',
    dataKey: 'story_mirror_media',
  },
  // V16
  {
    id: 'V16',
    name: '7-Day Friction Log',
    purpose: '7天摩擦日志：验证结果而非被标签定义',
    type: 'friction_log',
    dataKey: 'friction_log_7d',
  },
  // V17
  {
    id: 'V17',
    name: 'Retest & Context Delta',
    purpose: '复测变化对比',
    type: 'delta_comparison',
    dataKey: 'retest_delta',
  },
  // V18
  {
    id: 'V18',
    name: 'PNG/PDF/Share Dashboard',
    purpose: '保存与分享仪表盘',
    type: 'export_dashboard',
    dataKey: 'export_options',
  },
];

// 颜色比例尺：根据 0-4 得分返回颜色深度
export function getScoreColor(score: number, max: number = 4): string {
  const ratio = Math.min(1, Math.max(0, score / max));
  if (ratio <= 0.25) return '#EDE7F5'; // 很浅
  if (ratio <= 0.5) return '#D4C4E8';  // 浅
  if (ratio <= 0.75) return '#A78BD1'; // 中
  return '#6B4C9A';                    // 深
}

// 视觉位置文字描述（不叫百分位）
export function getVisualPositionLabel(position: number): string {
  if (position < 25) return '本次报告位置：较低';
  if (position < 50) return '本次报告位置：中低';
  if (position < 75) return '本次报告位置：中高';
  return '本次报告位置：较高';
}

// 注意：所有可视化中的位置描述只能用"本次维度位置"或"本次报告位置"，
// 不得使用"人口百分位"、"高于X%的人"等表述。
export const VISUAL_POSITION_DISCLAIMER = '图中位置仅反映你本次自我报告的相对程度，不代表人口学百分位排名。';

// 可视化排序（页面渲染顺序）
export const VISUALIZATION_ORDER = [
  'V01', 'V02', 'V03', 'V04', 'V05',
  'V06', 'V07', 'V08', 'V09', 'V10',
  'V11', 'V12', 'V13', 'V14', 'V15',
  'V16', 'V17', 'V18',
];

export const VISUALIZATION_COUNT = VISUALIZATIONS.length;
