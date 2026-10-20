export type VoiceRecorderState =
  | "idle"
  | "requesting_permission"
  | "recording"
  | "transcribing"
  | "preview"
  | "ready"
  | "error";

export type VoiceErrorCode =
  | "VOICE-ASR-001"
  | "VOICE-ASR-002"
  | "VOICE-ASR-003"
  | "VOICE-ASR-004"
  | "VOICE-ASR-005"
  | "VOICE-ASR-006"
  | "VOICE-ASR-007"
  | "VOICE-ASR-008"
  | "VOICE-ASR-009"
  | "VOICE-ASR-010"
  | "VOICE-ASR-011"
  | "VOICE-ASR-012";

export interface VoiceTranscriptionResponse {
  ok: boolean;
  text?: string;
  error?: string;
  code?: VoiceErrorCode;
  traceId?: string;
  logid?: string;
}

/** 语音元数据，附加在 ChatMessage 上（音频 Blob 本身存 IndexedDB） */
export interface VoiceMeta {
  hasAudio: boolean;
  /** 录音时长（秒） */
  duration: number;
  /** 原始录音 mimeType（如 audio/webm;codecs=opus） */
  mimeType: string;
  /** 转录状态 */
  transcriptStatus?: "pending" | "ready" | "error";
  /** 转录错误信息 */
  transcriptError?: string;
}
