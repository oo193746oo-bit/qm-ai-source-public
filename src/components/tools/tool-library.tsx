// QM 自助工具 v3.0 - 工具列表页组件

import { useState, useMemo } from "react";
import Link from "next/link";
import { TOOL_REGISTRY, CATEGORIES, searchTools, getToolsByCategory } from "@/lib/tools/tool-registry";
import type { Tool, ToolCategory } from "@/lib/tools/types";

interface ToolLibraryProps {
  onSelectTool: (tool: Tool) => void;
  onBack: () => void;
  onXiaoku: () => void;
  onHome: () => void;
  onHistory: () => void;
}

// 快捷筛选标签
const QUICK_FILTERS = [
  { id: "3min", label: "只有3分钟", filter: (t: Tool) => t.time_estimate_min <= 3 },
  { id: "anxiety", label: "焦虑/紧张", filter: (t: Tool) =>
    t.keywords.some((k) => ["焦虑", "紧张", "慌", "压力"].some((w) => k.includes(w))) },
  { id: "sleep", label: "睡前", filter: (t: Tool) => t.category_id === "C5" || t.keywords.some((k) => k.includes("睡")) },
  { id: "rumination", label: "想停止反刍", filter: (t: Tool) =>
    t.keywords.some((k) => ["反刍", "想太多", "停不下来", "脑内"].some((w) => k.includes(w))) },
  { id: "relation", label: "关系/边界", filter: (t: Tool) => t.category_id === "C6" },
  { id: "lowenergy", label: "没动力", filter: (t: Tool) =>
    t.keywords.some((k) => ["没动力", "拖延", "累", "疲惫"].some((w) => k.includes(w))) },
  { id: "safety", label: "需要安全支持", filter: (t: Tool) => t.category_id === "C8" },
  { id: "nowriting", label: "不想写字", filter: (t: Tool) => t.difficulty <= 1 && t.time_estimate_min <= 8 },
];

export function ToolLibrary({
  onSelectTool,
  onBack,
  onXiaoku,
  onHome,
  onHistory,
}: ToolLibraryProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [activeQuickFilter, setActiveQuickFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTools = useMemo(() => {
    let tools = [...TOOL_REGISTRY];

    // 搜索
    if (searchQuery.trim()) {
      tools = searchTools(searchQuery);
    }

    // 类别筛选
    if (activeCategory !== "all") {
      tools = tools.filter((t) => t.category_id === activeCategory);
    }

    // 快捷筛选
    if (activeQuickFilter) {
      const qf = QUICK_FILTERS.find((q) => q.id === activeQuickFilter);
      if (qf) {
        tools = tools.filter(qf.filter);
      }
    }

    return tools;
  }, [activeCategory, activeQuickFilter, searchQuery]);

  return (
    <div className="space-y-5">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between">
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
          返回
        </button>
        <button
          onClick={onHistory}
          className="text-sm text-[var(--qm-purple-400)] hover:text-[#7C3AED] min-h-[44px] px-2"
        >
          历史与收藏
        </button>
      </div>

      {/* 标题 */}
      <div className="space-y-1">
        <h1 className="text-xl font-medium text-[#4A4A4A]">全部工具</h1>
        <p className="text-sm text-[#9B8E8A]">
          共 {TOOL_REGISTRY.length} 个 · 可以按类别或场景筛选
        </p>
      </div>

      {/* 搜索框 */}
      <div className="relative">
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B5A8A3]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索工具、场景或关键词..."
          className="w-full pl-11 pr-4 py-3 bg-white/70 border border-[#E8DCD6] rounded-2xl text-sm text-[#4A4A4A] placeholder-[#C9BDB5] focus:outline-none focus:ring-2 focus:ring-[var(--qm-purple-400)]/30 focus:border-[var(--qm-purple-400)]/50 transition-all min-h-[44px]"
        />
      </div>

      {/* 快捷筛选 chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {QUICK_FILTERS.map((qf) => (
          <button
            key={qf.id}
            onClick={() =>
              setActiveQuickFilter(activeQuickFilter === qf.id ? null : qf.id)
            }
            className={`flex-shrink-0 px-3.5 py-1.5 text-xs rounded-full transition-all min-h-[32px] ${
              activeQuickFilter === qf.id
                ? "bg-[var(--qm-purple-400)] text-white"
                : "bg-white/70 text-[#6B5B52] border border-[#E8DCD6] hover:bg-white"
            }`}
          >
            {qf.label}
          </button>
        ))}
      </div>

      {/* 类别筛选 */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        <button
          onClick={() => setActiveCategory("all")}
          className={`flex-shrink-0 px-3.5 py-1.5 text-xs rounded-full transition-all min-h-[32px] ${
            activeCategory === "all"
              ? "bg-[#6B4C9A] text-white"
              : "bg-white/50 text-[#9B8E8A] border border-[#E8DCD6]/50 hover:bg-white"
          }`}
        >
          全部
        </button>
        {CATEGORIES.map((cat) => {
          const count = getToolsByCategory(cat.id).length;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-shrink-0 px-3.5 py-1.5 text-xs rounded-full transition-all min-h-[32px] ${
                activeCategory === cat.id
                  ? "bg-[#6B4C9A] text-white"
                  : "bg-white/50 text-[#9B8E8A] border border-[#E8DCD6]/50 hover:bg-white"
              }`}
            >
              {cat.name} ({count})
            </button>
          );
        })}
      </div>

      {/* 工具列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredTools.map((tool) => (
          <Link
            key={tool.tool_id}
            href={`/tools/${tool.tool_id}`}
            className="text-left"
            onClick={(e) => {
              e.preventDefault();
              onSelectTool(tool);
            }}
            data-tool-id={tool.tool_id}
          >
            <ToolCard tool={tool} onSelect={() => onSelectTool(tool)} />
          </Link>
        ))}
      </div>

      {filteredTools.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm text-[#9B8E8A]">没有找到匹配的工具</p>
          <button
            onClick={() => {
              setSearchQuery("");
              setActiveCategory("all");
              setActiveQuickFilter(null);
            }}
            className="mt-3 text-sm text-[var(--qm-purple-400)] min-h-[44px]"
          >
            清除筛选
          </button>
        </div>
      )}

      {/* 底部入口 */}
      <div className="flex gap-3 pt-4">
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
    </div>
  );
}

// ===== 工具卡片 =====
function ToolCard({ tool, onSelect }: { tool: Tool; onSelect: () => void }) {
  const [showWhy, setShowWhy] = useState(false);

  // 难度显示
  const difficultyLabel =
    tool.difficulty === 1 ? "简单" : tool.difficulty === 2 ? "中等" : "较深";

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#F0E8E3] hover:border-[var(--qm-purple-400)]/30 hover:shadow-md transition-all group">
      {/* 类别标签 */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--qm-purple-400)]/10 text-[#7C3AED]">
          {tool.category_name}
        </span>
        <span className="text-xs text-[#B5A8A3]">
          约{tool.time_estimate_min}分钟 · {difficultyLabel}
        </span>
      </div>

      {/* 名称 */}
      <h3 className="text-base font-medium text-[#4A4A4A] group-hover:text-[#7C3AED] transition-colors mb-1">
        {tool.name}
      </h3>

      {/* 一句话用途 */}
      <p className="text-sm text-[#9B8E8A] mb-3 line-clamp-2">{tool.mechanism}</p>

      {/* 场景chips */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {tool.scenarios.slice(0, 3).map((s) => (
          <span
            key={s}
            className="px-2 py-0.5 text-xs bg-[#FAF5F2] text-[#9B8E8A] rounded-full"
          >
            {s}
          </span>
        ))}
      </div>

      {/* 按钮 */}
      <div className="flex gap-2">
        <button
          onClick={onSelect}
          className="flex-1 py-2.5 bg-[var(--qm-purple-600)] text-white hover:bg-[var(--qm-purple-700)] text-sm font-medium rounded-xl hover:opacity-90 transition-opacity min-h-[40px]"
        >
          开始
        </button>
        <button
          onClick={() => setShowWhy(!showWhy)}
          className="px-3 py-2.5 text-sm text-[#9B8E8A] hover:text-[#6B5F5A] border border-[#E8DFDA] rounded-xl transition-colors min-h-[40px]"
        >
          为什么这样做
        </button>
      </div>

      {/* 为什么这样做 - 展开 */}
      {showWhy && (
        <div className="mt-3 pt-3 border-t border-[#F0E8E3]">
          <p className="text-xs text-[#6B5B52] leading-relaxed">
            <span className="font-medium text-[#7C3AED]">理论基础：</span>
            {tool.theory_basis}
          </p>
          <p className="text-xs text-[#6B5B52] leading-relaxed mt-1">
            <span className="font-medium text-[#7C3AED]">安全提示：</span>
            {tool.safety_note}
          </p>
        </div>
      )}
    </div>
  );
}
