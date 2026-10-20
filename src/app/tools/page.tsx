"use client";

// QM 自助工具 v3.0 - /tools 主页面
// 整合 Hero/QuickMatch/Library/Detail/Player/Complete/History 所有视图
// 完全重写：删除旧的4个硬编码工具和 JournalTool

import { useState, useEffect } from "react";
import { PageLayout } from "@/components/page-layout";
import { ToolHero } from "@/components/tools/tool-hero";
import { QuickMatch } from "@/components/tools/quick-match";
import { ToolLibrary } from "@/components/tools/tool-library";
import { ToolDetail } from "@/components/tools/tool-detail";
import { ToolPlayer } from "@/components/tools/tool-player";
import { ToolComplete } from "@/components/tools/tool-complete";
import { ToolHistory } from "@/components/tools/tool-history";
import { TOOL_REGISTRY, getToolCount } from "@/lib/tools/tool-registry";
import { saveEvent, consumeContextCapsule, peekContextCapsule } from "@/lib/tools/storage";
import type { Tool, ToolRecommendation, ToolsView } from "@/lib/tools/types";

export default function ToolsPage() {
  // 视图状态
  const [view, setView] = useState<ToolsView>("hero");
  // 当前选中的工具
  const [currentTool, setCurrentTool] = useState<Tool | null>(null);
  // 完成/停止模式
  const [completeMode, setCompleteMode] = useState<"completed" | "stopped">("completed");
  // 推荐结果（来自Quick Match或小酷）
  const [recommendations, setRecommendations] = useState<ToolRecommendation[]>([]);
  // 来源
  const [source, setSource] = useState<"xiaoku" | "tools_home" | "quick_match" | "library" | "history">("tools_home");
  // 用时追踪
  const [elapsedSec, setElapsedSec] = useState(0);
  const [showJournalRedirect, setShowJournalRedirect] = useState(false);

  // E2c-5: refresh-restore via localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("qm_tools_state_v1");
      if (!raw) return;
      const sv = JSON.parse(raw);
      if (sv.view) setView(sv.view);
      if (sv.currentTool) setCurrentTool(sv.currentTool);
      if (sv.source) setSource(sv.source);
      if (typeof sv.elapsedSec === "number") setElapsedSec(sv.elapsedSec);
      if (sv.completeMode) setCompleteMode(sv.completeMode);
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("qm_tools_state_v1", JSON.stringify({ view, currentTool, source, elapsedSec, completeMode }));
    } catch {}
  }, [view, currentTool, source, elapsedSec, completeMode]);

  // 检查URL参数 - 支持从工具页跳回小酷的Context Capsule检测
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const sourceParam = params.get("source");
    const toolIdParam = params.get("tool_id");

    // 旧日记链接跳转
    const pathname = window.location.pathname;
    if (pathname.includes("journal") || params.get("tool") === "journal") {
      setShowJournalRedirect(true);
      return;
    }

    if (sourceParam === "xiaoku" && toolIdParam) {
      // 从小酷跳转过来
      const tool = TOOL_REGISTRY.find((t) => t.tool_id === toolIdParam);
      if (tool) {
        setCurrentTool(tool);
        setSource("xiaoku");
        setView("detail");
      }
    }

    // resume 参数恢复进行中的练习
    const resumeId = params.get("resume");
    if (resumeId) {
      const tool = TOOL_REGISTRY.find((t) => t.tool_id === resumeId);
      if (tool) {
        setCurrentTool(tool);
        setView("player");
      }
    }
  }, []);

  // 跳转到小酷
  const goToXiaoku = () => {
    // 跳转到实际小酷对话页，带 source=tool 参数
    if (typeof window !== "undefined") {
      if (currentTool) {
        window.location.href = `/chat?source=tool&tool_id=${currentTool.tool_id}`;
      } else {
        window.location.href = "/chat";
      }
    }
  };

  // 回到首页
  const goToHome = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  // 选择工具 → 进入详情
  const handleSelectTool = (tool: Tool, src: typeof source = "library") => {
    setCurrentTool(tool);
    setSource(src);
    setView("detail");
  };

  // 开始练习
  const handleStartTool = () => {
    if (!currentTool) return;
    setElapsedSec(0);

    // 记录 started 事件
    saveEvent({
      tool_id: currentTool.tool_id,
      event_type: "started",
      source: source as any,
    });

    setView("player");
  };

  // 完成工具
  const handleComplete = () => {
    if (!currentTool) return;
    setCompleteMode("completed");
    setView("complete");
  };

  // 停止工具
  const handleStop = () => {
    if (!currentTool) return;
    setCompleteMode("stopped");
    setView("complete");
  };

  // Quick Match 完成
  const handleQuickMatchComplete = (recs: ToolRecommendation[]) => {
    setRecommendations(recs);
    if (recs.length > 0) {
      handleSelectTool(recs[0].tool, "quick_match");
    } else {
      setView("library");
    }
  };

  // 换一个工具
  const handleShorterTool = () => {
    // 找一个时间更短的工具
    const shorter = TOOL_REGISTRY.filter(
      (t) => currentTool && t.time_estimate_min < currentTool.time_estimate_min
    ).sort((a, b) => b.time_estimate_min - a.time_estimate_min);

    if (shorter.length > 0) {
      handleSelectTool(shorter[0], "library");
    } else {
      setView("library");
    }
  };

  // 日记功能迁移提示
  if (showJournalRedirect) {
    return (
      <PageLayout title="功能迁移" subtitle="日记已合并到情绪树洞">
        <div className="space-y-6 py-8">
          <div className="bg-white/70 rounded-3xl p-6 space-y-4 border border-[#E8DCD6]/50 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-[var(--qm-purple-400)]/10 flex items-center justify-center">
              <span className="text-2xl">📝</span>
            </div>
            <h2 className="text-lg font-medium text-[#4A4A4A]">日记搬到情绪树洞了</h2>
            <p className="text-sm text-[#6B5B52] leading-relaxed">
              日记和书写功能已经合并到「情绪树洞」，
              <br />
              那里更适合持续记录和倾诉。
            </p>
            <p className="text-sm text-[#9B8E8A]">
              自助工具现在专注于结构化练习，帮助你在当下照顾好自己。
            </p>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.location.href = "/treehole";
                }
              }}
              className="w-full py-3.5 bg-[var(--qm-purple-600)] text-white font-medium rounded-2xl hover:bg-[var(--qm-purple-700)] hover:shadow-lg transition-all min-h-[44px]"
            >
              去情绪树洞
            </button>
            <button
              onClick={() => {
                setShowJournalRedirect(false);
                setView("hero");
              }}
              className="w-full py-3 bg-white/70 text-[#6B5B52] text-sm font-medium rounded-2xl border border-[#E8DCD6] hover:bg-white transition-all min-h-[44px]"
            >
              看看自助工具
            </button>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="自助工具"
      subtitle="照顾好自己的小方法"
    >
      <div className="max-w-2xl mx-auto">
        {view === "hero" && (
          <ToolHero
            onQuickMatch={() => setView("quick-match")}
            onBrowseAll={() => setView("library")}
            onXiaoku={goToXiaoku}
            onHome={goToHome}
            toolCount={getToolCount()}
          />
        )}

        {view === "quick-match" && (
          <QuickMatch
            onComplete={handleQuickMatchComplete}
            onBack={() => setView("hero")}
            onXiaoku={goToXiaoku}
          />
        )}

        {view === "library" && (
          <ToolLibrary
            onSelectTool={(tool) => handleSelectTool(tool, "library")}
            onBack={() => setView("hero")}
            onXiaoku={goToXiaoku}
            onHome={goToHome}
            onHistory={() => setView("history")}
          />
        )}

        {view === "detail" && currentTool && (
          <ToolDetail
            tool={currentTool}
            onStart={handleStartTool}
            onBack={() => setView("library")}
            onXiaoku={goToXiaoku}
            onHome={goToHome}
          />
        )}

        {view === "player" && currentTool && (
          <ToolPlayer
            tool={currentTool}
            onComplete={handleComplete}
            onStop={handleStop}
            onBack={() => setView("detail")}
            onXiaoku={goToXiaoku}
            onPause={() => {}}
            source={source}
          />
        )}

        {view === "complete" && currentTool && (
          <ToolComplete
            tool={currentTool}
            mode={completeMode}
            onHome={goToHome}
            onXiaoku={goToXiaoku}
            onShorterTool={handleShorterTool}
            onHistory={() => setView("history")}
            source={source}
            timeSpentSec={elapsedSec}
          />
        )}

        {view === "history" && (
          <ToolHistory
            onBack={() => setView("library")}
            onSelectTool={(tool) => handleSelectTool(tool, "history")}
            onHome={goToHome}
            onXiaoku={goToXiaoku}
          />
        )}
      </div>
    </PageLayout>
  );
}
