"use client";

import type { TrendDataPoint } from "@/lib/treehole/th-types";

interface TrendChartProps {
  points: TrendDataPoint[];
  showNumbers: boolean;
  period: "7d" | "30d";
}

interface LineConfig {
  key: keyof Pick<TrendDataPoint, "moodScore" | "energyScore" | "sleepScore" | "motivationScore">;
  label: string;
  color: string;
  dash?: boolean;
}

const LINES: LineConfig[] = [
  { key: "moodScore", label: "情绪色调", color: "#6B4C9A" },
  { key: "energyScore", label: "身体能量", color: "#F6AD55" },
  { key: "sleepScore", label: "睡眠恢复", color: "#9F7AEA" },
  { key: "motivationScore", label: "动力水平", color: "#68D391" },
];

export function TrendChart({ points, showNumbers, period }: TrendChartProps) {
  const width = 600;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 30, left: showNumbers ? 30 : 10 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // 生成路径
  const generatePath = (line: LineConfig): string => {
    const validPoints = points
      .map((p, i) => ({ value: p[line.key], index: i }))
      .filter((p) => p.value !== undefined);

    if (validPoints.length < 2) return "";

    const xStep = chartWidth / (points.length - 1 || 1);

    const segments: string[] = [];
    let started = false;

    for (let i = 0; i < points.length; i++) {
      const value = points[i][line.key];
      if (value === undefined) continue;

      const x = padding.left + i * xStep;
      const y = padding.top + chartHeight - ((value - 1) / 4) * chartHeight;

      if (!started) {
        segments.push(`M ${x.toFixed(1)} ${y.toFixed(1)}`);
        started = true;
      } else {
        // 使用贝塞尔曲线让线条更平滑
        segments.push(`L ${x.toFixed(1)} ${y.toFixed(1)}`);
      }
    }

    return segments.join(" ");
  };

  // 生成日期标签
  const getDateLabels = () => {
    if (period === "7d") {
      return points.map((p, i) => {
        const d = new Date(p.date);
        return {
          x: padding.left + (i * chartWidth) / (points.length - 1 || 1),
          label: `${d.getMonth() + 1}/${d.getDate()}`,
        };
      });
    }
    // 30天：只显示第1、8、15、22、29天
    return points
      .filter((_, i) => i % 7 === 0 || i === points.length - 1)
      .map((p) => {
        const d = new Date(p.date);
        const idx = points.findIndex((pt) => pt.date === p.date);
        return {
          x: padding.left + (idx * chartWidth) / (points.length - 1 || 1),
          label: `${d.getMonth() + 1}/${d.getDate()}`,
        };
      });
  };

  const dateLabels = getDateLabels();

  // 找出有数据的 line
  const activeLines = LINES.filter((line) =>
    points.some((p) => p[line.key] !== undefined),
  );

  const hasAnyData = activeLines.length > 0;

  if (!hasAnyData) {
    return (
      <div
        className="flex items-center justify-center rounded-xl"
        style={{ height: `${height}px`, background: "#FAF9F7" }}
      >
        <p className="text-sm" style={{ color: "#A1A1AA" }}>
          数据还不够多，多记录几天再来看看吧
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden">
      {/* SVG 图表 */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* 背景网格线（横向） */}
        {showNumbers && [1, 2, 3, 4, 5].map((v) => {
          const y = padding.top + chartHeight - ((v - 1) / 4) * chartHeight;
          return (
            <g key={v}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#F3F4F6"
                strokeWidth="1"
                strokeDasharray="3,3"
              />
              <text
                x={padding.left - 5}
                y={y + 3}
                textAnchor="end"
                fontSize="9"
                fill="#D1D5DB"
              >
                {v}
              </text>
            </g>
          );
        })}

        {/* 数据线 */}
        {activeLines.map((line) => (
          <path
            key={line.key}
            d={generatePath(line)}
            fill="none"
            stroke={line.color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={line.dash ? "5,5" : undefined}
            opacity={0.8}
          />
        ))}

        {/* 数据点 */}
        {activeLines.map((line) =>
          points.map((p, i) => {
            const value = p[line.key];
            if (value === undefined) return null;
            const xStep = chartWidth / (points.length - 1 || 1);
            const x = padding.left + i * xStep;
            const y = padding.top + chartHeight - ((value - 1) / 4) * chartHeight;
            return (
              <circle
                key={`${line.key}-${i}`}
                cx={x}
                cy={y}
                r={3}
                fill="white"
                stroke={line.color}
                strokeWidth="1.5"
              />
            );
          }),
        )}

        {/* 日期标签 */}
        {dateLabels.map((d, i) => (
          <text
            key={i}
            x={d.x}
            y={height - 10}
            textAnchor="middle"
            fontSize="9"
            fill="#A1A1AA"
          >
            {d.label}
          </text>
        ))}
      </svg>

      {/* 图例 */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
        {activeLines.map((line) => (
          <div key={line.key} className="flex items-center gap-1.5">
            <span
              className="w-3 h-0.5 rounded-full"
              style={{ backgroundColor: line.color }}
            />
            <span className="text-xs" style={{ color: "#71717A" }}>
              {line.label}
            </span>
          </div>
        ))}
      </div>

      {/* 说明 */}
      {showNumbers && (
        <p className="text-xs text-center mt-3" style={{ color: "#A1A1AA" }}>
          1-5 分表示状态程度，仅供自我观察参考
        </p>
      )}
    </div>
  );
}
