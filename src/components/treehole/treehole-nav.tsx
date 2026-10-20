"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Sidebar } from "@/components/sidebar";

/** Owns only this trigger/drawer and its open/close generation; never hooks shared history. */
export function createTreeholeDismissFocus(
  win: Window,
  trigger: () => HTMLButtonElement | null,
  drawer: () => HTMLElement | null,
  setOpen: (open: boolean) => void,
) {
  let disposed = false, opened = false, generation = 0;
  let openedURL = "", openedPath = "";
  let frame: number | undefined;
  let focusListener: ((event: FocusEvent) => void) | undefined;
  const cancelPending = () => {
    if (frame !== undefined) win.cancelAnimationFrame(frame);
    frame = undefined;
    if (focusListener) win.document.removeEventListener("focusin", focusListener);
    focusListener = undefined;
  };
  const detachEscape = () => win.removeEventListener("keydown", escape);
  const closeForNavigation = () => {
    generation++; opened = false; cancelPending(); detachEscape();
    if (!disposed) setOpen(false);
  };
  const dismiss = () => {
    if (disposed || !opened) return;
    const url = openedURL, path = openedPath, ownDrawer = drawer();
    const token = ++generation, activeAtClose = win.document.activeElement;
    opened = false; cancelPending(); detachEscape(); setOpen(false);
    let userMoved = false;
    focusListener = event => {
      if (event.target !== activeAtClose && event.target !== win.document.body && event.target !== trigger()) userMoved = true;
    };
    win.document.addEventListener("focusin", focusListener);
    frame = win.requestAnimationFrame(() => {
      if (disposed || token !== generation) return;
      frame = undefined;
      if (focusListener) win.document.removeEventListener("focusin", focusListener);
      focusListener = undefined;
      const button = trigger();
      if (disposed || opened || token !== generation || userMoved ||
          win.location.href !== url || win.location.pathname !== path ||
          !button?.isConnected || button.disabled || button.hidden || button.tabIndex < 0 ||
          button.getClientRects().length === 0 || button.closest("[inert]")) return;
      for (let node: HTMLElement | null = button; node; node = node.parentElement) {
        const style = win.getComputedStyle(node);
        if (style.display === "none" || style.visibility === "hidden" || style.visibility === "collapse" || style.opacity === "0") return;
      }
      const active = win.document.activeElement;
      if (!active || (active !== win.document.body && active !== button && !ownDrawer?.contains(active))) return;
      button.focus({ preventScroll: true });
    });
  };
  function escape(event: KeyboardEvent) {
    if (!disposed && opened && event.key === "Escape" && !event.defaultPrevented) {
      event.preventDefault(); dismiss();
    }
  }
  return {
    open() {
      if (disposed) return;
      generation++; cancelPending(); detachEscape();
      openedURL = win.location.href; openedPath = win.location.pathname;
      opened = true; setOpen(true); win.addEventListener("keydown", escape);
    },
    dismiss,
    closeForNavigation,
    dispose() { disposed = true; generation++; opened = false; cancelPending(); detachEscape(); },
  };
}

interface TreeholeNavProps {
  title?: string;
}

/**
 * 情绪树洞各页面统一顶部导航。
 * 左侧：菜单按钮（打开全站侧边栏）+ 返回首页
 * 右侧：和小酷聊聊（直达自由对话）
 */
export function TreeholeNav({ title = "情绪树洞" }: TreeholeNavProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const menuTrigger = useRef<HTMLButtonElement>(null);
  const focusController = useRef<ReturnType<typeof createTreeholeDismissFocus> | null>(null);
  const controller = () => focusController.current ?? (focusController.current = createTreeholeDismissFocus(
    window, () => menuTrigger.current,
    () => {
      // Sidebar renders its own aside immediately before this header. Bind that exact drawer.
      const element = menuTrigger.current?.closest("header")?.previousElementSibling;
      return element instanceof HTMLElement && element.matches(".qm-sidebar") ? element : null;
    }, setSidebarOpen,
  ));
  useEffect(() => () => focusController.current?.dispose(), []);

  return (
    <>
      <Sidebar isOpen={sidebarOpen} onClose={() => controller().closeForNavigation()} onDismiss={() => controller().dismiss()} />
      <header
        className="sticky top-0 z-30 flex items-center gap-2 px-4 py-3 bg-white/70 backdrop-blur-sm border-b"
        style={{ borderColor: "#E8DFDA" }}
      >
        {/* 菜单按钮 */}
        <button
          ref={menuTrigger}
          aria-expanded={sidebarOpen}
          onClick={() => controller().open()}
          className="p-2 rounded-full hover:bg-[#F0E8E3] transition-colors shrink-0"
          aria-label="打开菜单"
        >
          <svg className="w-5 h-5" fill="none" stroke="#6B5F5A" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* 返回首页 */}
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

        {/* 标题（居中弹性） */}
        <h1 className="flex-1 text-center text-base font-medium truncate" style={{ color: "#4A4A4A" }}>
          {title}
        </h1>

        {/* 和小酷聊聊 */}
        <Link
          href="/chat"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium shrink-0 transition-colors"
          style={{ background: "#6B4C9A", color: "#FFFFFF" }}
        >
          <span>💬</span>
          <span className="hidden sm:inline">和小酷聊聊</span>
        </Link>
      </header>
    </>
  );
}
