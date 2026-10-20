/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// QM 职业价值观测评 v4.0 — 28 组 Value Pair Matrix
// 8 × 8 上三角，共 28 组价值组合
// 分类：Synergy（协同）/ Trade-off（取舍）/ Conditional Tension（条件张力）

import type { ValuePair, DimensionCode, PairCategory } from './wv-types';
import { wvDimensions } from './wv-dimensions';

// 生成 28 组组合的定义
export const wvPairMatrix: ValuePair[] = [
  // ===== 1. achievement × security =====
  {
    pair: ['achievement', 'security'],
    category: 'conditional_tension',
    description: '成就感与稳定性的关系取决于环境。在成熟稳定的组织里也能做出成绩，但高挑战往往伴随高风险。',
    synergyWhen: '在有清晰晋升通道的稳定大公司，既能做出成绩又有安全感。',
    tensionWhen: '想追求高成就但需要冒险，和求稳的心态冲突时；或稳定的工作缺乏挑战感时。',
    typicalScenarios: ['选择大公司还是创业公司', '要不要接一个有风险的大项目', '晋升路径不清晰时'],
    observation: '你想要的成就，是不是必须在"不安全"的环境里才能获得？还是说，你需要安全感作为基础，才能放开去做事？',
  },

  // ===== 2. achievement × autonomy =====
  {
    pair: ['achievement', 'autonomy'],
    category: 'synergy',
    description: '自主和成就往往互相促进。有自主权的人更容易做出成果，做出成果后又会获得更多自主权。',
    synergyWhen: '在结果导向的环境里，自己掌控过程，用成果说话，两者互相强化。',
    tensionWhen: '如果太在意自己的方式，可能因为不肯妥协而影响最终成果；或者为了出成绩不得不接受不喜欢的管理方式。',
    typicalScenarios: ['独立负责项目', '和领导管理风格不合', '创业 vs 打工'],
    observation: '对你来说，"做成事"和"按我的方式做"，哪个更重要？有没有过为了结果调整自己方式的经历？',
  },

  // ===== 3. achievement × growth =====
  {
    pair: ['achievement', 'growth'],
    category: 'synergy',
    description: '成就感和成长发展高度协同——做出成绩的过程就是成长，能力成长后又能获得更大的成就。',
    synergyWhen: '在挑战性任务中边做边学，既有产出又有提升。',
    tensionWhen: '当成长需要暂时放慢产出节奏时（比如学习新技能期间），或者为了短期成绩牺牲了长期成长时。',
    typicalScenes: ['选择熟练的事还是新的挑战', '培训期 vs 产出期', '深耕 vs 跨界'],
    observation: '你更享受"已经会了、做得很好"的感觉，还是"正在进步、越来越强"的感觉？',
  },

  // ===== 4. achievement × relation =====
  {
    pair: ['achievement', 'relation'],
    category: 'conditional_tension',
    description: '成就和人际可以并行，但当资源有限或需要竞争时，追求成绩可能影响关系。',
    synergyWhen: '在合作型团队里，大家一起拿结果，关系和成就双丰收。',
    tensionWhen: '为了出成绩需要推动别人、或抢资源时；或太在意别人的感受而不敢争取成绩时。',
    typicalScenarios: ['绩效考核竞争', '项目中需要得罪人', '要不要争一个机会'],
    observation: '你有没有过为了维持关系而放弃一个成绩的机会？反过来呢？你觉得值得吗？',
  },

  // ===== 5. achievement × meaning =====
  {
    pair: ['achievement', 'meaning'],
    category: 'synergy',
    description: '成就感和意义感经常结伴而行——当你做有意义的事时，成绩本身就有了更深的满足感。',
    synergyWhen: '在有使命感的项目里全力以赴，既有成就感也觉得有价值。',
    tensionWhen: '当"做出成绩"和"做正确的事"不一致时；或者做的事有意义但看不到可衡量的成果时。',
    typicalScenarios: ['选择有意义但难出成绩的工作', '为了KPI做不认同的事', '公益 vs 商业'],
    observation: '如果一件事做得很成功但你觉得没意义，你会有什么感觉？反过来呢？',
  },

  // ===== 6. achievement × balance =====
  {
    pair: ['achievement', 'balance'],
    category: 'tradeoff',
    description: '追求高成就通常需要投入更多时间和精力，这与生活平衡存在天然张力。',
    synergyWhen: '高效率、高专注度的工作，既出成绩又不加班太久；或者成就感本身能滋养生活。',
    tensionWhen: '想做出成绩就得加班、牺牲个人时间；或太注重平衡影响了上升速度。',
    typicalScenarios: ['加班文化的公司', '冲刺期 vs 休整期', '升职后更忙了'],
    observation: '你能接受为了成就暂时牺牲平衡吗？那个"暂时"是多久？有没有一条线是你不会越过的？',
  },

  // ===== 7. achievement × reward =====
  {
    pair: ['achievement', 'reward'],
    category: 'synergy',
    description: '成就和经济回报通常正相关——做出成绩往往带来更高的收入。',
    synergyWhen: '在绩效导向的环境里，成绩好自然收入高。',
    tensionWhen: '当成就感来自不赚钱的领域；或者为了钱做自己没有成就感的事时。',
    typicalScenarios: ['选高薪但无聊的工作 vs 低薪但有成就感的', '收入和贡献不匹配时', '转行进不熟悉但高薪的行业'],
    observation: '如果收入一样，你更愿意做有成就感的还是轻松的？如果收入差很多呢？',
  },

  // ===== 8. security × autonomy =====
  {
    pair: ['security', 'autonomy'],
    category: 'tradeoff',
    description: '安全和自主往往此消彼长。越安全的环境通常规则越多、自主越少；越自主的环境往往风险越高。',
    synergyWhen: '在信任度高的稳定组织里，既有安全感又有适当的自主空间。',
    tensionWhen: '稳定的大公司但管得很细， vs 自由但不稳定的工作；想要安全感又不想被约束。',
    typicalScenarios: ['体制内 vs 创业', '大公司 vs 小团队', '远程工作的选择'],
    observation: '如果只能选一个：有保障但不自由，还是自由但没保障？你现在的生活阶段更需要哪个？',
  },

  // ===== 9. security × growth =====
  {
    pair: ['security', 'growth'],
    category: 'conditional_tension',
    description: '稳定的环境可以提供成长的基础，但过于安稳也可能让人失去成长的动力和机会。',
    synergyWhen: '在有完善培训体系的大公司，既稳定又有学习成长的资源。',
    tensionWhen: '舒适区待久了能力退化；或者想成长就得跳出舒适区，面对不确定性。',
    typicalScenarios: ['待在舒适区还是跳出来', '内部晋升 vs 外部跳槽', '学新东西 vs 做熟的事'],
    observation: '你觉得自己是在安全里成长更快，还是在挑战里成长更快？现在的你需要哪个？',
  },

  // ===== 10. security × relation =====
  {
    pair: ['security', 'relation'],
    category: 'synergy',
    description: '稳定的团队和工作环境往往带来好的同事关系，关系好又增加了安全感。',
    synergyWhen: '在人员稳定、氛围好的团队，既有安全感又有人情味。',
    tensionWhen: '当关系好的同事离职或团队变动时，安全感也随之下降；或为了维持关系不敢表达真实想法。',
    typicalScenarios: ['团队重组或裁员', '好朋友走了要不要也走', '新环境的适应'],
    observation: '你的工作安全感更多来自公司和制度，还是来自身边的人？这两个来源哪个更可靠？',
  },

  // ===== 11. security × meaning =====
  {
    pair: ['security', 'meaning'],
    category: 'conditional_tension',
    description: '有意义的工作不一定稳定，稳定的工作不一定有意义。两者可以兼得，但需要寻找。',
    synergyWhen: '在成熟的公益组织、教育或医疗机构，既有意义又相对稳定。',
    tensionWhen: '想做有意义的事但收入不稳定，或者稳定的工作让你觉得没意义。',
    typicalScenarios: ['公益行业 vs 企业', '理想主义和现实的碰撞', '中年危机式的意义追问'],
    observation: '你愿意为了"有意义"牺牲多少稳定性？是一时的热情，还是长期的选择？',
  },

  // ===== 12. security × balance =====
  {
    pair: ['security', 'balance'],
    category: 'synergy',
    description: '稳定的工作通常节奏也更可控，有助于维持生活平衡。',
    synergyWhen: '朝九晚五的稳定工作，下班就是下班，生活有规律。',
    tensionWhen: '过于稳定但无聊的工作，反而让人精神内耗，影响生活质量；或为了维持稳定不得不忍受失衡。',
    typicalScenarios: ['体制内的"稳定但无聊"', '996高薪 vs 低薪规律', '中年人的上有老下有小'],
    observation: '你要的"稳定"是外在的工作稳定，还是内心的生活节奏稳定？这两个有时不是一回事。',
  },

  // ===== 13. security × reward =====
  {
    pair: ['security', 'reward'],
    category: 'conditional_tension',
    description: '稳定和收入的关系取决于行业和阶段。有些稳定的工作收入也不错，但高回报通常伴随高风险。',
    synergyWhen: '在成熟行业的头部公司，既有稳定性收入也不低。',
    tensionWhen: '高风险高回报 vs 低风险稳定收入的选择；或者稳定但收入增长慢。',
    typicalScenarios: ['公务员 vs 互联网', '国企 vs 创业', '底薪+稳定 vs 高薪+波动'],
    observation: '你更愿意要"稳稳的中等收入"还是"可能很高但不确定的收入"？这个选择和你现在的经济状况有关吗？',
  },

  // ===== 14. autonomy × growth =====
  {
    pair: ['autonomy', 'growth'],
    category: 'synergy',
    description: '自主的人更容易主动学习和成长，而成长后又会获得更多自主权。',
    synergyWhen: '在有学习空间的自主环境里，自己决定学什么、怎么成长。',
    tensionWhen: '太自主时没人带，成长全靠自己摸索，可能走弯路；或在有导师带的环境里但不自由。',
    typicalScenarios: ['自学 vs 有人带', '创业式成长 vs 体系化成长', '自由职业的学习焦虑'],
    observation: '你是那种"给我自由我就会自己成长"的人，还是需要结构和引导才能成长？不同阶段答案可能不一样。',
  },

  // ===== 15. autonomy × relation =====
  {
    pair: ['autonomy', 'relation'],
    category: 'conditional_tension',
    description: '自主和关系的张力在于：太独立可能显得不合群，太合群又可能失去自己的节奏。',
    synergyWhen: '在互相尊重边界的团队里，每个人有自己的空间，同时关系也很好。',
    tensionWhen: '喜欢独立做事但被说"不合群"；或者为了维持关系不得不参与不想参加的社交。',
    typicalScenarios: ['内向者在开放办公区', "要不要参加团建", '独立工作 vs 团队协作'],
    observation: '你是怎么平衡"做自己的事"和"融入团队"的？有没有过因为太独立而被误解的时候？',
  },

  // ===== 16. autonomy × meaning =====
  {
    pair: ['autonomy', 'meaning'],
    category: 'synergy',
    description: '自主和意义感相辅相成——当你可以自己选择做什么时，更容易找到有意义的方向。',
    synergyWhen: '自主选择从事有意义的工作，按自己的方式创造价值。',
    tensionWhen: '在不自主的环境里做有意义的事，过程憋屈；或太自由但找不到意义感。',
    typicalScenarios: ['自己创业做有意义的事', '在NGO里但被束缚', '自由职业的意义危机'],
    observation: '如果一件事有意义但你没有自主权，你还能坚持多久？反过来，如果完全自由但暂时没找到意义呢？',
  },

  // ===== 17. autonomy × balance =====
  {
    pair: ['autonomy', 'balance'],
    category: 'conditional_tension',
    description: '自主不一定等于平衡。有自主权的人可能因为自己卷自己而更忙，也可能因为自由安排而更平衡。',
    synergyWhen: '能自主安排时间和节奏，工作生活都兼顾得很好。',
    tensionWhen: '自由职业/远程工作时，工作和生活边界反而模糊了；或者因为太想证明自己而主动加班。',
    typicalScenarios: ['远程工作的自律', '自由职业的作息', '在家办公的边界感'],
    observation: '有了自主权之后，你会让自己更忙还是更平衡？你需不需要外在的界限来保护你的生活？',
  },

  // ===== 18. autonomy × reward =====
  {
    pair: ['autonomy', 'reward'],
    category: 'conditional_tension',
    description: '自主和收入的关系取决于路径选择。自主的路可能上不封顶，也可能收入不稳定。',
    synergyWhen: '在高自主性的高收入岗位（如专家、合伙人、自由职业者），既自由又收入不错。',
    tensionWhen: '想要高薪就得接受管理和规则；想要自主可能要接受收入波动或天花板。',
    typicalScenarios: ['打工 vs 创业', '做管理 vs 做专家', '高薪但不自由 vs 自由但收入不确定'],
    observation: '如果有两份工作：一份薪水高30%但管得很细，一份薪水低一些但很自由，你选哪个？为什么？',
  },

  // ===== 19. growth × relation =====
  {
    pair: ['growth', 'relation'],
    category: 'synergy',
    description: '好的人际关系能促进成长——从同事身上学习、有人带、有反馈，都加速成长。',
    synergyWhen: '在有好导师和好同事的团队，一边成长一边建立关系。',
    tensionWhen: '成长速度和团队不同步，差距拉大影响关系；或者为了成长不得不离开熟悉的团队。',
    typicalScenarios: ['和同事一起成长 vs 一个人跑太快', '跳槽离开好团队', '晋升后和旧同事的关系'],
    observation: '你成长最快的时期，身边有没有重要的人？如果有一天你成长了但圈子变了，你会觉得失落吗？',
  },

  // ===== 20. growth × meaning =====
  {
    pair: ['growth', 'meaning'],
    category: 'synergy',
    description: '成长和意义感互相增强——在有意义的领域成长，成长本身也增加了价值感。',
    synergyWhen: '在自己认同的领域深耕，越成长越觉得有价值。',
    tensionWhen: '在一个没意义的领域成长，能力越强越觉得分裂；或有意义但成长空间有限。',
    typicalScenarios: ['要不要在不认同的行业继续积累', '转行从零开始的代价', '技能迁移的困惑'],
    observation: '如果一件事你做得越来越好，但你越来越不认同它的意义，你会怎么做？',
  },

  // ===== 21. growth × balance =====
  {
    pair: ['growth', 'balance'],
    category: 'tradeoff',
    description: '快速成长往往需要额外投入时间精力，与生活平衡存在张力。',
    synergyWhen: '在可持续的节奏中稳步成长，兼顾生活和提升。',
    tensionWhen: '成长焦虑驱动下的过度学习和自我压榨；或太注重平衡而错过了成长窗口。',
    typicalScenarios: ['工作之余还要学习充电', '成长冲刺期 vs 休整期', '要不要读在职研/MBA'],
    observation: '你愿意为了成长牺牲多少生活平衡？是阶段性的还是长期的？你怎么判断"够了"？',
  },

  // ===== 22. growth × reward =====
  {
    pair: ['growth', 'reward'],
    category: 'synergy',
    description: '成长通常会带来收入增长——能力提升后市场价值也提升。',
    synergyWhen: '能力成长后获得晋升或跳槽涨薪，成长和收入同步。',
    tensionWhen: '成长但收入不涨（比如在低薪行业深耕）；或为了高薪选择成长空间小的工作。',
    typicalScenarios: ['选高成长低起薪 vs 低成长高起薪', '行业天花板 vs 个人成长', '要不要为了钱换赛道'],
    observation: '你更看重"现在的收入"还是"未来的赚钱能力"？你判断一个工作"有没有前途"的标准是什么？',
  },

  // ===== 23. relation × meaning =====
  {
    pair: ['relation', 'meaning'],
    category: 'synergy',
    description: '关系和意义经常交织——帮助他人、服务社区的工作往往既有意义又有人际连接。',
    synergyWhen: '在助人的领域工作，既感到有意义，又和服务对象、同事有深层连接。',
    tensionWhen: '当意义需要独处时（比如创作、研究），与关系需求冲突；或人际关系掩盖了意义的缺失。',
    typicalScenarios: ['一线服务类工作', '社区工作者的人际关系', '从群体意义到个人意义'],
    observation: '你的意义感更多来自"和人连接"还是"做有价值的事本身"？如果没有人看见，你还觉得有意义吗？',
  },

  // ===== 24. relation × balance =====
  {
    pair: ['relation', 'balance'],
    category: 'conditional_tension',
    description: '好的人际关系支持生活平衡，但维持关系也需要时间和精力。',
    synergyWhen: '工作中的好关系让你心情好，下班能更好地享受生活。',
    tensionWhen: '同事社交占用太多个人时间；或把工作关系带到生活里反而分不清边界。',
    typicalScenarios: ['要不要参加下班后的团建', '同事变朋友的边界', '工作关系影响情绪'],
    observation: '你怎么区分"工作中的关系"和"生活中的朋友"？这种区分对你重要吗？',
  },

  // ===== 25. relation × reward =====
  {
    pair: ['relation', 'reward'],
    category: 'conditional_tension',
    description: '关系和收入有时一致有时冲突。在合作型团队里关系好也能帮你赚钱，但涉及利益分配时可能伤害关系。',
    synergyWhen: '和同事一起赚钱、一起成长，关系和收入双丰收。',
    tensionWhen: '为了钱和朋友/同事产生利益纠纷；或者因为关系好不好意思谈钱。',
    typicalScenarios: ['和朋友合伙创业', '薪资谈判中的人情压力', '团队奖金分配'],
    observation: '你有没有过因为钱影响关系的经历？如果有，你觉得是钱的问题还是关系的问题？',
  },

  // ===== 26. meaning × balance =====
  {
    pair: ['meaning', 'balance'],
    category: 'conditional_tension',
    description: '做有意义的事可能让人废寝忘食，但长期失衡反而会消耗意义感。',
    synergyWhen: '在可持续的节奏中做有意义的事，既充实又有生活。',
    tensionWhen: '因为工作太有意义而忍不住投入所有时间，导致生活失衡；或为了平衡放弃有意义但辛苦的工作。',
    typicalScenarios: ['公益/教育行业的工作强度', '"热爱的工作就不会累"是真的吗', '意义感能否支撑你度过疲惫'],
    observation: '你有没有过因为做有意义的事而忘记了生活？那时候你觉得值吗？长期来看呢？',
  },

  // ===== 27. meaning × reward =====
  {
    pair: ['meaning', 'reward'],
    category: 'tradeoff',
    description: '意义和收入的选择是经典的职业困境。有意义的工作通常收入不高，高薪的工作可能不那么有意义。',
    synergyWhen: '找到既有意义又能赚钱的路径（可能需要时间积累）。',
    tensionWhen: '为了钱做不认同的事；或做有意义的事但经济压力大。',
    typicalScenarios: ['理想主义 vs 现实主义', '选有意义的行业还是高薪行业', '先赚钱再做喜欢的事？'],
    observation: '你觉得"有意义"和"有钱"一定矛盾吗？如果只能选一个，你现在选什么？五年后呢？',
  },

  // ===== 28. balance × reward =====
  {
    pair: ['balance', 'reward'],
    category: 'tradeoff',
    description: '生活平衡和经济回报通常存在张力——高薪往往意味着更高的工作强度和时间投入。',
    synergyWhen: '在高效、高时薪的工作中，收入不错且有生活。',
    tensionWhen: '高薪但996，牺牲生活换收入；或轻松但收入低。',
    typicalScenarios: ['996高薪 vs 朝九晚五一般薪资', '时薪 vs 月薪', '要不要拼几年再休息'],
    observation: '你有没有算过自己的时薪？算完之后感觉怎么样？你愿意用多少生活时间换多少钱？',
  },
];

// ===== 辅助函数 =====

/**
 * 获取特定价值组合的定义
 */
export function getValuePair(
  dimA: DimensionCode,
  dimB: DimensionCode,
): ValuePair | undefined {
  return wvPairMatrix.find(
    (p) =>
      (p.pair[0] === dimA && p.pair[1] === dimB) ||
      (p.pair[0] === dimB && p.pair[1] === dimA),
  );
}

/**
 * 根据分类筛选组合
 */
export function getPairsByCategory(category: PairCategory): ValuePair[] {
  return wvPairMatrix.filter((p) => p.category === category);
}

/**
 * 根据用户的8维分数，计算实际的张力/协同程度
 * 张力 = 两个维度分差的绝对值
 * 协同 = 两个维度都高（>60）的程度
 * 
 * 注意：这只是数值参考，真实冲突需要结合场景证据和 Trade-off 模块确认
 */
export function calcPairTension(
  scores: Record<DimensionCode, number>,
  pair: ValuePair,
): { tension: number; synergy: number; note: string } {
  const a = scores[pair.pair[0]] ?? 0;
  const b = scores[pair.pair[1]] ?? 0;
  const gap = Math.abs(a - b);
  const bothHigh = a >= 60 && b >= 60;
  const bothLow = a < 40 && b < 40;

  let tension: number;
  let synergy: number;
  let note = '';

  if (pair.category === 'synergy' && bothHigh) {
    synergy = (a + b) / 2;
    tension = 0;
    note = '两个价值都比较高，且通常能互相促进';
  } else if (pair.category === 'tradeoff' && gap > 20) {
    tension = gap;
    synergy = 0;
    note = '分差较大，这组价值在选择中可能需要取舍';
  } else if (pair.category === 'conditional_tension') {
    if (bothHigh) {
      synergy = (a + b) / 2;
      tension = 0;
      note = '两个价值都重视，在特定情境下可能出现张力';
    } else if (gap > 20) {
      tension = gap;
      synergy = 0;
      note = '分差较大，且这组价值在某些场景下可能冲突';
    } else {
      tension = gap / 2;
      synergy = 0;
      note = '分差不大，但这组价值值得在具体场景中留意';
    }
  } else if (bothLow) {
    tension = 0;
    synergy = 0;
    note = '两个价值优先级都不高，通常不会有明显冲突';
  } else {
    tension = gap / 2;
    synergy = 0;
    note = '分差一般，冲突程度取决于具体情境';
  }

  return { tension, synergy, note };
}

/**
 * 获取 Top N 张力组合
 */
export function getTopTensionPairs(
  scores: Record<DimensionCode, number>,
  topN = 5,
): Array<{ pair: ValuePair; tension: number; note: string }> {
  const results = wvPairMatrix.map((p) => {
    const { tension, note } = calcPairTension(scores, p);
    return { pair: p, tension, note };
  });
  return results
    .filter((r) => r.tension > 10)
    .sort((a, b) => b.tension - a.tension)
    .slice(0, topN);
}

/**
 * 获取 Top N 协同组合
 */
export function getTopSynergyPairs(
  scores: Record<DimensionCode, number>,
  topN = 5,
): Array<{ pair: ValuePair; synergy: number; note: string }> {
  const results = wvPairMatrix.map((p) => {
    const { synergy, note } = calcPairTension(scores, p);
    return { pair: p, synergy, note };
  });
  return results
    .filter((r) => r.synergy > 0)
    .sort((a, b) => b.synergy - a.synergy)
    .slice(0, topN);
}

// 验证 28 组组合数量
export function validatePairMatrix(): {
  total: number;
  byCategory: Record<PairCategory, number>;
  valid: boolean;
} {
  const total = wvPairMatrix.length;
  const byCategory = {
    synergy: wvPairMatrix.filter((p) => p.category === 'synergy').length,
    tradeoff: wvPairMatrix.filter((p) => p.category === 'tradeoff').length,
    conditional_tension: wvPairMatrix.filter((p) => p.category === 'conditional_tension').length,
  };
  return { total, byCategory, valid: total === 28 };
}
