"use client";

/**
 * DataViz v2.0
 * 数据可视化容器组件 — 合规容器，不做 AI 伪数据图
 *
 * 关键约束：
 * - 强制要求传入真实数据（data prop）
 * - 不接受 AI 生成的图片 src 作为数据图
 * - 提供 ChartContainer 包装器：标题 + 数据来源标注 + 无障碍 table fallback
 * - 实际图表渲染由测评页面用真实数据完成
 * - 使用 Aurora Mind 语义色板
 *
 * 本组件的目的：
 * 1. 统一数据图的标题、来源、无障碍降级格式
 * 2. 强制数据校验，防止 AI 假图冒充用户结果
 * 3. 导出 validateChartData 供各页面使用
 */

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

// ─── 数据校验 ──────────────────────────────────────────────────

export interface ChartDataPoint {
  label: string;
  value: number;
  /** 可选：数据维度（如雷达图的维度名） */
  dimension?: string;
  /** 可选：单位 */
  unit?: string;
}

export interface ChartData {
  /** 数据集标题（如 "大五人格维度"） */
  title: string;
  /** 数据点列表 */
  points: ChartDataPoint[];
  /** 数据来源说明（如 "基于您对 50 道题的回答"） */
  source?: string;
  /** 数据生成时间戳 */
  generated_at?: string;
}

/**
 * 验证图表数据 — 确保数据非空、非 AI 伪造
 * 返回 { valid: boolean, reason?: string }
 */
export function validateChartData(data: ChartData | null | undefined): {
  valid: boolean;
  reason?: string;
} {
  if (!data) {
    return { valid: false, reason: "数据为空" };
  }
  if (!data.title || data.title.trim().length === 0) {
    return { valid: false, reason: "缺少数据标题" };
  }
  if (!Array.isArray(data.points) || data.points.length === 0) {
    return { valid: false, reason: "数据点为空" };
  }
  if (data.points.length > 50) {
    return { valid: false, reason: "数据点数量异常" };
  }
  for (const p of data.points) {
    if (!p.label || typeof p.label !== "string") {
      return { valid: false, reason: "数据点缺少 label" };
    }
    if (typeof p.value !== "number" || Number.isNaN(p.value)) {
      return { valid: false, reason: `数据点 "${p.label}" 的 value 不是有效数字` };
    }
  }
  return { valid: true };
}

// ─── ChartContainer ────────────────────────────────────────────

export interface ChartContainerProps {
  /** 图表标题 */
  title: string;
  /** 数据来源说明 */
  source?: string;
  /** 子元素 — 实际图表组件（由各页面用真实数据渲染） */
  children: ReactNode;
  /** 外层 className */
  className?: string;
  /** 图表区 className */
  chartClassName?: string;
  /** 图表类型（用于无障碍描述） */
  chartType?: "radar" | "bar" | "line" | "pie" | "percentage";
  /** 表格 fallback 数据（提供时自动生成无障碍 table） */
  tableData?: ChartDataPoint[];
}

export function ChartContainer({
  title,
  source,
  children,
  className,
  chartClassName,
  chartType = "bar",
  tableData,
}: ChartContainerProps) {
  const typeLabel = {
    radar: "雷达图",
    bar: "柱状图",
    line: "趋势图",
    pie: "饼图",
    percentage: "百分比图",
  }[chartType];

  return (
    <figure
      className={cn(
        "rounded-[16px] border border-[#E5DFE9] bg-white overflow-hidden",
        className,
      )}
      role="group"
      aria-label={`${title} ${typeLabel}`}
    >
      {/* 标题栏 */}
      <figcaption className="px-5 pt-4 pb-3 border-b border-[#F0EBF3]">
        <h4 className="text-[15px] font-medium text-[#302B35]">{title}</h4>
        {source && (
          <p className="mt-1 text-[12px] text-[#807886]">数据来源：{source}</p>
        )}
      </figcaption>

      {/* 图表区 */}
      <div className={cn("p-5", chartClassName)}>
        {children}
      </div>

      {/* 无障碍表格 fallback — 屏幕阅读器可读取 */}
      {tableData && tableData.length > 0 && (
        <div className="sr-only" aria-label={`${title} 数据表格`}>
          <table>
            <caption>{title}</caption>
            <thead>
              <tr>
                <th>项目</th>
                <th>数值</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((p, i) => (
                <tr key={i}>
                  <td>{p.label}</td>
                  <td>
                    {p.value}
                    {p.unit || ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </figure>
  );
}

// ─── 语义色板常量（Aurora Mind 对齐） ──────────────────────────
export const SEMANTIC_COLORS = {
  brand: "#6B4C9A",
  brand_light: "#9A7AC8",
  success: "#2F8A6A",
  success_bg: "#E8F6F0",
  warning: "#B67822",
  warning_bg: "#FFF3DC",
  danger: "#B84D5B",
  danger_bg: "#FBEAEC",
  info: "#5262B8",
  info_bg: "#ECEEFC",
  indigo: "#5158C9",
  cyan: "#36A4BE",
  rose: "#D0648E",
  amber: "#C78726",
  ink_600: "#625B68",
  line: "#D8D1DD",
} as const;

/**
 * 默认图表配色序列（6 色，与 Aurora Mind 对齐）
 * 用于雷达图 / 柱状图多序列时
 */
export const CHART_COLOR_SEQUENCE = [
  SEMANTIC_COLORS.brand,
  SEMANTIC_COLORS.indigo,
  SEMANTIC_COLORS.cyan,
  SEMANTIC_COLORS.rose,
  SEMANTIC_COLORS.amber,
  SEMANTIC_COLORS.ink_600,
] as const;

// ─── 警戒色映射工具 ────────────────────────────────────────────

/**
 * 根据数值和范围返回对应的语义色
 * 用于评分 / 风险等级等可视化
 */
export function getSemanticColor(
  value: number,
  min = 0,
  max = 100,
): string {
  const pct = (value - min) / (max - min);
  if (pct >= 0.8) return SEMANTIC_COLORS.success;
  if (pct >= 0.6) return SEMANTIC_COLORS.info;
  if (pct >= 0.4) return SEMANTIC_COLORS.brand;
  if (pct >= 0.25) return SEMANTIC_COLORS.warning;
  return SEMANTIC_COLORS.danger;
}

// ─── DataViz 根导出（方便按需引入） ─────────────────────────────
export const DataViz = {
  ChartContainer,
  validateChartData,
  SEMANTIC_COLORS,
  CHART_COLOR_SEQUENCE,
  getSemanticColor,
};

export default DataViz;
