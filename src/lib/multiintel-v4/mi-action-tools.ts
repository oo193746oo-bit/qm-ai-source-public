/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// QM AI 多元智能测评 v4.0 — 行动工具
// 学习食谱、项目角色卡、沟通翻译器、技能练习菜单、七日实验

import type {
  DimensionScore,
  LearningRecipe,
  ProjectRoleCard,
  CommunicationTranslation,
  SkillPracticeMenu,
  WeeklyExperiment,
  DimensionCode,
} from './mi-types';
import { miDimensions } from './mi-dimensions';

// ===== 学习食谱（8个） =====
const LEARNING_RECIPES: LearningRecipe[] = [
  {
    id: 'recipe-01',
    title: '费曼学习法（语言+逻辑）',
    description: '用自己的话把学到的东西讲给别人听，讲不清楚的地方回去复习，直到能用简单的语言说清楚。',
    steps: [
      '选择一个你想学习的概念或主题',
      '想象你要把它讲给一个完全不懂的人听',
      '用自己的话写下来或说出来',
      '遇到讲不清楚的地方，回去翻书或查资料',
      '再讲一遍，看看是不是更清楚了',
      '最后试着用更简单的语言重新表述',
    ],
    bestFor: ['linguistic', 'logical'],
  },
  {
    id: 'recipe-02',
    title: '思维导图学习法（空间+逻辑）',
    description: '把学到的知识画成思维导图，用图像和结构来帮助记忆和理解。',
    steps: [
      '准备一张纸和笔，或打开思维导图软件',
      '把主题写在纸的中央',
      '从中央向外辐射出主要的分支（大分类）',
      '在每个分支上继续添加更细的知识点',
      '用不同颜色、图标、关键词来标注',
      '学完后看着导图复述一遍内容',
    ],
    bestFor: ['spatial', 'logical'],
  },
  {
    id: 'recipe-03',
    title: '做中学（动觉+自然）',
    description: '不只是看书听课，而是动手做实验、动手实践，在做的过程中学习。',
    steps: [
      '先快速浏览一下要学的内容，有个大概印象',
      '找到一个可以动手实践的方式',
      '直接开始做，遇到问题再查资料',
      '做错了也没关系，观察结果，调整方法',
      '做完后总结：我学到了什么？哪里和预期不一样？',
      '再做一次，看看是不是更熟练了',
    ],
    bestFor: ['bodily', 'naturalist'],
  },
  {
    id: 'recipe-04',
    title: '讨论学习法（人际+语言）',
    description: '和别人一起讨论、互相提问、共同探索，在对话中深化理解。',
    steps: [
      '找一个或几个学习伙伴',
      '每个人先自己预习要讨论的内容',
      '约定一个讨论主题或问题',
      '轮流分享自己的理解和疑问',
      '互相提问、挑战、补充',
      '讨论结束后各自写一段总结',
    ],
    bestFor: ['interpersonal', 'linguistic'],
  },
  {
    id: 'recipe-05',
    title: '音乐记忆法（音乐+语言）',
    description: '把要记的内容配上节奏或旋律，用音乐的力量帮助记忆。',
    steps: [
      '选择你要记忆的内容（单词、公式、知识点等）',
      '找一首你熟悉的歌的节奏',
      '把内容编成有节奏的句子或rap',
      '或者直接把内容套进熟悉的旋律里唱出来',
      '反复唱几遍，让节奏和内容一起记住',
      '需要回忆的时候，先想起旋律，内容自然就出来了',
    ],
    bestFor: ['musical', 'linguistic'],
  },
  {
    id: 'recipe-06',
    title: '内省式学习（内省+逻辑）',
    description: '先独自消化，把新知识和自己的经验连接起来，在反思中深化理解。',
    steps: [
      '找一段安静的时间，先阅读或听要学习的内容',
      '合上书，问问自己：我学到了什么？',
      '这和我以前知道的有什么联系？',
      '这让我想起了什么经历？',
      '我有什么疑问或不同的看法？',
      '把这些思考写下来，整理成自己的理解',
    ],
    bestFor: ['intrapersonal', 'logical'],
  },
  {
    id: 'recipe-07',
    title: '自然观察学习法（自然+空间）',
    description: '到真实的环境中去观察、去体验，从具体的事物中学习抽象的知识。',
    steps: [
      '确定你要学习的主题（比如植物、地质、生态等）',
      '找一个可以观察实物的地方（公园、植物园、野外等）',
      '带上笔记本和笔，或者手机拍照',
      '慢慢走，仔细观察，记录你看到的东西',
      '观察后查资料，把看到的和书本上的知识对应起来',
      '过一段时间再去观察一次，看看有没有新的发现',
    ],
    bestFor: ['naturalist', 'spatial'],
  },
  {
    id: 'recipe-08',
    title: '混合通道学习法（多通道并用）',
    description: '同时使用多种智能通道来学习同一内容，让不同的方式互相补充。',
    steps: [
      '选择一个学习主题',
      '先用你最擅长的方式学一遍',
      '再用你不太常用的方式学一遍',
      '比如：先读一遍（语言），再画个图（空间），然后讲给别人听（人际）',
      '最后动手做一次（动觉）来验证',
      '不同方式之间互相印证，理解会更深刻',
    ],
    bestFor: ['linguistic', 'spatial', 'bodily'],
  },
];

export function getLearningRecipes(scores: DimensionScore[]): LearningRecipe[] {
  const scoreMap = new Map<DimensionCode, number>();
  for (const s of scores) scoreMap.set(s.dimension, s.score);

  // 计算每个食谱的匹配度
  const scored = LEARNING_RECIPES.map((r) => {
    let score = 0;
    for (const dim of r.bestFor) {
      score += scoreMap.get(dim) ?? 50;
    }
    score = score / r.bestFor.length;
    return { recipe: r, score };
  });

  scored.sort((a, b) => b.score - a.score);

  // 返回前 5-6 个
  return scored.slice(0, 6).map((s) => s.recipe);
}

// ===== 项目角色卡（6个） =====
const PROJECT_ROLE_CARDS: ProjectRoleCard[] = [
  {
    role: '思路开拓者',
    description: '擅长提出新想法、发现新方向，打开团队的视野和可能性。',
    strengths: ['发散思维', '创意联想', '跨界连接', '发现新机会'],
    watchOut: ['可能想法太多，难以聚焦', '有时候不切实际', '不喜欢细节'],
    bestFor: ['spatial', 'musical', 'naturalist'],
  },
  {
    role: '逻辑架构师',
    description: '擅长把事情拆清楚、理出结构，让复杂变得有条理。',
    strengths: ['分析能力', '结构化思维', '找规律', '发现问题核心'],
    watchOut: ['可能过度分析导致行动慢', '太看重逻辑忽略感受', '容易钻牛角尖'],
    bestFor: ['logical', 'spatial'],
  },
  {
    role: '行动执行者',
    description: '擅长把想法落地，动手做、快速试错、推进事情往前走。',
    strengths: ['动手能力', '执行力', '快速试错', '实际操作'],
    watchOut: ['可能想得少做得多', '容易忽略大局', '不喜欢坐下来讨论'],
    bestFor: ['bodily', 'logical'],
  },
  {
    role: '关系协调者',
    description: '擅长照顾团队氛围、促进沟通、让大家合作愉快。',
    strengths: ['团队凝聚', '沟通协调', '理解他人', '冲突调解'],
    watchOut: ['可能为了和谐回避冲突', '容易忽略任务本身', '太在意别人的感受'],
    bestFor: ['interpersonal', 'linguistic'],
  },
  {
    role: '内省观察者',
    description: '擅长深度思考、自我觉察，能从更高的视角看问题。',
    strengths: ['深度思考', '自我觉察', '价值判断', '长期视角'],
    watchOut: ['可能想太多行动少', '不容易被理解', '在团队中显得沉默'],
    bestFor: ['intrapersonal', 'logical'],
  },
  {
    role: '表达传播者',
    description: '擅长把想法说清楚、写明白，让更多人理解和接受。',
    strengths: ['语言表达', '故事讲述', '说服影响', '信息整理'],
    watchOut: ['可能说得多做得少', '容易过度包装', '有时候只看表面'],
    bestFor: ['linguistic', 'interpersonal'],
  },
];

export function getProjectRoleCards(scores: DimensionScore[]): ProjectRoleCard[] {
  const scoreMap = new Map<DimensionCode, number>();
  for (const s of scores) scoreMap.set(s.dimension, s.score);

  const scored = PROJECT_ROLE_CARDS.map((c) => {
    let score = 0;
    for (const dim of c.bestFor) {
      score += scoreMap.get(dim) ?? 50;
    }
    score = score / c.bestFor.length;
    return { card: c, score };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.map((s) => s.card);
}

// ===== 沟通翻译器（8组） =====
const COMMUNICATION_TRANSLATIONS: CommunicationTranslation[] = [
  {
    from: 'logical',
    to: 'interpersonal',
    scenario: '和伴侣讨论一个问题，你讲逻辑，对方更在乎感受',
    originalStyle: '你觉得对方不讲道理，一直在摆事实讲道理',
    translationTip: '先说"我理解你的感受"，再讲你的看法。先连接情绪，再聊事情本身。',
  },
  {
    from: 'interpersonal',
    to: 'logical',
    scenario: '和一个特别讲逻辑的人沟通，对方觉得你太感情用事',
    originalStyle: '你一直在说感受和关系，对方觉得你绕来绕去不说重点',
    translationTip: '先把你的观点和理由列清楚，再补充你的感受。先用逻辑建立共识，再分享感受。',
  },
  {
    from: 'linguistic',
    to: 'spatial',
    scenario: '向一个视觉型的人解释一个复杂的概念',
    originalStyle: '你讲了一大堆，对方还是一脸困惑',
    translationTip: '画个图、列个表、或者做个简单的比喻。用视觉方式辅助语言，效果翻倍。',
  },
  {
    from: 'spatial',
    to: 'linguistic',
    scenario: '和一个特别文字型的人沟通，你觉得你画的图他们看不懂',
    originalStyle: '你觉得已经画得很清楚了，对方还是问"这是什么意思"',
    translationTip: '图旁边加上清晰的文字说明，用语言把结构讲出来。让语言和图像互相补充。',
  },
  {
    from: 'intrapersonal',
    to: 'interpersonal',
    scenario: '你习惯独自思考，但对方需要很多互动和讨论',
    originalStyle: '你觉得还没想清楚不想说，对方觉得你冷淡或不参与',
    translationTip: '告诉对方"我需要一点时间想想，想好了再和你讨论"，让对方知道你不是不关心，只是需要独处整理。',
  },
  {
    from: 'interpersonal',
    to: 'intrapersonal',
    scenario: '你很想聊聊，但对方需要独处时间来消化',
    originalStyle: '你一直在找对方聊天，对方觉得被打扰、压力大',
    translationTip: '先问一句"你现在想聊吗？"如果对方说想一个人待着，不要以为是针对你。给对方空间，等对方准备好了自然会来找你。',
  },
  {
    from: 'bodily',
    to: 'linguistic',
    scenario: '你习惯动手做，但对方需要先听详细说明',
    originalStyle: '你直接上手做了，对方觉得你太冲动、没想清楚',
    translationTip: '做之前先说一句"我先试试看，边做边跟你说我的想法"，让对方知道你的思路，而不是只看到你在动。',
  },
  {
    from: 'musical',
    to: 'logical',
    scenario: '你凭感觉做决定，对方觉得你太感性、没依据',
    originalStyle: '你说"我觉得就是这样"，对方觉得你没有分析过程',
    translationTip: '把你的感觉拆解开来说："我注意到这几个信号，让我觉得……" 让对方看到你感觉背后的观察。',
  },
];

export function getCommunicationTranslations(
  scores: DimensionScore[],
): CommunicationTranslation[] {
  const scoreMap = new Map<DimensionCode, number>();
  for (const s of scores) scoreMap.set(s.dimension, s.score);

  // 返回所有 8 组，但按相关度排序
  const scored = COMMUNICATION_TRANSLATIONS.map((t) => {
    const fromScore = scoreMap.get(t.from) ?? 50;
    const toScore = 100 - (scoreMap.get(t.to) ?? 50); // 分数越低越可能需要翻译
    return { trans: t, score: (fromScore + toScore) / 2 };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.map((s) => s.trans);
}

// ===== 技能练习菜单（8维×3等级） =====
const SKILL_PRACTICE: SkillPracticeMenu[] = [
  // 语言
  {
    dimension: 'linguistic',
    level: 'beginner',
    practices: [
      '每天写 3 句话日记，记录当天的感受',
      '读书时遇到喜欢的句子，抄写下来',
      '尝试用不同的词表达同一个意思',
    ],
  },
  {
    dimension: 'linguistic',
    level: 'intermediate',
    practices: [
      '每周写一篇短文（300字以上），可以是感想也可以是故事',
      '和朋友进行一次深度对话，练习倾听和表达',
      '学一个新的表达方式，用在当天的生活里',
    ],
  },
  {
    dimension: 'linguistic',
    level: 'advanced',
    practices: [
      '尝试写一篇完整的文章或故事并分享给别人',
      '学习一门新的语言，感受不同语言的思维方式',
      '参加写作工作坊或读书会，和他人切磋交流',
    ],
  },
  // 逻辑
  {
    dimension: 'logical',
    level: 'beginner',
    practices: [
      '做决定前列 2-3 个理由，训练结构化思考',
      '试着找出一件事的因果关系：为什么会这样？',
      '玩简单的逻辑小游戏或数独',
    ],
  },
  {
    dimension: 'logical',
    level: 'intermediate',
    practices: [
      '读一本关于批判性思维的书，边读边做笔记',
      '分析一个你感兴趣的问题，画出它的逻辑结构',
      '和朋友辩论一个话题，练习有条理地表达观点',
    ],
  },
  {
    dimension: 'logical',
    level: 'advanced',
    practices: [
      '尝试解决一个稍微超出你能力的复杂问题',
      '学习一门你不熟悉的学科，感受新的思维方式',
      '把你学到的一个理论用在真实生活中，检验它的适用性',
    ],
  },
  // 空间
  {
    dimension: 'spatial',
    level: 'beginner',
    practices: [
      '学画简单的思维导图来整理想法',
      '在陌生的地方试着不用导航，靠感觉找路',
      '用积木、乐高或其他东西搭一个小结构',
    ],
  },
  {
    dimension: 'spatial',
    level: 'intermediate',
    practices: [
      '学习画简单的速写或插画，不用追求画得好',
      '重新布置一下你的房间或书桌，让空间更顺眼',
      '尝试做一次手工（折纸、编织、陶艺等）',
    ],
  },
  {
    dimension: 'spatial',
    level: 'advanced',
    practices: [
      '学习 3D 建模或空间设计软件',
      '尝试摄影，练习构图和光影的感觉',
      '设计一个小型空间改造方案并实施',
    ],
  },
  // 音乐
  {
    dimension: 'musical',
    level: 'beginner',
    practices: [
      '每天听一首你没听过的歌，注意听里面的乐器',
      '跟着你喜欢的歌打拍子',
      '试着哼一段你脑子里冒出来的旋律',
    ],
  },
  {
    dimension: 'musical',
    level: 'intermediate',
    practices: [
      '学一种简单的乐器（尤克里里、口琴、拇指琴等）',
      '尝试跟着音乐即兴哼唱',
      '做一个"音乐心情歌单"，不同心情听不同的歌',
    ],
  },
  {
    dimension: 'musical',
    level: 'advanced',
    practices: [
      '尝试写一段自己的旋律或歌曲',
      '学习音乐理论，理解音乐背后的结构',
      '和朋友一起玩即兴音乐，感受合奏的乐趣',
    ],
  },
  // 动觉
  {
    dimension: 'bodily',
    level: 'beginner',
    practices: [
      '每天做 5 分钟拉伸，感受身体的各个部位',
      '用身体感受来做一个简单的决定（站着感受一下哪个选择让你更放松）',
      '学一个简单的手部操或手指操',
    ],
  },
  {
    dimension: 'bodily',
    level: 'intermediate',
    practices: [
      '每周运动 3 次，每次 20 分钟以上',
      '学习瑜伽或太极，关注身体的感受',
      '尝试做一个手工作品（陶艺、木工、编织等）',
    ],
  },
  {
    dimension: 'bodily',
    level: 'advanced',
    practices: [
      '挑战一项新的运动或身体技能',
      '学习身体扫描冥想，加深对身体的觉察',
      '用身体来表达一种情绪，比如"快乐的身体"是什么样的',
    ],
  },
  // 人际
  {
    dimension: 'interpersonal',
    level: 'beginner',
    practices: [
      '每天主动和一个人打招呼（可以是微笑）',
      '倾听别人说话时，试着不打断、不急着回应',
      '赞美一个人（真心实意地）',
    ],
  },
  {
    dimension: 'interpersonal',
    level: 'intermediate',
    practices: [
      '和一个不太熟的人进行一次 10 分钟以上的对话',
      '练习复述：听完对方说话后，先复述一遍再回应',
      '主动关心一个朋友最近的状态',
    ],
  },
  {
    dimension: 'interpersonal',
    level: 'advanced',
    practices: [
      '在一个团体中主动组织一次活动',
      '练习调解两个朋友之间的小矛盾',
      '学习非暴力沟通的方法并在生活中实践',
    ],
  },
  // 内省
  {
    dimension: 'intrapersonal',
    level: 'beginner',
    practices: [
      '每天睡前花 2 分钟回顾当天的感受',
      '问自己"我现在的心情是什么颜色的？"',
      '记录三件让你开心或感激的小事',
    ],
  },
  {
    dimension: 'intrapersonal',
    level: 'intermediate',
    practices: [
      '每周写一次周回顾，总结这周的收获和感受',
      '尝试一次独自散步，不带手机，只是走路和想事情',
      '做一次价值观梳理：什么对你来说最重要？',
    ],
  },
  {
    dimension: 'intrapersonal',
    level: 'advanced',
    practices: [
      '写一封给一年后自己的信',
      '尝试冥想练习，每天 10 分钟',
      '做一次深入的自我对话：写下你对自己的疑问，然后诚实地回答',
    ],
  },
  // 自然
  {
    dimension: 'naturalist',
    level: 'beginner',
    practices: [
      '每天花 1 分钟看看窗外的天空或植物',
      '养一盆小植物，观察它的生长',
      '散步时留意一下周围有几种不同的树',
    ],
  },
  {
    dimension: 'naturalist',
    level: 'intermediate',
    practices: [
      '每周去一次公园或自然环境，慢慢走，仔细看',
      '学习识别 5 种你家附近常见的植物或鸟类',
      '尝试种一些蔬菜或香草，感受生命的成长',
    ],
  },
  {
    dimension: 'naturalist',
    level: 'advanced',
    practices: [
      '参加一次自然导赏或野外考察活动',
      '坚持记录一年的物候变化（什么植物什么时候开花、落叶）',
      '参与一次环保志愿活动，用行动连接自然',
    ],
  },
];

export function getSkillPracticeMenu(scores: DimensionScore[]): SkillPracticeMenu[] {
  // 返回完整的 8 维 × 3 等级练习菜单
  // 但根据分数调整推荐等级标记
  const scoreMap = new Map<DimensionCode, number>();
  for (const s of scores) scoreMap.set(s.dimension, s.score);

  // 直接返回全部菜单，UI 可以根据分数高亮对应等级
  return SKILL_PRACTICE;
}

// ===== 七日实验 =====
export function getWeeklyExperiment(scores: DimensionScore[]): WeeklyExperiment[] {
  const sorted = [...scores].sort((a, b) => b.score - a.score);
  const topDim = sorted[0]?.dimension ?? 'linguistic';
  const secondDim = sorted[1]?.dimension ?? 'logical';
  const bottomDim = sorted[sorted.length - 1]?.dimension ?? 'naturalist';
  const secondBottom = sorted[sorted.length - 2]?.dimension ?? 'musical';

  const dimNames: Record<DimensionCode, string> = {
    linguistic: '语言',
    logical: '逻辑',
    spatial: '空间',
    musical: '音乐',
    bodily: '动觉',
    interpersonal: '人际',
    intrapersonal: '内省',
    naturalist: '自然',
  };

  // 7 天实验：混合优势维度和较少使用的维度
  const experiments: WeeklyExperiment[] = [
    {
      day: 1,
      title: `优势日：用${dimNames[topDim]}的方式做事`,
      scene: '工作 / 学习',
      tryThis: `今天做任何事都尽量用你最擅长的${dimNames[topDim]}方式去做。`,
      observe: '观察一下：用优势方式做事时，你的状态和效率有什么不一样？',
      alternativePath: '如果遇到用优势方式解决不了的问题，也不用硬来，记下来就好。',
    },
    {
      day: 2,
      title: `新频道日：试试${dimNames[bottomDim]}`,
      scene: '生活',
      tryThis: `今天刻意用你比较少用的${dimNames[bottomDim]}方式做一件小事。`,
      observe: '观察一下：用不太常用的方式做事，你有什么感受？是别扭还是新鲜？',
      alternativePath: '不用追求做得好，重点是"试一下"这个动作本身。',
    },
    {
      day: 3,
      title: '组合日：让两种方式一起工作',
      scene: '工作 / 学习',
      tryThis: `今天做事情时，试着同时使用${dimNames[topDim]}和${dimNames[secondDim]}两种方式。`,
      observe: '观察一下：两种方式一起用的时候，效果是1+1>2还是互相干扰？',
      alternativePath: '如果发现两种方式切换起来很累，就回到你最习惯的那一种。',
    },
    {
      day: 4,
      title: '搭桥日：用优势支持弱项',
      scene: '生活 / 关系',
      tryThis: `遇到需要用到${dimNames[bottomDim]}的事情时，试着用你擅长的${dimNames[topDim]}方式来帮忙。`,
      observe: '观察一下：用优势智能搭桥之后，原本费力的事情有没有变得容易一点？',
      alternativePath: '如果搭不上桥也没关系——有些事情，费力也是正常的。',
    },
    {
      day: 5,
      title: '社交日：理解不一样的人',
      scene: '人际',
      tryThis: '今天特别留意一个和你不太一样的人，试着理解 TA 的做事方式。',
      observe: '观察一下：当你尝试理解"不一样"时，你有什么感受？是好奇、烦躁，还是别的？',
      alternativePath: '如果理解不了也没关系——承认差异的存在就已经是进步了。',
    },
    {
      day: 6,
      title: '自然日：去自然中充充电',
      scene: '自然户外',
      tryThis: '今天花至少 30 分钟在自然环境里——公园、河边、树林都可以。',
      observe: '观察一下：在自然中，你的身体和心情有什么变化？',
      alternativePath: '如果天气不好或没时间，就看看窗外的天空，或者摸摸一盆植物。',
    },
    {
      day: 7,
      title: '总结日：这一周你学到了什么？',
      scene: '内省反思',
      tryThis: '花 15 分钟回顾这一周的实验，写下你的发现和感受。',
      observe: '这一周里，你对自己有什么新的了解？哪些发现让你惊讶？',
      alternativePath: '不用强迫自己有"收获"——哪怕只是"我做了"就已经很好了。',
    },
  ];

  return experiments;
}
