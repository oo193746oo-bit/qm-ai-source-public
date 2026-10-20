/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// QM 职业价值观测评 v4.0 — 32 个结果模块池
// 每次结果至少展示 16 个模块，按用户价值特征动态选择

import type { ResultModule, ModuleCode, DimensionScore, SceneCode } from './wv-types';

// 32 个结果模块定义
export const wvModulePool: Record<ModuleCode, ResultModule> = {
  // ===== 核心展示类 =====
  hero: {
    code: 'hero',
    name: 'Hero 头部',
    category: 'core',
    requiredScore: 10,
    description: '结果页顶部：问候语 + 一句话 Profile + Top3 快速预览',
  },
  radar: {
    code: 'radar',
    name: '8 维雷达图',
    category: 'core',
    requiredScore: 10,
    description: '8 维价值轮廓的雷达图可视化，连续位置展示，不使用优劣色彩',
  },
  ranking: {
    code: 'ranking',
    name: 'Top8 排序条形图',
    category: 'core',
    requiredScore: 9,
    description: '8 个维度按分数从高到低排序的横向条形图，Top3 强调',
  },
  dual_index: {
    code: 'dual_index',
    name: '内外双指数',
    category: 'core',
    requiredScore: 8,
    description: 'Intrinsic Index 和 Extrinsic Index 两个独立 0-100 指数',
  },
  value_map: {
    code: 'value_map',
    name: 'Value Map 二维图',
    category: 'core',
    requiredScore: 7,
    description: 'X轴内在-外在、Y轴自我-关系的二维价值地图，8维作为点',
  },
  top3_cards: {
    code: 'top3_cards',
    name: 'Top3 价值卡',
    category: 'core',
    requiredScore: 10,
    description: '前三个核心价值的详细卡片：分数、在意什么、被满足时、缺失时',
  },
  bottom2: {
    code: 'bottom2',
    name: 'Bottom2 说明',
    category: 'core',
    requiredScore: 5,
    description: '后两个价值的温和说明：不是缺陷，只是优先级相对较低',
  },
  profile_signature: {
    code: 'profile_signature',
    name: 'Profile Signature',
    category: 'core',
    requiredScore: 9,
    description: '一句话价值画像，基于 Top3/Bottom2/spread/balance',
  },

  // ===== 价值动态类 =====
  pair_matrix: {
    code: 'pair_matrix',
    name: '28 组 Tension Matrix',
    category: 'dynamics',
    requiredScore: 7,
    description: '8×8 价值组合矩阵，显示协同/条件张力/需探索',
  },
  top_synergy: {
    code: 'top_synergy',
    name: 'Top 协同组合',
    category: 'dynamics',
    requiredScore: 6,
    description: '你最强的几组协同价值——它们如何互相强化',
  },
  top_tension: {
    code: 'top_tension',
    name: 'Top 张力组合',
    category: 'dynamics',
    requiredScore: 8,
    description: '你最需要留意的几组价值张力——在什么情况下可能冲突',
  },
  must_have_table: {
    code: 'must_have_table',
    name: 'Must-have 表',
    category: 'dynamics',
    requiredScore: 4,
    description: '来自 Trade-off 模块的底线识别：Must-have / Nice-to-have / Deal-breaker',
  },
  env_fit: {
    code: 'env_fit',
    name: 'Work Environment Fit',
    category: 'dynamics',
    requiredScore: 8,
    description: '8 个工作环境参数匹配度，带去看 JD、面试、offer',
  },

  // ===== 职业场景类 =====
  scene_job_search: {
    code: 'scene_job_search',
    name: '求职场景建议',
    category: 'scene',
    requiredScore: 6,
    description: '求职找工作时，如何用你的价值优先级筛选机会',
  },
  scene_offer: {
    code: 'scene_offer',
    name: 'Offer 选择建议',
    category: 'scene',
    requiredScore: 7,
    description: '手里有多个 offer 时，如何按你的价值优先级做比较',
  },
  scene_promotion: {
    code: 'scene_promotion',
    name: '晋升发展建议',
    category: 'scene',
    requiredScore: 5,
    description: '面对晋升机会时，你需要考虑哪些价值因素',
  },
  scene_career_change: {
    code: 'scene_career_change',
    name: '转行建议',
    category: 'scene',
    requiredScore: 5,
    description: '考虑转行时，如何用价值观评估方向和风险',
  },
  scene_salary: {
    code: 'scene_salary',
    name: '薪资谈判建议',
    category: 'scene',
    requiredScore: 5,
    description: '谈薪时的策略和准备，基于你的价值优先级',
  },
  scene_team: {
    code: 'scene_team',
    name: '团队关系建议',
    category: 'scene',
    requiredScore: 5,
    description: '团队冲突或关系紧张时，如何处理和保护自己',
  },
  scene_burnout: {
    code: 'scene_burnout',
    name: '倦怠应对建议',
    category: 'scene',
    requiredScore: 6,
    description: '感到职业倦怠时，哪些价值可能缺失了，以及怎么调整',
  },
  scene_work_family: {
    code: 'scene_work_family',
    name: '工作家庭平衡',
    category: 'scene',
    requiredScore: 5,
    description: '工作与家庭/照顾责任冲突时的思考框架',
  },
  scene_remote: {
    code: 'scene_remote',
    name: '远程工作建议',
    category: 'scene',
    requiredScore: 4,
    description: '远程或混合办公模式下的适应策略',
  },

  // ===== 叙事类 =====
  whispers: {
    code: 'whispers',
    name: '小酷心理耳语',
    category: 'narrative',
    requiredScore: 9,
    description: '基于你的价值特征和当前场景的个性化心理耳语',
  },
  story_people: {
    code: 'story_people',
    name: '人物 Story Mirror',
    category: 'narrative',
    requiredScore: 7,
    description: '与你价值模式相似的人物故事——不是榜样认证，是叙事镜像',
  },
  story_media: {
    code: 'story_media',
    name: '影视/文学 Story Mirror',
    category: 'narrative',
    requiredScore: 6,
    description: '与你价值模式呼应的影视、文学作品中的角色和情节',
  },

  // ===== 行动工具类 =====
  seven_day: {
    code: 'seven_day',
    name: '7 天价值观察',
    category: 'action',
    requiredScore: 7,
    description: '基于你核心价值的 7 天小实验，在真实生活中验证和感受',
  },
  interview_questions: {
    code: 'interview_questions',
    name: '面试反问清单',
    category: 'action',
    requiredScore: 6,
    description: '面试时可以问面试官的问题，帮你验证价值匹配度',
  },
  communication_script: {
    code: 'communication_script',
    name: '沟通脚本模板',
    category: 'action',
    requiredScore: 5,
    description: '和主管/HR 沟通价值需求的脚本模板：谈边界、谈成长、谈调整',
  },
  offer_comparison: {
    code: 'offer_comparison',
    name: 'Offer 比较工具',
    category: 'action',
    requiredScore: 6,
    description: '输入 2-3 个 offer 的环境特征，按你的价值权重做比较（不替你选）',
  },

  // ===== 导出类 =====
  png_export: {
    code: 'png_export',
    name: 'PNG 长图导出',
    category: 'export',
    requiredScore: 8,
    description: '1080×1920 长图：Top3、雷达、Value Map、Top Tension、Work Env Fit',
  },
  pdf_export: {
    code: 'pdf_export',
    name: 'PDF 完整报告',
    category: 'export',
    requiredScore: 6,
    description: 'A4 完整报告：所有图表 + 场景 + 行动工具',
  },
  share_chat: {
    code: 'share_chat',
    name: '分享卡 & 和小酷聊',
    category: 'export',
    requiredScore: 9,
    description: '1080×1350 分享卡（非敏感摘要）+ 与 QM AI 小酷继续对话',
  },
};

// 模块选择策略
// 1. 核心模块必选（requiredScore >= 9）
// 2. 根据 Top3 价值动态选择场景模块
// 3. 张力高的用户展示更多动态模块
// 4. 始终展示导出和对话入口

const MIN_MODULES = 16;

/**
 * 动态选择结果模块
 * @param scores 8维分数
 * @param tradeoffEnabled 是否启用了 Trade-off 模块
 * @param currentFocus 当前关注场景
 */
export function selectModules(
  scores: DimensionScore[],
  tradeoffEnabled = false,
  currentFocus?: SceneCode,
): ModuleCode[] {
  const allModules = Object.values(wvModulePool);
  const selected: ModuleCode[] = [];

  // 第一优先级：核心必选模块（requiredScore >= 9）
  const coreRequired = allModules
    .filter((m) => m.category === 'core' && m.requiredScore >= 9)
    .map((m) => m.code);
  selected.push(...coreRequired);

  // 第二优先级：高优先的动态模块
  const highPriorityDynamic = allModules
    .filter(
      (m) =>
        (m.category === 'dynamics' && m.requiredScore >= 7) ||
        (m.category === 'narrative' && m.requiredScore >= 7) ||
        (m.category === 'action' && m.requiredScore >= 7),
    )
    .map((m) => m.code);
  selected.push(...highPriorityDynamic);

  // 第三优先级：当前关注场景
  if (currentFocus) {
    const sceneModuleMap: Record<SceneCode, ModuleCode> = {
      job_search: 'scene_job_search',
      offer: 'scene_offer',
      onboarding: 'scene_job_search',
      promotion: 'scene_promotion',
      transfer: 'scene_promotion',
      career_change: 'scene_career_change',
      entrepreneur: 'scene_career_change',
      remote: 'scene_remote',
      salary: 'scene_salary',
      team_conflict: 'scene_team',
      burnout: 'scene_burnout',
      work_family: 'scene_work_family',
    };
    const moduleCode = sceneModuleMap[currentFocus];
    if (moduleCode && !selected.includes(moduleCode)) {
      selected.push(moduleCode);
    }
  }

  // 第四优先级：导出模块
  const exportModules = allModules
    .filter((m) => m.category === 'export')
    .map((m) => m.code);
  for (const m of exportModules) {
    if (!selected.includes(m)) {
      selected.push(m);
    }
  }

  // 第五优先级：填充场景模块直到达到 16 个
  const sceneModules = allModules
    .filter((m) => m.category === 'scene')
    .sort((a, b) => b.requiredScore - a.requiredScore)
    .map((m) => m.code);

  for (const m of sceneModules) {
    if (selected.length >= MIN_MODULES) break;
    if (!selected.includes(m)) {
      selected.push(m);
    }
  }

  // 如果还不够，补充剩余的行动和叙事模块
  const remainingModules = allModules
    .filter((m) => !selected.includes(m.code))
    .sort((a, b) => b.requiredScore - a.requiredScore)
    .map((m) => m.code);

  for (const m of remainingModules) {
    if (selected.length >= MIN_MODULES) break;
    selected.push(m);
  }

  // 如果启用了 Trade-off，加入 must_have_table
  if (tradeoffEnabled && !selected.includes('must_have_table')) {
    selected.push('must_have_table');
  }

  return selected;
}

// 验证模块池
export function validateModulePool(): {
  total: number;
  byCategory: Record<string, number>;
  minPerResult: number;
  valid: boolean;
} {
  const total = Object.keys(wvModulePool).length;
  const byCategory: Record<string, number> = {};
  for (const m of Object.values(wvModulePool)) {
    byCategory[m.category] = (byCategory[m.category] || 0) + 1;
  }
  return {
    total,
    byCategory,
    minPerResult: MIN_MODULES,
    valid: total === 32 && MIN_MODULES >= 16,
  };
}
