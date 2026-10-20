/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// QM 职业价值观测评 v4.0 — 12 类职业场景内容
// 覆盖职业生命周期主要决策节点

import type { CareerScene, SceneCode, DimensionCode } from './wv-types';

export const wvScenes: Record<SceneCode, CareerScene> = {
  // ===== 1. 求职 =====
  job_search: {
    code: 'job_search',
    name: '求职找工作',
    icon: '🔍',
    description: '正在找工作或考虑换工作，需要知道什么样的机会更适合自己',
    keyValues: ['achievement', 'growth', 'meaning', 'reward'],
    guidance:
      '找工作不只是看"能不能进去"，更要看"进去了会不会开心"。' +
      '把你的价值优先级列出来，在看JD、面试时主动去验证这些点。' +
      '不要只盯着岗位名称和薪资，工作环境、团队氛围、成长空间同样重要。',
    valueSpecific: {
      achievement: '重点看岗位的目标和挑战是什么，有没有明确的交付物和里程碑，老板是不是结果导向的人。',
      security: '了解公司的业务稳定性、人员流动率、合同类型和试用期政策。',
      autonomy: '面试时问清楚：这个岗位的决策权限有多大？向谁汇报？日常工作的自由度如何？',
      growth: '了解团队的培训体系、晋升通道、有没有导师机制，过去一年团队里的人成长了多少。',
      relation: '面试时观察团队氛围，问一问同事之间的合作方式，有没有团建活动。',
      meaning: '了解公司的使命和价值观，问面试官："你觉得这份工作最有意义的部分是什么？"',
      balance: '了解加班频率、上下班时间、年假政策、有没有弹性工作制。',
      reward: '了解完整薪酬包：基本工资、奖金、福利、调薪机制，不要只看月薪。',
    },
    reflectionQuestions: [
      '找工作时，你最先看的三个条件是什么？',
      '上一份工作离开的原因里，有没有"价值观不匹配"的因素？',
      '你怎么判断一份工作"适不适合自己"？',
      '找工作时，你愿意妥协的和绝不妥协的分别是什么？',
      '如果拿到一个"还行"的offer，但不是最理想的，你会怎么选？',
    ],
  },

  // ===== 2. Offer 选择 =====
  offer: {
    code: 'offer',
    name: 'Offer 选择',
    icon: '📋',
    description: '手里有多个offer，需要比较和决定',
    keyValues: ['security', 'reward', 'growth', 'balance'],
    guidance:
      '没有完美的offer，每个选择都是在不同价值之间做权衡。' +
      '先想清楚你最不能接受的是什么（Deal-breaker），再看哪些是可以谈判的。' +
      '用你的价值优先级做权重，而不是被表面的薪资高低牵着走。',
    valueSpecific: {
      achievement: '比较两个offer里，哪个能让你做出更大的成果、有更有挑战的项目。',
      security: '比较公司稳定性、合同保障、试用期政策、业务前景。',
      autonomy: '比较岗位的自主权、汇报层级、决策空间。',
      growth: '比较学习资源、晋升空间、团队实力、跳槽后的市场价值提升。',
      relation: '比较团队氛围、直属领导风格、同事背景。',
      meaning: '比较工作内容的意义感、公司价值观的匹配度。',
      balance: '比较工作强度、加班频率、通勤时间、假期政策。',
      reward: '比较完整薪酬包：base、奖金、期权、福利、调薪节奏。',
    },
    reflectionQuestions: [
      '如果两个offer只能留一个，你最先排除哪个？为什么？',
      '你做选择时，更容易被"更好的那个"吸引，还是被"更差的那个"劝退？',
      '你有没有过选了offer之后后悔的经历？后悔的是什么？',
      '选择offer时，家人/朋友的意见对你影响有多大？',
      '五年后回头看，你希望自己做了怎样的选择？',
    ],
  },

  // ===== 3. 入职 =====
  onboarding: {
    code: 'onboarding',
    name: '入职适应',
    icon: '🌱',
    description: '刚加入新公司，正在适应新环境',
    keyValues: ['relation', 'security', 'growth', 'autonomy'],
    guidance:
      '入职前三个月是观察期，也是验证期。' +
      '不要急着证明自己，先用这段时间了解团队、规则和文化。' +
      '如果你发现实际和预期差很多，这是正常的——重要的是这个差距你能不能接受。',
    valueSpecific: {
      achievement: '前三个月不要急于出大成果，先搞清楚什么是"做得好"的标准。',
      security: '观察公司的稳定性、人员流动情况、业务方向是否清晰。',
      autonomy: '慢慢试探边界：哪些事可以自己决定，哪些需要汇报。',
      growth: '主动学习，找一位可以请教的同事或导师，了解成长路径。',
      relation: '认识团队里的每个人，找到一两个可以聊的同事，建立基本的信任。',
      meaning: '用这段时间验证这家公司的真实价值观是否和你契合。',
      balance: '观察真实的工作节奏和加班文化，不要只看表面。',
      reward: '了解真实的绩效评价和调薪机制，确认薪酬包是否符合预期。',
    },
    reflectionQuestions: [
      '入职以来，最让你意外的是什么？',
      '你觉得自己适应得怎么样？哪些地方比预想的好，哪些不如预期？',
      '你在新团队里找到"自己人"了吗？',
      '这份工作和你面试时的想象，差距最大的是什么？',
      '三个月后，你希望自己在哪些方面站稳脚跟？',
    ],
  },

  // ===== 4. 晋升 =====
  promotion: {
    code: 'promotion',
    name: '晋升发展',
    icon: '📈',
    description: '面对晋升机会或处于上升通道',
    keyValues: ['achievement', 'growth', 'reward', 'autonomy'],
    guidance:
      '晋升不只是好事——它意味着角色变化、更多责任和新的挑战。' +
      '想清楚你想晋升是因为什么：是想做更大的事，还是只是觉得"应该升了"？' +
      '晋升有时意味着牺牲其他价值（比如平衡、自主权），值得提前评估。',
    valueSpecific: {
      achievement: '晋升后能做更大的事、影响更多人，这本身就是成就。',
      security: '晋升通常意味着更稳定和不可替代，但也可能承担更多风险。',
      autonomy: '管理岗可能有更多决策权，但也有更多汇报对象和约束。',
      growth: '晋升是能力跨越的机会，但也可能跳出舒适区带来阵痛。',
      relation: '晋升后和同事的关系可能变化，需要重新建立边界。',
      meaning: '更高的位置可以带来更大的影响力，但也可能离一线更远。',
      balance: '管理岗通常更忙，评估一下晋升对生活的影响。',
      reward: '晋升通常带来收入提升，但需要比较付出和回报的比例。',
    },
    reflectionQuestions: [
      '你想晋升的动力主要来自什么？',
      '如果晋升意味着更忙、更少生活，你还愿意吗？',
      '你觉得自己准备好了吗？哪些方面准备好了，哪些还没有？',
      '晋升后，你最担心失去什么？',
      '你怎么定义"成功的晋升"？',
    ],
  },

  // ===== 5. 转岗 =====
  transfer: {
    code: 'transfer',
    name: '内部转岗',
    icon: '🔄',
    description: '考虑在公司内部换岗位或换部门',
    keyValues: ['growth', 'achievement', 'autonomy', 'balance'],
    guidance:
      '内部转岗是低风险的探索方式——既不用离开熟悉的环境，又能接触新领域。' +
      '但也要想清楚：你转岗是因为"想追求什么"，还是"想逃避什么"？' +
      '最好先了解目标岗位的真实工作内容，不要只看表面的光鲜。',
    valueSpecific: {
      achievement: '转岗可以带来新的挑战和成就感，但也可能需要从头做起。',
      security: '内部转岗相对安全，但也要了解新团队的稳定性和前景。',
      autonomy: '新岗位可能有不同的自由度，提前了解清楚。',
      growth: '转岗是学习新技能、拓展职业边界的好机会。',
      relation: '离开熟悉的团队可能不舍，但也能认识新的人。',
      meaning: '转岗可能让你找到更有意义的工作内容。',
      balance: '新岗位的工作强度可能和现在不一样，了解清楚。',
      reward: '了解转岗后的薪资变化和未来的收入空间。',
    },
    reflectionQuestions: [
      '你想转岗的主要原因是什么？是逃离还是追求？',
      '你对目标岗位了解多少？这些信息从哪来的？',
      '转岗后你可能会失去现在拥有的什么？你能接受吗？',
      '如果转岗后发现不合适，还有回头路吗？',
      '一年后回头看，你希望自己转了还是没转？',
    ],
  },

  // ===== 6. 转行 =====
  career_change: {
    code: 'career_change',
    name: '转行/跨界',
    icon: '🚀',
    description: '考虑进入完全不同的行业或职业领域',
    keyValues: ['meaning', 'growth', 'security', 'reward'],
    guidance:
      '转行是重大决定，既有可能打开新世界，也会面临不确定性和损失。' +
      '先搞清楚你是不喜欢现在这个工作，还是不喜欢这整个行业。' +
      '可以先小步试探——副业、兼职、学习，不要一下子裸辞跳进未知。',
    valueSpecific: {
      achievement: '转行初期可能需要从头做起，成就感会暂时下降，要有心理准备。',
      security: '转行意味着暂时的不稳定，评估你的经济和心理承受力。',
      autonomy: '转行后你可能更自主，但也可能因为不熟悉而需要更多指导。',
      growth: '转行是最大的成长机会，但学习曲线也最陡。',
      relation: '转行后你的社交圈和人脉可能会变化，这也是成本的一部分。',
      meaning: '转行常常是为了找意义——确保你对目标行业的理解是真实的，不是想象。',
      balance: '转行初期可能需要额外学习，影响生活平衡，评估你能坚持多久。',
      reward: '转行可能有收入断层期，算清楚你的经济缓冲够不够。',
    },
    reflectionQuestions: [
      '你想转行的念头有多久了？是一时冲动还是长期想法？',
      '你对目标行业的了解有多深？有没有和业内人士聊过？',
      '如果转行后发现不是你想的那样，你能接受吗？退路是什么？',
      '你愿意为转行付出什么？时间、钱、面子、生活质量？',
      '五年后，你觉得自己会后悔"转了"还是后悔"没转"？',
    ],
  },

  // ===== 7. 创业/自由职业 =====
  entrepreneur: {
    code: 'entrepreneur',
    name: '创业/自由职业',
    icon: '🔥',
    description: '考虑创业、做自由职业者或独立工作',
    keyValues: ['autonomy', 'meaning', 'achievement', 'security'],
    guidance:
      '创业或自由职业不是逃避工作的方式，而是另一种更需要自律的工作方式。' +
      '它会放大你的优势，也会放大你的短板。' +
      '在跳出去之前，先确认你追求的是什么：自由、意义、成就，还是只是不想被管？',
    valueSpecific: {
      achievement: '做自己的事成就感最强，但失败了也全是自己的责任。',
      security: '收入不稳定是最大的挑战，需要有足够的缓冲和风险管理意识。',
      autonomy: '完全的自主——但也意味着没人替你兜底。',
      growth: '成长速度最快，什么都要学，但也可能什么都不精。',
      relation: '社交圈可能变化，孤独感是常见的挑战。',
      meaning: '做自己相信的事，意义感最强。',
      balance: '理论上可以自己安排时间，但实际上可能24小时都在想工作。',
      reward: '上不封顶，但也可能很低，收入波动大。',
    },
    reflectionQuestions: [
      '你想创业/做自由职业的最大动力是什么？',
      '你最担心的是什么？那个担心是真实的还是想象的？',
      '你有多少经济缓冲？能撑多久没有稳定收入？',
      '你是一个能自己驱动自己的人吗？还是需要外部结构？',
      '如果失败了，你觉得最大的代价是什么？你能承受吗？',
    ],
  },

  // ===== 8. 远程工作 =====
  remote: {
    code: 'remote',
    name: '远程/混合办公',
    icon: '🏠',
    description: '远程工作或混合办公模式下的适应与选择',
    keyValues: ['autonomy', 'balance', 'relation', 'security'],
    guidance:
      '远程工作不适合所有人，也不是所有工作都适合远程。' +
      '它最大的好处是灵活，最大的挑战是边界感和孤独感。' +
      '问问自己：你的工作方式更依赖自律还是他律？你需要多少人际互动来维持状态？',
    valueSpecific: {
      achievement: '远程工作看结果，但也可能因为看不见而被忽视，需要主动展示成果。',
      security: '远程岗位可能稳定性稍弱，但也可能更灵活地应对变化。',
      autonomy: '远程最大的优势就是自主——前提是你管得住自己。',
      growth: '远程学习资源很多，但没人盯着你，成长全靠主动。',
      relation: '远程容易孤独，需要主动建立和维持同事关系。',
      meaning: '远程让你有更多时间做有意义的事，但也可能缺少团队的共同意义感。',
      balance: '省了通勤时间，但工作和生活的边界更容易模糊。',
      reward: '远程岗位的薪资范围更宽，但地域差异可能仍然存在。',
    },
    reflectionQuestions: [
      '你远程工作的效率怎么样？和在办公室比呢？',
      '远程时，你最想念办公室的什么？',
      '你能管好自己的时间和节奏吗？还是需要外在结构？',
      '远程对你来说，最大的好处和最大的困扰分别是什么？',
      '如果可以选，你想要几天远程、几天到岗？为什么？',
    ],
  },

  // ===== 9. 薪资谈判 =====
  salary: {
    code: 'salary',
    name: '薪资谈判',
    icon: '💰',
    description: '谈薪、调薪、或争取更好的经济回报',
    keyValues: ['reward', 'security', 'achievement', 'autonomy'],
    guidance:
      '谈薪不是要钱，是让你的价值被合理定价。' +
      '准备好比"我觉得我值多少"更重要的是"市场价格是多少"和"我做出了什么"。' +
      '钱不是唯一可以谈判的——职级、假期、培训、权限、弹性工作都可以谈。',
    valueSpecific: {
      achievement: '用具体成果和数据说话，而不是用"我很努力"来谈。',
      security: '谈薪也是确认你在公司的位置和价值，价值被认可本身就是安全感的来源。',
      autonomy: '如果薪资谈不上去，可以尝试谈权限、资源和自主权。',
      growth: '谈成长路径和晋升通道，有时候未来的空间比现在的钱更重要。',
      relation: '谈钱可能尴尬，但健康的关系里，钱是可以坦诚谈的。',
      meaning: '如果钱暂时上不去，看看工作的意义感能不能支撑你继续。',
      balance: '如果工作很赚钱但严重影响生活，其实时薪可能并不高。',
      reward: '了解市场行情，知道自己的市场价，谈判时才有底气。',
    },
    reflectionQuestions: [
      '你上次谈薪是什么时候？结果怎么样？',
      '你觉得谈薪难吗？最难的部分是什么？',
      '你知道你这个岗位的市场价格吗？信息从哪来的？',
      '如果钱谈不上去，你会考虑争取其他什么？',
      '你怎么看"谈钱伤感情"这句话？',
    ],
  },

  // ===== 10. 团队冲突 =====
  team_conflict: {
    code: 'team_conflict',
    name: '团队关系/冲突',
    icon: '⚡',
    description: '团队里有矛盾、和同事或领导关系紧张',
    keyValues: ['relation', 'autonomy', 'meaning', 'balance'],
    guidance:
      '工作中的人际冲突很常见，不全是你的问题，也不全是对方的问题。' +
      '先区分是"价值观不合"还是"沟通方式问题"——前者需要找策略，后者可以学习改进。' +
      '有时候，换个环境比改变一个人或一段关系更容易，也更健康。',
    valueSpecific: {
      achievement: '别让关系问题影响你的核心产出，工作成绩是你的底气。',
      security: '评估冲突对你工作稳定性的影响程度，必要时做准备。',
      autonomy: '你可以选择怎么回应冲突，不需要被对方的情绪带着走。',
      growth: '冲突也是学习机会——学会处理冲突是重要的职业能力。',
      relation: '关系重要，但不值得为了维持表面和谐牺牲自己的底线。',
      meaning: '如果冲突消耗了你太多能量，问问自己：这份工作的意义还在吗？',
      balance: '工作中的人际问题会严重影响生活质量，评估这个代价值不值。',
      reward: '如果因为关系问题影响了你的绩效和收入，这是需要认真对待的。',
    },
    reflectionQuestions: [
      '这个冲突里，让你最难受的是什么？',
      '你尝试过什么方法来解决？哪些有用，哪些没用？',
      '你觉得这个冲突的核心是价值观的问题，还是沟通方式的问题？',
      '如果这个问题一直解决不了，你有什么备选方案？',
      '一年后回头看，你希望自己当时怎么处理？',
    ],
  },

  // ===== 11. 倦怠 =====
  burnout: {
    code: 'burnout',
    name: '职业倦怠',
    icon: '😮‍💨',
    description: '感到疲惫、没动力、对工作提不起兴趣',
    keyValues: ['balance', 'meaning', 'achievement', 'growth'],
    guidance:
      '倦怠不是你懒，而是长期过载后的正常反应。' +
      '它是一个信号，告诉你某些方面的价值长期没有被满足。' +
      '先区分是"累了需要休息"还是"这份工作真的不适合了"——休息能恢复的是前者。',
    valueSpecific: {
      achievement: '倦怠时可能什么都不想做，先别逼自己出成绩，恢复状态更重要。',
      security: '倦怠期不要做冲动决定，确保自己有基本的安全感再考虑变化。',
      autonomy: '如果倦怠是因为失控感，从小事开始拿回自主权。',
      growth: '倦怠有时是因为成长停滞——学一点和工作无关的东西也能充电。',
      relation: '倦怠时更需要支持，别一个人扛着，和信任的人聊聊。',
      meaning: '倦怠的核心可能是意义感的丧失——重新连接你做这份工作的初心。',
      balance: '真正的休息不是逃避，是有意识地恢复能量。先把生活找回来。',
      reward: '如果钱是你坚持下去的唯一理由，评估一下这个代价是不是太大了。',
    },
    reflectionQuestions: [
      '你有这种倦怠的感觉多久了？',
      '如果不考虑钱，你还会继续做这份工作吗？',
      '你觉得自己是"累了"，还是"不想干了"？这两个不一样。',
      '上一次你觉得工作有热情是什么时候？那时候和现在有什么不同？',
      '如果给自己放一个长假，你觉得回来后会不一样吗？',
    ],
  },

  // ===== 12. 工作家庭 =====
  work_family: {
    code: 'work_family',
    name: '工作与家庭',
    icon: '👨‍👩‍👧',
    description: '平衡工作和家庭/照顾责任',
    keyValues: ['balance', 'security', 'relation', 'meaning'],
    guidance:
      '工作和家庭不是非此即彼的二元对立，但确实需要取舍和安排。' +
      '不同阶段优先级不一样，这很正常。' +
      '重要的是你的选择是主动的，而不是被动牺牲——如果是被动的，长期会有怨念。',
    valueSpecific: {
      achievement: '有家庭责任后，对"成就"的定义可能会变——这不是退步，是人生阶段的变化。',
      security: '家庭责任让稳定变得更重要，这不是胆小，是负责任。',
      autonomy: '灵活的工作时间和地点对有家庭责任的人格外重要。',
      growth: '家庭也是成长的一部分，别只用职业成就衡量成长。',
      relation: '家庭关系是重要的支持系统，也是需要投入时间维护的。',
      meaning: '工作的意义可能和家庭的意义交织在一起——你是为了什么在工作？',
      balance: '不是时间上的对半分，而是两边都觉得被照顾到了。',
      reward: '收入对家庭很重要，但陪伴也是一种"收入"，只是形式不同。',
    },
    reflectionQuestions: [
      '你现在觉得工作和家庭哪边更需要你？',
      '你对自己现在的平衡程度满意吗？如果不满意，卡在哪？',
      '你的家人怎么看你的工作？他们理解吗？',
      '如果有一个按钮可以改变一件事，你想改变什么？',
      '五年后，你希望自己在工作和家庭之间是什么状态？',
    ],
  },
};

// 获取所有场景列表
export function getAllScenes(): CareerScene[] {
  return Object.values(wvScenes);
}

// 获取场景名称
export function getSceneName(code: SceneCode): string {
  return wvScenes[code]?.name || code;
}

// 根据价值维度推荐相关场景
export function recommendScenesByValues(
  topDimensions: DimensionCode[],
): SceneCode[] {
  const allScenes = getAllScenes();
  const scored = allScenes.map((scene) => {
    const matchCount = scene.keyValues.filter((dim) =>
      topDimensions.includes(dim),
    ).length;
    return { code: scene.code, score: matchCount };
  });
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.code);
}

// 验证 12 个场景
export function validateScenes(): { total: number; valid: boolean } {
  const total = Object.keys(wvScenes).length;
  return { total, valid: total >= 12 };
}
