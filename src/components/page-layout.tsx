"use client";

import { useState } from "react";
import { Sidebar, MenuButton } from "./sidebar";

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  showBack?: boolean;
  /** 可选：向根容器追加类名以覆盖默认背景（如批次D视觉背景），默认不传保持渐变底 */
  bodyClassName?: string;
}

export function PageLayout({ title, subtitle, children, showBack, bodyClassName }: PageLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div
      className={"qm-has-unified-desktop-nav min-h-dvh " + (bodyClassName ?? "")}
      style={bodyClassName ? undefined : { background: "var(--qm-gradient-soft)" }}
    >
      {/* 侧栏：Mobile抽屉 / Desktop常驻（纯CSS控制） */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
      />

      {/* 主区域：Desktop端左侧预留侧栏空间（纯CSS，lg:前缀） */}
      <div
        className={`
          min-h-dvh
          ${sidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-60"} `}
      >
        {/* 顶部导航 - sticky */}
        <header
          className={`
            sticky top-0 z-30 flex items-center gap-3
            px-4 py-3
            md:px-6 md:py-4
            qm-header-glass
            min-h-[56px] md:min-h-[64px] `}
          style={{
            paddingTop: `calc(12px + env(safe-area-inset-top, 0px))`,
          }}
        >
          <MenuButton onClick={() => setSidebarOpen(true)} />

          <div className="flex-1 min-w-0">
            <h1 className="text-sm md:text-base font-medium text-[var(--qm-ink-800)] truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-[var(--qm-ink-500)] truncate hidden sm:block">
                {subtitle}
              </p>
            )}
          </div>

          {showBack && (
            <button
              onClick={() => window.history.back()}
              className="p-2 rounded-full hover:bg-[var(--qm-surface-100)] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--qm-ink-600)]"
              aria-label="返回"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
        </header>

        {/* 跳转到主内容（无障碍） */}
        <a
          href="#qm-main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-white focus:text-[var(--qm-ink-800)] focus:text-sm focus:shadow-md"
        >
          跳到主要内容
        </a>

        {/* 主内容 */}
        <main
          id="qm-main"
          className={`
            px-4 py-6
            md:px-6 md:py-8
            max-w-2xl
            md:max-w-2xl
            lg:max-w-4xl
            xl:max-w-5xl
            2xl:max-w-[1280px]
            mx-auto `}
        >
          {children}
        </main>

        {/* 法律入口；源码身份留在交付证据，不向访客展示旧工程版本。 */}
        <footer className="text-center py-4 text-[10px] text-[var(--qm-ink-400)] select-none">
          <div className="mb-2">
            <a href="/privacy" className="hover:text-[var(--qm-ink-600)] mx-2">隐私政策</a>
            <a href="/terms" className="hover:text-[var(--qm-ink-600)] mx-2">用户协议</a>
            <a href="/disclaimer" className="hover:text-[var(--qm-ink-600)] mx-2">免责声明</a>
            <a href="/data-deletion" className="hover:text-[var(--qm-ink-600)] mx-2">数据留存与删除</a>
          </div>
        </footer>

        {/* 底部安全区占位 */}
        <div className="safe-bottom-pad" aria-hidden="true" />
      </div>
    </div>
  );
}

export default PageLayout;
