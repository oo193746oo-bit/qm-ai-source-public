"use client";

import { useEffect, useState } from "react";

/**
 * 首页动态招呼（20260922 波1 D 项，Lara 拍板）：
 * - 已完成 onboarding 的用户显示昵称（本地资料 qm_ai_profile，优先级 nickname → display_name → username）
 * - 游客/未填写昵称显示通用招呼「嗨，很高兴见到你 💞」（拍板 A 文案）
 * - 昵称经 React JSX 渲染，自动 HTML 转义防 XSS；首帧渲染游客文案与 SSR 一致，挂载后再读本地资料，避免 hydration 不一致
 */

function pickNickname(profile: Record<string, unknown>): string {
  const raw = profile.nickname ?? profile.display_name ?? profile.username;
  return typeof raw === "string" ? raw.trim() : "";
}

export function HomeGreeting() {
  const [nickname, setNickname] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("qm_ai_profile");
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (parsed && typeof parsed === "object") {
          setNickname(pickNickname(parsed as Record<string, unknown>));
        }
      }
    } catch {
      // 本地资料读取失败按游客处理
    }
  }, []);

  return (
    <h2 className="qm-greeting">
      {nickname ? `嗨，${nickname}` : "嗨，很高兴见到你"}{" "}
      <span aria-hidden="true">💞</span>
    </h2>
  );
}
