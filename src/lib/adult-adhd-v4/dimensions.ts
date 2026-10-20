/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/**
 * QM 成人ADHD评估 v4.0 - 维度定义
 *
 * 六大评分维度 + 执行功能8环节 + 功能影响6领域 + 16场景
 */

import type { QuestionCategory, EFKey, FIDomain } from './types';

// ============================================================
// 核心维度
// ============================================================

export const CORE_DIMENSIONS = {
  inattention: {
    key: 'inattention',
    name: '注意力',
    description: '持续专注细节、维持注意力、听进内容、不被干扰的能力',
    questionIds: ['C01', 'C02', 'C03', 'C04', 'C05', 'C06', 'C07', 'C08', 'C09'],
    color: '#6B4C9A',
  },
  hyperactivity: {
    key: 'hyperactivity',
    name: '多动',
    description: '身体安稳度、内部驱动力、安静情境下的活动水平',
    questionIds: ['C10', 'C11', 'C12', 'C13', 'C14'],
    color: '#8B6FC2',
  },
  impulsivity: {
    key: 'impulsivity',
    name: '冲动',
    description: '等待能力、行动前思考、打断与插话倾向',
    questionIds: ['C15', 'C16', 'C17', 'C18'],
    color: '#A78BD1',
  },
};

// ============================================================
// 执行功能 8 环节
// ============================================================

export const EXECUTIVE_FUNCTION_DIMENSIONS: Record<EFKey, {
  name: string;
  description: string;
  questionId: string;
  scene_example: string;
}> = {
  start: {
    name: '启动',
    description: '从"知道要做"到"真正开始"之间的跨越能力',
    questionId: 'E01',
    scene_example: '打开文档后盯着空白页半小时',
  },
  prioritize: {
    name: '优先级',
    description: '在多任务中判断主次、按重要性而非兴趣排序的能力',
    questionId: 'E03',
    scene_example: '待办清单很长，却先做最轻松的那件',
  },
  time: {
    name: '时间感',
    description: '预估任务时长、感知时间流逝、把握截止日期的能力',
    questionId: 'E02',
    scene_example: '以为半小时能完成，实际花了三小时',
  },
  workingMemory: {
    name: '工作记忆',
    description: '在脑中同时保存多个信息、记得下一步做什么的能力',
    questionId: 'E04',
    scene_example: '走进房间却忘了要拿什么',
  },
  switch: {
    name: '切换',
    description: '从一个任务转移到另一个任务并重新进入状态的能力',
    questionId: 'E05',
    scene_example: '会议结束后半天回不到工作状态',
  },
  sustain: {
    name: '持续',
    description: '在长任务中保持投入、不中途掉速的能力',
    questionId: 'E06',
    scene_example: '项目前期冲很快，后期越做越慢',
  },
  organize: {
    name: '组织',
    description: '维持物品、文件、信息和空间系统的能力',
    questionId: 'E07',
    scene_example: '桌面和邮箱总是很快变乱',
  },
  finish: {
    name: '收尾',
    description: '把事情完整做完、处理最后细节、关闭循环的能力',
    questionId: 'E08',
    scene_example: '有很多做了80%却没完成的事',
  },
};

export const EXECUTIVE_FUNCTION_ORDER: EFKey[] = [
  'start', 'prioritize', 'time', 'workingMemory',
  'switch', 'sustain', 'organize', 'finish',
];

// ============================================================
// 功能影响 6 领域
// ============================================================

export const FUNCTIONAL_IMPACT_DOMAINS: Record<FIDomain, {
  name: string;
  questionId: string;
  description: string;
}> = {
  work_study: {
    name: '工作/学习',
    questionId: 'F01',
    description: '效率、产出、质量与持续性',
  },
  admin_tasks: {
    name: '任务/行政管理',
    questionId: 'F02',
    description: '截止日期、邮件消息、文件、预约、缴费、家务',
  },
  relationships: {
    name: '关系',
    questionId: 'F03',
    description: '伴侣、家人、朋友、同事间的沟通与信任',
  },
  finances: {
    name: '财务/消费',
    questionId: 'F04',
    description: '预算、按时付款、冲动消费、长期财务安排',
  },
  health_routine: {
    name: '健康与日常规律',
    questionId: 'F05',
    description: '睡眠规律、运动、饮食、就医、自我照顾',
  },
  overall_quality: {
    name: '整体生活质量',
    questionId: 'F06',
    description: '额外付出的时间、精力与情绪成本',
  },
};

export const FUNCTIONAL_IMPACT_ORDER: FIDomain[] = [
  'work_study', 'admin_tasks', 'relationships',
  'finances', 'health_routine', 'overall_quality',
];

// ============================================================
// 情绪调节 5 项（非DSM核心维度）
// ============================================================

export const EMOTION_REGULATION_ITEMS = {
  frustration_threshold: {
    name: '挫败阈值',
    questionId: 'R01',
    description: '小挫折、等待、被打断时的情绪升高速度',
  },
  recovery_speed: {
    name: '恢复速度',
    questionId: 'R02',
    description: '情绪触发后回到平稳所需的时间',
  },
  criticism_trigger: {
    name: '批评触发',
    questionId: 'R03',
    description: '被否定或自我批评时的羞耻/防御强度',
  },
  overwhelm: {
    name: '过载',
    questionId: 'R04',
    description: '任务/信息/刺激过多时的瘫痪程度',
  },
  action_impact: {
    name: '情绪影响行动',
    questionId: 'R05',
    description: '情绪强度对专注、沟通和决定的干扰程度',
  },
};

export const EMOTION_REGULATION_NOTE = '非DSM核心维度，常见相关体验，不参与诊断判断';

// ============================================================
// 发展与情境维度
// ============================================================

export const DEVELOPMENTAL_DIMENSIONS = {
  childhood_onset: { name: '12岁前线索', questionId: 'D01' },
  childhood_external_clues: { name: '童年外部反馈', questionId: 'D02' },
  cross_setting_count: { name: '跨情境', questionId: 'D03' },
  duration_months: { name: '持续时间', questionId: 'D04' },
  continuity: { name: '发展连续性', questionId: 'D05' },
};

// ============================================================
// 重叠因素
// ============================================================

export const OVERLAP_DIMENSIONS = {
  sleep: { name: '睡眠', questionId: 'X01' },
  anxiety_stress: { name: '焦虑/压力', questionId: 'X02' },
  low_mood_energy: { name: '低落/疲惫', questionId: 'X03' },
  elevated_mood: { name: '情绪高涨', questionId: 'X04' },
  substance_body: { name: '物质/身体', questionId: 'X05' },
  trauma_environment: { name: '创伤/环境', questionId: 'X06' },
};

// ============================================================
// 类别中文名
// ============================================================

export const CATEGORY_NAMES: Record<QuestionCategory, string> = {
  core_inattention: '核心症状·注意力',
  core_hyperactivity: '核心症状·多动',
  core_impulsivity: '核心症状·冲动',
  executive_function: '执行功能',
  emotion_regulation: '情绪调节',
  functional_impact: '功能影响',
  developmental: '发展与情境',
  overlap: '重叠因素检查',
};
