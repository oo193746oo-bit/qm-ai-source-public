// QM 阿德勒指数 v4.0 — 36 个结果模块池
// 每次结果 ≥ 20 个模块
// 分类：core / dynamics / lens / scene / narrative / action / export

import type { ResultModule, ModuleCode } from './adler-types';

export const MODULE_COUNT = 36;
export const MODULES_PER_RESULT_MIN = 20;

export const adlerModulePool: ResultModule[] = [
  // ===== core 核心模块（必选） =====
  {
    code: 'hero_headline',
    name: 'Headline 与一句话 Profile',
    category: 'core',
    priority: 10,
    description: '生活风格 Headline（只作标题）+ 四句话 Profile Signature',
  },
  {
    code: 'four_d_compass',
    name: '4D Compass 四维罗盘',
    category: 'core',
    priority: 10,
    description: '连续位置展示四维，取消冠军金色和优劣暗示',
  },
  {
    code: 'adlerian_profile_table',
    name: '阿德勒画像表',
    category: 'core',
    priority: 9,
    description: '维度｜本次位置｜当前显现｜可能资源｜可能代价｜常见场景｜一个观察',
  },
  {
    code: 'belonging_agency_map',
    name: '归属 × 行动 二维图',
    category: 'core',
    priority: 8,
    description: 'X 社会兴趣、Y 勇气；点位+情境，不固定人格象限',
  },
  {
    code: 'acceptance_purpose_map',
    name: '接纳 × 方向 二维图',
    category: 'core',
    priority: 8,
    description: '观察"允许现在"与"朝向未来"的关系',
  },

  // ===== dynamics 动态关系模块 =====
  {
    code: 'six_pair_matrix',
    name: '6 组 Pair 关系矩阵',
    category: 'dynamics',
    priority: 9,
    description: '完整 6 组两两关系概览',
  },
  {
    code: 'top_three_pairs',
    name: '最相关 3 组 Pair 详解',
    category: 'dynamics',
    priority: 9,
    description: '展开最相关 3 组 Pair 的分类、资源、张力、鼓励',
  },
  {
    code: 'life_tasks_map',
    name: '生活任务地图',
    category: 'dynamics',
    priority: 8,
    description: 'Friendship / Work / Love + Self / Community',
  },
  {
    code: 'encouragement_map',
    name: '鼓励资源地图',
    category: 'dynamics',
    priority: 7,
    description: 'Belonging / Courage / Self-Compassion / Purpose / Contribution',
  },
  {
    code: 'context_heatmap',
    name: '16 场景 × 4 维 热力图',
    category: 'dynamics',
    priority: 7,
    description: '不同情境下四维的活跃程度',
  },

  // ===== lens 阿德勒 Lens 模块 =====
  {
    code: 'seven_lenses_overview',
    name: '7 个阿德勒 Lens 概览',
    category: 'lens',
    priority: 8,
    description: 'Belonging / Contribution / Encouragement / Life Tasks / Goal Orientation / Private Logic / Safeguarding',
  },
  {
    code: 'private_logic_reflection',
    name: '私人逻辑反思表',
    category: 'lens',
    priority: 8,
    description: '情境｜我的解释｜担心｜想保护什么｜另一种解释',
  },
  {
    code: 'goal_orientation_hypothesis',
    name: '目标取向假设',
    category: 'lens',
    priority: 7,
    description: '探索行为背后可能的目标（假设性，至少2种替代解释）',
  },
  {
    code: 'safeguarding_awareness',
    name: '自我保护倾向觉察',
    category: 'lens',
    priority: 7,
    description: '了解你常用的自我保护策略及其代价',
  },

  // ===== scene 场景模块 =====
  {
    code: 'current_scene_1',
    name: '当前相关场景 1（详解）',
    category: 'scene',
    priority: 9,
    description: '最相关场景的深度解读与行动建议',
  },
  {
    code: 'current_scene_2',
    name: '当前相关场景 2（详解）',
    category: 'scene',
    priority: 8,
    description: '第二相关场景的深度解读',
  },
  {
    code: 'current_scene_3',
    name: '当前相关场景 3（简述）',
    category: 'scene',
    priority: 7,
    description: '第三相关场景的简要解读',
  },
  {
    code: 'scene_friendship',
    name: '友谊场景',
    category: 'scene',
    priority: 5,
    description: '友谊中的阿德勒视角解读',
  },
  {
    code: 'scene_intimacy',
    name: '亲密关系场景',
    category: 'scene',
    priority: 5,
    description: '亲密关系中的阿德勒视角解读',
  },
  {
    code: 'scene_family',
    name: '家庭场景',
    category: 'scene',
    priority: 5,
    description: '家庭中的阿德勒视角解读',
  },
  {
    code: 'scene_work',
    name: '工作场景',
    category: 'scene',
    priority: 5,
    description: '工作中的阿德勒视角解读',
  },
  {
    code: 'scene_conflict',
    name: '冲突场景',
    category: 'scene',
    priority: 6,
    description: '冲突中的阿德勒视角解读',
  },
  {
    code: 'scene_boundary',
    name: '边界场景',
    category: 'scene',
    priority: 6,
    description: '边界议题的阿德勒视角解读',
  },
  {
    code: 'scene_rejection',
    name: '被拒绝场景',
    category: 'scene',
    priority: 6,
    description: '被拒绝时的阿德勒视角解读',
  },
  {
    code: 'scene_identity',
    name: '身份与归属场景',
    category: 'scene',
    priority: 6,
    description: '身份议题的阿德勒视角解读',
  },
  {
    code: 'scene_meaning',
    name: '意义与方向场景',
    category: 'scene',
    priority: 6,
    description: '意义感的阿德勒视角解读',
  },

  // ===== narrative 叙事模块 =====
  {
    code: 'whispers_featured',
    name: '小酷耳语精选',
    category: 'narrative',
    priority: 9,
    description: '精选 5-8 条与本次结果最相关的耳语',
  },
  {
    code: 'story_mirror_people',
    name: 'Story Mirror 人物',
    category: 'narrative',
    priority: 9,
    description: '3 位相关人物的故事镜像（不是生活风格认证）',
  },
  {
    code: 'story_mirror_media',
    name: 'Story Mirror 影视/文学',
    category: 'narrative',
    priority: 8,
    description: '2-3 部相关影视/文学作品的故事镜像',
  },

  // ===== action 行动模块 =====
  {
    code: 'courage_micro_step',
    name: '24 小时勇气微行动',
    category: 'action',
    priority: 9,
    description: '难度自选的 24 小时可执行小步',
  },
  {
    code: 'purpose_alignment_table',
    name: '意义对齐表',
    category: 'action',
    priority: 7,
    description: '现在做什么｜为什么｜对谁有意义｜长期方向｜下一小步',
  },
  {
    code: 'seven_day_board',
    name: '7 天阿德勒练习板',
    category: 'action',
    priority: 8,
    description: '生活任务｜归属｜行动一步｜接纳｜方向｜一句观察',
  },
  {
    code: 'action_tools',
    name: '行动工具库',
    category: 'action',
    priority: 8,
    description: 'Belonging Check / Contribution Experiment / Private Logic Reframe / Life Task Conversation / Boundary Script / Goal Alignment',
  },

  // ===== export 导出模块 =====
  {
    code: 'retest_delta',
    name: '复测变化视图',
    category: 'export',
    priority: 6,
    description: '4 维变化 + 情境注释，不写变好/变坏',
  },
  {
    code: 'share_card',
    name: '分享卡',
    category: 'export',
    priority: 8,
    description: '4D Compass + Headline + 小酷一句 + 微行动；隐藏最低维度',
  },
  {
    code: 'pdf_dashboard',
    name: 'A4 PDF 仪表盘',
    category: 'export',
    priority: 7,
    description: 'Compass → Table → Pairs → Life Tasks → Context → Whisper → Story Mirror → 行动工具',
  },
];

// 模块选择算法
// 根据 Profile、Pair 模式、场景、响应质量选择 ≥20 个模块
export function selectResultModules(
  scores: Record<string, number>,
  pairPatterns: { pair: string; category: string; confidence: number }[],
  currentScene: string,
  responseQuality: { valid: boolean; flags: string[] },
  minModules = 20,
): ModuleCode[] {
  const modules: ModuleCode[] = [];

  // 必选核心模块（priority ≥ 9）
  const coreModules = adlerModulePool
    .filter((m) => m.category === 'core' && m.priority >= 8)
    .map((m) => m.code);
  modules.push(...coreModules);

  // 必选 dynamics 核心
  modules.push('six_pair_matrix', 'top_three_pairs', 'life_tasks_map');

  // 必选 Lens 概览
  modules.push('seven_lenses_overview');

  // 必选叙事
  modules.push('whispers_featured', 'story_mirror_people');

  // 必选行动
  modules.push('courage_micro_step', 'seven_day_board');

  // 必选导出
  modules.push('share_card', 'pdf_dashboard');

  // 当前场景（至少 3 个）
  modules.push('current_scene_1', 'current_scene_2', 'current_scene_3');

  // 根据得分和场景动态添加更多
  const sceneMap: Record<string, ModuleCode> = {
    friendship: 'scene_friendship',
    intimacy: 'scene_intimacy',
    family: 'scene_family',
    work: 'scene_work',
    conflict: 'scene_conflict',
    boundary: 'scene_boundary',
    rejection: 'scene_rejection',
    identity_belonging: 'scene_identity',
    meaning_direction: 'scene_meaning',
  };
  if (sceneMap[currentScene]) {
    modules.push(sceneMap[currentScene]);
  }

  // 根据最低分维度添加相关 lens
  const sorted = Object.entries(scores).sort((a, b) => a[1] - b[1]);
  const lowestDim = sorted[0]?.[0];

  if (lowestDim === 'C') {
    modules.push('safeguarding_awareness');
  }
  if (lowestDim === 'B') {
    modules.push('private_logic_reflection');
  }
  if (lowestDim === 'D') {
    modules.push('encouragement_map');
  }
  if (lowestDim === 'A') {
    modules.push('goal_orientation_hypothesis');
  }

  // 意义对齐表
  modules.push('purpose_alignment_table');

  // 影视 Story Mirror
  modules.push('story_mirror_media');

  // 行动工具库
  modules.push('action_tools');

  // 热力图
  modules.push('context_heatmap');

  // 复测视图（如果有历史数据才展示，但模块池中保留）
  if (modules.length < minModules) {
    modules.push('retest_delta');
  }

  // 去重
  const unique = Array.from(new Set(modules));

  // 如果还不够，补场景模块
  const sceneModules = adlerModulePool
    .filter((m) => m.category === 'scene')
    .map((m) => m.code);
  for (const sm of sceneModules) {
    if (unique.length >= minModules) break;
    if (!unique.includes(sm)) unique.push(sm);
  }

  return unique.slice(0, Math.max(minModules, 24));
}

export function getModule(code: ModuleCode): ResultModule | undefined {
  return adlerModulePool.find((m) => m.code === code);
}
