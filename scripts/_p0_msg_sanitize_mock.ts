/**
 * P0 方案 A mock 验证：复刻 @langchain/openai convertContent 的 null.map 崩溃，
 * 证明"清洗前炸、清洗后不炸"两条路径。
 * 断言统计 + 明细序列化（时序 key-value）。
 *
 * 用法：pnpm tsx scripts/_p0_msg_sanitize_mock.ts
 */
/* eslint-disable no-console */

// ---- 1. 复刻 SDK convertContent 中触发 P0 的崩溃路径 ----
// 生产日志：convertContent: Cannot read properties of undefined (reading 'map')
// 当 assistant delta 的 content 为 null 时，SDK 对 null/content 做 .map() 崩溃。
function mockConvertContent(msg: unknown) {
  const m = msg as { role?: string; content?: unknown };
  // 模拟 SDK 对 content 的数组化处理：数组内容走 map，null/undefined 崩溃于 .map
  if (m.content == null) {
    // 正是 P0 报错点：对 null 调用 .map ⇒ "Cannot read properties of null (reading 'map')"
    // 用真实 .map 调用复刻
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error intentionally crash
    const arr = m.content.map(() => "");
    return { role: m.role, content: arr };
  }
  if (typeof m.content === "string") return { role: m.role, content: m.content };
  // 数组内容：SDK 正常 map
  const arr = (m.content as string[]).map((c) => c);
  return { role: m.role, content: arr };
}

function runThroughSdk(messages: unknown[]) {
  // SDK convertContent 逐条转换
  return messages.map((m) => mockConvertContent(m));
}

// ---- 2. 构造"清洗前的专业模式消息形状"（含脏数据：assistant content=null）----
// 生产 pro 多轮：assistant 历史里出现 content=null 的一条，触发 null.map
const dirtyMessages: unknown[] = [
  { role: "system", content: "你是 QM 专业心理支持，10 卷学术卷宗。" },
  { role: "user", content: "我在用 ITQ 量表评估创伤，想了解区分标准。" },
  // ← P0 根因：assistant 某条 delta content=null
  { role: "assistant", content: null },
  { role: "user", content: "成人 ITQ 与 ITQ-CA 能混用吗？" },
];

// ---- 3. 断言 ----
let pass = 0;
let fail = 0;
function check(name: string, fn: () => boolean, detail = "") {
  let ok = false;
  try {
    ok = fn();
  } catch {
    ok = false;
  }
  if (ok) {
    pass++;
    console.log(`PASS ${name}${detail ? " :: " + detail : ""}`);
  } else {
    fail++;
    console.log(`FAIL ${name}${detail ? " :: " + detail : ""}`);
  }
  return ok;
}

// 3a. 清洗前：喂 dirty → convertContent 炸（预期 throw，证明复现 P0）
let crashed = false;
try {
  runThroughSdk(dirtyMessages);
} catch {
  crashed = true;
}
check("清洗前-SDK-cr空convertContent null.map崩溃复现(P0根因)", () => crashed, "null content ⇒ SDK null.map 抛错");

// 3b. 应用 sanitizeMessagesForSdk（与 route.ts 同款逻辑）
function sanitizeMessagesForSdk(messages: unknown[]): unknown[] {
  return messages
    .filter(
      (m: any) =>
        m && (m.role === "user" || m.role === "assistant" || m.role === "system"),
    )
    .map((m: any) => {
      const raw = m.content;
      const content = raw == null ? "" : typeof raw === "string" ? raw : String(raw);
      return { role: m.role, content };
    });
}

const cleanMessages = sanitizeMessagesForSdk(dirtyMessages);

// 清洗后：content 全部字符串（null → ""）
const hasNullAfterClean = cleanMessages.some(
  (m: any) => m.content == null || typeof m.content !== "string",
);
check(
  "清洗后-所有content均为字符串(null→空串)",
  () => cleanMessages.length === 4 && !hasNullAfterClean,
  JSON.stringify(cleanMessages.map((m: any) => ({ role: m.role, content: m.content }))),
);

// 清洗后：喂 SDK 不炸（转换成功）
let cleanOk = true;
try {
  const out = runThroughSdk(cleanMessages);
  cleanOk = out.length === 4;
} catch {
  cleanOk = false;
}
check("清洗后-SDK-convertContent不炸(正常转换)", () => cleanOk, "null 已转空串 不再触发 map 崩溃");

// 3c. 更复杂脏数据：content=数组、content=undefined、带 tool_calls/annotations 字段
const nasty = [
  { role: "user", content: undefined },
  { role: "assistant", content: null, tool_calls: [{ id: "t1" }], annotations: ["a"] },
  { role: "system", content: 12345 },
  { role: "assistant", content: ["part1", null, "part2"], name: "guider" },
];
const cleanNasty = sanitizeMessagesForSdk(nasty);
const nastyAllString = cleanNasty.every(
  (m: any) => typeof m.content === "string" && !("tool_calls" in m) && !("annotations" in m) && !("name" in m),
);
let nastyOk = true;
try {
  runThroughSdk(cleanNasty);
} catch {
  nastyOk = false;
}
check(
  "清洗后-复杂脏数据(undefined/数组/tool_calls/annotations/name)全兜底且剔除多余字段",
  () => nastyAllString && nastyOk && cleanNasty.length === 4,
  JSON.stringify(cleanNasty),
);

// 3d. 缺失 role / 空消息丢弃
const roleDirty = [{ content: "no role" }, null, undefined, { role: "user", content: "ok" }];
const cleanRole = sanitizeMessagesForSdk(roleDirty);
check("清洗后-无role/空消息被过滤仅保留合法role", () => cleanRole.length === 1 && (cleanRole as any[])[0].content === "ok", JSON.stringify(cleanRole));

console.log(`\n===== P0 方案A mock 断言结果: ${pass} 通过 / ${fail} 失败 =====`);
process.exit(fail > 0 ? 1 : 0);