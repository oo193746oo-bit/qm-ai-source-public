// QM Big Five 60 | 大五人格特质测评 v3.0 — 30个结果模块池
// 每次结果至少动态选择14个模块
import type { BFModuleDef, BFModuleId, BFProfileSignature } from './bf-types';

export const BF_MODULE_POOL: BFModuleDef[] = [
  // ===== 核心模块 =====
  {
    id: 'hero',
    name: 'Hero 首屏',
    category: 'core',
    weight: 100,
    min_selection_reason: '必选：结果页入口',
  },
  {
    id: 'radar',
    name: '五维雷达图',
    category: 'core',
    weight: 100,
    min_selection_reason: '必选：五维概览',
  },
  {
    id: 'continuous_position',
    name: '连续位置说明',
    category: 'core',
    weight: 100,
    min_selection_reason: '必选：解释连续特质模型',
  },
  {
    id: 'profile_signature',
    name: 'Profile Signature',
    category: 'core',
    weight: 100,
    min_selection_reason: '必选：整体画像签名',
  },

  // ===== 画像关系模块 =====
  {
    id: 'highest_two_cooperation',
    name: '最高两维如何合作',
    category: 'narrative',
    weight: 90,
  },
  {
    id: 'lowest_two',
    name: '最低两维的意义',
    category: 'narrative',
    weight: 75,
  },
  {
    id: 'max_tension',
    name: '最大张力维度对',
    category: 'narrative',
    weight: 80,
  },
  {
    id: 'balance_dimension',
    name: '平衡维度解读',
    category: 'narrative',
    weight: 60,
  },

  // ===== 现实场景模块 =====
  {
    id: 'work',
    name: '工作场景',
    category: 'scene',
    weight: 85,
  },
  {
    id: 'learning',
    name: '学习场景',
    category: 'scene',
    weight: 70,
  },
  {
    id: 'intimacy',
    name: '亲密关系',
    category: 'scene',
    weight: 85,
  },
  {
    id: 'friendship',
    name: '友谊模式',
    category: 'scene',
    weight: 65,
  },
  {
    id: 'conflict',
    name: '冲突中的反应',
    category: 'scene',
    weight: 70,
  },
  {
    id: 'boundaries',
    name: '边界感',
    category: 'scene',
    weight: 75,
  },
  {
    id: 'decision_making',
    name: '决策风格',
    category: 'scene',
    weight: 70,
  },
  {
    id: 'procrastination',
    name: '计划与拖延',
    category: 'scene',
    weight: 75,
  },
  {
    id: 'creativity',
    name: '创造力表达方式',
    category: 'scene',
    weight: 65,
  },
  {
    id: 'stress',
    name: '压力反应',
    category: 'scene',
    weight: 80,
  },
  {
    id: 'recovery',
    name: '恢复方式',
    category: 'scene',
    weight: 75,
  },
  {
    id: 'misunderstood',
    name: '容易被误解的点',
    category: 'scene',
    weight: 70,
  },
  {
    id: 'admired_people',
    name: '你容易欣赏的人',
    category: 'scene',
    weight: 60,
  },
  {
    id: 'uncomfortable_env',
    name: '不舒服的环境',
    category: 'scene',
    weight: 65,
  },

  // ===== 叙事模块 =====
  {
    id: 'whisper',
    name: '小酷心理耳语',
    category: 'narrative',
    weight: 100,
    min_selection_reason: '必选：核心体验模块',
  },
  {
    id: 'story_mirror_people',
    name: '人物 Story Mirror',
    category: 'narrative',
    weight: 85,
  },
  {
    id: 'story_mirror_media',
    name: '影视镜像',
    category: 'narrative',
    weight: 80,
  },
  {
    id: 'seven_day_experiment',
    name: '7天观察实验',
    category: 'narrative',
    weight: 75,
  },
  {
    id: 'chat_with_xiaoku',
    name: '和小酷聊',
    category: 'action',
    weight: 90,
  },

  // ===== 导出模块 =====
  {
    id: 'save_image',
    name: '保存图片',
    category: 'export',
    weight: 100,
    min_selection_reason: '必选：基础功能',
  },
  {
    id: 'pdf_export',
    name: '导出 PDF',
    category: 'export',
    weight: 90,
  },
  {
    id: 'share',
    name: '分享',
    category: 'export',
    weight: 85,
  },
];

// ===== 模块选择算法 =====
// 规则：
// 1. 必选模块（weight=100 且有 min_selection_reason）始终入选
// 2. 其余按权重 + Profile Signature 相关性计算得分，取够至少14个
// 3. 场景类模块至少选6个，叙事类至少选3个

export function selectModules(
  signature: BFProfileSignature,
  minCount: number = 14
): BFModuleId[] {
  const selected: BFModuleId[] = [];
  const pool = [...BF_MODULE_POOL];

  // 第一步：必选模块
  const required = pool.filter(m => m.min_selection_reason);
  selected.push(...required.map(m => m.id));

  // 第二步：计算剩余模块的调整权重
  const remaining = pool.filter(m => !m.min_selection_reason);

  // 基于 signature 调整权重的因子
  const adjusted = remaining.map(m => {
    let w = m.weight;

    // 张力对越多，max_tension 权重越高
    if (m.id === 'max_tension' && signature.tension_pairs.length > 0) {
      w += signature.tension_pairs.length * 8;
    }

    // 极端维度越多，最高/最低两维和平衡模块权重变化
    if (m.id === 'highest_two_cooperation' && signature.highest_2.length > 0) {
      w += 5;
    }
    if (m.id === 'lowest_two' && signature.lowest_2.length > 0) {
      w += 5;
    }

    // spread 大的话，张力和最高两维更相关
    if (signature.spread > 30) {
      if (m.id === 'max_tension') w += 10;
      if (m.id === 'highest_two_cooperation') w += 5;
    }

    // 越平衡，balance_dimension 权重越高
    if (signature.balance < 8 && m.id === 'balance_dimension') {
      w += 15;
    }

    // 场景类模块打散，保证多样性
    return { ...m, adjusted_weight: w };
  });

  // 按调整权重排序
  adjusted.sort((a, b) => b.adjusted_weight - a.adjusted_weight);

  // 第三步：确保场景类至少6个、叙事类至少3个
  const sceneCount = adjusted.filter(m => m.category === 'scene').length;
  const narrativeCount = adjusted.filter(
    m => m.category === 'narrative' && !selected.includes(m.id)
  ).length;

  // 按权重从高到低选取，直到满足 minCount
  for (const m of adjusted) {
    if (selected.length >= minCount) break;
    if (!selected.includes(m.id)) {
      selected.push(m.id);
    }
  }

  // 第四步：如果场景类不足6个，补充场景类
  const currentSceneCount = selected.filter(
    id => adjusted.find(m => m.id === id)?.category === 'scene'
  ).length;

  if (currentSceneCount < 6) {
    const sceneCandidates = adjusted
      .filter(m => m.category === 'scene' && !selected.includes(m.id))
      .sort((a, b) => b.adjusted_weight - a.adjusted_weight);

    for (const m of sceneCandidates) {
      if (selected.filter(id => {
        const mod = adjusted.find(x => x.id === id);
        return mod?.category === 'scene';
      }).length >= 6) break;
      if (!selected.includes(m.id)) {
        // 替换一个权重最低的非场景、非必需模块
        const replaceable = selected
          .filter(id => {
            const mod = adjusted.find(x => x.id === id);
            return mod && mod.category !== 'scene' && !required.find(r => r.id === id);
          })
          .sort((a, b) => {
            const aw = adjusted.find(x => x.id === a)?.adjusted_weight || 0;
            const bw = adjusted.find(x => x.id === b)?.adjusted_weight || 0;
            return aw - bw;
          });
        if (replaceable.length > 0) {
          const idx = selected.indexOf(replaceable[0]);
          selected.splice(idx, 1, m.id);
        } else {
          selected.push(m.id);
        }
      }
    }
  }

  return selected;
}

// ===== 模块排序（按展示顺序）=====
export const MODULE_DISPLAY_ORDER: BFModuleId[] = [
  'hero',
  'radar',
  'continuous_position',
  'profile_signature',
  'highest_two_cooperation',
  'lowest_two',
  'max_tension',
  'balance_dimension',
  'work',
  'learning',
  'intimacy',
  'friendship',
  'conflict',
  'boundaries',
  'decision_making',
  'procrastination',
  'creativity',
  'stress',
  'recovery',
  'misunderstood',
  'admired_people',
  'uncomfortable_env',
  'whisper',
  'story_mirror_people',
  'story_mirror_media',
  'seven_day_experiment',
  'chat_with_xiaoku',
  'save_image',
  'pdf_export',
  'share',
];

export function sortModulesForDisplay(modules: BFModuleId[]): BFModuleId[] {
  return MODULE_DISPLAY_ORDER.filter(m => modules.includes(m));
}

export default BF_MODULE_POOL;
