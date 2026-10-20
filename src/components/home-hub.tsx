"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Sidebar } from "./sidebar";

/**
 * QM AI 首页 HomeHub v7.0
 *
 * v7.0 完整重构（基于 GPT 规格文档审核后实现）：
 * - Hero：你不需要先想清楚一切，才可以开始
 * - QM 短介绍：不只问"你怎么了"
 * - 三个核心价值（Understand Before Labeling / Context Matters / Human-Centered）
 * - 六个用户需求入口（A-F，替代旧 ExploreGrid 功能卡）
 * - LGBTQ+ 品牌平衡
 * - 海外华人独立区块
 * - AI × 真人路径
 * - 底部 CTA + 品牌收束
 *
 * 保留：Onboarding、首次打招呼、用户信息收集、Sidebar、回访快捷卡
 * 不复制 /about-qm 全文；品牌详情跳 /about-qm
 *
 * 视觉规范：
 * - 品牌紫实色（var(--qm-purple-700)），不用渐变按钮
 * - 中文为主、英文为辅（英文≤中文40%，只做副标题/品牌关键词）
 * - 响应式：桌面 3 列价值卡/3×2 入口；手机单列，触控≥48px
 * - 防溢出：min-width:0、overflow-wrap:anywhere、flex-wrap
 */

interface HomeHubProps {
  onStartXiaoku: () => void;
  onStartXiaoxue: () => void;
  onResetOnboarding?: () => void;
  nickname?: string;
  lastXiaokuAt?: number;
  lastXiaoxueAt?: number;
  xiaoxueDraftProgress?: { completed: number; total: number };
}

/* ------------------------------------------------------------------ */
/*  小组件                                                             */
/* ------------------------------------------------------------------ */

function formatRelativeTime(timestamp?: number): string {
  if (!timestamp) return "";
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 30) return `${days}天前`;
  return "之前";
}

function QMLogo({ size = 40 }: { size?: number }) {
  return (
    <div
      className="rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md"
      style={{
        width: size,
        height: size,
        background: "var(--qm-purple-700)",
        boxShadow: "0 4px 12px rgba(98,66,139,0.2)",
      }}
    >
      <span className="text-white font-semibold tracking-tight" style={{ fontSize: size * 0.4 }}>
        QM
      </span>
    </div>
  );
}

function XiaokuAvatar({ size = 48 }: { size?: number }) {
  return (
    <div
      className="rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
      style={{ width: size, height: size, background: "var(--qm-purple-700)" }}
    >
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a8 8 0 0 0-8 8c0 4 3 7 5 9v3h6v-3c2-2 5-5 5-9a8 8 0 0 0-8-8z" />
        <circle cx="9" cy="11" r="1.5" fill="white" />
        <circle cx="15" cy="11" r="1.5" fill="white" />
        <path d="M9 15c1 1 2 1.5 3 1.5s2-.5 3-1.5" />
      </svg>
    </div>
  );
}

function XiaoxueAvatar({ size = 48 }: { size?: number }) {
  return (
    <div
      className="rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
      style={{ width: size, height: size, background: "var(--qm-indigo-600)" }}
    >
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20M2 12h20M5 5l14 14M19 5L5 19" />
        <circle cx="12" cy="12" r="3" fill="white" />
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  数据：三个核心价值                                                  */
/* ------------------------------------------------------------------ */

const coreValues = [
  {
    en: "Understand Before Labeling",
    title: "先理解你，而不是先定义你",
    body: "你可以带着混乱、矛盾和还没想清楚的部分进来。QM不急着把你的经验压缩成一个标签。",
    emphasis: "不用先把自己解释正确，才值得被认真听。",
  },
  {
    en: "Context Matters",
    title: "把你的处境放回心理理解里",
    body: "关系、家庭、文化、身份、城市、工作和现实压力，都可能参与一个人的心理状态。",
    emphasis: `你的困扰不会被脱离现实，简单变成"都是你自己的问题"。`,
  },
  {
    en: "Human-Centered",
    title: "专业应该增加理解，而不是增加距离",
    body: "心理学知识应该帮助你更懂自己，而不是让你面对一堆术语、标准答案和新的自我怀疑。",
    emphasis: "专业可以准确，也可以说人话。",
  },
];

/* ------------------------------------------------------------------ */
/*  数据：六个用户需求入口                                              */
/* ------------------------------------------------------------------ */

interface NeedEntry {
  tag: string;
  need: string;
  desc: string;
  cta: string;
  href?: string;
  action?: "xiaoku" | "xiaoxue";
  accent: "purple" | "indigo" | "teal" | "amber" | "rose" | "green";
}

const accentMap: Record<NeedEntry["accent"], { bg: string; text: string; border: string; chipBg: string }> = {
  purple: { bg: "var(--qm-purple-50)", text: "var(--qm-purple-700)", border: "rgba(98,66,139,0.15)", chipBg: "rgba(98,66,139,0.08)" },
  indigo: { bg: "var(--qm-indigo-100)", text: "var(--qm-indigo-700)", border: "rgba(63,70,168,0.15)", chipBg: "rgba(81,88,201,0.08)" },
  teal:   { bg: "#F0FAFB", text: "#368A9E", border: "rgba(54,164,190,0.15)", chipBg: "rgba(54,164,190,0.08)" },
  amber:  { bg: "#FDF8F0", text: "#9A6F26", border: "rgba(199,135,38,0.15)", chipBg: "rgba(199,135,38,0.08)" },
  rose:   { bg: "#FDF2F4", text: "#B84D5B", border: "rgba(184,77,91,0.15)", chipBg: "rgba(184,77,91,0.08)" },
  green:  { bg: "#F2F8F4", text: "#4A7C59", border: "rgba(74,124,89,0.15)", chipBg: "rgba(74,124,89,0.08)" },
};

const needEntries: NeedEntry[] = [
  {
    tag: "A",
    need: "我现在只想找个人说说",
    desc: "心里有点乱、委屈、烦、孤单，或者有一件事一直放不下。",
    cta: "和小酷聊聊",
    action: "xiaoku",
    accent: "purple",
  },
  {
    tag: "B",
    need: "我想把最近的情绪记录下来",
    desc: "每天花一点时间看看自己今天怎么了，写下日记，慢慢看见变化。",
    cta: "进入情绪树洞",
    href: "/treehole",
    accent: "teal",
  },
  {
    tag: "C",
    need: "我想更系统地了解自己",
    desc: "从人格、心理状态、职业兴趣、生活方式、神经多样性等不同角度理解自己。测评用于探索与筛查，不等于诊断。",
    cta: "开始探索",
    href: "/assessments",
    accent: "indigo",
  },
  {
    tag: "D",
    need: "我想先自己理解一下",
    desc: "从情绪、关系、自我成长，到性别、性取向、创伤、ADHD与多元文化议题，用更容易理解的方式学习心理知识。",
    cta: "进入知识库",
    href: "/knowledge",
    accent: "amber",
  },
  {
    tag: "E",
    need: "我需要一个可以马上做的练习",
    desc: "不想讲很多时，可以先做呼吸、接地、身体觉察、认知整理或关系边界练习。",
    cta: "选择一个工具",
    href: "/tools",
    accent: "green",
  },
  {
    tag: "F",
    need: "我已经在考虑真人心理咨询",
    desc: "了解费用、心理师、线上/线下形式和预约流程。小雪负责预约前服务协助，不负责心理分析。",
    cta: "找小雪了解",
    action: "xiaoxue",
    accent: "rose",
  },
];

/* ------------------------------------------------------------------ */
/*  数据：海外华人场景                                                  */
/* ------------------------------------------------------------------ */

const overseasScenes = [
  "家庭期待 vs 个人选择",
  "留学孤独",
  "移民归属感",
  "跨文化伴侣",
  "多语言心理表达",
  "海归 / 回流适应",
  "海外 LGBTQ+ 华人",
];

/* ------------------------------------------------------------------ */
/*  数据：AI × 真人路径                                                */
/* ------------------------------------------------------------------ */

const pathSteps = [
  { label: "小酷", desc: "聊聊、梳理、记录、理解", accent: "var(--qm-purple-700)" },
  { label: "知识库 / 测评 / 工具 / 树洞", desc: "找到适合自己的理解方式", accent: "var(--qm-purple-500)" },
  { label: "小雪", desc: "了解心理师、费用与预约", accent: "var(--qm-indigo-600)" },
  { label: "QM 心理师", desc: "更深入、稳定的真人专业支持", accent: "var(--qm-indigo-700)" },
];

/* ------------------------------------------------------------------ */
/*  主组件                                                             */
/* ------------------------------------------------------------------ */

export function HomeHub({
  onStartXiaoku,
  onStartXiaoxue,
  onResetOnboarding,
  nickname,
  lastXiaokuAt,
  lastXiaoxueAt,
  xiaoxueDraftProgress,
}: HomeHubProps) {
  const router = useRouter();
  const hasReturnVisit = !!lastXiaokuAt;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleEntryClick = (entry: NeedEntry) => {
    if (entry.action === "xiaoku") onStartXiaoku();
    else if (entry.action === "xiaoxue") {
      try { onStartXiaoxue(); } catch { /* 兜底 */ }
    } else if (entry.href) router.push(entry.href);
  };

  const scrollToEntries = () => {
    document.getElementById("need-entries")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="qm-cbg qm-bg-home min-h-dvh">
      {/* 批次D v2.0：折射层 overlay_prism（opacity 0.45，范围 0.35–0.60） */}
      <div className="qm-overlay-prism" aria-hidden="true" />
      <div className="relative z-[2]">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        onStartXiaoku={onStartXiaoku}
      />

      {/* 主内容区 */}
      <div className={`min-h-dvh ${sidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-60"}`}>
        {/* 手机端顶栏 */}
        <header
          className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 lg:hidden bg-white/70 backdrop-blur-sm border-b border-[var(--qm-line-100)]/50 min-h-[56px]"
          style={{ paddingTop: `calc(12px + env(safe-area-inset-top, 0px))` }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-full hover:bg-[var(--qm-surface-100)] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="打开菜单"
          >
            <svg className="w-5 h-5 text-[var(--qm-ink-600)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <QMLogo size={28} />
            <span className="text-sm font-semibold text-[var(--qm-ink-800)]">QM AI</span>
          </div>
        </header>

        <div
          className="mx-auto"
          style={{ maxWidth: "min(100% - 40px, 1100px)" }}
        >
          {/* ================================================================ */}
          {/*  S01 Hero                                                        */}
          {/* ================================================================ */}
          <section
            className="pt-12 pb-10 md:pt-20 md:pb-16 text-center"
            style={{ paddingInline: "clamp(0px, 2vw, 24px)" }}
          >
            {/* Eyebrow */}
            <div className="flex items-center justify-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--qm-purple-700)" }}>
                <span className="text-white text-xs font-semibold">QM</span>
              </div>
              <span className="text-xs md:text-sm font-medium tracking-wide" style={{ color: "var(--qm-purple-700)" }}>
                QM 酷儿心理 · Queer Mental
              </span>
            </div>

            {nickname && (
              <p className="text-sm md:text-base font-medium mb-3" style={{ color: "var(--qm-purple-700)" }}>
                你好，{nickname}
              </p>
            )}

            {/* H1 */}
            <h1
              className="font-bold tracking-tight mx-auto"
              style={{
                fontSize: "clamp(30px, 5.5vw, 48px)",
                lineHeight: 1.25,
                color: "var(--qm-ink-950)",
                maxWidth: "760px",
                overflowWrap: "anywhere",
              }}
            >
              你不需要先想清楚一切，才可以开始。
            </h1>

            {/* 英文点缀 */}
            <p
              className="mt-3 tracking-wider"
              style={{ fontSize: "clamp(12px, 1.4vw, 14px)", opacity: 0.6, color: "var(--qm-ink-600)" }}
            >
              Multicultural · Affirming · Human-Centered
            </p>

            {/* 副标题 */}
            <p
              className="mt-5 mx-auto leading-[1.75]"
              style={{
                fontSize: "clamp(15px, 1.8vw, 17px)",
                color: "var(--qm-ink-700)",
                maxWidth: "620px",
                overflowWrap: "anywhere",
              }}
            >
              这里是 QM AI。你可以先说说最近发生的事，也可以记录情绪、了解自己，或者在准备好之后找到真人心理支持。
            </p>

            {/* CTA */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={onStartXiaoku}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200 text-[15px] w-full sm:w-auto"
                style={{ background: "var(--qm-purple-700)", minHeight: "48px", boxShadow: "0 4px 14px rgba(98,66,139,0.18)" }}
              >
                和小酷聊聊
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={scrollToEntries}
                className="inline-flex items-center justify-center gap-2 px-7 py-4 font-semibold rounded-xl border bg-white/60 hover:bg-white transition-all duration-200 text-[15px] w-full sm:w-auto"
                style={{ borderColor: "var(--qm-line-300)", color: "var(--qm-ink-700)", minHeight: "48px" }}
              >
                看看我可以从哪里开始
              </button>
            </div>
          </section>

          {/* ================================================================ */}
          {/*  S02 QM 短介绍                                                   */}
          {/* ================================================================ */}
          <section className="py-10 md:py-14">
            <div className="max-w-[720px] mx-auto text-center">
              <h2
                className="font-semibold tracking-tight"
                style={{ fontSize: "clamp(23px, 3vw, 30px)", lineHeight: 1.35, color: "var(--qm-ink-900, var(--qm-ink-950))" }}
              >
                我们不只问"你怎么了"，也想理解"你经历了什么"。
              </h2>
              <p
                className="mt-5 leading-[1.75]"
                style={{ fontSize: "clamp(15px, 1.7vw, 17px)", color: "var(--qm-ink-700)", overflowWrap: "anywhere" }}
              >
                同样是焦虑、关系、家庭或职业困扰，背后的文化、身份、生活环境和现实压力可能完全不同。QM不把一个人拆成症状，也不要求你先符合某一种身份。我们用多元文化视角理解不同人的心理经验。
              </p>
              <Link
                href="/about-qm"
                className="inline-flex items-center gap-1.5 mt-6 text-sm font-medium hover:underline"
                style={{ color: "var(--qm-purple-700)", minHeight: "44px" }}
              >
                进一步了解 QM
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </section>

          {/* ================================================================ */}
          {/*  S03 三个核心价值                                                */}
          {/* ================================================================ */}
          <section className="py-10 md:py-14 border-t border-[var(--qm-line-100)]/60">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 [&>*]:min-w-0">
              {coreValues.map((v, i) => (
                <div
                  key={v.en}
                  className="bg-white/75 border rounded-2xl p-6 md:p-7 flex flex-col"
                  style={{ borderColor: "var(--qm-line-200)", minHeight: "100%" }}
                >
                  <span
                    className="text-xs font-semibold tracking-wider mb-2"
                    style={{ color: "var(--qm-purple-700)", opacity: 0.7 }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p
                    className="text-xs tracking-wide mb-2"
                    style={{ color: "var(--qm-ink-500)", fontSize: "12px" }}
                  >
                    {v.en}
                  </p>
                  <h3
                    className="font-semibold mb-3"
                    style={{ fontSize: "clamp(18px, 2vw, 20px)", lineHeight: 1.4, color: "var(--qm-ink-900, var(--qm-ink-950))" }}
                  >
                    {v.title}
                  </h3>
                  <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--qm-ink-700)", overflowWrap: "anywhere" }}>
                    {v.body}
                  </p>
                  <p
                    className="text-sm font-medium mt-auto pt-3 border-t"
                    style={{ color: "var(--qm-purple-700)", borderColor: "var(--qm-line-100)" }}
                  >
                    {v.emphasis}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ================================================================ */}
          {/*  回访快捷卡（保留）                                               */}
          {/* ================================================================ */}
          {hasReturnVisit && (
            <section className="py-6 md:py-8">
              <div className="max-w-[720px] mx-auto">
                <p className="text-xs mb-3 text-center" style={{ color: "var(--qm-ink-400)" }}>继续上次</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  {lastXiaokuAt && (
                    <button
                      onClick={onStartXiaoku}
                      className="flex-1 px-5 py-4 bg-white/75 border rounded-2xl text-left hover:bg-white hover:border-[var(--qm-line-300)] transition-all duration-200 group"
                      style={{ borderColor: "var(--qm-line-200)", minHeight: "60px" }}
                    >
                      <div className="flex items-center gap-3">
                        <XiaokuAvatar size={36} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium" style={{ color: "var(--qm-ink-800)" }}>继续和小酷聊聊</p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--qm-ink-500)" }}>{formatRelativeTime(lastXiaokuAt)}</p>
                        </div>
                        <svg className="w-4 h-4 transition-colors flex-shrink-0 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="var(--qm-purple-700)">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  )}
                  {false && lastXiaoxueAt && (
                    <button
                      onClick={() => { try { onStartXiaoxue(); } catch { /* */ } }}
                      className="flex-1 px-5 py-4 bg-white/75 border rounded-2xl text-left hover:bg-white hover:border-[var(--qm-line-300)] transition-all duration-200 group"
                      style={{ borderColor: "var(--qm-line-200)", minHeight: "60px" }}
                    >
                      <div className="flex items-center gap-3">
                        <XiaoxueAvatar size={36} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium" style={{ color: "var(--qm-ink-800)" }}>继续上次的预约准备</p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--qm-ink-500)" }}>
                            {xiaoxueDraftProgress
                              ? `已完成 ${xiaoxueDraftProgress?.completed}/${xiaoxueDraftProgress?.total}`
                              : formatRelativeTime(lastXiaoxueAt)}
                          </p>
                        </div>
                        <svg className="w-4 h-4 transition-colors flex-shrink-0 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="var(--qm-indigo-600)">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* ================================================================ */}
          {/*  S04 六个用户需求入口                                             */}
          {/* ================================================================ */}
          <section id="need-entries" className="py-10 md:py-14 border-t border-[var(--qm-line-100)]/60 scroll-mt-20">
            <div className="text-center mb-8 md:mb-10">
              <h2
                className="font-semibold tracking-tight"
                style={{ fontSize: "clamp(23px, 3vw, 30px)", lineHeight: 1.35, color: "var(--qm-ink-900, var(--qm-ink-950))" }}
              >
                你现在更想做哪一件事？
              </h2>
              <p className="mt-2 text-sm" style={{ color: "var(--qm-ink-500)" }}>
                从最适合此刻的一步开始，不需要全部都做
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 [&>*]:min-w-0">
              {needEntries.filter((entry) => entry.action !== "xiaoxue").map((entry) => {
                const c = accentMap[entry.accent];
                return (
                  <button
                    key={entry.tag}
                    onClick={() => handleEntryClick(entry)}
                    className="group bg-white/80 border rounded-2xl p-5 md:p-6 text-left hover:shadow-lg transition-all duration-200 flex flex-col"
                    style={{ borderColor: c.border, minHeight: "200px" }}
                  >
                    {/* 标签 */}
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold flex-shrink-0"
                        style={{ background: c.chipBg, color: c.text }}
                      >
                        {entry.tag}
                      </span>
                      <h3 className="font-semibold text-[15px] md:text-base" style={{ color: "var(--qm-ink-800)", lineHeight: 1.4 }}>
                        {entry.need}
                      </h3>
                    </div>

                    <p className="text-sm leading-relaxed mb-5 flex-1" style={{ color: "var(--qm-ink-600)", overflowWrap: "anywhere" }}>
                      {entry.desc}
                    </p>

                    <span
                      className="inline-flex items-center gap-1.5 text-sm font-medium pt-3 border-t"
                      style={{ color: c.text, borderColor: "var(--qm-line-100)" }}
                    >
                      {entry.cta}
                      <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ================================================================ */}
          {/*  专线服务：意定监护与预先照护规划                                 */}
          {/* ================================================================ */}
          {false && (
          <section className="py-10 md:py-14 border-t border-[var(--qm-line-100)]/60">
            <div
              className="rounded-2xl p-6 md:p-10"
              style={{ background: "linear-gradient(135deg, rgba(255,197,155,0.10) 0%, rgba(244,152,140,0.08) 100%)" }}
            >
              <div className="max-w-[720px] mx-auto text-center">
                <p className="text-xs tracking-wider mb-2" style={{ color: "var(--qm-amber-600)", opacity: 0.85 }}>
                  Pre-planning &amp; Advanced Care · 专项服务
                </p>
                <h2
                  className="font-semibold tracking-tight"
                  style={{ fontSize: "clamp(23px, 3vw, 28px)", lineHeight: 1.35, color: "var(--qm-ink-900, var(--qm-ink-950))" }}
                >
                  为自己的未来，提前做一件有力量的事
                </h2>
                <p className="mt-5 text-sm md:text-base leading-[1.75]" style={{ color: "var(--qm-ink-700)", overflowWrap: "anywhere" }}>
                  意定监护与预先照护规划，帮助你依照自己的意愿，预先安排医疗、财产与人身事务的决策与执行。不替代法律意见，但让重要的选择更早有被尊重的入口。
                </p>
                <Link
                  href="/preplanning"
                  className="inline-flex items-center gap-1.5 mt-6 text-sm font-medium hover:underline"
                  style={{ color: "var(--qm-amber-600)", minHeight: "44px" }}
                >
                  了解意定监护与预先照护
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </section>
          )}

          {/* ================================================================ */}
          {/*  S05 LGBTQ+ 品牌平衡                                             */}
          {/* ================================================================ */}
          <section className="py-10 md:py-14 border-t border-[var(--qm-line-100)]/60">
            <div
              className="rounded-2xl p-6 md:p-10"
              style={{ background: "linear-gradient(135deg, rgba(98,66,139,0.06) 0%, rgba(81,88,201,0.05) 100%)" }}
            >
              <div className="max-w-[720px] mx-auto text-center">
                <p className="text-xs tracking-wider mb-2" style={{ color: "var(--qm-purple-700)", opacity: 0.65 }}>
                  LGBTQ+ Affirming, Not LGBTQ+ Only.
                </p>
                <h2
                  className="font-semibold tracking-tight"
                  style={{ fontSize: "clamp(23px, 3vw, 28px)", lineHeight: 1.35, color: "var(--qm-ink-900, var(--qm-ink-950))" }}
                >
                  QM不只服务某一种身份
                </h2>
                <p className="mt-5 text-sm md:text-base leading-[1.75]" style={{ color: "var(--qm-ink-700)", overflowWrap: "anywhere" }}>
                  QM名字里有"酷儿心理"，但并不只服务LGBTQ+。多元文化、反预设、去病理化的理解方式用于所有心理议题——包括焦虑低落、关系、原生家庭、职业、创伤/CPTSD、ADHD、PUA/控制/NPD相关关系困扰、进食困扰、自我价值与人生转折。
                </p>
                <Link
                  href="/about-qm"
                  className="inline-flex items-center gap-1.5 mt-6 text-sm font-medium hover:underline"
                  style={{ color: "var(--qm-purple-700)", minHeight: "44px" }}
                >
                  看看QM为什么这样工作
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </section>

          {/* ================================================================ */}
          {/*  S06 海外华人                                                    */}
          {/* ================================================================ */}
          <section className="py-10 md:py-14 border-t border-[var(--qm-line-100)]/60">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              {/* 左：文案 */}
              <div className="text-center lg:text-left min-w-0">
                <p className="text-xs tracking-wider mb-2" style={{ color: "var(--qm-ink-500)", opacity: 0.7 }}>
                  For Chinese-speaking communities across cultures.
                </p>
                <h2
                  className="font-semibold tracking-tight"
                  style={{ fontSize: "clamp(23px, 3vw, 28px)", lineHeight: 1.35, color: "var(--qm-ink-900, var(--qm-ink-950))" }}
                >
                  给海外华人的一段话
                </h2>
                <p className="mt-5 text-base leading-[1.75]" style={{ color: "var(--qm-ink-700)", overflowWrap: "anywhere" }}>
                  有时候最难解释的，不是发生了什么，而是"为什么我在不同文化里，像不同的自己？"
                </p>
                <Link
                  href="/about-qm"
                  className="inline-flex items-center gap-1.5 mt-6 text-sm font-medium hover:underline"
                  style={{ color: "var(--qm-purple-700)", minHeight: "44px" }}
                >
                  了解QM的多元文化视角
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              {/* 右：场景标签 */}
              <div className="flex flex-wrap gap-2.5 justify-center lg:justify-end min-w-0">
                {overseasScenes.map((scene) => (
                  <span
                    key={scene}
                    className="px-4 py-2.5 rounded-full text-sm border bg-white/70"
                    style={{ borderColor: "var(--qm-line-200)", color: "var(--qm-ink-700)" }}
                  >
                    {scene}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* ================================================================ */}
          {/*  S07 AI × 真人路径                                               */}
          {/* ================================================================ */}
          <section className="py-10 md:py-14 border-t border-[var(--qm-line-100)]/60">
            <div className="text-center mb-8 md:mb-10">
              <h2
                className="font-semibold tracking-tight"
                style={{ fontSize: "clamp(23px, 3vw, 28px)", lineHeight: 1.35, color: "var(--qm-ink-900, var(--qm-ink-950))" }}
              >
                从AI开始，在需要的时候连接真人
              </h2>
              <p className="mt-2 text-sm" style={{ color: "var(--qm-ink-500)" }}>
                每一步都可以停下来，也可以继续
              </p>
            </div>

            {/* 路径：桌面横向，手机纵向 */}
            <div className="flex flex-col md:flex-row items-stretch gap-3 md:gap-2 max-w-[960px] mx-auto [&>*]:min-w-0">
              {pathSteps.filter((step) => step.label !== "小雪").map((step, i) => (
                <div key={step.label} className="flex-1 flex md:flex-col items-center gap-3 md:gap-2">
                  <div
                    className="bg-white/80 border rounded-xl p-4 md:p-5 text-center flex-1 w-full"
                    style={{ borderColor: "var(--qm-line-200)" }}
                  >
                    <p className="font-semibold text-sm md:text-base" style={{ color: step.accent }}>
                      {step.label}
                    </p>
                    <p className="text-xs md:text-sm mt-1.5" style={{ color: "var(--qm-ink-600)", overflowWrap: "anywhere" }}>
                      {step.desc}
                    </p>
                  </div>
                  {/* 箭头：桌面 → 手机 ↓ */}
                  {i < pathSteps.filter((step) => step.label !== "小雪").length - 1 && (
                    <svg
                      className="flex-shrink-0 md:rotate-0 rotate-90"
                      width="20" height="20" viewBox="0 0 24 24" fill="none"
                      stroke="var(--qm-line-300)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              ))}
            </div>

            <p className="text-center text-xs mt-6 max-w-[560px] mx-auto" style={{ color: "var(--qm-ink-500)", lineHeight: 1.7 }}>
              AI不替代真人心理咨询；真人支持也不意味着必须等到"很严重"。
            </p>
          </section>

          {/* ================================================================ */}
          {/*  S08 底部 CTA                                                    */}
          {/* ================================================================ */}
          <section className="py-10 md:py-14 border-t border-[var(--qm-line-100)]/60">
            <div className="max-w-[640px] mx-auto text-center">
              <p className="text-xs tracking-wider mb-2" style={{ color: "var(--qm-ink-500)", opacity: 0.65 }}>
                You do not have to know yet.
              </p>
              <h2
                className="font-semibold tracking-tight"
                style={{ fontSize: "clamp(23px, 3vw, 28px)", lineHeight: 1.35, color: "var(--qm-ink-900, var(--qm-ink-950))" }}
              >
                如果你还不确定，也没关系
              </h2>
              <p className="mt-4 text-base leading-[1.75]" style={{ color: "var(--qm-ink-700)", overflowWrap: "anywhere" }}>
                不确定该聊天、测评，还是找心理师？那就先从最轻的一步开始。你不需要准备好所有故事。
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={onStartXiaoku}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200 text-[15px] w-full sm:w-auto"
                  style={{ background: "var(--qm-purple-700)", minHeight: "48px", boxShadow: "0 4px 14px rgba(98,66,139,0.18)" }}
                >
                  和小酷说句话
                </button>
                <Link
                  href="/booking"
                  className="inline-flex items-center justify-center gap-2 px-7 py-4 font-semibold rounded-xl border bg-white/60 hover:bg-white transition-all duration-200 text-[15px] w-full sm:w-auto"
                  style={{ borderColor: "var(--qm-line-300)", color: "var(--qm-ink-700)", minHeight: "48px" }}
                >
                  了解真人咨询
                </Link>
              </div>
            </div>
          </section>

          {/* ================================================================ */}
          {/*  S09 品牌收束 + 信任与联系                                       */}
          {/* ================================================================ */}
          <section className="py-10 md:py-12 border-t border-[var(--qm-line-100)]/60">
            <div className="max-w-2xl mx-auto text-center space-y-6">
              {/* Slogan */}
              <div>
                <p className="text-lg md:text-xl font-semibold italic" style={{ color: "var(--qm-purple-700)" }}>
                  「生活没有标准答案」
                </p>
                <p className="mt-3 text-sm leading-[1.75] mx-auto" style={{ color: "var(--qm-ink-600)", maxWidth: "560px", overflowWrap: "anywhere" }}>
                  QM想做的，不是替你给出标准答案，而是在你需要的时候，提供一个可以理解自己、整理关系、学习心理知识、记录变化，并在必要时连接真人支持的地方。
                </p>
              </div>

              {/* AI 边界声明 */}
              <p className="text-xs leading-relaxed" style={{ color: "var(--qm-ink-500)" }}>
                AI用于心理支持、信息整理、自我探索与预约辅助，不替代心理咨询、心理治疗或医疗服务。
              </p>

              {/* QM 热线 */}
              <div className="bg-white/60 rounded-2xl p-5 border" style={{ borderColor: "var(--qm-line-200)" }}>
                <p className="text-xs mb-2" style={{ color: "var(--qm-ink-500)" }}>如遇紧急心理危机，请拨打</p>
                <a
                  href="tel:15001930070"
                  className="text-lg font-semibold hover:underline"
                  style={{ color: "var(--qm-danger)" }}
                >
                  15001930070
                </a>
                <p className="text-xs mt-1" style={{ color: "var(--qm-ink-600)" }}>
                  备用：13601658763 · 24小时：12356
                </p>
              </div>

              {/* 底部链接 */}
              <div className="flex items-center justify-center gap-4 flex-wrap pt-2">
                <Link href="/privacy" className="text-xs hover:underline inline-flex items-center" style={{ color: "var(--qm-purple-700)", minHeight: "40px" }}>隐私政策</Link>
                <span style={{ color: "var(--qm-line-200)" }}>|</span>
                <Link href="/terms" className="text-xs hover:underline inline-flex items-center" style={{ color: "var(--qm-purple-700)", minHeight: "40px" }}>用户协议</Link>
                <span style={{ color: "var(--qm-line-200)" }}>|</span>
                <Link href="/disclaimer" className="text-xs hover:underline inline-flex items-center" style={{ color: "var(--qm-purple-700)", minHeight: "40px" }}>免责声明</Link>
                <span style={{ color: "var(--qm-line-200)" }}>|</span>
                <Link href="/data-deletion" className="text-xs hover:underline inline-flex items-center" style={{ color: "var(--qm-purple-700)", minHeight: "40px" }}>数据留存与删除</Link>
                <span style={{ color: "var(--qm-line-200)" }}>|</span>
                <Link href="/contact" className="text-xs hover:underline inline-flex items-center" style={{ color: "var(--qm-purple-700)", minHeight: "40px" }}>联系我们</Link>
                {onResetOnboarding ? (
                  <>
                    <span style={{ color: "var(--qm-line-200)" }}>|</span>
                    <button
                      type="button"
                      onClick={onResetOnboarding}
                      className="text-xs hover:underline inline-flex items-center"
                      style={{ color: "var(--qm-purple-700)", minHeight: "40px", background: "none", border: "0", cursor: "pointer" }}
                    >重新填写问卷</button>
                  </>
                ) : null}
              </div>
            </div>
          </section>

          <div className="safe-bottom-pad" aria-hidden="true" />
        </div>
      </div>
      </div>
    </div>
  );
}

export default HomeHub;
