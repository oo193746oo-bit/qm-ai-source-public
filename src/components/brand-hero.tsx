"use client";

import Link from "next/link";

/**
 * QM 品牌 Hero 组件 v4.0
 * 首页第一层：品牌介绍（纯 Hero，不含锚点卡）
 *
 * v4.0 变更：
 * - 移除三张品牌锚点卡（移到 home-hub 第二 Section 完整展示）
 * - Hero 不再撑满首屏，Desktop 高度控制在 620-720px 区间
 * - H1 从 42px 调至 38px，整体更紧凑
 * - 右侧圆形视觉从 420px 调至 clamp(300px, 30vw, 400px)
 * - 浏览器高度 < 820px 时进入 Compact Mode
 *
 * 关键文案（必须保持原文，不得修改）：
 * - Eyebrow: "QM 酷儿心理 · Queer Mental"
 * - H1: "从你的处境出发，而不是从标签开始。"
 * - CTA: "了解完整的QM" → /about-qm
 */

interface BrandHeroProps {
  /** 可选：用户昵称（Onboarding 完成后显示） */
  nickname?: string;
}

export function BrandHero({ nickname }: BrandHeroProps) {
  return (
    <section className="qm-hero-section pt-4 md:pt-8 pb-6 md:pb-10">
      <div className="max-w-[1180px] mx-auto">
        {/* Desktop: 左右布局（文案 60% + 视觉 40%） */}
        {/* Mobile: 单列，品牌文字优先 */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.75fr)] items-center gap-6 lg:gap-10">
          {/* ===== 左侧：品牌文案 ===== */}
          <div className="space-y-4 md:space-y-5 text-center lg:text-left min-w-0">
            {/* Eyebrow */}
            <div className="flex items-center justify-center lg:justify-start gap-2">
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-[var(--qm-purple-700)] flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-semibold">QM</span>
              </div>
              <span className="text-xs md:text-sm font-medium text-[var(--qm-purple-700)] tracking-wide">
                QM 酷儿心理 · Queer Mental
              </span>
            </div>

            {/* 昵称（如有） */}
            {nickname && (
              <p className="text-sm md:text-base text-[var(--qm-purple-700)] font-medium">
                你好，{nickname}
              </p>
            )}

            {/* H1 主标题 — v4: desktop 38px, compact 34px */}
            <h1
              className="qm-hero-title font-bold text-[var(--qm-ink-950)] tracking-tight"
              style={{
                fontSize: "clamp(28px, 5vw, 38px)",
                lineHeight: 1.18,
              }}
            >
              从你的处境出发，
              <br className="hidden sm:block" />
              而不是从标签开始。
            </h1>

            {/* 品牌正文 — v4: max-width 620px, body 16px */}
            <div
              className="space-y-3 text-[var(--qm-ink-700)] leading-[1.75] mx-auto lg:mx-0"
              style={{ maxWidth: "620px", fontSize: "16px" }}
            >
              <p>
                QM酷儿心理以多元文化视角理解每一个人。我们关注情绪、关系、家庭、职场、创伤、自我成长、ADHD相关困扰、身体与进食、身份探索与海外生活等广泛心理需求。LGBTQ+肯定式、多元文化与海外华人理解，是QM的重要专业差异化，但不是服务边界。
              </p>
              <p>
                这里既有小酷的日常心理支持，也有小雪的预约协助，以及心理测评、情绪树洞、知识库和自助工具。你可以从最适合此刻的一步开始。
              </p>
            </div>

            {/* CTA 按钮 — v4: 品牌紫实色，不用渐变 */}
            <div className="pt-1">
              <Link
                href="/about-qm"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-[var(--qm-purple-700)] text-white font-semibold rounded-xl hover:bg-[var(--qm-purple-800)] hover:shadow-lg hover:shadow-[var(--qm-purple-700)]/15 transition-all duration-200 text-[15px] min-h-[48px]"
              >
                了解完整的QM
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* ===== 右侧：抽象品牌视觉 ===== */}
          {/* v4: clamp(260px, 28vw, 380px)，不抢 CTA 视觉 */}
          <div className="flex justify-center lg:justify-end">
            <div
              className="relative aspect-square qm-brand-visual"
              style={{ width: "clamp(240px, 60vw, 340px)" }}
            >
              {/* 外层大圆环 */}
              <div
                className="absolute inset-0 rounded-full animate-pulse-slow"
                style={{
                  background:
                    "radial-gradient(circle at 30% 30%, rgba(154,122,200,0.18), rgba(208,100,142,0.08) 70%)",
                }}
              />
              {/* 中层渐变圆 */}
              <div
                className="absolute rounded-full"
                style={{
                  inset: "10%",
                  background:
                    "radial-gradient(circle at 40% 35%, rgba(154,122,200,0.25), rgba(246,135,179,0.12) 75%)",
                }}
              />
              {/* 核心圆 — v4: 品牌紫实色，不用渐变 */}
              <div
                className="absolute rounded-full bg-[var(--qm-purple-700)] flex items-center justify-center"
                style={{
                  inset: "22%",
                  boxShadow: "0 12px 40px rgba(98,66,139,0.22)",
                }}
              >
                <div className="text-center">
                  <span className="text-white font-bold tracking-tight" style={{ fontSize: "clamp(24px, 4vw, 36px)" }}>
                    QM
                  </span>
                  <p className="text-white/70 mt-0.5 font-medium tracking-wider" style={{ fontSize: "10px" }}>
                    Queer Mental
                  </p>
                </div>
              </div>

              {/* 装饰小圆点 */}
              <div className="absolute top-[10%] left-[50%] -translate-x-1/2 w-3 h-3 rounded-full" style={{ background: "rgba(208,100,142,0.55)" }} />
              <div className="absolute bottom-[16%] right-[10%] w-2.5 h-2.5 rounded-full" style={{ background: "rgba(154,122,200,0.65)" }} />
              <div className="absolute top-[32%] right-[4%] w-2 h-2 rounded-full" style={{ background: "rgba(54,164,190,0.55)" }} />
              <div className="absolute bottom-[28%] left-[6%] w-2 h-2 rounded-full" style={{ background: "rgba(199,135,38,0.55)" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Compact Mode: 浏览器高度 < 820px */}
      <style jsx>{`
        .qm-hero-section {
          max-height: 720px;
        }
        @media (max-height: 820px) and (min-width: 1024px) {
          .qm-hero-section {
            padding-top: 16px;
            padding-bottom: 24px;
          }
          .qm-brand-visual {
            width: clamp(220px, 24vw, 300px) !important;
          }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.75; transform: scale(1.02); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 6s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-pulse-slow { animation: none; }
        } `}</style>
    </section>
  );
}

export default BrandHero;
