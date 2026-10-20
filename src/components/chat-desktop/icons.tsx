import Image from "next/image";
import type { ReactNode } from "react";
export function Icon({
  name,
}: {
  name:
    | "mic"
    | "smile"
    | "plus"
    | "play"
    | "pause"
    | "speaker"
    | "history"
    | "more"
    | "keyboard"
    | "arrow"
    | "photo"
    | "erase";
}) {
  const paths: Record<string, ReactNode> = {
    mic: (
      <>
        <rect x="9" y="3" width="6" height="11" rx="3" />
        <path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8" />
      </>
    ),
    smile: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M8 14q4 5 8 0M8 9h.01M16 9h.01" />
      </>
    ),
    erase: <path d="M9 4h12v16H9L2 12zM12 8l5 8M17 8l-5 8" />,
    plus: <path d="M12 4v16M4 12h16" />,
    play: <path d="m9 5 10 7-10 7z" />,
    pause: <path d="M9 5v14M15 5v14" />,
    speaker: <path d="M5 10h3l4-4v12l-4-4H5zM16 8q4 4 0 8M19 5q7 7 0 14" />,
    history: <path d="M6 3h8l4 4v14H6zM14 3v5h4M9 12h6M9 16h6" />,
    more: (
      <>
        <circle cx="5" cy="12" r="1" />
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
      </>
    ),
    keyboard: (
      <>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M5 9h1m3 0h1m3 0h1m3 0h1M5 12h1m3 0h1m3 0h1m3 0h1M6 16h12" />
      </>
    ),
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    photo: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8" cy="8" r="1" />
        <path d="m3 17 6-6 5 5 3-3 4 4" />
      </>
    ),
  };
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={name === "arrow" ? "1.6" : "1.7"}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
export const waveHeights = [
  7, 14, 22, 11, 28, 16, 30, 20, 12, 24, 18, 9, 21, 14, 23, 16, 8, 13, 18, 11,
  7, 12, 6, 9,
];
export function Wave() {
  return (
    <div className="chat-wave" aria-hidden="true">
      {waveHeights.map((h, i) => (
        <i key={i} style={{ height: h }} />
      ))}
    </div>
  );
}
export const AVATAR =
  "/visual/chat-desktop/c5c9a9638fb2be2456294dc02d3ecd0295aaf0a15cb161f0a0824aa33b2b27a2.png";
export function Avatar({ hidden = false }: { hidden?: boolean }) {
  return (
    <div className="chat-avatar" aria-hidden={hidden || undefined}>
      <Image
        unoptimized
        loading="eager"
        decoding="sync"
        src={AVATAR}
        width={1080}
        height={1457}
        alt={hidden ? "" : "小酷"}
      />
    </div>
  );
}
