"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { VOICE_P3_ENABLED, VOICE_SPEECH_ENDPOINT, type VoiceRole } from "@/lib/voice/tts-config";
import { claimVoicePlayback } from "@/lib/voice/playback-coordinator";
import { AI_BASE_PLAYBACK_RATE, getVoicePlaybackRate, toggleVoicePlaybackRate, type VoicePlaybackRate } from "@/lib/voice/playback-settings";
import { markVoicePerfOnce, reportVoicePerf } from "@/lib/voice/performance";

interface Props {
  text: string;
  role: VoiceRole;
  messageId?: string;
  eagerPrefetch?: boolean;
}

const MAX_SEGMENT_CHARS = 850;

type PlayerStatus = "idle" | "loading" | "playing" | "paused" | "error";

function splitForSpeech(text: string): string[] {
  const source = text.trim();
  if (!source) return [];
  const natural = source.match(/[^。！？!?；;\n]+[。！？!?；;]?|\n+/g) || [source];
  const result: string[] = [];
  for (const raw of natural) {
    const piece = raw.trim();
    if (!piece) continue;
    if (piece.length <= MAX_SEGMENT_CHARS) {
      result.push(piece);
    } else {
      for (let i = 0; i < piece.length; i += MAX_SEGMENT_CHARS) {
        result.push(piece.slice(i, i + MAX_SEGMENT_CHARS));
      }
    }
  }
  return result;
}

/** 格式化秒数为 M:SS */
function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * 单段流式播放控制器
 *
 * 持有 audio 元素引用，组件层通过 audio 元素实现 pause/resume/seek。
 * MSE 路径：不销毁 SourceBuffer，pause 时只调 audio.pause()。
 * Safari 兜底：直接用 blob URL 的 audio 元素。
 */
interface SegmentController {
  audio: HTMLAudioElement;
  cancel: () => void;
  done: Promise<void>;
}

/**
 * 流式播放一段 TTS 音频。
 * 返回 SegmentController，audio 元素可由外部控制 pause/resume。
 */
async function streamSegment(
  segment: string,
  role: VoiceRole,
  signal: AbortSignal,
  autoStart = true,
): Promise<SegmentController> {
  const tStart = Date.now();
  markVoicePerfOnce("ttsRequestAt");
  const response = await fetch(VOICE_SPEECH_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: segment, role }),
    signal,
  });
  if (!response.ok || !response.body) {
    throw new Error(`VOICE-TTS-${response.status || "006"}`);
  }

  // 检查是否支持 MediaSource + audio/mpeg
  const canMse =
    typeof MediaSource !== "undefined" &&
    MediaSource.isTypeSupported("audio/mpeg");

  const reader = response.body.getReader();

  // ===== Safari 兜底：整段 blob =====
  if (!canMse) {
    const chunks: Uint8Array[] = [];
    let safariFirstChunk = true;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        if (safariFirstChunk) {
          safariFirstChunk = false;
          markVoicePerfOnce("ttsFirstChunkAt");
        }
        chunks.push(value);
      }
    }
    const blob = new Blob(chunks as BlobPart[], { type: "audio/mpeg" });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);

    let cancelled = false;
    const done = new Promise<void>((resolve) => {
      audio.onended = () => {
        URL.revokeObjectURL(url);
        resolve();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        resolve();
      };
    });

    if (autoStart) {
      audio.play().catch(() => {
        // Safari/iOS 可能要求更直接的用户手势；组件层仍会再次尝试播放。
      });
    }

    return {
      audio,
      cancel: () => {
        cancelled = true;
        audio.pause();
        audio.src = "";
        URL.revokeObjectURL(url);
      },
      done,
    };
  }

  // ===== 主路径：MediaSource 流式播放 =====
  const mediaSource = new MediaSource();
  const audio = document.createElement("audio");
  const srcUrl = URL.createObjectURL(mediaSource);
  audio.src = srcUrl;

  let sourceBuffer: SourceBuffer | null = null;
  let queue: Uint8Array[] = [];
  let firstByteMs = 0;
  let cancelled = false;
  let appendInFlight = false;
  let sawEnd = false;

  const appendNext = () => {
    if (cancelled) return;
    if (!sourceBuffer || appendInFlight) return;
    if (sourceBuffer.updating) return;
    if (queue.length === 0) {
      if (sawEnd && mediaSource.readyState === "open") {
        try {
          mediaSource.endOfStream();
        } catch {
          /* ignore */
        }
      }
      return;
    }
    const chunk = queue.shift()!;
    appendInFlight = true;
    try {
      sourceBuffer.appendBuffer(chunk as BufferSource);
    } catch {
      appendInFlight = false;
    }
  };

  const openPromise = new Promise<void>((resolve) => {
    if (mediaSource.readyState === "open") {
      resolve();
      return;
    }
    const onOpen = () => {
      mediaSource.removeEventListener("sourceopen", onOpen);
      resolve();
    };
    mediaSource.addEventListener("sourceopen", onOpen);
  });

  const done = new Promise<void>((resolve) => {
    // 只能以“实际播放结束/播放错误”作为段落完成。
    // sourceended 仅代表数据流写完，不代表用户已经听完。
    audio.onended = () => resolve();
    audio.onerror = () => resolve();
  }).then(() => {
    URL.revokeObjectURL(srcUrl);
  });

  await openPromise;
  if (cancelled) {
    URL.revokeObjectURL(srcUrl);
    return {
      audio,
      cancel: () => {},
      done: Promise.resolve(),
    };
  }

  sourceBuffer = mediaSource.addSourceBuffer("audio/mpeg");
  sourceBuffer.mode = "sequence";
  sourceBuffer.addEventListener("updateend", () => {
    appendInFlight = false;
    appendNext();
  });
  sourceBuffer.addEventListener("error", () => {
    appendInFlight = false;
  });

  // 等 canplay 后自动开始播放
  const onCanPlay = () => {
    audio.removeEventListener("canplay", onCanPlay);
    if (firstByteMs === 0) firstByteMs = Date.now() - tStart;
    console.info("[VOICE-P3][PLAY_TIMING]", {
      role,
      firstByteMs,
      phase: "first_play",
    });
    if (autoStart) {
      audio.play().catch(() => {});
    }
  };
  audio.addEventListener("canplay", onCanPlay);

  // 后台读取流并塞进 SourceBuffer
  (async () => {
    try {
      for (;;) {
        const { done: isDone, value } = await reader.read();
        if (cancelled) break;
        if (isDone) {
          sawEnd = true;
          appendNext();
          break;
        }
        if (value) {
          if (firstByteMs === 0) {
            firstByteMs = Date.now() - tStart;
            markVoicePerfOnce("ttsFirstChunkAt");
            console.info("[VOICE-P3][PLAY_TIMING]", {
              role,
              firstByteMs,
              phase: "first_byte",
            });
          }
          queue.push(value);
          appendNext();
        }
      }
    } catch {
      /* abort */
    }
  })();

  return {
    audio,
    cancel: () => {
      cancelled = true;
      try {
        audio.pause();
      } catch {
        /* ignore */
      }
      try {
        reader.cancel();
      } catch {
        /* ignore */
      }
      if (mediaSource.readyState === "open") {
        try {
          mediaSource.endOfStream();
        } catch {
          /* ignore */
        }
      }
      URL.revokeObjectURL(srcUrl);
    },
    done: done.then(() => {
      if (!cancelled) {
        console.info("[VOICE-P3][PLAY_TIMING]", {
          role,
          firstByteMs,
          totalMs: Date.now() - tStart,
          phase: "ended",
        });
      }
    }),
  };
}

export function VoiceReplyPlayer({ text, role, messageId, eagerPrefetch = false }: Props) {
  const [status, setStatus] = useState<PlayerStatus>("idle");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [segmentCount, setSegmentCount] = useState(0);
  const [playbackRate, setPlaybackRateState] = useState<VoicePlaybackRate>(1);
  const [unread, setUnread] = useState(true);

  const abortRef = useRef<AbortController | null>(null);
  const segmentCtlRef = useRef<SegmentController | null>(null);
  const rafRef = useRef<number | null>(null);
  const playLoopCancelledRef = useRef(false);
  const releasePlaybackRef = useRef<(() => void) | null>(null);
  const prefetchAbortRef = useRef<AbortController | null>(null);
  const prefetchedFirstRef = useRef<{ segment: string; ctl: SegmentController } | null>(null);

  useEffect(() => {
    if (!messageId) return;
    try { setUnread(localStorage.getItem(`qm_voice_played_${messageId}`) !== "1"); } catch {}
  }, [messageId]);

  useEffect(() => {
    setPlaybackRateState(getVoicePlaybackRate());
    const onRate = (event: Event) => setPlaybackRateState((event as CustomEvent<VoicePlaybackRate>).detail || getVoicePlaybackRate());
    window.addEventListener("qm-voice-rate-change", onRate);
    return () => window.removeEventListener("qm-voice-rate-change", onRate);
  }, []);

  // 第一完整句一出现就后台准备 TTS，但绝不自动播放。
  useEffect(() => {
    if (!VOICE_P3_ENABLED || !eagerPrefetch || prefetchedFirstRef.current) return;
    const match = text.match(/^([\s\S]*?[。！？!?；;])/);
    const firstSentence = match?.[1]?.trim();
    if (!firstSentence) return;
    const controller = new AbortController();
    prefetchAbortRef.current = controller;
    void streamSegment(firstSentence, role, controller.signal, false)
      .then((ctl) => {
        if (controller.signal.aborted) { ctl.cancel(); return; }
        prefetchedFirstRef.current = { segment: firstSentence, ctl };
      })
      .catch(() => {});
    return () => {
      // 流式 text 更新不取消已经启动的首句预取。
    };
  }, [text, role, eagerPrefetch]);

  /** 完全清理（停止播放、释放资源） */
  const cleanup = useCallback((preservePrefetch = false) => {
    abortRef.current?.abort();
    abortRef.current = null;
    playLoopCancelledRef.current = true;
    if (segmentCtlRef.current) {
      segmentCtlRef.current.cancel();
      segmentCtlRef.current = null;
    }
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    releasePlaybackRef.current?.();
    releasePlaybackRef.current = null;
    if (!preservePrefetch) {
      prefetchAbortRef.current?.abort();
      prefetchAbortRef.current = null;
      prefetchedFirstRef.current?.ctl.cancel();
      prefetchedFirstRef.current = null;
    }
  }, []);

  useEffect(() => cleanup, [cleanup]);

  /** 更新进度条 */
  const updateProgress = useCallback(() => {
    const ctl = segmentCtlRef.current;
    if (ctl) {
      setCurrentTime(ctl.audio.currentTime || 0);
      const d = ctl.audio.duration;
      if (isFinite(d) && d > 0) {
        setDuration(d);
      }
    }
    rafRef.current = requestAnimationFrame(updateProgress);
  }, []);

  const startProgressTracking = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(updateProgress);
  }, [updateProgress]);

  const stopProgressTracking = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    releasePlaybackRef.current?.();
    releasePlaybackRef.current = null;
  }, []);

  /** 开始播放 */
  const play = async () => {
    if (!VOICE_P3_ENABLED || !text.trim()) return;
    cleanup(true);
    playLoopCancelledRef.current = false;

    const controller = new AbortController();
    abortRef.current = controller;
    setStatus("loading");
    setCurrentTime(0);
    setDuration(0);

    try {
      const playbackText = text;
      const segments = splitForSpeech(playbackText);
      if (!segments.length) throw new Error("VOICE-TTS-004");

      setSegmentCount(segments.length);

      // 接管全局语音播放权：新的语音条开始时自动停止旧的。
      releasePlaybackRef.current?.();
      releasePlaybackRef.current = claimVoicePlayback(() => {
        controller.abort();
        playLoopCancelledRef.current = true;
        segmentCtlRef.current?.cancel();
        segmentCtlRef.current = null;
        setStatus("idle");
        stopProgressTracking();
      });

      // 当前段 Promise。第一段立即建立；后续段只预取“下一段”一次并真正复用。
      const prefetched = prefetchedFirstRef.current;
      let currentPromise: Promise<SegmentController>;
      if (prefetched && prefetched.segment === segments[0]) {
        prefetchedFirstRef.current = null;
        prefetchAbortRef.current = null;
        currentPromise = Promise.resolve(prefetched.ctl);
      } else {
        currentPromise = streamSegment(segments[0], role, controller.signal, true);
      }

      for (let index = 0; index < segments.length; index++) {
        if (controller.signal.aborted || playLoopCancelledRef.current) return;

        setSegmentIndex(index);
        setCurrentTime(0);
        setDuration(0);

        const ctl = await currentPromise;
        if (controller.signal.aborted || playLoopCancelledRef.current) {
          ctl.cancel();
          return;
        }
        segmentCtlRef.current = ctl;

        // 下一段在当前段播放到约80%时预取；若 duration 暂不可知，则结束前兜底请求。
        let nextPromise: Promise<SegmentController> | null = null;
        const ensureNextPrefetch = () => {
          if (!nextPromise && index + 1 < segments.length) {
            nextPromise = streamSegment(segments[index + 1], role, controller.signal, false);
          }
          return nextPromise;
        };

        const audio = ctl.audio;
        audio.playbackRate = AI_BASE_PLAYBACK_RATE * playbackRate;
        const onTimeUpdate = () => {
          setCurrentTime(audio.currentTime || 0);
          const d = audio.duration;
          if (isFinite(d) && d > 0) {
            setDuration(d);
            if (audio.currentTime / d >= 0.8) ensureNextPrefetch();
          }
        };
        const onLoadedMetadata = () => {
          const d = audio.duration;
          if (isFinite(d) && d > 0) setDuration(d);
        };
        const onPlay = () => {
          setStatus("playing");
          setUnread(false);
          if (messageId) { try { localStorage.setItem(`qm_voice_played_${messageId}`, "1"); } catch {} }
          markVoicePerfOnce("audioPlayAt");
          reportVoicePerf(role);
          startProgressTracking();

          const stopAt = (window as Window & {
            __QM_VOICE_LAST_RECORD_STOP_AT?: number;
          }).__QM_VOICE_LAST_RECORD_STOP_AT;
          if (typeof stopAt === "number") {
            console.info("[VOICE-E2E][STOP_TO_FIRST_AUDIO]", {
              role,
              ms: Math.round(performance.now() - stopAt),
            });
          }
        };
        const onPause = () => {
          if (!playLoopCancelledRef.current && !audio.ended) {
            setStatus((prev) => (prev === "playing" ? "paused" : prev));
            stopProgressTracking();
          }
        };

        audio.addEventListener("timeupdate", onTimeUpdate);
        audio.addEventListener("loadedmetadata", onLoadedMetadata);
        audio.addEventListener("play", onPlay);
        audio.addEventListener("pause", onPause);

        // Safari blob fallback / 已预取段需要显式 play。
        if (audio.paused) {
          await audio.play();
        }

        await ctl.done;

        audio.removeEventListener("timeupdate", onTimeUpdate);
        audio.removeEventListener("loadedmetadata", onLoadedMetadata);
        audio.removeEventListener("play", onPlay);
        audio.removeEventListener("pause", onPause);

        segmentCtlRef.current = null;
        stopProgressTracking();

        if (controller.signal.aborted || playLoopCancelledRef.current) return;
        if (index + 1 >= segments.length) break;

        // 如果80%时尚未触发（例如 duration 不可用），此处兜底启动一次。
        currentPromise = ensureNextPrefetch()!;
      }

      if (!controller.signal.aborted && !playLoopCancelledRef.current) {
        setStatus("idle");
        setCurrentTime(0);
        setDuration(0);
        releasePlaybackRef.current?.();
        releasePlaybackRef.current = null;
      }
    } catch (error) {
      if (controller.signal.aborted || playLoopCancelledRef.current) return;
      console.error("[VOICE-P3] playback failed", error);
      setStatus("error");
      releasePlaybackRef.current?.();
      releasePlaybackRef.current = null;
    } finally {
      abortRef.current = null;
      stopProgressTracking();
    }
  };

  /** 暂停（不销毁 MSE buffer） */
  const pause = () => {
    const ctl = segmentCtlRef.current;
    if (ctl) {
      ctl.audio.pause();
      setStatus("paused");
      stopProgressTracking();
    }
  };

  /** 从暂停位置继续 */
  const resume = () => {
    const ctl = segmentCtlRef.current;
    if (ctl) {
      ctl.audio.playbackRate = AI_BASE_PLAYBACK_RATE * playbackRate;
      releasePlaybackRef.current?.();
      releasePlaybackRef.current = claimVoicePlayback(() => pause());
      ctl.audio.play().then(() => {
        setStatus("playing");
        startProgressTracking();
      }).catch(() => {
        // 自动播放策略等
      });
    }
  };

  /** 完全停止 */
  const stop = () => {
    cleanup();
    setStatus("idle");
    setCurrentTime(0);
    setDuration(0);
  };

  /** 拖动进度条 seek */
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const ctl = segmentCtlRef.current;
    if (!ctl) return;
    const newTime = parseFloat(e.target.value);
    // 流式未完成时只能在已缓冲范围内 seek
    try {
      ctl.audio.currentTime = newTime;
      setCurrentTime(newTime);
    } catch {
      // seek 失败（如流式尚未缓冲到该位置），静默忽略
    }
  };

  if (!VOICE_P3_ENABLED || !text.trim()) return null;

  const isBusy = status === "loading" || status === "playing" || status === "paused";
  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="mt-2 flex items-center gap-2 text-xs">
      {/* 播放/暂停按钮 */}
      {status === "playing" ? (
        <button
          type="button"
          onClick={pause}
          className="w-8 h-8 rounded-full bg-[var(--qm-purple-600)] text-white flex items-center justify-center flex-shrink-0 hover:bg-[var(--qm-purple-700)] transition-colors"
          aria-label="暂停语音"
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        </button>
      ) : status === "paused" ? (
        <button
          type="button"
          onClick={resume}
          className="w-8 h-8 rounded-full bg-[var(--qm-purple-600)] text-white flex items-center justify-center flex-shrink-0 hover:bg-[var(--qm-purple-700)] transition-colors"
          aria-label="继续播放"
        >
          <svg className="w-3.5 h-3.5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
      ) : status === "loading" ? (
        <button
          type="button"
          onClick={stop}
          className="w-8 h-8 rounded-full border border-[var(--qm-line-200)] bg-white flex items-center justify-center flex-shrink-0"
          aria-label="加载中"
        >
          <svg className="w-4 h-4 animate-spin text-[var(--qm-purple-600)]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </button>
      ) : (
        <button
          type="button"
          onClick={play}
          className="rounded-full border border-[var(--qm-line-200)] bg-white px-3 py-1.5 text-[var(--qm-ink-600)] hover:border-[#6B4C9A]/40 transition-colors"
          aria-label="播放语音回复"
        >
          ▶ 语音回复
        </button>
      )}

      {unread && status === "idle" && <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" aria-label="未播放" />}
      <button
        type="button"
        onClick={() => {
          const next = toggleVoicePlaybackRate(playbackRate);
          setPlaybackRateState(next);
          if (segmentCtlRef.current) segmentCtlRef.current.audio.playbackRate = AI_BASE_PLAYBACK_RATE * next;
        }}
        className="text-[11px] text-[var(--qm-ink-400)] flex-shrink-0"
        aria-label="切换播放倍速"
      >
        {playbackRate}x
      </button>

      {/* 进度条 + 时间（播放中/暂停时显示） */}
      {isBusy && (
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex-1 relative h-1.5 group">
            <div className="absolute inset-0 bg-[var(--qm-line-200)] rounded-full" />
            <div
              className="absolute left-0 top-0 h-full bg-[var(--qm-purple-500)] rounded-full transition-[width] duration-100"
              style={{ width: `${progressPct}%` }}
            />
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              aria-label="播放进度"
            />
          </div>
          <span className="text-[11px] text-[var(--qm-ink-500)] tabular-nums flex-shrink-0">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          {/* 多段时显示段号 */}
          {segmentCount > 1 && (
            <span className="text-[10px] text-[var(--qm-ink-400)] flex-shrink-0">
              {segmentIndex + 1}/{segmentCount}
            </span>
          )}

          {/* 停止按钮 */}
          {status !== "loading" && (
            <button
              type="button"
              onClick={stop}
              className="text-[var(--qm-ink-400)] hover:text-[var(--qm-ink-600)] transition-colors flex-shrink-0 p-1"
              aria-label="停止"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <rect x="5" y="5" width="14" height="14" rx="2" />
              </svg>
            </button>
          )}
        </div>
      )}

      {status === "error" && (
        <button
          type="button"
          onClick={play}
          className="text-[var(--qm-ink-400)] underline"
        >
          语音暂不可用，文字回复不受影响 · 点击重试
        </button>
      )}
    </div>
  );
}
