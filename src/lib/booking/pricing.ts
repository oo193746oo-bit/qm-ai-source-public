// QM 预约费用计算引擎 v4.0
import { PRICE_REGISTRY, THERAPISTS } from './data';
import type { FeeCalculation, Therapist } from './types';

// ==================== 核心费用计算 ====================

/**
 * 计算单次或次卡费用
 * @param priceTier 价格档位，如 "700"
 * @param duration 时长（分钟），60 或 90
 * @param isFirstTimer 是否首次咨询
 * @param packSize 次卡数量（5或10），不传则为单次
 */
export function calculateFee(
  priceTier: string,
  duration: 60 | 90,
  isFirstTimer: boolean,
  packSize?: 5 | 10,
): FeeCalculation {
  const tier = PRICE_REGISTRY[priceTier];

  if (!tier) {
    return {
      tier: priceTier,
      duration,
      first_timer: isFirstTimer,
      pack: packSize,
      subtotal: 0,
      discount: 0,
      total: 0,
      manual_review: true,
      review_reason: '价格档位不存在',
    };
  }

  // 次卡计算
  if (packSize === 5) {
    return {
      tier: priceTier,
      duration: 300, // 5小时 = 300分钟
      first_timer: isFirstTimer,
      pack: 5,
      subtotal: tier.regular_60 * 5,
      discount: tier.regular_60 * 5 - tier.pack5,
      total: tier.pack5,
    };
  }

  if (packSize === 10) {
    return {
      tier: priceTier,
      duration: 600, // 10小时 = 600分钟
      first_timer: isFirstTimer,
      pack: 10,
      subtotal: tier.regular_60 * 10,
      discount: tier.regular_60 * 10 - tier.pack10,
      total: tier.pack10,
    };
  }

  // 首次优惠
  if (isFirstTimer) {
    const firstPrice = duration === 60 ? tier.first_60 : tier.first_90;
    const regularPrice = duration === 60 ? tier.regular_60 : tier.regular_90;
    return {
      tier: priceTier,
      duration,
      first_timer: true,
      subtotal: regularPrice,
      discount: regularPrice - firstPrice,
      total: firstPrice,
    };
  }

  // 常规价格
  const regularPrice = duration === 60 ? tier.regular_60 : tier.regular_90;
  return {
    tier: priceTier,
    duration,
    first_timer: false,
    subtotal: regularPrice,
    discount: 0,
    total: regularPrice,
  };
}

// ==================== 退款计算 ====================

/**
 * 计算次卡退款金额
 * 退款 = 已付 - 已用小时 × 购买时常规单小时价
 * 未定义规则或结果异常返回 manual_review
 */
export function calculateRefund(
  paidAmount: number,
  usedHours: number,
  purchaseHourly: number,
  packHours: 5 | 10 = 10,
): { refund: number; manual_review: boolean; reason?: string } {
  // 基础校验
  if (paidAmount <= 0 || usedHours < 0 || purchaseHourly <= 0) {
    return { refund: 0, manual_review: true, reason: '参数异常' };
  }

  // 已用小时不能超过购买总小时（负数退款视为异常）
  if (usedHours > packHours) {
    return {
      refund: paidAmount - usedHours * purchaseHourly,
      manual_review: true,
      reason: '已用时长超过购买时长，需人工确认',
    };
  }

  const usedValue = usedHours * purchaseHourly;
  const refund = paidAmount - usedValue;

  // 退款为负：已用小时价值超过已付金额
  if (refund < 0) {
    return {
      refund,
      manual_review: true,
      reason: '退款金额为负，需人工复核',
    };
  }

  return { refund, manual_review: false };
}

// ==================== 预算范围内的心理师 ====================

/**
 * 返回预算范围内的心理师（按价格从低到高排序）
 * @param budget 预算上限（单次60分钟）
 */
export function getBudgetOptions(budget: number): {
  therapists: Therapist[];
  lowestTier: string | null;
  note?: string;
} {
  // 预算低于最低档
  if (budget < 400) {
    return {
      therapists: [],
      lowestTier: '400',
      note: '我们目前最低收费档位为400元/60分钟。如果预算比较紧张，可以先了解首次优惠价，或等预算调整后再考虑。',
    };
  }

  const therapists = THERAPISTS.filter(
    (t) => t.price <= budget && t.role === '心理师',
  ).sort((a, b) => a.price - b.price);

  // 找到最低可用档位
  const tiers = Object.keys(PRICE_REGISTRY)
    .map(Number)
    .sort((a, b) => a - b);
  const lowestTier = tiers.find((t) => t <= budget)?.toString() || null;

  return { therapists, lowestTier };
}

// ==================== 费用卡文案生成 ====================

/**
 * 生成费用卡的情绪理解文案
 * 根据用户语境选择不同的开场
 */
export function getFeeEmotionLine(context: {
  justChecking?: boolean;
  budgetAnxiety?: boolean;
  firstTime?: boolean;
  longTerm?: boolean;
}): string {
  if (context.budgetAnxiety) {
    return '理解你对费用的在意。咨询是持续的投入，先把价格和不同方案了解清楚再决定，是对自己负责的做法。';
  }
  if (context.firstTime) {
    return '第一次咨询难免想先试试看合不合适，我们有首次体验价，可以先感受一下。';
  }
  if (context.longTerm) {
    return '如果你在考虑长期咨询，费用确实是需要提前规划的部分。我给你看看不同方案的选择。';
  }
  if (context.justChecking) {
    return '想先了解一下费用很正常，我给你介绍一下我们的收费方式。';
  }
  return '我给你介绍一下我们的收费方式，你可以根据自己的情况选择。';
}

// ==================== 人工复核规则判断 ====================

const MANUAL_REVIEW_RULES = [
  '90分钟次卡扣时',
  '跨心理师使用次卡',
  '不同价位换师剩余时数换算',
  '家庭/伴侣次卡',
  '首次优惠后同日购次卡',
  '部分心理师首次优惠名单',
  '特殊议题独立定价',
  '退款手续费/渠道/发票',
  '取消/改期/迟到扣费',
];

/**
 * 判断某个费用场景是否需要人工复核
 */
export function needsManualReview(scenario: string): boolean {
  const lower = scenario.toLowerCase();
  return MANUAL_REVIEW_RULES.some((rule) => {
    const keywords = rule.split(/[/、]/);
    return keywords.some((kw) => lower.includes(kw.toLowerCase()));
  });
}

// ==================== 获取价格档位列表 ====================

/**
 * 获取所有可用价格档位（按价格升序）
 */
export function getAllTiers(): { key: string; tier: typeof PRICE_REGISTRY[string] }[] {
  return Object.entries(PRICE_REGISTRY)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([key, tier]) => ({ key, tier }));
}
