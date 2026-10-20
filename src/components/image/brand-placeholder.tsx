/**
 * QmBrandPlaceholder v2.0
 * 品牌占位组件 — 当无真实授权图片时使用
 *
 * 设计原则：
 * - 纯 CSS + 内联 SVG，零外部依赖
 * - 基于 Aurora Mind 色彩系统：极浅品牌色背景 + 抽象几何 aura
 * - 不生成假人、不暗示真实人物
 * - 不同 module 有不同色调变体
 * - 保持 aspect ratio，可控制尺寸
 * - 装饰图语义：明确传达"此区域为图片占位"
 */

import { cn } from "@/lib/utils";
import { ModuleColorRole } from "@/lib/image/types";

interface BrandPlaceholderProps {
  /** 宽高比，如 "16:9" / "4:5" / "1:1" / "3:4" */
  aspectRatio?: string;
  /** 模块 — 决定色调 */
  module?: string;
  /** 覆盖色彩角色 */
  colorRole?: ModuleColorRole;
  /** 尺寸类型 */
  size?: "hero" | "card" | "portrait" | "icon";
  /** 额外 className */
  className?: string;
  /** 占位文字（默认不显示文字，避免假内容） */
  label?: string;
}

// 模块 → 色彩角色映射（与 prompt-schema 中一致，本地复制避免循环依赖）
const MODULE_ROLE: Record<string, ModuleColorRole> = {
  xiaoku: ModuleColorRole.HUMAN_CONNECTION,
  tools: ModuleColorRole.HUMAN_CONNECTION,
  xiaoxue: ModuleColorRole.TECH_FOCUS,
  assessment: ModuleColorRole.TECH_FOCUS,
  treehole: ModuleColorRole.DEEP_MIND,
  knowledge: ModuleColorRole.EDITORIAL,
  home: ModuleColorRole.BRAND_DEFAULT,
  booking: ModuleColorRole.BRAND_DEFAULT,
  about: ModuleColorRole.BRAND_DEFAULT,
  therapists: ModuleColorRole.BRAND_DEFAULT,
  fee: ModuleColorRole.BRAND_DEFAULT,
  contact: ModuleColorRole.BRAND_DEFAULT,
};

function getRoleStyles(role: ModuleColorRole) {
  switch (role) {
    case ModuleColorRole.HUMAN_CONNECTION:
      return {
        bg: "bg-gradient-to-br from-[#FBEAF0] via-[#F8F5FC] to-[#FFF4DA]",
        aura1: "#D0648E",
        aura2: "#6B4C9A",
        aura3: "#C78726",
        stroke: "#B84F78",
        ink: "#4D3373",
      };
    case ModuleColorRole.TECH_FOCUS:
      return {
        bg: "bg-gradient-to-br from-[#E8EAFE] via-[#F0EBF3] to-[#E4F7FB]",
        aura1: "#6670E8",
        aura2: "#36A4BE",
        aura3: "#6B4C9A",
        stroke: "#5158C9",
        ink: "#3F46A8",
      };
    case ModuleColorRole.DEEP_MIND:
      return {
        bg: "bg-gradient-to-br from-[#342050] via-[#4D3373] to-[#293A63]",
        aura1: "#7D5CB2",
        aura2: "#6670E8",
        aura3: "#36A4BE",
        stroke: "#9A7AC8",
        ink: "#D8C9EC",
      };
    case ModuleColorRole.EDITORIAL:
      return {
        bg: "bg-gradient-to-br from-[#F9F7FA] via-[#F4F1F5] to-[#F8F5FC]",
        aura1: "#6B4C9A",
        aura2: "#807886",
        aura3: "#B8A0DB",
        stroke: "#625B68",
        ink: "#46404B",
      };
    case ModuleColorRole.BRAND_DEFAULT:
    default:
      return {
        bg: "bg-gradient-to-br from-[#F8F5FC] via-[#EEE7F7] to-[#E8EAFE]",
        aura1: "#6B4C9A",
        aura2: "#9A7AC8",
        aura3: "#6670E8",
        stroke: "#7D5CB2",
        ink: "#4D3373",
      };
  }
}

export function BrandPlaceholder({
  aspectRatio = "16:9",
  module = "home",
  colorRole,
  size = "hero",
  className,
  label,
}: BrandPlaceholderProps) {
  const role = colorRole ?? MODULE_ROLE[module] ?? ModuleColorRole.BRAND_DEFAULT;
  const styles = getRoleStyles(role);

  // 解析宽高比
  const [w, h] = aspectRatio.split(":").map(Number);
  const aspectStyle = { aspectRatio: `${w} / ${h}` };

  // 尺寸对应的 aura 强度
  const auraOpacity = {
    hero: 0.18,
    card: 0.22,
    portrait: 0.2,
    icon: 0.25,
  }[size];

  const isDeep = role === ModuleColorRole.DEEP_MIND;

  return (
    <div
      role="img"
      aria-label={label || "图片占位"}
      data-placeholder="brand"
      className={cn(
        "relative w-full overflow-hidden",
        styles.bg,
        className,
      )}
      style={aspectStyle}
    >
      {/* 抽象几何 aura — 纯 SVG，无外部依赖 */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 400 225"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <radialGradient id="aura1" cx="30%" cy="35%" r="45%">
            <stop offset="0%" stopColor={styles.aura1} stopOpacity={auraOpacity} />
            <stop offset="100%" stopColor={styles.aura1} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="aura2" cx="75%" cy="65%" r="50%">
            <stop offset="0%" stopColor={styles.aura2} stopOpacity={auraOpacity * 0.8} />
            <stop offset="100%" stopColor={styles.aura2} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="aura3" cx="60%" cy="25%" r="30%">
            <stop offset="0%" stopColor={styles.aura3} stopOpacity={auraOpacity * 0.6} />
            <stop offset="100%" stopColor={styles.aura3} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="400" height="225" fill="url(#aura1)" />
        <rect width="400" height="225" fill="url(#aura2)" />
        <rect width="400" height="225" fill="url(#aura3)" />
        {/* 极简几何线 — 品牌符号感，不暗示人物 */}
        <g
          stroke={styles.stroke}
          strokeWidth="0.8"
          fill="none"
          opacity={isDeep ? 0.25 : 0.15}
        >
          <circle cx="320" cy="180" r="60" />
          <circle cx="320" cy="180" r="40" />
          <line x1="50" y1="50" x2="120" y2="50" />
          <line x1="50" y1="65" x2="90" y2="65" />
          <line x1="50" y1="80" x2="100" y2="80" />
        </g>
      </svg>

      {/* 中心标识 — 极简图形，不使用 emoji */}
      {size !== "icon" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            width="48"
            height="48"
            viewBox="0 0 48 48"
            fill="none"
            aria-hidden="true"
            focusable="false"
          >
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke={styles.ink}
              strokeWidth="1.5"
              opacity={isDeep ? 0.4 : 0.2}
            />
            <circle
              cx="24"
              cy="24"
              r="12"
              stroke={styles.ink}
              strokeWidth="1.5"
              opacity={isDeep ? 0.5 : 0.25}
            />
            <circle
              cx="24"
              cy="24"
              r="4"
              fill={styles.ink}
              opacity={isDeep ? 0.6 : 0.3}
            />
          </svg>
        </div>
      )}
    </div>
  );
}
