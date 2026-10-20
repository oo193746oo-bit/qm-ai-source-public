/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/**
 * QM 成人ADHD评估 v4.0 - 执行功能模块
 *
 * 8个执行功能环节：Start / Prioritize / Time / Working Memory / Switch / Sustain / Organize / Finish
 * 用于任务生命周期分析、热力图、策略匹配
 */

import type { ExecutiveFunctionProfile, EFKey } from './types';

// 8 个执行功能环节的完整定义
export interface EFModule {
  key: EFKey;
  shortName: string;
  fullName: string;
  description: string;
  questionId: string;
  taskLifecycleStage: 'start' | 'middle' | 'switch' | 'end';
  common_frictions: string[];
  environment_strategies: string[];
  task_design_strategies: string[];
  body_regulation_strategies: string[];
  scene_examples: string[];
}

export const EXECUTIVE_FUNCTIONS: EFModule[] = [
  {
    key: 'start',
    shortName: '启动',
    fullName: '任务启动 (Task Initiation)',
    description: '从"知道要做"跨越到"真正开始"的那一步。不是懒，而是大脑的启动按钮很难按下。',
    questionId: 'E01',
    taskLifecycleStage: 'start',
    common_frictions: [
      '明明知道重要，却迟迟无法开始',
      '盯着空白文档/空房间半小时',
      '需要外部截止日期才能行动',
      '把启动寄托于"状态好的时候"',
    ],
    environment_strategies: [
      '把任务的第一步设计成2分钟以内可完成',
      '在固定地点做固定类型的任务',
      '消除启动前的所有准备障碍',
    ],
    task_design_strategies: [
      '用"5分钟开始法"降低启动门槛',
      '把任务拆成"打开文件、读第一页"这样的微型步骤',
      '用身体动作带动脑力启动（站着、走动、喝水）',
    ],
    body_regulation_strategies: [
      '先做2分钟身体活动再开始',
      '利用一天中最清醒的时段启动难任务',
    ],
    scene_examples: ['写报告', '回重要邮件', '开始学习', '收拾房间'],
  },
  {
    key: 'prioritize',
    shortName: '优先级',
    fullName: '优先级判断 (Prioritization)',
    description: '在多个任务中判断什么最重要，并按重要性而非兴趣/紧急度排序的能力。',
    questionId: 'E03',
    taskLifecycleStage: 'start',
    common_frictions: [
      '待办清单越长越不知道从哪下手',
      '先做最有趣或最容易的，不是最重要的',
      '被紧急的小事牵着走',
      '常常在选任务上花很多时间',
    ],
    environment_strategies: [
      '每天只确定1-2件"最重要的事"',
      '用可视化看板区分优先级',
      '让别人帮你确认优先级',
    ],
    task_design_strategies: [
      '前一晚选好第二天的第一任务',
      '用"如果只能做一件事"检验优先级',
      '把大目标拆成可执行的下一步',
    ],
    body_regulation_strategies: [
      '在精力最好时做优先级判断',
      '避免疲劳时做重要决定',
    ],
    scene_examples: ['多任务并行', '项目管理', '日常待办', '学习计划'],
  },
  {
    key: 'time',
    shortName: '时间感',
    fullName: '时间感知与管理 (Time Management)',
    description: '预估任务时长、感知时间流逝、在截止日前合理分配精力的能力。',
    questionId: 'E02',
    taskLifecycleStage: 'middle',
    common_frictions: [
      '总是低估事情需要的时间',
      '以为还有很久，突然发现快到截止了',
      '经常迟到或卡点到达',
      '对"还剩多少时间"判断不准',
    ],
    environment_strategies: [
      '把预估时间乘以2或3',
      '用计时器把任务切成时间段',
      '提前设置多级提醒',
    ],
    task_design_strategies: [
      '把任务拆成有明确截止的小阶段',
      '用"时间块"代替"任务清单"',
      '完成后记录实际用时，校准估计',
    ],
    body_regulation_strategies: [
      '用身体运动感知时间流逝',
      '把休息也放进时间表',
    ],
    scene_examples: ['项目截止', '约会守时', '考试答题', '出门准备'],
  },
  {
    key: 'workingMemory',
    shortName: '工作记忆',
    fullName: '工作记忆 (Working Memory)',
    description: '在脑中同时保存多个信息、记得下一步做什么、记住指令和细节的能力。',
    questionId: 'E04',
    taskLifecycleStage: 'middle',
    common_frictions: [
      '走进房间却忘了要拿什么',
      '别人说的话需要反复确认',
      '做一步忘下一步',
      '容易漏掉细节和步骤',
    ],
    environment_strategies: [
      '把信息外化为清单、便签、提醒',
      '同一时间只处理一条指令',
      '重要信息写下来而不是靠脑子记',
    ],
    task_design_strategies: [
      '把多步骤任务写成可视化流程',
      '用清单代替记忆',
      '完成一步勾一步',
    ],
    body_regulation_strategies: [
      '重要信息前先深呼吸聚焦',
      '用复述确认接收到的信息',
    ],
    scene_examples: ['听指令', '做复杂任务', '购物清单', '对话中记信息'],
  },
  {
    key: 'switch',
    shortName: '切换',
    fullName: '任务切换 (Task Switching)',
    description: '从一个任务转移到另一个任务、并重新进入状态的灵活性。',
    questionId: 'E05',
    taskLifecycleStage: 'switch',
    common_frictions: [
      '被打断后很难回到原来的事',
      '切换任务时会卡很久',
      '很难从喜欢的事上抽身',
      '一天中太多切换会精疲力尽',
    ],
    environment_strategies: [
      '减少不必要的切换，同类任务集中处理',
      '设置"免打扰"时段',
      '切换前做一个收尾小动作',
    ],
    task_design_strategies: [
      '给每个切换留缓冲时间',
      '用过渡仪式帮助切换（喝水、走动、整理桌面）',
      '离开时留下一步"回来直接做"的线索',
    ],
    body_regulation_strategies: [
      '切换时做身体拉伸',
      '用感官刺激帮助状态转换（音乐、香薰）',
    ],
    scene_examples: ['会议后回到工作', '家务间隙处理消息', '多项目切换', '从休息回到工作'],
  },
  {
    key: 'sustain',
    shortName: '持续',
    fullName: '持续投入 (Sustained Attention)',
    description: '在较长任务中保持稳定投入、不中途掉速的能力。',
    questionId: 'E06',
    taskLifecycleStage: 'middle',
    common_frictions: [
      '长任务前期冲很快，中后期明显掉速',
      '越接近收尾越难集中',
      '需要临近截止才能重新发力',
      '单调重复的任务特别难熬',
    ],
    environment_strategies: [
      '把长任务切成多个短冲刺',
      '在中间设置奖励点',
      '改变环境增加新鲜感',
    ],
    task_design_strategies: [
      '用番茄钟或类似方法分段',
      '在长任务中穿插不同类型的事',
      '把无聊的部分和喜欢的部分绑定',
    ],
    body_regulation_strategies: [
      '感到掉速时起身活动',
      '用咀嚼、捏压力球等感官活动维持唤醒',
    ],
    scene_examples: ['长报告', '学习', '看书', '数据处理'],
  },
  {
    key: 'organize',
    shortName: '组织',
    fullName: '组织与系统维持 (Organization)',
    description: '建立并维持物品、文件、信息和空间秩序的能力。',
    questionId: 'E07',
    taskLifecycleStage: 'middle',
    common_frictions: [
      '桌面、房间、邮箱总是很快变乱',
      '整理后维持不了几天',
      '东西经常找不到',
      '不知道东西该放哪',
    ],
    environment_strategies: [
      '每个东西有固定的家',
      '减少物品总量，降低维持成本',
      '用透明容器、标签可视化',
    ],
    task_design_strategies: [
      '每天花5分钟快速整理',
      '使用"一进一出"原则',
      '把收纳设计成"随手就能归位"',
    ],
    body_regulation_strategies: [
      '精力好时做整理决策',
      '边听东西边整理降低心理门槛',
    ],
    scene_examples: ['桌面整理', '文件管理', '房间收纳', '衣柜'],
  },
  {
    key: 'finish',
    shortName: '收尾',
    fullName: '任务收尾与关闭 (Task Completion)',
    description: '把事情完整做完、处理最后细节、关闭循环的能力。',
    questionId: 'E08',
    taskLifecycleStage: 'end',
    common_frictions: [
      '很多事情做到80%就停了',
      '讨厌处理最后细节',
      '项目收尾阶段特别痛苦',
      '有大量"差一点就完成"的事',
    ],
    environment_strategies: [
      '把收尾环节单独列出来',
      '设置"完成庆祝"仪式',
      '让别人检查最后细节',
    ],
    task_design_strategies: [
      '把任务定义成"交付即完成"，不是"完美即完成"',
      '收尾前先休息一下再回来',
      '用清单勾掉最后一步',
    ],
    body_regulation_strategies: [
      '收尾前做短暂休息',
      '完成后给自己明确的奖赏',
    ],
    scene_examples: ['项目收尾', '邮件发送前检查', '作业提交', '搬家整理最后一箱'],
  },
];

// 任务生命周期阶段
export const TASK_LIFECYCLE_STAGES = [
  { id: 'start', name: '启动', color: '#6B4C9A', efKeys: ['start', 'prioritize'] as EFKey[] },
  { id: 'middle', name: '持续', color: '#8B6FC2', efKeys: ['time', 'workingMemory', 'sustain', 'organize'] as EFKey[] },
  { id: 'switch', name: '切换', color: '#A78BD1', efKeys: ['switch'] as EFKey[] },
  { id: 'end', name: '收尾', color: '#C4AFE0', efKeys: ['finish'] as EFKey[] },
];

// 获取某用户的"最卡"执行功能
export function getTopChallenges(
  profile: ExecutiveFunctionProfile,
  count: number = 3
): EFKey[] {
  return (Object.entries(profile) as [EFKey, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([k]) => k);
}

// 获取某用户的"相对最强"执行功能
export function getRelativeStrengths(
  profile: ExecutiveFunctionProfile,
  count: number = 2
): EFKey[] {
  return (Object.entries(profile) as [EFKey, number][])
    .sort((a, b) => a[1] - b[1])
    .slice(0, count)
    .map(([k]) => k);
}
