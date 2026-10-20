"use client";

/**
 * QmImage v2.0
 * 核心图片组件 — 封装 next/image，支持 QM 全站图片治理规则
 *
 * 特性：
 * - Desktop / Mobile 独立 src，响应式切换
 * - priority（LCP 图）/ loading="lazy"（非首屏）自动处理
 * - rights_status !== CLEARED 或 src 为空时，自动显示 BrandPlaceholder
 * - 强制 alt 文本规则：装饰图 alt=""，否则必须提供
 * - 明确 width/height 避免 CLS
 * - 不叠加会改变肤色的 overlay
 * - 开发环境下性能预算警告
 */

import { useState, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  AssetType,
  RightsStatus,
  QmImageProps,
  ModuleColorRole,
} from "@/lib/image/types";
import { BrandPlaceholder } from "./brand-placeholder";

export interface QmImageComponentProps extends Partial<QmImageProps> {
  /** 资产 ID — 传入时从注册表读取（可选，也可直接传 props） */
  assetId?: string;
  /** 是否为 LCP 图（设为 true 时 priority，不 lazy） */
  priority?: boolean;
  /** 额外 className — 作用于外层容器 */
  className?: string;
  /** 图片 className — 作用于 next/image 本身 */
  imgClassName?: string;
  /** next/image sizes */
  sizes?: string;
  /** 图片质量 1-100 */
  quality?: number;
  /** 覆盖是否显示占位（调试用） */
  forcePlaceholder?: boolean;
}

/**
 * 判断是否应该显示真实图片
 * - rights_status 必须为 CLEARED
 * - 必须有对应的 src
 */
function shouldShowReal(
  rightsStatus: RightsStatus | undefined,
  srcDesktop?: string,
  srcMobile?: string,
  isMobile?: boolean,
): boolean {
  if (rightsStatus !== RightsStatus.CLEARED) return false;
  const src = isMobile ? srcMobile || srcDesktop : srcDesktop;
  return !!src && src.trim().length > 0;
}

export function QmImage({
  assetId,
  className,
  imgClassName,
  priority = false,
  sizes = "100vw",
  quality = 75,
  forcePlaceholder = false,
  width,
  height,
  aspect_ratio: aspectRatio = "16:9",
  alt_zh_hans: altProp = "",
  decorative = false,
  asset_type = AssetType.A4_ABSTRACT_AURA,
  module = "home",
  rights_status: rightsStatus = RightsStatus.PENDING,
  src_desktop: srcDesktop,
  src_mobile: srcMobile,
  target_kb: targetKb,
  placeholder_color: placeholderColor,
}: QmImageComponentProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [hasError, setHasError] = useState(false);

  // 检测视口宽度（仅客户端）
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // 确定当前设备的 src
  const currentSrc = isMobile
    ? srcMobile || srcDesktop
    : srcDesktop || srcMobile;

  // 是否显示真实图片
  const showReal =
    !forcePlaceholder &&
    !hasError &&
    shouldShowReal(rightsStatus, srcDesktop, srcMobile, isMobile);

  // alt 文本：装饰图强制空；否则取传入值
  const altText = decorative ? "" : altProp;

  // 解析宽高比
  const [aw, ah] = aspectRatio.split(":").map(Number);
  const aspectStyle = width && height
    ? undefined
    : { aspectRatio: `${aw} / ${ah}` };

  // 确定尺寸：优先使用明确的 width/height，否则按比例估算
  const computedW = width ?? 1200;
  const computedH = height ?? Math.round(1200 * ah / aw);

  // 开发环境性能预算检查
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    if (!showReal || !targetKb) return;
    // 仅作 console 提示，不阻断渲染
    console.warn( `[QmImage] ${assetId || "unknown"}: 目标文件大小 ${targetKb}KB。` +
        "上线前请使用 Lighthouse / PageSpeed Insights 验证实际加载大小。",
    );
  }, [showReal, targetKb, assetId]);

  // 图片加载错误 → 降级为占位
  const handleError = () => {
    setHasError(true);
    if (process.env.NODE_ENV !== "production") {
      console.error(`[QmImage] ${assetId || "unknown"}: 图片加载失败，已降级为品牌占位。`);
    }
  };

  return (
    <div
      className={cn("relative w-full overflow-hidden", className)}
      style={aspectStyle}
      data-asset-id={assetId}
      data-asset-type={asset_type}
      data-rights-status={rightsStatus}
    >
      {showReal && currentSrc ? (
        <Image
          src={currentSrc}
          alt={altText}
          width={computedW}
          height={computedH}
          priority={priority}
          loading={priority ? "eager" : "lazy"}
          sizes={sizes}
          quality={quality}
          className={cn("w-full h-full object-cover", imgClassName)}
          style={{ objectPosition: "center center" }}
          onError={handleError}
        />
      ) : (
        <BrandPlaceholder
          aspectRatio={aspectRatio}
          module={module}
          colorRole={module ? undefined : ModuleColorRole.BRAND_DEFAULT}
          size={computedW > 600 ? "hero" : "card"}
          className={imgClassName}
        />
      )}

      {/* 占位色背景（用于加载过渡，不叠加在肤色上） */}
      {showReal && placeholderColor && (
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10"
          style={{ backgroundColor: placeholderColor }}
        />
      )}
    </div>
  );
}
