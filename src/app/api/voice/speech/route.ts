import { NextRequest, NextResponse } from "next/server";
import { getVoiceId, VOICE_TTS_MODEL, type VoiceRole } from "@/lib/voice/tts-config";

export const runtime = "nodejs";

const COZE_SPEECH_URL = "https://api.coze.cn/v1/audio/speech";
const MAX_TTS_CHARS = 900;

function jsonError(code: string, message: string, status: number, detail?: string) {
  return NextResponse.json(
    { ok: false, code, message, ...(detail ? { detail } : {}) },
    { status },
  );
}

export async function POST(request: NextRequest) {
  const t0 = Date.now();
  const token = process.env.QM_VOICE_ASR_TOKEN;
  if (!token) return jsonError("VOICE-TTS-001", "语音服务暂不可用", 503);

  let body: { text?: unknown; role?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonError("VOICE-TTS-004", "没有可朗读的文字", 400);
  }

  const text = typeof body.text === "string" ? body.text : "";
  const role: VoiceRole = body.role === "xiaoxue" ? "xiaoxue" : "xiaoku";
  if (!text.trim()) return jsonError("VOICE-TTS-004", "没有可朗读的文字", 400);
  if (text.length > MAX_TTS_CHARS) {
    return jsonError("VOICE-TTS-005", "语音文本分段异常", 413);
  }

  let response: Response;
  let t1 = 0;
  try {
    response = await fetch(COZE_SPEECH_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: text,
        voice_id: getVoiceId(role),
        model: VOICE_TTS_MODEL,
        response_format: "mp3",
      }),
      signal: AbortSignal.timeout(30000),
    });
    t1 = Date.now();
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === "TimeoutError";
    return jsonError(
      isTimeout ? "VOICE-TTS-010" : "VOICE-TTS-006",
      "语音生成失败，文字回复不受影响",
      502,
    );
  }

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    const code =
      response.status === 401 || response.status === 403
        ? "VOICE-TTS-002"
        : response.status === 400
          ? "VOICE-TTS-003"
          : "VOICE-TTS-006";
    return jsonError(code, "语音生成失败，文字回复不受影响", 502, detail);
  }

  const contentType = response.headers.get("content-type") || "audio/mpeg";
  if (!contentType.toLowerCase().includes("audio")) {
    return jsonError("VOICE-TTS-007", "语音服务返回异常", 502);
  }
  if (!response.body) {
    return jsonError("VOICE-TTS-008", "没有生成有效语音", 502);
  }

  const t2 = Date.now();
  console.info("[VOICE-P3][TTS_TIMING]", {
    role,
    textChars: text.length,
    requestToHeadersMs: t1 - t0,
    proxySetupMs: t2 - t1,
    totalBeforeStreamMs: t2 - t0,
  });

  // 直接透传 Coze TTS response.body，不再在服务端 await arrayBuffer() 完整缓冲。
  return new NextResponse(response.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "no-store",
      "X-QM-Voice-Role": role,
      "X-QM-TTS-Upstream-Headers-Ms": String(t1 - t0),
      "Server-Timing": `coze_headers;dur=${t1 - t0}, proxy;dur=${t2 - t1}`,
    },
  });
}
