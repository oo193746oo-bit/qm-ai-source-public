"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  VOICE_P3_ENABLED,
  VOICE_SPEECH_ENDPOINT,
  type VoiceRole,
} from "@/lib/voice/tts-config";
import { claimVoicePlayback } from "@/lib/voice/playback-coordinator";
import {
  AI_BASE_PLAYBACK_RATE,
  getVoicePlaybackRate,
  type VoicePlaybackRate,
} from "@/lib/voice/playback-settings";
import { markVoicePerfOnce, reportVoicePerf } from "@/lib/voice/performance";

import { Icon, Wave } from "./icons";

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
  if (source.length <= MAX_SEGMENT_CHARS) return [source];
  const result: string[] = [];
  let rest = source;
  while (rest.length > MAX_SEGMENT_CHARS) {
    let end = MAX_SEGMENT_CHARS;
    const boundary = rest
      .slice(0, end)
      .search(/[。！？!?；;\n][^。！？!?；;\n]*$/);
    if (boundary >= MAX_SEGMENT_CHARS / 2) end = boundary + 1;
    const code = rest.charCodeAt(end - 1);
    if (code >= 0xd800 && code <= 0xdbff) end--;
    result.push(rest.slice(0, end));
    rest = rest.slice(end);
  }
  if (rest) result.push(rest);
  return result;
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

    let settleDone: () => void = () => {};
    const done = new Promise<void>((resolve) => {
      settleDone = resolve;
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
        audio.pause();
        audio.src = "";
        URL.revokeObjectURL(url);
        settleDone();
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
  const queue: Uint8Array[] = [];
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

  let settleDone: () => void = () => {};
  let releaseAbort: () => void = () => {};
  const cancelPlayback = () => {
    if (cancelled) return;
    cancelled = true;
    audio.pause();
    audio.src = "";
    void reader.cancel().catch(() => {});
    URL.revokeObjectURL(srcUrl);
    settleDone();
  };
  const openPromise = new Promise<void>((resolve, reject) => {
    const onOpen = () => {
      mediaSource.removeEventListener("sourceopen", onOpen);
      resolve();
    };
    const onAbort = () => {
      mediaSource.removeEventListener("sourceopen", onOpen);
      cancelPlayback();
      reject(new DOMException("Voice playback canceled", "AbortError"));
    };
    releaseAbort = () => signal.removeEventListener("abort", onAbort);
    signal.addEventListener("abort", onAbort, { once: true });
    if (signal.aborted) {
      onAbort();
      return;
    }
    if (mediaSource.readyState === "open") resolve();
    else mediaSource.addEventListener("sourceopen", onOpen);
  });
  const done = new Promise<void>((resolve) => {
    settleDone = resolve;
    // Completed playback and explicit cancellation are different states;
    // the play loop checks its aborted/canceled generation after settlement.
    audio.onended = () => resolve();
    audio.onerror = () => resolve();
  }).then(() => {
    releaseAbort();
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
      cancelPlayback();
      releaseAbort();
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

export function DesktopVoiceReplyPlayer({
  text,
  role,
  messageId,
  eagerPrefetch = false,
}: Props) {
  const [status, setStatus] = useState<PlayerStatus>("idle");
  const [, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [, setSegmentIndex] = useState(0);
  const [segmentCount, setSegmentCount] = useState(0);
  const [playbackRate, setPlaybackRateState] = useState<VoicePlaybackRate>(1);
  const [, setUnread] = useState(true);

  const abortRef = useRef<AbortController | null>(null);
  const segmentCtlRef = useRef<SegmentController | null>(null);
  const rafRef = useRef<number | null>(null);
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stalledTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playLoopCancelledRef = useRef(false);
  const releasePlaybackRef = useRef<(() => void) | null>(null);
  const prefetchAbortRef = useRef<AbortController | null>(null);
  const prefetchedFirstRef = useRef<{
    segment: string;
    ctl: SegmentController;
  } | null>(null);

  const prefetchPromiseRef = useRef<{
    segment: string;
    promise: Promise<SegmentController>;
  } | null>(null);

  useEffect(() => {
    if (!messageId) return;
    try {
      setUnread(localStorage.getItem(`qm_voice_played_${messageId}`) !== "1");
    } catch {}
  }, [messageId]);

  useEffect(() => {
    setPlaybackRateState(getVoicePlaybackRate());
    const onRate = (event: Event) =>
      setPlaybackRateState(
        (event as CustomEvent<VoicePlaybackRate>).detail ||
          getVoicePlaybackRate(),
      );
    window.addEventListener("qm-voice-rate-change", onRate);
    return () => window.removeEventListener("qm-voice-rate-change", onRate);
  }, []);

  // Only completed voice-origin replies reach this player. Prepare the actual
  // first segment without playback; display seconds only after a finite real
  // duration is available and the whole reply is a single segment.
  useEffect(() => {
    if (!VOICE_P3_ENABLED || !eagerPrefetch || !text.trim()) return;
    const segments = splitForSpeech(text);
    const controller = new AbortController();
    prefetchAbortRef.current = controller;
    let own: SegmentController | null = null;
    const measure = () => {
      if (controller.signal.aborted || !own) return;
      const seconds = own.audio.duration;
      if (Number.isFinite(seconds) && seconds > 0) {
        setDuration(seconds);
        setSegmentCount(segments.length);
      }
    };
    const promise = streamSegment(
      segments[0],
      role,
      controller.signal,
      false,
    ).then((ctl) => {
      if (controller.signal.aborted) {
        ctl.cancel();
        throw new DOMException("Voice preparation canceled", "AbortError");
      }
      own = ctl;
      prefetchedFirstRef.current = { segment: segments[0], ctl };
      ctl.audio.addEventListener("durationchange", measure);
      ctl.audio.addEventListener("loadedmetadata", measure);
      measure();
      return ctl;
    });
    prefetchPromiseRef.current = { segment: segments[0], promise };
    void promise.catch(() => {
      /* Click-to-play remains a genuine retry. */
    });
    return () => {
      if (prefetchAbortRef.current === controller) controller.abort();
      if (prefetchPromiseRef.current?.promise === promise)
        prefetchPromiseRef.current = null;
      own?.audio.removeEventListener("durationchange", measure);
      own?.audio.removeEventListener("loadedmetadata", measure);
      // Once handed to playback, its controller owns cleanup.
      if (prefetchedFirstRef.current?.ctl === own) {
        own?.cancel();
        prefetchedFirstRef.current = null;
      }
    };
  }, [text, role, eagerPrefetch]);

  /** 完全清理（停止播放、释放资源） */
  const cleanup = useCallback((preservePrefetch = false) => {
    if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
    loadingTimerRef.current = null;
    if (stalledTimerRef.current) clearTimeout(stalledTimerRef.current);
    stalledTimerRef.current = null;
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
      prefetchPromiseRef.current = null;
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

    const clearLoadingTimer = () => {
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = null;
    };
    const clearStalledTimer = () => {
      if (stalledTimerRef.current) clearTimeout(stalledTimerRef.current);
      stalledTimerRef.current = null;
    };
    const failStalledPlayback = () => {
      if (controller.signal.aborted || abortRef.current !== controller) return;
      controller.abort();
      prefetchAbortRef.current?.abort();
      segmentCtlRef.current?.cancel();
      stopProgressTracking();
      setStatus("error");
    };
    const armLoadingTimer = () => {
      clearLoadingTimer();
      loadingTimerRef.current = setTimeout(failStalledPlayback, 35_000);
    };
    const armStalledTimer = () => {
      clearStalledTimer();
      stalledTimerRef.current = setTimeout(failStalledPlayback, 20_000);
    };
    armLoadingTimer();

    try {
      const playbackText = text;
      const segments = splitForSpeech(playbackText);
      if (!segments.length) throw new Error("VOICE-TTS-004");

      setSegmentCount(segments.length);

      // 接管全局语音播放权：新的语音条开始时自动停止旧的。
      releasePlaybackRef.current?.();
      releasePlaybackRef.current = claimVoicePlayback(() => {
        controller.abort();
        prefetchAbortRef.current?.abort();
        prefetchedFirstRef.current?.ctl.cancel();
        prefetchedFirstRef.current = null;
        prefetchPromiseRef.current = null;
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
        // The resolved preparation promise points to this same controller.
        // Consume both references, so a retry fetches fresh audio after failure.
        prefetchPromiseRef.current = null;
        prefetchAbortRef.current = null;
        currentPromise = Promise.resolve(prefetched.ctl);
      } else if (prefetchPromiseRef.current?.segment === segments[0]) {
        const pending = prefetchPromiseRef.current.promise;
        prefetchPromiseRef.current = null;
        currentPromise = pending
          .then((ctl) => {
            prefetchedFirstRef.current = null;
            prefetchAbortRef.current = null;
            return ctl;
          })
          .catch((error) => {
            if (controller.signal.aborted || playLoopCancelledRef.current) throw error;
            return streamSegment(segments[0], role, controller.signal, true);
          });
      } else {
        currentPromise = streamSegment(
          segments[0],
          role,
          controller.signal,
          true,
        );
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
            nextPromise = streamSegment(
              segments[index + 1],
              role,
              controller.signal,
              false,
            );
          }
          return nextPromise;
        };

        const audio = ctl.audio;
        audio.playbackRate = AI_BASE_PLAYBACK_RATE * playbackRate;
        let lastProgress = audio.currentTime || 0;
        let started = false;
        const onTimeUpdate = () => {
          setCurrentTime(audio.currentTime || 0);
          if (audio.currentTime > lastProgress + 0.01) {
            lastProgress = audio.currentTime;
            if (!audio.paused && !audio.ended) armStalledTimer();
          }
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
          if (started) return;
          started = true;
          clearLoadingTimer();
          armStalledTimer();
          setStatus("playing");
          markVoicePerfOnce("audioPlayAt");
          reportVoicePerf(role);
          startProgressTracking();

          const stopAt = (
            window as Window & {
              __QM_VOICE_LAST_RECORD_STOP_AT?: number;
            }
          ).__QM_VOICE_LAST_RECORD_STOP_AT;
          if (typeof stopAt === "number") {
            console.info("[VOICE-E2E][STOP_TO_FIRST_AUDIO]", {
              role,
              ms: Math.round(performance.now() - stopAt),
            });
          }
        };
        const onPause = () => {
          clearStalledTimer();
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
        if (!audio.paused) onPlay();

        await ctl.done;
        clearStalledTimer();
        if (audio.error && !audio.ended) throw new Error("语音播放失败");

        audio.removeEventListener("timeupdate", onTimeUpdate);
        audio.removeEventListener("loadedmetadata", onLoadedMetadata);
        audio.removeEventListener("play", onPlay);
        audio.removeEventListener("pause", onPause);

        segmentCtlRef.current = null;
        stopProgressTracking();

        if (controller.signal.aborted || playLoopCancelledRef.current) return;
        if (index + 1 >= segments.length) break;

        // 如果80%时尚未触发（例如 duration 不可用），此处兜底启动一次。
        setStatus("loading");
        armLoadingTimer();
        currentPromise = ensureNextPrefetch()!;
      }

      if (!controller.signal.aborted && !playLoopCancelledRef.current) {
        setUnread(false);
        if (messageId) {
          try {
            localStorage.setItem(`qm_voice_played_${messageId}`, "1");
          } catch {}
        }
        setStatus("idle");
        setCurrentTime(0);
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
      if (abortRef.current === controller) {
        clearLoadingTimer();
        clearStalledTimer();
        abortRef.current = null;
        stopProgressTracking();
      }
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
      ctl.audio
        .play()
        .then(() => {
          setStatus("playing");
          startProgressTracking();
        })
        .catch(() => {
          // 自动播放策略等
        });
    }
  };

  /** 完全停止 */
  const stop = () => {
    cleanup();
    setStatus("idle");
    setCurrentTime(0);
  };

  /** 拖动进度条 seek */
  if (!VOICE_P3_ENABLED || !text.trim()) return null;

  return (
    <>
      <div className="chat-audio">
        <span className="chat-speaker">
          <Icon name="speaker" />
        </span>
        <Wave />
        <span>
          {duration > 0 && segmentCount === 1
            ? `${Math.round(duration)}秒`
            : status === "loading"
              ? "加载中…"
              : "语音"}
        </span>
        <button
          type="button"
          onClick={() => {
            if (status === "playing") pause();
            else if (status === "paused") resume();
            else if (status === "loading") stop();
            else void play();
          }}
          aria-label={
            status === "playing"
              ? "暂停小酷语音"
              : status === "loading"
                ? "取消语音加载"
                : "播放小酷语音"
          }
        >
          <Icon name={status === "playing" ? "pause" : "play"} />
        </button>
      </div>
      {status === "error" && (
        <div className="chat-error" role="status">
          语音暂时不可用，文字仍可查看。点击播放可重试。
        </div>
      )}
    </>
  );
}
