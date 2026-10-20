// BatchA P1 (2026-09-17): 价格守门——语序无关共现匹配 + 不报价转微信引导
// 规则：价格词 ∈{多少钱,费用,价格,收费,价位,报价} × 服务词 ∈{咨询,一次,个案,体验,课程,服务}
// 共现即命中（前瞻组合，语序无关），禁仅匹配固定短语（「咨询一次多少钱」式漏网）。
// 命中 → 走既有「不报价转微信」引导（话术原样复用 wechat 直答条目，不改文案）。
// 危机红线不受影响：调用方均在危机检测之后才执行本守门。
export const PRICE_PATTERN = /(?=.*(?:多少钱|费用|价格|收费|价位|报价))(?=.*(?:咨询|一次|个案|体验|课程|服务))/i;

export function detectPriceIntent(text: string): boolean {
  return PRICE_PATTERN.test(text || "");
}

export const PRICE_GATE_REPLY =
  "如果需要预约咨询，可以找小雪帮你确认具体的时间和安排。";
