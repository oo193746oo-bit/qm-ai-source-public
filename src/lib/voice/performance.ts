type VoicePerfState = { recordStopAt?:number; asrStartAt?:number; asrEndAt?:number; llmRequestAt?:number; llmFirstTokenAt?:number; ttsRequestAt?:number; ttsFirstChunkAt?:number; audioPlayAt?:number; };
declare global { interface Window { __QM_VOICE_PERF?: VoicePerfState; } }
function s():VoicePerfState { if(typeof window==="undefined") return {}; window.__QM_VOICE_PERF ||= {}; return window.__QM_VOICE_PERF; }
export function markVoicePerf(key:keyof VoicePerfState):void { if(typeof performance!=="undefined") s()[key]=performance.now(); }
export function markVoicePerfOnce(key:keyof VoicePerfState):void { if(typeof performance==="undefined") return; const x=s(); if(typeof x[key]!=="number") x[key]=performance.now(); }
export function resetVoicePerf():void { if(typeof window!=="undefined") window.__QM_VOICE_PERF={}; }
export function reportVoicePerf(role?:string):void { const x=s(); const d=(a?:number,b?:number)=>typeof a==="number"&&typeof b==="number"?Math.round(b-a):undefined; console.info("[VOICE-E2E][STOP_TO_FIRST_AUDIO]",{role,asrMs:d(x.asrStartAt,x.asrEndAt),llmFirstTokenMs:d(x.llmRequestAt,x.llmFirstTokenAt),ttsFirstChunkMs:d(x.ttsRequestAt,x.ttsFirstChunkAt),decodeMs:d(x.ttsFirstChunkAt,x.audioPlayAt),totalMs:d(x.recordStopAt,x.audioPlayAt)}); }
