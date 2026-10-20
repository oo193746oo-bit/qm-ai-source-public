/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/**
 * QM 成人ADHD评估 v4.0 - 16 场景库
 *
 * 每个场景包含：核心挑战映射、执行功能卡点、常见摩擦、支持策略
 * 用于场景叙事、Scene Heatmap 和小酷耳语
 */

export interface Scene {
  id: string;
  name: string;
  icon: string;
  category: 'work' | 'life' | 'relationship' | 'self';
  core_symptoms_driven: string[]; // 主要相关的核心症状维度
  executive_functions_driven: string[]; // 主要相关的执行功能
  common_frictions: string[];
  typical_strategies: string[];
  related_questions: string[];
}

export const SCENES_16: Scene[] = [
  // === 工作/学习类 ===
  {
    id: 'deep_work',
    name: '深度工作',
    icon: '💻',
    category: 'work',
    core_symptoms_driven: ['inattention', 'hyperactivity'],
    executive_functions_driven: ['sustain', 'workingMemory', 'start'],
    common_frictions: [
      '刚坐下就被各种想法带走',
      '刚进入状态就被消息打断',
      '一上午好像什么都没完成',
      '需要安静环境但很难找到',
    ],
    typical_strategies: [
      '设置专注时段（如25分钟番茄）',
      '关闭通知，使用专注模式',
      '找到一天中精力最好的时段做深度工作',
    ],
    related_questions: ['C01', 'C02', 'C08', 'E06'],
  },
  {
    id: 'meetings',
    name: '会议',
    icon: '👥',
    category: 'work',
    core_symptoms_driven: ['inattention', 'impulsivity', 'hyperactivity'],
    executive_functions_driven: ['sustain', 'workingMemory', 'switch'],
    common_frictions: [
      '会议中走神，需要别人重复',
      '忍不住插话或提前表达想法',
      '身体坐不住，总想动一动',
      '长会议后精疲力尽',
    ],
    typical_strategies: [
      '站着开会或用涂鸦本保持参与',
      '提前看议程，准备3个关注点',
      '允许自己在不影响他人的前提下小幅活动',
    ],
    related_questions: ['C03', 'C10', 'C15', 'C18'],
  },
  {
    id: 'studying',
    name: '学习',
    icon: '📚',
    category: 'work',
    core_symptoms_driven: ['inattention', 'hyperactivity'],
    executive_functions_driven: ['sustain', 'start', 'time'],
    common_frictions: [
      '看书时眼睛在动脑子没在跟',
      '学了半小时好像什么都没记住',
      '计划学很久，实际效率很低',
      '越重要的考试越难进入状态',
    ],
    typical_strategies: [
      '主动回忆代替被动阅读',
      '把学习内容讲给别人听（或假装讲）',
      '用番茄钟分段，每段有明确目标',
    ],
    related_questions: ['C02', 'C06', 'E01', 'E06'],
  },
  {
    id: 'exams',
    name: '考试',
    icon: '📝',
    category: 'work',
    core_symptoms_driven: ['inattention', 'impulsivity'],
    executive_functions_driven: ['time', 'workingMemory', 'sustain'],
    common_frictions: [
      '读题容易漏看条件',
      '在一道题上卡住太久',
      '总是最后才发现还有一面没做',
      '考完才想起自己会的解法',
    ],
    typical_strategies: [
      '先扫一遍全卷，分配时间',
      '读题时圈出关键词',
      '卡住就先跳过，标记后回来',
    ],
    related_questions: ['C01', 'C09', 'E02', 'E04'],
  },

  // === 生活/行政类 ===
  {
    id: 'messages_email',
    name: '消息/邮箱',
    icon: '📱',
    category: 'life',
    core_symptoms_driven: ['inattention'],
    executive_functions_driven: ['organize', 'prioritize', 'finish'],
    common_frictions: [
      '打开消息就忘了要回什么',
      '邮箱积了几百封未读',
      '越积越不敢打开',
      '重要消息被淹没在通知里',
    ],
    typical_strategies: [
      '设置固定的"邮件时间"，不要随时处理',
      '用过滤器和标签自动分类',
      '用"两分钟原则"快速处理',
    ],
    related_questions: ['C04', 'C07', 'E07', 'E08'],
  },
  {
    id: 'housework',
    name: '家务',
    icon: '🧹',
    category: 'life',
    core_symptoms_driven: ['inattention', 'hyperactivity'],
    executive_functions_driven: ['start', 'sustain', 'organize'],
    common_frictions: [
      '房间乱到不想收拾',
      '收拾到一半被别的东西带走',
      '不知道从哪开始',
      '整理后维持不了两天',
    ],
    typical_strategies: [
      '只收拾一个角落，不要整间房',
      '用计时器设定15分钟冲刺',
      '降低"整洁"的标准',
    ],
    related_questions: ['C05', 'C06', 'E01', 'E07'],
  },
  {
    id: 'finances',
    name: '财务',
    icon: '💰',
    category: 'life',
    core_symptoms_driven: ['inattention', 'impulsivity'],
    executive_functions_driven: ['organize', 'time'],
    common_frictions: [
      '经常忘记账单导致逾期',
      '冲动消费事后后悔',
      '怕看账单，财务状况模糊',
      '预算做了但执行不了',
    ],
    typical_strategies: [
      '一切能自动的都设为自动',
      '给冲动消费设24小时冷却期',
      '用简单的记账方式，不要复杂系统',
    ],
    related_questions: ['C09', 'C17', 'E02', 'E07'],
  },
  {
    id: 'getting_ready',
    name: '出门准备',
    icon: '🚪',
    category: 'life',
    core_symptoms_driven: ['inattention', 'time'],
    executive_functions_driven: ['time', 'workingMemory', 'organize'],
    common_frictions: [
      '总是卡点出门或迟到',
      '出门前总忘带东西',
      '明明时间够，最后还是赶',
      '找东西花掉一半时间',
    ],
    typical_strategies: [
      '前一晚准备好第二天的东西',
      '把出门要带的放在固定位置',
      '把预估时间乘以1.5',
    ],
    related_questions: ['C07', 'C09', 'E02', 'E04'],
  },
  {
    id: 'traffic_waiting',
    name: '交通/等待',
    icon: '🚇',
    category: 'life',
    core_symptoms_driven: ['impulsivity', 'hyperactivity'],
    executive_functions_driven: ['sustain', 'switch'],
    common_frictions: [
      '排队时特别烦躁',
      '等车等得坐立不安',
      '堵车时容易路怒',
      '等待时总想刷手机',
    ],
    typical_strategies: [
      '准备好等待时的消遣（播客、电子书）',
      '提前出门，降低迟到焦虑',
      '用深呼吸或身体扫描度过等待',
    ],
    related_questions: ['C11', 'C16', 'E05'],
  },

  // === 关系类 ===
  {
    id: 'intimate_conversation',
    name: '亲密对话',
    icon: '💬',
    category: 'relationship',
    core_symptoms_driven: ['inattention', 'impulsivity'],
    executive_functions_driven: ['workingMemory', 'sustain'],
    common_frictions: [
      '对方说话时你在想别的',
      '被说"你根本没在听"',
      '忍不住打断或抢话',
      '聊重要话题时容易走神',
    ],
    typical_strategies: [
      '用复述确认你听到了什么',
      '告诉伴侣你的注意力模式，减少误解',
      '重要对话选在你精力好的时候',
    ],
    related_questions: ['C03', 'C15', 'E04', 'R01'],
  },
  {
    id: 'socializing',
    name: '社交',
    icon: '🎉',
    category: 'relationship',
    core_symptoms_driven: ['inattention', 'hyperactivity', 'impulsivity'],
    executive_functions_driven: ['switch', 'workingMemory', 'sustain'],
    common_frictions: [
      '聚会中容易走神或想先走',
      '话题跳太快，别人跟不上',
      '说太快没经过脑子',
      '人多环境刺激太大',
    ],
    typical_strategies: [
      '给自己设定"提前离场许可"',
      '找一两个人深聊，不要试图照顾所有人',
      '需要时到安静角落休息一下',
    ],
    related_questions: ['C08', 'C14', 'C18', 'E05'],
  },
  {
    id: 'conflict',
    name: '冲突',
    icon: '⚡',
    category: 'relationship',
    core_symptoms_driven: ['impulsivity', 'emotion_regulation'],
    executive_functions_driven: ['switch', 'workingMemory'],
    common_frictions: [
      '冲突中容易说过头的话',
      '情绪上来就听不进对方',
      '事后后悔但当时控制不住',
      '翻旧账，越吵越多',
    ],
    typical_strategies: [
      '约定"暂停"信号，情绪上来先停',
      '用文字代替口头，给自己思考时间',
      '冲突后一起复盘，不是只怪自己',
    ],
    related_questions: ['C17', 'R01', 'R02', 'R03'],
  },

  // === 自我/健康类 ===
  {
    id: 'rest',
    name: '休息',
    icon: '🌿',
    category: 'self',
    core_symptoms_driven: ['hyperactivity'],
    executive_functions_driven: ['switch', 'sustain'],
    common_frictions: [
      '休息时也停不下来',
      '放松会有愧疚感',
      '脑子里一直有事情在转',
      '休息了也觉得没恢复',
    ],
    typical_strategies: [
      '把"什么都不做"也排进时间表',
      '用身体活动来真正放松',
      '允许自己有"低效时间"',
    ],
    related_questions: ['C12', 'C13', 'E05', 'R04'],
  },
  {
    id: 'bedtime',
    name: '睡前',
    icon: '🌙',
    category: 'self',
    core_symptoms_driven: ['hyperactivity', 'inattention'],
    executive_functions_driven: ['switch', 'sustain'],
    common_frictions: [
      '脑子停不下来，越躺越清醒',
      '刷手机刷到很晚',
      '明明困了但不想睡',
      '睡前突然想起一堆没做的事',
    ],
    typical_strategies: [
      '建立固定的睡前仪式',
      '睡前把担心的事写下来',
      '卧室只用来睡觉，不做别的',
    ],
    related_questions: ['C12', 'C08', 'E05', 'R04'],
  },
  {
    id: 'interest_projects',
    name: '兴趣项目',
    icon: '✨',
    category: 'self',
    core_symptoms_driven: ['hyperactivity', 'impulsivity'],
    executive_functions_driven: ['start', 'sustain', 'finish'],
    common_frictions: [
      '开了很多新坑，很少完成',
      '兴趣来了投入很多，过一阵就放下',
      '器材买了一堆，没怎么用',
      '每个兴趣都学得很快但不深',
    ],
    typical_strategies: [
      '接受"兴趣可以浅尝"，不要有压力',
      '新项目设一个24小时冷却期再花钱',
      '把兴趣和社交绑定，增加持续动力',
    ],
    related_questions: ['C13', 'C14', 'E01', 'E08'],
  },
  {
    id: 'long_term_projects',
    name: '长期项目',
    icon: '🏔️',
    category: 'self',
    core_symptoms_driven: ['inattention', 'hyperactivity'],
    executive_functions_driven: ['sustain', 'time', 'finish', 'prioritize'],
    common_frictions: [
      '开始时冲很快，中途就掉速',
      '看不到进度就不想继续',
      '总在等"合适的时机"重新开始',
      '快到终点时反而最难推进',
    ],
    typical_strategies: [
      '把长期目标切成可衡量的小里程碑',
      '每完成一步就给自己奖励',
      '用公开承诺或同伴增加 accountability',
    ],
    related_questions: ['C02', 'C06', 'E06', 'E08'],
  },
];

// 获取所有场景ID
export const SCENE_IDS = SCENES_16.map((s) => s.id);

// 根据用户画像计算每个场景的"挑战预估分"（0-4）
// 基于场景关联的核心症状和执行功能的用户得分
export function estimateSceneChallenge(
  coreMeans: { inattention: number; hyperactivity: number; impulsivity: number },
  execFn: Record<string, number>
): Record<string, { core_challenge: number; exec_challenge: number; total: number }> {
  const result: Record<string, { core_challenge: number; exec_challenge: number; total: number }> = {};

  for (const scene of SCENES_16) {
    // 核心症状维度平均分
    const coreScores = scene.core_symptoms_driven.map((dim) => {
      if (dim === 'inattention') return coreMeans.inattention;
      if (dim === 'hyperactivity') return coreMeans.hyperactivity;
      if (dim === 'impulsivity') return coreMeans.impulsivity;
      return 2;
    });
    const core_challenge = coreScores.length > 0
      ? coreScores.reduce((a, b) => a + b, 0) / coreScores.length
      : 2;

    // 执行功能平均分
    const execScores = scene.executive_functions_driven.map((ef) => execFn[ef] ?? 2);
    const exec_challenge = execScores.length > 0
      ? execScores.reduce((a, b) => a + b, 0) / execScores.length
      : 2;

    result[scene.id] = {
      core_challenge: Math.round(core_challenge * 100) / 100,
      exec_challenge: Math.round(exec_challenge * 100) / 100,
      total: Math.round(((core_challenge + exec_challenge) / 2) * 100) / 100,
    };
  }

  return result;
}

// 获取最困扰的N个场景
export function getTopScenes(
  sceneChallenges: Record<string, { total: number }>,
  count: number = 5
): string[] {
  return Object.entries(sceneChallenges)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, count)
    .map(([id]) => id);
}
