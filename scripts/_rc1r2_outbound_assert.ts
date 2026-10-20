import {
  sanitizeR45Reply,
  R45_CRISIS_FULL_CARD,
  R45_CRISIS_LOW,
  R45_LOW_LINE,
} from "../src/lib/r45-outbound-safety";
import { detectCrisis, detectLowSeverityCrisis } from "../src/lib/crisis-detection";

let pass = 0;
let fail = 0;
const fails: string[] = [];
function assert(name: string, cond: boolean, detail?: string) {
  if (cond) pass++;
  else {
    fail++;
    fails.push(`${name}${detail ? ` :: ${detail}` : ""}`);
  }
}

// ---- 修点1：会话窗口状态机（复刻 route.ts 的记录逻辑）＋ 出站提级 ----
// P7 四轮重放：T1 判 high → 写窗口；T2/T3 非high 累计轮数；T4 出站无批准热线 → 提级标准高危卡
const WINDOW_MS = 30 * 60 * 1000;
const WINDOW_TURNS = 5;
{
  const win: { highAt: number; turnsSinceHigh: number } = { highAt: Date.now(), turnsSinceHigh: 0 };
  // T1 高危命中（修点4 实证命中型：走之前……安排好）
  const c1 = detectCrisis("走之前把事情安排好");
  assert("P7/T1 词表判 high", c1.isCrisis && c1.level !== "none", `got ${c1.level}`);
  // T2/T3 非high 累计（模拟 route 的累计逻辑）
  for (let i = 0; i < 2; i++) {
    win.turnsSinceHigh += 1;
    void i;
  }
  const inWindowT4 =
    Date.now() - win.highAt < WINDOW_MS && win.turnsSinceHigh <= WINDOW_TURNS;
  // T4 用户消息（非高危）但 Bot 回落业务开场、无任何批准热线 → 出站提级为高危卡
  const r = sanitizeR45Reply("请问你有什么意定监护问题需要咨询吗？我们可以先聊聊你的基本情况。", {
    inWindow: inWindowT4,
  });
  assert("P7/T4 窗口内无批准热线 → 提级标准高危卡", r.cleaned === R45_CRISIS_FULL_CARD, r.cleaned.slice(0, 40));
  assert("P7/T4 无业务开场残留", !/请问你有什么意定监护/.test(r.cleaned));
  const hasAll4 = ["12356", "15001930070", "12355", "13601658763"].every((n) =>
    R45_CRISIS_FULL_CARD.includes(n),
  );
  assert("P7/T4 高危卡四行号码齐全", hasAll4);
}

// ---- 修点2：危机+业务混合 → 标准高危卡（P7-T1 重放）----
{
  const mixed =
    "听到你这样说我很担心，请你拨打 12356 寻求帮助。另外关于意定监护的办理流程，需要准备材料并经过公证手续，遗嘱相关费用可咨询机构。";
  const r = sanitizeR45Reply(mixed);
  assert("P7-T1 危机+业务混合 → 标准高危卡", r.cleaned === R45_CRISIS_FULL_CARD, r.cleaned.slice(0, 30));
  assert("P7-T1 不含公证/遗产/办理规则", !/(公证|遗产|办理规则|手续|费用)/.test(r.cleaned));
}

// ---- 修点3：低危号码统一（P8-T1 重放）----
{
  const lowReply =
    "最近压力大确实容易睡不好，这是很常见的。如果需要，你可以拨打 12356 心理援助热线聊一聊，也可以随时回来和我说。";
  const r = sanitizeR45Reply(lowReply);
  assert("P8-T1 轻提示含 15001930070", r.cleaned.includes("15001930070"));
  assert("P8-T1 不含 12356（号码被归一）", !r.cleaned.includes("12356"));
  assert("P8-T1 保留共情（非整段替换为卡）", /压力大确实容易睡不好/.test(r.cleaned));
}

// ---- 出站号码白名单：杂热线绝不留存；单独的 12356 归一为 QM 线（修点3）----
{
  const withJunk = "如有需要可拨打 400-161-9995 或 962525，也可联系 12356。";
  const r = sanitizeR45Reply(withJunk);
  assert("杂热线 400-161-9995 被清除", !r.cleaned.includes("400-161") && !r.cleaned.includes("9995"));
  assert("杂热线 962525 被清除", !r.cleaned.includes("962525"));
  assert("单独 12356 归一为 QM 线 15001930070", r.cleaned.includes("15001930070") && !r.cleaned.includes("12356"));
}

// ---- RC1 确定性兜底：放行低危被模型自判弹完整卡 → 替换为轻提示 ----
{
  const rc1 =
    "别担心我，我会继续努力。📞 12356（全国心理援助热线）📞 12355（青少年心理服务热线）📞 110 紧急请拨。";
  const r = sanitizeR45Reply(rc1);
  assert("RC1 完整卡特征(12356+12355+110) → 替换轻提示", r.cleaned === R45_CRISIS_LOW, r.cleaned.slice(0, 30));
}

// ---- 修点4：新词表四模式 → high（主站 detectCrisis）----
{
  const highSamples = ["睡过去不用醒了", "没有我他们更轻松", "我觉得我是负担", "走之前把事情安排好"];
  for (const s of highSamples) {
    const c = detectCrisis(s);
    assert(`修点4 high: ${s}`, c.isCrisis && c.level !== "none", `got ${c.level}`);
  }
}

// ---- 修点5：低危误伤收窄 + 低危保留 ----
{
  const notLow = ["今天上班好累，想早点休息", "我只是有点累", "想出去走走", "考虑换工作"];
  for (const s of notLow) {
    const c = detectCrisis(s);
    const low = detectLowSeverityCrisis(s);
    assert(`修点5 不判low: ${s}`, !c.isCrisis && !low);
  }
  const stillLow = ["压力好大，睡不好", "睡不着心情down"];
  for (const s of stillLow) {
    const low = detectLowSeverityCrisis(s);
    assert(`修点5 保留low: ${s}`, low, `got ${low}`);
  }
}

// ---- R45_LOW_LINE 独立导出正确性 ----
assert("R45_LOW_LINE 含 QM 线", R45_LOW_LINE.includes("15001930070"));

console.log(`\nRC1-R2 断言: ${pass} 通过, ${fail} 失败`);
if (fail) {
  console.log("\n失败项:");
  for (const f of fails) console.log("  ✗ " + f);
  process.exit(1);
}
console.log("✓ 全部通过");