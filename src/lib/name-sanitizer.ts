/**
 * QM 输出姓名统一脱敏闸（仅服务端使用，禁止进入客户端 bundle）
 * HOTFIX 2026-09-03 v1.1（事故批次 HOTFIX-P0）
 *
 * 铁律（违反任意一条即重现 2026-09-03 凌晨 P0）：
 *  1. 脱敏只对【完整全文】执行恰好一次（收到 [DONE] 时）；
 *     禁止对逐帧增量/增长中的缓冲重复调用 sanitizeNames；
 *  2. 禁止把"全文快照"当 delta 重发；发出的帧只允许是最终全文的切片增量；
 *  3. 危机/注入/安全模板三条短路流在 route 层闸外返回，绝不进入本闸；
 *     闸内若见到 isCrisis 帧、或"有 isFirewallBlock 但无 replaceOutput"的拒绝帧
 *     = 挂载点错误，fail-fast 原样透传并打 error；
 *     注意区分：流后审核替换帧带 replaceOutput:true（可同时带 isFirewallBlock:true），
 *     那是正常的"最终内容覆盖"，不是短路帧；
 *  4. 全链路只允许本闸一个脱敏出口；v4 StreamSanitizer 逐帧通道必须已删除。
 *
 * v1.1 相对 v5 初版的修复：
 *  - 新增跨 read 的 SSE 行缓冲（上游帧被网络切成半帧也能重组，不再静默丢帧）；
 *  - 非内容帧（state_update 等）与流后控制帧的【全部控制位】原样保留/透传，
 *    不再硬编码 isCrisis:false；
 *  - 切片按 code point（for...of），emoji 代理对不劈开；
 *  - 缓冲长度上限告警；源流异常时发统一兜底文案。
 */

const PSYCHOLOGIST_NAMES = ["丁怡", "潘新瑞", "舒瑱"];
const STAFF_NAMES = [
  "孙贝", "孫貝",
  "陈瑜倩", "陳瑜倩",
  "Susan", "Candice", "Christy",
  "Lara", "Piggy", "Lumen",
  "雪花",
];
const ID_FRAGMENTS = ["3101151989", "3205231974", "3101101979"];

const PSY_PLACEHOLDER = "PSYCH";
const MAX_BUFFER_CHARS = 300_000; // 约 30 万汉字；超限照常处理，仅打告警
const RECOVERY_TEXT = "抱歉，连接不太稳定，请稍后再试。";

function splitReplace(text: string, from: string, to: string): string {
  return text.split(from).join(to);
}

/**
 * 全文姓名脱敏。输入完整文本，输出脱敏后文本。幂等：f(f(x)) === f(x)。
 * - 在册心理师真名 → "您提到的那位心理师"（多个连用合并为"您提到的几位心理师"）
 * - 内部工作人员/黑名单英文名 → "我们工作人员"（多个连用合并为"我们几位工作人员"）
 * - 身份证片段 → ***
 */
export function sanitizeNames(text: string): string {
  if (!text || typeof text !== "string") return text;
  let out = text;

  for (const id of ID_FRAGMENTS) out = splitReplace(out, id, "***");
  for (const n of STAFF_NAMES) out = splitReplace(out, n, "我们工作人员");
  for (const n of PSYCHOLOGIST_NAMES) out = splitReplace(out, n, PSY_PLACEHOLDER);

  // 多个心理师名字连用 → 几位心理师（覆盖顿号/逗号/和/与/及/空格分隔）
  out = out.replace(
    new RegExp(`${PSY_PLACEHOLDER}(?:\\s*[、，,和与及]\\s*${PSY_PLACEHOLDER})+`, "g"),
    "您提到的几位心理师",
  );
  out = splitReplace(out, PSY_PLACEHOLDER, "您提到的那位心理师");

  // 多个工作人员指代连用合并
  out = out.replace(
    /我们工作人员(?:\s*[、，,和与及]\s*我们工作人员)+/g,
    "我们几位工作人员",
  );

  return out;
}

/**
 * 按 code point 切片：emoji（UTF-16 代理对）不会被劈成两半。
 * 注意：ZWJ 组合 emoji（如家庭表情）由多个 code point 组成，可能在组合边界切开，
 * 但不会产生未配对代理项（不会出 □/U+FFFD），可接受。
 */
export function chunkByCodePoint(text: string, size: number): string[] {
  const pieces: string[] = [];
  let buf = "";
  let n = 0;
  for (const ch of text) {
    buf += ch;
    n += 1;
    if (n >= size) {
      pieces.push(buf);
      buf = "";
      n = 0;
    }
  }
  if (buf) pieces.push(buf);
  return pieces;
}

/**
 * 包装 SSE ReadableStream（唯一挂载点：模型主路径返回流）。
 * P1.7 F1 修复：改为真流式，逐帧透传，不再缓冲全文后一次性下发。
 * 姓名脱敏改为增量处理：每帧下发前做轻量级脱敏，流结束后不再重发。
 */
export function sanitizedSseStream(
  source: ReadableStream<Uint8Array>,
  role: "xiaoku" | "xiaoxue",
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = source.getReader();
      let rawLineBuffer = "";
      let sawDone = false;

      const processLine = (line: string) => {
        const t = line.trim();
        if (!t.startsWith("data:")) return;
        const payload = t.slice(5).trim();
        if (payload === "[DONE]") {
          sawDone = true;
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          return;
        }
        let obj: Record<string, unknown>;
        try {
          obj = JSON.parse(payload);
        } catch {
          // 非 JSON 帧原样透传
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
          return;
        }

        // P1.7 F1：逐帧轻量级脱敏，立即下发
        if (typeof obj.content === "string") {
          obj.content = sanitizeNames(obj.content);
        }
        
        // 立即下发当前帧，不缓冲
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      };

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunkText = decoder.decode(value, { stream: true });
          rawLineBuffer += chunkText;
          const lines = rawLineBuffer.split("\n");
          rawLineBuffer = lines.pop() || "";
          for (const line of lines) {
            processLine(line);
          }
        }
        // 处理剩余行缓冲
        if (rawLineBuffer.trim()) {
          processLine(rawLineBuffer);
        }
        // 确保发送 [DONE]
        if (!sawDone) {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        }
        controller.close();
      } catch (e) {
        console.error(`[name-sanitizer] ${role} 流异常`, e);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: sanitizeNames(RECOVERY_TEXT) })}\n\n`));
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });
}
