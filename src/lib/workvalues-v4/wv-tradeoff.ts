/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// QM 职业价值观测评 v4.0 — Value Trade-off 第二层（可选模块）
// 成对取舍、Must-have / Nice-to-have / Deal-breaker / Negotiable 识别
// 与 Likert 基础分分开存储，AI 不得自行猜用户底线

import type {
  TradeoffQuestion,
  TradeoffResult,
  DimensionCode,
  TradeoffStatus,
} from './wv-types';

// ===== 成对取舍题目 =====
// 从 28 组组合中选取最常见的关键组合，设计情境化的二选一题目
export const tradeoffQuestions: TradeoffQuestion[] = [
  {
    id: 'TO_01',
    dimensionA: 'achievement',
    dimensionB: 'balance',
    scenario:
      '一份工作很有挑战性，做成了会很有成就感，但需要经常加班。' +
      '另一份工作内容相对常规，但很少加班，生活比较平衡。' +
      '如果只能选一个，你更倾向于哪一边？',
  },
  {
    id: 'TO_02',
    dimensionA: 'security',
    dimensionB: 'growth',
    scenario:
      '一份工作很稳定，几乎不用担心失业，但成长空间有限。' +
      '另一份工作成长性很强，能学到很多东西，但不确定性也比较大。' +
      '你更看重哪一边？',
  },
  {
    id: 'TO_03',
    dimensionA: 'autonomy',
    dimensionB: 'security',
    scenario:
      '一份工作很自由，你可以自己决定怎么做，但收入和稳定性都不太确定。' +
      '另一份工作很稳定、制度完善，但管得比较细，自主空间不大。' +
      '你会怎么选？',
  },
  {
    id: 'TO_04',
    dimensionA: 'meaning',
    dimensionB: 'reward',
    scenario:
      '一份工作很有意义，能帮助别人，但收入一般。' +
      '另一份工作收入很高，但你觉得工作本身没什么特别的意义。' +
      '如果只能选一个，你更倾向于哪边？',
  },
  {
    id: 'TO_05',
    dimensionA: 'achievement',
    dimensionB: 'relation',
    scenario:
      '一个项目机会很有挑战性，做好了能大大加分，但需要和同事竞争资源。' +
      '另一个选择是维持好的团队关系，不抢风头，但可能错过这个机会。' +
      '你会怎么选？',
  },
  {
    id: 'TO_06',
    dimensionA: 'balance',
    dimensionB: 'reward',
    scenario:
      '一份工作薪水高30%，但加班比较多，个人时间会少很多。' +
      '另一份工作薪水一般，但下班就是下班，生活比较规律。' +
      '你更愿意选哪边？',
  },
  {
    id: 'TO_07',
    dimensionA: 'growth',
    dimensionB: 'balance',
    scenario:
      '一个机会能让你快速成长、能力大提升，但未来一年都会很辛苦。' +
      '另一个选择是保持现在的节奏，生活工作平衡，但成长会慢一些。' +
      '你更倾向于？',
  },
  {
    id: 'TO_08',
    dimensionA: 'autonomy',
    dimensionB: 'relation',
    scenario:
      '你可以选择独立负责一个项目，自己说了算，但大部分时间是一个人干。' +
      '或者加入一个氛围很好的团队，大家一起做事，但你需要配合团队的节奏。' +
      '你更喜欢哪种？',
  },
];

// ===== 底线识别题目 =====
// 直接询问用户：哪些是必须的，哪些是完全不能接受的

export interface DealBreakerQuestion {
  id: string;
  dimension: DimensionCode;
  statement: string;
}

// 必须有（少了就不考虑）
export const mustHaveQuestions: DealBreakerQuestion[] = [
  { id: 'MH_01', dimension: 'security', statement: '工作稳定对我来说是必须的，不稳定的工作我不考虑' },
  { id: 'MH_02', dimension: 'balance', statement: '生活平衡对我来说是底线，经常加班的工作我不做' },
  { id: 'MH_03', dimension: 'meaning', statement: '工作要有意义，纯粹赚钱的工作我坚持不了' },
  { id: 'MH_04', dimension: 'reward', statement: '收入必须达到某个水平，低于那个数我不考虑' },
];

// 完全不能接受
export const dealBreakerQuestions: DealBreakerQuestion[] = [
  { id: 'DB_01', dimension: 'autonomy', statement: '被管得太细、事事要汇报的工作，我完全不能接受' },
  { id: 'DB_02', dimension: 'relation', statement: '办公室政治严重、同事关系复杂的环境，我会立刻走' },
  { id: 'DB_03', dimension: 'achievement', statement: '完全没有挑战性、每天混日子的工作，我做不下去' },
  { id: 'DB_04', dimension: 'growth', statement: '学不到东西、看不到成长的工作，我无法长期待下去' },
];

// ===== Trade-off 结果计算 =====

export interface TradeoffAnswers {
  forcedChoices: Record<string, DimensionCode>; // 成对选择的结果：questionId → 选中的维度
  mustHaves: string[];  // 用户勾选的"必须有"题目 ID
  dealBreakers: string[]; // 用户勾选的"完全不能接受"题目 ID
}

/**
 * 从 Trade-off 答案中计算各维度的取舍状态
 * 注意：这是用户明确表达的底线，AI 不得自行推断
 */
export function calcTradeoffResult(answers: TradeoffAnswers): TradeoffResult {
  const mustHaveSet = new Set<DimensionCode>();
  const dealBreakerSet = new Set<DimensionCode>();
  const niceToHaveSet = new Set<DimensionCode>();
  const negotiableSet = new Set<DimensionCode>();

  // 处理 must-have
  for (const qId of answers.mustHaves) {
    const q = mustHaveQuestions.find((x) => x.id === qId);
    if (q) mustHaveSet.add(q.dimension);
  }

  // 处理 deal-breaker
  for (const qId of answers.dealBreakers) {
    const q = dealBreakerQuestions.find((x) => x.id === qId);
    if (q) dealBreakerSet.add(q.dimension);
  }

  // 处理成对选择：被选得多的维度优先
  const choiceCount: Record<string, number> = {};
  for (const [, dim] of Object.entries(answers.forcedChoices)) {
    choiceCount[dim] = (choiceCount[dim] || 0) + 1;
  }

  const sortedByChoice = Object.entries(choiceCount).sort((a, b) => b[1] - a[1]);

  // 排名前 2-3 的（且不是 must-have 的）作为 nice-to-have
  let niceCount = 0;
  for (const [dim] of sortedByChoice) {
    if (mustHaveSet.has(dim as DimensionCode)) continue;
    if (dealBreakerSet.has(dim as DimensionCode)) continue;
    if (niceCount < 2) {
      niceToHaveSet.add(dim as DimensionCode);
      niceCount++;
    } else {
      negotiableSet.add(dim as DimensionCode);
    }
  }

  // 未被分类的维度默认是 negotiable
  const allDims: DimensionCode[] = [
    'achievement', 'security', 'autonomy', 'growth',
    'relation', 'meaning', 'balance', 'reward',
  ];
  for (const dim of allDims) {
    if (
      !mustHaveSet.has(dim) &&
      !dealBreakerSet.has(dim) &&
      !niceToHaveSet.has(dim) &&
      !negotiableSet.has(dim)
    ) {
      negotiableSet.add(dim);
    }
  }

  return {
    completed: true,
    mustHave: Array.from(mustHaveSet),
    niceToHave: Array.from(niceToHaveSet),
    dealBreaker: Array.from(dealBreakerSet),
    negotiable: Array.from(negotiableSet),
    forcedChoicePattern: answers.forcedChoices,
  };
}

// ===== 与基础分的关系 =====

/**
 * 比较 Trade-off 结果与 Likert 基础分的一致性
 * 用于发现"嘴上说重要但实际选择时不选"的有趣模式
 */
export function compareTradeoffWithScores(
  tradeoff: TradeoffResult,
  scores: Record<DimensionCode, number>,
): Array<{ dimension: DimensionCode; pattern: string; note: string }> {
  const findings: Array<{ dimension: DimensionCode; pattern: string; note: string }> = [];

  for (const dim of tradeoff.mustHave) {
    const score = scores[dim];
    if (score < 50) {
      findings.push({
        dimension: dim,
        pattern: '分低但是 must-have',
        note: '你说这个价值"必须有"，但它在问卷中的分数不高。' +
          '可能是因为你之前没意识到它有多重要，或者平时不觉得但底线很清晰。',
      });
    }
  }

  for (const dim of tradeoff.dealBreaker) {
    const score = scores[dim];
    if (score >= 50) {
      findings.push({
        dimension: dim,
        pattern: '分不低但是 deal-breaker',
        note: '这个价值在问卷中分数不低，但你说它缺失时你"完全不能接受"。' +
          '说明它的"底线属性"比"加分属性"更强——有了不觉得，没了不行。',
      });
    }
  }

  return findings;
}

// 验证 Trade-off 模块
export function validateTradeoff(): {
  forcedChoiceCount: number;
  mustHaveCount: number;
  dealBreakerCount: number;
  statusCategories: TradeoffStatus[];
} {
  return {
    forcedChoiceCount: tradeoffQuestions.length,
    mustHaveCount: mustHaveQuestions.length,
    dealBreakerCount: dealBreakerQuestions.length,
    statusCategories: ['must_have', 'nice_to_have', 'deal_breaker', 'negotiable'],
  };
}
