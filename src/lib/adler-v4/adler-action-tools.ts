/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// QM 阿德勒指数 v4.0 — 行动工具库
// Belonging Check / Contribution Experiment / Private Logic Reframe /
// Life Task Conversation / Boundary Script / Goal Alignment / 7-Day Board

import type { ActionTool, SevenDayBoard, CourageMicroStep, DimensionCode, LensCode, LifeTaskCode } from './adler-types';

// 7 个行动工具
export const adlerActionTools: ActionTool[] = [
  {
    id: 'belonging-check',
    name: '归属检查',
    icon: '🏠',
    description:
      '在感到孤单或不确定的时候，做一个小小的"归属检查"——' +
      '看看你身边有哪些人或群体，让你多多少少感到"我属于这里"。',
    relatedLens: ['belonging'],
    relatedDimensions: ['D', 'B'],
    steps: [
      '拿出一张纸或手机备忘录，写下3个让你感到"我属于这里"的人或群体。',
      '对每个对象，写一个具体的瞬间——什么时候、发生了什么、你有什么感受。',
      '想一想：这些关系给了你什么？你又为这些关系贡献了什么？',
      '今天主动联系其中一个人，说一句真诚的话。',
    ],
    prompt:
      '我想做一个归属检查。请帮我看看：在我目前的生活中，' +
      '有哪些人和群体让我感到连接？我可以怎么珍惜和维护这些关系？',
  },
  {
    id: 'contribution-experiment',
    name: '贡献小实验',
    icon: '💝',
    description:
      '做一个为期一天的贡献小实验——找一件很小的、不求回报的事去做，' +
      '然后注意自己做完之后的感受。',
    relatedLens: ['contribution', 'encouragement'],
    relatedDimensions: ['D', 'C'],
    steps: [
      '选一个你想做贡献的对象：可以是一个人、一只动物、一个群体，甚至是环境。',
      '做一件很小的、不期待回报的事。比如：帮陌生人开个门、给朋友发一句感谢、给植物浇水。',
      '做完之后，停下来感受一下：你的身体有什么感觉？心里有什么感受？',
      '不用评判这个感受好不好，只是注意到它就好。',
    ],
    prompt:
      '我想做一个贡献小实验。请帮我想一个适合我今天做的、很小的贡献行动，' +
      '然后帮我反思做完之后的感受。',
  },
  {
    id: 'private-logic-reframe',
    name: '私人逻辑换框',
    icon: '🔄',
    description:
      '当你被某个想法困住的时候，试着找出你背后的"私人逻辑"——' +
      '也就是你假设的"如果……就一定……"，然后看看有没有其他的可能性。',
    relatedLens: ['private_logic', 'safeguarding_tendencies'],
    relatedDimensions: ['B', 'C'],
    steps: [
      '描述一下困扰你的情境：发生了什么？你在想什么？',
      '找出你的"私人逻辑"：你在假设什么？比如"如果我拒绝TA，TA就不会喜欢我了"。',
      '问自己：这个假设是从哪里来的？它一定是真的吗？',
      '想出至少2种其他的可能性。比如："也许TA会理解"、"也许不喜欢也没关系"。',
      '如果用其中一种新的解释来看这件事，你的感受会有什么不一样？',
    ],
    prompt:
      '我被一个想法困住了。请帮我找出我背后的私人逻辑，' +
      '然后一起想想有没有其他的解释方式。',
  },
  {
    id: 'life-task-conversation',
    name: '生活任务对话',
    icon: '💬',
    description:
      '和自己来一场关于生活任务的对话——看看你目前在工作、友谊、爱、' +
      '自我关系、共同体这五个领域的状态分别是什么样的。',
    relatedLens: ['life_tasks', 'meaning'],
    relatedDimensions: ['A', 'D'],
    steps: [
      '依次思考五个生活任务：友谊、工作、爱（亲密关系）、自我关系、共同体。',
      '对每个领域，问自己三个问题：目前满意吗？投入了多少？想改变什么？',
      '找出你目前最想关注的一个生活任务。',
      '想一个很小的、可以在本周开始的行动。',
    ],
    prompt:
      '我想和自己做一个生活任务对话。请帮我看看我在友谊、工作、爱、' +
      '自我关系、共同体这五个领域的状态，然后找出我最需要关注的一个。',
  },
  {
    id: 'boundary-script',
    name: '边界脚本',
    icon: '🚧',
    description:
      '为一个你想设置边界的场景，准备一个清晰但温和的表达脚本。' +
      '边界不是墙，是可以调整的门。',
    relatedLens: ['safeguarding_tendencies', 'belonging'],
    relatedDimensions: ['B', 'A'],
    steps: [
      '确定你想设置边界的具体情境：和谁、关于什么事。',
      '想清楚你的底线是什么：你愿意接受到什么程度？到了哪一步你需要说"不"？',
      '写一个"我语句"脚本：我感到___，因为___，我希望___。',
      '练习说出来，可以在镜子前练，也可以和信任的人一起练。',
      '记住：设置边界后对方可能有情绪，那是对方的课题，不是你的错。',
    ],
    prompt:
      '我想在一件事上设置边界。请帮我写一个清晰但温和的表达脚本，' +
      '然后陪我练习一下。',
  },
  {
    id: 'goal-alignment',
    name: '目标对齐',
    icon: '🎯',
    description:
      '检查一下你现在正在追求的目标，和你真正在乎的东西是不是对齐的。' +
      '有时候我们跑得太快，忘了为什么出发。',
    relatedLens: ['goal_orientation', 'meaning'],
    relatedDimensions: ['A', 'C'],
    steps: [
      '写下你目前在追求的1-3个主要目标。',
      '对每个目标，问自己：这真的是我想要的吗？还是别人期待我的？',
      '再问：这个目标背后，我真正想要的感受是什么？（比如：被认可、自由、安全、意义）',
      '有没有其他方式，可以获得同样的感受，而不用追求那个目标？',
      '如果这个目标不需要"证明什么"，你还想做吗？',
    ],
    prompt:
      '我想检查一下我的目标和我真正在乎的东西是不是对齐的。' +
      '请帮我做一个目标对齐的练习。',
  },
  {
    id: 'seven-day-board',
    name: '7 天阿德勒练习板',
    icon: '📅',
    description:
      '用7天时间，每天一个小练习，从归属、行动、接纳、方向四个角度，' +
      '慢慢把阿德勒的视角带进日常生活。',
    relatedLens: ['encouragement', 'belonging', 'contribution'],
    relatedDimensions: ['A', 'B', 'C', 'D'],
    steps: [
      '第一天：归属——找出3个让你感到"我属于这里"的瞬间。',
      '第二天：行动——做一件你一直想做但没做的小事。',
      '第三天：接纳——允许自己有一件事做不好。',
      '第四天：方向——写下你最近在意的一件事的"为什么"。',
      '第五天：贡献——做一件不求回报的小事。',
      '第六天：边界——练习说一个"不"，或者在心里说。',
      '第七天：回顾——看看这一周，你有什么新的发现？',
    ],
    prompt:
      '我想做一个7天的阿德勒练习。请根据我的结果，为我定制一个' +
      '7天练习板，每天有一个小行动和一个观察问题。',
  },
];

export function getActionTool(id: string): ActionTool | undefined {
  return adlerActionTools.find((t) => t.id === id);
}

// 生成 7 天练习板
export function generateSevenDayBoard(
  focusLifeTask: LifeTaskCode,
  scores: Record<string, number>,
): SevenDayBoard {
  const lifeTaskNames: Record<LifeTaskCode, string> = {
    friendship: '友谊',
    work: '工作',
    love: '爱与亲密',
    self: '自我关系',
    community: '共同体',
  };

  const dailyObservations = [
    '今天有没有一个瞬间，让你感到"我属于这里"？',
    '今天你做了一个什么选择？那个选择背后，你在在乎什么？',
    '今天你有没有允许自己"不够好"的时刻？',
    '今天做的事情里，有哪一件是和你的方向一致的？',
    '今天你为别人做了什么？或者，别人为你做了什么？',
    '今天你有没有设置一个边界？或者想设但没设的？',
    '这周下来，你对自己有什么新的发现？',
  ];

  const dailyActions = [
    '对一个帮助过你的人，说一声具体的谢谢。',
    '做一个你一直在想但没行动的小决定。',
    '做一件"允许自己不完美"的小事。',
    '写下你最近做的一件事的"为什么"。',
    '做一件很小的、不求回报的事。',
    '在心里练习一个你想说的"不"。',
    '回顾这一周，写下一个你最有感觉的发现。',
  ];

  return {
    title: `7 天阿德勒练习 · 聚焦${lifeTaskNames[focusLifeTask]}`,
    description:
      '每天一个小行动和一个观察问题。不用全部做到，能做多少算多少。' +
      '重要的是你开始了，而不是做得好不好。',
    focusLifeTask,
    dailyStructure: Array.from({ length: 7 }, (_, i) => ({
      day: i + 1,
      lifeTask: lifeTaskNames[focusLifeTask],
      belonging: `第${i + 1}天 · 感受一下你和${lifeTaskNames[focusLifeTask]}的连接`,
      actionStep: dailyActions[i],
      acceptance: '允许自己今天只做这么多',
      direction: `往${lifeTaskNames[focusLifeTask]}的方向，挪一小步`,
      observation: dailyObservations[i],
    })),
  };
}

// 生成 Courage Micro-Step（24 小时微行动）
export function generateCourageMicroStep(
  lowestDimension: DimensionCode,
  relatedLens: LensCode,
): CourageMicroStep {
  const microSteps: Record<DimensionCode, { gentle: string; medium: string; stretch: string; title: string; description: string }> = {
    A: {
      title: '选择小步',
      description: '找出一件你觉得"没办法"的事，在里面找到一个最小的选择。',
      gentle: '今天只是注意到：有哪些时刻你觉得"没办法"？不用改变什么，只是看见。',
      medium: '在一件你觉得"没办法"的事里，找出一个最小的、你还能做的动作，然后去做。',
      stretch: '做一个你一直犹豫的决定，然后注意做完之后的感受——不管结果如何，你愿意选择就是勇气。',
    },
    B: {
      title: '边界练习',
      description: '在一件小事上，练习说清楚你的需要或底线。',
      gentle: '今天在心里想一件你想设置边界的事，在心里练习说那句话。不用说出口。',
      medium: '找一个小机会，用"我语句"表达你的一个需要。比如"我今天想早点休息"。',
      stretch: '对一件你一直不想做的事，说一次"不"。说完之后，允许自己有任何情绪。',
    },
    C: {
      title: '勇气微步',
      description: '做一件你有点害怕但又觉得重要的小事。',
      gentle: '今天列出3件你因为害怕而没做的事。不用去做，只是写下来就好。',
      medium: '选其中最小的一件事，拆成一个5分钟就能完成的小行动，然后去做。',
      stretch: '做一件你一直想做但不敢的事——一个最小版本的。不管结果如何，你愿意试就已经很勇敢了。',
    },
    D: {
      title: '连接小行动',
      description: '做一个小小的、主动的连接动作。',
      gentle: '今天想一想：有哪些人让你感到"我属于这里"？把它们在心里过一遍。',
      medium: '主动联系一个你在乎的人，说一句真诚的话——可以是感谢、可以是问候。',
      stretch: '向一个人请求帮助。不管对方怎么回应，你愿意开口就已经是一种连接了。',
    },
  };

  const m = microSteps[lowestDimension];

  return {
    title: m.title,
    description: m.description,
    steps: {
      gentle: m.gentle,
      medium: m.medium,
      stretch: m.stretch,
    },
    relatedDimension: lowestDimension,
    relatedLens,
  };
}
