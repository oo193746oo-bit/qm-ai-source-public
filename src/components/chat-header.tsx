"use client";

import { useState } from "react";

interface ChatHeaderProps {
  currentAI: "xiaoku" | "xiaoxue";
  onBackHome: () => void;
  onSwitchAI?: () => void;
  /** 新建对话（清空并回到入口页）。不传则不显示该按钮 */
  onNewChat?: () => void;
}

// 小酷头像（小尺寸）- Human Connection 色系
function XiaokuIcon({ size = 28 }: { size?: number }) {
  return (
    <div
      className="rounded-xl qm-xiaoku-avatar flex items-center justify-center flex-shrink-0 shadow-sm"
      style={{ width: size, height: size }}
    >
      <svg
        width={size * 0.5}
        height={size * 0.5}
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="9" cy="11" r="1.2" fill="white" />
        <circle cx="15" cy="11" r="1.2" fill="white" />
        <path d="M9 15c1 1 2 1.5 3 1.5s2-.5 3-1.5" />
      </svg>
    </div>
  );
}

// 小雪头像（小尺寸）- Tech Focus 色系
function XiaoxueIcon({ size = 28 }: { size?: number }) {
  return (
    <div
      className="rounded-xl qm-xiaoxue-avatar flex items-center justify-center flex-shrink-0 shadow-sm"
      style={{ width: size, height: size }}
    >
      <svg
        width={size * 0.5}
        height={size * 0.5}
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3v18M3 12h18M6 6l12 12M18 6L6 18" />
      </svg>
    </div>
  );
}

function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function SwitchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 1l4 4-4 4" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <path d="M7 23l-4-4 4-4" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function ChatHeader({ currentAI, onBackHome, onSwitchAI, onNewChat }: ChatHeaderProps) {
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const isXiaoku = currentAI === "xiaoku";
  const otherAI = isXiaoku ? "小雪" : "小酷";
  const otherAIrole = isXiaoku ? "预约引导与行政助理" : "心理陪伴与探索伙伴";

  return (
    <>
      <header
        className={`
          flex items-center justify-between
          px-4 md:px-6
          py-3 md:py-4
          qm-header-glass
          sticky top-0 z-20
          min-h-[56px] md:min-h-[64px] `}
        style={{
          paddingTop: `calc(12px + env(safe-area-inset-top, 0px))`,
        }}
      >
        {/* 左侧：返回首页 + 新对话 */}
        <div className="flex items-center gap-1">
          <button
            onClick={onBackHome}
            className="flex items-center gap-2 px-2 md:px-3 py-2 rounded-xl hover:bg-[var(--qm-surface-100)] transition-colors text-[var(--qm-ink-600)] min-h-[44px] min-w-[44px] justify-center"
            aria-label="返回首页"
          >
            <HomeIcon />
            <span className="text-sm font-medium hidden sm:inline">首页</span>
          </button>
          {onNewChat && (
            <button
              onClick={onNewChat}
              className="flex items-center gap-2 px-2 md:px-3 py-2 rounded-xl hover:bg-[var(--qm-surface-100)] transition-colors text-[var(--qm-ink-600)] min-h-[44px] min-w-[44px] justify-center"
              aria-label="新对话"
              title="清空当前对话，重新开始"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span className="text-sm font-medium hidden md:inline">新对话</span>
            </button>
          )}
        </div>

        {/* 中间：当前AI */}
        <div className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
          {isXiaoku ? <XiaokuIcon size={32} /> : <XiaoxueIcon size={32} />}
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-[var(--qm-ink-800)] leading-tight">
              {isXiaoku ? "小酷" : "小雪"}
            </p>
            <p className="text-xs text-[var(--qm-ink-500)] leading-tight">
              {isXiaoku ? "心理陪伴与探索伙伴" : "预约引导与行政助理"}
            </p>
          </div>
          <span className="text-sm font-medium text-[var(--qm-ink-800)] sm:hidden">
            {isXiaoku ? "小酷" : "小雪"}
          </span>
        </div>

        {/* 右侧：切换AI */}
        {onSwitchAI && <button
          onClick={() => setShowBottomSheet(true)}
          className="flex items-center gap-2 px-2 md:px-3 py-2 rounded-xl hover:bg-[var(--qm-surface-100)] transition-colors text-[var(--qm-ink-600)] min-h-[44px] min-w-[44px] justify-center relative z-10"
          aria-label={`切换到${otherAI}`}
        >
          <SwitchIcon />
          <span className="text-sm font-medium hidden md:inline">
            切换到{otherAI}
          </span>
        </button>}
      </header>

      {/* 遮罩 + Bottom Sheet */}
      {onSwitchAI && showBottomSheet && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowBottomSheet(false)}
          />
          <div
            className={`
              bg-white
              p-6 pb-8
              max-h-[70vh] overflow-y-auto
              animate-slide-up
              /* Mobile 默认 */
              absolute bottom-0 left-0 right-0 rounded-t-3xl
              /* Desktop 右上角弹层 */
              md:top-[64px] md:right-4 md:left-auto md:bottom-auto
              md:max-w-[360px] md:w-[360px]
              md:rounded-2xl md:animate-fade-in
              shadow-xl `}
          >
            {/* 移动端拖动手柄 */}
            <div className="w-10 h-1 bg-[var(--qm-line-200)] rounded-full mx-auto mb-5 md:hidden" />

            <button
              onClick={() => setShowBottomSheet(false)}
              className="absolute top-4 right-4 p-2 text-[var(--qm-ink-500)] hover:text-[var(--qm-ink-700)] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="关闭"
            >
              <CloseIcon />
            </button>

            <h3 className="text-lg font-semibold text-[var(--qm-ink-800)] mb-1 text-center">
              你现在想做什么？
            </h3>
            <p className="text-xs text-[var(--qm-ink-500)] text-center mb-6">
              小酷和小雪各有专长，可以随时切换
            </p>

            <div className="space-y-3">
              {/* 继续当前AI */}
              <button
                onClick={() => setShowBottomSheet(false)}
                className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:transition-colors text-left min-h-[56px]"
                style={{
                  background: isXiaoku ? "var(--qm-purple-50)" : "var(--qm-indigo-100)",
                  border: `1px solid ${isXiaoku ? "var(--qm-purple-200)" : "var(--qm-indigo-500)/30"}`,
                }}
              >
                {isXiaoku ? <XiaokuIcon size={40} /> : <XiaoxueIcon size={40} />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--qm-ink-800)]">
                    继续找{isXiaoku ? "小酷" : "小雪"}聊聊
                  </p>
                  <p className="text-xs text-[var(--qm-ink-500)] mt-0.5">
                    {isXiaoku ? "心理陪伴与探索伙伴" : "预约引导与行政助理"}
                  </p>
                </div>
              </button>

              {/* 切换到另一位AI */}
              <button
                onClick={() => {
                  setShowBottomSheet(false);
                  onSwitchAI();
                }}
                className="w-full flex items-center gap-4 px-4 py-4 bg-white border border-[var(--qm-line-100)] rounded-2xl hover:bg-[var(--qm-surface-25)] transition-colors text-left min-h-[56px]"
              >
                {isXiaoku ? <XiaoxueIcon size={40} /> : <XiaokuIcon size={40} />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--qm-ink-800)]">
                    切换到{otherAI}
                  </p>
                  <p className="text-xs text-[var(--qm-ink-500)] mt-0.5">
                    {otherAIrole}
                  </p>
                </div>
                <svg className="w-4 h-4 text-[var(--qm-ink-500)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <p className="text-xs text-[var(--qm-ink-500)] text-center mt-6 leading-relaxed">
              切换后当前对话会保留。经你授权后，可将必要摘要带到另一位AI。
            </p>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slideUp 240ms cubic-bezier(.2,.8,.2,1);
        }
        .animate-fade-in {
          animation: fadeIn 200ms cubic-bezier(.2,.8,.2,1);
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-slide-up, .animate-fade-in { animation: none; }
        } `}</style>
    </>
  );
}

export default ChatHeader;
