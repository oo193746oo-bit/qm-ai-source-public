type StopPlayback = () => void;
let activeStop: StopPlayback | null = null;

export function claimVoicePlayback(stop: StopPlayback): () => void {
  if (activeStop && activeStop !== stop) {
    try { activeStop(); } catch {}
  }
  activeStop = stop;
  return () => { if (activeStop === stop) activeStop = null; };
}

export function stopActiveVoicePlayback(): void {
  const stop = activeStop;
  activeStop = null;
  if (stop) { try { stop(); } catch {} }
}
