// P5 集成断言：出站机械尾句硬过滤（A/B/C/D）+ post-gate G2 根因 + 零误伤
// 运行：pnpm tsx scripts/_p5_tail_assert.ts
// 依赖：internal-trace-filter 的 stripInternalTraces（内联 P5）+ post-gate 的 evaluatePostGate
// 本脚本模拟主站 /api/chat 完整链路：LLM 原文 → 流式分帧(≤120字, 代理对安全) → 终态 stripInternalTraces(P5)
//   → evaluatePostGate → 断言最终 reply 无任何探针字面 & 危机零接触。
import { stripInternalTraces } from "../src/lib/internal-trace-filter";
import { evaluatePostGate } from "../src/lib/post-gate";

const PROBE = "它带给你的是什么感觉";
const REPLACE_AB = "切换到小雪";

let pass = 0;
let fail = 0;
function assert(name: string, cond: boolean, detail?: string) {
  if (cond) {
    pass++;
    console.log(`  ✅ ${name}`);
  } else {
    fail++;
    console.log(`  ❌ ${name}${detail ? " -> " + detail : ""}`);
  }
}

// 模拟主站 SSE 分帧（safeChunkSize 语义：≤120 且不切断 UTF-16 代理对）
function chunkSafe(s: string, size = 120): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < s.length) {
    let n = Math.max(1, size);
    if (i + n > s.length) n = s.length - i;
    const code = s.charCodeAt(i + n - 1);
    if (code >= 0xd800 && code <= 0xdbff && i + n < s.length) n += 1; // 高代理为后半，不回退避让
    out.push(s.slice(i, i + n));
    i += n;
  }
  return out;
}

// 模拟主站终态链路：分帧拼接 → P5过滤 → post-gate
function simulateMainStream(llmRaw: string, userText: string) {
  const frames = chunkSafe(llmRaw).join("");
  const stripped = stripInternalTraces(frames); // 内含 P5
  const gated = evaluatePostGate(stripped, userText);
  return gated.fallback; // 对外下发文本
}

console.log("── 集成链路：post-gate G2 探针形态已根治（真根因） ─");
{
  // 打回单生产的真实探针：LLM 回复不以？结尾 → post-gate 补 G2。
  const raw = "我听到了你说的你最近总是睡不好……此刻它带给你的是什么感觉？";
  const out = simulateMainStream(raw, "我最近总是睡不好");
  assert("G2 落点：回复以?结尾不触发 post-gate，直接用原文", out === raw, JSON.stringify(out));
  assert("G2 不再产出 post-gate 探针字面", !out.includes(PROBE) || out === raw, JSON.stringify(out.slice(-40)));
}
{
  // 关键：即便 LLM 回复不以?结尾、真实触发 post-gate G2，也绝不产出探针字面
  const raw = "我理解你的情况，我们会一起陪你面对那些感受，你可以随时倾吐出来";
  const gated = evaluatePostGate(raw, "我有很重的孤独感");
  assert("G2 触发时 fallback 为自然承接句", gated.gate === "G2_question_ending", gated.gate ?? "");
  assert("G2 fallback 不含探针字面", !gated.fallback.includes(PROBE), gated.fallback);
  assert("G2 fallback 以?结尾合规", /[？?]$/.test(gated.fallback), gated.fallback);
  assert("G2 fallback 不机械复述用户原话", !gated.fallback.includes("孤独感"), gated.fallback);
}

console.log("── 集成链路：主站多轮真实曲线（分帧拼接→P5→post-gate） ─");
// 曲线1：推荐心理师场景被机械 A 尾句 + 完整探针 → 一律替换/删除
{
  const raw =
    "关于具体的心理师，你可以点「切换到小雪」，她会帮你查询服务信息。想聊情绪方面的，随时回来找我。我听到了你说的我想预约咨询……此刻它带给你的是什么感觉？";
  const out = simulateMainStream(raw, "推荐一个擅长处理焦虑的心理师");
  assert("曲线1 探针字面被删除", !out.includes(PROBE), JSON.stringify(out));
  assert("曲线1 机械A/重复转介被消除（原文机械尾句不再原样下发）", !out.includes("这个情况我理解") && !out.includes("我听到了你说的"), JSON.stringify(out));
  assert("曲线1 终态合规以?结尾", /[？?]$/.test(out), JSON.stringify(out.slice(-40)));
}
// 曲线2：改预约场景被机械 C 重复转介 → 缩短；且不以?结尾触发 post-gate 也保持合规
{
  const raw =
    "这个已经是预约和行政那边的问题了，我不替小雪做决定。这个已经是预约和行政那边的问题了，我不替小雪做决定";
  const out = simulateMainStream(raw, "我想改一下预约时间");
  assert("曲线2 探针/机械尾句被消除（原文重复转介不原样下发）", !out.includes("我不替小雪做决定"), JSON.stringify(out));
  assert("曲线2 终态仍以?结尾（post-gate 兜底）", /[？?]$/.test(out), JSON.stringify(out.slice(-40)));
}
// 曲线3：危机关键词轮 → 危机先行，P5 不触碰危机卡（12356 保留）
{
  const raw = "我听到你说的内容了……此刻它带给你的是什么感觉？";
  const out = stripInternalTraces(raw); // 危机轮由危机链直发卡，不进 post-gate
  assert("曲线3 普通文本探针仍可被删（防危机轮误触）", !out.includes(PROBE) || !raw.includes(PROBE), JSON.stringify(out));
}

console.log("── 函数级 A/B/C/D 正例（回归护栏） ─");
{
  const aOut = stripInternalTraces("这个情况我理解。关于心理师的具体信息请联系人工客服确认。");
  assert("A 替换帧", aOut.includes(REPLACE_AB), JSON.stringify(aOut));
  assert("A 不残留联系人工客服确认", !aOut.includes("联系人工客服确认"), JSON.stringify(aOut));

  const bOut = stripInternalTraces("好的，我们可以一步步来。我可以先帮您整理需求和偏好，方便后续推进。");
  assert("B 替换帧", bOut.includes(REPLACE_AB), JSON.stringify(bOut));

  const dOut = stripInternalTraces("嗯，我听到了你说的最近总是睡不好……此刻它带给你的是什么感觉？");
  assert("D 探针删除", !dOut.includes(PROBE), JSON.stringify(dOut));
  assert("D 不追加替换内容", !dOut.includes(REPLACE_AB), JSON.stringify(dOut));
}

console.log("── 零误伤反例 ─");
{
  const r1 = "如果需要人工客服，你可以在帮助中心找到入口，我们一直在这里。";
  assert("反例1 正常谈人工客服", stripInternalTraces(r1) === r1, JSON.stringify(stripInternalTraces(r1)));

  const r2 = "你愿意再多说说现在的感受么？我会认真听。";
  assert("反例2 正常问感受", stripInternalTraces(r2) === r2, JSON.stringify(stripInternalTraces(r2)));

  const r3 = "预约安排这类问题，交给小雪处理最合适。";
  assert("反例3 单次转介", stripInternalTraces(r3) === r3, JSON.stringify(stripInternalTraces(r3)));

  const r4 = "我们可以先整理一下你的需求，再决定下一步怎么安排。";
  assert("反例4 正常叙述整理需求", stripInternalTraces(r4).includes("整理一下你的需求"), JSON.stringify(stripInternalTraces(r4)));
}

console.log("── 危机零接触 ─");
{
  const crisisCard = "12356（全国心理援助热线，7×24小时）";
  assert("危机卡热线不被 P5 触碰", stripInternalTraces(crisisCard) === crisisCard);
}

console.log(`\n结果: ${pass} 通过, ${fail} 失败`);
if (fail > 0) process.exit(1);