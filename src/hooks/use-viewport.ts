"use client";

import { useState, useEffect } from "react";

/**
 * QM AI 视口与设备感知 Hook
 *
 * 设计原则：
 * - 核心布局由 CSS Media Queries 完成，避免 hydration/resize 抖动
 * - 此 hook 仅用于 JS 场景：软键盘弹出检测、输入行为、动态内容密度等
 * - 不使用 User-Agent 做布局判断，全部基于 viewport 宽度
 *
 * 断点定义（与 globals.css CSS 变量一致）：
 * - Compact Mobile: 320 - 479
 * - Large Mobile:   480 - 767
 * - Tablet:         768 - 1023
 * - Desktop:        1024 - 1439
 * - Wide Desktop:   1440+
 */

export interface ViewportState {
  /** visualViewport 当前高度（考虑软键盘弹出），单位 px */
  visualHeight: number;
  /** 软键盘是否弹出 */
  keyboardOpen: boolean;
  /** 宽度 < 768px */
  isMobile: boolean;
  /** 宽度 768 - 1023px */
  isTablet: boolean;
  /** 宽度 1024 - 1439px */
  isDesktop: boolean;
  /** 宽度 >= 1440px */
  isWideDesktop: boolean;
  /** 底部安全区高度，单位 px */
  safeAreaBottom: number;
  /** 当前视口宽度，单位 px */
  width: number;
}

const MOBILE_MAX = 767;
const TABLET_MAX = 1023;
const DESKTOP_MAX = 1439;

function getSafeAreaBottom(): number {
  if (typeof window === "undefined") return 0;
  const val = getComputedStyle(document.documentElement).getPropertyValue(
    "--safe-area-inset-bottom",
  );
  if (val) {
    const parsed = parseFloat(val);
    if (!isNaN(parsed)) return parsed;
  }
  try {
    const div = document.createElement("div");
    div.style.position = "fixed";
    div.style.bottom = "env(safe-area-inset-bottom)";
    div.style.height = "0";
    div.style.visibility = "hidden";
    document.body.appendChild(div);
    const bottom = div.getBoundingClientRect().bottom;
    document.body.removeChild(div);
    return Math.max(0, bottom);
  } catch {
    return 0;
  }
}

export function useViewport(): ViewportState {
  const [state, setState] = useState<ViewportState>({
    visualHeight: typeof window !== "undefined" ? window.innerHeight : 800,
    keyboardOpen: false,
    isMobile: typeof window !== "undefined" ? window.innerWidth <= MOBILE_MAX : false,
    isTablet: false,
    isDesktop: false,
    isWideDesktop: false,
    safeAreaBottom: 0,
    width: typeof window !== "undefined" ? window.innerWidth : 375,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const compute = () => {
      const width = window.innerWidth;
      const vv = window.visualViewport;
      const visualHeight = vv ? vv.height : window.innerHeight;
      const windowHeight = window.innerHeight;
      const keyboardOpen = windowHeight - visualHeight > 150;
      const safeAreaBottom = getSafeAreaBottom();

      setState({
        visualHeight,
        keyboardOpen,
        isMobile: width <= MOBILE_MAX,
        isTablet: width >= 768 && width <= TABLET_MAX,
        isDesktop: width >= 1024 && width <= DESKTOP_MAX,
        isWideDesktop: width >= 1440,
        safeAreaBottom,
        width,
      });
    };

    compute();

    window.addEventListener("resize", compute, { passive: true });

    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener("resize", compute, { passive: true });
      vv.addEventListener("scroll", compute, { passive: true });
    }

    window.addEventListener("orientationchange", compute, { passive: true });

    return () => {
      window.removeEventListener("resize", compute);
      if (vv) {
        vv.removeEventListener("resize", compute);
        vv.removeEventListener("scroll", compute);
      }
      window.removeEventListener("orientationchange", compute);
    };
  }, []);

  return state;
}

export default useViewport;
