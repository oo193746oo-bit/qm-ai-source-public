"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { PageLayout } from "@/components/page-layout";
import { DOMAINS, SCENARIOS, getDomain } from "@/lib/kb/kb-meta";
import {
  getPublicContent,
  getContentByDomain,
  searchContent,
  KB_STATS,
} from "@/lib/kb/kb-registry";
import type { RecommendResult } from "@/lib/kb/kb-recommend";
import { ContentCard } from "@/components/kb/content-card";

export default function KnowledgePageClient({ exploreRecs }: { exploreRecs: RecommendResult[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [scenarioFilter, setScenarioFilter] = useState("");
  const [showAllScenarios, setShowAllScenarios] = useState(false);

  // 搜索结果（只搜 public_ready）
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchContent(searchQuery);
  }, [searchQuery]);

  // 场景筛选后的卡片
  const scenarioResults = useMemo(() => {
    if (!scenarioFilter) return [];
    // 按场景找内容
    return getPublicContent().filter((c) =>
      c.scenario_tags.includes(scenarioFilter)
    );
  }, [scenarioFilter]);

  // 各领域卡片数
  const domainCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const d of DOMAINS) {
      counts[d.id] = getContentByDomain(d.id).length;
    }
    return counts;
  }, []);

  // 首页展示的场景（默认展示前12个，可展开）
  const visibleScenarios = showAllScenarios ? SCENARIOS : SCENARIOS.slice(0, 12);

  // 推荐由服务端生成并序列化，首次水合使用同一组内容。

  const currentScenario = scenarioFilter
    ? SCENARIOS.find((s) => s.id === scenarioFilter)
    : null;

  return (
    <PageLayout
      title="心理知识库"
      subtitle="关于心理、性别、关系——你想了解的，也许都在这里"
      bodyClassName="qm-bg-knowledge"
    >
      {/* 搜索框 */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索心理知识、话题、练习..."
            className="w-full px-4 py-3 pl-10 bg-white rounded-2xl border border-gray-200 focus:border-[var(--qm-amber-600)] focus:ring-2 focus:ring-[var(--qm-amber-600)]/20 outline-none text-sm transition-all"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        {searchQuery && (
          <p className="text-xs text-gray-400 mt-2">
            找到 {searchResults.length} 篇相关内容
          </p>
        )}
      </div>

      {/* 搜索结果 */}
      {searchQuery && (
        <div className="mb-8">
          <h2 className="text-base font-semibold text-gray-800 mb-4">
            搜索结果
          </h2>
          {searchResults.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              没有找到相关内容，换个关键词试试？
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {searchResults.slice(0, 10).map((c) => (
                <ContentCard key={c.content_id} content={c} variant="compact" />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 场景筛选结果 */}
      {scenarioFilter && !searchQuery && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">
              「{currentScenario?.name}」相关内容
            </h2>
            <button
              onClick={() => setScenarioFilter("")}
              className="text-xs text-[var(--qm-amber-600)] hover:underline"
            >
              清除筛选
            </button>
          </div>
          {scenarioResults.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              这个场景的内容正在整理中，敬请期待
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {scenarioResults.map((c) => (
                <ContentCard key={c.content_id} content={c} variant="compact" />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 我现在需要什么（36场景入口） */}
      {!searchQuery && !scenarioFilter && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">
              我现在需要什么
            </h2>
            <button
              onClick={() => setShowAllScenarios(!showAllScenarios)}
              className="text-xs text-[var(--qm-amber-600)] hover:underline"
            >
              {showAllScenarios ? "收起" : `展开全部 ${SCENARIOS.length} 个`}
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {visibleScenarios.map((s) => (
              <button
                key={s.id}
                onClick={() => setScenarioFilter(s.id)}
                className="p-3 text-left bg-white rounded-xl border border-gray-100 hover:border-[var(--qm-amber-600)]/30 hover:bg-[var(--qm-amber-600)]/5 transition-all text-sm text-gray-700 hover:text-[var(--qm-amber-600)]"
              >
                <span className="text-xs text-gray-400 mr-1">{s.id}</span>
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 16 领域卡片 */}
      {!searchQuery && !scenarioFilter && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">16 个领域</h2>
            <span className="text-xs text-gray-400">
              {KB_STATS.publicReadyCount} 篇内容 · 可公开阅读
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {DOMAINS.map((d) => (
              <Link
                key={d.id}
                href={`/knowledge/domain/${d.id}`}
                className="group flex items-start gap-3 p-4 bg-white rounded-2xl border border-gray-100 hover:border-[var(--qm-amber-600)]/30 hover:shadow-md transition-all"
              >
                <span className="text-2xl flex-shrink-0">{d.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-400">{d.id}</span>
                    <h3 className="text-sm font-medium text-gray-800 group-hover:text-[var(--qm-amber-600)] transition-colors">
                      {d.name}
                    </h3>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-1">
                    {d.description}
                  </p>
                  <div className="text-xs text-[var(--qm-amber-600)] mt-2">
                    {domainCounts[d.id]} 篇内容 →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 随便看看 CTA */}
      {!searchQuery && !scenarioFilter && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">随便看看</h2>
            <button
              onClick={() => window.location.reload()}
              className="text-xs text-[var(--qm-amber-600)] hover:underline"
            >
              换一批
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {exploreRecs.map((r) => (
              <div key={r.content.content_id} className="relative">
                <ContentCard content={r.content} />
                <div className="absolute top-3 right-3 text-xs text-[var(--qm-amber-600)] bg-white/80 px-2 py-0.5 rounded-full">
                  {r.reason}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 底部CTA */}
      <div className="mt-8 p-6 bg-gradient-to-r from-[var(--qm-amber-600)]/10 to-[var(--qm-rose-100)] rounded-2xl text-center">
        <p className="text-sm text-gray-700 mb-3">
          没找到你想要的？可以和小酷聊聊
        </p>
        <Link
          href="/"
          className="inline-block px-5 py-2 bg-white text-[var(--qm-amber-600)] rounded-full text-sm font-medium shadow-sm hover:shadow transition-shadow"
        >
          💬 和小酷聊聊
        </Link>
        <p className="text-xs text-gray-400 mt-4">
          生活没有标准答案 · QM 热线 15001930070
        </p>
      </div>
    </PageLayout>
  );
}
