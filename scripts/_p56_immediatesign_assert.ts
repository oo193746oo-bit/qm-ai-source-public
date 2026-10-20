// P56（20260925）：危机即时信号漏判修复 断言 —— 增补后的 hasImmediateDangerSignal 判定 + detectCrisis 词表零增删回归
// 用法：npx tsx scripts/_p56_immediatesign_assert.ts （改即时信号正则后须重跑）
import { detectCrisis, hasImmediateDangerSignal, isOtherRiskWithoutUrgency } from "../src/lib/crisis-detection";

const immed = (s: string) => hasImmediateDangerSignal(s);
let fail = 0;
const ok = (cond: boolean, name: string) => {
  if (!cond) { fail++; console.log("  ✗ " + name); }
};

// ① 即时危险：两漏判语料 + 对照（跳楼/割腕/吞药/天台需保持 true 不回归）
const MUST_TRUE: [string, string][] = [
  ["他拿了把刀架在自己脖子上，说现在就要了结", "漏判1 刀架脖子"],
  ["留了遗书说今晚十点在学校顶楼结束自己，还有半小时", "漏判2 遗书+时间地点"],
  ["我朋友说要跳楼，人就在天台上", "对照 站天台要跳"],
  ["我朋友蹲在天台边，说要跳下去", "对照 蹲天台要下跳"],
  ["我朋友锁在浴室里割腕了", "对照 锁浴室割腕"],
  ["ta吞了一整瓶安眠药", "对照 吞安眠药"],
  ["他说他正在天台上，要往下跳", "对照 进行中高位"],
  ["我已经割腕了留了很多血", "对照 割腕流血"],
  ["他站在楼顶边缘", "对照 处高位"],
];
// ② 不降级/不回归：宽松/日常/本人/低危 均不得判为即时危险
const MUST_FALSE: [string, string][] = [
  ["我也很累，但我不敢拒绝，怕ta想不开", "S1 他人风险轻声（P5 降级不回归）"],
  ["我朋友最近状态很差，我有点担心ta，但不知道能做什么", "S1b 他人担忧（isCrisis=False 保持）"],
  ["我好想消失", "S5 想消失不误升即时"],
  ["我不想活了", "S3 本人高危（走完整卡，非即时信号）"],
  ["我最近状态很不好", "S4 低危（P2 轻留不回归）"],
  ["他最近总说想不开，我该怎么办", "宽松词不误升"],
  ["活着好累", "宽松词不误升"],
  ["今天上班好累想早点休息", "日常不误伤"],
];
for (const [s, n] of MUST_TRUE) ok(immed(s), n);
for (const [s, n] of MUST_FALSE) ok(!immed(s), n);

// ③ detectCrisis 词表零增删：漏判2 相配仍为时间地点硬词（非新增词条）；S1 仍第三方；S5 仍 direct；S4 仍 none
const b = detectCrisis("留了遗书说今晚十点在学校顶楼结束自己，还有半小时");
ok(b.level === "direct", "漏判2 detectCrisis=direct（词表未增删）");
const s1 = detectCrisis("我也很累，但我不敢拒绝，怕ta想不开");
ok(isOtherRiskWithoutUrgency(s1), "S1 仍判他人无即时危险（可降级）");
ok(detectCrisis("我不想活了").level === "direct", "S3 direct 不回归");
ok(detectCrisis("我好想消失").level === "direct", "S5 direct 不回归");
ok(!detectCrisis("我最近状态很不好").isCrisis, "S4 none 不回归");

// ==== P0-MERGE 回归块（20260928 Lumen，随 P0 合并修复落盘）====
// 语义=route.ts 补丁后 composed gate（isCrisis 或 hasImmediateDangerSignal）＝进危机链
const P0M_TRUE = [
  ["我不想活了，想给你打最后一个电话", "P0-A D01 电话句"],
  ["有人拿刀架在我脖子上", "P0-B 刀架脖-本人"],
  ["我同学现在把刀架在脖子上", "P0-B 刀架脖-他人语境"],
  ["他拿了把刀架在自己脖子上，说现在就要了结", "P0-B 刀架脖-进行中"],
];
let p0mBefore = fail;
for (const c of P0M_TRUE) {
  const d = detectCrisis(c[0]);
  ok(d.isCrisis || hasImmediateDangerSignal(c[0]), c[1]);
}
console.log("P0-MERGE block: " + (fail === p0mBefore ? "ALL PASS " + P0M_TRUE.length : "FAILED"));

console.log(fail === 0 ? "\nP56 即时信号断言全部通过" : `\n${fail} 项失败`);
process.exit(fail === 0 ? 0 : 1);