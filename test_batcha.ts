// BatchA 单测：P1 价格守门 + P2 G2 问尾扩展 + P3 isSelfTalk 保真
import { detectPriceIntent, PRICE_GATE_REPLY } from "./src/lib/price-gate";
import { evaluatePostGate } from "./src/lib/post-gate";
import { stripInternalTraces } from "./src/lib/internal-trace-filter";

let pass = 0, fail = 0;
function chk(name: string, cond: boolean) {
  if (cond) { pass++; console.log("PASS", name); }
  else { fail++; console.log("FAIL", name); }
}

// ---- P1 价格守门：4 变体全拦 ----
chk("P1-V1 咨询多少钱一次", detectPriceIntent("咨询多少钱一次"));
chk("P1-V2 多少钱一次", detectPriceIntent("多少钱一次"));
chk("P1-V3 你们咨询一次多少钱？可以微信支付吗", detectPriceIntent("你们咨询一次多少钱？可以微信支付吗"));
chk("P1-V4 你们一次多少钱？我也不确定一次有没有用", detectPriceIntent("你们一次多少钱？我也不确定一次有没有用"));
// 反例不误伤
chk("P1-N1 депрессия和抑郁的区别", !detectPriceIntent("депрессия和抑郁的区别"));
chk("P1-N2 课程怎么报名", !detectPriceIntent("课程怎么报名"));
// 引导话术不报价
chk("P1-R1 无档位数字", !/400|1500|8\s*档/.test(PRICE_GATE_REPLY) && PRICE_GATE_REPLY.includes("queermental2"));

// ---- P2 G2 问尾判定扩展 ----
const g2a = evaluatePostGate("今天先聊到这里。", "嗯");
chk("P2-N1 真陈述句仍挂签名档", g2a.gate === "G2_question_ending");
const g2b = evaluatePostGate("很晚了，早点休息。如果（想聊随时问就好~）<resource>/kb/D05/D05-001 x</resource>", "嗯");
chk("P2-V1 括号软问尾+尾部resource块 不挂", g2b.gate === null);
const g2c = evaluatePostGate("这部分对你来说意味着什么呢", "嗯");
chk("P2-V2 问尾问句 不挂", g2c.gate === null);
const g2d = evaluatePostGate("难过的时候不用一个人扛。随时问我~", "嗯");
chk("P2-V3 随时问+波浪线结尾 不挂", g2d.gate === null);

// ---- P3 isSelfTalkLine 保真 ----
const s1 = stripInternalTraces("**称呼永远跟着ta用**\n正文内容保持完整。");
chk("P3-V1 加粗称呼行存活", s1.includes("称呼永远跟着ta用"));
const s2 = stripInternalTraces("你今天睡得怎么样？\n后续正文。");
chk("P3-V2 问句短行存活", s2.includes("你今天睡得怎么样？"));
const s3 = stripInternalTraces("继续写：把上面整理成回复\n正文。");
chk("P3-V3 真内部标记行仍剥", !s3.includes("继续写"));
const s4 = stripInternalTraces("**小雪这样就好**\n正文。");
chk("P3-V4 含强词的加粗行存活", s4.includes("小雪这样就好"));
const s5 = stripInternalTraces("要不要重新来一轮聊聊？\n正文。");
chk("P3-V5 含强词的问句行存活", s5.includes("要不要重新来一轮聊聊？"));
const s6 = stripInternalTraces("（内部自检：这段有没有违禁词）\n正文。");
chk("P3-V6 硬内部标记行仍剥", !s6.includes("内部自检"));

console.log(`RESULT ${pass}/${pass + fail}`);
if (fail > 0) process.exit(1);
