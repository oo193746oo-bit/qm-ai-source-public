// QM 自助工具 v3.0 - 工具进行页组件
// 一次只显示一个步骤。顶部：返回/暂停|工具名|步骤X/Y|剩余时间

import { useState, useEffect, useRef, useCallback } from "react";
import type { Tool } from "@/lib/tools/types";
import { FastModeBanner } from "./fast-mode-banner";

interface ToolPlayerProps {
  tool: Tool;
  onComplete: () => void;
  onStop: () => void;
  onBack: () => void;
  onXiaoku: () => void;
  onPause: () => void;
  source?: "xiaoku" | "tools_home" | "quick_match" | "library" | "history";
}

export function ToolPlayer({
  tool,
  onComplete,
  onStop,
  onBack,
  onXiaoku,
  onPause,
  source = "tools_home",
}: ToolPlayerProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [fastMode, setFastMode] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSteps = tool.steps.length;

  // 计时器
  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setElapsedSec((s) => s + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused]);

  // 预估剩余时间（分钟）
  const estimatedRemainingMin = useCallback(() => {
    const totalMin = tool.time_estimate_min;
    const progress = (currentStep + 1) / totalSteps;
    const remaining = Math.max(0, totalMin * (1 - progress));
    if (fastMode) return Math.max(1, Math.ceil(remaining * 0.3));
    return Math.ceil(remaining);
  }, [tool.time_estimate_min, currentStep, totalSteps, fastMode]);

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  };

  const handlePause = () => {
    setIsPaused(true);
    onPause();
  };

  const handleResume = () => {
    setIsPaused(false);
  };

  const handleFastMode = () => {
    setFastMode(true);
  };

  const handleFastEnd = () => {
    // 30秒结束版：直接跳到最后一步
    setCurrentStep(totalSteps - 1);
    setFastMode(false);
  };

  // 当前步骤引导语（从mid_guidance_pool中随机选一条，用step index做种子）
  const getMidGuidance = () => {
    const pool = tool.mid_guidance_pool;
    if (pool.length === 0) return "";
    const idx = currentStep % pool.length;
    return pool[idx];
  };

  // FAST MODE 简化步骤列表
  const getFastSteps = () => {
    // FAST MODE 只显示第1步、中间1步、最后1步
    if (totalSteps <= 3) return tool.steps;
    const first = tool.steps[0];
    const middle = tool.steps[Math.floor(totalSteps / 2)];
    const last = tool.steps[totalSteps - 1];
    return [first, middle, last];
  };

  const displaySteps = fastMode ? getFastSteps() : tool.steps;
  const displayCurrent = fastMode
    ? Math.min(currentStep, displaySteps.length - 1)
    : currentStep;
  const currentStepData = displaySteps[displayCurrent];

  // 暂停遮罩
  if (isPaused) {
    return (
      <div className="space-y-5">
        <div className="bg-white/80 rounded-3xl p-8 text-center space-y-4 border border-[#E8DCD6]/50">
          <div className="w-16 h-16 mx-auto rounded-full bg-[var(--qm-purple-400)]/10 flex items-center justify-center">
            <span className="text-2xl">⏸️</span>
          </div>
          <h2 className="text-lg font-medium text-[#4A4A4A]">已暂停</h2>
          <p className="text-sm text-[#9B8E8A]">
            你可以随时继续。已经用了 {Math.floor(elapsedSec / 60)}分{elapsedSec % 60}秒。
          </p>
          <div className="space-y-2 pt-2">
            <button
              onClick={handleResume}
              className="w-full py-3.5 bg-[var(--qm-purple-600)] text-white hover:bg-[var(--qm-purple-700)] font-medium rounded-2xl hover:shadow-lg transition-all min-h-[44px]"
            >
              继续练习
            </button>
            <button
              onClick={onStop}
              className="w-full py-3.5 bg-white text-[#6B5B52] text-sm font-medium rounded-2xl border border-[#E8DCD6] hover:bg-[#FAF5F2] transition-all min-h-[44px]"
            >
              今天就到这里
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          onClick={handlePause}
          className="text-sm text-[#9B8E8A] hover:text-[#6B5F5A] min-h-[44px] px-2"
        >
          暂停
        </button>
      </div>

      {/* 进度信息 */}
      <div className="text-center space-y-2">
        <p className="text-xs text-[#B5A8A3]">{tool.name}</p>
        <div className="flex items-center justify-center gap-3 text-sm text-[#6B5B52]">
          <span>
            步骤 {displayCurrent + 1}/{displaySteps.length}
          </span>
          <span className="text-[#D4C4BC]">·</span>
          <span>剩余约{estimatedRemainingMin()}分钟</span>
        </div>
        {/* 进度条 */}
        <div className="w-full max-w-md mx-auto h-1 bg-[#E8DCD6] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--qm-purple-600)] rounded-full transition-all duration-300"
            style={{
              width: `${((displayCurrent + 1) / displaySteps.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* FAST MODE 横幅 */}
      {fastMode && (
        <FastModeBanner
          onFastEnd={handleFastEnd}
          onPause={handlePause}
          onExit={onStop}
          onXiaoku={onXiaoku}
        />
      )}

      {/* 步骤内容 */}
      <div className="bg-white/80 rounded-3xl p-6 md:p-8 border border-[#E8DCD6]/50 min-h-[240px] flex flex-col justify-center">
        <div className="text-center space-y-4 max-w-xl mx-auto">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[var(--qm-purple-100)]/70 flex items-center justify-center">
            <span className="text-xl font-medium text-[#7C3AED]">
              {displayCurrent + 1}
            </span>
          </div>
          <p className="text-lg md:text-xl text-[#4A4A4A] leading-relaxed">
            {currentStepData?.instruction}
          </p>
        </div>
      </div>

      {/* 中途引导语 */}
      {getMidGuidance() && (
        <div className="text-center">
          <p className="text-sm text-[#9B8E8A] italic leading-relaxed">
            {getMidGuidance()}
          </p>
        </div>
      )}

      {/* 主操作按钮 */}
      <div className="flex gap-3">
        {displayCurrent > 0 ? (
          <button
            onClick={handlePrev}
            className="flex-1 py-3.5 bg-white/70 text-[#6B5B52] font-medium rounded-2xl border border-[#E8DCD6] hover:bg-white transition-all min-h-[44px]"
          >
            上一步
          </button>
        ) : (
          <div className="flex-1" />
        )}
        <button
          onClick={handleNext}
          className="flex-1 py-3.5 bg-[var(--qm-purple-600)] text-white hover:bg-[var(--qm-purple-700)] font-medium rounded-2xl hover:shadow-lg hover:shadow-[var(--qm-purple-400)]/20 transition-all min-h-[44px]"
        >
          {displayCurrent === displaySteps.length - 1 ? "完成" : "下一步"}
        </button>
      </div>

      {/* 次级操作 */}
      <div className="flex flex-wrap gap-2 justify-center">
        {!fastMode && (
          <button
            onClick={handleFastMode}
            className="px-4 py-2 text-xs text-[#9B8E8A] hover:text-[#6B5F5A] transition-colors min-h-[40px]"
          >
            太长了，快一点
          </button>
        )}
        <button
          onClick={handlePause}
          className="px-4 py-2 text-xs text-[#9B8E8A] hover:text-[#6B5F5A] transition-colors min-h-[40px]"
        >
          暂停
        </button>
        <button
          onClick={onStop}
          className="px-4 py-2 text-xs text-[#9B8E8A] hover:text-[#6B5F5A] transition-colors min-h-[40px]"
        >
          退出
        </button>
        <button
          onClick={onXiaoku}
          className="px-4 py-2 text-xs text-[var(--qm-purple-400)] hover:text-[#7C3AED] transition-colors min-h-[40px]"
        >
          找小酷
        </button>
      </div>

      {/* 安全提示 */}
      <div className="text-center text-xs text-[#C9BDB5] pt-2">
        如感到不适可随时停止。危机请拨打：
        <span className="text-[#FC8181] font-medium">15001930070</span>
      </div>
    </div>
  );
}
