"use client";
import { useEffect, useRef, useState } from "react";
import { getAudio } from "@/lib/voice/audio-store";
import { claimVoicePlayback } from "@/lib/voice/playback-coordinator";
import { Icon, Wave } from "./icons";
export function UserAudioBar({
  messageId,
  seconds,
  hasAudio,
  volatileBlob,
}: {
  messageId: string;
  seconds: number;
  hasAudio: boolean;
  volatileBlob?: Blob;
}) {
  const alive = useRef(true);
  const ref = useRef<HTMLAudioElement | null>(null);
  const release = useRef<(() => void) | null>(null);
  const [playing, setPlaying] = useState(false);
  const [notice, setNotice] = useState("");
  const lock = useRef(false);
  const attempt = useRef(0);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      attempt.current++;
      lock.current = false;
      ref.current?.pause();
      if (ref.current) {
        ref.current.onended = null;
        ref.current.onerror = null;
        URL.revokeObjectURL(ref.current.src);
      }
      ref.current = null;
      release.current?.();
      release.current = null;
    };
  }, []);
  async function toggle() {
    if (lock.current) return;
    lock.current = true;
    const currentAttempt = ++attempt.current;
    let audio: HTMLAudioElement | null = null;
    let ownedRelease: (() => void) | null = null;
    const releaseOwned = () => {
      ownedRelease?.();
      if (release.current === ownedRelease) release.current = null;
    };
    const failPlayback = () => {
      if (!alive.current || attempt.current !== currentAttempt) return;
      if (audio && ref.current === audio) {
        audio.onended = null;
        audio.onerror = null;
        audio.pause();
        URL.revokeObjectURL(audio.src);
        ref.current = null;
      }
      releaseOwned();
      setPlaying(false);
      setNotice("录音播放失败，请重试。");
    };
    try {
      if (playing) {
        ref.current?.pause();
        release.current?.();
        release.current = null;
        setPlaying(false);
        return;
      }
      release.current?.();
      // Claim at the click, before the asynchronous read. A late read must not
      // take playback away from a newer user action.
      ownedRelease = claimVoicePlayback(() => {
        if (attempt.current !== currentAttempt) return;
        attempt.current++;
        lock.current = false;
        ref.current?.pause();
        if (alive.current) setPlaying(false);
      });
      release.current = ownedRelease;
      audio = ref.current;
      if (!audio) {
        const blob = volatileBlob || (await getAudio(messageId));
        if (!alive.current || attempt.current !== currentAttempt) return;
        if (!blob) {
          releaseOwned();
          setNotice("本地录音不可用，文字仍可查看。");
          return;
        }
        audio = new Audio(URL.createObjectURL(blob));
        ref.current = audio;
      }
      audio.onended = () => {
        if (!alive.current || attempt.current !== currentAttempt) return;
        setPlaying(false);
        releaseOwned();
      };
      audio.onerror = failPlayback;
      await audio.play();
      if (!alive.current || attempt.current !== currentAttempt) return;
      setPlaying(true);
      setNotice("");
    } catch {
      failPlayback();
    } finally {
      if (attempt.current === currentAttempt) lock.current = false;
    }
  }
  if (!hasAudio && !volatileBlob) {
    return <div className="chat-error" role="status">原录音未保存，当前无法播放；转写文字仍可查看。</div>;
  }
  return (
    <>
      <div className="chat-audio">
        <span className="chat-speaker">
          <Icon name="speaker" />
        </span>
        <Wave />
        <span>{Math.max(1, Math.round(seconds))}秒</span>
        <button
          type="button"
          aria-label={playing ? "暂停语音" : "播放语音"}
          onClick={() => void toggle()}
        >
          <Icon name={playing ? "pause" : "play"} />
        </button>
      </div>
      {notice && (
        <div className="chat-error" role="status">
          {notice}
        </div>
      )}
    </>
  );
}
