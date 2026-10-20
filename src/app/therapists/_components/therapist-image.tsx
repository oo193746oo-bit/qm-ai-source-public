"use client";

import { useState } from "react";

/**
 * v3.1 心理师派生图组件：
 * - <picture> 按 ≤767px 切换 mobile 派生图，desktop 为默认源；
 *   四场景（list_desktop/list_mobile/detail_desktop/detail_mobile）各用独立派生图，禁止互借；
 * - 加载失败进入 is-error 状态，保留姓名占位，不换人、不静默替换；
 * - 全程 cover，禁 contain、禁母图（由 resolver 与扫描双闸兜底）。
 */
export function TherapistImage({
  desktop,
  mobile,
  alt,
  name,
  priority = false,
  objectPositionPct,
}: {
  desktop: string;
  mobile: string;
  alt: string;
  name: string;
  priority?: boolean;
  objectPositionPct?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="therapist-photo-fallback is-error" role="img" aria-label={alt}>
        <span>{name}</span>
      </div>
    );
  }

  return (
    <picture>
      <source media="(max-width: 767px)" srcSet={mobile} />
      <img
        src={desktop}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        style={objectPositionPct ? { objectPosition: objectPositionPct } : undefined}
        onError={() => setFailed(true)}
      />
    </picture>
  );
}
