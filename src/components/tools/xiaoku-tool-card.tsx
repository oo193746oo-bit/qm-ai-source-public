// QM 自助工具 v3.0 - 小酷聊天内嵌工具推荐卡组件
// 显示共情话术 + 为什么适合 + 预计时间 + 按钮（开始练习/换一个/继续聊）

import { useState } from "react";
import type { Tool, ToolRecommendation } from "@/lib/tools/types";
import { recordToolRejection } from "@/lib/tools/storage";

interface XiaokuToolCardProps {
  recommendations: ToolRecommendation[];
  onStartTool: (tool: Tool) => void;
  onContinueChat: () => void;
  empathyText?: string;
}

export function XiaokuToolCard({
  recommendations,
  onStartTool,
  onContinueChat,
  empathyText,
}: XiaokuToolCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || recommendations.length === 0) return null;

  const current = recommendations[currentIndex];
  const tool = current.tool;

  const handleStart = () => {
    onStartTool(tool);
  };

  const handleNext = () => {
    if (currentIndex < recommendations.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      // 最后一个也跳过了
      setDismissed(true);
      recommendations.forEach((r) => recordToolRejection(r.tool.tool_id));
      onContinueChat();
    }
  };

  const handleContinue = () => {
    recordToolRejection(tool.tool_id);
    setDismissed(true);
    onContinueChat();
  };

  return (
    <div className="my-2 animate-message-in">
      <div className="bg-[var(--qm-purple-50)] rounded-2xl border border-[var(--qm-purple-200)]/60 p-4 max-w-md">
        {/* 共情话术 */}
        {empathyText && (
          <p className="text-sm text-[#5A4A6A] leading-relaxed mb-3">
            {empathyText}
          </p>
        )}

        {/* 工具信息 */}
        <div className="bg-white/70 rounded-xl p-3 mb-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--qm-purple-400)]/15 text-[#7C3AED]">
              {tool.category_name}
            </span>
            <span className="text-xs text-[#9B8E8A]">
              约{tool.time_estimate_min}分钟
            </span>
          </div>
          <h4 className="text-sm font-medium text-[#4A4A4A] mb-1">
            {tool.name}
          </h4>
          <p className="text-xs text-[#6B5B52] leading-relaxed">
            {current.reason}
          </p>
        </div>

        {/* 按钮 */}
        <div className="flex gap-2">
          <button
            onClick={handleStart}
            className="flex-1 py-2.5 bg-[var(--qm-purple-600)] text-white hover:bg-[var(--qm-purple-700)] text-sm font-medium rounded-xl hover:opacity-90 transition-opacity min-h-[40px]"
          >
            开始练习
          </button>
          <button
            onClick={handleNext}
            className="px-4 py-2.5 text-sm text-[#6B5B52] bg-white/70 border border-[#E8DCD6] rounded-xl hover:bg-white transition-colors min-h-[40px]"
          >
            {currentIndex < recommendations.length - 1 ? "换一个" : "不做了"}
          </button>
        </div>

        <button
          onClick={handleContinue}
          className="w-full mt-2 py-1.5 text-xs text-[#9B8E8A] hover:text-[#6B5F5A] transition-colors min-h-[32px]"
        >
          继续聊，不用工具
        </button>
      </div>

      <p className="text-xs text-[#C9BDB5] mt-2 ml-2">
        这只是一个建议，你可以完全自主选择。
      </p>
    </div>
  );
}
