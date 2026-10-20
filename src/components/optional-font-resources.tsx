"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// 沿用原全局 CSS 的既有字体来源；失败不应使页面主样式成为失败资源。
const resources = [
  ["qm-optional-sans-font", "https://fonts.googleapis.cn/css2?family=Noto+Sans+SC:wght@400;500;600;700&display=swap"],
  ["qm-optional-serif-font", "https://fonts.googleapis.cn/css2?family=Noto+Serif+SC:wght@600;700;900&family=Caveat:wght@600&display=swap"],
  ["qm-optional-list-serif-font", "https://fonts.googleapis.cn/css2?family=Noto+Serif+SC:wght@700&display=swap"],
] as const;

const listBindings = new WeakMap<HTMLLinkElement, object>();
export function needsListSerif(pathname: string): boolean {
  return pathname === "/therapists" || pathname.startsWith("/therapists/");
}
export function syncListSerifResource(doc: Document, pathname: string): void {
  const [id, href] = resources[2];
  const nodes = doc.querySelectorAll(`[id="${id}"]`);
  const existing = doc.getElementById(id);
  // Never remove an unfamiliar tag, duplicate ID or a link owned by an unexpected URL.
  if (nodes.length > 1 || (existing && (existing.tagName !== "LINK" ||
      existing.namespaceURI !== "http://www.w3.org/1999/xhtml" ||
      existing.getAttribute("rel") !== "stylesheet" || existing.getAttribute("href") !== href))) {
    console.error("[QM font resource] list-serif identity mismatch");
    return;
  }
  if (!needsListSerif(pathname)) {
    if (existing) {
      const link = existing as HTMLLinkElement;
      listBindings.delete(link); link.onload = null; link.onerror = null; link.remove();
    }
    return;
  }
  const link = existing as HTMLLinkElement | null ?? doc.createElement("link");
  const binding = {}; listBindings.set(link, binding);
  const current = () => link.isConnected && doc.getElementById(id) === link && listBindings.get(link) === binding;
  link.onload = () => { if (current()) link.dataset.qmFontStatus = "loaded"; };
  link.onerror = () => { if (current()) link.dataset.qmFontStatus = "failed"; };
  if (!existing) {
    link.id = id; link.rel = "stylesheet"; link.href = href;
    link.dataset.qmFontStatus = "loading"; doc.head.appendChild(link);
  }
}

export function OptionalFontResources() {
  const pathname = usePathname();
  useEffect(() => {
    for (const [id, href] of resources) {
      if (id === "qm-optional-list-serif-font") { syncListSerifResource(document, pathname); continue; }
      if (document.getElementById(id)) continue;
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = href;
      link.dataset.qmFontStatus = "loading";
      link.onload = () => { link.dataset.qmFontStatus = "loaded"; };
      link.onerror = () => { link.dataset.qmFontStatus = "failed"; };
      document.head.appendChild(link);
    }
    // sans及联合serif保持原行为；仅list-serif按准确路由管理生命周期。
  }, [pathname]);
  return null;
}
