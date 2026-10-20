/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// QM AI 多元智能测评 v4.0 — 34 模块池
// 每次根据分数和配置选择 ≥ 18 个模块展示
// required 模块必选，其余按维度支持度和相关性筛选

import type { ModuleId, ModuleDefinition, DimensionScore, DimensionCode } from './mi-types';

export const modulePool: ModuleDefinition[] = [
  // ===== Screen 1 - 核心概览 =====
  {
    id: 'hero',
    name: '个人概览头图',
    description: '展示头像、一句话 headline 和核心标签，是结果页的第一印象。',
    screen: 1,
    required: true,
    minDimensionalSupport: 0,
    category: 'core',
  },
  {
    id: 'profile_signature',
    name: '个人签名档',
    description: '展示 Top3 / Bottom2 / 均衡度 / 表达方向透镜等核心画像指标。',
    screen: 1,
    required: true,
    minDimensionalSupport: 0,
    category: 'core',
  },
  {
    id: 'radar',
    name: '雷达图',
    description: '八维雷达图可视化，直观展示各维度当前显现程度分布。',
    screen: 1,
    required: true,
    minDimensionalSupport: 0,
    category: 'visual',
  },
  {
    id: 'profile_table',
    name: '维度明细表',
    description: '八维分数、显现程度、一句话描述的表格形式，适合精确查看。',
    screen: 1,
    required: false,
    minDimensionalSupport: 0,
    category: 'core',
  },

  // ===== Screen 2 - Top3 & Bottom2 =====
  {
    id: 'top3_triangle',
    name: 'Top3 三角关系图',
    description: '可视化展示前三名智能之间的协同与张力关系。',
    screen: 2,
    required: true,
    minDimensionalSupport: 3,
    category: 'visual',
  },
  {
    id: 'top3_synergy_explanation',
    name: 'Top3 协同解读',
    description: '详细解读前三名智能的组合方式、协同效应和常见表现。',
    screen: 2,
    required: true,
    minDimensionalSupport: 3,
    category: 'narrative',
  },
  {
    id: 'bottom2',
    name: '较少显现维度',
    description: '温和呈现本次调用较少的维度，强调"不多用"不等于"做不到"。',
    screen: 2,
    required: false,
    minDimensionalSupport: 2,
    category: 'narrative',
  },

  // ===== Screen 3 - Pair Matrix =====
  {
    id: 'pair_matrix',
    name: '28 组组合矩阵总览',
    description: '以矩阵形式展示全部 28 组维度组合的关系类型与强度。',
    screen: 3,
    required: false,
    minDimensionalSupport: 2,
    category: 'visual',
  },
  {
    id: 'top_synergy',
    name: '高协同组合',
    description: '重点展示得分最高、协同效应最强的几组维度组合。',
    screen: 3,
    required: true,
    minDimensionalSupport: 2,
    category: 'narrative',
  },
  {
    id: 'complement',
    name: '互补组合',
    description: '展示可以互相补位、一强一弱搭配的维度组合。',
    screen: 3,
    required: false,
    minDimensionalSupport: 2,
    category: 'narrative',
  },
  {
    id: 'context_switch',
    name: '场景切换组合',
    description: '展示需要在不同场景间切换调用、存在切换成本的维度组合。',
    screen: 3,
    required: false,
    minDimensionalSupport: 2,
    category: 'narrative',
  },
  {
    id: 'possible_friction',
    name: '潜在摩擦组合',
    description: '温和呈现可能产生内部摩擦的维度组合，附带搭桥建议。',
    screen: 3,
    required: false,
    minDimensionalSupport: 2,
    category: 'narrative',
  },

  // ===== Screen 4 - 场景与学习 =====
  {
    id: 'context_heatmap',
    name: '14 场景适配热力图',
    description: '以热力图形式展示 14 类生活场景的适配程度分布。',
    screen: 4,
    required: false,
    minDimensionalSupport: 1,
    category: 'visual',
  },
  {
    id: 'selected_scenes',
    name: '高适配场景详解',
    description: '详细解读适配度最高的 3-5 个场景，含顺畅点、摩擦点和搭桥建议。',
    screen: 4,
    required: true,
    minDimensionalSupport: 1,
    category: 'narrative',
  },
  {
    id: 'learning_mode_map',
    name: '学习模式地图',
    description: '8 种学习模式的适配程度和建议，帮你找到更适合自己的学习方式。',
    screen: 4,
    required: true,
    minDimensionalSupport: 1,
    category: 'action',
  },
  {
    id: 'expression_map',
    name: '表达通道地图',
    description: '7 种表达通道的使用频率和示例，帮你发现自己偏好的表达方式。',
    screen: 4,
    required: false,
    minDimensionalSupport: 1,
    category: 'action',
  },
  {
    id: 'environment_fit',
    name: '环境适配滑块',
    description: '5 个维度的环境偏好滑块，帮你了解什么样的工作/学习环境更适合你。',
    screen: 4,
    required: false,
    minDimensionalSupport: 1,
    category: 'action',
  },
  {
    id: 'energy_friction',
    name: '能量/摩擦力分析',
    description: '分析不同场景下的能量来源和摩擦点，提供搭桥策略。',
    screen: 4,
    required: false,
    minDimensionalSupport: 1,
    category: 'narrative',
  },

  // ===== Screen 5 - 行动工具与扩展 =====
  {
    id: 'whispers',
    name: '温柔耳语',
    description: '根据你的画像生成 12 条以上温柔、好奇、非评判的耳语卡片。',
    screen: 5,
    required: true,
    minDimensionalSupport: 1,
    category: 'narrative',
  },
  {
    id: 'story_mirror_people',
    name: '人物故事镜',
    description: '3 位与你智能画像有呼应的人物故事，以镜映方式呈现而非对标。',
    screen: 5,
    required: true,
    minDimensionalSupport: 2,
    category: 'narrative',
  },
  {
    id: 'story_mirror_media',
    name: '影视故事镜',
    description: '3 部与你智能画像有呼应的影视/文学作品，以镜映方式呈现。',
    screen: 5,
    required: false,
    minDimensionalSupport: 2,
    category: 'narrative',
  },
  {
    id: 'why_you_reasoning',
    name: '为什么是你',
    description: '解释为什么选中这些人物/影视，它们和你的画像有什么呼应。',
    screen: 5,
    required: false,
    minDimensionalSupport: 2,
    category: 'narrative',
  },
  {
    id: 'weekly_experiment',
    name: '七日实验计划',
    description: '一周七天的小型自我实验，每天一件小事，探索自己的智能使用方式。',
    screen: 5,
    required: true,
    minDimensionalSupport: 1,
    category: 'action',
  },
  {
    id: 'learning_recipe',
    name: '学习食谱',
    description: '为你推荐 5-8 个定制化的学习方法食谱，按步骤即可实践。',
    screen: 5,
    required: false,
    minDimensionalSupport: 1,
    category: 'action',
  },
  {
    id: 'project_role_card',
    name: '团队角色卡',
    description: '6 张项目团队角色卡，帮你发现自己在团队中可能的贡献位置。',
    screen: 5,
    required: false,
    minDimensionalSupport: 1,
    category: 'action',
  },
  {
    id: 'communication_translation',
    name: '沟通翻译器',
    description: '8 组不同智能风格之间的沟通翻译建议，帮你和不同频道的人更好相处。',
    screen: 5,
    required: false,
    minDimensionalSupport: 2,
    category: 'action',
  },
  {
    id: 'skill_practice_menu',
    name: '技能练习菜单',
    description: '8 维 × 3 等级的技能练习清单，可以按自己的节奏选择练习。',
    screen: 5,
    required: false,
    minDimensionalSupport: 1,
    category: 'action',
  },

  // ===== 辅助模块 =====
  {
    id: 'result_confidence_note',
    name: '结果置信说明',
    description: '说明题量、常模状态、回答质量等信息，帮助用户正确理解结果。',
    screen: 1,
    required: true,
    minDimensionalSupport: 0,
    category: 'core',
  },
  {
    id: 'retest_change',
    name: '复测变化对比',
    description: '如果有历史记录，展示本次与上次的分数变化。',
    screen: 1,
    required: false,
    minDimensionalSupport: 0,
    category: 'core',
  },
  {
    id: 'png_export',
    name: 'PNG 长图导出',
    description: '将结果页导出为 PNG 长图，便于保存和分享。',
    screen: 5,
    required: true,
    minDimensionalSupport: 0,
    category: 'export',
  },
  {
    id: 'pdf_export',
    name: 'PDF 报告导出',
    description: '将完整结果导出为 PDF 报告，适合存档和打印。',
    screen: 5,
    required: false,
    minDimensionalSupport: 0,
    category: 'export',
  },
  {
    id: 'share_card',
    name: '分享卡片',
    description: '生成可分享的精美卡片，保护隐私的同时展示个人特色。',
    screen: 5,
    required: false,
    minDimensionalSupport: 0,
    category: 'export',
  },
  {
    id: 'chat_with_ku',
    name: '和小酷聊聊',
    description: '入口按钮，引导用户和 AI 小酷继续对话、探索更多。',
    screen: 5,
    required: true,
    minDimensionalSupport: 0,
    category: 'export',
  },
  {
    id: 'retest',
    name: '重新测评',
    description: '复测入口，鼓励用户在不同状态下复测，观察自己的变化。',
    screen: 5,
    required: true,
    minDimensionalSupport: 0,
    category: 'export',
  },
];

// 模块筛选选项
export interface SelectModulesOptions {
  minCount?: number;       // 最少模块数，默认 18
  maxCount?: number;       // 最多模块数，默认 28
  includeAllRequired?: boolean; // 是否包含所有 required 模块，默认 true
  preferCategories?: ModuleDefinition['category'][]; // 偏好的类别
}

// 计算每个模块的维度支持度
function calculateModuleSupport(
  module_: ModuleDefinition,
  scores: DimensionScore[],
): number {
  const scoreMap = new Map<DimensionCode, number>();
  for (const s of scores) scoreMap.set(s.dimension, s.score);

  // 核心和导出类模块不受维度支持度影响，给满分
  if (module_.category === 'core' || module_.category === 'export') {
    return 100;
  }

  // 视觉类：基于最高分维度
  if (module_.category === 'visual') {
    const sorted = [...scores].sort((a, b) => b.score - a.score);
    return sorted[0]?.score ?? 50;
  }

  // 叙事类：基于 Top3 平均分
  if (module_.category === 'narrative') {
    const sorted = [...scores].sort((a, b) => b.score - a.score);
    const top3 = sorted.slice(0, 3);
    const avg = top3.reduce((s, x) => s + x.score, 0) / top3.length;
    return avg;
  }

  // 行动类：基于所有维度的整体活跃度
  if (module_.category === 'action') {
    const avg = scores.reduce((s, x) => s + x.score, 0) / scores.length;
    return avg;
  }

  return 50;
}

// 根据分数选择模块
export function selectModules(
  scores: DimensionScore[],
  opts: SelectModulesOptions = {},
): ModuleId[] {
  const {
    minCount = 18,
    maxCount = 28,
    includeAllRequired = true,
  } = opts;

  // 先收集 required 模块
  const required = modulePool.filter((m) => m.required);
  const optional = modulePool.filter((m) => !m.required);

  // 计算每个可选模块的支持度
  const scored = optional.map((m) => ({
    module: m,
    support: calculateModuleSupport(m, scores),
  }));

  // 按支持度排序
  scored.sort((a, b) => b.support - a.support);

  const selected: ModuleDefinition[] = includeAllRequired ? [...required] : [];

  // 添加可选模块，直到达到 minCount 或 maxCount
  for (const item of scored) {
    if (selected.length >= maxCount) break;
    // 检查是否达到最小维度支持要求
    const highDims = scores.filter((s) => s.score >= 50).length;
    if (highDims < item.module.minDimensionalSupport) continue;
    selected.push(item.module);
    if (selected.length >= minCount && selected.length >= required.length + 6) {
      // 已经超过 required + 6 个可选，可以停止
      if (selected.length >= minCount + 4) break;
    }
  }

  // 如果还不够 minCount，继续加
  if (selected.length < minCount) {
    for (const item of scored) {
      if (selected.find((m) => m.id === item.module.id)) continue;
      selected.push(item.module);
      if (selected.length >= minCount) break;
    }
  }

  return selected.map((m) => m.id);
}

// 获取模块定义
export function getModuleDefinition(id: ModuleId): ModuleDefinition | undefined {
  return modulePool.find((m) => m.id === id);
}

// 验证：34 个模块
export function validateModuleCount(): { count: number; valid: boolean } {
  const count = modulePool.length;
  return { count, valid: count === 34 };
}

// 按屏幕分组
export function getModulesByScreen(screen: number): ModuleDefinition[] {
  return modulePool.filter((m) => m.screen === screen);
}

// 按类别分组
export function getModulesByCategory(
  category: ModuleDefinition['category'],
): ModuleDefinition[] {
  return modulePool.filter((m) => m.category === category);
}
