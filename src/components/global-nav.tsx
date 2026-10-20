"use client";

import Link from "next/link";
import { useState } from "react";
import { Sidebar } from "./sidebar";

/**
 * 全站统一顶部导航。
 * 所有独立页面（关于QM/知识库/心理测评/MBTI/成人ADHD/隐私/条款/自助工具等）共用。
 * 左侧：☰ 菜单 + 🏠 首页
 * 中间：当前页面标题
 * 右侧：💬 和小酷聊聊（直达自由对话）
 */
export function GlobalNav({
  title,
  showBack = false,
  rightSlot,
}: {
  title?: string;
  showBack?: boolean;
  rightSlot?: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <header
        className="sticky top-0 z-30 flex items-center gap-2 px-4 py-3 bg-white/70 backdrop-blur-sm border-b"
        style={{ borderColor: "#E8DFDA" }}
      >
        {/* 菜单 */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-full hover:bg-[#F0E8E3] transition-colors shrink-0"
          aria-label="打开菜单"
        >
          <svg className="w-5 h-5" fill="none" stroke="#6B5F5A" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* 返回（可选） */}
        {showBack && (
          <button
            onClick={() => window.history.back()}
            className="p-2 rounded-full hover:bg-[#F0E8E3] transition-colors shrink-0"
            aria-label="返回"
          >
            <svg className="w-5 h-5" fill="none" stroke="#6B5F5A" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* 首页 */}
        <Link
          href="/"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-[#F0E8E3] transition-colors text-sm shrink-0"
          style={{ color: "#6B5F5A" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12l9-9 9 9" />
            <path d="M5 10v10h14V10" />
          </svg>
          <span>首页</span>
        </Link>

        {/* 标题 */}
        {title && (
          <h1 className="flex-1 text-center text-base font-medium truncate" style={{ color: "#4A4A4A" }}>
            {title}
          </h1>
        )}
        {!title && <div className="flex-1" />}

        {/* 右侧自定义 */}
        {rightSlot}

        {/* 和小酷聊聊（当无自定义右侧时显示） */}
        {!rightSlot && (
          <Link
            href="/chat"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium shrink-0 transition-colors hover:opacity-90"
            style={{ background: "#6B4C9A", color: "#FFFFFF" }}
          >
            <span>💬</span>
            <span className="hidden sm:inline">和小酷聊聊</span>
          </Link>
        )}
      </header>
    </>
  );
}
