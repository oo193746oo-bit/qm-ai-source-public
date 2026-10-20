"use client";

import Link from "next/link";

/**
 * 一级页面 Explore Grid 组件 v3.0
 * 首页第三层：引导用户探索其他一级页面
 *
 * 6 张卡片：
 * - 情绪树洞 / 心理测评 / 知识库 / 自助工具 / 常见问题 / 关于QM
 *
 * 响应式：
 * - Desktop: 3列 × 2行
 * - Tablet:  2列 × 3行
 * - Mobile:  2列小卡 或 1列
 */

interface ExploreItem {
  title: string;
  desc: string;
  route: string;
  icon: string;
}

// 6 个一级页面探索入口
const exploreItems: ExploreItem[] = [
  {
    title: "情绪树洞",
    desc: "每日情绪收集、日记与持续陪伴",
    route: "/treehole",
    icon: "🌳",
  },
  {
    title: "心理测评",
    desc: "从不同维度更了解自己",
    route: "/assessments",
    icon: "📊",
  },
  {
    title: "知识库",
    desc: "心理科普、理论、练习与场景化内容",
    route: "/knowledge",
    icon: "📚",
  },
  {
    title: "自助工具",
    desc: "3-15分钟的结构化自我练习",
    route: "/tools",
    icon: "🌿",
  },
  {
    title: "常见问题",
    desc: "快速了解咨询、AI、隐私与服务",
    route: "/faq",
    icon: "❓",
  },
  {
    title: "关于QM",
    desc: "了解QM的品牌、理念与专业差异",
    route: "/about-qm",
    icon: "💎",
  },
];

export function ExploreGrid() {
  return (
    <section className="py-10 md:py-14 border-t border-[var(--qm-line-200)]/50">
      <div className="max-w-[960px] mx-auto">
        {/* 标题区 */}
        <div className="text-center mb-8 md:mb-10">
          <h2 className="text-lg md:text-xl font-semibold text-[var(--qm-ink-800)] mb-2">
            QM还可以陪你做这些
          </h2>
          <p className="text-sm text-[var(--qm-ink-500)]">
            从最适合此刻的一步开始
          </p>
        </div>

        {/* 卡片网格
            - Mobile (< 640px): 2列小卡
            - Tablet (640-1023): 2列
            - Desktop (>= 1024): 3列
        */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {exploreItems.map((item) => (
            <Link
              key={item.route}
              href={item.route}
              className="group bg-white/60 border border-[var(--qm-line-200)] rounded-2xl p-4 md:p-5 hover:bg-white hover:border-[var(--qm-purple-400)]/40 hover:shadow-md hover:shadow-[var(--qm-purple-700)]/5 transition-all duration-300 min-h-[88px] md:min-h-[100px]"
            >
              <div className="flex items-start gap-3">
                {/* 图标 */}
                <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-[var(--qm-purple-100)]/60 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <span className="text-lg md:text-xl">{item.icon}</span>
                </div>

                {/* 文字 */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm md:text-base font-medium text-[var(--qm-ink-800)] mb-1 group-hover:text-[var(--qm-purple-700)] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[var(--qm-ink-500)] leading-relaxed line-clamp-2">
                    {item.desc}
                  </p>
                </div>
              </div>

              {/* 箭头指示器（Desktop 悬停显示） */}
              <div className="flex justify-end mt-3">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-[#C9BDB5] group-hover:text-[var(--qm-purple-700)] group-hover:translate-x-1 transition-all"
                >
                  <path d="M5 12h14" />
                  <path d="M12 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ExploreGrid;
