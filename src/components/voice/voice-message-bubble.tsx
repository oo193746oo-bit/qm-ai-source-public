"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { claimVoicePlayback } from "@/lib/voice/playback-coordinator";
import { getVoicePlaybackRate, toggleVoicePlaybackRate, type VoicePlaybackRate } from "@/lib/voice/playback-settings";

interface VoiceMessageBubbleProps {
  /** 音频 URL（object URL 或 http URL）；为 null 时显示加载中 */
  messageId: string;
  audioUrl: string | null;
  /** 录音时长（秒） */
  duration: number;
  /** 转写文字 */
  transcript: string;
  transcriptStatus?: "pending" | "ready" | "error";
  transcriptError?: string;
  onRetryTranscript?: () => void;
}

/** 将秒数格式化为 M:SS */
function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * 用户语音消息气泡
 *
 * - 左侧播放/暂停按钮（主色背景白色图标）
 * - 中间进度条 + 时长显示
 * - 用原生 HTMLAudioElement 播放（用户录音是完整 Blob，不需要流式）
 * - 下方转写文字可折叠/展开
 * - audioUrl 为 null 时显示加载中状态（页面刷新后从 IndexedDB 异步恢复）
 */
export function VoiceMessageBubble({ messageId, audioUrl, duration, transcript, transcriptStatus, transcriptError, onRetryTranscript }: VoiceMessageBubbleProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration);
  const [showTranscript, setShowTranscript] = useState(false);
  const [playError, setPlayError] = useState(false);
  const [unread, setUnread] = useState(true);
  const [playbackRate, setPlaybackRateState] = useState<VoicePlaybackRate>(1);
  const rafRef = useRef<number | null>(null);
  const releasePlaybackRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    try { setUnread(localStorage.getItem(`qm_voice_played_${messageId}`) !== "1"); } catch {}
  }, [messageId]);

  useEffect(() => {
    setPlaybackRateState(getVoicePlaybackRate());
    const onRate = (event: Event) => setPlaybackRateState((event as CustomEvent<VoicePlaybackRate>).detail || getVoicePlaybackRate());
    window.addEventListener("qm-voice-rate-change", onRate);
    return () => window.removeEventListener("qm-voice-rate-change", onRate);
  }, []);

  // 创建/更新 audio 元素
  useEffect(() => {
    if (!audioUrl) {
      audioRef.current = null;
      return;
    }

    const audio = new Audio(audioUrl);
    audio.playbackRate = getVoicePlaybackRate();
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      if (isFinite(audio.duration) && audio.duration > 0) {
        setAudioDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      releasePlaybackRef.current?.();
      releasePlaybackRef.current = null;
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.pause();
      releasePlaybackRef.current?.();
      releasePlaybackRef.current = null;
      audioRef.current = null;
    };
  }, [audioUrl]);

  // 用 requestAnimationFrame 更新播放进度
  const updateProgress = useCallback(function updateProgressFn() {
    const audio = audioRef.current;
    if (audio && isPlaying) {
      setCurrentTime(audio.currentTime);
      rafRef.current = requestAnimationFrame(updateProgressFn);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      rafRef.current = requestAnimationFrame(updateProgress);
    } else if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isPlaying, updateProgress]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      releasePlaybackRef.current?.();
      releasePlaybackRef.current = null;
    } else {
      setPlayError(false);
      setUnread(false);
      try { localStorage.setItem(`qm_voice_played_${messageId}`, "1"); } catch {}
      audio.playbackRate = playbackRate;
      const stopThis = () => {
        audio.pause();
        setIsPlaying(false);
      };
      releasePlaybackRef.current?.();
      releasePlaybackRef.current = claimVoicePlayback(stopThis);
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setIsPlaying(false);
        setPlayError(true);
        releasePlaybackRef.current?.();
        releasePlaybackRef.current = null;
      });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // 加载中状态
  if (!audioUrl) {
    return (
      <div className="flex items-center gap-2 text-white/80 text-xs py-1">
        <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
          <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
        <span>语音加载中…</span>
      </div>
    );
  }

  const progress = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;

  return (
    <div className="w-full">
      {/* 播放控制条 */}
      <div className="flex items-center gap-1.5 min-w-[180px]">
        {/* 播放/暂停按钮 */}
        <button
          type="button"
          onClick={togglePlay}
          className="w-8 h-8 rounded-full bg-white/25 hover:bg-white/35 flex items-center justify-center flex-shrink-0 transition-colors"
          aria-label={isPlaying ? "暂停" : "播放"}
        >
          {isPlaying ? (
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
        {unread && <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" aria-label="未播放" />}
        <button
          type="button"
          onClick={() => {
            const next = toggleVoicePlaybackRate(playbackRate);
            setPlaybackRateState(next);
            if (audioRef.current) audioRef.current.playbackRate = next;
          }}
          className="text-[11px] text-white/80 flex-shrink-0"
          aria-label="切换播放倍速"
        >
          {playbackRate}x
        </button>

        {/* 进度条 */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <div className="flex-1 relative h-1.5 group">
            <div className="absolute inset-0 bg-white/25 rounded-full" />
            <div
              className="absolute left-0 top-0 h-full bg-white/70 rounded-full transition-[width] duration-75"
              style={{ width: `${progress}%` }}
            />
            <input
              type="range"
              min={0}
              max={audioDuration || duration}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              aria-label="播放进度"
            />
          </div>

          {/* 时间显示 */}
          <span className="text-[11px] text-white/80 tabular-nums flex-shrink-0">
            {formatTime(currentTime)} / {formatTime(audioDuration || duration)}
          </span>
        </div>
      </div>

      {playError && (
        <button
          type="button"
          onClick={togglePlay}
          className="mt-1 text-[11px] text-white/80 underline"
        >
          播放失败，点此重试
        </button>
      )}

      {transcriptStatus === "pending" && (
        <div className="mt-1 text-[11px] text-white/70">转写中…</div>
      )}
      {transcriptStatus === "error" && (
        <button type="button" onClick={onRetryTranscript} className="mt-1 text-[11px] text-white/80 underline">
          {transcriptError || "转写失败，点击重试"}
        </button>
      )}

      {/* 转写文字（默认折叠） */}
      {transcript && transcriptStatus !== "pending" && (
        <div className="mt-2 pt-2 border-t border-white/20">
          {showTranscript ? (
            <div>
              <p className="text-xs text-white/90 leading-relaxed whitespace-pre-wrap break-words">
                {transcript}
              </p>
              <button
                type="button"
                onClick={() => setShowTranscript(false)}
                className="text-[11px] text-white/60 hover:text-white/80 mt-1 transition-colors"
              >
                收起文字
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowTranscript(true)}
              className="text-[11px] text-white/60 hover:text-white/80 transition-colors"
            >
              显示文字
            </button>
          )}
        </div>
      )}
    </div>
  );
}
