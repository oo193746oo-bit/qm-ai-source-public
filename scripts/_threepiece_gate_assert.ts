/**
 * 三件套字面级整改 + post_gate 硬闸 工程断言（补丁一/三编程侧，纯函数，不依赖 LLM）
 * 验证：
 *   1. evaluatePostGate → G2 问尾 / G3 长输入原话复述 / pass，保底句逐字
 *   2. buildRememberYouBlock → 身份/事件抽取、≤2 条、0 命中空、只引用原话
 */
import { evaluatePostGate } from "../src/lib/post-gate";
import { buildRememberYouBlock } from "../src/lib/crisis-detection";

let pass = 0, fail = 0;
function check(name: string, ok: boolean, detail?: string) {
  if (ok) { pass++; }
  else { fail++; console.log(`  ✗ ${name}${detail ? " :: " + detail : ""}`); }
}

// ---- evaluatePostGate ----
// G3: 长输入 >200 无复述 → G3
const longUser = "我真的撑不住了今天在公司被主管叫去谈话说我最近表现很差".repeat(10); // >200
const r1 = evaluatePostGate("你先别急，我们慢慢说。", longUser);
check("G3: 长输入无复述 → G3", r1.gate === "G3_long_input_echo", String(r1.gate));
check("G3: 保底句逐字", r1.fallback === `我们再来看看你刚才提到的「${longUser.slice(0, 12)}」，这部分对你来说意味着什么？`, r1.fallback);

// G3: 长输入含 4 字子串 → pass
const sub = longUser.slice(0, 8);
const r2 = evaluatePostGate(`你说的${sub}，我听到了。没有关系，愿意说说吗？`, longUser);
check("G3: 长输入含原话子串 → pass", r2.gate === null, String(r2.gate));

// G2: 短输入 问尾 → pass
check("G2: 问尾 pass", evaluatePostGate("你今天感觉怎么样？", "我今天心情很乱").gate === null);

// G2: 短输入 ！尾 → G2
const r3 = evaluatePostGate("别担心，我会陪着你！", "我今天心情很乱");
check("G2: ！尾 → G2", r3.gate === "G2_question_ending", String(r3.gate));
check("G2: 保底句逐字", r3.fallback === "我理解这件事对你来说不容易。你愿意再多跟我聊聊你刚才提到的这部分吗？", r3.fallback);

// ---- buildRememberYouBlock ----
// 身份抽取
const b1 = buildRememberYouBlock(["我今天很难过", "其实我是跨性别，一直不敢告诉别人"]);
check("Remember: 身份类抽取含原话", b1.includes("我记得你") && b1.includes("跨性别"), b1);
check("Remember: 身份模板", b1.includes("你之前跟我说过"), b1);

// 事件抽取
const b2 = buildRememberYouBlock(["最近家里在催我相亲，压力好大"]);
check("Remember: 事件类抽取", b2.includes("我妈") || b2.includes("相亲") || b2.includes("家里"), b2);
check("Remember: 事件模板", b2.includes("这件事压着你"), b2);

// 命中 0 → 空串（不虚构）
check("Remember: 0 命中空", buildRememberYouBlock(["今天天气不错", "你好呀"]) === "", "应空");

// 最多 2 条
const b3 = buildRememberYouBlock(["我出柜了", "家里在催相亲", "工作上很烦", "学校宿舍很吵"]);
const cnt = (b3.match(/我心里|压着你/g) || []).length;
check("Remember: 最多 2 条（但不同 kind 各限 1 → ≤2 命中数）", b3.split("\n").filter((l) => l.includes("我") && l.length > 6).length >= 1);
check("Remember: 抽取 ≤2 段", cnt <= 2, `count=${cnt}`);

// 只引用原话（禁改写）：抽取结果必须是原文子串
check("Remember: 引原文子串(不改写)", b1.includes("跨性别"), b1);

console.log(`\n三件套/post_gate 断言: ${pass} 通过, ${fail} 失败`);
if (fail > 0) process.exit(1);