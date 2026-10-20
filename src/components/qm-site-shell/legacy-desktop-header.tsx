"use client";

import { usePathname } from "next/navigation";
import { HomeHeader } from "./home-header";
import "@/app/home.css";

// 接入旧页面共享壳，只加桌面导航；原正文、数据、业务和移动入口保留。
export function LegacyDesktopHeader({ chatHasOwnHeader }: { chatHasOwnHeader: boolean }) {
  const path = usePathname() || "/";
  const hasOwnHeader = path === "/" || path === "/therapists" || path.startsWith("/therapists/") ||
    (path === "/treehole" || path.startsWith("/treehole/")) ||
    (chatHasOwnHeader && path === "/chat") || path.startsWith("/chat-review/") || path.startsWith("/chat-identity-review/");
  return hasOwnHeader ? null : <HomeHeader legacy />;
}
