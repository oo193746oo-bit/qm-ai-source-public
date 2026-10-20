import { NextRequest } from "next/server";
import { detectCrisis } from "@/lib/crisis-detection";
import { sanitizeR45Reply } from "@/lib/r45-outbound-safety";
import { R45_BOT_ID, getR45SatToken } from "@/lib/r45-config";

// R45 意定监护专线对话转发（2026-09-12，P0）
// 站点 `/api/r45/chat`：服务端转发 POST https://api.coze.cn/v3/chat（Bearer SAT），SSE 流式透传。
// 与主站 `/api/chat` 同标准：危机本地拦截链 + 出站硬过滤（stripInternalTraces）+ 降级不白屏。

const COZE_CHAT_URL = "https://api.coze.cn/v3/chat";
const UPSTREAM_TIMEOUT_MS = 60_000;

// 高危本地拦截处置话术（RC1-R1 已含 12355，136 保留）
const R45_CRISIS_DIRECT =
  "听到你说这些，我非常担心你的安全。\n\n请你现在立刻拨打心理援助热线：\n📞 12356（全国心理援助热线，7×24 小时）\n📞 15001930070（QM 24 小时危机热线）\n📞 12355（未成年人心理服务热线）\n如当下有立即危险，请同时拨打 110/120。\n\n你愿意告诉我，你现在在哪里、身边有人吗？";

// RC1-R2 修点1：会话级危机状态窗口。
// userId → { highAt: lastHighTs, turnsSinceHigh: 0.. }。窗口规则：标记后 30 分钟内或 5 轮内（先到为准）。
// 窗口内出站响应升级检查：不含任何批准热线号码 → 替换标准高危卡；禁止回落纯业务。
const CRISIS_WINDOW_MS = 30 * 60 * 1000;
const CRISIS_WINDOW_TURNS = 5;
const crisisWindow = new Map<string, { highAt: number; turnsSinceHigh: number }>();

const R45_CRISIS_INDIRECT =
  "你说的这些听起来让人心疼。你最近是不是感觉特别沉重、特别累？\n\n如果你觉得自己撑不住了，请一定记得：\n📞 12356（全国心理援助热线，7×24 小时）\n📞 15001930070（QM 24 小时危机热线）\n📞 12355（未成年人心理服务热线）\n紧急危险请拨 110/120。\n\n你愿意的话，可以多和我说说最近发生了什么，我不会打断你。";

// RC1-R2 出站确定性（修点1/2/3 + 号码白名单）已内聚至 src/lib/r45-outbound-safety.ts，route 侧仅调用。

function buildSseHeaders(): Headers {
  const h = new Headers();
  h.set("Content-Type", "text/event-stream; charset=utf-8");
  h.set("Cache-Control", "no-cache, no-transform");
  h.set("Connection", "keep-alive");
  h.set("X-QM-Agent", "r45");
  h.set("X-Accel-Buffering", "no");
  return h;
}

function encoder() {
  return new TextEncoder();
}

// 直发危机响应（本地拦截，不调上游，0.2s 级）
function streamCrisisResponse(level: "direct" | "indirect"): ReadableStream<Uint8Array> {
  const text = level === "direct" ? R45_CRISIS_DIRECT : R45_CRISIS_INDIRECT;
  const enc = encoder();
  return new ReadableStream({
    start(controller) {
      controller.enqueue(
        enc.encode(
          `data: ${JSON.stringify({ content: text, isCrisis: true, crisisLevel: level })}\n\n`,
        ),
      );
      controller.enqueue(enc.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });
}

// 整理 coze /v3/chat 的 SSE 增量：事件 dquote `data: {json}`，增量 text 在 message.delta / delta.content
function extractDelta(payload: unknown): string {
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    // 顶层 message.delta → content
    if (obj.event === "message.delta" || obj.event === "conversation.message.delta") {
      const d = obj.data as Record<string, unknown> | undefined;
      if (d && typeof d.content === "string") return d.content;
      if (typeof obj.data === "string") {
        try {
          const parsed = JSON.parse(obj.data) as Record<string, unknown>;
          if (typeof parsed.content === "string") return parsed.content;
        } catch {
          return obj.data as string;
        }
      }
    }
    // 直接 ios `{delta:{content}}`
    const delta = obj.delta as Record<string, unknown> | undefined;
    if (delta && typeof delta.content === "string") return delta.content;
    // `data` 为字符串增量
    if (typeof obj.data === "string") return obj.data;
  }
  return "";
}

export async function POST(req: NextRequest) {
  // ---- 坏 JSON → 400 ----
  let body: { message?: string; userId?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "请求格式错误" }), {
      status: 400,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }

  const message = (body.message || "").trim();
  if (!message) {
    return new Response(JSON.stringify({ error: "消息不能为空" }), {
      status: 400,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }

  const sat = getR45SatToken();
  const userId = (body.userId || "anon").toString();

  // ---- 危机本地拦截链（关机时同样生效）----
  const crisis = detectCrisis(message);
  if (crisis.isCrisis && crisis.level !== "none") {
    // 修点1：判 high → 记录会话级危机窗口
    const now = Date.now();
    const prev = crisisWindow.get(userId);
    crisisWindow.set(userId, {
      highAt: prev && now - prev.highAt < CRISIS_WINDOW_MS ? prev.highAt : now,
      turnsSinceHigh: 0,
    });
    return new Response(streamCrisisResponse(
        crisis.level === "gentle" ? "indirect" : crisis.level
      ), { headers: buildSseHeaders() });
  }

  // 修点1：未判 high → 若该会话在窗口内，累计轮数
  const prev = crisisWindow.get(userId);
  if (prev) {
    const now = Date.now();
    if (now - prev.highAt < CRISIS_WINDOW_MS) {
      prev.turnsSinceHigh += 1;
    }
    // 窗口（30 分钟）自然过期后移除
    if (now - prev.highAt >= CRISIS_WINDOW_MS || prev.turnsSinceHigh > CRISIS_WINDOW_TURNS) {
      crisisWindow.delete(userId);
    }
  }

  if (!sat) {
    // 无 SAT → 降级（不白屏）：返回 QMS 热线 + 提示稍后再试，不含跳转
    const enc = encoder();
    const fallback = new ReadableStream({
      start(controller) {
        controller.enqueue(
          enc.encode(
            `data: ${JSON.stringify({ content: "意定监护服务暂时不可用，请稍后再试。\n\n如你正感到危机，请立即拨打：\n📞 12356（全国心理援助热线，7×24 小时）\n📞 15001930070（QM 24 小时危机热线）\n紧急危险请拨 110/120。" })}\n\n`,
          ),
        );
        controller.enqueue(enc.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });
    return new Response(fallback, { headers: buildSseHeaders() });
  }

  // ---- 转发上游 coze v3/chat（Bearer SAT，SSE 流式）----
  const upstream = await fetch(COZE_CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${sat}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      bot_id: R45_BOT_ID,
      user_id: body.userId || "qm-r45-anon",
      stream: true,
      auto_save_history: true,
      additional_messages: [
        { role: "user", content: message, content_type: "text" },
      ],
    }),
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });

  if (!upstream.ok || !upstream.body) {
    const enc = encoder();
    const degraded = new ReadableStream({
      start(controller) {
        controller.enqueue(
          enc.encode(
            `data: ${JSON.stringify({ content: "意定监护服务暂时不可用，请稍后再试。\n\n如你正感到危机，请立即拨打：\n📞 12356（全国心理援助热线，7×24 小时）\n📞 15001930070（QM 24 小时危机热线）\n紧急危险请拨 110/120。" })}\n\n`,
          ),
        );
        controller.enqueue(enc.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });
    return new Response(degraded, { headers: buildSseHeaders() });
  }

  // 逐块流式转发；识别上游 JSON 业务错误码（如 token 失效 code!=0 返回 HTTP 200）与零输出，
  // 全程无增量时降级为 QMS 热线提示，绝不白屏/静默空。
  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  const enc = encoder();

  function emitDegraded(controller: ReadableStreamDefaultController<Uint8Array>) {
    controller.enqueue(
      enc.encode(
        `data: ${JSON.stringify({ content: "意定监护服务暂时不可用，请稍后再试。\n\n如你正感到危机，请立即拨打：\n📞 12356（全国心理援助热线，7×24 小时）\n📞 15001930070（QM 24 小时危机热线）\n紧急危险请拨 110/120。" })}\n\n`,
      ),
    );
    controller.enqueue(enc.encode("data: [DONE]\n\n"));
    controller.close();
  }

  const transform = new ReadableStream<Uint8Array>({
    async pull(controller) {
      let buffer = "";
      let fullOutput = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            // 全程无增量（空 SSE / token 失效等）→ 降级，避免前端空白
            if (!fullOutput) {
              emitDegraded(controller);
              return;
            }
            // 出站硬过滤：内部痕迹剥离 + 号码白名单收紧（P0）+ 会话窗口提级/业务混合/低危号码统一（RC1-R2），清洗后终态替换
            const win = crisisWindow.get(userId);
            const inWindow =
              !!win && Date.now() - win.highAt < CRISIS_WINDOW_MS && win.turnsSinceHigh <= CRISIS_WINDOW_TURNS;
            const { cleaned, changed } = sanitizeR45Reply(fullOutput, { inWindow });
            if (changed) {
              controller.enqueue(
                enc.encode(
                  `data: ${JSON.stringify({ content: cleaned, isFirewallBlock: true, firewallReason: "r45_outbound", replaceOutput: true })}\n\n`,
                ),
              );
            }
            controller.enqueue(enc.encode("data: [DONE]\n\n"));
            controller.close();
            return;
          }
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() || "";
          for (const part of parts) {
            const line = part.trim();
            if (!line.startsWith("data:")) continue;
            const data = line.slice(5).trim();
            if (data === "[DONE]") continue;
            let parsed: unknown = data;
            try {
              parsed = JSON.parse(data);
            } catch {
              parsed = data;
            }
            // 识别上游 JSON 业务错误（token/限流等，HTTP 层为 200）→ 无 delta，fullOutput 必空 → 自动走降级
            const delta = extractDelta(parsed);
            if (!delta) continue;
            fullOutput += delta;
            controller.enqueue(
              enc.encode(
                `data: ${JSON.stringify({ content: delta })}\n\n`,
              ),
            );
          }
        }
      } catch (err) {
        // 上游中断/超时 → 降级而非中断空白
        try {
          emitDegraded(controller);
        } catch {
          controller.error(err);
        }
      }
    },
  });

  return new Response(transform, { headers: buildSseHeaders() });
}