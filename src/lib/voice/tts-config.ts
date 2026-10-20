/**
 * VOICE-P3 配置：只把已经生成并审核完成的最终文字交给 TTS。
 * VOICE-ARCH-001：语音层不得修改认知层。
 */
export const VOICE_P3_ENABLED = process.env.NEXT_PUBLIC_QM_VOICE_P3_ENABLED !== "false";
export const VOICE_SPEECH_ENDPOINT = "/api/voice/speech";
export const VOICE_TTS_MODEL = "seed-tts-2.0";

export const XIAOKU_VOICE_ID = "7568423452617670710"; // 知性灿灿
export const XIAOXUE_VOICE_ID = "7620288417930297386"; // 邻家女孩

export type VoiceRole = "xiaoku" | "xiaoxue";

export function getVoiceId(role: VoiceRole): string {
  return role === "xiaoku" ? XIAOKU_VOICE_ID : XIAOXUE_VOICE_ID;
}
