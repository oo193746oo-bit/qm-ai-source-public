// QM 阿德勒指数 v4.0 — 6 组 Pair Engine
// 覆盖全部两两组合（AB/AC/AD/BC/BD/CD）
// 每组 4 种分类：Synergy / Conditional Tension / Compensation / Context Switch
// 禁止"最高 vs 最低自动称张力"

import type { PairDefinition, PairCode, DimensionCode } from './adler-types';
import { DIMENSION_NAMES } from './adler-types';

const ALL_PAIRS: PairCode[] = ['AB', 'AC', 'AD', 'BC', 'BD', 'CD'];

const PAIR_DIMS: Record<PairCode, [DimensionCode, DimensionCode]> = {
  AB: ['A', 'B'],
  AC: ['A', 'C'],
  AD: ['A', 'D'],
  BC: ['B', 'C'],
  BD: ['B', 'D'],
  CD: ['C', 'D'],
};

export const adlerPairMatrix: Record<PairCode, PairDefinition> = {
  AB: {
    pair: 'AB',
    dimA: 'A',
    dimB: 'B',
    name: '选择行动 × 课题边界',
    categories: {
      synergy: {
        label: '清晰行动',
        description:
          '既能看清自己的选择，又能区分什么是自己的课题。' +
          '行动有方向，也有边界感。',
        whatItLooksLike: [
          '做决定时知道自己要什么，也知道哪些是别人的事',
          '行动果断，但不越界替别人做决定',
          '遇到问题时，先分清"我能做什么"再行动',
        ],
        possibleResources: [
          '不容易内耗，行动效率高',
          '在关系中既主动又尊重边界',
          '面对混乱情境时能快速找到自己的位置',
        ],
        possibleTensions: [
          '有时可能因为太清晰，让别人觉得不够共情',
          '在需要模糊感和柔软的关系中，可能显得过于理性',
        ],
        encouragement:
          '你的清晰是一种资源。同时也可以记得：有些时候，' +
          '不是所有事情都需要立刻分清边界，允许关系有一些"没分那么清"的时刻。',
      },
      conditional_tension: {
        label: '行动与边界的拉扯',
        description:
          '想要行动，但又不确定哪些是自己能负责的。' +
          '在"我想做"和"我该不该做"之间徘徊。',
        whatItLooksLike: [
          '想帮别人，但又怕越界，结果什么都没做',
          '做了决定后，反复想"是不是我管太多了"',
          '在关系中，既想主动又怕被拒绝',
        ],
        possibleResources: [
          '对关系和责任有细腻的觉察',
          '不会轻易冒犯别人的边界',
          '做事前会考虑对他人的影响',
        ],
        possibleTensions: [
          '可能因为过度思考边界而错过行动时机',
          '内心容易有"我是不是做太多/太少"的纠结',
        ],
        encouragement:
          '边界不是一道固定的墙，而是可以根据关系和情境调整的门。' +
          '你可以先做一个小尝试，然后根据对方的回应来调整。',
      },
      compensation: {
        label: '用行动补偿边界 / 用边界补偿行动',
        description:
          '一维远高于另一维，可能在用较熟悉的方式补偿较不熟悉的部分。',
        whatItLooksLike: [
          '行动感强但边界感弱：总是在替别人做事、承担别人的课题',
          '边界感强但行动感弱：能分清边界，但困在"我能做什么"里',
        ],
        possibleResources: [
          '至少有一个维度是你比较熟悉的，可以作为起点',
          '你对其中一种模式有很深的体验',
        ],
        possibleTensions: [
          '可能长期在一种模式里，缺少另一种维度的体验',
          '补偿模式有时会让人误以为"我已经做得很好了"',
        ],
        encouragement:
          '你已经有一种很熟练的方式了。如果愿意，可以试着让较低的那一维' +
          '也慢慢参与进来，不一定要很高，哪怕多一点点就够了。',
      },
      context_switch: {
        label: '情境灵活切换',
        description:
          '两维都在中间位置，更可能根据不同情境切换策略。' +
          '有时候很主动，有时候更在意边界。',
        whatItLooksLike: [
          '在熟悉的关系里比较主动，在陌生环境里更谨慎',
          '工作中界限清晰，私人关系里可能更投入',
          '状态好的时候行动力强，状态不好的时候容易退缩',
        ],
        possibleResources: [
          '适应性强，能根据情境调整自己',
          '不会被单一模式困住',
          '对不同的人有不同的相处方式',
        ],
        possibleTensions: [
          '有时可能让人觉得"你好像不太一样"',
          '自己也可能困惑：到底哪个才是"真正的我"',
        ],
        encouragement:
          '灵活本身就是一种能力。你不需要只有一种"固定的样子"——' +
          '在不同情境下有不同的反应，正是你适应生活的方式。',
      },
    },
    typicalScenes: ['work', 'boundary', 'conflict', 'family'],
    observation: '行动和边界不是对立的，而是在不同情境下的两种能力。',
  },
  AC: {
    pair: 'AC',
    dimA: 'A',
    dimB: 'C',
    name: '选择行动 × 勇气成长',
    categories: {
      synergy: {
        label: '向前的力量',
        description:
          '既知道自己可以选择，也有勇气去尝试不熟悉的事。' +
          '行动有方向，也敢于承担风险。',
        whatItLooksLike: [
          '遇到挑战时，先想"我能做什么"，然后愿意去试',
          '即使不确定结果，也愿意迈出第一步',
          '失败了也能把它当成反馈，调整后继续',
        ],
        possibleResources: [
          '复原力强，不容易被挫折击倒',
          '面对不确定性时有行动力',
          '在成长型情境中表现突出',
        ],
        possibleTensions: [
          '可能对自己和他人期待过高',
          '有时会忽略休息和停下来的重要性',
        ],
        encouragement:
          '你的勇气和行动力是很珍贵的资源。同时也可以记得：' +
          '停下来、允许自己做不到，也是一种选择，也是一种勇气。',
      },
      conditional_tension: {
        label: '想行动但怕失败',
        description:
          '知道自己可以选择，但害怕选不好、害怕失败。' +
          '在"我想做"和"我怕做不好"之间犹豫。',
        whatItLooksLike: [
          '有想法但迟迟不行动，怕做错了',
          '开始做一件事，一旦遇到困难就容易放弃',
          '宁愿不开始，也不想经历失败',
        ],
        possibleResources: [
          '对风险有敏锐的感知',
          '不会冲动行事',
          '做决定前会充分考虑后果',
        ],
        possibleTensions: [
          '可能因为害怕失败而错过很多机会',
          '容易陷入"想太多、做太少"的循环',
        ],
        encouragement:
          '害怕是正常的。你可以不用等"完全准备好"再开始——' +
          '先做一个最小的尝试，哪怕只是5分钟。做不好也没关系，' +
          '那只是一个反馈，不是你这个人的价值。',
      },
      compensation: {
        label: '用行动补勇气 / 用勇气补选择',
        description:
          '一维远高于另一维，可能在用熟悉的方式补偿另一部分。',
        whatItLooksLike: [
          '行动感强但勇气感弱：忙个不停，但不敢真正面对困难的事',
          '勇气感强但行动感弱：想挑战，但不知道从哪里开始',
        ],
        possibleResources: [
          '有一个维度可以作为支撑点',
          '对其中一种模式有深入的体验',
        ],
        possibleTensions: [
          '补偿模式可能长期掩盖真正需要面对的部分',
          '可能在某一方面做得很好，但另一方面停滞不前',
        ],
        encouragement:
          '你已经有一种方式在应对了，那本身就很有智慧。' +
          '如果愿意，可以慢慢让较低的那一维也参与进来——' +
          '不用急，哪怕每次只多一点点。',
      },
      context_switch: {
        label: '视情境而动',
        description:
          '两维都在中间位置，行动和勇气的表达取决于具体情境。',
        whatItLooksLike: [
          '在熟悉的领域很敢尝试，在陌生领域比较谨慎',
          '状态好的时候行动力和勇气都强，状态差的时候都低',
          '小事上很果断，大事上容易犹豫',
        ],
        possibleResources: [
          '能根据情境调整自己的投入程度',
          '不会盲目冒险',
          '有自知之明，知道自己的边界在哪里',
        ],
        possibleTensions: [
          '有时可能过于保守，错过一些成长机会',
          '可能对自己的"不一致"感到困惑',
        ],
        encouragement:
          '你的谨慎和灵活都是有意义的。不需要在所有事情上都同样勇敢——' +
          '选一件对你真正重要的事，把勇气集中在那里就好。',
      },
    },
    typicalScenes: ['study', 'failure', 'procrastination', 'public_expression'],
    observation: '行动和勇气不是一回事：行动是"我可以做"，勇气是"即使害怕也去做"。',
  },
  AD: {
    pair: 'AD',
    dimA: 'A',
    dimB: 'D',
    name: '选择行动 × 连接共同体',
    categories: {
      synergy: {
        label: '带着连接向前',
        description:
          '既能独立选择和行动，又能在共同体中获得支持和贡献。' +
          '独立不孤立，连接不失主体性。',
        whatItLooksLike: [
          '做自己的选择，同时也能感受到和他人的连接',
          '既能独立做事，也愿意向别人求助',
          '在共同体中贡献，同时保持自己的方向',
        ],
        possibleResources: [
          '在困境中有"自己+他人"双重资源',
          '既能单打独斗，也能团队合作',
          '人生方向感和归属感都比较强',
        ],
        possibleTensions: [
          '有时可能在"独立"和"依赖"之间摇摆',
          '身边的人可能跟不上你的节奏',
        ],
        encouragement:
          '独立和连接并不矛盾。你可以同时拥有"我自己选的路"和' +
          '"有人和我一起走"——这两者可以互相滋养，而不是互相排斥。',
      },
      conditional_tension: {
        label: '独立与归属的拉扯',
        description:
          '既想做自己，又怕被排斥。在"我要什么"和"别人会不会接受我"之间徘徊。',
        whatItLooksLike: [
          '想做自己，但又怕和别人不一样而被孤立',
          '在群体中有时会隐藏真实的自己',
          '做决定时会想"别人会怎么看我"',
        ],
        possibleResources: [
          '对关系很敏锐，不会轻易伤害别人',
          '能感知群体的氛围和他人的需要',
          '在关系中比较体贴',
        ],
        possibleTensions: [
          '可能为了归属感而牺牲自己的选择',
          '在需要坚持自我的时刻容易退缩',
        ],
        encouragement:
          '做自己和被接纳，不一定只能选一个。' +
          '也许你可以从小事开始：在一个安全的关系里，先表达一点点真实的自己，' +
          '看看会发生什么。真正的连接，是建立在真实之上的。',
      },
      compensation: {
        label: '用行动补连接 / 用连接补行动',
        description:
          '一维远高于另一维，可能在用熟悉的方式补偿另一部分。',
        whatItLooksLike: [
          '行动感强但连接感弱：总是一个人扛，不求助也不让别人靠近',
          '连接感强但行动感弱：靠关系获得安全感，但缺少自己的方向',
        ],
        possibleResources: [
          '至少有一个维度可以依靠',
          '你已经发展出了一种生存策略',
        ],
        possibleTensions: [
          '补偿模式可能让人觉得"我已经很好了"，但内心有空缺',
          '长期可能在某一方面感到枯竭',
        ],
        encouragement:
          '你已经有一种方式在生活了，那是你的资源。' +
          '如果愿意，可以试着慢慢走向较低的那一维——' +
          '不是否定现在的自己，而是让自己的世界更完整。',
      },
      context_switch: {
        label: '独立与连接的流动',
        description:
          '两维都在中间位置，独立和连接的比例随情境变化。',
        whatItLooksLike: [
          '工作中比较独立，生活中更需要连接',
          '和某些人在一起很做自己，和另一些人比较迎合',
          '有时候想独处，有时候想群居',
        ],
        possibleResources: [
          '能在独立和连接之间灵活切换',
          '适应不同的社交情境',
          '对自己的需要有细腻的感知',
        ],
        possibleTensions: [
          '有时可能觉得"我到底是独立的还是依赖的"',
          '身边的人可能觉得你捉摸不定',
        ],
        encouragement:
          '人本来就是既需要独立又需要连接的。你不需要给自己贴标签——' +
          '有时候想一个人，有时候想和别人在一起，这都是正常的。',
      },
    },
    typicalScenes: ['friendship', 'community', 'identity_belonging', 'life_transition'],
    observation: '独立不是孤立，连接不是失去自我。最好的状态是"我是我，我们是我们"。',
  },
  BC: {
    pair: 'BC',
    dimA: 'B',
    dimB: 'C',
    name: '课题边界 × 勇气成长',
    categories: {
      synergy: {
        label: '有边界的勇气',
        description:
          '既知道什么是自己的课题，又有勇气在自己的课题范围内成长和尝试。' +
          '勇敢但不鲁莽，有边界但不退缩。',
        whatItLooksLike: [
          '在自己的课题上愿意冒险，但不会替别人承担',
          '能区分"我能改进的"和"不是我的问题"',
          '面对批评时，能听进去有用的部分，也能放下不该自己扛的',
        ],
        possibleResources: [
          '成长的方向很清晰，不会在错误的地方用力',
          '面对挫折时有清晰的归因能力',
          '不容易被别人的评价过度影响',
        ],
        possibleTensions: [
          '有时可能显得太理性、太"拎得清"',
          '在需要共情的场合可能让人觉得有距离',
        ],
        encouragement:
          '你的清晰和勇气是很好的组合。同时也可以记得：' +
          '有些时候，不需要那么快分清边界——先感受，再分辨，也是可以的。',
      },
      conditional_tension: {
        label: '边界与突破的拉扯',
        description:
          '想成长和突破，但又怕越界、怕做错、怕别人的反应。' +
          '在"我想试试"和"会不会冒犯/失败"之间犹豫。',
        whatItLooksLike: [
          '想表达不同意见，但怕引起冲突，最后还是不说了',
          '想争取什么，但怕被拒绝，觉得"那不是我的"',
          '在关系中想靠近，但又怕越界',
        ],
        possibleResources: [
          '对他人的边界很敏感，不会轻易冒犯',
          '做事比较谨慎，不容易闯祸',
          '有很好的共情能力',
        ],
        possibleTensions: [
          '可能因为过于担心边界而限制了自己的成长',
          '容易把"别人可能不舒服"当成"我不该做"',
        ],
        encouragement:
          '边界是用来保护双方的，不是用来限制你成长的。' +
          '你可以带着尊重去尝试，然后根据对方的回应来调整。' +
          '试了才知道边界在哪里，不试就永远只是猜测。',
      },
      compensation: {
        label: '用边界补勇气 / 用勇气补边界',
        description:
          '一维远高于另一维，可能在用熟悉的方式补偿另一部分。',
        whatItLooksLike: [
          '边界感强但勇气感弱：用"那不是我的课题"来回避挑战和成长',
          '勇气感强但边界感弱：很敢尝试，但经常越界或替别人承担',
        ],
        possibleResources: [
          '有一个维度是你比较强的',
          '你对其中一种模式有很多经验',
        ],
        possibleTensions: [
          '补偿模式可能长期掩盖真正需要面对的议题',
          '可能在一方面很强，另一方面很弱',
        ],
        encouragement:
          '你已经有一种方式在保护自己了。如果愿意，' +
          '可以试着让较低的那一维也慢慢发展起来——' +
          '不一定要很快，慢一点也没关系。',
      },
      context_switch: {
        label: '情境化的边界与勇气',
        description:
          '两维都在中间位置，边界的松紧和勇气的多少取决于情境。',
        whatItLooksLike: [
          '在安全的环境里敢说敢做，在压力下容易退缩',
          '和熟悉的人边界松，和陌生人边界紧',
          '小事上有勇气，大事上容易犹豫',
        ],
        possibleResources: [
          '对环境很敏感，适应力强',
          '不会在所有情境下都用同一种模式',
          '有自我保护的智慧',
        ],
        possibleTensions: [
          '有时可能觉得自己"不够稳定"',
          '可能在重要的时刻不够有勇气',
        ],
        encouragement:
          '你的灵活和敏感是一种智慧。不需要在所有情境下都一样——' +
          '选一个对你重要的领域，慢慢练习在那里更有勇气或更有边界感就好。',
      },
    },
    typicalScenes: ['conflict', 'rejection', 'boundary', 'public_expression'],
    observation: '真正的勇气，是带着边界去冒险；真正的边界，是为了更自由地去爱和行动。',
  },
  BD: {
    pair: 'BD',
    dimA: 'B',
    dimB: 'D',
    name: '课题边界 × 连接共同体',
    categories: {
      synergy: {
        label: '有温度的边界',
        description:
          '既能区分课题和边界，又能在关系中体验到连接和归属。' +
          '有边界但不疏离，有连接但不纠缠。',
        whatItLooksLike: [
          '在关系中能做自己，也能尊重对方',
          '既能亲近，也能保持独立',
          '关心别人，但不为别人的情绪过度负责',
        ],
        possibleResources: [
          '关系质量比较高，既亲密又有空间',
          '不容易在关系中失去自我',
          '能建立健康的互相支持的关系',
        ],
        possibleTensions: [
          '有时可能让依赖型的人觉得不够"够意思"',
          '在需要深度融合的关系初期可能比较慢热',
        ],
        encouragement:
          '健康的关系就是这样的——既有连接，又有各自的空间。' +
          '你不需要为了让别人舒服而模糊自己的边界。',
      },
      conditional_tension: {
        label: '靠近与分离的拉扯',
        description:
          '既想靠近别人，又怕失去边界。在"我想连接"和"我不想被吞没"之间摇摆。',
        whatItLooksLike: [
          '想建立深一点的关系，但又怕自己太投入',
          '关系近了就想逃，远了又觉得孤单',
          '在群体中有时觉得格格不入',
        ],
        possibleResources: [
          '对关系的距离很敏感',
          '不会轻易陷入不健康的依赖关系',
          '有很强的自我保护意识',
        ],
        possibleTensions: [
          '可能因为怕失去边界而回避深度连接',
          '关系容易停留在表面',
        ],
        encouragement:
          '边界和连接不是零和博弈。你可以一边保持自己，一边和别人靠近——' +
          '好的关系会让你觉得"我可以做我自己，同时我们也在一起"。',
      },
      compensation: {
        label: '用边界补连接 / 用连接补边界',
        description:
          '一维远高于另一维，可能在用熟悉的方式补偿另一部分。',
        whatItLooksLike: [
          '边界感强但连接感弱：用边界保护自己，但也切断了很多连接',
          '连接感强但边界感弱：在关系中很投入，但容易失去自己',
        ],
        possibleResources: [
          '有一个维度是你比较熟悉的',
          '你在关系中有自己的生存策略',
        ],
        possibleTensions: [
          '补偿模式可能让人既渴望又害怕关系',
          '可能在关系中反复经历同样的模式',
        ],
        encouragement:
          '你已经用自己的方式在关系中生存了，那很有智慧。' +
          '如果愿意，可以试着在安全的关系里，慢慢练习另一种方式——' +
          '不用急，从最小的一步开始。',
      },
      context_switch: {
        label: '关系中的灵活距离',
        description:
          '两维都在中间位置，边界和连接的平衡随关系和情境变化。',
        whatItLooksLike: [
          '和不同的人有不同的边界距离',
          '有时候很想社交，有时候想一个人',
          '在不同的群体里有不同的表现',
        ],
        possibleResources: [
          '关系适应力强',
          '能感知不同关系的不同需要',
          '对自己的社交能量有感知',
        ],
        possibleTensions: [
          '有时可能觉得"我到底是内向还是外向"',
          '可能对自己关系中的"不一致"感到困惑',
        ],
        encouragement:
          '关系本来就没有统一标准。你可以和不同的人有不同的距离——' +
          '这不是虚伪，而是对每个关系独特性的尊重。',
      },
    },
    typicalScenes: ['intimacy', 'family', 'friendship', 'community'],
    observation: '最好的关系，是两个有边界的人，选择彼此靠近。',
  },
  CD: {
    pair: 'CD',
    dimA: 'C',
    dimB: 'D',
    name: '勇气成长 × 连接共同体',
    categories: {
      synergy: {
        label: '在连接中成长',
        description:
          '既敢于挑战和成长，又能在共同体中获得支持和意义。' +
          '勇气不是一个人的事，成长也不是一个人的事。',
        whatItLooksLike: [
          '敢去尝试新事物，同时也能向别人求助',
          '在共同体中贡献，同时也从共同体中获得力量',
          '遇到困难时，既有自己的韧性，也有他人的支持',
        ],
        possibleResources: [
          '成长的动力和支持系统都很充足',
          '在挑战中不容易感到孤单',
          '能从帮助别人和被别人帮助中都获得意义',
        ],
        possibleTensions: [
          '有时可能对自己和身边的人期待都太高',
          '当共同体支持不足时，可能落差更大',
        ],
        encouragement:
          '能在连接中成长是很珍贵的。同时也可以记得：' +
          '成长有时候也需要独自面对的时刻——那不是孤独，而是更深的自我对话。',
      },
      conditional_tension: {
        label: '想成长但怕被看见',
        description:
          '想成长和突破，但怕在别人面前失败、怕被评价。' +
          '在"我想变得更好"和"我怕别人怎么看"之间纠结。',
        whatItLooksLike: [
          '有梦想和目标，但不敢告诉别人，怕做不到被笑话',
          '在群体中不敢表达真实的想法和感受',
          '想尝试新事物，但怕自己"做得不好看"',
        ],
        possibleResources: [
          '对他人的感受很敏锐',
          '不会轻易在人群中出风头',
          '做事比较踏实，不浮夸',
        ],
        possibleTensions: [
          '可能因为怕被评价而限制了自己的成长',
          '容易把成长的目标藏在心里，缺少外部支持',
        ],
        encouragement:
          '成长不是为了给别人看的。但如果你愿意，' +
          '可以试着在一个你觉得安全的人面前，分享一点点你的成长愿望——' +
          '有时候，被看见本身就是一种力量。',
      },
      compensation: {
        label: '用勇气补连接 / 用连接补勇气',
        description:
          '一维远高于另一维，可能在用熟悉的方式补偿另一部分。',
        whatItLooksLike: [
          '勇气感强但连接感弱：一个人很敢闯，但感觉没有人可以分享',
          '连接感强但勇气感弱：有很多支持，但不敢自己去闯',
        ],
        possibleResources: [
          '至少有一个维度可以依靠',
          '你已经有了一种力量来源',
        ],
        possibleTensions: [
          '补偿模式可能让人在某个方面很充实，但另一方面有空缺',
          '长期可能感到某种缺失',
        ],
        encouragement:
          '你已经拥有了一种重要的力量。如果愿意，' +
          '可以试着慢慢走向较低的那一维——' +
          '不是为了变得"全面"，而是为了让自己的生命更丰富。',
      },
      context_switch: {
        label: '成长与连接的流动',
        description:
          '两维都在中间位置，勇气和连接的表达随情境变化。',
        whatItLooksLike: [
          '在群体里比较收敛，一个人的时候反而敢尝试',
          '有些事愿意和别人一起做，有些事只想自己来',
          '有时候需要鼓励才敢行动，有时候自己就能冲',
        ],
        possibleResources: [
          '能根据情境调动不同的资源',
          '既有独处的能力，也有社交的能力',
          '对自己的状态有感知',
        ],
        possibleTensions: [
          '有时可能觉得"我到底是勇敢还是胆小"',
          '可能对自己的状态波动感到困惑',
        ],
        encouragement:
          '勇气本来就不是恒定的。有时候你更敢，有时候你更需要支持——' +
          '这都是正常的。重要的是，你在往前走，不管是一个人还是和别人一起。',
      },
    },
    typicalScenes: ['meaning_direction', 'identity_belonging', 'study', 'community'],
    observation: '勇气让你向前走，连接让你走得远。两者一起，才是完整的成长。',
  },
};

// 获取按相关度排序的 top N pair
export function getTopPairs(
  pairPatterns: { pair: PairCode; category: string; confidence: number }[],
  limit = 3,
): PairCode[] {
  return [...pairPatterns]
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, limit)
    .map((p) => p.pair);
}

export function getPairDef(pair: PairCode): PairDefinition {
  return adlerPairMatrix[pair];
}

export function getPairCategoryLabel(
  pair: PairCode,
  category: keyof PairDefinition['categories'],
): string {
  return adlerPairMatrix[pair]?.categories[category]?.label || '';
}
