/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// QM-GDI-48 v4.1 可视化配置
// 全部QM紫色系：品牌色 #6B4C9A
// 可视化类型：雷达图、条形图、流动时间线、表达仪表盘、归属网络图、
//            肯定时刻时间线、规范自主性地图、Pair热力图、情境弹性雷达、模块瀑布流

import { VisualizationConfig, DimensionCode, AssessmentProfile } from './gdi-types';
import { GDI_DIMENSIONS, DIMENSION_ORDER } from './gdi-dimensions';

// 品牌颜色
export const BRAND_COLOR = '#6B4C9A';

// 紫色渐变色系（8维对应色）
export const DIMENSION_COLORS: Record<DimensionCode, string> = {
  IGS: '#6B4C9A',
  SDO: '#8B6FC4',
  EA: '#A084D4',
  CF: '#B8A5E0',
  GCC: '#7B5FAE',
  GAE: '#957ABE',
  SNA: '#AD95D5',
  BR: '#8E74C2',
};

// 淡紫色背景
export const LIGHT_PURPLE = '#F5F0FF';
export const MEDIUM_PURPLE = '#D4C5E8';
export const DARK_PURPLE = '#4A336E';

// 可视化配置列表
export const VISUALIZATION_CONFIGS: VisualizationConfig[] = [
  {
    id: 'radar_chart',
    type: 'radar',
    title: '八维雷达图',
    dataKeys: ['IGS', 'SDO', 'EA', 'CF', 'GCC', 'GAE', 'SNA', 'BR'],
    colorScheme: 'purple_gradient',
  },
  {
    id: 'dimension_bar_chart',
    type: 'bar',
    title: '维度条形图',
    dataKeys: ['IGS', 'SDO', 'EA', 'CF', 'GCC', 'GAE', 'SNA', 'BR'],
    colorScheme: 'purple_gradient',
  },
  {
    id: 'fluidity_timeline',
    type: 'timeline',
    title: '流动变化时间线',
    dataKeys: ['CF'],
    colorScheme: 'purple_mono',
  },
  {
    id: 'expression_gauge',
    type: 'gauge',
    title: '表达真实感仪表盘',
    dataKeys: ['EA'],
    colorScheme: 'purple_mono',
  },
  {
    id: 'belonging_network',
    type: 'network',
    title: '归属网络图',
    dataKeys: ['BR'],
    colorScheme: 'purple_mono',
  },
  {
    id: 'affirmation_timeline',
    type: 'timeline',
    title: '性别肯定时刻时间线',
    dataKeys: ['GAE'],
    colorScheme: 'purple_mono',
  },
  {
    id: 'norm_autonomy_map',
    type: 'map',
    title: '社会规范自主性地图',
    dataKeys: ['SNA'],
    colorScheme: 'purple_mono',
  },
  {
    id: 'pair_heatmap',
    type: 'heatmap',
    title: 'Pair矩阵热力图',
    dataKeys: ['IGS_SDO', 'EA_CF', 'GCC_GAE', 'SNA_BR'],
    colorScheme: 'purple_gradient',
  },
  {
    id: 'contextual_fluidity_radar',
    type: 'radar',
    title: '情境弹性雷达',
    dataKeys: ['CF', 'EA', 'SNA'],
    colorScheme: 'purple_gradient',
  },
  {
    id: 'module_waterfall',
    type: 'waterfall',
    title: '模块瀑布流',
    dataKeys: ['all_modules'],
    colorScheme: 'purple_mono',
  },
];

// 雷达图数据生成
export const generateRadarData = (profile: AssessmentProfile) => {
  const labels = DIMENSION_ORDER.map((d) => GDI_DIMENSIONS[d].name);
  const scores = DIMENSION_ORDER.map((d) => profile.plotScores[d] ?? 0);
  const colors = DIMENSION_ORDER.map((d) => DIMENSION_COLORS[d]);

  return {
    labels,
    datasets: [
      {
        label: '你的分数',
        data: scores,
        backgroundColor: 'rgba(107, 76, 154, 0.2)',
        borderColor: BRAND_COLOR,
        borderWidth: 2,
        pointBackgroundColor: colors,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
      },
    ],
    options: {
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: {
            stepSize: 25,
            backdropColor: 'transparent',
            color: DARK_PURPLE,
          },
          grid: {
            color: MEDIUM_PURPLE,
          },
          angleLines: {
            color: MEDIUM_PURPLE,
          },
          pointLabels: {
            color: DARK_PURPLE,
            font: { size: 12 },
          },
        },
      },
      plugins: {
        legend: { display: false },
      },
    },
  };
};

// 条形图数据生成
export const generateBarData = (profile: AssessmentProfile) => {
  const labels = DIMENSION_ORDER.map((d) => `${GDI_DIMENSIONS[d].name} (${d})`);
  const scores = DIMENSION_ORDER.map((d) => Math.round(profile.plotScores[d] ?? 0));
  const colors = DIMENSION_ORDER.map((d) => DIMENSION_COLORS[d]);

  return {
    labels,
    datasets: [
      {
        label: '维度得分',
        data: scores,
        backgroundColor: colors,
        borderRadius: 4,
        barThickness: 24,
      },
    ],
    options: {
      indexAxis: 'y' as const,
      scales: {
        x: {
          min: 0,
          max: 100,
          grid: { color: LIGHT_PURPLE },
          ticks: { color: DARK_PURPLE },
        },
        y: {
          grid: { display: false },
          ticks: { color: DARK_PURPLE, font: { size: 12 } },
        },
      },
      plugins: {
        legend: { display: false },
      },
    },
  };
};

// Pair热力图数据生成
export const generatePairHeatmapData = (profile: AssessmentProfile) => {
  const dims = DIMENSION_ORDER;
  const matrix: number[][] = [];

  for (let i = 0; i < dims.length; i++) {
    const row: number[] = [];
    for (let j = 0; j < dims.length; j++) {
      if (i === j) {
        row.push(100); // 对角线上的自相关为100
      } else {
        const scoreI = profile.plotScores[dims[i]] ?? 50;
        const scoreJ = profile.plotScores[dims[j]] ?? 50;
        // 差值越小，相关性越高（热力图颜色越深）
        const diff = Math.abs(scoreI - scoreJ);
        const correlation = 100 - diff;
        row.push(correlation);
      }
    }
    matrix.push(row);
  }

  return {
    labels: dims.map((d) => GDI_DIMENSIONS[d].name),
    matrix,
    colorScale: [LIGHT_PURPLE, MEDIUM_PURPLE, BRAND_COLOR, DARK_PURPLE],
  };
};

// 仪表盘数据生成（用于EA等单维）
export const generateGaugeData = (
  profile: AssessmentProfile,
  dimension: DimensionCode
) => {
  const score = profile.plotScores[dimension] ?? 0;
  return {
    value: Math.round(score),
    min: 0,
    max: 100,
    label: GDI_DIMENSIONS[dimension].name,
    color: DIMENSION_COLORS[dimension],
    zones: [
      { min: 0, max: 33, label: '较低', color: '#D4C5E8' },
      { min: 33, max: 66, label: '中等', color: '#957ABE' },
      { min: 66, max: 100, label: '较高', color: '#6B4C9A' },
    ],
  };
};

// 导出颜色方案工具
export const getPurpleGradient = (steps: number): string[] => {
  const colors: string[] = [];
  const startR = 107, startG = 76, startB = 154; // #6B4C9A
  const endR = 184, endG = 165, endB = 224; // #B8A5E0

  for (let i = 0; i < steps; i++) {
    const ratio = i / (steps - 1 || 1);
    const r = Math.round(startR + (endR - startR) * ratio);
    const g = Math.round(startG + (endG - startG) * ratio);
    const b = Math.round(startB + (endB - startB) * ratio);
    colors.push(`rgb(${r}, ${g}, ${b})`);
  }

  return colors;
};
