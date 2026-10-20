"use client";

import { useMemo, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { goChatWithContext } from "@/lib/context/pending-context";
import { PageLayout } from "@/components/page-layout";
import {
  getDomain,
  getScenario,
  getPurpose,
  getContentType,
  DEPTH_LEVELS,
} from "@/lib/kb/kb-meta";
import { getContentById } from "@/lib/kb/kb-registry";
import { getRelatedContent } from "@/lib/kb/kb-recommend";
import { getArticleBody } from "@/lib/kb/article-bodies";
import { detectSafetyNeeds, SafetyRule } from "@/lib/kb/kb-safety";
import { ContentCard } from "@/components/kb/content-card";
import { XiaokuDock } from "@/components/kb/xiaoku-dock";
import { MarkdownRenderer } from "@/components/kb/markdown-renderer";

// 将标题文本转换为URL安全的slug（用于TOC锚点）
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

// 需要排除的特殊H2标题（不作为TOC条目）
const SPECIAL_H2_PATTERNS = [
  "小酷心理耳语",
  "什么时候需要更多支持",
  "专业边界",
  "安全提示",
  "带走一个问题",
  "两分钟复盘",
  "下一步",
];

interface TocItem {
  id: string;
  text: string;
}

// 从正文markdown中提取H2目录
function extractToc(bodyMarkdown: string): TocItem[] {
  const items: TocItem[] = [];
  const lines = bodyMarkdown.split("\n");
  for (const line of lines) {
    if (line.startsWith("## ") && !line.startsWith("### ")) {
      const text = line.slice(3).trim();
      // 排除特殊区块标题
      if (SPECIAL_H2_PATTERNS.some((p) => text.includes(p))) continue;
      items.push({ id: slugify(text), text });
    }
  }
  return items;
}

export default function ContentPage() {
  const params = useParams();
  const contentId = params.id as string;
  const content = getContentById(contentId);
  const articleBody = getArticleBody(contentId);

  // 安全层检测：在文章正文顶部展示
  const safetyRules: SafetyRule[] = useMemo(() => {
    if (!content || !articleBody) return [];
    const body = articleBody.body_markdown || "";
    return detectSafetyNeeds(content.domain, content.title, body);
  }, [content, articleBody]);

  // TOC目录
  const tocItems = useMemo(() => {
    if (!articleBody) return [];
    return extractToc(articleBody.body_markdown);
  }, [articleBody]);

  // 相关推荐：getRelatedContent 内部优先使用 related_ids，为空时回退算法
  const relatedContent = useMemo(() => {
    if (!content) return [];
    return getRelatedContent(contentId, 3);
  }, [contentId, content, articleBody]);

  // 设置页面标题（meta_description 仅用于metadata，不直接显示为可见内容）
  useEffect(() => {
    if (content) {
      const metaDesc = articleBody?.meta_description;
      document.title = metaDesc
        ? `${content.title} - QM上海酷儿心理咨询中心`
        : `${content.title} - QM知识库`;
    }
  }, [content, articleBody]);

  // 404处理：文章不存在
  if (!content) {
    return (
      <PageLayout title="文章未找到" showBack>
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📭</div>
          <h2 className="text-xl font-semibold text-[#2D2D2D] mb-3">
            文章未找到
          </h2>
          <p className="text-[#6F6876] mb-6 leading-relaxed">
            这篇文章可能已被移动或暂时不可用。
            <br />
            你可以返回知识库继续探索其他内容。
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/knowledge"
              className="inline-flex items-center justify-center px-6 py-3 rounded-full text-white text-sm font-medium transition-all hover:bg-[#62428B] min-h-[44px]"
              style={{ background: "#6B4C9A" }}
            >
              📚 返回知识库首页
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 rounded-full text-sm font-medium border border-[#6B4C9A]/30 text-[#6B4C9A] hover:bg-[#6B4C9A]/5 transition-all min-h-[44px]"
            >
              🏠 返回网站首页
            </Link>
          </div>
        </div>
      </PageLayout>
    );
  }

  const domain = getDomain(content.domain);
  const contentType = getContentType(content.content_type);
  const depthLevel = DEPTH_LEVELS.find((d) => d.level === content.depth);

  // 有正文时阅读时间按实际字数估算
  const bodyText = articleBody?.body_markdown || "";
  // 30a5批准隐藏旧角色：仅公开渲染的既有服务提示，知识原件及安全检测保持原文。
  const visibleBodyText = bodyText
    .replaceAll("找小雪了解预约", "联系人工客服了解预约")
    .replaceAll("找小雪了解真人支持", "联系人工客服了解真人支持");
  const estimatedMinutes = articleBody
    ? Math.max(5, Math.round(bodyText.length / 350))
    : content.reading_load === "Light"
    ? 3
    : content.reading_load === "Medium"
    ? 6
    : 12;

  // 适合谁（从场景和目的推断）
  const suitableFor = content.scenario_tags
    .slice(0, 3)
    .map((s) => getScenario(s)?.name)
    .filter(Boolean) as string[];

  // 你会得到什么
  const benefits = content.purpose_tags
    .slice(0, 3)
    .map((p) => getPurpose(p)?.name)
    .filter(Boolean) as string[];

  const hasBody =
    articleBody !== null &&
    articleBody.status === "REVIEWED" &&
    bodyText.length > 0;

  const bookingUrl = `/therapists?from=kb&article_id=${encodeURIComponent(contentId)}`;

  // 带文章上下文去找小酷（写一次 localStorage，由小酷聊天一次性消费，不入 URL、不含敏感数据）
  const handleTalkXiaoku = () => {
    goChatWithContext({
      source: "knowledge",
      summary:
        `我刚看了知识库文章《${content.title}》${
          domain ? `（领域：${domain.name}）` : ""
        }。` +
        `我想顺着这篇文章聊聊我的情况：${content.purpose_tags[0] ? getPurpose(content.purpose_tags[0])?.name ?? "" : ""}${
          content.scenario_tags[0] ? "，「" + (getScenario(content.scenario_tags[0])?.name ?? "") + "」这类场景" : ""
        }。` +
        `请先确认你理解文章想传递的方向，再结合我的处境聊。内容仅供了解和自我觉察参考，不构成诊断或专业意见。`,
    });
    sessionStorage.setItem(
      "qm_after_talk_target",
      JSON.stringify({ from: "kb", id: contentId })
    );
  };

  return (
    <PageLayout title={content.title} showBack>
      {/* 面包屑导航：三个返回路径 */}
      <nav className="mb-4 flex items-center flex-wrap gap-x-1.5 gap-y-1 text-[13px] text-[#6F6876]" aria-label="面包屑导航">
        <Link href="/" className="hover:text-[#6B4C9A] transition-colors">
          首页
        </Link>
        <span className="text-gray-300">/</span>
        <Link href="/knowledge" className="hover:text-[#6B4C9A] transition-colors">
          知识库
        </Link>
        {domain && (
          <>
            <span className="text-gray-300">/</span>
            <Link
              href={`/knowledge/domain/${domain.id}`}
              className="hover:text-[#6B4C9A] transition-colors"
            >
              {domain.name}
            </Link>
          </>
        )}
        <span className="text-gray-300">/</span>
        <span className="text-[#4E376F] truncate max-w-[200px]">
          {content.title}
        </span>
      </nav>

      <div className="lg:flex lg:gap-8 lg:items-start">
        {/* 桌面端TOC目录（lg+显示，移动端隐藏） */}
        {hasBody && tocItems.length > 0 && (
          <aside className="hidden lg:block w-[240px] shrink-0 order-2">
            <nav className="sticky top-20" aria-label="文章目录">
              <div className="text-xs font-semibold text-[#6F6876] uppercase tracking-wider mb-3 px-3">
                目录
              </div>
              <ul className="space-y-0.5 border-l border-gray-100">
                {tocItems.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="block py-1.5 pl-3 pr-2 text-[13px] text-[#6F6876] hover:text-[#6B4C9A] hover:bg-[#F8F6FA] rounded-r-md transition-colors leading-snug"
                    >
                      {item.text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        )}

        {/* 文章主体 */}
        <div className="flex-1 min-w-0 order-1" style={{ maxWidth: "820px" }}>
          <article className="mb-8">
            {/* 分类标签 */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {domain && (
                <Link
                  href={`/knowledge/domain/${domain.id}`}
                  className="text-xs px-2.5 py-1 bg-[#6B4C9A]/10 text-[#6B4C9A] rounded-full hover:bg-[#6B4C9A]/20 transition-colors"
                >
                  {domain.emoji} {domain.name}
                </Link>
              )}
              {contentType && (
                <span className="text-xs text-[#6F6876]">{contentType.name}</span>
              )}
              <span className="text-xs text-gray-300">·</span>
              <span className="text-xs text-[#6F6876]">⏱ 约{estimatedMinutes}分钟</span>
              {depthLevel && (
                <>
                  <span className="text-xs text-gray-300">·</span>
                  <span className="text-xs text-[#6F6876]">
                    深度：{depthLevel.name}
                  </span>
                </>
              )}
            </div>

            {/* 标题 */}
            <h1
              className="font-semibold text-[#2D2D2D] mb-3 leading-[1.25]"
              style={{ fontSize: "clamp(28px, 5vw, 36px)" }}
            >
              {content.title}
            </h1>

            {/* 副标题/摘要 */}
            <p className="text-base text-[#6F6876] mb-6 leading-relaxed">
              {content.public_summary}
            </p>

            {/* 信息栏：适合谁 + 你会得到什么 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              <div className="p-4 rounded-xl bg-[#F8F6FA] border border-[#E8DEFA]">
                <div className="text-xs text-[#6B4C9A] mb-2 font-medium">
                  👤 适合谁
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {suitableFor.length > 0 ? (
                    suitableFor.map((s) => (
                      <span
                        key={s}
                        className="text-xs px-2 py-0.5 bg-white text-[#6B4C9A] rounded-full border border-[#E8DEFA]"
                      >
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-[#6F6876]">对这个话题感兴趣的人</span>
                  )}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-[#F8F6FA] border border-[#E8DEFA]">
                <div className="text-xs text-[#6B4C9A] mb-2 font-medium">
                  ✨ 你会得到什么
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {benefits.length > 0 ? (
                    benefits.map((b) => (
                      <span
                        key={b}
                        className="text-xs px-2 py-0.5 bg-white text-[#6B4C9A] rounded-full border border-[#E8DEFA]"
                      >
                        {b}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-[#6F6876]">心理科普与自我探索</span>
                  )}
                </div>
              </div>
            </div>

            {/* 分隔线 */}
            <div className="border-t border-gray-100 my-6" />

            {/* QA05 安全层提示卡片（暖金/灰紫配色，非红色） */}
            {safetyRules.length > 0 && (
              <div className="mb-6 space-y-3">
                {safetyRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="p-5 rounded-2xl"
                    style={{
                      background: "#F8F6FA",
                      border: "1px solid #E8DEFA",
                      borderLeft: "4px solid #C9A96E",
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">⚠️</span>
                      <span className="text-sm font-semibold" style={{ color: "#4E376F" }}>
                        {rule.title}
                      </span>
                    </div>
                    <p className="text-sm leading-[1.8]" style={{ color: "#4E376F" }}>
                      {rule.message}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* 内容正文 */}
            {hasBody ? (
              <div className="qm-article-wrapper" style={{ maxWidth: "820px" }}>
                <MarkdownRenderer content={visibleBodyText} />
              </div>
            ) : (
              <div
                className="p-8 rounded-2xl text-center"
                style={{
                  background: "linear-gradient(135deg, #EEE8F6 0%, #F8F6FA 100%)",
                  border: "1px solid #E8DEFA",
                }}
              >
                <div className="text-4xl mb-3">📝</div>
                <h3 className="text-base font-medium text-[#2D2D2D] mb-2">
                  完整正文正在整理中
                </h3>
                <p className="text-sm text-[#6F6876] mb-4 leading-relaxed">
                  这篇内容的正文正在生产中。你可以先看看简介，
                  <br />
                  或者直接和小酷聊聊相关话题。
                </p>
                <Link
                  href="/chat"
                  onClick={(e) => {
                  e.preventDefault();
                  handleTalkXiaoku();
                }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-sm font-medium transition-all hover:bg-[#62428B]"
                  style={{ background: "#6B4C9A", minHeight: "44px" }}
                >
                  💬 和小酷聊聊
                </Link>
              </div>
            )}

            {/* 专业边界提示 */}
            <div
              className="mt-8 p-4 rounded-xl"
              style={{ background: "#F8F6FA", border: "1px solid #E8DEFA" }}
            >
              <p className="text-xs text-[#6F6876] leading-relaxed">
                ⚠️ 本文提供心理科普和自我探索参考，不构成诊断或治疗建议，也不替代专业心理咨询。
                如果你感到持续痛苦或困扰，请考虑寻求合格心理师或医疗专业人员的支持。
                如需预约 QM 心理师，请联系人工客服（微信 queermental2 / 电话 15001930070）。
              </p>
            </div>
          </article>

          {/* BottomCTA：文章底部固定行动区 */}
          <div className="mt-6 p-5 rounded-2xl bg-white border border-[#E8DEFA] shadow-sm qm-bottom-cta">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* 主CTA：和小酷聊聊（品牌紫实色按钮） */}
              <Link
                href="/chat"
                onClick={(e) => {
                  e.preventDefault();
                  handleTalkXiaoku();
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-white text-sm font-medium transition-all hover:bg-[#62428B]"
                style={{ background: "#6B4C9A", minHeight: "44px" }}
              >
                💬 和小酷聊聊
              </Link>
              {/* 次CTA：真人心理师（描边按钮） */}
              <Link
                href={bookingUrl}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-medium border border-[#6B4C9A]/30 text-[#6B4C9A] hover:bg-[#6B4C9A]/5 transition-all"
                style={{ minHeight: "44px" }}
              >
                📅 找心理师
              </Link>
            </div>
            {domain && (
              <div className="mt-3 text-center">
                <Link
                  href={`/knowledge/domain/${domain.id}`}
                  className="text-sm text-[#6F6876] hover:text-[#6B4C9A] transition-colors"
                >
                  ← 返回{domain.name}
                </Link>
              </div>
            )}
          </div>

          {/* 小酷 Dock：上下文相关动作 */}
          <div className="mt-6">
            <XiaokuDock content={content} />
          </div>
        </div>
      </div>

      {/* 相关推荐：桌面端横排3列，手机单列 */}
      {relatedContent.length > 0 && (
        <div className="mt-10 max-w-[820px]">
          <h3 className="text-base font-semibold text-[#2D2D2D] mb-4">
            相关内容
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {relatedContent.map((c) => (
              <ContentCard key={c.content_id} content={c} variant="compact" />
            ))}
          </div>
        </div>
      )}

      {/* 底部导航：三个返回路径 */}
      <div className="mt-8 pt-4 border-t border-gray-100 max-w-[820px]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4">
            {domain && (
              <Link
                href={`/knowledge/domain/${domain.id}`}
                className="text-sm text-[#6B4C9A] hover:underline"
              >
                ← 返回{domain.name}
              </Link>
            )}
            <Link
              href="/knowledge"
              className="text-sm text-[#6F6876] hover:text-[#6B4C9A] transition-colors"
            >
              知识库首页
            </Link>
            <Link
              href="/"
              className="text-sm text-[#6F6876] hover:text-[#6B4C9A] transition-colors"
            >
              网站首页
            </Link>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
