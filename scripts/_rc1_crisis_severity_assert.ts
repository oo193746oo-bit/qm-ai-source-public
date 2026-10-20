/**
 * RC1 危机呈现分级回归断言（主站 + R45 同标准）
 * - high（直接/间接死亡意念）→ 完整热线卡（12356 + 12355 + 110/120），无禁号
 * - low（纯低落情绪）→ 轻提示模板：共情 + 15001930070 + 继续对话，无完整卡特征
 * - 存疑 → 一律 high（宁高勿低）
 * - 13601658763 在危机模板保留
 */
import {
  detectCrisis,
  detectLowSeverityCrisis,
  CRISIS_RESPONSE,
  MINOR_CRISIS_RESPONSE,
  CRISIS_HOTLINE_CARD,
  CRISIS_LOW_RESPONSE,
} from "../src/lib/crisis-detection";

let pass = 0;
let fail = 0;
function assert(name: string, cond: boolean, extra?: string) {
  if (cond) pass++;
  else { fail++; console.log(`  ❌ ${name}${extra ? ` — ${extra}` : ""}`); }
}

const FULL_CARD = /12356[\s\S]*12355/; // 完整卡特征：12356 与 12355 同现
const BANNED = /962525|400-161-9995/;

// ── 高危样例：必须命中 完整卡（isCrisis=true），无禁号 ──
const highCorpus = [
  "我不想活了",
  "站阳台想跳，跳下去就解脱了",
  "觉得活着没意思",
  "觉得活着好累，没盼头",
];
for (const s of highCorpus) {
  const r = detectCrisis(s);
  assert(`high: 高危样命中危机 →完整卡 [${s}]`, r.isCrisis, `level=${r.level}`);
}

// ── 低危样例：detectCrisis=false，但 detectLowSeverityCrisis=true → 轻提示 ──
const lowCorpus = [
  "日子灰灰的",
  "最近好累，压力大",
  "睡不着，心情down",
];
for (const s of lowCorpus) {
  const r = detectCrisis(s);
  const low = detectLowSeverityCrisis(s);
  assert(`low: 纯低落 NOT 危机级 [${s}]`, !r.isCrisis, `level=${r.level}`);
  assert(`low: 命中低危轻提示 [${s}]`, low, "未命中 detectLowSeverityCrisis");
}

// ── 低危模板特性：无完整卡特征、含 15001930070、不含禁号 ──
assert("low模板: 不含完整四行卡特征", !FULL_CARD.test(CRISIS_LOW_RESPONSE), "误含 12356+12355");
assert("low模板: 含 15001930070 轻提示", /15001930070/.test(CRISIS_LOW_RESPONSE));
assert("low模板: 不含禁号", !BANNED.test(CRISIS_LOW_RESPONSE));

// ── 高危模板：完整卡保留（12356+12355），136 保留，无禁号 ──
const allHigh = [CRISIS_RESPONSE.direct, CRISIS_RESPONSE.indirect, MINOR_CRISIS_RESPONSE.direct, MINOR_CRISIS_RESPONSE.indirect, CRISIS_HOTLINE_CARD].join("\n");
assert("high模板: 含 12356", /12356/.test(allHigh));
assert("high模板: 含 12355", /12355/.test(allHigh));
assert("high模板: 4行含110/120", /110/.test(allHigh) && /120/.test(allHigh));
assert("high模板: 13601658763 保留", /13601658763/.test(CRISIS_HOTLINE_CARD) || /13601658763/.test(allHigh));
assert("high模板: 无禁号", !BANNED.test(allHigh));

// ── 存疑样例：宁高勿低（不得落到 low 轻提示降级） ──
// 存疑表达若被危机词库命中→high 完整卡；若未命中→按现有阈值走 LLM（判定阈值不动）。
// 无论哪种，都不得被低危判器降级为 low 轻提示（防漏拦）。
for (const s of ["感觉活着好累，连呼吸都没有力气", "撑不住了，不知道活着干嘛"]) {
  const low = detectLowSeverityCrisis(s);
  assert(`存疑→不落 low [${s}]`, low === false, `误判 low=${low}`);
}

// ── RC1R1 补丁：消失类被动死亡意念 → 必须 high（完整卡），不得漏判 ──
const vanishRelief = [
  "感觉消失了就好了",
  "我消失了大家就轻松了",
  "干脆消失算了",
  "要是我不在了，会不会更好",
];
for (const s of vanishRelief) {
  const r = detectCrisis(s);
  assert(`RC1R1 消失类→危机 [${s}]`, r.isCrisis, `level=${r.level}`);
}

// ── RC1R1 补丁：中性消失/其他语义零误伤（不触发危机） ──
const vanishSafe = [
  "照片里的水印消失了",
  "关掉开关灯光就消失了",
  "我们消失了半天去吃饭",
];
for (const s of vanishSafe) {
  const r = detectCrisis(s);
  assert(`RC1R1 消失中性句零误伤 [${s}]`, !r.isCrisis, `误判 level=${r.level}`);
}

// ── RC1R1 补丁：低危模板通用化（不再硬编码"灰灰的"，无完整卡、含轻提示） ──
assert("RC1R1 low模板: 无灰灰的硬编码示例", !/日子有点灰灰的/.test(CRISIS_LOW_RESPONSE));
assert("RC1R1 low模板: 共情承接", /不容易|有些累|辛苦了/.test(CRISIS_LOW_RESPONSE));
assert("RC1R1 low模板: 无完整卡特征", !FULL_CARD.test(CRISIS_LOW_RESPONSE));
assert("RC1R1 low模板: 含 15001930070", /15001930070/.test(CRISIS_LOW_RESPONSE));
assert("RC1R1 low模板: 引导继续对话", /继续|说说|告诉我|愿意说/.test(CRISIS_LOW_RESPONSE));

console.log(`\nRC1 危机分级断言: ${pass} 通过, ${fail} 失败`);
process.exit(fail > 0 ? 1 : 0);