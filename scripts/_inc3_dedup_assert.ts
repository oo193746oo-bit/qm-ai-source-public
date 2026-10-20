// 四处增量三断言：长回复整段逐字重复 2 遍去重（P0 · 2026-09-14）
// 生产 N09：长回复整段被完整复制 2 遍。根因=P0-3 dedupeRepeatedParagraphs 的 blocks.length<3 过早返回
//（恰好 2 段相同不去重）。本断言验证修复：AABB、A-B-A-B、仅标点差异均收敛为一份；正常多段不受影响。
// 在 internal-trace-filter 整链路出口 stripInternalTraces 上断言（兼容 P0-3 全链）。
import assert from "node:assert/strict";
import { stripInternalTraces } from "../src/lib/internal-trace-filter";

let pass = 0;
let fail = 0;
function t(name: string, cond: boolean) {
  if (cond) {
    pass++;
    // eslint-disable-next-line no-console
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    // eslint-disable-next-line no-console
    console.error(`  ✗ ${name}`);
  }
}

// AABB：整段完全重复 2 遍（无空行分隔 → 单 block？）
// dedupeRepeatedParagraphs 以 \n{2,} 分块；"A\n\nA" 是 2 个 block 相同 → 修复后收敛 1 份
const AABB = "我理解你现在压力很大，喘不过气的感觉很难熬。\n\n我理解你现在压力很大，喘不过气的感觉很难熬。";
t("AABB(整段2遍无分隔) → 去重为1份", (() => {
  const out = stripInternalTraces(AABB);
  return (out.match(/喘不过气/g) || []).length === 1;
})());

// A-B-A-B 顺序重复（4 段，两两交错）
const ABAB = "第一段内容。\n\n这里是第二段。\n\n第一段内容。\n\n这里是第二段。";
t("A-B-A-B 交错重复 → 各保留1份", (() => {
  const out = stripInternalTraces(ABAB);
  return (out.match(/第一段内容/g) || []).length === 1 &&
         (out.match(/这里是第二段/g) || []).length === 1;
})());

// 仅标点差异的整段重复
const PunctDiff = "你最近很不容易，要好好照顾自己。\n\n你最近很不容易，要好好照顾自己！";
t("仅标点差异整段重复 → 收敛1份", (() => {
  const out = stripInternalTraces(PunctDiff);
  return (out.match(/好好照顾自己/g) || []).length === 1;
})());

// 恰 2 段完全相同（blocks=2，旧逻辑 <3 早年返回）
const TwoBlocksSame = "正段一。\n\n正段一。";
t("恰2段相同 → 收敛1份(修复<3限制)", (() => {
  const out = stripInternalTraces(TwoBlocksSame);
  return (out.match(/正段一/g) || []).length === 1;
})());

// 正常不重复：内容各异的段落 → 全部保留
const NormalPara = "第一段。\n\n第二段是不同的内容。\n\n第三段再次不同。";
t("正常多段各不同 → 全部保留", (() => {
  const out = stripInternalTraces(NormalPara);
  return out.includes("第一段") && out.includes("第二段是不同的内容") && out.includes("第三段再次不同");
})());

// 正常对话不削（无重复同段，行级不误伤）
const Chat = "你好！今天感觉怎么样？\n\n我挺好的，谢谢。";
t("正常对话不受影响", stripInternalTraces(Chat).includes("你好") && stripInternalTraces(Chat).includes("我挺好的"));

// eslint-disable-next-line no-console
console.log(`\ntotal: ${pass + fail}, pass: ${pass}, fail: ${fail}`);
assert.ok(fail === 0, `增量三去重断言 ${fail} 项失败`);