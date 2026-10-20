"use client";

import { useState } from "react";
import {
  derivedPhotoUrl,
  motherPhotoUrl,
  type TherapistPhotoContext,
} from "@/lib/therapist-photos";

type LoadStep = "derived" | "mother" | "initial";

/**
 * 四端派生取景图（方形头肩半身取景，GPT 已批准）。
 * 加载契约（07_图片加载高DPR与无障碍）：
 *   派生图 → 失败回退母图（object-contain 母图保护，唯一允许 contain 的场景）
 *          → 再失败 → 首字占位。
 * 加载中：品牌渐变骨架；桌面/移动按 (min-width:768px) 自动切换取景版本。
 */
export default function TherapistPhoto({
  slug,
  name,
  enName,
  ctx,
  className = "",
  eager = false,
}: {
  slug: string;
  name: string;
  enName?: string;
  ctx: TherapistPhotoContext;
  className?: string;
  eager?: boolean;
}) {
  const [step, setStep] = useState<LoadStep>("derived");
  const [loaded, setLoaded] = useState(false);

  const desktopCtx: TherapistPhotoContext =
    ctx === "list_mobile" ? "list_desktop" : "detail_desktop";
  const mobileCtx: TherapistPhotoContext =
    ctx === "list_desktop" ? "list_mobile" : "detail_mobile";

  const desktopSrc = derivedPhotoUrl(slug, desktopCtx);
  const mobileSrc = derivedPhotoUrl(slug, mobileCtx);
  const motherSrc = motherPhotoUrl(slug);
  const initials = (name || "?").slice(0, 1);
  const alt = enName ? `${name} ${enName} 照片` : `${name} 照片`;

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br from-[#FBEEDC] via-[#F7E1D8] to-[#F1D7DE] ${className}`}
    >
      {step !== "initial" ? (
        <>
          <picture>
            <source media="(min-width: 768px)" srcSet={desktopSrc} />
            <img
              src={step === "mother" ? motherSrc : mobileSrc}
              alt={alt}
              width={480}
              height={480}
              loading={eager ? "eager" : "lazy"}
              decoding="async"
              onLoad={() => setLoaded(true)}
              onError={() => {
                setLoaded(false);
                setStep((s) => (s === "derived" ? "mother" : "initial"));
              }}
              className={`h-full w-full ${
                step === "mother" ? "object-contain" : "object-cover"
              } transition-opacity duration-500 ${
                loaded ? "opacity-100" : "opacity-0"
              }`}
            />
          </picture>
          {!loaded && (
            <div
              aria-hidden="true"
              className="absolute inset-0 animate-pulse bg-gradient-to-br from-[#FBEEDC] via-[#F7E1D8] to-[#F1D7DE]"
            />
          )}
        </>
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <span className="font-qm-serif text-4xl font-bold text-[#B98A5E]">
            {initials}
          </span>
        </div>
      )}
    </div>
  );
}
