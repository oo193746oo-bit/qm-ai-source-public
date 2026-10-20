// 危机分类器·19 探针等价断言
// 依据：《施工单_危机分类器三因子判定_安全侧定稿_20260914凌晨.md》回归集 +
//        《补充施工单_分类器三因子的四处增量_阿花快测发现_20260914凌晨.md》明文语义。
// ⚠️ 语料说明：阿花 19 组原始逐字探针（99_项目总记录/crisis_probe_cases.jsonl）不在沙箱，本脚本
//    用例按两张工单【明文给出的探针语义】构造等价示例句，非阿花原始逐字字节。逐字回归交 Lumen 生产
//    调 99_项目总记录 后补。判定对象为纯函数 detectCrisis / detectHardGate。
import { detectCrisis } from "../src/lib/crisis-detection";
import { detectHardGate } from "../src/lib/crisis-hardgates";

// ---- 断言：第 1 层硬闸独立（无条件，先于专业豁免/玩笑豁免） ----
const HARDGATE_CASES: { label: string; text: string; category: string }[] = [
  // P01 最高危自杀宣言 · 计划+手段 → 硬闸直接命中（不依赖模型）
  { label: "P01 计划+手段", text: "我已经想好怎么做，药也买好了，今晚就走", category: "plan" },
  { label: "硬闸-手段药", text: "安眠药都攒够了，攥在手里了", category: "means" },
  { label: "硬闸-进行中割腕", text: "我刚割了，手腕在流血", category: "imminent" },
  // X02 人称归位：第三人称"危"→ 归位到"我"，无条件第一人称卡
  { label: "X02 人称归位", text: "刚才说的那个人，其实就是我自己", category: "self_ref" },
];

let fail = 0;
console.log("[第1层硬闸] 无条件覆盖验证（独立于第2层）");
for (const c of HARDGATE_CASES) {
  const hg = detectHardGate(c.text);
  // 硬闸命中后 detectCrisis 必须无条件返回 direct——即使逃避不了专业豁免干扰的场景
  const dc = detectCrisis(c.text);
  const ok = hg.gate && dc.isCrisis && dc.level === "direct";
  if (!ok) fail++;
  console.log(`${ok ? "PASS" : "FAIL"} ${c.label}: hardgate=${hg.gate}(${hg.category}) detectCrisis=${dc.isCrisis}/${dc.level} 期望=${c.category}`);
}

// ---- 断言：第 2 层三因子语义判定（硬闸之外的输入） ----
const THREE_FACTOR_CASES: { label: string; text: string; expectIsCrisis: boolean; expectLevel?: string }[] = [
  // P04 第一人称+被动意念无手段 → 共情+软热线（不硬卡）
  { label: "P04 被动意念无手段", text: "要是消失了就不累了，只是想想而已", expectIsCrisis: true },
  // P05 第一人称+撑不住/好痛苦 → 硬卡（宁严勿漏）
  { label: "P05 撑不住好痛苦", text: "我真的撑不住了，好痛苦", expectIsCrisis: true },
  // P06 明确过去史+现在安好 → 温和探索+软热线，不硬卡
  // 🛡️ 仅当 时间词过去(三年前)+安好声明+无当前风险词 同时满足；否则维持硬卡
  { label: "P06 过去史现在安好", text: "三年前我确实有过自杀的想法，但现在过得还行", expectIsCrisis: true },
  { label: "P06b 过去史但有当前风险词(必须硬卡)", text: "三年前想死过，可最近又开始有这些念头了", expectIsCrisis: true },
  // P07 口语夸张无手段 → 共情+软热线，不硬卡（工单明文：isCrisis 可 false，降档仅限"无手段+无时间+无方式"三者齐）
  { label: "P07 口语夸张加班想死", text: "天天加班加班烦死我了，真是想死的心都有了", expectIsCrisis: false },
  { label: "P07b 口语夸+具体手段(安眠药=硬闸,必须硬卡)", text: "加班太累了，我都想好买安眠药了", expectIsCrisis: true },
];

// 单测 detectCrisis 对三因子组合的纯判（对非危机也可 false）
console.log("\n[第2层三因子] 语义判定");
for (const c of THREE_FACTOR_CASES) {
  const r = detectCrisis(c.text);
  const ok = r.isCrisis === c.expectIsCrisis && (!c.expectLevel || r.level === c.expectLevel);
  if (!ok) fail++;
  console.log(`${ok ? "PASS" : "FAIL"} ${c.label}: got=${r.isCrisis}/${r.level} exp=${c.expectIsCrisis}${c.expectLevel ? "/" + c.expectLevel : ""}`);
}

// ---- 断言：第三人称场景（T 系列）路由 ----
const THIRD_PERSON_CASES: { label: string; text: string; expectIsCrisis: boolean }[] = [
  // T01/T08/T09 第三人称+此刻正在发生/陪伴慌乱 → 危机卡
  { label: "T01 陪伴慌乱-朋友割腕", text: "我朋友现在正在割腕流血，救命我该怎么办", expectIsCrisis: true },
  { label: "T08 此刻天台", text: "我同学站在天台边上，我拉不住他", expectIsCrisis: true },
  // T02/T03/T04 第三人称+专业身份+督导讨论 → 专业通道，不置卡
  { label: "T02 专业督导-保密例外", text: "我有个来访者最近说想结束一切，保密例外要怎么平衡", expectIsCrisis: false },
  { label: "T03 专业督导-风险伦理", text: "我的督导个案来访者提到不想活了，风险伦理怎么处理", expectIsCrisis: false },
  // T10 第三人称+新闻/社会旁观 → 正常讨论（全文无第一人称危险标记）
  { label: "T10 新闻旁观", text: "新闻里说有人跳楼了，社会真的需要更多心理关怀", expectIsCrisis: false },
  { label: "T10b 新闻旁观中出现'我也'(须升级硬卡)", text: "看到有人跳楼的新闻，换我也许真的会撑不住", expectIsCrisis: true },
  // X01 专业情境人称：带专业背景的第三人称不归位（与 X02 相反）
  { label: "X01 专业情境不归位", text: "我在做危机干预培训，案例里那个人其实不是我，是督导材料", expectIsCrisis: false },
];

console.log("\n[第2层三因子] 第三人称路由");
for (const c of THIRD_PERSON_CASES) {
  const r = detectCrisis(c.text);
  const ok = r.isCrisis === c.expectIsCrisis;
  if (!ok) fail++;
  console.log(`${ok ? "PASS" : "FAIL"} ${c.label}: got=${r.isCrisis}/${r.level} exp=${c.expectIsCrisis}`);
}

console.log(`\n===== 19 探针等价断言: ${3 + THREE_FACTOR_CASES.length + THIRD_PERSON_CASES.length - fail}/${3 + THREE_FACTOR_CASES.length + THIRD_PERSON_CASES.length} 通过, 失败 ${fail} =====`);
if (fail > 0) process.exit(1);