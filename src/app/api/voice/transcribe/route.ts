import { NextRequest } from "next/server";
import {
  VOICE_MAX_FILE_BYTES,
  isAllowedVoiceMimeType,
  normalizeMimeType,
} from "@/lib/voice/config";
import type { VoiceErrorCode, VoiceTranscriptionResponse } from "@/lib/voice/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COZE_ASR_URL = "https://api.coze.cn/v1/audio/transcriptions";
const ASR_TIMEOUT_MS = 20_000;

function jsonResponse(
  body: VoiceTranscriptionResponse,
  status = 200,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-QM-Voice-Stage": "P1-ASR",
    },
  });
}

function fail(code: VoiceErrorCode, error: string, traceId: string, status: number): Response {
  return jsonResponse({ ok: false, code, error, traceId }, status);
}

function extensionForMime(mimeType: string): string {
  switch (normalizeMimeType(mimeType)) {
    case "audio/ogg": return "ogg";
    case "audio/mp4": return "m4a";
    case "audio/mpeg": return "mp3";
    case "audio/wav":
    case "audio/x-wav": return "wav";
    case "audio/aac": return "aac";
    case "audio/amr": return "amr";
    case "audio/x-m4a": return "m4a";
    case "audio/webm":
    default: return "webm";
  }
}

export async function POST(request: NextRequest) {
  const traceId = `voice_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    const form = await request.formData();
    const entry = form.get("file");

    if (!entry || typeof entry === "string" || typeof entry.arrayBuffer !== "function") {
      return fail("VOICE-ASR-003", "没有收到有效录音文件", traceId, 400);
    }

    const file = entry as File;
    const mimeType = normalizeMimeType(file.type);

    if (file.size <= 0) {
      return fail("VOICE-ASR-003", "录音内容为空", traceId, 400);
    }
    if (file.size > VOICE_MAX_FILE_BYTES) {
      return fail("VOICE-ASR-004", "录音文件过大，请缩短后重试", traceId, 413);
    }
    if (!isAllowedVoiceMimeType(mimeType)) {
      return fail("VOICE-ASR-005", `暂不支持此录音格式：${mimeType || "unknown"}`, traceId, 415);
    }

    // 仅服务端读取访问令牌，严禁下发到浏览器。
    const token = process.env.QM_VOICE_ASR_TOKEN;
    if (!token) {
      console.error("[QM:VOICE:P1] missing QM_VOICE_ASR_TOKEN", { traceId });
      return fail("VOICE-ASR-012", "语音服务尚未完成配置", traceId, 503);
    }

    const upstreamForm = new FormData();
    const bytes = await file.arrayBuffer();
    const forwarded = new Blob([bytes], { type: mimeType || file.type || "audio/webm" });
    upstreamForm.append(
      "file",
      forwarded, `voice-${traceId}.${extensionForMime(mimeType)}`,
    );

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ASR_TIMEOUT_MS);

    let upstream: Response;
    try {
      upstream = await fetch(COZE_ASR_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: upstreamForm,
        signal: controller.signal,
        cache: "no-store",
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.error("[QM:VOICE:P1] ASR timeout", { traceId, size: file.size, mimeType });
        return fail("VOICE-ASR-010", "语音识别超时，请重试", traceId, 504);
      }
      console.error("[QM:VOICE:P1] ASR network error", {
        traceId,
        size: file.size,
        mimeType,
        error: error instanceof Error ? error.message : String(error),
      });
      return fail("VOICE-ASR-007", "语音识别服务连接失败", traceId, 502);
    } finally {
      clearTimeout(timer);
    }

    let payload: any = null;
    try {
      payload = await upstream.json();
    } catch {
      console.error("[QM:VOICE:P1] invalid ASR response", { traceId, status: upstream.status });
      return fail("VOICE-ASR-007", "语音识别服务返回异常", traceId, 502);
    }

    const logid = payload?.detail?.logid ? String(payload.detail.logid) : undefined;

    if (!upstream.ok) {
      console.error("[QM:VOICE:P1] ASR HTTP error", {
        traceId,
        status: upstream.status,
        code: payload?.code,
        logid,
      });
      return jsonResponse(
        { ok: false, code: "VOICE-ASR-007", error: "语音识别服务暂时不可用", traceId, logid },
        502,
      );
    }

    if (payload?.code !== 0) {
      console.error("[QM:VOICE:P1] ASR API error", {
        traceId,
        code: payload?.code,
        logid,
      });
      return jsonResponse(
        { ok: false, code: "VOICE-ASR-008", error: "这段语音暂时没有识别成功", traceId, logid },
        422,
      );
    }

    const text = typeof payload?.data?.text === "string" ? payload.data.text.trim() : "";
    if (!text) {
      return jsonResponse(
        { ok: false, code: "VOICE-ASR-009", error: "没有识别到清楚的语音，可以重新录一次", traceId, logid },
        422,
      );
    }

    console.info("[QM:VOICE:P1] ASR success", {
      traceId,
      logid,
      size: file.size,
      mimeType,
      transcriptLength: text.length,
    });

    // 不记录、不返回原始音频；P1 仅返回转写文字。
    return jsonResponse({ ok: true, text, traceId, logid });
  } catch (error) {
    console.error("[QM:VOICE:P1] unexpected error", {
      traceId,
      error: error instanceof Error ? error.message : String(error),
    });
    return fail("VOICE-ASR-006", "语音上传处理失败，请重试", traceId, 500);
  }
}
