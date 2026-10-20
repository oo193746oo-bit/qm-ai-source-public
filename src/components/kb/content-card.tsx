"use client";

import Link from "next/link";
import { KnowledgeContent } from "@/lib/kb/kb-registry";
import { getContentType, getDomain } from "@/lib/kb/kb-meta";

interface ContentCardProps {
  content: KnowledgeContent;
  variant?: "default" | "compact";
}

/**
 * 新版内容卡片（Layer 5 预览）
 * 展示：标题 + 副标题/摘要 + 适合谁 + 阅读时间 + 你会得到什么标签
 */
export function ContentCard({ content, variant = "default" }: ContentCardProps) {
  const contentType = getContentType(content.content_type);
  const domain = getDomain(content.domain);

  const readingTime =
    content.reading_load === "Light"
      ? "1-3分钟"
      : content.reading_load === "Medium"
      ? "4-8分钟"
      : "9-20分钟";

  // 根据目的标签生成"你会得到什么"
  const benefitTags = content.purpose_tags.slice(0, 2).map((p) => {
    const benefitMap: Record<string, string> = {
      P01: "科普理解",
      P02: "快速了解",
      P03: "可操作练习",
      P04: "情绪稳定",
      P05: "关系沟通",
      P06: "边界话术",
      P07: "决策支持",
      P08: "自我探索",
      P09: "理论基础",
      P10: "理论深潜",
      P11: "工具使用",
      P12: "测评前了解",
      P13: "测评后延伸",
      P16: "危机求助",
      P17: "资源导航",
      P18: "故事共鸣",
      P21: "反思写作",
    };
    return benefitMap[p] || "心理知识";
  });

  // 批次D v2.0 + E4：抽象封面四张轮换（01/03 同系、02/04 同系 → 实际 4 张，按 content_id 轮换）
  const coverIdx =
    (content.content_id.charCodeAt(0) + (content.content_id.length || 0)) % 4;
  const coverUrl =
    [
      "/visual/knowledge_cover_abstract_01.png",
      "/visual/knowledge_cover_abstract_02.png",
      "/visual/knowledge_cover_abstract_03.png",
      "/visual/knowledge_cover_abstract_04.png",
    ][coverIdx] ?? "/visual/knowledge_cover_abstract_01.png";
  // 批次B P2：头图优雅占位——图标恒叠于图上、容器带暖色渐变，图上加载失败也绝不空白
  const coverIcons = ["🧘", "📖", "🌱", "💛"];
  const coverIcon = coverIcons[(content.content_id.length || 0) % coverIcons.length];

  if (variant === "compact") {
    return (
      <Link
        href={`/knowledge/content/${content.content_id}`}
        className="group block p-3 bg-white rounded-xl border border-gray-100 hover:border-[var(--qm-amber-600)]/30 hover:shadow-sm transition-all"
      >
        <h4 className="text-sm font-medium text-gray-800 group-hover:text-[var(--qm-amber-600)] transition-colors line-clamp-2">
          {content.title}
        </h4>
        <p className="text-xs text-gray-500 mt-1 line-clamp-1">
          {content.public_summary}
        </p>
        <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
          <span>{readingTime}</span>
          {contentType && <span>· {contentType.name}</span>}
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/knowledge/content/${content.content_id}`}
      className="group block p-4 bg-white rounded-2xl border border-gray-100 hover:border-[var(--qm-amber-600)]/30 hover:shadow-md transition-all"
    >
      {/* 批次D：抽象主题封面（不冒充真实照片）；批次B P2：暖色渐变+图标兜底，禁空白块 */}
      <div className="relative w-full h-32 mb-3 overflow-hidden rounded-xl bg-gradient-to-br from-[var(--qm-amber-100)] via-[var(--qm-rose-50)] to-[var(--qm-amber-50)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverUrl}
          alt=""
          loading="lazy"
          onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
          className="relative z-[1] w-full h-full object-cover"
        />
        <div className="absolute inset-0 z-[2] flex items-center justify-center pointer-events-none">
          <span className="text-3xl drop-shadow-sm">{coverIcon}</span>
        </div>
        <div className="absolute inset-0 z-[3] bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
      </div>

      {/* 头部：领域 + 形式 */}
      <div className="flex items-center gap-2 mb-2">
        {domain && (
          <span className="text-xs px-2 py-0.5 bg-[var(--qm-amber-600)]/5 text-[var(--qm-amber-600)] rounded-full">
            {domain.emoji} {domain.name}
          </span>
        )}
        {contentType && (
          <span className="text-xs text-gray-400">{contentType.name}</span>
        )}
      </div>

      {/* 标题 */}
      <h3 className="text-base font-medium text-gray-800 group-hover:text-[var(--qm-amber-600)] transition-colors mb-1">
        {content.title}
      </h3>

      {/* 副标题 / 摘要 */}
      <p className="text-sm text-gray-500 mb-3 line-clamp-2">
        {content.public_summary}
      </p>

      {/* 底部：阅读时间 + 你会得到什么 */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-xs text-gray-400">⏱ {readingTime}阅读</span>
        <div className="flex flex-wrap gap-1">
          {benefitTags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 bg-[var(--qm-amber-600)]/10 text-[var(--qm-amber-600)] rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
