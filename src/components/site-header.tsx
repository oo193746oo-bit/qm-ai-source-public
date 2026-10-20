"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {  } from "react";

/**
 * 全站统一导航栏（Wave 1 视觉重建 20260917）
 * 照已审批 REF 设计稿重排：左 logo + 导航项（首页/心理师团队/关于我们），右「和小酷聊聊」。
 * 「和小酷聊聊」入口（与设计稿品牌胶囊同位）。此偏离已记录，待阿花/Lara 终审。
 */
const NAV_ITEMS = [
  { label: "首页", href: "/" },
  { label: "心理师团队", href: "/therapists" },
  { label: "关于我们", href: "/about-qm" },
];

export function SiteHeader() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      <header
        className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur-md"
        style={{ borderColor: "#F0E4D8" }}
      >
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-2 px-4">
          {/* ☰ 菜单 */}

          {/* Logo：珍珠圆点 + QM AI */}
          <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="QM AI 首页">
            <span
              aria-hidden
              className="inline-block h-6 w-6 rounded-full bg-gradient-to-br from-[#F7E6D8] via-[#F2D8C4] to-[#E8BFA8] shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_1px_3px_rgba(180,140,110,0.35)]"
            />
            <span className="text-lg font-bold tracking-wide text-[#3B3630]" style={{ fontFamily: "Georgia,'Times New Roman',serif" }}>
              QM AI
            </span>
          </Link>

          {/* 中部导航项（桌面） */}
          <nav className="ml-6 hidden items-center gap-6 md:flex" aria-label="主导航">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative pb-1 text-sm transition-colors ${
                    active
                      ? "font-semibold text-[#B4533A]"
                      : "text-[#6B5F5A] hover:text-[#B4533A]"
                  }`}
                >
                  {item.label}
                  <span
                    aria-hidden
                    className={`absolute inset-x-1 -bottom-0.5 h-[2px] rounded-full bg-[#C96B52] transition-opacity ${
                      active ? "opacity-100" : "opacity-0"
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="flex-1" />

          {/* 右侧：和小酷聊聊（真实功能入口） */}
          <Link
            href="/"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-90 active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg,#8A63B8,#6B4C9A)" }}
          >
            <span aria-hidden>💬</span>
            <span>和小酷聊聊</span>
          </Link>
        </div>
      </header>
    </>
  );
}
