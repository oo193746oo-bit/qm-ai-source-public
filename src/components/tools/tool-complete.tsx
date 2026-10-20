// QM 自助工具 v3.0 - 完成/停止页组件

import { useState } from "react";
import type { Tool, ToolEventSource } from "@/lib/tools/types";
import { saveEventSafe, saveContextCapsule } from "@/lib/tools/storage";
import { savePendingContext } from "@/lib/context/pending-context";

interface ToolCompleteProps {
  tool: Tool;
  mode: "completed" | "stopped";
  onHome: () => void;
  onXiaoku: () => void;
  onShorterTool: () => void;
  onHistory: () => void;
  source?: "xiaoku" | "tools_home" | "quick_match" | "library" | "history";
  timeSpentSec?: number;
}

const HELPFULNESS_OPTIONS = [
  { value: 5, label: "很有帮助" },
  { value: 4, label: "有一点帮助" },
  { value: 3, label: "没感觉" },
  { value: 2, label: "不太适合" },
  { value: 1, label: "没用" },
];

// 强度刻度条（模块级组件，避免渲染期创建组件导致状态重置）
function IntensitySlider({
  value,
  onChange,
  label,
}: {
  value: number | null;
  onChange: (v: number) => void;
  label: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-[#6B5B52]">{label}</p>
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`flex-1 py-2 text-xs rounded-lg transition-all min-h-[40px] ${
              value === n
                ? "bg-[var(--qm-purple-600)] text-white hover:bg-[var(--qm-purple-700)]"
                : "bg-white/70 text-[#9B8E8A] border border-[#E8DCD6] hover:bg-white"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-[#C9BDB5]">
        <span>完全没有</span>
        <span>非常强</span>
      </div>
    </div>
  );
}

export function ToolComplete({
  tool,
  mode,
  onHome,
  onXiaoku,
  onShorterTool,
  onHistory,
  source = "tools_home",
  timeSpentSec,
}: ToolCompleteProps) {
  const [beforeIntensity, setBeforeIntensity] = useState<number | null>(null);
  const [afterIntensity, setAfterIntensity] = useState<number | null>(null);
  const [helpfulness, setHelpfulness] = useState<number | null>(null);
  const [userNote, setUserNote] = useState("");
  const [saved, setSaved] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [shareWithXiaoku, setShareWithXiaoku] = useState(false);

  const isCompleted = mode === "completed";

  const handleSave = () => {
    const eventType = isCompleted ? "completed" : "stopped";

    const { saved: ok } = saveEventSafe({
      tool_id: tool.tool_id,
      event_type: eventType as "completed" | "stopped",
      source: source as ToolEventSource,
      metrics: {
        time_spent_sec: timeSpentSec,
        before_intensity: beforeIntensity || undefined,
        after_intensity: afterIntensity || undefined,
        helpfulness: helpfulness || undefined,
      },
      user_note: userNote.trim() || undefined,
    });

    if (ok) {
      setSaved(true);
      setSaveFailed(false);
    } else {
      setSaveFailed(true);
    }
  };

  const handleGoXiaoku = () => {
    // 如果用户同意分享，保存Context Capsule
    if (shareWithXiaoku) {
      saveEventSafe({
        tool_id: tool.tool_id,
        event_type: isCompleted ? "completed" : "stopped",
        source: source as ToolEventSource,
        metrics: {
          time_spent_sec: timeSpentSec,
          helpfulness: helpfulness || undefined,
        },
        user_note: userNote.trim() || undefined,
        consent: {
          save_to_device: true,
          share_summary_with_xiaoku: true,
        },
      });
      saveContextCapsule({
        tool_id: tool.tool_id,
        tool_name: tool.name,
        completion_status: isCompleted ? "completed" : "stopped",
        helpfulness: helpfulness || undefined,
        user_note: userNote.trim() || undefined,
      });
      savePendingContext({
        source: "tool",
        summary:
          `我刚刚完整做了一轮「${tool.name}」（${isCompleted ? "完成" : "中途停下"}）` +
          `${helpfulness ? `，觉得对自己${helpfulness <= 2 ? "帮助有限" : helpfulness <= 4 ? "有些帮助" : "挺有帮助"}。` : "。"}` +
          `我想和小酷聊聊这次练习时的感受，并结合它看看可以怎么照顾自己。练习内容是自助工具，不替代专业支持。`,
      });
    }
    onXiaoku();
  };

  // 强度刻度条
  return (
    <div className="space-y-5">
      {/* 主卡片 */}
      <div className="bg-white/80 rounded-3xl p-6 space-y-5 border border-[#E8DCD6]/50">
        {isCompleted ? (
          <>
            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-[var(--qm-purple-100)]/70 flex items-center justify-center">
                <span className="text-2xl">🌿</span>
              </div>
              <h2 className="text-lg font-medium text-[#4A4A4A]">
                这一轮结束了
              </h2>
              <p className="text-sm text-[#6B5B52] leading-relaxed">
                你不需要马上判断它有没有用。
                <br />
                有时候只是多了一个选项，就已经够了。
              </p>
            </div>

            {/* 完成提示 */}
            <div className="bg-[#FAF5F2] rounded-xl p-4">
              <p className="text-sm text-[#6B5B52] leading-relaxed">
                {tool.completion_message}
              </p>
            </div>

            {/* 可选自评 */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#B5A8A3]">可选自评</span>
                <div className="flex-1 h-px bg-[#E8DFDA]" />
              </div>

              <IntensitySlider
                value={beforeIntensity}
                onChange={setBeforeIntensity}
                label="开始前的强度（0-10）"
              />

              <IntensitySlider
                value={afterIntensity}
                onChange={setAfterIntensity}
                label="现在的强度（0-10）"
              />

              {/* 帮助程度 */}
              <div className="space-y-2">
                <p className="text-xs text-[#6B5B52]">对你有帮助吗？</p>
                <div className="flex flex-wrap gap-2">
                  {HELPFULNESS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setHelpfulness(opt.value)}
                      className={`px-3 py-1.5 text-xs rounded-full transition-all min-h-[36px] ${
                        helpfulness === opt.value
                          ? "bg-[var(--qm-purple-400)] text-white"
                          : "bg-white/70 text-[#6B5B52] border border-[#E8DCD6] hover:bg-white"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 开放备注 */}
              <div className="space-y-2">
                <p className="text-xs text-[#6B5B52]">想说点什么？（可跳过）</p>
                <textarea
                  value={userNote}
                  onChange={(e) => setUserNote(e.target.value)}
                  placeholder="任何感受、想法，都可以写在这里..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-[#E8DFDA] bg-white/50 text-[#4A4A4A] placeholder-[#B5A8A3] resize-none focus:outline-none focus:border-[var(--qm-purple-400)]/40 focus:ring-4 focus:ring-[var(--qm-purple-400)]/10 transition-all text-sm leading-relaxed"
                />
                <p className="text-xs text-[#C9BDB5]">
                  Enter 换行 · 只保存在你的设备上
                </p>
              </div>
            </div>

            {/* 保存按钮 */}
            <button
              onClick={handleSave}
              disabled={saved}
              className="w-full py-3.5 bg-[var(--qm-purple-600)] text-white hover:bg-[var(--qm-purple-700)] font-medium rounded-2xl hover:shadow-lg hover:shadow-[var(--qm-purple-400)]/20 transition-all disabled:opacity-60 min-h-[44px]"
            >
              {saved ? "已记录 ✨" : saveFailed ? "没保存上，点这里重试" : "记录这一次"}
            </button>
            {saveFailed && !saved && (
              <p className="text-xs text-[#DC2626] text-center">
                没能保存到本机（可能是隐私模式或存储空间不足）。你的练习本身不受影响，可以直接继续。
              </p>
            )}

            {/* 分享到小酷 */}
            <div className="flex items-start gap-3 p-3 bg-[#F5F0FF]/50 rounded-xl">
              <input
                type="checkbox"
                id="share-xiaoku"
                checked={shareWithXiaoku}
                onChange={(e) => setShareWithXiaoku(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-[#D4C4BC] text-[var(--qm-purple-400)] focus:ring-[var(--qm-purple-400)]/30"
              />
              <label htmlFor="share-xiaoku" className="text-xs text-[#6B5B52] leading-relaxed cursor-pointer">
                让小酷知道我用了这个工具（只传工具名和完成状态，不传你写的内容，除非你主动选择分享）
              </label>
            </div>
          </>
        ) : (
          // 停止模式
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-[var(--qm-purple-400)]/10 flex items-center justify-center">
              <span className="text-2xl">🤍</span>
            </div>
            <h2 className="text-lg font-medium text-[#4A4A4A]">
              你选择在这里停下来
            </h2>
            <p className="text-sm text-[#6B5B52] leading-relaxed">
              这个决定本身也是在照顾自己的界限。
              <br />
              你不需要为没有做完而抱歉。
            </p>
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="space-y-2">
        {isCompleted ? (
          <>
            <button
              onClick={handleGoXiaoku}
              className="w-full py-3.5 bg-[var(--qm-purple-600)] text-white hover:bg-[var(--qm-purple-700)] font-medium rounded-2xl hover:shadow-lg hover:shadow-[var(--qm-purple-400)]/20 transition-all min-h-[44px]"
            >
              找小酷聊聊
            </button>
            <div className="flex gap-2">
              <button
                onClick={onShorterTool}
                className="flex-1 py-3 bg-white/70 text-[#6B5B52] text-sm font-medium rounded-2xl border border-[#E8DCD6] hover:bg-white transition-all min-h-[44px]"
              >
                换一个
              </button>
              <button
                onClick={onHistory}
                className="flex-1 py-3 bg-white/70 text-[#6B5B52] text-sm font-medium rounded-2xl border border-[#E8DCD6] hover:bg-white transition-all min-h-[44px]"
              >
                看看历史
              </button>
              <button
                onClick={onHome}
                className="flex-1 py-3 bg-white/70 text-[#6B5B52] text-sm font-medium rounded-2xl border border-[#E8DCD6] hover:bg-white transition-all min-h-[44px]"
              >
                回到首页
              </button>
            </div>
          </>
        ) : (
          <>
            <button
              onClick={onShorterTool}
              className="w-full py-3.5 bg-[var(--qm-purple-600)] text-white hover:bg-[var(--qm-purple-700)] font-medium rounded-2xl hover:shadow-lg hover:shadow-[var(--qm-purple-400)]/20 transition-all min-h-[44px]"
            >
              换一个更短的
            </button>
            <div className="flex gap-2">
              <button
                onClick={handleGoXiaoku}
                className="flex-1 py-3 bg-white/70 text-[#6B5B52] text-sm font-medium rounded-2xl border border-[#E8DCD6] hover:bg-white transition-all min-h-[44px]"
              >
                找小酷聊聊
              </button>
              <button
                onClick={onHome}
                className="flex-1 py-3 bg-white/70 text-[#6B5B52] text-sm font-medium rounded-2xl border border-[#E8DCD6] hover:bg-white transition-all min-h-[44px]"
              >
                回到首页
              </button>
            </div>
          </>
        )}
      </div>

      {/* 危机提示 */}
      <div className="text-center text-xs text-[#C9BDB5]">
        如遇危机请拨打 QM 心理援助热线：
        <span className="text-[#FC8181] font-medium">15001930070</span>
      </div>
    </div>
  );
}
