"use client";
import { useEffect, useRef, useState } from "react";
import { convertRecordingToWav } from "@/lib/voice/wav";
import { stopActiveVoicePlayback } from "@/lib/voice/playback-coordinator";
import {
  VOICE_MAX_FILE_BYTES,
  VOICE_MAX_DURATION_SECONDS,
} from "@/lib/voice/config";
import { Wave } from "./icons";
export function DesktopRecorder({
  disabled,
  onVoice,
  onBusy,
  onNotice,
  onText,
}: {
  disabled: boolean;
  onVoice: (blob: Blob, seconds: number, text: string) => Promise<void>;
  onBusy: (busy: boolean) => void;
  onNotice: (text: string) => void;
  onText: (text: string) => void;
}) {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [canceling, setCanceling] = useState(false);
  const alive = useRef(true);
  const pressed = useRef(false);
  const keyboardPressed = useRef(false);
  const activePointer = useRef<number | null>(null);
  const permissionAttempt = useRef(0);
  const hold = useRef<HTMLButtonElement>(null);
  const busy = useRef(false);
  const cancel = useRef(false);
  const startY = useRef(0);
  const converting = useRef(false);
  const [convertTarget, setConvertTarget] = useState(false);
  const [convertedText, setConvertedText] = useState<string | null>(null);
  const [failedRecording, setFailedRecording] = useState<{blob: Blob; seconds: number; convert: boolean} | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const abort = useRef<AbortController | null>(null);
  const stop = () => {
    const waitingPermission = pressed.current && !recorder.current && busy.current;
    const releasedBeforePermission = waitingPermission && !cancel.current;
    if (waitingPermission) {
      permissionAttempt.current++;
      busy.current = false;
      if (alive.current) onBusy(false);
    }
    keyboardPressed.current = false;
    pressed.current = false;
    activePointer.current = null;
    if (recorder.current?.state === "recording") recorder.current.stop();
    if (releasedBeforePermission) onNotice("未开始录音，本次没有发送。");
  };
  const cancelRecording = (message: string) => {
    cancel.current = true;
    onNotice(message);
    stop();
  };
  useEffect(() => {
    alive.current = true;
    const interrupt = () => {
      if (document.hidden) {
        if (!pressed.current && busy.current) onNotice("");
        if (pressed.current) cancelRecording("页面切到后台，录音已取消，本次没有发送。");
        else { cancel.current = true; stop(); }
        abort.current?.abort();
      }
    };
    const loseWindowFocus = () => {
      if (!pressed.current && !busy.current) return;
      if (!pressed.current && busy.current) onNotice("");
      if (pressed.current) cancelRecording("窗口失去焦点，录音已取消，本次没有发送。");
      else { cancel.current = true; stop(); }
      abort.current?.abort();
    };
    // 导航菜单不会主动中止键盘按住录音；松开仍只结束所属录音一次。
    const releaseKeyboard = (event: KeyboardEvent) => {
      if (event.code === "Space" && keyboardPressed.current && pressed.current) {
        event.preventDefault(); stop();
      }
    };
    const leaveRecordingContext = (event: FocusEvent) => {
      if (!keyboardPressed.current || !pressed.current) return;
      if (event.target === hold.current || (event.target instanceof HTMLElement && event.target.closest(".qm-desktop-navigation"))) return;
      cancelRecording("录音已取消，本次没有发送。");
    };
    const cancelByEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented && keyboardPressed.current && pressed.current) {
        cancelRecording("录音已取消，本次没有发送。");
      }
    };
    window.addEventListener("keyup", releaseKeyboard, true);
    window.addEventListener("keydown", cancelByEscape);
    document.addEventListener("focusin", leaveRecordingContext);
    document.addEventListener("visibilitychange", interrupt);
    window.addEventListener("blur", loseWindowFocus);
    return () => {
      alive.current = false;
      cancel.current = true;
      stop();
      stream.current?.getTracks().forEach((t) => t.stop());
      abort.current?.abort();
      if (timer.current) clearInterval(timer.current);
      window.removeEventListener("keyup", releaseKeyboard, true);
      window.removeEventListener("keydown", cancelByEscape);
      document.removeEventListener("focusin", leaveRecordingContext);
      document.removeEventListener("visibilitychange", interrupt);
      window.removeEventListener("blur", loseWindowFocus);
    };
  }, [onNotice]);
  async function transcribe(blob: Blob, seconds: number, convert: boolean): Promise<boolean> {
    setTranscribing(true);
    onNotice("语音转文字中…");
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let timedOut = false;
    const controller = new AbortController();
    abort.current = controller;
    const deadline = new Promise<never>((_, reject) => {
      controller.signal.addEventListener("abort", () => reject(new DOMException("转写已中止", "AbortError")), { once: true });
      timeout = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, 30000);
    });
    try {
      const wav = await Promise.race([convertRecordingToWav(blob, 16000, controller.signal), deadline]);
      if (!alive.current || cancel.current) return false;
      const form = new FormData();
      form.append("file", wav, "voice-input.wav");
      const res = await Promise.race([fetch("/api/voice/transcribe", { method: "POST", body: form, signal: controller.signal }), deadline]);
      const data = await Promise.race([res.json(), deadline]);
      if (!alive.current || cancel.current) return false;
      if (!res.ok || !data.ok || typeof data.text !== "string" || !data.text.trim()) throw new Error("转写失败");
      clearTimeout(timeout);
      abort.current = null;
      setTranscribing(false);
      onNotice("");
      if (convert) setConvertedText(data.text.trim());
      else await onVoice(blob, seconds, data.text.trim());
      return true;
    } catch {
      if (alive.current && !cancel.current) onNotice(timedOut
        ? "语音转文字超时，本次没有发送，请重试。"
        : "语音转文字失败，本次没有发送，请重试。");
      return false;
    } finally {
      clearTimeout(timeout);
      if (abort.current === controller) abort.current = null;
      if (alive.current) setTranscribing(false);
    }
  }
  async function retryRecording() {
    if (!failedRecording || busy.current || disabled) return;
    busy.current = true;
    cancel.current = false;
    onBusy(true);
    try {
      const ok = await transcribe(failedRecording.blob, failedRecording.seconds, failedRecording.convert);
      if (alive.current && ok) setFailedRecording(null);
    } finally {
      busy.current = false;
      if (alive.current) onBusy(false);
    }
  }
  async function begin(y: number) {
    if (disabled || busy.current || convertedText !== null || failedRecording) return;
    const ownAttempt = ++permissionAttempt.current;
    busy.current = true;
    pressed.current = true;
    cancel.current = false;
    startY.current = y;
    setCanceling(false);
    converting.current = false;
    setConvertTarget(false);
    onNotice("正在请求麦克风权限，录音尚未开始。");
    onBusy(true);
    stopActiveVoicePlayback();
    let permissionTimer: ReturnType<typeof setTimeout> | undefined;
    let permissionTimedOut = false;
    try {
      if (
        !navigator.mediaDevices?.getUserMedia ||
        typeof MediaRecorder === "undefined"
      )
        throw new Error("当前浏览器无法录音，请使用文字输入。");
      const mediaRequest = navigator.mediaDevices.getUserMedia({ audio: true }).then((media) => {
        // 浏览器授权弹窗可能在超时之后才放行；不得让迟到的麦克风继续采集。
        if (permissionTimedOut || ownAttempt !== permissionAttempt.current || !alive.current || !pressed.current)
          media.getTracks().forEach((track) => track.stop());
        return media;
      });
      const deadline = new Promise<never>((_, reject) => {
        permissionTimer = setTimeout(() => {
          permissionTimedOut = true;
          reject(new DOMException("麦克风授权等待超时", "TimeoutError"));
        }, 15000);
      });
      const s = await Promise.race([mediaRequest, deadline]);
      clearTimeout(permissionTimer);
      if (!alive.current || !pressed.current || ownAttempt !== permissionAttempt.current) {
        if (!permissionTimedOut && ownAttempt === permissionAttempt.current) s.getTracks().forEach((t) => t.stop());
        if (ownAttempt === permissionAttempt.current) {
          busy.current = false;
          onBusy(false);
          if (alive.current) onNotice("未开始录音，本次没有发送。");
        }
        return;
      }
      stream.current = s;
      const mime = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/ogg",
      ].find((x) => MediaRecorder.isTypeSupported(x));
      const r = new MediaRecorder(s, mime ? { mimeType: mime } : undefined);
      recorder.current = r;
      const chunks: Blob[] = [];
      let at = 0;
      let bytes = 0;
      r.ondataavailable = (e) => {
        if (e.data.size) {
          chunks.push(e.data);
          bytes += e.data.size;
          if (bytes > VOICE_MAX_FILE_BYTES) {
            cancel.current = true;
            onNotice("录音文件过大，本次没有发送。");
            stop();
          }
        }
      };
      r.onerror = () => {
        cancelRecording("录音设备发生错误，本次没有发送。请检查设备后重试。");
      };
      s.getAudioTracks().forEach((t) => {
        t.onended = () => {
          if (r.state === "recording") {
            cancelRecording("麦克风连接中断，本次没有发送。请检查设备后重试。");
          }
        };
      });
      r.onstop = async () => {
        if (timer.current) clearInterval(timer.current);
        s.getTracks().forEach((t) => t.stop());
        stream.current = null;
        recorder.current = null;
        const seconds = at ? (Date.now() - at) / 1000 : 0;
        if (alive.current) setRecording(false);
        try {
          if (!alive.current || cancel.current) return;
          if (seconds < 1) {
            onNotice("说话时间太短，本次没有发送。");
            return;
          }
          const blob = new Blob(chunks, { type: r.mimeType });
          if (!blob.size) throw new Error("没有录到声音，请重试。");
          const convert = converting.current;
          const ok = await transcribe(blob, seconds, convert);
          if (!ok && alive.current && !cancel.current) setFailedRecording({ blob, seconds, convert });
        } catch (e) {
          if (alive.current && !cancel.current)
            onNotice(
              e instanceof Error && e.message === "没有录到声音，请重试。"
                ? e.message
                : "语音转文字失败，本次没有发送，请重试。",
            );
        } finally {
          busy.current = false;
          if (alive.current) onBusy(false);
        }
      };
      r.onstart = () => {
        at = Date.now();
        if (!alive.current || !pressed.current || r.state !== "recording") return;
        onNotice("");
        setRecording(true);
        setElapsed(0);
        timer.current = setInterval(() => {
          if (!alive.current) return;
          const n = Math.floor((Date.now() - at) / 1000);
          setElapsed(n);
          if (n >= VOICE_MAX_DURATION_SECONDS) {
            onNotice(`已录满 ${VOICE_MAX_DURATION_SECONDS} 秒，正在结束录音并转写。`);
            stop();
          }
        }, 200);
      };
      r.start(250);
    } catch (e) {
      clearTimeout(permissionTimer);
      if (ownAttempt !== permissionAttempt.current) return;
      permissionAttempt.current++;
      busy.current = false;
      pressed.current = false;
      activePointer.current = null;
      stream.current?.getTracks().forEach((t) => t.stop());
      stream.current = null;
      if (alive.current) {
        onBusy(false);
        onNotice(
          e instanceof DOMException && e.name === "NotAllowedError"
            ? "没有麦克风权限，请在浏览器设置中允许，或切回文字。"
            : e instanceof DOMException && e.name === "TimeoutError"
              ? "麦克风授权等待超时，本次没有录音。请重试或切回文字。"
            : e instanceof Error &&
                e.message === "当前浏览器无法录音，请使用文字输入。"
              ? e.message
              : "录音失败，请重试。",
        );
      }
    }
  }
  const finalTenSeconds = recording && elapsed >= VOICE_MAX_DURATION_SECONDS - 10;
  const displayedSeconds = finalTenSeconds
    ? Math.max(0, VOICE_MAX_DURATION_SECONDS - elapsed)
    : elapsed;
  return (
    <>
      <button
        type="button"
        ref={hold}
        className="chat-hold"
        disabled={disabled || convertedText !== null || failedRecording !== null}
        onPointerDown={(e) => {
          if (e.button !== 0 || pressed.current || busy.current || activePointer.current !== null) return;
          e.preventDefault();
          keyboardPressed.current = false;
          activePointer.current = e.pointerId;
          e.currentTarget.setPointerCapture(e.pointerId);
          void begin(e.clientY);
        }}
        onPointerMove={(e) => {
          if (!pressed.current || activePointer.current !== e.pointerId) return;
          const above = startY.current - e.clientY > 50;
          const center = e.currentTarget.getBoundingClientRect().left + e.currentTarget.getBoundingClientRect().width / 2;
          converting.current = above && e.clientX >= center + e.currentTarget.getBoundingClientRect().width * 0.2;
          cancel.current = above && !converting.current;
          setCanceling(cancel.current);
          setConvertTarget(converting.current);
        }}
        onPointerUp={(e) => { if (activePointer.current === e.pointerId) stop(); }}
        onLostPointerCapture={(e) => {
          // The normal pointerup releases capture after stop clears pressed.
          // Unexpected capture loss while held must never send the recording.
          if (!pressed.current || activePointer.current !== e.pointerId) return;
          cancelRecording("录音已取消，本次没有发送。");
        }}
        onPointerCancel={(e) => {
          if (activePointer.current === e.pointerId) cancelRecording("录音已取消，本次没有发送。");
        }}
        onClick={(event) => {
          // Enter and assistive-technology activation dispatch a keyboard-style click.
          // Pointer activation is already owned by pointerdown/up; never start twice.
          if (event.detail !== 0) return;
          if (activePointer.current !== null) return;
          if (pressed.current) stop();
          else void begin(0);
        }}
        onKeyDown={(e) => {
          if (e.code === "Space" && !e.repeat) {
            e.preventDefault();
            if (pressed.current || busy.current || activePointer.current !== null) return;
            keyboardPressed.current = true;
            void begin(0);
          }
          if (pressed.current && ["ArrowLeft", "ArrowRight", "ArrowDown"].includes(e.key)) {
            e.preventDefault();
            converting.current = e.key === "ArrowRight";
            cancel.current = e.key === "ArrowLeft";
            setConvertTarget(converting.current);
            setCanceling(cancel.current);
          }
          if (e.key === "Escape" && pressed.current) {
            cancelRecording("录音已取消，本次没有发送。");
          }
        }}
        onKeyUp={(e) => {
          if (e.code === "Space" && keyboardPressed.current && activePointer.current === null) {
            e.preventDefault();
            stop();
          }
        }}
        onBlur={(event) => {
          if (event.relatedTarget instanceof HTMLElement && event.relatedTarget.closest(".qm-desktop-navigation")) return;
          if (pressed.current) cancelRecording("录音已取消，本次没有发送。");
        }}
      >
        按住 说话
      </button>
      {transcribing && <div className="chat-status">
        <button type="button" onClick={() => {
          cancel.current = true;
          abort.current?.abort();
          setFailedRecording(null);
          setTranscribing(false);
          onNotice("已取消本次转写并丢弃录音，本次没有发送。");
        }}>取消本次转写并丢弃录音</button>
      </div>}
      {failedRecording && <div className="chat-status" role="status">
        本次录音尚未发送，仅在当前录音界面暂存；切回文字或离开页面将丢弃。
        <button type="button" disabled={disabled} onClick={() => void retryRecording()}>重试本次转写</button>
        <button type="button" onClick={() => { cancel.current = true; abort.current?.abort(); setFailedRecording(null); onNotice(""); }}>丢弃本次录音</button>
      </div>}
      {convertedText !== null && (
        <div className="chat-status" role="status">
          <p>转写结果尚未发送，请确认后加入草稿：</p>
          <textarea aria-label="编辑转写结果" value={convertedText} onChange={(event) => setConvertedText(event.target.value)} />
          <button type="button" disabled={!convertedText.trim()} onClick={() => { onText(convertedText); setConvertedText(null); }}>加入草稿</button>
          <button type="button" onClick={() => setConvertedText(null)}>丢弃转写</button>
        </div>
      )}
      {recording && (
        <div className="chat-overlay chat-record-overlay" style={{ pointerEvents: "none" }}>
          <div className={`chat-record-card${finalTenSeconds ? " chat-record-last-ten" : ""}`}>
            <strong role="timer" aria-live="off" aria-label={finalTenSeconds ? `录音还剩${displayedSeconds}秒` : `已录${displayedSeconds}秒`}>
              {finalTenSeconds ? "还剩 " : ""}
              {String(Math.floor(displayedSeconds / 60)).padStart(2, "0")}:
              {String(displayedSeconds % 60).padStart(2, "0")}
            </strong>
            {finalTenSeconds && <span className="chat-record-warning" role="status">录音还剩10秒，到点会自动结束并转写。</span>}
            <Wave />
            <p role="status">{canceling ? "松开取消发送" : convertTarget ? "松开转文字" : "松开发语音"}</p>
            <p>{convertTarget ? "转写后确认加入草稿，不会自动发送" : "向上移开取消"}</p>
          </div>
        </div>
      )}
    </>
  );
}
