// QM 自助工具 v3.0 - Quick Match 组件
// 不是测评，不打分，不诊断。6-8 题轻量匹配。

import { useState } from "react";
import { useQuickMatch } from "@/hooks/use-tools";
import { recommendTools, quickMatchAnswersToContext } from "@/lib/tools/recommend";
import type { ToolRecommendation } from "@/lib/tools/types";

interface QuickMatchProps {
  onComplete: (recommendations: ToolRecommendation[]) => void;
  onBack: () => void;
  onXiaoku: () => void;
}

export function QuickMatch({ onComplete, onBack, onXiaoku }: QuickMatchProps) {
  const qm = useQuickMatch();
  const [freeText, setFreeText] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [results, setResults] = useState<ToolRecommendation[]>([]);

  const handleFinish = () => {
    // 最后一题也保存当前free text
    const finalAnswers = [...qm.answers];
    if (freeText.trim()) {
      finalAnswers[qm.currentIndex] = {
        ...finalAnswers[qm.currentIndex],
        free_text: freeText,
      };
    }
    const ctx = quickMatchAnswersToContext(finalAnswers);
    const recs = recommendTools(ctx, { topN: 3 });
    setResults(recs);
    setShowResult(true);
  };

  const handleNext = () => {
    // 保存当前free text到answers
    if (freeText.trim()) {
      qm.setFreeText(freeText);
    }
    qm.next();
    setFreeText("");
  };

  const handleSkip = () => {
    setFreeText("");
    qm.skip();
  };

  if (showResult) {
    return (
      <div className="space-y-6">
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

        <div className="bg-white/70 rounded-3xl p-6 space-y-4 border border-[#E8DCD6]/50">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-[var(--qm-purple-100)] flex items-center justify-center">
              <span className="text-xl">✨</span>
            </div>
            <h2 className="text-lg font-medium text-[#4A4A4A]">给你找了几个工具</h2>
            <p className="text-sm text-[#9B8E8A]">
              这不是诊断或测评，只是基于你刚才说的，挑了几个可能适合此刻的。
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {results.map((rec, idx) => (
            <button
              key={rec.tool.tool_id}
              onClick={() => onComplete(results)}
              className="w-full text-left bg-white rounded-2xl p-5 shadow-sm border border-[#F0E8E3] hover:border-[var(--qm-purple-400)]/30 hover:shadow-md transition-all group min-h-[44px]"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[var(--qm-purple-100)]/70 flex items-center justify-center flex-shrink-0 text-sm font-medium text-[#7C3AED]">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-medium text-[#4A4A4A] group-hover:text-[#7C3AED] transition-colors">
                    {rec.tool.name}
                  </h3>
                  <p className="text-sm text-[#9B8E8A] mt-1">{rec.reason}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-[#B5A8A3]">
                    <span>约{rec.tool.time_estimate_min}分钟</span>
                    <span>·</span>
                    <span>{rec.tool.category_name}</span>
                  </div>
                </div>
                <svg
                  className="w-5 h-5 text-[#C9B8B0] group-hover:text-[var(--qm-purple-400)] transition-colors flex-shrink-0 mt-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </button>
          ))}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => onComplete(results)}
            className="flex-1 py-3.5 bg-[var(--qm-purple-600)] text-white hover:bg-[var(--qm-purple-700)] font-medium rounded-2xl hover:shadow-lg hover:shadow-[var(--qm-purple-400)]/20 transition-all min-h-[44px]"
          >
            从第一个开始
          </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="flex-1 py-3 bg-white/70 text-[#6B5B52] text-sm font-medium rounded-2xl border border-[#E8DCD6] hover:bg-white transition-all min-h-[44px]"
          >
            自己重新选
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

  const current = qm.currentQuestion;
  const selected = qm.answers[qm.currentIndex]?.selected_options || [];

  return (
    <div className="space-y-6">
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

      {/* 进度条 */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-[#9B8B83]">
          <span>轻量匹配</span>
          <span>
            第 {qm.currentIndex + 1}/{qm.totalQuestions} 题 · {qm.remainingText}
          </span>
        </div>
        <div className="h-1 bg-[#E8DCD6] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--qm-purple-600)] rounded-full transition-all duration-300"
            style={{ width: `${qm.progress}%` }}
          />
        </div>
      </div>

      {/* 问题 */}
      <div className="bg-white/70 rounded-3xl p-6 space-y-5 border border-[#E8DCD6]/50">
        <h2 className="text-lg font-medium text-[#4A4A4A] leading-snug">
          {current.question}
        </h2>

        {/* 选项 */}
        <div className="space-y-2">
          {current.options.map((opt) => {
            const isSelected = selected.includes(opt);
            return (
              <button
                key={opt}
                onClick={() => qm.selectOption(opt)}
                className={`w-full text-left px-5 py-3.5 rounded-2xl transition-all duration-200 text-sm leading-relaxed min-h-[44px] ${
                  isSelected
                    ? "bg-[var(--qm-purple-100)] border-2 border-[var(--qm-purple-400)] text-[#5A4A6A]"
                    : "bg-white/70 border border-[#E8DCD6] text-[#6B5B52] hover:bg-white hover:border-[#D4C4BC]"
                }`}
              >
                <div className="flex items-center gap-3">
                  {current.multi ? (
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        isSelected
                          ? "bg-[var(--qm-purple-600)] border-transparent"
                          : "border-[#D4C4BC]"
                      }`}
                    >
                      {isSelected && (
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                  ) : (
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        isSelected
                          ? "border-[var(--qm-purple-400)]"
                          : "border-[#D4C4BC]"
                      }`}
                    >
                      {isSelected && (
                        <div className="w-2.5 h-2.5 rounded-full bg-[var(--qm-purple-600)]" />
                      )}
                    </div>
                  )}
                  <span className="flex-1">{opt}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* 开放输入 */}
        <div className="pt-1">
          <p className="text-xs text-[#B5A8A3] mb-2">想说更多？（可选）</p>
          <textarea
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            placeholder="可以写几句话描述你现在的情况..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-[#E8DFDA] bg-white/50 text-[#4A4A4A] placeholder-[#B5A8A3] resize-none focus:outline-none focus:border-[var(--qm-purple-400)]/40 focus:ring-4 focus:ring-[var(--qm-purple-400)]/10 transition-all text-sm leading-relaxed"
          />
          <p className="text-xs text-[#C9BDB5] mt-2">
            Enter 换行 · 内容只在你本地使用
          </p>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-3">
        {qm.currentIndex > 0 && (
          <button
            onClick={() => {
              setFreeText("");
              qm.prev();
            }}
            className="px-6 py-3.5 bg-white/70 text-[#9B8B83] font-medium rounded-2xl border border-[#E8DCD6] hover:bg-white transition-all text-sm min-h-[44px]"
          >
            上一题
          </button>
        )}
        <button
          onClick={handleSkip}
          className="flex-1 py-3.5 bg-white/70 text-[#9B8B83] font-medium rounded-2xl border border-[#E8DCD6] hover:bg-white transition-all text-sm min-h-[44px]"
        >
          跳过
        </button>
        <button
          onClick={qm.isLast ? handleFinish : handleNext}
          disabled={!current.multi && selected.length === 0 && !freeText.trim()}
          className="flex-1 py-3.5 bg-[var(--qm-purple-600)] text-white hover:bg-[var(--qm-purple-700)] font-medium rounded-2xl hover:shadow-lg hover:shadow-[var(--qm-purple-400)]/20 transition-all text-sm disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
        >
          {qm.isLast ? "看看结果" : "下一题"}
        </button>
      </div>

      <p className="text-xs text-[#C9BDB5] text-center leading-relaxed">
        这不是心理测评，不会给你打分或贴标签。
        <br />
        只是帮你更快找到此刻可能用得上的工具。
      </p>
    </div>
  );
}
