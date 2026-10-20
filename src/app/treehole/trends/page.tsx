"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TrendChart } from "@/components/treehole/trend-chart";
import {
  getAllRecords,
  getRecordsInRange,
  getTodayString,
  formatDateChinese,
  isStorageAvailable,
  isRecordStoreReadable,
} from "@/lib/treehole/th-storage";
import { build7dTrendPoints } from "@/lib/treehole/th-capsule";
import { TreeholeNav } from "@/components/treehole/treehole-nav";
import { DesktopFrame, DesktopTrends } from "@/components/treehole/desktop-panels";
import type { TrendDataPoint } from "@/lib/treehole/th-types";

type Period = "7d" | "30d";

export default function TrendsPage() {
  const [period, setPeriod] = useState<Period>("7d");
  const [desktop, setDesktop] = useState<boolean | null>(null);
  const [trendPoints, setTrendPoints] = useState<TrendDataPoint[]>([]);
  const [showNumbers, setShowNumbers] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [recordStoreReadable, setRecordStoreReadable] = useState(true);
  const [totalDays, setTotalDays] = useState(0);
  const [diaryDays, setDiaryDays] = useState(0);
  const [recordsRevision, setRecordsRevision] = useState(0);
  useEffect(() => { setDesktop(window.matchMedia("(min-width: 701px)").matches); }, []);
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === "qm_treehole_records" || event.key === null) setRecordsRevision((revision) => revision + 1);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    const readable = isRecordStoreReadable();
    setRecordStoreReadable(readable);
    if (!readable) { setIsLoading(false); return; }
    const today = getTodayString();
    const endDate = new Date(today);
    const days = period === "7d" ? 6 : 29;
    const startDate = new Date(today);
    startDate.setUTCDate(startDate.getUTCDate() - days);

    const startStr = startDate.toISOString().split("T")[0];
    const allPoints = build7dTrendPoints(today);
    const records = getRecordsInRange(startStr, today);

    // 如果是30天，生成更多数据点（基于已有记录）
    let points: TrendDataPoint[] = allPoints;
    if (period === "30d") {
      const byDate = new Map(records.map((record) => [record.date, record]));
      // 只补可核的记录存在性；旧于七天的评分与主题等待权威算法，不在前端猜算。
      const monthPoints: TrendDataPoint[] = [];
      for (let d = new Date(startDate); d <= endDate; d.setUTCDate(d.getUTCDate() + 1)) {
        const dateStr = d.toISOString().split("T")[0];
        const existing = allPoints.find((p) => p.date === dateStr);
        if (existing) {
          monthPoints.push(existing);
        } else {
          const record = byDate.get(dateStr);
          monthPoints.push({
            date: dateStr,
            themes: [],
            hasDiary: !!(record?.diary && !record.diary.isDraft),
            hasLetter: !!record?.letter,
          });
        }
      }
      points = monthPoints;
    }

    const diaryCount = points.filter((p) => p.hasDiary).length;
    setDiaryDays(diaryCount);
    setTotalDays(records.length);
    setTrendPoints(points);
    setIsLoading(false);
  }, [period, recordsRevision]);

  // 计算主题频率
  const themeFrequency = () => {
    const counts: Record<string, number> = {};
    for (const p of trendPoints) {
      for (const t of p.themes) {
        counts[t] = (counts[t] || 0) + 1;
      }
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([theme, count]) => ({ theme, count }));
  };

  const themes = themeFrequency();

  // 叙事式总结
  const generateNarrative = () => {
    const total = period === "7d" ? 7 : 30;
    const diaryRate = Math.round((diaryDays / total) * 100);

    const moodScores = trendPoints.filter((p) => p.moodScore !== undefined).map((p) => p.moodScore as number);
    const avgMood = moodScores.length > 0
      ? (moodScores.reduce((a, b) => a + b, 0) / moodScores.length).toFixed(1)
      : null;

    const parts: string[] = [];

    if (diaryDays === 0) {
      parts.push(`过去${total}天里，你还没有在树洞里写日记。`);
      parts.push("没关系，记录没有压力，什么时候想写了都可以。");
    } else {
      parts.push(`过去${total}天里，你有 ${diaryDays} 天写了日记（${diaryRate}%）。`);

      if (period === "30d") {
        parts.push("30天情绪评分和主题统计尚未接通，下面只列出可以核对的记录天数。");
        parts.push("这是观察记录，不是心理诊断。");
        return parts.join(" ");
      }

      if (avgMood) {
        const moodDesc =
          Number(avgMood) >= 4 ? "整体偏明亮" :
          Number(avgMood) >= 3 ? "有起有伏" :
          "整体偏低沉";
        parts.push(`情绪状态${moodDesc}。`);
      }

      if (themes.length > 0) {
        parts.push(`出现最多的主题是${themes[0].theme}。`);
      }
    }

    parts.push("这是观察记录，不是心理诊断。");

    return parts.join(" ");
  };

  if (isLoading || desktop === null) {
    return (
      <div className="min-h-screen pb-12 px-4 flex items-center justify-center" style={{ background: "#FAF5F2" }}>
        <div className="text-center" style={{ color: "#71717A" }}>
          <div className="text-4xl mb-4">📈</div>
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  if (!recordStoreReadable) return <div role="alert" className="mx-auto max-w-xl p-8">趋势暂时无法读取，原始树洞记录仍保留；不会把损坏数据误报为零天。请勿清除浏览器数据。</div>;

  if (desktop) {
    const scoredDays = trendPoints.filter((point) => point.moodScore !== undefined || point.energyScore !== undefined).length;
    const letterCount = trendPoints.filter((point) => point.hasLetter).length;
    return <div className="qm-treehole-desktop-wrapper"><DesktopFrame
      dateLabel={formatDateChinese(getTodayString()).replace("日 ", "日 · ")}
      operationKey={getTodayString()} tab="trends" visualState="13"
      storageNotice="当前版本记录保存在本机浏览器，尚未提供账号云端备份。"
      sharedShell={<TreeholeNav title="趋势观察" />}>
      <DesktopTrends range={period === "7d" ? 7 : 30}
        onRange={(range) => setPeriod(range === 7 ? "7d" : "30d")}
        diaryDays={diaryDays} letterCount={letterCount}
        insufficient={scoredDays === 0}
        chart={<p role="status" className="insufficient">趋势评分阈值尚未核定，暂不绘制结论。</p>} />
    </DesktopFrame></div>;
  }

  return (
    <div className="min-h-screen pb-12 px-4 sm:px-6" style={{ background: "#FAF5F2" }}>
        <TreeholeNav title="趋势观察" />
      <div className="max-w-4xl mx-auto">
        {/* 返回 */}
        <div className="mb-6">
          <Link
            href="/treehole"
            className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-full transition-colors hover:bg-white/60"
            style={{ color: "#6B4C9A" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            <span>回到树洞</span>
          </Link>
          <Link
            href="/treehole/archive"
            className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-full transition-colors hover:bg-white/60"
            style={{ color: "#6B4C9A" }}
          >
            <span>📅 历史归档</span>
          </Link>
        </div>

        {/* 标题 */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">📈</div>
          <h1 className="text-2xl font-semibold mb-2" style={{ color: "#4A4A4A" }}>
            趋势观察
          </h1>
          <p className="text-sm" style={{ color: "#71717A" }}>
            看看这段时间的变化
          </p>
          <p className="text-xs mt-2" style={{ color: "#A1A1AA" }}>
            仅供自我观察，不是诊断结论
          </p>
        </div>

        {/* 周期切换 */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <button
            onClick={() => setPeriod("7d")}
            className="px-5 py-2 rounded-full text-sm font-medium transition-all"
            style={{
              backgroundColor: period === "7d" ? "#6B4C9A" : "white",
              color: period === "7d" ? "white" : "#71717A",
              boxShadow: period === "7d" ? "0 2px 8px rgba(107,76,154,0.3)" : "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            7 天
          </button>
          <button
            onClick={() => setPeriod("30d")}
            className="px-5 py-2 rounded-full text-sm font-medium transition-all"
            style={{
              backgroundColor: period === "30d" ? "#6B4C9A" : "white",
              color: period === "30d" ? "white" : "#71717A",
              boxShadow: period === "30d" ? "0 2px 8px rgba(107,76,154,0.3)" : "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            30 天
          </button>
        </div>

        {/* 叙事总结 */}
        <div
          className="rounded-2xl p-6 mb-6"
          style={{ background: "rgba(167, 139, 250, 0.1)", border: "1px solid rgba(167, 139, 250, 0.2)" }}
        >
          <p className="text-sm leading-relaxed" style={{ color: "#4A4A4A" }}>
            {generateNarrative()}
          </p>
        </div>

        {/* 趋势图 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold" style={{ color: "#4A4A4A" }}>
              情绪与能量趋势
            </h3>
            <button
              onClick={() => setShowNumbers(!showNumbers)}
              className="text-xs px-3 py-1 rounded-full transition-colors"
              style={{
                backgroundColor: showNumbers ? "rgba(107,76,154,0.1)" : "transparent",
                color: showNumbers ? "#6B4C9A" : "#A1A1AA",
              }}
            >
              {showNumbers ? "数字显示中" : "仅叙事版"}
            </button>
          </div>
          {period === "30d" ? <p role="status" className="text-sm" style={{ color: "#71717A" }}>30天情绪评分尚未接通，不能把最近7天的曲线当作30天趋势。</p> : <TrendChart
            points={trendPoints}
            showNumbers={showNumbers}
            period={period}
          />}
        </div>

        {/* 主题分布 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <h3 className="text-sm font-semibold mb-4" style={{ color: "#4A4A4A" }}>
            主题分布
          </h3>
          {period === "30d" ? <p role="status" className="text-sm" style={{ color: "#71717A" }}>30天主题统计尚未接通。</p> : themes.length === 0 ? (
            <p className="text-sm" style={{ color: "#A1A1AA" }}>
              数据还不够多，多记录几天再来看看吧
            </p>
          ) : (
            <div className="space-y-3">
              {themes.map(({ theme, count }) => {
                const maxCount = themes[0].count;
                const widthPercent = (count / maxCount) * 100;
                return (
                  <div key={theme} className="flex items-center gap-3">
                    <span className="text-xs w-20 flex-shrink-0" style={{ color: "#71717A" }}>
                      {theme}
                    </span>
                    <div className="flex-1 h-2 rounded-full" style={{ background: "#F3F4F6" }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${widthPercent}%`,
                          background: "linear-gradient(90deg, #A78BFA, #6B4C9A)",
                        }}
                      />
                    </div>
                    <span className="text-xs w-8 text-right flex-shrink-0" style={{ color: "#A1A1AA" }}>
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 统计数据 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
            <div className="text-2xl font-semibold" style={{ color: "#6B4C9A" }}>
              {diaryDays}
            </div>
            <div className="text-xs mt-1" style={{ color: "#A1A1AA" }}>
              日记天数
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
            <div className="text-2xl font-semibold" style={{ color: "#6B4C9A" }}>
              {trendPoints.filter(p => p.hasLetter).length}
            </div>
            <div className="text-xs mt-1" style={{ color: "#A1A1AA" }}>
              小酷回信
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
            <div className="text-2xl font-semibold" style={{ color: "#6B4C9A" }}>
              {period === "30d" ? "—" : themes.length}
            </div>
            <div className="text-xs mt-1" style={{ color: "#A1A1AA" }}>
              出现主题
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
            <div className="text-2xl font-semibold" style={{ color: "#6B4C9A" }}>
              {totalDays}
            </div>
            <div className="text-xs mt-1" style={{ color: "#A1A1AA" }}>
              有记录天数
            </div>
          </div>
        </div>

        {/* 说明 */}
        <div
          className="rounded-2xl p-4 text-center"
          style={{ background: "rgba(167, 139, 250, 0.05)" }}
        >
          <p className="text-xs" style={{ color: "#71717A", lineHeight: 1.8 }}>
            💡 趋势图基于你的每日情绪收集答案生成，用 1-5 分粗略表示状态。<br />
            它是自我观察的工具，不是心理健康评估，也不构成任何诊断。
          </p>
        </div>
      </div>
    </div>
  );
}
