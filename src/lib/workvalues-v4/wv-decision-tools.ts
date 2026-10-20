/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// QM 职业价值观测评 v4.0 — 决策工具
// 面试反问、谈判脚本、Offer 比较、Green/Red Flags、沟通模板
// 不推荐具体职业，不替用户做决定

import type {
  InterviewQuestion,
  NegotiationScript,
  OfferComparisonItem,
  GreenRedFlags,
  CommunicationTemplate,
  DimensionCode,
  EnvParamCode,
  DimensionScore,
} from './wv-types';
import { wvDimensions } from './wv-dimensions';
import {
  wvEnvParameters,
  ENV_PARAM_ORDER,
  compareOffers,
  type OfferOption,
  type OfferComparisonResult,
} from './wv-env-fit';

// ===== 面试反问清单 =====
// 按维度分类，帮助用户在面试中验证价值匹配度
export const interviewQuestions: Record<DimensionCode, InterviewQuestion[]> = {
  achievement: [
    {
      dimension: 'achievement',
      question: '这个岗位过去一年，做得最好的人做出了什么成果？',
      purpose: '了解团队对"好"的定义和标准',
      whatToListen: '对方能不能说出具体的成果和衡量标准，还是只有空泛的描述',
    },
    {
      dimension: 'achievement',
      question: '这个岗位的 KPI/OKR 是怎么设定的？由谁来评估？',
      purpose: '确认成就的衡量方式是否清晰',
      whatToListen: '指标是否具体、是否可实现、评估是否公平透明',
    },
    {
      dimension: 'achievement',
      question: '团队目前最大的挑战是什么？这个岗位能在其中发挥什么作用？',
      purpose: '看这个岗位有没有发挥空间和挑战性',
      whatToListen: '挑战是不是真实的、你能不能参与其中、做出贡献后有没有认可',
    },
  ],
  security: [
    {
      dimension: 'security',
      question: '这个团队和业务线过去一年的人员流动情况怎么样？',
      purpose: '了解团队稳定性',
      whatToListen: '流动率高不高、离开的人主要是什么原因、有没有业务调整的计划',
    },
    {
      dimension: 'security',
      question: '公司的业务前景和未来规划是怎样的？',
      purpose: '评估业务稳定性',
      whatToListen: '有没有明确的方向、盈利模式是否清晰、会不会有大的变动',
    },
    {
      dimension: 'security',
      question: '试用期政策和转正标准是什么？',
      purpose: '了解入职后的确定性',
      whatToListen: '试用期多长、转正标准是否明确、通过率大概多少',
    },
  ],
  autonomy: [
    {
      dimension: 'autonomy',
      question: '这个岗位的日常工作，有多大的决策空间？',
      purpose: '了解自主权大小',
      whatToListen: '哪些事情可以自己决定、哪些需要审批、汇报频率是多少',
    },
    {
      dimension: 'autonomy',
      question: '团队的管理风格是怎样的？更偏向结果导向还是过程导向？',
      purpose: '判断管理风格是否匹配',
      whatToListen: '领导是微操型还是授权型、看不看过程细节、容错空间有多大',
    },
    {
      dimension: 'autonomy',
      question: '如果我想尝试一些新的方法或工具，团队一般是什么态度？',
      purpose: '测试创新和自主的空间',
      whatToListen: '是否鼓励试错、有没有先例、需要走什么流程',
    },
  ],
  growth: [
    {
      dimension: 'growth',
      question: '这个岗位的晋升路径和成长空间是怎样的？',
      purpose: '了解长期发展可能性',
      whatToListen: '有没有明确的职级体系、上一个晋升的人用了多久、成长靠什么',
    },
    {
      dimension: 'growth',
      question: '团队有没有培训、学习或导师机制？',
      purpose: '看学习资源和支持',
      whatToListen: '有没有正式的培训、有没有人带、学习时间和资源有多少',
    },
    {
      dimension: 'growth',
      question: '在这个岗位上做得好的人，通常具备什么特点？',
      purpose: '了解成长需要的能力素质',
      whatToListen: '看重硬技能还是软实力、有没有你想发展的方向',
    },
  ],
  relation: [
    {
      dimension: 'relation',
      question: '团队的氛围和文化是怎样的？大家平时怎么协作？',
      purpose: '感受团队人际关系',
      whatToListen: '描述是否具体、有没有团队活动、合作方式是竞争还是协作',
    },
    {
      dimension: 'relation',
      question: '团队规模有多大？我会和哪些人经常合作？',
      purpose: '了解社交密度',
      whatToListen: '直接对接的人有多少、跨团队协作多不多、沟通方式是什么',
    },
    {
      dimension: 'relation',
      question: '团队里一般怎么处理冲突或不同意见？',
      purpose: '看沟通是否健康',
      whatToListen: '是回避冲突还是直面问题、有没有健康的讨论氛围',
    },
  ],
  meaning: [
    {
      dimension: 'meaning',
      question: '你觉得这份工作最有价值的部分是什么？',
      purpose: '从面试官的真实回答中感受意义感',
      whatToListen: '对方回答时是否真诚、有没有具体的故事和例子、还是只有套话',
    },
    {
      dimension: 'meaning',
      question: '公司的使命和价值观，在日常工作中是怎么体现的？',
      purpose: '验证价值观是否真实落地',
      whatToListen: '有没有具体的例子、是不是只是墙上的标语、决策时会不会考虑价值观',
    },
    {
      dimension: 'meaning',
      question: '这个产品/服务，用户或客户的真实反馈是怎样的？',
      purpose: '看工作的实际影响',
      whatToListen: '有没有用户故事、他们最感激的是什么、有没有负面反馈',
    },
  ],
  balance: [
    {
      dimension: 'balance',
      question: '团队的加班情况是怎样的？有没有弹性工作的可能？',
      purpose: '直接了解工作强度',
      whatToListen: '加班是常态还是项目期才有、最晚到几点、周末需不需要待命',
    },
    {
      dimension: 'balance',
      question: '年假政策是怎样的？大家一般能休完吗？',
      purpose: '看休息文化',
      whatToListen: '法定之外有没有额外年假、休假会不会有负罪感、领导带不带头休假',
    },
    {
      dimension: 'balance',
      question: '入职以后的前三个月，工作强度大概是什么样的？',
      purpose: '了解初期节奏',
      whatToListen: '有没有入职缓冲期、会不会一上来就高强度、有没有人带',
    },
  ],
  reward: [
    {
      dimension: 'reward',
      question: '完整的薪酬包是怎样的？基本工资、奖金、福利分别是什么结构？',
      purpose: '了解全景薪酬',
      whatToListen: '底薪占比多少、奖金怎么算、有没有期权/股票、调薪机制是什么',
    },
    {
      dimension: 'reward',
      question: '调薪的频率和机制是怎样的？',
      purpose: '看收入增长空间',
      whatToListen: '多久调一次、依据是什么、平均调幅是多少、有没有天花板',
    },
    {
      dimension: 'reward',
      question: '除了工资，还有哪些其他福利？',
      purpose: '了解完整福利',
      whatToListen: '社保公积金基数、补充医疗、餐补交通补、学习培训预算等',
    },
  ],
};

// 根据 Top3 维度获取推荐的面试问题
export function getRecommendedInterviewQuestions(
  topDimensions: DimensionCode[],
  perDimension = 2,
): InterviewQuestion[] {
  const result: InterviewQuestion[] = [];
  for (const dim of topDimensions) {
    const qs = interviewQuestions[dim] || [];
    result.push(...qs.slice(0, perDimension));
  }
  return result;
}

// ===== Value Negotiation Script 谈判脚本 =====
export const negotiationScripts: NegotiationScript[] = [
  {
    scene: '薪资谈判',
    dimension: 'reward',
    opening: '谢谢offer，我对这个机会很感兴趣。在做决定之前，我想再确认一下薪资方面的细节。',
    valueStatement: '根据我对这个岗位的理解和我目前的经验，我期望的薪资范围是 X 到 Y。',
    proposal: '不知道这个区间是否在团队的预算范围内？如果base有困难，我们也可以看看在奖金、期权或其他福利方面有没有调整空间。',
    fallback: '如果薪资暂时到不了我的预期，我也想了解一下：入职后表现好的话，多久会有调薪的机会？',
  },
  {
    scene: '争取弹性工作',
    dimension: 'balance',
    opening: '我想跟您聊一下工作方式的问题。我很认可团队的方向，同时我也想确保自己能长期保持好的状态。',
    valueStatement: '根据我过去的经验，当我有一定弹性的时候，产出反而更高、也更可持续。',
    proposal: '不知道团队有没有远程或弹性工作的可能？比如每周有1-2天可以在家办公，或者弹性上下班时间。',
    fallback: '如果现在还不行的话，我也理解。那我们可以先入职，等我证明了自己的产出之后再讨论这个可能性吗？',
  },
  {
    scene: '争取更多自主权',
    dimension: 'autonomy',
    opening: '关于这个岗位的工作方式，我想跟您聊一下我的想法。',
    valueStatement: '我过去的经验是，当我对过程有一定决定权的时候，最终的结果往往更好。',
    proposal: '不知道在这个岗位上，我可以在多大程度上自己决定工作方式？您更希望我先多请示，还是可以先做了再同步？',
    fallback: '我也理解每个团队有自己的节奏。我可以先按照团队的方式来，等我们建立了信任之后再调整吗？',
  },
  {
    scene: '争取成长资源',
    dimension: 'growth',
    opening: '我对这个机会的成长空间很期待，想了解一下具体有哪些学习和发展的资源。',
    valueStatement: '对我来说，能持续成长是长期留在一个团队的重要因素。',
    proposal: '团队有没有培训预算或者学习支持？比如参加会议、课程、或者有导师的指导？',
    fallback: '如果正式的培训资源有限，那团队里有没有好的学习氛围？比如分享会、code review、或者前辈带新人的机制？',
  },
];

// ===== Green / Red Flags =====
export const greenRedFlags: Record<DimensionCode, GreenRedFlags> = {
  achievement: {
    dimension: 'achievement',
    greenFlags: [
      '有明确的目标和衡量标准',
      '团队里有人因为做得好而被认可和晋升',
      '领导看重结果，也愿意给资源',
      '能说出具体的成功案例',
    ],
    redFlags: [
      '说不清"做得好"是什么标准',
      '功劳都是领导的，出了事都是底下的',
      '永远在救火，没有沉淀和积累',
      '强调"奉献"和"情怀"，但不谈回报和认可',
    ],
  },
  security: {
    dimension: 'security',
    greenFlags: [
      '业务模式清晰，盈利稳定',
      '人员流动率在合理范围',
      '公司有长期规划，不是走一步看一步',
      '福利保障齐全且规范',
    ],
    redFlags: [
      '业务方向频繁变动，说不清楚未来在哪',
      '团队人员流动很大，老员工没几个',
      '对试用期、合同期限等问题含糊其辞',
      '频繁融资/烧钱，但没有清晰的盈利模式',
    ],
  },
  autonomy: {
    dimension: 'autonomy',
    greenFlags: [
      '领导告诉你目标，但不规定你怎么走',
      '允许试错，失败了一起复盘而不是指责',
      '开会少，沟通高效',
      '团队里每个人都有自己负责的一块',
    ],
    redFlags: [
      '事无巨细都要汇报和审批',
      '领导喜欢盯着过程，一天催好几次进度',
      '什么事都要开会决定，效率很低',
      '嘴上说"相信你"，实际什么都要插手',
    ],
  },
  growth: {
    dimension: 'growth',
    greenFlags: [
      '有明确的职级体系和晋升路径',
      '团队里有比你厉害的人，可以学习',
      '有培训预算和学习支持',
      '业务在扩张，有新的机会和挑战',
    ],
    redFlags: [
      '说不清晋升标准，全靠老板说了算',
      '团队里全是新人，没有资深的人带',
      '业务成熟稳定，但也没什么新东西可学',
      '强调"干中学"，但不给资源也不给反馈',
    ],
  },
  relation: {
    dimension: 'relation',
    greenFlags: [
      '面试时能感受到团队氛围自然、不装',
      '同事之间有说有笑，关系平等',
      '有正常的团建和非正式交流',
      '团队成员背景多元，能包容不同的人',
    ],
    redFlags: [
      '面试时所有人都很"职业化"，感受不到真人的温度',
      '面试官说离职的人都是"能力不行"',
      '团队里只有一种声音，听不到不同意见',
      '领导明显偏爱某些人，任人唯亲',
    ],
  },
  meaning: {
    dimension: 'meaning',
    greenFlags: [
      '谈到工作的价值时，面试官眼睛会亮',
      '能说出具体的用户故事和真实影响',
      '公司的价值观体现在具体决策里',
      '员工自己也相信产品/服务的价值',
    ],
    redFlags: [
      '只会说宏大的使命，但说不出具体做了什么',
      '价值观只挂在墙上，和实际行为相反',
      '夸大自己的社会价值，经不起追问',
      '用"情怀"和"意义"来压低工资',
    ],
  },
  balance: {
    dimension: 'balance',
    greenFlags: [
      '能坦诚地说清楚加班情况，不美化',
      '有明确的上下班时间和假期政策',
      '领导自己也准时下班、正常休假',
      '加班有补偿（调休或加班费）',
    ],
    redFlags: [
      '说"我们不强制加班"但暗示大家都在加',
      '问加班情况时含糊其辞，说"看项目"',
      '领导自己天天熬到很晚，也期待员工这样',
      '年假很多但没人敢休',
    ],
  },
  reward: {
    dimension: 'reward',
    greenFlags: [
      '薪资结构透明，说得清楚每一部分',
      '有明确的调薪机制和时间点',
      '奖金计算方式清晰，不是凭感觉',
      '福利齐全，社保公积金按规定缴纳',
    ],
    redFlags: [
      '薪资范围很宽，实际给多少全看谈判',
      '说不清调薪机制，说"看表现"',
      '奖金承诺很高但兑现不了',
      '底薪很低，全靠绩效，而且绩效标准模糊',
    ],
  },
};

// ===== 沟通模板 =====
export const communicationTemplates: CommunicationTemplate[] = [
  {
    situation: '和主管谈工作边界/减少加班',
    audience: 'manager',
    template:
      '想跟您聊一下我最近的工作节奏。我很重视团队的目标，也想确保自己能长期保持好的状态。' +
      '目前我负责的 [具体项目] 进展是 [进展情况]，' +
      '我注意到最近加班比较多，长期来看可能影响产出质量。' +
      '我想我们可以一起看看：有没有哪些事情可以调整优先级，或者换一种方式做？' +
      '我希望既能保证交付，也能保持可持续的节奏。您觉得呢？',
    valueAnchor: 'balance',
  },
  {
    situation: '和主管谈职业发展/晋升',
    audience: 'manager',
    template:
      '想跟您聊聊我在团队的成长规划。我在这边学到了很多，也很想继续贡献更多。' +
      '想了解一下：从您的角度看，我目前的优势和可以提升的地方是什么？' +
      '另外，如果我想往 [目标方向] 发展，您觉得我需要在哪些方面努力？' +
      '大概需要多久、达到什么标准，我们可以考虑下一步的发展？',
    valueAnchor: 'growth',
  },
  {
    situation: '和 HR 谈薪资',
    audience: 'hr',
    template:
      '感谢您的 offer，我对这个机会很认可。' +
      '关于薪资，我想再确认一下：目前的 package 是 [复述对方的offer]，对吗？' +
      '根据我对岗位的理解和我过往的经验，我期望的薪资范围是 [你的期望]。' +
      '不知道这个区间有没有可能？如果base有困难，我们也可以看看在 [奖金/期权/福利] 方面有没有调整空间。' +
      '我很想加入团队，也希望我们能找到一个双方都满意的方案。',
    valueAnchor: 'reward',
  },
  {
    situation: '和主管谈更多自主权',
    audience: 'manager',
    template:
      '想跟您聊聊 [具体项目] 的工作方式。' +
      '这段时间我对这块业务越来越熟悉了，我想尝试更多地自己来做决策和推进。' +
      '我会定期跟您同步进展和风险，关键节点也会提前跟您确认。' +
      '您觉得这样可以吗？如果有什么您特别在意的点，也请告诉我，我会重点关注。',
    valueAnchor: 'autonomy',
  },
  {
    situation: '和同事谈冲突/分歧',
    audience: 'colleague',
    template:
      '关于 [具体事情]，我注意到我们有一些不同的看法。我想跟你聊一下，把话说开。' +
      '我这边的考虑是 [你的想法和原因]。' +
      '我也想听听你的角度——你最在意的是什么？' +
      '也许我们可以一起找一个双方都能接受的方案。你觉得呢？',
    valueAnchor: 'relation',
  },
];

// ===== 导出辅助函数 =====

// 获取维度对应的 Green/Red Flags
export function getGreenRedFlags(dim: DimensionCode): GreenRedFlags | undefined {
  return greenRedFlags[dim];
}

// 根据 Top3 维度获取优先级最高的沟通模板
export function getRecommendedTemplates(
  topDimensions: DimensionCode[],
): CommunicationTemplate[] {
  return communicationTemplates.filter((t) =>
    topDimensions.includes(t.valueAnchor),
  );
}

// 重新导出 Offer 比较功能
export { compareOffers };
export type { OfferOption, OfferComparisonResult };
