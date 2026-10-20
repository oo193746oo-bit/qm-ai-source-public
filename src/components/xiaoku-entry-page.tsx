"use client";

/**
 * 小酷介绍页（v7.1）
 * - ENTRY 状态：无历史、未开始时展示
 * - 主按钮「开始对话」→ startXiaoku()（本地插入固定首句，不调用 LLM）
 * - 有历史时显示「继续上次对话」
 * - 辅助入口「找小雪」→ 跳转预约
 * - 桌面端内容宽度 640–720px 居中；手机端 20px 边距、按钮全宽
 */

import { Sidebar } from "./sidebar";

interface XiaokuEntryPageProps {
  hasHistory: boolean;
  onStart: () => void;
  onFindXiaoxue: () => void;
  onLogoClick: () => void;
  sidebarOpen: boolean;
  onCloseSidebar: () => void;
  sidebarCollapsed: boolean;
  onToggleCollapse: () => void;
}

const FEATURES = [
  { icon: "🌿", title: "不急着定义你", desc: "不需要先给问题贴上标签" },
  { icon: "💬", title: "从很小的事开始", desc: "一句话、一个心情都可以" },
  { icon: "🔒", title: "记录只在本地", desc: "POC 阶段不上传、不跨设备" },
];

export function XiaokuEntryPage({
  hasHistory,
  onStart,
  onFindXiaoxue,
  onLogoClick,
  sidebarOpen,
  onCloseSidebar,
  sidebarCollapsed,
  onToggleCollapse,
}: XiaokuEntryPageProps) {
  return (
    <div className="min-h-dvh flex" style={{ background: "var(--qm-gradient-soft)" }}>
      <Sidebar
        isOpen={sidebarOpen}
        onClose={onCloseSidebar}
        collapsed={sidebarCollapsed}
        onToggleCollapse={onToggleCollapse}
        onLogoClick={onLogoClick}
        onStartXiaoku={onStart}
        forceActiveId="chat"
      />

      <div
        className={`
          flex-1 flex flex-col items-center justify-center
          min-h-dvh px-5 py-10
          ${sidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-60"} `}
      >
        <div
          className="w-full"
          style={{ maxWidth: "680px" }}
        >
          {/* 头像 */}
          <div className="flex justify-center mb-6">
            <div
              className="w-20 h-20 md:w-24 md:h-24 rounded-3xl qm-xiaoku-avatar flex items-center justify-center shadow-lg"
            >
              <svg
                width="44"
                height="44"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="9" cy="11" r="1.4" fill="white" />
                <circle cx="15" cy="11" r="1.4" fill="white" />
                <path d="M9 15c1 1 2 1.5 3 1.5s2-.5 3-1.5" />
              </svg>
            </div>
          </div>

          {/* 标题 */}
          <h1
            className="text-center font-semibold text-[var(--qm-ink-800)] mb-4"
            style={{ fontSize: "clamp(24px, 5vw, 30px)", lineHeight: 1.3 }}
          >
            和小酷聊聊
          </h1>

          {/* 说明 */}
          <p
            className="text-center text-[var(--qm-ink-600)] mx-auto mb-8"
            style={{
              fontSize: "clamp(16px, 2.4vw, 17px)",
              lineHeight: 1.7,
              maxWidth: "560px",
            }}
          >
            小酷是你的心理陪伴与探索伙伴。你可以从最近发生的一件事开始，也可以只是随便说说。这里不要求你先把问题想清楚。
          </p>

          {/* 三个特点 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-9">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-white/70 border border-[var(--qm-line-100)] rounded-2xl p-4 text-center"
              >
                <div className="text-2xl mb-2">{f.icon}</div>
                <p className="text-sm font-medium text-[var(--qm-ink-800)] mb-1">{f.title}</p>
                <p className="text-xs text-[var(--qm-ink-500)] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* 主按钮 */}
          <div className="space-y-3" style={{ maxWidth: "360px", margin: "0 auto" }}>
            <button
              onClick={onStart}
              className="w-full text-white font-medium rounded-2xl transition-all duration-200 hover:bg-[#62428B] active:scale-[0.99]"
              style={{
                background: "#6B4C9A",
                minHeight: "52px",
                fontSize: "16px",
              }}
            >
              {hasHistory ? "继续上次对话" : "开始对话"}
            </button>

            <button
              onClick={onFindXiaoxue}
              className="w-full bg-white/80 border border-[var(--qm-line-200)] text-[var(--qm-ink-700)] font-medium rounded-2xl hover:bg-[var(--qm-surface-25)] transition-colors"
              style={{ minHeight: "48px", fontSize: "15px" }}
            >
              找心理师
            </button>
          </div>

          <p className="text-xs text-[var(--qm-ink-500)] text-center mt-8 leading-relaxed max-w-md mx-auto">
            QM AI 不能替代专业心理咨询。如果你正经历危机，请拨打 15001930070（备 13601658763）
          </p>
        </div>
      </div>
    </div>
  );
}

export default XiaokuEntryPage;
