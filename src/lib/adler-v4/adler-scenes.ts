/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// QM 阿德勒指数 v4.0 — 16 类场景
// 每次结果至少展示 6 类
// 友谊、亲密、家庭、社群、工作、学习、冲突、失败、拖延、边界、
// 求助、被拒绝、公开表达、身份与归属、人生转折、意义与方向

import type { SceneDefinition, SceneCode } from './adler-types';

export const ALL_SCENES: SceneCode[] = [
  'friendship',
  'intimacy',
  'family',
  'community',
  'work',
  'study',
  'conflict',
  'failure',
  'procrastination',
  'boundary',
  'asking_help',
  'rejection',
  'public_expression',
  'identity_belonging',
  'life_transition',
  'meaning_direction',
];

export const adlerScenes: Record<SceneCode, SceneDefinition> = {
  friendship: {
    code: 'friendship',
    name: '友谊',
    icon: '🤝',
    description: '在朋友关系中，你如何建立连接、维持边界、处理分歧和感受归属。',
    keyDimensions: ['D', 'B'],
    keyLenses: ['belonging', 'life_tasks'],
    commonPatterns: [
      '担心真实的自己不被朋友喜欢',
      '怕麻烦朋友，什么都自己扛',
      '朋友比自己优秀时感到自卑',
      '在朋友群中感觉像个旁观者',
    ],
    encouragement:
      '真正的友谊不是完美的，而是两个不完美的人选择彼此。' +
      '你不需要"足够好"才配有朋友。',
    reflectionQuestion:
      '在友谊中，你最希望被怎样对待？你会这样对待朋友吗？',
  },
  intimacy: {
    code: 'intimacy',
    name: '亲密关系',
    icon: '💗',
    description: '在恋爱或深度亲密关系中，你如何面对依赖、独立、冲突和承诺。',
    keyDimensions: ['D', 'C'],
    keyLenses: ['life_tasks', 'private_logic', 'safeguarding_tendencies'],
    commonPatterns: [
      '害怕太投入会受伤，所以保持距离',
      '在关系中容易失去自我',
      '冲突时要么冷战要么讨好',
      '担心自己不值得被真正爱着',
    ],
    encouragement:
      '亲密关系不是找到对的人，而是两个人一起学习怎么去爱。' +
      '你可以在关系中既做自己，又爱着对方。',
    reflectionQuestion:
      '在亲密关系中，你最害怕的是什么？那个害怕，在告诉你你真正在乎什么？',
  },
  family: {
    code: 'family',
    name: '家庭',
    icon: '🏠',
    description: '在原生家庭或现有家庭中，你如何处理期待、边界、责任和情感联结。',
    keyDimensions: ['B', 'D'],
    keyLenses: ['private_logic', 'life_tasks'],
    commonPatterns: [
      '觉得家人不理解自己',
      '背负着家人的期待，感到压力很大',
      '想和家人保持距离，但又有负罪感',
      '在家庭中习惯扮演某种角色（懂事的/照顾的/隐形的）',
    ],
    encouragement:
      '家庭给了我们很多，但我们不是只能被家庭定义。' +
      '你可以选择继承什么，也可以选择放下什么。',
    reflectionQuestion:
      '你从家庭中学到了什么？哪些是你想继续带着的，哪些是你想放下的？',
  },
  community: {
    code: 'community',
    name: '社群',
    icon: '🌐',
    description: '在兴趣小组、社群、组织等群体中，你如何参与、贡献和找到位置。',
    keyDimensions: ['D', 'C'],
    keyLenses: ['contribution', 'belonging'],
    commonPatterns: [
      '想参与但不知道怎么融入',
      '在群体中总觉得自己是边缘的',
      '贡献了但觉得自己做得不够',
      '害怕在社群中表达真实的自己',
    ],
    encouragement:
      '社群不是一个需要你"足够好"才能加入的俱乐部。' +
      '你的存在本身，就是对社群的一种贡献。',
    reflectionQuestion:
      '在社群中，你最希望找到什么？你有没有试着先给出你想要的？',
  },
  work: {
    code: 'work',
    name: '工作',
    icon: '💼',
    description: '在工作或职业中，你如何面对挑战、边界、成就感和人际关系。',
    keyDimensions: ['A', 'B'],
    keyLenses: ['life_tasks', 'contribution'],
    commonPatterns: [
      '工作累但不敢停下来',
      '不知道自己想要什么样的工作',
      '职场关系让你感到消耗',
      '觉得自己的工作没有意义',
    ],
    encouragement:
      '工作是生活的一部分，但不是全部。' +
      '你的价值不等于你的职位、薪水或产出。',
    reflectionQuestion:
      '工作对你来说，最核心的意义是什么？现在的工作能满足吗？',
  },
  study: {
    code: 'study',
    name: '学习',
    icon: '📚',
    description: '在学习、考试、技能提升中，你如何面对比较、失败、拖延和进步。',
    keyDimensions: ['C', 'A'],
    keyLenses: ['encouragement', 'safeguarding_tendencies'],
    commonPatterns: [
      '和别人比较后觉得自己不够好',
      '怕做不好所以迟迟不开始',
      '学了但总觉得不够',
      '考试或展示前特别焦虑',
    ],
    encouragement:
      '学习的目的不是变得完美，而是慢慢成为你想成为的样子。' +
      '今天的你比昨天多知道了一点点，那就够了。',
    reflectionQuestion:
      '你学习是因为你想学，还是因为你怕"不够好"？这两者的感觉有什么不一样？',
  },
  conflict: {
    code: 'conflict',
    name: '冲突',
    icon: '⚡',
    description: '当意见不合、发生争执或关系紧张时，你通常怎么应对。',
    keyDimensions: ['B', 'C'],
    keyLenses: ['safeguarding_tendencies', 'private_logic'],
    commonPatterns: [
      '一有冲突就想逃',
      '冲突时容易口不择言',
      '为了避免冲突而压抑自己',
      '冲突后反复想"我是不是做错了"',
    ],
    encouragement:
      '冲突不一定会破坏关系。有时候，真诚面对分歧反而会让关系更深。' +
      '你可以表达不同意见，同时依然在乎对方。',
    reflectionQuestion:
      '冲突对你来说意味着什么？你最害怕冲突的什么后果？',
  },
  failure: {
    code: 'failure',
    name: '失败',
    icon: '💔',
    description: '当事情没有按预期发展、经历挫折或错误时，你如何面对和恢复。',
    keyDimensions: ['C', 'A'],
    keyLenses: ['encouragement', 'safeguarding_tendencies'],
    commonPatterns: [
      '失败后觉得自己一无是处',
      '反复想"如果当初……就好了"',
      '因为怕失败所以不敢尝试',
      '失败后躲起来，不想见人',
    ],
    encouragement:
      '失败不是对你这个人的判决，只是某件事的某个结果。' +
      '真正重要的不是你会不会失败，而是你失败之后愿不愿意再试一次。',
    reflectionQuestion:
      '这次失败，让你学到了什么？如果一个朋友经历了同样的失败，你会对TA说什么？',
  },
  procrastination: {
    code: 'procrastination',
    name: '拖延',
    icon: '⏰',
    description: '当你拖着不做某件事时，背后可能在发生什么。',
    keyDimensions: ['A', 'C'],
    keyLenses: ['goal_orientation', 'private_logic', 'safeguarding_tendencies'],
    commonPatterns: [
      ' deadline 前才开始赶工',
      '明明想做但就是动不起来',
      '刷手机逃避',
      '越重要的事越拖',
    ],
    encouragement:
      '拖延不是懒，可能是你的某种自我保护。' +
      '也许你在害怕失败，也许你在反抗什么，也许你只是太累了。' +
      '先理解它，再和它商量。',
    reflectionQuestion:
      '你在拖延什么？如果不去做，你在避免什么？如果去做了，你又在害怕什么？',
  },
  boundary: {
    code: 'boundary',
    name: '边界',
    icon: '🚧',
    description: '在关系中，你如何表达需要、设置界限、保护自己的空间。',
    keyDimensions: ['B', 'A'],
    keyLenses: ['private_logic', 'safeguarding_tendencies'],
    commonPatterns: [
      '不好意思说"不"',
      '别人一求你就心软',
      '设置边界后有负罪感',
      '总觉得自己的需要不重要',
    ],
    encouragement:
      '边界不是墙，而是门。你可以选择什么时候开、开多大、让谁进来。' +
      '照顾好自己，你才有能力照顾别人。',
    reflectionQuestion:
      '你最希望在哪件事上设置边界？你在害怕设置边界后的什么后果？',
  },
  asking_help: {
    code: 'asking_help',
    name: '求助',
    icon: '🆘',
    description: '当你需要支持时，你能否开口求助、接受别人的帮助。',
    keyDimensions: ['D', 'C'],
    keyLenses: ['belonging', 'encouragement'],
    commonPatterns: [
      '什么都想自己扛，不好意思麻烦别人',
      '怕求助会被拒绝',
      '觉得求助是软弱的表现',
      '接受帮助后觉得欠了人情',
    ],
    encouragement:
      '求助不是软弱，而是信任。当你愿意求助时，' +
        '你其实是在说："我相信你在乎我，我相信你愿意帮我。"',
    reflectionQuestion:
      '你愿意帮助别人吗？那你愿意让别人帮助你吗？这两者有什么不一样？',
  },
  rejection: {
    code: 'rejection',
    name: '被拒绝',
    icon: '🚪',
    description: '当你的请求被拒绝、表达不被接受、或感到被排斥时，你如何应对。',
    keyDimensions: ['C', 'D'],
    keyLenses: ['safeguarding_tendencies', 'belonging'],
    commonPatterns: [
      '被拒绝后觉得自己很糟糕',
      '因为怕被拒绝所以不主动',
      '被拒绝后立刻想逃开',
      '反复咀嚼被拒绝的场景',
    ],
    encouragement:
      '被拒绝不等于你这个人被否定。很多时候，对方拒绝的是一件事，不是你这个人。' +
      '而且，被拒绝也说明你在尝试——这本身就需要勇气。',
    reflectionQuestion:
      '上一次被拒绝，你对自己说了什么？如果朋友被拒绝了，你会怎么对TA说？',
  },
  public_expression: {
    code: 'public_expression',
    name: '公开表达',
    icon: '🎤',
    description: '在公众面前表达自己、展示自己时的感受和应对方式。',
    keyDimensions: ['C', 'A'],
    keyLenses: ['safeguarding_tendencies', 'contribution'],
    commonPatterns: [
      '上台前特别紧张',
      '怕说错话所以少说',
      '表达后反复想"刚才是不是说不好"',
      '不敢在群体中表达不同意见',
    ],
    encouragement:
      '公开表达的目的不是完美，而是把你想传递的东西传递出去。' +
      '哪怕紧张，哪怕不完美，你的声音依然值得被听见。',
    reflectionQuestion:
      '你害怕的是表达本身，还是别人怎么看你？如果没有人评价，你想说什么？',
  },
  identity_belonging: {
    code: 'identity_belonging',
    name: '身份与归属',
    icon: '🌈',
    description: '关于你是谁、你属于哪里的探索——性别、性取向、文化、族群等身份议题。',
    keyDimensions: ['D', 'C'],
    keyLenses: ['belonging', 'contribution', 'life_tasks'],
    commonPatterns: [
      '觉得自己和别人不一样，找不到同类',
      '身份不被理解或不被接纳',
      '在不同群体中需要"切换"自己',
      '不确定自己到底是谁',
    ],
    encouragement:
      '你的身份不需要别人认证。你就是你自己的权威。' +
      '找到属于你的共同体可能需要时间，但你值得被真正地看见和接纳。',
    reflectionQuestion:
      '关于"我是谁"，你目前最确定的是什么？还在探索的是什么？',
  },
  life_transition: {
    code: 'life_transition',
    name: '人生转折',
    icon: '🔄',
    description: '面对重大生活变化——毕业、换工作、搬家、分手、身份转变等。',
    keyDimensions: ['A', 'D'],
    keyLenses: ['life_tasks', 'courage'],
    commonPatterns: [
      '对变化感到焦虑和不确定',
      '舍不得过去的状态',
      '不知道新的方向在哪里',
      '觉得自己"应该"准备好了但其实没有',
    ],
    encouragement:
      '转折期的混乱是正常的。你不需要立刻知道答案，' +
      '也不需要立刻适应。慢慢来，你会找到新的节奏的。',
    reflectionQuestion:
      '这个转折，在让你告别什么？又在为你打开什么？',
  },
  meaning_direction: {
    code: 'meaning_direction',
    name: '意义与方向',
    icon: '🧭',
    description: '关于人生意义、价值方向、什么对你最重要的探索。',
    keyDimensions: ['C', 'D'],
    keyLenses: ['goal_orientation', 'contribution', 'life_tasks'],
    commonPatterns: [
      '不知道自己想要什么',
      '觉得做什么都没意义',
      '和别人比觉得自己"活得不够好"',
      '有目标但不确定是不是自己真正想要的',
    ],
    encouragement:
      '意义不是找出来的，是活出来的。你不需要一个宏大的人生目标——' +
      '有时候，明天想做的一件小事，就已经够了。',
    reflectionQuestion:
      '做什么事情的时候，你会觉得"这就是我想要的"？那种感觉是什么样的？',
  },
};

// 根据维度得分推荐相关场景（至少6个）
export function recommendScenesByProfile(
  scores: Record<string, number>,
  minScenes = 6,
): SceneCode[] {
  // 按维度匹配度排序
  const sceneScores = ALL_SCENES.map((code) => {
    const scene = adlerScenes[code];
    const dims = scene.keyDimensions;
    const avg = dims.reduce((s, d) => s + (scores[d] || 0), 0) / dims.length;
    // 低分维度对应的场景更需要被关注（反向加权）
    const reverseAvg = dims.reduce((s, d) => s + (100 - (scores[d] || 0)), 0) / dims.length;
    return { code, score: avg * 0.4 + reverseAvg * 0.6 };
  });

  return sceneScores
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(minScenes, 6))
    .map((s) => s.code);
}

export function getScene(code: SceneCode): SceneDefinition {
  return adlerScenes[code];
}

export function getSceneName(code: SceneCode): string {
  return adlerScenes[code]?.name || code;
}
