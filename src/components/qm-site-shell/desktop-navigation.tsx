"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import "./desktop-navigation.css";

export const desktopLinks = [
  ["首页", "/"], ["和小酷聊聊", "/chat"], ["找心理师", "/therapists"],
  ["情绪日记", "/treehole"], ["了解 QM", "/about-qm"],
] as const;
export const moreLinks = [
  ["自助工具", "/tools"], ["心理测试", "/assessments"], ["科普文章", "/knowledge"],
] as const;
const belongs = (path: string, root: string) => path === root || (root !== "/" && path.startsWith(root + "/"));
export function currentNavigation(path: string, href: string) {
  if (href === "/assessments") return belongs(path, href) || belongs(path, "/mbti") || belongs(path, "/adult-adhd");
  return belongs(path, href);
}

export function DesktopNavigation({ onOpen, activePath }: { onOpen?: () => void; activePath?: string }) {
  const actualPath = usePathname() || "/";
  const pathname = activePath || actualPath;
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;
  const [anchor, setAnchor] = useState({ left: 0, top: 64, maxHeight: 188 });
  const wrap = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  useEffect(() => {
    if (openPath && openPath !== pathname) setOpenPath(null);
  }, [pathname, openPath]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent | MouseEvent) => {
      if (event.target instanceof Node && !wrap.current?.contains(event.target)) setOpenPath(null);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault(); setOpenPath(null); trigger.current?.focus();
      }
    };
    const close = () => setOpenPath(null);
    const position = () => {
      const r = trigger.current?.getBoundingClientRect();
      if (r) setAnchor({ left: Math.max(8, Math.min(window.innerWidth - 220, r.right - 212)), top: r.bottom + 4, maxHeight: Math.max(48, window.innerHeight - r.bottom - 12) });
    };
    position();
    document.fonts.addEventListener("loadingdone", position);
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    document.addEventListener("pointerdown", outside);
    // 键盘 Enter/Space 也触发 click；只关闭菜单，不取消外部动作。
    document.addEventListener("click", outside, true);
    document.addEventListener("keydown", escape);
    window.addEventListener("popstate", close);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("click", outside, true);
      document.removeEventListener("keydown", escape);
      window.removeEventListener("popstate", close);
      document.fonts.removeEventListener("loadingdone", position);
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
    };
  }, [open]);
  const moreActive = moreLinks.some(([, href]) => currentNavigation(pathname, href));
  return <nav className="nav qm-desktop-navigation" aria-label="主导航">
    {desktopLinks.map(([label, href]) => <Link key={href} href={href}
      className={currentNavigation(pathname, href) ? "active" : undefined}
      aria-current={currentNavigation(pathname, href) ? "page" : undefined}
      onClick={() => setOpenPath(null)}>{label}</Link>)}
    <div className={"more-wrap" + (open ? " expanded" : "")} ref={wrap}>
      <button type="button" ref={trigger} className={"more-button" + (moreActive ? " active" : "")}
        aria-expanded={open} aria-controls={id} aria-current={moreActive ? "page" : undefined}
        onClick={() => { if (open) setOpenPath(null); else { const r = trigger.current?.getBoundingClientRect(); if (r) setAnchor({ left: Math.max(8, Math.min(window.innerWidth - 220, r.right - 212)), top: r.bottom + 4, maxHeight: Math.max(48, window.innerHeight - r.bottom - 12) }); onOpen?.(); setOpenPath(pathname); } }}>
        更多功能 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
      </button>
      {open && <div id={id} className="more-menu" aria-label="更多功能链接" style={{ "--qm-menu-left": `${anchor.left}px`, "--qm-menu-top": `${anchor.top}px` } as CSSProperties}>
        {moreLinks.map(([label, href]) => <Link key={href} href={href}
          className={currentNavigation(pathname, href) ? "active" : undefined}
          aria-current={currentNavigation(pathname, href) ? "page" : undefined}
          onClick={() => setOpenPath(null)}>{label}<span aria-hidden="true">→</span></Link>)}
      </div>}
    </div>
  </nav>;
}
