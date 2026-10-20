/**
 * VOICE-P1 配置：仅负责语音录音与 ASR 转写，不接入小酷/小雪认知链路。
 * VOICE-ARCH-001：语音层不得修改认知层。
 */
export const VOICE_P1_ENABLED = process.env.NEXT_PUBLIC_QM_VOICE_P1_ENABLED !== "false";
export const VOICE_MAX_DURATION_SECONDS = 60;
export const VOICE_MAX_FILE_BYTES = 10 * 1024 * 1024;
export const VOICE_TRANSCRIBE_ENDPOINT = "/api/voice/transcribe";

export const VOICE_ALLOWED_MIME_TYPES = [
  "audio/ogg",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  "audio/x-m4a",
  "audio/aac",
  "audio/amr",
] as const;

export function normalizeMimeType(mimeType: string): string {
  return (mimeType || "").split(";", 1)[0].trim().toLowerCase();
}

export function isAllowedVoiceMimeType(mimeType: string): boolean {
  const normalized = normalizeMimeType(mimeType);
  return (VOICE_ALLOWED_MIME_TYPES as readonly string[]).includes(normalized);
}
