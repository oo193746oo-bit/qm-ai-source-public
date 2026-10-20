"use client";

/**
 * SectionVisual v2.0
 * 模块级视觉容器 — 统一管理页面视觉层级
 *
 * 视觉分级：
 * - L0 无图 — 信息清晰优先
 * - L1 微视觉 — 小图标 / 装饰线
 * - L2 模块视觉 — 模块级配图
 * - L3 叙事视觉 / Hero — 同一屏最多一个
 *
 * 自动降级：
 * - 图片纯装饰且影响阅读/性能 → L0
 * - 小屏幕且内容优先 → 自动降级
 */

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { VisualLevel, ModuleColorRole } from "@/lib/image/types";
import { QmImage } from "./qm-image";
import { BrandPlaceholder } from "./brand-placeholder";

interface SectionVisualProps {
  /** 视觉级别 */
  level?: VisualLevel;
  /** 模块名 */
  module?: string;
  /** 资产 ID（L2/L3 使用） */
  assetId?: string;
  /** Desktop 图片 src */
  srcDesktop?: string;
  /** Mobile 图片 src */
  srcMobile?: string;
  /** 宽高比 */
  aspectRatio?: string;
  /** alt 文本 */
  alt?: string;
  /** 是否装饰图 */
  decorative?: boolean;
  /** 是否为 LCP 图（L3 Hero 通常为 true） */
  priority?: boolean;
  /** 内容 — 叠加在视觉上的文字等 */
  children?: ReactNode;
  /** 外层 className */
  className?: string;
  /** 文字安全区内边距（覆盖默认） */
  safeAreaClassName?: string;
  /** 是否强制显示（禁用自动降级，调试用） */
  forceShow?: boolean;
}

/**
 * 安全区 class 映射 — 根据级别确定内容位置
 * L3 通常左侧留 40-55% 文字安全区（桌面端）
 */
function getSafeAreaClass(level: VisualLevel, module?: string): string {
  switch (level) {
    case VisualLevel.L3:
      // Hero 级：左侧大安全区，右侧图片主体
      return "md:pr-[45%] md:pl-8 pl-6 pr-6 pt-12 pb-12";
    case VisualLevel.L2:
      return "p-6 md:p-8";
    case VisualLevel.L1:
      return "p-4";
    case VisualLevel.L0:
    default:
      return "";
  }
}

export function SectionVisual({
  level = VisualLevel.L0,
  module = "home",
  assetId,
  srcDesktop,
  srcMobile,
  aspectRatio = "16:9",
  alt = "",
  decorative = false,
  priority = false,
  children,
  className,
  safeAreaClassName,
  forceShow = false,
}: SectionVisualProps) {
  // L0：无图
  if (level === VisualLevel.L0 && !forceShow) {
    if (!children) return null;
    return <div className={className}>{children}</div>;
  }

  // L1：微视觉 — 纯装饰线条 / 色块
  if (level === VisualLevel.L1) {
    return (
      <div
        className={cn(
          "relative w-full",
          className,
        )}
        aria-hidden={decorative}
      >
        <div
          className={cn(
            "h-1 w-16 rounded-full bg-gradient-to-r from-[#6B4C9A] to-[#6670E8]",
            module === "treehole" && "from-[#4D3373] to-[#5158C9]",
            module === "xiaoku" && "from-[#D0648E] to-[#6B4C9A]",
            module === "assessment" && "from-[#5158C9] to-[#36A4BE]",
          )}
        />
        {children && (
          <div className={cn("mt-4", safeAreaClassName)}>
            {children}
          </div>
        )}
      </div>
    );
  }

  // L2 / L3：有图
  const isHero = level === VisualLevel.L3;

  return (
    <section
      className={cn(
        "relative w-full overflow-hidden rounded-[20px]",
        isHero && "md:rounded-[28px]",
        className,
      )}
      data-visual-level={level}
      data-module={module}
    >
      {/* 图片层 */}
      <div className="absolute inset-0">
        {assetId ? (
          <QmImage
            assetId={assetId}
            priority={priority}
            className="w-full h-full"
            imgClassName="w-full h-full object-cover"
          />
        ) : (
          <BrandPlaceholder
            aspectRatio={aspectRatio}
            module={module}
            size={isHero ? "hero" : "card"}
            className="w-full h-full"
          />
        )}

        {/* 文字可读性 overlay — 只保证文字可读，不染肤色
            注意：只在有文字内容时添加，且使用暗/亮方向的渐变，
            不使用紫色 overlay 覆盖整个图片 */}
        {children && (
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, rgba(25,22,29,0.45) 0%, rgba(25,22,29,0.15) 40%, rgba(25,22,29,0) 70%)",
            }}
            aria-hidden="true"
          />
        )}
      </div>

      {/* 内容层 — 文字安全区 */}
      {children && (
        <div className={cn("relative z-10", getSafeAreaClass(level, module), safeAreaClassName)}>
          {children}
        </div>
      )}
    </section>
  );
}
