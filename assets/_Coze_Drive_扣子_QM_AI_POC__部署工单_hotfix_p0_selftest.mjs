/**
 * HOTFIX-P0 SSE 流式脱敏热修 · 部署前自测脚本
 * 用法：node hotfix_p0_selftest.mjs        （Node 18+，零依赖）
 * 输出：每条断言 PASS/FAIL，结尾 ALL OK 或 HAS FAIL（退出码 1）
 *
 * 覆盖：随机切块 vs 全文处理一致性 / 替换短语≤1 次 / 无 U+FFFD/残字 /
 *       日常闲聊 20 条 / 危机 5 条（标记透传+热线数据不丢）/ 真名脱敏 /
 *       emoji 混排 / 长文本 / 空 chunk / 单字节 chunk / 幂等 / 长度上界 /
 *       多出口 replaceOutput 收敛 / state_update 透传 / 元探针（故障形态必被抓住）
 */

// ---------- 被测物 1：服务端 sanitizeNames（与工单 name-sanitizer.ts v1.1 同逻辑）----------
const PSYCHOLOGIST_NAMES = ["丁怡", "潘新瑞", "舒瑱"];
const STAFF_NAMES = ["孙贝", "孫貝", "陈瑜倩", "陳瑜倩", "Susan", "Candice", "Christy", "Lara", "Piggy", "Lumen", "雪花"];
const ID_FRAGMENTS = ["3101151989", "3205231974", "3101101979"];
const PSY_PLACEHOLDER = "PSYCH";
const splitReplace = (t, f, to) => t.split(f).join(to);
function sanitizeNames(text) {
  if (!text || typeof text !== "string") return text;
  let out = text;
  for (const id of ID_FRAGMENTS) out = splitReplace(out, id, "***");
  for (const n of STAFF_NAMES) out = splitReplace(out, n, "我们工作人员");
  for (const n of PSYCHOLOGIST_NAMES) out = splitReplace(out, n, PSY_PLACEHOLDER);
  out = out.replace(new RegExp(`${PSY_PLACEHOLDER}(?:\\s*[、，,和与及]\\s*${PSY_PLACEHOLDER})+`, "g"), "您提到的几位心理师");
  out = splitReplace(out, PSY_PLACEHOLDER, "您提到的那位心理师");
  out = out.replace(/我们工作人员(?:\s*[、，,和与及]\s*我们工作人员)+/g, "我们几位工作人员");
  return out;
}
function chunkByCodePoint(text, size) {
  const pieces = [];
  let buf = "", n = 0;
  for (const ch of text) { buf += ch; n++; if (n >= size) { pieces.push(buf); buf = ""; n = 0; } }
  if (buf) pieces.push(buf);
  return pieces;
}

// ---------- 被测物 2：闸 v1.1（输入：上游 SSE 字节流；输出：闸后 SSE 字节流；同工单逻辑）----------
function runGate(sourceBytes) {
  const decoder = new TextDecoder();
  let contentBuffer = "", rawLineBuffer = "", firstMeta = null;
  const passthrough = [];
  let sawDone = false;
  const outFrames = [];
  const emitAll = (finalText) => {
    chunkByCodePoint(finalText, 10).forEach((piece, idx) => {
      const frame = { content: piece };
      if (idx === 0 && firstMeta) Object.assign(frame, firstMeta);
      outFrames.push(frame);
    });
    for (const raw of passthrough) outFrames.push(JSON.parse(raw));
    outFrames.push({ __done: true });
  };
  const handleLine = (line) => {
    const t = line.trim();
    if (!t.startsWith("data:")) return;
    const payload = t.slice(5).trim();
    if (payload === "[DONE]") { sawDone = true; return; }
    let obj;
    try { obj = JSON.parse(payload); } catch { passthrough.push(payload); return; }
    // 危机帧只允许走闸外旁路；闸内见到 = 挂载点错误
    if (obj.isCrisis === true) { passthrough.push(payload); return; }
    if (typeof obj.content === "string") {
      if (obj.replaceOutput === true) {
        // 流后审核替换帧（角色 retry/防火墙 BLOCK/verifier 兜底，均带 replaceOutput:true）
        contentBuffer = obj.content;
        const meta = { ...obj }; delete meta.content; firstMeta = meta;
      } else if (obj.isFirewallBlock === true) {
        // 注入/拒绝短路流（有 isFirewallBlock 无 replaceOutput）不应进闸；进了 = 挂载点错误
        passthrough.push(payload);
      } else contentBuffer += obj.content;
    } else passthrough.push(payload);
  };
  // sourceBytes 为 Uint8Array 数组（模拟任意网络切块）
  for (const part of sourceBytes) {
    rawLineBuffer += decoder.decode(part, { stream: true });
    const lines = rawLineBuffer.split("\n");
    rawLineBuffer = lines.pop() ?? "";
    for (const line of lines) handleLine(line);
    if (sawDone) break;
  }
  const tail = rawLineBuffer + decoder.decode();
  if (tail.trim()) for (const line of tail.split("\n")) handleLine(line);
  emitAll(sanitizeNames(contentBuffer));
  return outFrames;
}

// ---------- 被测物 3：小酷前端解析器（改后：stream:true + 行缓冲 + 控制位透传）----------
async function xiaokuClientParse(byteParts) {
  const decoder = new TextDecoder();
  let sseLineBuffer = "", accumulated = "", parseErrors = 0;
  const received = []; // {content, isCrisis, crisisLevel, replaceOutput}
  let isCrisis = undefined, crisisLevel = undefined;
  const handleLine = (line) => {
    if (!line.startsWith("data: ")) return;
    const data = line.slice(6).trim();
    if (data === "[DONE]") return;
    try {
      const parsed = JSON.parse(data);
      if (parsed.content) {
        if (parsed.replaceOutput) accumulated = parsed.content.replace(/^\n+/, "");
        else accumulated += parsed.content;
        if (parsed.isCrisis === true) { isCrisis = true; crisisLevel = parsed.crisisLevel; }
        received.push({ content: parsed.content, replaceOutput: !!parsed.replaceOutput });
      }
    } catch { parseErrors++; }
  };
  for (const part of byteParts) {
    sseLineBuffer += decoder.decode(part, { stream: true });
    const lines = sseLineBuffer.split("\n");
    sseLineBuffer = lines.pop() || "";
    for (const line of lines) handleLine(line);
  }
  const tail = sseLineBuffer + decoder.decode();
  if (tail.trim()) for (const line of tail.split("\n")) handleLine(line);
  return { text: accumulated, parseErrors, isCrisis, crisisLevel, received };
}

// ---------- 工具 ----------
const enc = new TextEncoder();
const frame = (obj) => `data: ${JSON.stringify(obj)}\n\n`;
function sseBytes(frames) { return enc.encode(frames.map(frame).join("") + "data: [DONE]\n\n"); }
/** 字节级随机切块：把一个 Uint8Array 切成 1..maxLen 字节的碎片（含空片可选） */
function splitBytesRandom(bytes, maxLen = 3, includeEmpty = false) {
  const parts = [];
  let i = 0;
  while (i < bytes.length) {
    const n = Math.max(1, Math.min(bytes.length - i, 1 + Math.floor(Math.random() * maxLen)));
    parts.push(bytes.slice(i, i + n));
    i += n;
    if (includeEmpty && Math.random() < 0.15) parts.push(new Uint8Array(0));
  }
  return parts;
}
/** 单字节切块（最严酷） */
function splitBytesOne(bytes) {
  const parts = [];
  for (let i = 0; i < bytes.length; i++) parts.push(bytes.slice(i, i + 1));
  return parts;
}
/** 模拟模型流：把全文按 1-3 字符切成 content 增量帧（LLM chunk 粒度） */
function modelFrames(text) {
  const frames = [];
  let i = 0;
  while (i < text.length) {
    const n = Math.min(text.length - i, 1 + Math.floor(Math.random() * 3));
    frames.push({ content: text.slice(i, i + n) });
    i += n;
  }
  return frames;
}
/** 端到端：模型全文 → 模型增量帧 → 闸 → 字节随机切块 → 小酷客户端 */
async function e2e(finalText, { byteSplit = "rand", gateFramesExtra = [] } = {}) {
  const up = [...modelFrames(finalText), ...gateFramesExtra];
  const gated = runGate(splitBytesRandom(sseBytes(up), 20)); // 上游→闸之间也按字节切块
  // 闸输出重新编码为 SSE 字节，再做网络切块给客户端
  const gatedBytes = enc.encode(gated.filter(f => !f.__done).map(f => `data: ${JSON.stringify(f)}\n\n`).join("") + "data: [DONE]\n\n");
  const parts = byteSplit === "one" ? splitBytesOne(gatedBytes) : splitBytesRandom(gatedBytes, 3, true);
  return xiaokuClientParse(parts);
}

// ---------- 断言框架 ----------
let pass = 0, fail = 0;
const fails = [];
function check(name, cond, detail = "") {
  if (cond) { pass++; console.log(`PASS  ${name}`); }
  else { fail++; fails.push(name); console.log(`FAIL  ${name}${detail ? "  -> " + detail : ""}`); }
}
const REPL = "您提到的那位心理师";
const REPL_PL = "您提到的几位心理师";
const countOf = (s, sub) => s.split(sub).length - 1;
const hasReplacementChar = (s) => s.includes("\uFFFD");
const hasLoneSurrogate = (s) => /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(s);

// ========== A. 切块不变性：随机 1-3 字符切块 vs 全文处理，最终文本完全一致 ==========
const invarianceCorpus = [
  "哇，恭喜你们一起走过12周年纪念日！真的好难得，要好好珍惜彼此呀。",
  "今天跟女朋友去吃饭蛮开心的，这家店的红烧肉特别好吃。",
  "我可以帮您了解QM的服务费用，请问您想了解哪方面呢？",
  "情绪低落的时候试试深呼吸：吸气四秒、屏息四秒、呼气六秒。",
  "你提到的那位老师建议你每天散步半小时，坚持两周看看变化～",
];
for (let k = 0; k < invarianceCorpus.length; k++) {
  const text = invarianceCorpus[k];
  const expect = sanitizeNames(text); // 全文一次处理（基准）
  const r1 = await e2e(text);
  check(`A${k + 1} 切块后客户端文本 == 全文脱敏结果（语料${k + 1}）`, r1.text === expect,
    `got len=${r1.text.length} expect len=${expect.length}`);
  check(`A${k + 1}b 字节切块下 0 解析错误/0 丢字（语料${k + 1}）`, r1.parseErrors === 0 && r1.text.length >= expect.length,
    `parseErrors=${r1.parseErrors}`);
  check(`A${k + 1}c 无 U+FFFD/方框（语料${k + 1}）`, !hasReplacementChar(r1.text));
  check(`A${k + 1}d 无未配对代理项（语料${k + 1}）`, !hasLoneSurrogate(r1.text));
}

// ========== B. 替换短语出现次数：无真名输入 ≤1（自激回归拦截）；有真名输入次数精确 ==========
const dailyChats = [
  "今天跟女朋友去吃饭蛮开心",
  "和女朋友过12周年纪念日",
  "今天天气不错，出门跑了五公里，出一身汗舒服多了",
  "老板今天突然夸我报告写得好，有点受宠若惊",
  "失眠快两周了，躺在床上脑子停不下来，越想睡越清醒",
  "和室友合租三年了，平时分工做家务，相处得挺融洽",
  "孩子今年上小学，做作业拖拉，每天晚上都要斗智斗勇",
  "刚考完试感觉发挥一般，等成绩这几天比考试还紧张",
  "周末陪爸妈去公园划船，我爸笑得像个小孩",
  "跟朋友合伙开了个小店，这两个月刚回本，挺有成就感",
  "最近在学做饭，番茄炒蛋终于不糊锅了，哈哈",
  "地铁上有人晕倒了，大家都过去帮忙，还挺暖的",
  "猫咪今天第一次主动跳到我腿上睡觉，心都化了",
  "工作群里半夜发消息真的很崩溃，周末也不敢静音",
  "坚持写日记一个月了，回头看发现自己情绪规律挺明显",
  "搬家收拾出好多旧东西，每一件都能想起一段日子",
  "今天去理发，托尼老师一剪刀下去我就闭上了眼",
  "楼下新开的咖啡店买一送一，和同事各薅了一杯",
  "爷爷教我下象棋，我输了一晚上但学得特别开心",
  "跟女朋友异地半年了，下个月终于能见面，倒计时开始",
];
for (let k = 0; k < dailyChats.length; k++) {
  const r = await e2e(dailyChats[k]);
  const c1 = countOf(r.text, REPL), c2 = countOf(r.text, REPL_PL);
  check(`B${k + 1} 日常闲聊无自激：替换短语出现 ≤1 次（#${k + 1}：${dailyChats[k].slice(0, 12)}…）`,
    c1 + c2 <= 1, `那位=${c1} 几位=${c2}`);
  check(`B${k + 1}b 长度无膨胀：输出长度 ≤ 原文×1.1（#${k + 1}）`,
    r.text.length <= Math.ceil(dailyChats[k].length * 1.1),
    `out=${r.text.length} in=${dailyChats[k].length}`);
}

// ========== C. 危机路径 5 条：短路流闸外直出，危机标记透传 + 热线数据不丢 ==========
// 注：真实线上话术含心理援助热线号码；此处用等价占位文本（TEST-HOTLINE 标记）模拟，
// 断言"帧数据原样到达、isCrisis 透传、内容不被脱敏/循环"，线上冒烟用真实验证（见第五节）。
const crisisCases = [
  { level: "direct", text: "我真的撑不下去了，想离开这个世界【TEST-CRISIS-HOTLINE-1】请立刻拨打热线" },
  { level: "direct", text: "活着没有意思，已经准备好药了【TEST-CRISIS-HOTLINE-2】24小时热线请马上联系" },
  { level: "indirect", text: "最近总有伤害自己的念头闪过【TEST-CRISIS-HOTLINE-3】可以拨打援助热线聊聊" },
  { level: "indirect", text: "朋友说他不想活了，我该怎么帮他【TEST-CRISIS-HOTLINE-4】热线号码在下方" },
  { level: "direct", text: "我站在楼顶吹了很久的风【TEST-CRISIS-HOTLINE-5】请立即拨打危机热线" },
];
for (let k = 0; k < crisisCases.length; k++) {
  const c = crisisCases[k];
  // 危机短路流：3字/帧、isCrisis:true，闸外直出（不包闸）——直接编码 SSE 给客户端
  const frames = [];
  for (let i = 0; i < c.text.length; i += 3) frames.push({ content: c.text.slice(i, i + 3), isCrisis: true, crisisLevel: c.level });
  const bytes = sseBytes(frames);
  const r = await xiaokuClientParse(splitBytesRandom(bytes, 3, true));
  check(`C${k + 1} 危机流文本完整不丢字（#${k + 1}）`, r.text === c.text,
    `got len=${r.text.length} expect=${c.text.length}`);
  check(`C${k + 1}b isCrisis 标记透传为 true（#${k + 1}）`, r.isCrisis === true, `isCrisis=${r.isCrisis}`);
  check(`C${k + 1}c crisisLevel 透传（#${k + 1}）`, r.crisisLevel === c.level, `level=${r.crisisLevel}`);
  check(`C${k + 1}d 热线数据不丢（#${k + 1}）`, r.text.includes(`【TEST-CRISIS-HOTLINE-${k + 1}】`));
  check(`C${k + 1}e 危机流无替换短语插入（#${k + 1}）`, countOf(r.text, REPL) + countOf(r.text, REPL_PL) === 0);
}

// ========== D. 含真名/代号语料：脱敏仍有效，且切块下不泄漏 ==========
const nameCases = [
  { in: "我上周和丁怡聊过一次，她建议我记录情绪日记", expectSub: REPL, leak: "丁怡" },
  { in: "丁怡和潘新瑞两位老师都给过我建议", expectSub: REPL_PL, leak: "潘新瑞" },
  { in: "我的对接人是孙贝，她帮我预约了咨询", expectSub: "我们工作人员", leak: "孙贝" },
  { in: "陈瑜倩老师让我下周再来复诊", expectSub: "我们工作人员", leak: "陈瑜倩" },
  { in: "我身份证号里有3101151989这段，要不要紧", expectSub: "***", leak: "3101151989" },
  { in: "舒瑱说我的状态比上个月好了很多", expectSub: REPL, leak: "舒瑱" },
  { in: "平时都是Susan在群里发通知", expectSub: "我们工作人员", leak: "Susan" },
];
for (let k = 0; k < nameCases.length; k++) {
  const c = nameCases[k];
  const r = await e2e(c.in);
  check(`D${k + 1} 真名/代号脱敏生效（#${k + 1}）`, r.text.includes(c.expectSub), `缺替换产物：${c.expectSub}`);
  check(`D${k + 1}b 真名不泄漏（#${k + 1}，随机切块）`, !r.text.includes(c.leak), `泄漏：${c.leak}`);
  // 单字节切块再来一遍（最严酷帧边界）
  const r2 = await e2e(c.in, { byteSplit: "one" });
  check(`D${k + 1}c 真名不泄漏（#${k + 1}，单字节切块）`, !r2.text.includes(c.leak) && r2.parseErrors === 0,
    `parseErrors=${r2.parseErrors}`);
}

// ========== E. "孙贝"字样专项 + 幂等 ==========
check("E1 sanitizeNames 幂等：f(f(x))===f(x)（含真名长文）", (() => {
  const t = "丁怡建议我找孙贝预约，陈瑜倩老师也提到过潘新瑞，Susan 发了通知，身份证3101151989。";
  return sanitizeNames(sanitizeNames(t)) === sanitizeNames(t);
})());
check("E2 幂等场景替换短语不翻倍", (() => {
  const t = "丁怡建议我找孙贝预约，陈瑜倩老师也提到过潘新瑞。";
  const once = sanitizeNames(t), twice = sanitizeNames(once);
  return countOf(twice, REPL) === countOf(once, REPL) && countOf(once, REPL) === 2;
})());
check("E3 “孙贝”字样：输出中绝不出现", !(await e2e("孙贝孙贝孙贝，我要找孙贝")).text.includes("孙贝"));
check("E4 “孫貝”繁体同样脱敏", !(await e2e("我的负责人是孫貝")).text.includes("孫貝"));

// ========== F. emoji 混排：代理对不劈、无方框 ==========
const emojiCases = [
  "今天心情不错😊，晚上去吃火锅🍲！",
  "加油💪，你可以的❤️！明天会更好🌈～",
  "👨‍👩‍👧‍👦一家人在一起最重要，🏠在哪都温暖。",
  "丁怡老师说👍，孙贝也说🎉，心情😄",
];
for (let k = 0; k < emojiCases.length; k++) {
  const r = await e2e(emojiCases[k]);
  const emojiCount = (emojiCases[k].match(/\p{Extended_Pictographic}/gu) || []).length;
  const outCount = (r.text.match(/\p{Extended_Pictographic}/gu) || []).length;
  check(`F${k + 1} emoji 无方框/无残代理（#${k + 1}）`, !hasReplacementChar(r.text) && !hasLoneSurrogate(r.text));
  check(`F${k + 1}b emoji 数量不丢失（#${k + 1}）`, outCount >= emojiCount, `in=${emojiCount} out=${outCount}`);
}

// ========== G. 长文本（≥3000 字）：一次性缓冲无异常、无重复 ==========
// 长文本：唯一编号标记间隔 ≤8 字，保证任意 10 字窗口都含唯一标记（使 G3 的"循环片段"断言有效）
const longText = Array.from({ length: 400 }, (_, i) =>
  `〈${String(i + 1).padStart(3, "0")}〉还不错；`).join("")
  + "丁怡给了我很多鼓励，让我坚持记录。"
  + "另外对接人孙贝帮我改过一次预约时间。";
{
  const r = await e2e(longText);
  check("G1 长文本处理完成且无 U+FFFD（≥3000 字）", !hasReplacementChar(r.text) && r.text.length > 3000, `len=${r.text.length}`);
  check("G2 长文本替换短语次数精确（心理师1次）", countOf(r.text, REPL) === 1, `count=${countOf(r.text, REPL)}`);
  check("G2b 长文本工作人员替换精确（孙贝1次）", countOf(r.text, "我们工作人员") >= 1 && !r.text.includes("孙贝"));
  check("G3 长文本任意 10 字片段不重复出现 ≥2 次（循环插入拦截）", (() => {
    const seen = new Set();
    for (let i = 0; i + 10 <= r.text.length; i++) {
      const seg = r.text.slice(i, i + 10);
      if (seen.has(seg)) return false;
      seen.add(seg);
    }
    return true;
  })());
  check("G4 长文本长度无膨胀（≤原文×1.1）", r.text.length <= Math.ceil(longText.length * 1.1));
}

// ========== H. 空 chunk / 单字节 chunk / 帧边界极端 ==========
{
  const bytes = sseBytes(modelFrames("空块测试：hello 世界，abc123。"));
  const withEmpty = splitBytesRandom(bytes, 3, true);
  const r1 = await xiaokuClientParse(withEmpty);
  check("H1 含空 chunk 不影响结果", r1.text.includes("空块测试") && r1.parseErrors === 0, `parseErrors=${r1.parseErrors}`);
  const r2 = await xiaokuClientParse(splitBytesOne(bytes));
  check("H2 单字节切块（最严酷）文本完整、0 解析错误", r2.parseErrors === 0 && r2.text.includes("hello 世界，abc123"),
    `parseErrors=${r2.parseErrors} len=${r2.text.length}`);
  // 半帧：一个 data: 行被劈在两个碎片之间
  const half = enc.encode('data: {"content":"半帧测试ABC"}\n\ndata: [DONE]\n\n');
  const mid = Math.floor(half.length / 2);
  const r3 = await xiaokuClientParse([half.slice(0, mid), half.slice(mid)]);
  check("H3 事件跨网络帧：半帧重组不丢字", r3.text === "半帧测试ABC", `got="${r3.text}"`);
}

// ========== I. 多出口 replaceOutput 收敛 + 控制位透传 + state_update 透传 ==========
{
  // 模型流出"真名版"全文，流后防火墙发 replaceOutput 兜底版；闸只应输出兜底版一版
  const up = [
    ...modelFrames("模型原文里提到丁怡说了一段话。".repeat(3)),
    { content: "\n\n【安全兜底回复】请稍候，为您转接工作人员。", isFirewallBlock: true, firewallReason: "output_scan_block", replaceOutput: true },
    { type: "state_update", state: { phase: "collected" } },
  ];
  const gated = runGate(splitBytesRandom(sseBytes(up), 20));
  const contentFrames = gated.filter(f => typeof f.content === "string");
  const joined = contentFrames.map(f => f.content).join("");
  check("I1 多出口收敛：客户端只收到兜底版一版（无模型原文残留）", joined.includes("安全兜底回复") && !joined.includes("丁怡"),
    `joined len=${joined.length}`);
  check("I2 replaceOutput 控制位随首片透传", contentFrames[0] && contentFrames[0].replaceOutput === true,
    `first frame keys=${contentFrames[0] ? Object.keys(contentFrames[0]).join(",") : "none"}`);
  check("I3 isFirewallBlock/firewallReason 控制位透传", contentFrames[0] && contentFrames[0].isFirewallBlock === true && contentFrames[0].firewallReason === "output_scan_block");
  check("I4 state_update 非内容帧原样透传", gated.some(f => f.type === "state_update" && f.state && f.state.phase === "collected"));
  check("I5 收敛后无重复段（兜底短语仅 1 次）", countOf(joined, "安全兜底回复") === 1);
  // I6：注入/拒绝短路帧（isFirewallBlock 但无 replaceOutput）若误入闸，必须原样透传、不进缓冲
  const up2 = [
    ...modelFrames("模型正在输出内容"),
    { content: "【拒绝】该请求无法处理", isCrisis: false, isFirewallBlock: true, firewallReason: "prompt_injection" },
  ];
  const gated2 = runGate(splitBytesRandom(sseBytes(up2), 20));
  const passthroughFrame = gated2.find(f => f.isFirewallBlock === true && f.firewallReason === "prompt_injection");
  check("I6 拦截短路帧误入闸时原样透传（fail-fast，不被脱敏/缓冲）",
    !!passthroughFrame && passthroughFrame.content === "【拒绝】该请求无法处理"
    && !gated2.some(f => typeof f.content === "string" && f.content.includes("模型正在输出【拒绝】")));
}

// ========== J. 元探针：故障形态（对增长缓冲反复脱敏+全量重发）必须被本套断言抓住 ==========
{
  // 复刻线上故障骨架：对累积缓冲反复跑一个"非幂等"规则（命中"师"→插入替换短语），
  // 全量快照当 delta 重发，客户端逐帧 +=。
  const buggyRule = (t) => t.replace(/师/g, REPL);
  let buf = "", client = "";
  for (const ch of "今天老师表扬了我") {
    buf += ch;
    client += buggyRule(buf); // 每帧把"整文重算结果"当增量
  }
  check("J1 元探针：故障形态下替换短语必然爆炸（≥5 次）", countOf(client, REPL) >= 5,
    `count=${countOf(client, REPL)}`);
  check("J2 元探针：故障形态必然产出 10 字重复片段", (() => {
    const seen = new Set();
    for (let i = 0; i + 10 <= client.length; i++) { const s = client.slice(i, i + 10); if (seen.has(s)) return true; seen.add(s); }
    return false;
  })());
  // 对照：同一语料经正确闸（幂等规则+全文一次）必须干净
  const r = await e2e("今天老师表扬了我");
  check("J3 对照：正确闸下普通词“老师”不触发任何替换短语", countOf(r.text, REPL) + countOf(r.text, REPL_PL) === 0,
    `count=${countOf(r.text, REPL)}`);
}

// ========== 汇总 ==========
console.log("\n========================================================");
console.log(`ASSERTIONS: ${pass + fail} total, ${pass} PASS, ${fail} FAIL`);
if (fail === 0) console.log("ALL OK ✅  (HOTFIX-P0 self-test passed)");
else { console.log(`HAS FAIL ❌  failing: ${fails.join(" | ")}`); process.exit(1); }
