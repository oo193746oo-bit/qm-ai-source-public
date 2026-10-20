// QM 自助工具 v3.0 - 工具详情页组件

import { useState } from "react";
import type { Tool } from "@/lib/tools/types";
import { isFavorite, toggleFavorite } from "@/lib/tools/storage";

interface ToolDetailProps {
  tool: Tool;
  onStart: () => void;
  onBack: () => void;
  onXiaoku: () => void;
  onHome: () => void;
}

export function ToolDetail({ tool, onStart, onBack, onXiaoku, onHome }: ToolDetailProps) {
  const [showTheory, setShowTheory] = useState(false);
  const [favorited, setFavorited] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return isFavorite(tool.tool_id);
  });

  const handleToggleFav = () => {
    const nowFav = toggleFavorite(tool.tool_id);
    setFavorited(nowFav);
  };

  const difficultyLabel =
    tool.difficulty === 1 ? "简单" : tool.difficulty === 2 ? "中等" : "较深";

  return (
    <div className="space-y-5">
      {/* 返回 */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-[#9B8E8A] hover:text-[#6B5F5A] min-h-[44px]"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        返回列表
      </button>

      {/* 主卡片 */}
      <div className="bg-white/80 rounded-3xl p-6 space-y-5 border border-[#E8DCD6]/50">
        {/* 类别和收藏 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-full bg-[var(--qm-purple-400)]/10 text-[#7C3AED]">
              {tool.category_name}
            </span>
            <span className="text-xs text-[#B5A8A3]">
              约{tool.time_estimate_min}分钟 · {difficultyLabel}
            </span>
          </div>
          <button
            onClick={handleToggleFav}
            className="p-2 rounded-full hover:bg-[#FAF5F2] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label={favorited ? "取消收藏" : "收藏"}
          >
            <span className="text-lg">{favorited ? "⭐" : "☆"}</span>
          </button>
        </div>

        {/* 标题 */}
        <h1 className="text-xl md:text-2xl font-medium text-[#4A4A4A] leading-snug">
          {tool.name}
        </h1>

        {/* 能帮什么 */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-[#6B5B52]">这个工具此刻能帮什么</h3>
          <p className="text-sm text-[#6B5B52] leading-relaxed">{tool.mechanism}</p>
        </div>

        {/* 预计时间 */}
        <div className="flex items-center gap-2 text-sm text-[#6B5B52]">
          <span className="text-base">⏱️</span>
          <span>预计需要 {tool.time_estimate_min} 分钟</span>
        </div>

        {/* 适合/不适合 */}
        <div className="grid grid-cols-1 gap-3">
          <div className="bg-[#FAF5F2] rounded-xl p-4">
            <p className="text-xs text-[#7C3AED] font-medium mb-2">适合的情况</p>
            <div className="flex flex-wrap gap-1.5">
              {tool.scenarios.map((s) => (
                <span
                  key={s}
                  className="px-2 py-1 text-xs bg-white text-[#6B5B52] rounded-full"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 开始前一句话 */}
        <div className="bg-[var(--qm-purple-50)]/60 rounded-xl p-4 border border-[var(--qm-purple-200)]/50">
          <p className="text-sm text-[#5A4A6A] leading-relaxed italic">
            "{tool.pre_guidance}"
          </p>
        </div>

        {/* 开始按钮 */}
        <button
          onClick={onStart}
          className="w-full py-4 bg-[var(--qm-purple-600)] text-white hover:bg-[var(--qm-purple-700)] font-medium rounded-2xl hover:shadow-lg hover:shadow-[var(--qm-purple-400)]/20 transition-all duration-300 min-h-[48px] active:scale-[0.99]"
        >
          开始练习
        </button>

        {/* 理论与机制 - 折叠 */}
        <div className="border-t border-[#F0E8E3] pt-4">
          <button
            onClick={() => setShowTheory(!showTheory)}
            className="w-full flex items-center justify-between text-sm text-[#6B5B52] min-h-[44px]"
          >
            <span className="font-medium">理论与机制</span>
            <svg
              className={`w-4 h-4 transition-transform ${showTheory ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          {showTheory && (
            <div className="pt-3 space-y-3 animate-fade-in">
              <p className="text-sm text-[#6B5B52] leading-relaxed">
                <span className="font-medium">理论基础：</span>
                {tool.theory_basis}
              </p>
              <p className="text-sm text-[#6B5B52] leading-relaxed">
                <span className="font-medium">共 {tool.steps.length} 步：</span>
              </p>
              <ol className="space-y-1.5 pl-5">
                {tool.steps.map((step) => (
                  <li key={step.step} className="text-sm text-[#6B5B52] list-decimal">
                    {step.instruction}
                  </li>
                ))}
              </ol>
              <p className="text-sm text-[#6B5B52] leading-relaxed">
                <span className="font-medium">可用变体：</span>
                {tool.variants.join("、")}
              </p>
            </div>
          )}
        </div>

        {/* 安全提示 */}
        <div className="bg-[#FEF2F2] rounded-xl p-4 border border-[#FECACA]/50">
          <div className="flex items-start gap-2">
            <span className="text-base flex-shrink-0">⚠️</span>
            <div>
              <p className="text-xs text-[#DC2626] font-medium mb-1">安全提示</p>
              <p className="text-xs text-[#B91C1C] leading-relaxed">
                {tool.safety_note}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 底部入口 */}
      <div className="flex gap-3">
        <button
          onClick={onHome}
          className="flex-1 py-3 bg-white/70 text-[#6B5B52] text-sm font-medium rounded-2xl border border-[#E8DCD6] hover:bg-white transition-all min-h-[44px]"
        >
          回到首页
        </button>
        <button
          onClick={onXiaoku}
          className="flex-1 py-3 bg-white/70 text-[#6B5B52] text-sm font-medium rounded-2xl border border-[#E8DCD6] hover:bg-white transition-all min-h-[44px]"
        >
          找小酷聊聊
        </button>
      </div>

      {/* 危机提示 */}
      <div className="text-center text-xs text-[#C9BDB5]">
        如遇危机请拨打 QM 心理援助热线：
        <span className="text-[#FC8181] font-medium">15001930070</span>
      </div>
    </div>
  );
}
