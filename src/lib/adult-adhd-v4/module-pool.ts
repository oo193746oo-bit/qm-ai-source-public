/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/**
 * QM 成人ADHD评估 v4.0 - 结果模块池（40个）
 *
 * 每次结果至少选择 22 个模块
 * 核心数据模块固定，叙事模块按 user_signature 动态选择
 */

import type { ResultModule } from './types';

export const MODULE_POOL: ResultModule[] = [
  // === 核心模块（固定出现） ===
  {
    id: 'hero_non_diagnostic',
    name: 'Hero与非诊断边界',
    category: 'core',
    required: true,
    description: '结果页首屏：明确说明这是筛查/自我觉察工具，不是诊断',
  },
  {
    id: 'evidence_screener_status',
    name: 'Evidence Screener状态',
    category: 'core',
    required: true,
    description: '官方筛查模块状态：启用/未启用/结果',
  },
  {
    id: 'core_symptom_bars',
    name: 'Core Symptom Bars',
    category: 'core',
    required: true,
    description: '核心症状条形图：注意力、多动、冲动三项均值',
  },
  {
    id: 'executive_heatmap',
    name: 'Executive Function Heatmap',
    category: 'core',
    required: true,
    description: '执行功能热力表：8个环节的得分与场景示例',
  },
  {
    id: 'task_lifecycle',
    name: 'Task Lifecycle',
    category: 'core',
    required: true,
    description: '任务生命周期图：卡点出现在Start/Sustain/Switch/Finish哪一段',
  },
  {
    id: 'functional_impact_radar',
    name: 'Functional Impact Radar',
    category: 'core',
    required: true,
    description: '功能影响雷达图：6个生活领域',
  },
  {
    id: 'development_timeline',
    name: 'Development Timeline',
    category: 'core',
    required: true,
    description: '发展时间线：12岁前、青少年、成年、最近6个月',
  },

  // === 情境与背景模块 ===
  {
    id: 'cross_setting_matrix',
    name: 'Cross-setting Context Matrix',
    category: 'core',
    required: true,
    description: '跨情境矩阵：困难在哪些场景出现',
  },
  {
    id: 'emotion_regulation_panel',
    name: 'Emotion Regulation Panel',
    category: 'core',
    required: true,
    description: '情绪调节面板（标注：非DSM核心维度）',
  },
  {
    id: 'overlap_check_table',
    name: 'Overlap Check Table',
    category: 'core',
    required: true,
    description: '重叠因素表：睡眠/焦虑/低落/高涨/物质/创伤，只提示评估议题',
  },
  {
    id: 'profile_table',
    name: 'Profile Table',
    category: 'core',
    required: true,
    description: '完整画像表：维度/本次位置/生活表现/影响场景/已有应对/下一步观察',
  },
  {
    id: 'support_matrix',
    name: 'Screening×Impact Support Matrix',
    category: 'core',
    required: true,
    description: '筛查信号×功能影响支持矩阵',
  },
  {
    id: 'dsm_pattern_support',
    name: 'DSM-aligned Pattern Support（非诊断）',
    category: 'core',
    required: true,
    description: '自评频率计数叙事支持，明确标注非诊断',
  },

  // === 场景叙事模块（按用户画像动态选）===
  {
    id: 'scene_deep_work',
    name: '工作/深度任务',
    category: 'narrative',
    required: false,
    description: '深度工作场景的具体摩擦与支持方向',
  },
  {
    id: 'scene_meetings',
    name: '会议/沟通',
    category: 'narrative',
    required: false,
    description: '会议与沟通场景的困难与策略',
  },
  {
    id: 'scene_study_exam',
    name: '学习/考试',
    category: 'narrative',
    required: false,
    description: '学习与考试场景的注意力困难与应对',
  },
  {
    id: 'scene_messages',
    name: '消息与数字分心',
    category: 'narrative',
    required: false,
    description: '消息、邮箱和数字环境的分心管理',
  },
  {
    id: 'scene_housework_admin',
    name: '家务/行政',
    category: 'narrative',
    required: false,
    description: '家务和日常行政事务的管理',
  },
  {
    id: 'scene_finances',
    name: '财务',
    category: 'narrative',
    required: false,
    description: '财务管理与冲动消费',
  },
  {
    id: 'scene_getting_ready',
    name: '出门准备',
    category: 'narrative',
    required: false,
    description: '出门准备与时间管理',
  },
  {
    id: 'scene_intimacy',
    name: '亲密关系',
    category: 'narrative',
    required: false,
    description: '亲密对话与关系中的注意力模式',
  },
  {
    id: 'scene_social_waiting',
    name: '社交/等待',
    category: 'narrative',
    required: false,
    description: '社交场合与等待情境',
  },
  {
    id: 'scene_conflict',
    name: '冲突',
    category: 'narrative',
    required: false,
    description: '冲突情境下的情绪与冲动',
  },
  {
    id: 'scene_rest_bedtime',
    name: '休息与睡前',
    category: 'narrative',
    required: false,
    description: '休息和睡前的大脑停不下来',
  },
  {
    id: 'scene_interest',
    name: '兴趣/超投入场景',
    category: 'narrative',
    required: false,
    description: '兴趣驱动的超投入与多坑现象',
  },

  // === 支持与叙事模块 ===
  {
    id: 'whispers',
    name: '小酷心理耳语',
    category: 'narrative',
    required: true,
    description: '个性化小酷耳语：看见摩擦→非道德化理解→支持实验',
  },
  {
    id: 'story_mirror_people',
    name: '人物Story Mirror',
    category: 'narrative',
    required: true,
    description: '人物叙事镜像：Why You / Difference / Transfer',
  },
  {
    id: 'story_mirror_media',
    name: '影视/文学Story Mirror',
    category: 'narrative',
    required: true,
    description: '影视/文学/播客叙事镜像',
  },
  {
    id: 'friction_log_7day',
    name: '7-Day Friction Log',
    category: 'support',
    required: true,
    description: '7天摩擦日志：验证结果而非被标签定义',
  },
  {
    id: 'support_strategy_matrix',
    name: 'Support Strategy Matrix',
    category: 'support',
    required: true,
    description: '支持策略矩阵：环境/任务/时间/提醒/切换/身体/沟通',
  },
  {
    id: 'assessment_prep',
    name: 'Professional Assessment Prep',
    category: 'support',
    required: true,
    description: '专业评估准备表：自动汇总就诊有用信息',
  },
  {
    id: 'next_steps',
    name: '下一步支持',
    category: 'support',
    required: true,
    description: '根据支持优先级给出下一步行动',
  },
  {
    id: 'treatment_education',
    name: '循证治疗教育（高层级）',
    category: 'support',
    required: true,
    description: '中立的治疗选项教育：心理/行为/环境/药物可能（无具体药名剂量）',
  },

  // === 互动与导出模块 ===
  {
    id: 'chat_whisper',
    name: '和小酷聊结果',
    category: 'narrative',
    required: true,
    description: '引导用户继续和小酷深入聊具体困扰',
  },
  {
    id: 'export_png',
    name: '保存PNG',
    category: 'export',
    required: true,
    description: 'PNG长图导出（只保留非敏感摘要）',
  },
  {
    id: 'export_pdf',
    name: 'A4 PDF',
    category: 'export',
    required: true,
    description: '完整PDF报告导出',
  },
  {
    id: 'export_share',
    name: 'Share Card',
    category: 'export',
    required: true,
    description: '分享卡（默认隐藏敏感信息）',
  },
  {
    id: 'retest',
    name: '复测',
    category: 'meta',
    required: true,
    description: '8-12周后复测，观察变化',
  },
  {
    id: 'privacy',
    name: '隐私说明',
    category: 'meta',
    required: true,
    description: '数据隐私与使用说明',
  },
  {
    id: 'evidence_versions',
    name: '证据与版本说明',
    category: 'meta',
    required: true,
    description: '循证来源、版本和最后审核日期',
  },
];

// 核心模块（固定出现的）
export const REQUIRED_MODULES = MODULE_POOL.filter((m) => m.required).map((m) => m.id);

// 根据用户画像选择叙事场景模块
// 规则：至少选 22 个，其中核心模块全选，叙事场景模块按 top_n 选
export function selectModules(options: {
  topSceneIds: string[];
  minTotal?: number;
}): string[] {
  const { topSceneIds, minTotal = 22 } = options;

  const selected = [...REQUIRED_MODULES];

  // 场景模块映射
  const sceneModuleMap: Record<string, string> = {
    deep_work: 'scene_deep_work',
    meetings: 'scene_meetings',
    studying: 'scene_study_exam',
    exams: 'scene_study_exam',
    messages_email: 'scene_messages',
    housework: 'scene_housework_admin',
    finances: 'scene_finances',
    getting_ready: 'scene_getting_ready',
    traffic_waiting: 'scene_social_waiting',
    intimate_conversation: 'scene_intimacy',
    socializing: 'scene_social_waiting',
    conflict: 'scene_conflict',
    rest: 'scene_rest_bedtime',
    bedtime: 'scene_rest_bedtime',
    interest_projects: 'scene_interest',
    long_term_projects: 'scene_interest',
  };

  // 添加排名靠前的场景模块
  const sceneModulesAdded = new Set<string>();
  for (const sceneId of topSceneIds) {
    const moduleId = sceneModuleMap[sceneId];
    if (moduleId && !sceneModulesAdded.has(moduleId)) {
      selected.push(moduleId);
      sceneModulesAdded.add(moduleId);
    }
    if (sceneModulesAdded.size >= 6) break;
  }

  // 如果还不够 22 个，补充其他叙事模块
  const extraNarrative = MODULE_POOL.filter(
    (m) => m.category === 'narrative' && !selected.includes(m.id)
  ).map((m) => m.id);

  let i = 0;
  while (selected.length < minTotal && i < extraNarrative.length) {
    selected.push(extraNarrative[i]);
    i++;
  }

  return selected;
}

export const TOTAL_MODULE_COUNT = MODULE_POOL.length;
