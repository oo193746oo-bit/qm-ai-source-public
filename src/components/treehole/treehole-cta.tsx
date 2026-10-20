"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getTreeholeStats, hasTreeholeData } from "@/lib/treehole/merge";

interface TreeholeCtaProps {
  variant?: "default" | "compact";
  className?: string;
}

export function TreeholeCta({ variant = "default", className = "" }: TreeholeCtaProps) {
  const [stats, setStats] = useState({ totalDays: 0, currentStreak: 0, totalLetters: 0 });
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    try {
      setHasData(hasTreeholeData());
      setStats(getTreeholeStats());
    } catch {
      // localStorage 不可用时静默
    }
  }, []);

  if (variant === "compact") {
    return (
      <Link
        href="/treehole"
        className={`block rounded-xl p-4 transition-all hover:scale-[1.02] ${className}`}
        style={{
          background: "linear-gradient(135deg, #6B4C9A, #9F7AEA)",
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🌳</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white">情绪树洞</p>
            <p className="text-xs text-white/70 truncate">
              {hasData ? `已记录 ${stats.totalDays} 天` : "写下今天的心情"}
            </p>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href="/treehole"
      className={`block rounded-2xl p-5 transition-all hover:scale-[1.02] shadow-sm ${className}`}
      style={{
        background: "linear-gradient(135deg, #6B4C9A, #9F7AEA)",
      }}
    >
      <div className="flex items-start gap-4">
        <span className="text-4xl">🌳</span>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-1">
            情绪树洞
          </h3>
          <p className="text-sm text-white/80 mb-3">
            每日情绪收集 · 写日记 · 小酷回信
          </p>
          {hasData ? (
            <div className="flex items-center gap-4">
              <div>
                <p className="text-xl font-bold text-white">{stats.totalDays}</p>
                <p className="text-xs text-white/60">已记录天数</p>
              </div>
              <div>
                <p className="text-xl font-bold text-white">{stats.currentStreak}</p>
                <p className="text-xs text-white/60">连续天数</p>
              </div>
              <div>
                <p className="text-xl font-bold text-white">{stats.totalLetters}</p>
                <p className="text-xs text-white/60">小酷回信</p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-white/70">
              今天还没有记录，去写第一篇吧
            </p>
          )}
        </div>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70 mt-1 flex-shrink-0">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </div>
      <p className="text-xs text-white/60 mt-4 text-center">
        生活没有标准答案
      </p>
    </Link>
  );
}
