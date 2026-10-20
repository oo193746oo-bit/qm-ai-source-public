// E-2 B 惰性注入断言：拆段完整性 + 核心不减配 + 命中/不命中行为
// 运行：npx tsx scripts/_e2b_lazy_assert.ts
import { readFileSync } from "fs";
import { join } from "path";
import {
  splitLazyFromSp,
  injectLazyBlocks,
  LAZY_BLOCKS,
} from "../src/lib/sp-sections";

const sp = readFileSync(join(process.cwd(), "src/lib/qm-system-prompt-full.md"), "utf-8");

let pass = 0;
let fail = 0;
function assert(cond: boolean, name: string) {
  if (cond) {
    pass++;
    console.log(`  \u2713 ${name}`);
  } else {
    fail++;
    console.error(`  \u2717 ${name}`);
  }
}
const counts = (s: string, m: string) => s.split(m).length - 1;

const { base, lazy } = splitLazyFromSp(sp);

// 1) 惰性块可定位且非空（注入时能取到原文）
for (const def of LAZY_BLOCKS) {
  assert(
    Object.prototype.hasOwnProperty.call(lazy, def.key) &&
      Boolean(lazy[def.key]) &&
      lazy[def.key].trim().length > 0,
    `惰性块可定位【${def.key}】`
  );
}

// 2) 核心前置不减配：危机(应急预案)/回应结构/输出纪律/内容防火墙恒定在 base
const CORE_MARKERS: [string, string][] = [
  ["危机热线", "12356"],
  ["危机热线", "15001930070"],
  ["回应结构", "共情"],
  ["输出纪律", "不超过"],
  ["内容防火墙", "防火墙"],
];
for (const [name, marker] of CORE_MARKERS) {
  assert(counts(base, marker) >= 1, `核心前置在 base 不减配【${name}】含「${marker}」`);
}

// 3) 命中注入 / 不命中不注入 / onboarding 仅首轮
{
  const hit = injectLazyBlocks(["我想做个心理评估测一下，有量表吗？"], lazy);
  assert(hit.blocks.length >= 1 && hit.activated.includes("assessment"), "测评词命中注入 assessment");
}
{
  const hit = injectLazyBlocks(["帮我预约心理师，看下收费标准"], lazy);
  assert(hit.activated.includes("therapist"), "预约词命中注入 therapist");
}
{
  const hit = injectLazyBlocks(["今天天气不错"], lazy);
  assert(hit.blocks.length === 0, "无关输入零注入");
}
{
  const first = injectLazyBlocks(["第一次用，教教我怎么操作"], lazy, { firstTurn: true });
  const later = injectLazyBlocks(["第一次用，教教我怎么操作"], lazy, { firstTurn: false });
  assert(first.activated.includes("onboarding"), "onboarding 首轮注入");
  assert(later.blocks.length === 0, "onboarding 非首轮不注入文本");
}

// 4) 拆段守恒：base + 所有惰性块 ≈ 原 SP（无内容丢失，仅空白规整）
const lazyTotal = Object.values(lazy).reduce((a, t) => a + t.length, 0);
const mag = Math.abs(base.length + lazyTotal - sp.replace(/\s+/g, " ").length);
assert(mag < 2000, `拆段守恒：base+惰性 ≈ 原 SP（偏差 ${mag}）`);

console.log(`\nE2B 惰性注入断言: ${pass} 通过, ${fail} 失败`);
if (fail > 0) process.exit(1);