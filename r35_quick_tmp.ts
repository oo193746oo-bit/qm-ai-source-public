// R35 危机收尾修复快测——R34 22 用例口径零退化 + R35 新增（否定残留2句/整瓶错位/转折守卫/needsSupport）
// 远端 workspace 用 tsx/esbuild 运行，直调真实 detectCrisis
import { detectCrisis, hasImmediateDangerSignal, CRISIS_RESPONSE } from "./src/lib/crisis-detection";

type Expect = "direct" | "gentle" | "none";
const CASES: [string, string, Expect][] = [
  // ---- R34 原口径（16 词面用例，零退化）----
  ["C1-割手腕弹卡", "割手腕", "direct"],
  ["C2-服药过量弹卡", "服药过量", "direct"],
  ["C3-划手腕弹卡", "划手腕", "direct"],
  ["C4-吞整瓶弹卡", "吞整瓶", "direct"],
  ["A1-我不想自杀降gentle", "我不想自杀", "gentle"],
  ["A2-我没想自杀降gentle", "我没想自杀", "gentle"],
  ["A3-哪天要是假设豁免", "哪天要是我不想活了", "gentle"],
  ["B1-钥匙对我没用非危机", "钥匙对我没用", "none"],
  ["B2-这方法对我没用非危机", "这方法对我没用", "none"],
  ["R1-我想死完整卡不变", "我想死", "direct"],
  ["R2-我不想活了完整卡不变", "我不想活了", "direct"],
  ["R3-自残完整卡不变", "自残", "direct"],
  ["R4-我很多余保留", "我很多余", "direct"],
  ["R5-没用的人自述保留", "我觉得自己是个没用的人", "direct"],
  ["N1-按时服药非危机", "按时服药", "none"],
  ["N2-我很不好正常", "我很不好", "none"],
  // ---- R35 新增：7 句否定全豁免（阿花 r34_result 残留）----
  ["A4-我没有要自杀降gentle", "我没有要自杀", "gentle"],
  ["A5-我不是想死降gentle", "我不是想死", "gentle"],
  ["A6-我不想死降gentle", "我不想死", "gentle"],
  ["A7-我并不想死降gentle", "我并不想死", "gentle"],
  ["A8-难过但不想自杀降gentle", "每天很难过但我不想自杀", "gentle"],
  ["A9-我不会自杀的降gentle", "我不会自杀的", "gentle"],
  ["A10-没有想过自杀降gentle", "我没有想过自杀", "gentle"],
  // ---- R35 新增：整瓶错位词形（真服药过量进完整档）----
  ["C5-整瓶安眠药错位弹卡", "我要把整瓶安眠药都吃了", "direct"],
  ["C6-吃了整瓶弹卡", "昨晚吃了整瓶安眠药", "direct"],
  ["C7-吞了整瓶变体", "她吞了整瓶药", "direct"],
  // ---- R35 新增：否定+整瓶防误报 / 转折守卫宁严勿漏 ----
  ["N3-我没吃整瓶药非危机", "我没吃整瓶药，别担心", "none"],
  ["G1-转折守卫不豁免", "我不难过但想自杀", "direct"],
  ["G2-转折守卫整瓶", "我没吃整瓶药，但我想自杀", "direct"],
];
let pass = 0, fail = 0;
const fails: string[] = [];
for (const [name, text, expect] of CASES) {
  let r: any;
  try { r = detectCrisis(text); } catch (e: any) { r = { isCrisis: "THROW", level: String(e).slice(0, 60) }; }
  const ok = expect === "none" ? !r.isCrisis : r.isCrisis === true && r.level === expect;
  if (ok) pass++; else { fail++; fails.push(name); }
  console.log(`${ok ? "PASS" : "FAIL"} ${name} isCrisis=${r.isCrisis} level=${r.level} ns=${r.needsSupport}`);
}

// R35 needsSupport 一致性断言：豁免句 ns=true；direct 句 ns=undefined
let nsOK = true;
for (const t of ["我没有要自杀", "我不是想死", "我不想自杀"]) {
  const r: any = detectCrisis(t);
  if (!(r.isCrisis && r.level === "gentle" && r.needsSupport === true)) { nsOK = false; fails.push(`NS-豁免-${t}`); }
}
for (const t of ["我想死", "割手腕", "我要把整瓶安眠药都吃了"]) {
  const r: any = detectCrisis(t);
  if (!(r.isCrisis && r.level === "direct" && r.needsSupport === undefined)) { nsOK = false; fails.push(`NS-direct-${t}`); }
}
if (nsOK) { pass++; console.log("PASS NS-needsSupport一致性(3gentle+3direct)"); } else { fail++; console.log("FAIL NS-needsSupport一致性"); }

// 即时信号层同口径抽查（R34 口径，未改动层零退化）
const imm: [string, boolean][] = [
  ["割手腕", true], ["服药过量", true], ["正在割手腕", true], ["按时服药", false], ["钥匙对我没用", false],
];
for (const [t, want] of imm) {
  const got = hasImmediateDangerSignal(t);
  const ok = got === want;
  if (ok) pass++; else { fail++; fails.push(`IMM-${t} got=${got}`); }
  console.log(`${ok ? "PASS" : "FAIL"} IMM-${t} got=${got}`);
}

// direct 完整卡资源行断言（110/120 由 CRISIS_HOTLINE_CARD_WITH_EMERGENCY 携带）
const card = CRISIS_RESPONSE.direct;
const resOk = card.includes("12356") && card.includes("15001930070") && card.includes("110") && card.includes("120");
if (resOk) { pass++; console.log("PASS CARD-资源行12356/15001930070/110/120齐全"); } else { fail++; fails.push("CARD-资源行"); }

console.log(`FAILS: ${JSON.stringify(fails)}`);
console.log(`SUMMARY: ${pass}/${pass + fail} PASS`);
