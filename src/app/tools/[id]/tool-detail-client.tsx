"use client";

// 批3b(20260923)：/tools/[id] 客户端视图机（detail → player → complete）
// 复用 /tools 列表页同款 ToolDetail/ToolPlayer/ToolComplete 组件与 storage 埋点，
// 行为口径与列表页一致（842: B1-033/034、B4-TOOL-F03~F07）。
import { useState } from "react";
import { ToolDetail } from "@/components/tools/tool-detail";
import { ToolPlayer } from "@/components/tools/tool-player";
import { ToolComplete } from "@/components/tools/tool-complete";
import { saveEvent } from "@/lib/tools/storage";
import type { Tool } from "@/lib/tools/types";

interface ToolDetailClientProps {
  tool: Tool;
}

export default function ToolDetailClient({ tool }: ToolDetailClientProps) {
  const [view, setView] = useState<"detail" | "player" | "complete">("detail");
  const [completeMode, setCompleteMode] = useState<"completed" | "stopped">("completed");
  const [elapsedSec, setElapsedSec] = useState(0);
  const source = "library" as const;

  // 跳转到小酷（与列表页同款：带 source=tool&tool_id 回聊上下文）
  const goToXiaoku = () => {
    if (typeof window !== "undefined") {
      window.location.href = `/chat?source=tool&tool_id=${tool.tool_id}`;
    }
  };

  // 回到首页
  const goToHome = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  // 开始练习
  const handleStartTool = () => {
    setElapsedSec(0);

    // 记录 started 事件
    saveEvent({
      tool_id: tool.tool_id,
      event_type: "started",
      source: source as never,
    });

    setView("player");
  };

  // 完成工具
  const handleComplete = () => {
    setCompleteMode("completed");
    setView("complete");
  };

  // 停止工具
  const handleStop = () => {
    setCompleteMode("stopped");
    setView("complete");
  };

  return (
    <>
      {view === "detail" && (
        <ToolDetail
          tool={tool}
          onStart={handleStartTool}
          onBack={() => {
            window.location.href = "/tools";
          }}
          onXiaoku={goToXiaoku}
          onHome={goToHome}
        />
      )}

      {view === "player" && (
        <ToolPlayer
          tool={tool}
          onComplete={handleComplete}
          onStop={handleStop}
          onBack={() => setView("detail")}
          onXiaoku={goToXiaoku}
          onPause={() => {}}
          source={source}
        />
      )}

      {view === "complete" && (
        <ToolComplete
          tool={tool}
          mode={completeMode}
          onHome={goToHome}
          onXiaoku={goToXiaoku}
          onShorterTool={() => {
            window.location.href = "/tools";
          }}
          onHistory={() => {
            window.location.href = "/tools";
          }}
          source={source}
          timeSpentSec={elapsedSec}
        />
      )}
    </>
  );
}
