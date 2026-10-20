/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// QM-GDI-48 v4.1 模块池
// 共28个模块定义，每次结果根据8维分数动态选≥16个模块展示
// 模块选择逻辑：必选模块 + 条件触发模块 + 分数相关模块

import { ModuleDefinition, AssessmentProfile, DimensionCode } from './gdi-types';

// 必选模块（始终展示）
const CORE_MODULES: ModuleDefinition[] = [
  {
    id: 'headline',
    title: '你的性别多元画像',
    description: '总览Headline：非诊断、非身份判定的结果概述',
    priority: 1,
  },
  {
    id: 'radar_chart',
    title: '八维雷达图',
    description: '8维分数雷达图可视化',
    priority: 2,
  },
  {
    id: 'dimension_details',
    title: '逐维解读',
    description: '8个维度的详细解读，高低都非优劣',
    priority: 3,
  },
  {
    id: 'ku_whispers',
    title: '小酷耳语',
    description: '基于你的画像精选的温柔提示',
    priority: 4,
  },
  {
    id: 'exploration_actions',
    title: '探索实验',
    description: '个人化的行动建议与探索方向',
    priority: 5,
  },
  {
    id: 'result_disclaimer',
    title: '结果说明',
    description: '心理测量学验证状态声明与使用说明',
    priority: 6,
  },
  {
    id: 'export_png',
    title: '导出图片',
    description: '将结果导出为PNG图片',
    priority: 7,
  },
  {
    id: 'export_pdf',
    title: '导出PDF',
    description: '将结果导出为PDF报告',
    priority: 8,
  },
  {
    id: 'share_card',
    title: '分享卡片',
    description: '生成可分享的结果卡片',
    priority: 9,
  },
  {
    id: 'chat_with_ku',
    title: '和小酷聊',
    description: '与小酷AI继续对话探索',
    priority: 10,
  },
];

// 叙事类模块（根据分数选择展示）
const NARRATIVE_MODULES: ModuleDefinition[] = [
  {
    id: 'pair_narratives',
    title: '维度之间',
    description: '28组Pair组合中的Top组合叙事',
    priority: 11,
  },
  {
    id: 'story_mirror_people',
    title: 'Story Mirror · 人物',
    description: '3位行为镜像人物（不做身份推断）',
    priority: 12,
  },
  {
    id: 'story_mirror_media',
    title: 'Story Mirror · 影视文学',
    description: '3部行为镜像影视/文学作品',
    priority: 13,
  },
  {
    id: 'open_question',
    title: '给你的一个问题',
    description: '一个帮助你继续探索的开放问题（每次最多1个）',
    priority: 14,
  },
];

// 维度特定模块
const DIMENSION_MODULES: ModuleDefinition[] = [
  {
    id: 'contextual_fluidity_map',
    title: '情境弹性地图',
    description: 'CF维度：性别流动与情境变化的可视化分析',
    requiredDimensions: ['CF'],
    priority: 20,
  },
  {
    id: 'expression_authenticity_analysis',
    title: '性别表达真实感分析',
    description: 'EA维度：表达与自我感受的贴合度深度分析',
    requiredDimensions: ['EA'],
    priority: 21,
  },
  {
    id: 'gender_euphoria_moments',
    title: '性别肯定瞬间',
    description: 'GAE维度：你的euphoria时刻与积极体验探索',
    requiredDimensions: ['GAE'],
    priority: 22,
  },
  {
    id: 'social_norm_autonomy',
    title: '社会规范自主度',
    description: 'SNA维度：你与社会性别的规范之间的关系',
    requiredDimensions: ['SNA'],
    priority: 23,
  },
  {
    id: 'belonging_recognition',
    title: '归属感与被看见',
    description: 'BR维度：你的关系支持系统与归属感分析',
    requiredDimensions: ['BR'],
    priority: 24,
  },
  {
    id: 'safety_environment',
    title: '安全环境提示',
    description: 'EA/GCC/BR低时必须考虑环境、安全、关系',
    priority: 25,
    conditionalShow: (profile: AssessmentProfile) => {
      const ea = profile.plotScores.EA;
      const gcc = profile.plotScores.GCC;
      const br = profile.plotScores.BR;
      const lowCount = [ea, gcc, br].filter(
        (s) => s !== null && s < 33
      ).length;
      return lowCount >= 1;
    },
  },
];

// 可视化类模块
const VISUALIZATION_MODULES: ModuleDefinition[] = [
  {
    id: 'dimension_bar_chart',
    title: '维度条形图',
    description: '8维度分数条形图对比',
    priority: 30,
  },
  {
    id: 'fluidity_timeline',
    title: '流动变化时间线',
    description: 'CF维度可视化：性别体验随时间/情境的变化',
    requiredDimensions: ['CF'],
    priority: 31,
  },
  {
    id: 'expression_gauge',
    title: '表达真实感仪表盘',
    description: 'EA维度可视化：表达真实程度仪表盘',
    requiredDimensions: ['EA'],
    priority: 32,
  },
  {
    id: 'belonging_network',
    title: '归属网络图',
    description: 'BR维度可视化：关系与社群支持网络',
    requiredDimensions: ['BR'],
    priority: 33,
  },
  {
    id: 'affirmation_timeline',
    title: '性别肯定时刻时间线',
    description: 'GAE维度可视化：积极体验时刻分布',
    requiredDimensions: ['GAE'],
    priority: 34,
  },
  {
    id: 'norm_autonomy_map',
    title: '社会规范自主性地图',
    description: 'SNA维度可视化：规范觉察与自主选择程度',
    requiredDimensions: ['SNA'],
    priority: 35,
  },
  {
    id: 'pair_heatmap',
    title: 'Pair矩阵热力图',
    description: '28组维度组合热力图',
    priority: 36,
  },
  {
    id: 'module_waterfall',
    title: '模块瀑布流',
    description: '所有适用模块的瀑布流总览',
    priority: 37,
  },
];

export const GDI_MODULE_POOL: ModuleDefinition[] = [
  ...CORE_MODULES,
  ...NARRATIVE_MODULES,
  ...DIMENSION_MODULES,
  ...VISUALIZATION_MODULES,
];

// 根据画像选择要展示的模块（≥16个）
export const selectModulesForProfile = (
  profile: AssessmentProfile
): ModuleDefinition[] => {
  const selected: ModuleDefinition[] = [];

  // 加入所有核心模块
  selected.push(...CORE_MODULES);

  // 加入叙事类模块
  selected.push(...NARRATIVE_MODULES);

  // 加入条件触发的维度模块
  for (const mod of DIMENSION_MODULES) {
    if (mod.conditionalShow) {
      if (mod.conditionalShow(profile)) {
        selected.push(mod);
      }
      continue;
    }
    if (mod.requiredDimensions) {
      const allValid = mod.requiredDimensions.every(
        (d) => !profile.scores[d as DimensionCode]?.incomplete
      );
      if (allValid) {
        selected.push(mod);
      }
    }
  }

  // 加入可视化模块（至少加3个）
  const vizCandidates = [...VISUALIZATION_MODULES];
  // 打乱顺序以增加多样性
  for (let i = vizCandidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [vizCandidates[i], vizCandidates[j]] = [vizCandidates[j], vizCandidates[i]];
  }

  // 确保选中的模块总数 ≥ 16
  let vizAdded = 0;
  for (const mod of vizCandidates) {
    if (selected.length >= 16 && vizAdded >= 3) break;
    if (mod.requiredDimensions) {
      const allValid = mod.requiredDimensions.every(
        (d) => !profile.scores[d as DimensionCode]?.incomplete
      );
      if (!allValid) continue;
    }
    if (!selected.find((m) => m.id === mod.id)) {
      selected.push(mod);
      vizAdded++;
    }
  }

  // 如果还不够16个，补充更多可视化模块
  if (selected.length < 16) {
    for (const mod of VISUALIZATION_MODULES) {
      if (selected.length >= 16) break;
      if (!selected.find((m) => m.id === mod.id)) {
        if (mod.requiredDimensions) {
          const allValid = mod.requiredDimensions.every(
            (d) => !profile.scores[d as DimensionCode]?.incomplete
          );
          if (!allValid) continue;
        }
        selected.push(mod);
      }
    }
  }

  // 按priority排序
  selected.sort((a, b) => a.priority - b.priority);

  return selected;
};

// 获取模块总数
export const getTotalModuleCount = (): number => GDI_MODULE_POOL.length;
