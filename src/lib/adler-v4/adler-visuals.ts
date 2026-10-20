// QM 阿德勒指数 v4.0 — 16 类可视化定义
// 取消冠军金色、取消优势/弱项好坏视觉暗示
// 统一 QM 紫 #6B4C9A 品牌主色

import type { VisualConfig, ModuleCode, DimensionCode } from './adler-types';
import { DIMENSION_ORDER, QM_BRAND_COLOR } from './adler-types';

// 16 类可视化对应 16 个 module code
export const adlerVisuals: Record<string, VisualConfig> = {
  four_d_compass: {
    code: 'four_d_compass',
    name: '4D Compass 四维罗盘',
    type: 'compass',
    dimensions: DIMENSION_ORDER as DimensionCode[],
    hasGoldMedal: false,
    hasGoodBadLabel: false,
    brandColor: QM_BRAND_COLOR,
  },
  adlerian_profile_table: {
    code: 'adlerian_profile_table',
    name: 'Adlerian Profile Table',
    type: 'table',
    dimensions: DIMENSION_ORDER as DimensionCode[],
    hasGoldMedal: false,
    hasGoodBadLabel: false,
    brandColor: QM_BRAND_COLOR,
  },
  six_pair_matrix: {
    code: 'six_pair_matrix',
    name: '6-Pair Dynamics Matrix',
    type: 'matrix',
    dimensions: DIMENSION_ORDER as DimensionCode[],
    hasGoldMedal: false,
    hasGoodBadLabel: false,
    brandColor: QM_BRAND_COLOR,
  },
  belonging_agency_map: {
    code: 'belonging_agency_map',
    name: 'Belonging×Agency Map',
    type: 'map2d',
    dimensions: ['D', 'C'],
    hasGoldMedal: false,
    hasGoodBadLabel: false,
    brandColor: QM_BRAND_COLOR,
  },
  acceptance_purpose_map: {
    code: 'acceptance_purpose_map',
    name: 'Acceptance×Purpose Map',
    type: 'map2d',
    dimensions: ['B', 'A'],
    hasGoldMedal: false,
    hasGoodBadLabel: false,
    brandColor: QM_BRAND_COLOR,
  },
  life_tasks_map: {
    code: 'life_tasks_map',
    name: 'Life Tasks Map',
    type: 'map2d',
    dimensions: ['D', 'A'],
    hasGoldMedal: false,
    hasGoodBadLabel: false,
    brandColor: QM_BRAND_COLOR,
  },
  encouragement_map: {
    code: 'encouragement_map',
    name: 'Encouragement Map',
    type: 'map2d',
    dimensions: ['C', 'D'],
    hasGoldMedal: false,
    hasGoodBadLabel: false,
    brandColor: QM_BRAND_COLOR,
  },
  context_heatmap: {
    code: 'context_heatmap',
    name: 'Context Heatmap',
    type: 'heatmap',
    dimensions: DIMENSION_ORDER as DimensionCode[],
    hasGoldMedal: false,
    hasGoodBadLabel: false,
    brandColor: QM_BRAND_COLOR,
  },
  purpose_alignment_table: {
    code: 'purpose_alignment_table',
    name: 'Purpose Alignment Table',
    type: 'table',
    dimensions: ['A', 'C'],
    hasGoldMedal: false,
    hasGoodBadLabel: false,
    brandColor: QM_BRAND_COLOR,
  },
  private_logic_reflection: {
    code: 'private_logic_reflection',
    name: 'Private Logic Reflection Table',
    type: 'table',
    dimensions: ['B', 'C'],
    hasGoldMedal: false,
    hasGoodBadLabel: false,
    brandColor: QM_BRAND_COLOR,
  },
  courage_micro_step: {
    code: 'courage_micro_step',
    name: 'Courage Micro-Step Card',
    type: 'card',
    dimensions: ['C', 'A'],
    hasGoldMedal: false,
    hasGoodBadLabel: false,
    brandColor: QM_BRAND_COLOR,
  },
  story_mirror_people: {
    code: 'story_mirror_people',
    name: 'Story Mirror Match Card',
    type: 'card',
    dimensions: ['C', 'D'],
    hasGoldMedal: false,
    hasGoodBadLabel: false,
    brandColor: QM_BRAND_COLOR,
  },
  seven_day_board: {
    code: 'seven_day_board',
    name: '7-Day Adlerian Board',
    type: 'board',
    dimensions: DIMENSION_ORDER as DimensionCode[],
    hasGoldMedal: false,
    hasGoodBadLabel: false,
    brandColor: QM_BRAND_COLOR,
  },
  retest_delta: {
    code: 'retest_delta',
    name: 'Retest Delta View',
    type: 'table',
    dimensions: DIMENSION_ORDER as DimensionCode[],
    hasGoldMedal: false,
    hasGoodBadLabel: false,
    brandColor: QM_BRAND_COLOR,
  },
  share_card: {
    code: 'share_card',
    name: 'Share Card',
    type: 'export',
    dimensions: DIMENSION_ORDER as DimensionCode[],
    hasGoldMedal: false,
    hasGoodBadLabel: false,
    brandColor: QM_BRAND_COLOR,
  },
  pdf_dashboard: {
    code: 'pdf_dashboard',
    name: 'A4 PDF Dashboard',
    type: 'export',
    dimensions: DIMENSION_ORDER as DimensionCode[],
    hasGoldMedal: false,
    hasGoodBadLabel: false,
    brandColor: QM_BRAND_COLOR,
  },
};

// 可视化总数
export const VISUAL_COUNT = Object.keys(adlerVisuals).length; // 16

// 视觉规范
export const visualSpec = {
  brandColor: QM_BRAND_COLOR,
  brandColorLight: '#8B6FD1',
  brandColorDark: '#4A2F7A',
  backgroundColor: '#FAF8FF',
  cardBackground: '#FFFFFF',
  textPrimary: '#2D2040',
  textSecondary: '#6B5B80',
  borderColor: '#E8E0F5',
  // 统一色阶（不是好坏，只是不同维度的区分色）
  dimensionColors: {
    A: '#8B6FD1',
    B: '#6B8AC9',
    C: '#9B6BC9',
    D: '#C96B9A',
  },
  // 禁止使用的视觉元素
  forbiddenVisuals: [
    'gold_medal',        // 冠军金色
    'champion_label',    // 冠军标签
    'winner_announcement', // 赢家宣告
    'strength_weakness_dichotomy', // 优势/弱项二分法
    'good_bad_color_coding', // 好坏颜色编码
    'top_bottom_ranking_emphasis', // 高低排名强调
  ],
  // 分数呈现方式
  scorePresentation: {
    label: '本次维度位置',
    range: '0-100',
    isPercentile: false,
    normStatus: 'unapproved',
  },
} as const;

export function getVisual(code: ModuleCode): VisualConfig | undefined {
  return adlerVisuals[code];
}
