export type VoicePlaybackRate = 1 | 1.5;
const STORAGE_KEY = "qm_voice_playback_rate_v1";
export const AI_BASE_PLAYBACK_RATE = 1.2;
export function getVoicePlaybackRate(): VoicePlaybackRate {
  if (typeof window === "undefined") return 1;
  try { return localStorage.getItem(STORAGE_KEY) === "1.5" ? 1.5 : 1; } catch { return 1; }
}
export function setVoicePlaybackRate(rate: VoicePlaybackRate): void {
  try { localStorage.setItem(STORAGE_KEY, String(rate)); window.dispatchEvent(new CustomEvent("qm-voice-rate-change", { detail: rate })); } catch {}
}
export function toggleVoicePlaybackRate(current: VoicePlaybackRate): VoicePlaybackRate {
  const next: VoicePlaybackRate = current === 1 ? 1.5 : 1; setVoicePlaybackRate(next); return next;
}
