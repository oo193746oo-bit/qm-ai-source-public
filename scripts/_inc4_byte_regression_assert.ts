// 四处增量四断言：尾句字节级回归警报（防"修一句冒一句" · P0 · 2026-09-14）
// 元规则：两句话术（旧"此刻它带给你的是什么感觉" + 新"我理解这件事对你来说不容易"）均已进剥离黑名单，
// 不得在真实输出层跨场景复发（任何命中=黄色报警，本断言 fail）。同时校验二者在代码中的受控位点：
// 允许作为"剥离规则本身"存在于 internal-trace-filter（新版 TAIL_E）与 post-gate（承接句生产位），
// 但同一句不得在非受控位点再冒出（防回归扩散）。
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { stripInternalTraces } from "../src/lib/internal-trace-filter";

const root = path.resolve(__dirname, "..");
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

// ---- 1) 两句话术都必须在剥离体系中（旧 D 句全形式 + 新 E 句） ----
t("旧D句全形式已进剥离体系", /TAIL_D_FULL|此刻它带给你的是什么感觉/.test(readLib()));

// ---- 2) 输出层字节级回归：黑名单句在任意探针回复里复发即报警 ----
const BLACKLIST = [
  "此刻它带给你的是什么感觉",
  "我理解这件事对你来说不容易。你愿意再多跟我聊聊你刚才提到的这部分吗",
];
const probeReplies = [
  "先听听你说，确实不容易。我听到了你说的很难熬。此刻它带给你的是什么感觉？", // 复发 → 应被剥离
  "嗯，我先把你这部分接住。此刻它带给你的是什么感觉？", // 复发 → 应被剥离
  "先回应一下你说的，你辛苦了。我理解这件事对你来说不容易。你愿意再多跟我聊聊你刚才提到的这部分吗？", // 复发 → 应被剥离
];
t("黑名单句在输出层复发 → strip 剥离后不残留", (() => {
  let clean = true;
  for (const rep of probeReplies) {
    const out = stripInternalTraces(rep);
    if (BLACKLIST.some((phrase) => out.includes(phrase))) clean = false;
  }
  return clean;
})());
// 探针语义确认：每个复发回复剥离后必发生变化（证明规则命中而非漏网）
t("复发回复确实被剥离（规则命中）", (() => {
  const changed = probeReplies.every((rep) => stripInternalTraces(rep) !== rep);
  return changed;
})());

// ---- 3) 代码位点受控：同一句不得在非受控源再冒出（防"防一句冒一句"） ----
// 允许位点：internal-trace-filter（剥离规则） + post-gate（承接句生产位）。其余文件若出现即视为扩散。
t("新句「我理解这件事对你来说不容易」仅存在于受控位点", (() => {
  const allowed = ["internal-trace-filter.ts", "post-gate.ts"];
  const locs = locateOccurrences("我理解这件事对你来说不容易");
  return locs.length >= 2 && locs.every((f) => allowed.some((a) => f.endsWith(a)));
})());
t("旧句「此刻它带给你的是什么感觉」仅存在于受控位点", (() => {
  // 受控位点：internal-trace-filter(剥离规则 TAIL_D_FULL) + pro-inject.ts(防复发纪律文本引用警示，非输出)。
  // 若扩散到其它文件(尤其输出/拼接层)视为复发，报警。
  const allowed = ["internal-trace-filter.ts", "pro-inject.ts"];
  const locs = locateOccurrences("此刻它带给你的是什么感觉");
  return locs.length >= 1 && locs.every((f) => allowed.some((a) => f.endsWith(a)));
})());

// ---- 4) 全链路：一轮典型低落长回复（含 D 尾句 + E 重复）剥离后无黑名单残留 ----
{
  const dirty =
    "你最近不容易，先陪你坐一会儿。\n" +
    "我听到了你说的压力很大。此刻它带给你的是什么感觉？\n" +
    "我理解这件事对你来说不容易。你愿意再多跟我聊聊你刚才提到的这部分吗？\n" +
    "我理解这件事对你来说不容易。你愿意再多跟我聊聊你刚才提到的这部分吗？";
  const out = stripInternalTraces(dirty);
  t("全链路含D+E双重复发 → 剥离后无黑名单残留", (() => {
    return !out.includes("此刻它带给你的是什么感觉") && !out.includes("你愿意再多跟我聊聊你刚才提到的这部分吗");
  })());
}

// eslint-disable-next-line no-console
console.log(`\ntotal: ${pass + fail}, pass: ${pass}, fail: ${fail}`);
assert.ok(fail === 0, `增量四字节回归断言 ${fail} 项失败`);

function readLib(): string {
  return fs.readFileSync(path.join(root, "src/lib/internal-trace-filter.ts"), "utf8");
}

function locateOccurrences(phrase: string): string[] {
  const hits: string[] = [];
  const files = collectFiles(path.join(root, "src"));
  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    if (content.includes(phrase)) hits.push(file);
  }
  return hits;
}

function collectFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectFiles(full));
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}