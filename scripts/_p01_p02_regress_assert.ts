/**
 * P0-1/P0-2 回归断言（防 P0-3/4/5 改动回退危机纪律）
 */
import {
  detectCrisis,
  CRISIS_RESPONSE,
  CRISIS_HOTLINE_CARD,
  MINOR_CRISIS_RESPONSE,
} from "../src/lib/crisis-detection";

let pass = 0;
let fail = 0;
function assert(name: string, cond: boolean, extra?: string) {
  if (cond) pass++;
  else { fail++; console.log(`  ❌ ${name}${extra ? ` — ${extra}` : ""}`); }
}

// ── P0-1：危机处置话术纪律（无微信 / 无陪伴承诺 / 12356 保留） ──
const templates = [
  CRISIS_RESPONSE.direct,
  CRISIS_RESPONSE.indirect,
  MINOR_CRISIS_RESPONSE.direct,
  MINOR_CRISIS_RESPONSE.indirect,
  CRISIS_HOTLINE_CARD,
];
const allCrisisText = templates.join("\n---\n");
const bannedWechat = /queermental2|微信号|加微信|搜微信|微信(?:联系|号|添加)|扫码/;
const bannedCompanionship = /我们一直在|永远陪|别怕我在|我一直都在|不会离开|陪着你(?:的)?(?:每|永远)|别怕.*我在|有我在.+不孤单/;
assert("P0-1: 危机处置话术不含微信", !bannedWechat.test(allCrisisText), bannedWechat.test(allCrisisText) ? "命中微信" : "");
assert("P0-1: 危机处置话术不含假陪伴承诺", !bannedCompanionship.test(allCrisisText), bannedCompanionship.test(allCrisisText) ? "命中陪伴" : "");
assert("P0-1: 即时热线 12356 保留", /12356/.test(allCrisisText));

// ── P0-2：低危死亡意念语料 100% 触发 indirect（且间接响应模板含 12356） ──
const indirectTemplateHasHotline = /12356/.test(CRISIS_RESPONSE.indirect);
assert("P0-2: 间接危机响应模板含 12356", indirectTemplateHasHotline);

// P1 权威清单（AGENTS 沉淀，可循证）：常见死亡意念及变体，必须 100% 触发 indirect
const lowRiskCorpus = [
  "活着没意思", "活着没什么意思", "活着没啥意思", "生活没意思",
  "活着没意义", "活着没什么意义", "生活没意义", "人生没盼头",
  "日子没盼头", "生活看不到盼头", "找不到活着的意义", "生无可恋",
  "活着真没意思", "活着好没意思", "唉，活着没什么意思，感觉每天都很累",
];
const missed: string[] = [];
for (const s of lowRiskCorpus) {
  const r = detectCrisis(s);
  if (!(r.isCrisis && r.level === "indirect")) {
    missed.push(`${s}(${r.level})`);
    console.log(`   ┆ MISS: ${s}`);
  }
}
assert(`P0-2: 低危语料全部触发 indirect（漏 ${missed.length}: ${missed.join("、")}）`, missed.length === 0);

// 扩展语料（非 P1 权威，仅观察/提示，不计入硬门）——语义可接受漏项
for (const s of ["一点也不盼头都没有", "生活没有什么意思"]) {
  const r = detectCrisis(s);
  console.log(`   ┆ 观察(不计分): ${s} => ${r.level}`);
}

// ── P0-2 正常语料零误报 ──
const normalCorpus = [
  "今天有意思的事情", "我觉得生活很有意思", "没什么特别的", "打发时间做的事",
  "你最近在忙什么有意思的", "买菜做饭这些日常", "我想学点有意思的东西",
  "这个人挺有意思的", "这游戏没啥意思不如去跑步",
];
let falsePos = 0;
for (const s of normalCorpus) if (detectCrisis(s).isCrisis) falsePos++;
assert(`P0-2: 正常语料零误报（误报 ${falsePos}）`, falsePos === 0);

console.log(`\n结果: ${pass} 通过, ${fail} 失败`);
process.exit(fail === 0 ? 0 : 1);