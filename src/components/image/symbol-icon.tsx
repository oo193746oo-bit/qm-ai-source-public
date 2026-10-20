/**
 * QmSymbolIcon v2.0
 * 统一 SVG 符号系统 — A5 类资产
 *
 * 设计原则：
 * - 使用 currentColor，与 Aurora Mind 色彩系统配合
 * - 统一 strokeWidth: 1.5
 * - 线性 / 几何风格，不写实、不拟物
 * - 不使用 emoji 替代
 * - 尺寸支持：16 / 20 / 24 / 32 / 48
 *
 * 图标列表（20 个）：
 *  1. assessment  测评
 *  2. tool        工具
 *  3. knowledge   知识库
 *  4. booking     预约
 *  5. treehole    树洞
 *  6. chat        对话
 *  7. breath      呼吸
 *  8. ground      接地
 *  9. compass     指南
 * 10. shield      安全
 * 11. heart       心
 * 12. mind        脑
 * 13. book        书
 * 14. calendar    日历
 * 15. message     消息
 * 16. spark       灵感
 * 17. growth      成长
 * 18. boundary    边界
 * 19. crisis      危机
 * 20. faq         帮助
 */

import type { JSX } from "react";
import { cn } from "@/lib/utils";

export type SymbolIconName =
  | "assessment"
  | "tool"
  | "knowledge"
  | "booking"
  | "treehole"
  | "chat"
  | "breath"
  | "ground"
  | "compass"
  | "shield"
  | "heart"
  | "mind"
  | "book"
  | "calendar"
  | "message"
  | "spark"
  | "growth"
  | "boundary"
  | "crisis"
  | "faq";

export type SymbolIconSize = 16 | 20 | 24 | 32 | 48;

interface SymbolIconProps {
  /** 图标名称 */
  name: SymbolIconName;
  /** 尺寸：16 / 20 / 24 / 32 / 48 */
  size?: SymbolIconSize;
  /** 自定义 className */
  className?: string;
  /** stroke 宽度（默认 1.5） */
  strokeWidth?: number;
  /** 无障碍标签（装饰图标不传） */
  ariaLabel?: string;
}

// ─── 图标路径定义 ──────────────────────────────────────────────
// 所有图标 viewBox 均为 24x24，使用 currentColor

const ICON_PATHS: Record<SymbolIconName, React.ReactElement> = {
  // 1. assessment — 测评（量表 + 指针）
  assessment: (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16v4H4z" />
      <path d="M4 10h10v4H4z" />
      <path d="M4 16h7v4H4z" />
      <circle cx="18" cy="16" r="4" />
      <path d="M18 16l2 2" />
    </g>
  ),

  // 2. tool — 工具（扳手 + 齿轮感）
  tool: (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.3 2.3-2.4-2.4 2.3-2.3z" />
    </g>
  ),

  // 3. knowledge — 知识库（打开的书）
  knowledge: (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H12v20H6.5A2.5 2.5 0 0 1 4 19.5v-15z" />
      <path d="M20 4.5A2.5 2.5 0 0 0 17.5 2H12v20h5.5A2.5 2.5 0 0 0 20 19.5v-15z" />
    </g>
  ),

  // 4. booking — 预约（日历 + 勾选）
  booking: (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4.5" width="18" height="16.5" rx="2" />
      <path d="M16 3v4M8 3v4M3 9h18" />
      <path d="M8.5 14l2.5 2.5 4.5-5" />
    </g>
  ),

  // 5. treehole — 树洞（树洞轮廓 + 纸飞机）
  treehole: (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2c-3 0-5 2.5-5 6 0 2 .5 3.5 1.5 5-1 1-1.5 2.5-1.5 4 0 2.5 2 5 5 5s5-2.5 5-5c0-1.5-.5-3-1.5-4 1-1.5 1.5-3 1.5-5 0-3.5-2-6-5-6z" />
      <path d="M12 9l5 1-3.5 3.5L13.5 17 12 16l-1.5 1L10.5 13.5 7 10l5-1z" />
    </g>
  ),

  // 6. chat — 对话（气泡）
  chat: (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a8 8 0 0 1-11.3 7.3L4 21l1.7-5.7A8 8 0 1 1 21 12z" />
    </g>
  ),

  // 7. breath — 呼吸（同心圆 + 节奏）
  breath: (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5.5" />
      <circle cx="12" cy="12" r="2" />
    </g>
  ),

  // 8. ground — 接地（根系 + 大地）
  ground: (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v9" />
      <path d="M6 21c0-3 2.5-5 6-5s6 2 6 5" />
      <path d="M12 12l-3-3M12 12l3-3" />
      <path d="M9 21v-2M15 21v-2M12 21v-4" />
    </g>
  ),

  // 9. compass — 指南（指南针）
  compass: (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <polygon points="12,4 14,12 12,20 10,12" transform="rotate(20 12 12)" />
    </g>
  ),

  // 10. shield — 安全（盾牌 + 勾）
  shield: (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l8 3v6c0 4.5-3.5 8-8 9-4.5-1-8-4.5-8-9V6l8-3z" />
      <path d="M8.5 12l2.5 2.5 4.5-5" />
    </g>
  ),

  // 11. heart — 心（心形）
  heart: (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20s-7-4.5-7-10a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 19 10c0 5.5-7 10-7 10z" />
    </g>
  ),

  // 12. mind — 脑（抽象脑轮廓）
  mind: (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3.5c-3 0-5 2.5-5 5.5 0 1.5.5 2.5 1 3.5-.5 1-1 2-1 3 0 3 2.5 5.5 6 5.5 1 0 2-.3 3-.8 1 .5 2 .8 3 .8 3.5 0 6-2.5 6-5.5 0-1-.5-2-1-3 .5-1 1-2 1-3.5 0-3-2-5.5-5-5.5-1.5 0-3 .5-4 1.5-1-1-2.5-1.5-4-1.5z" />
      <path d="M12 7v5l3 2" />
    </g>
  ),

  // 13. book — 书（合上的书）
  book: (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H12v20H6.5A2.5 2.5 0 0 1 4 19.5v-15z" />
      <path d="M20 4.5A2.5 2.5 0 0 0 17.5 2H12v20h5.5A2.5 2.5 0 0 0 20 19.5v-15z" />
      <path d="M7.5 7h3M7.5 11h3" />
    </g>
  ),

  // 14. calendar — 日历
  calendar: (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4.5" width="18" height="16.5" rx="2" />
      <path d="M16 3v4M8 3v4M3 9h18" />
      <circle cx="8" cy="14" r="1" fill="currentColor" />
      <circle cx="12" cy="14" r="1" fill="currentColor" />
      <circle cx="16" cy="14" r="1" fill="currentColor" />
    </g>
  ),

  // 15. message — 消息（信封）
  message: (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </g>
  ),

  // 16. spark — 灵感（火花 / 星芒）
  spark: (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />
    </g>
  ),

  // 17. growth — 成长（新芽 + 上升曲线）
  growth: (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20c3-8 7-12 12-12" />
      <path d="M16 6l-2-2 2-2 2 2-2 2z" />
      <path d="M7 16c0-2 1.5-3 3-3s3 1 3 3" />
      <path d="M10 16v4" />
    </g>
  ),

  // 18. boundary — 边界（界限 / 分隔）
  boundary: (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <circle cx="12" cy="12" r="4" strokeDasharray="2 2" />
    </g>
  ),

  // 19. crisis — 危机（警示三角 + 生命线）
  crisis: (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3.5l10 17H2L12 3.5z" />
      <path d="M12 9v5M12 16.5v.5" />
    </g>
  ),

  // 20. faq — 帮助（问号 + 对话框）
  faq: (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="11" r="8" />
      <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.2c-.8.4-1 .9-1 1.8" />
      <circle cx="12" cy="16" r="0.8" fill="currentColor" />
    </g>
  ),
};

// ─── 组件 ──────────────────────────────────────────────────────

export function SymbolIcon({
  name,
  size = 20,
  className,
  strokeWidth = 1.5,
  ariaLabel,
}: SymbolIconProps) {
  const isDecorative = !ariaLabel;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      className={cn("flex-shrink-0", className)}
      aria-label={ariaLabel}
      aria-hidden={isDecorative}
      focusable="false"
      role={ariaLabel ? "img" : undefined}
    >
      {ICON_PATHS[name]}
    </svg>
  );
}

// ─── 图标清单（方便动态遍历） ──────────────────────────────────
export const ALL_SYMBOL_ICONS: SymbolIconName[] = [
  "assessment",
  "tool",
  "knowledge",
  "booking",
  "treehole",
  "chat",
  "breath",
  "ground",
  "compass",
  "shield",
  "heart",
  "mind",
  "book",
  "calendar",
  "message",
  "spark",
  "growth",
  "boundary",
  "crisis",
  "faq",
];
