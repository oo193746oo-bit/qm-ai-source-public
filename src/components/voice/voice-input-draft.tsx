"use client";

import { useEffect, useRef, useState } from "react";
import { VOICE_MAX_DURATION_SECONDS, VOICE_TRANSCRIBE_ENDPOINT, VOICE_P1_ENABLED } from "@/lib/voice/config";
import type { VoiceTranscriptionResponse } from "@/lib/voice/types";
import { convertRecordingToWav } from "@/lib/voice/wav";
import { stopActiveVoicePlayback } from "@/lib/voice/playback-coordinator";
import { markVoicePerf, resetVoicePerf } from "@/lib/voice/performance";

interface Props {
  disabled?: boolean;
  initialText?: string;
  onSendVoice?: (data:{audioBlob:Blob;duration:number;mimeType:string;initialText:string}) => string | Promise<string>;
  onTranscriptResult?: (data:{messageId:string;text?:string;error?:string;audioBlob?:Blob;duration?:number;mimeType?:string}) => void | Promise<void>;
  /** 兼容尚未升级接线的旧调用方（例如平台内小雪面板） */
  onTranscript?: (text:string) => void;
  onPreviewChange?: (isPreview:boolean) => void;
  compact?: boolean;
}
const MAX_RECORD_SECONDS = Math.min(60, VOICE_MAX_DURATION_SECONDS);

function pickMimeType():string|undefined {
  if(typeof MediaRecorder==="undefined") return undefined;
  return ["audio/webm;codecs=opus","audio/webm","audio/mp4","audio/ogg;codecs=opus","audio/ogg"].find(x=>MediaRecorder.isTypeSupported(x));
}
function errText(e:unknown):string {
  if(e instanceof DOMException && (e.name==="NotAllowedError"||e.name==="SecurityError")) return "没有麦克风权限。请在浏览器的网站设置中允许麦克风，或切回文字输入。";
  if(e instanceof DOMException && e.name==="NotFoundError") return "没有检测到可用麦克风。";
  return "录音没有成功，请重新试一次。";
}
const fmt=(s:number)=>`${Math.floor(s/60).toString().padStart(2,"0")}:${Math.floor(s%60).toString().padStart(2,"0")}`;

export function VoiceInputDraft({disabled=false,initialText="",onSendVoice,onTranscriptResult,onTranscript,onPreviewChange,compact=false}:Props){
  const [recording,setRecording]=useState(false);
  const [seconds,setSeconds]=useState(0);
  const [cancelGesture,setCancelGesture]=useState(false);
  const [notice,setNotice]=useState("");
  const [volume,setVolume]=useState(1);
  const recorderRef=useRef<MediaRecorder|null>(null);
  const streamRef=useRef<MediaStream|null>(null);
  const chunksRef=useRef<Blob[]>([]);
  const startedAtRef=useRef(0);
  const startYRef=useRef<number|null>(null);
  const timerRef=useRef<ReturnType<typeof setInterval>|null>(null);
  const cancelledRef=useRef(false);
  const interruptedRef=useRef(false);
  const pressedRef=useRef(false);
  const cancelGestureRef=useRef(false);
  const analyserRef=useRef<AnalyserNode|null>(null);
  const ctxRef=useRef<AudioContext|null>(null);
  const rafRef=useRef<number|null>(null);

  const cleanup=()=>{
    if(timerRef.current) clearInterval(timerRef.current); timerRef.current=null;
    if(rafRef.current!==null) cancelAnimationFrame(rafRef.current); rafRef.current=null;
    analyserRef.current=null; void ctxRef.current?.close().catch(()=>{}); ctxRef.current=null;
    streamRef.current?.getTracks().forEach(t=>t.stop()); streamRef.current=null; recorderRef.current=null;
    setRecording(false); setVolume(1);
  };
  useEffect(()=>()=>cleanup(),[]);
  useEffect(()=>{ onPreviewChange?.(false); },[onPreviewChange]);

  const meter=(stream:MediaStream)=>{
    try{
      const Ctx=window.AudioContext || (window as typeof window & {webkitAudioContext?:typeof AudioContext}).webkitAudioContext;
      if(!Ctx) return;
      const ctx=new Ctx(); const analyser=ctx.createAnalyser(); analyser.fftSize=256;
      ctx.createMediaStreamSource(stream).connect(analyser); ctxRef.current=ctx; analyserRef.current=analyser;
      const data=new Uint8Array(analyser.frequencyBinCount);
      const tick=()=>{ if(!analyserRef.current)return; analyser.getByteFrequencyData(data); const avg=data.reduce((a,b)=>a+b,0)/Math.max(1,data.length); setVolume(Math.max(1,Math.min(6,Math.ceil(avg/24)))); rafRef.current=requestAnimationFrame(tick); }; tick();
    }catch{}
  };

  const transcribe=async(messageId:string,blob:Blob,initial:string,duration:number,mimeType:string)=>{
    markVoicePerf("asrStartAt");
    try{
      const wav=await convertRecordingToWav(blob,16000); const form=new FormData(); form.append("file",wav,"voice-input.wav");
      const controller=new AbortController(); const timeout=window.setTimeout(()=>controller.abort(),30000);
      let res:Response; try{res=await fetch(VOICE_TRANSCRIBE_ENDPOINT,{method:"POST",body:form,signal:controller.signal});}finally{window.clearTimeout(timeout);}
      const data=(await res.json()) as VoiceTranscriptionResponse;
      if(!res.ok||!data.ok||!data.text?.trim()) throw new Error(data.error||"ASR failed");
      markVoicePerf("asrEndAt");
      const combined=[initial.trim(),data.text.trim()].filter(Boolean).join("\n");
      if(onTranscriptResult) await onTranscriptResult({messageId,text:combined,audioBlob:blob,duration,mimeType});
      else onTranscript?.(combined);
    }catch(e){
      markVoicePerf("asrEndAt");
      if(onTranscriptResult) await onTranscriptResult({messageId,error:e instanceof DOMException&&e.name==="AbortError"?"转写超时，点击重试":"转写失败，点击重试",audioBlob:blob,duration,mimeType});
    }
  };

  const start=async(clientY?:number)=>{
    if(!VOICE_P1_ENABLED||disabled||recording||recorderRef.current)return;
    if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==="undefined"){setNotice("当前浏览器暂不支持网页录音，请切回文字输入。");return;}
    setNotice("");setSeconds(0);setCancelGesture(false);cancelGestureRef.current=false;cancelledRef.current=false;interruptedRef.current=false;pressedRef.current=true;startYRef.current=clientY??null;
    resetVoicePerf();
    stopActiveVoicePlayback();
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:true}); streamRef.current=stream;
      if (!pressedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        return;
      }
      const mime=pickMimeType(); const rec=mime?new MediaRecorder(stream,{mimeType:mime}):new MediaRecorder(stream); recorderRef.current=rec; chunksRef.current=[];
      rec.ondataavailable=e=>{if(e.data.size>0)chunksRef.current.push(e.data);};
      rec.onerror=()=>{interruptedRef.current=true;setNotice("录音被中断，请重新按住说话。");cleanup();};
      rec.onstop=async()=>{
        const mt=rec.mimeType||chunksRef.current[0]?.type||"audio/webm"; const blob=new Blob(chunksRef.current,{type:mt});
        const duration=Math.max(0,(Date.now()-startedAtRef.current)/1000); chunksRef.current=[];
        const cancelled=cancelledRef.current||interruptedRef.current; cleanup();
        if(cancelled)return; if(duration<1){setNotice("说话时间太短");return;} if(!blob.size){setNotice("没有录到有效声音，请重试。");return;}
        markVoicePerf("recordStopAt");
        if(onSendVoice){
          const id=await onSendVoice({audioBlob:blob,duration,mimeType:mt,initialText});
          void transcribe(id,blob,initialText,duration,mt);
        }else{
          // 旧调用方兼容：没有语音消息接线时，仍可转写回原文字输入框。
          void transcribe(`legacy-${Date.now()}`,blob,initialText,duration,mt);
        }
      };
      stream.getAudioTracks().forEach(track=>{track.onended=()=>{if(recorderRef.current?.state==="recording"){interruptedRef.current=true;setNotice("麦克风被系统中断，本次录音已取消。");recorderRef.current.stop();}};});
      startedAtRef.current=Date.now(); rec.start(250); setRecording(true); meter(stream);
      timerRef.current=setInterval(()=>{const elapsed=Math.floor((Date.now()-startedAtRef.current)/1000);setSeconds(elapsed);if(elapsed>=MAX_RECORD_SECONDS&&rec.state==="recording")rec.stop();},200);
    }catch(e){cleanup();setNotice(errText(e));}
  };
  const finish=()=>{pressedRef.current=false;const r=recorderRef.current;if(r?.state==="recording")r.stop();};
  const cancel=()=>{pressedRef.current=false;cancelledRef.current=true;const r=recorderRef.current;if(r?.state==="recording")r.stop();else cleanup();setNotice("已取消发送");};
  const move=(y:number)=>{if(recording&&startYRef.current!==null){const next=startYRef.current-y>50;cancelGestureRef.current=next;setCancelGesture(next);}};

  useEffect(()=>{
    const interrupt=()=>{if(document.visibilityState==="hidden"&&recorderRef.current?.state==="recording"){interruptedRef.current=true;setNotice("应用切到后台，本次录音已取消。");recorderRef.current.stop();}};
    document.addEventListener("visibilitychange",interrupt); return()=>document.removeEventListener("visibilitychange",interrupt);
  },[]);

  if(!VOICE_P1_ENABLED)return null;
  return <div className={compact?"flex items-center":"w-full"}>
    <button type="button" disabled={disabled}
      onTouchStart={e=>{e.preventDefault();void start(e.touches[0]?.clientY);}}
      onTouchMove={e=>move(e.touches[0]?.clientY??0)}
      onTouchEnd={e=>{e.preventDefault();cancelGestureRef.current?cancel():finish();}}
      onTouchCancel={cancel}
      onMouseDown={e=>{e.preventDefault();void start(e.clientY);}}
      onMouseMove={e=>{if(e.buttons===1)move(e.clientY);}}
      onMouseUp={()=>cancelGestureRef.current?cancel():finish()}
      onMouseLeave={()=>{if(recording)cancelGestureRef.current?cancel():finish();}}
      className="w-full min-h-[48px] rounded-2xl border border-[var(--qm-line-200)] bg-white text-sm text-[var(--qm-ink-700)] select-none touch-none disabled:opacity-50"
      aria-label="按住说话">按住 说话</button>
    {notice&&<span className="ml-2 text-xs text-[var(--qm-ink-500)]" role="status">{notice}</span>}
    {recording&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 pointer-events-none">
      <div className="rounded-2xl bg-white/95 px-6 py-5 shadow-xl text-center min-w-[220px]">
        <div className="text-2xl mb-2">🎤</div>
        <div className="h-8 flex items-end justify-center gap-1 mb-2">{Array.from({length:6}).map((_,i)=><span key={i} className="w-1.5 rounded-full bg-[var(--qm-purple-500)]" style={{height:`${8+(i<volume?i+1:1)*3}px`,opacity:i<volume?1:.3}} />)}</div>
        <div className="text-sm tabular-nums text-[var(--qm-ink-700)]">{fmt(seconds)}</div>
        <div className={`mt-2 text-xs ${cancelGesture?"text-red-600":"text-[var(--qm-ink-500)]"}`}>{cancelGesture?"松开取消发送":"松开发送，上滑取消"}</div>
        {MAX_RECORD_SECONDS-seconds<=10&&<div className="mt-1 text-xs text-red-500">还剩 {Math.max(0,MAX_RECORD_SECONDS-seconds)} 秒</div>}
      </div>
    </div>}
  </div>;
}
