"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageLayout } from "@/components/page-layout";
import {
  getDomain,
  DOMAINS,
  SCENARIOS,
  CONTENT_TYPES,
} from "@/lib/kb/kb-meta";
import {
  getContentByDomain,
  getSubtopicsByDomain,
  getPublicContent,
} from "@/lib/kb/kb-registry";
import { ContentCard } from "@/components/kb/content-card";

export default function DomainPage() {
  const params = useParams();
  const domainId = params.id as string;
  const domain = getDomain(domainId);

  const [selectedSubtopic, setSelectedSubtopic] = useState<string>("");
  const [selectedScenario, setSelectedScenario] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");

  // 领域内容
  const domainContent = useMemo(
    () => getContentByDomain(domainId),
    [domainId]
  );

  // 子议题列表
  const subtopics = useMemo(
    () => getSubtopicsByDomain(domainId),
    [domainId]
  );

  // 该领域涉及的场景
  const domainScenarios = useMemo(() => {
    const scenarioIds = new Set<string>();
    for (const c of domainContent) {
      c.scenario_tags.forEach((s) => scenarioIds.add(s));
    }
    return SCENARIOS.filter((s) => scenarioIds.has(s.id));
  }, [domainContent]);

  // 该领域涉及的内容形式
  const domainTypes = useMemo(() => {
    const typeIds = new Set<string>();
    for (const c of domainContent) {
      typeIds.add(c.content_type);
    }
    return CONTENT_TYPES.filter((t) => typeIds.has(t.id));
  }, [domainContent]);

  // 筛选后的内容
  const filteredContent = useMemo(() => {
    let result = domainContent;

    if (selectedSubtopic) {
      result = result.filter((c) => c.subtopic === selectedSubtopic);
    }
    if (selectedScenario) {
      result = result.filter((c) =>
        c.scenario_tags.includes(selectedScenario)
      );
    }
    if (selectedType) {
      result = result.filter((c) => c.content_type === selectedType);
    }

    return result;
  }, [domainContent, selectedSubtopic, selectedScenario, selectedType]);

  if (!domain) {
    return (
      <PageLayout title="领域不存在" showBack>
        <div className="text-center py-12 text-gray-400">
          <p className="mb-4">找不到这个领域</p>
          <Link
            href="/knowledge"
            className="text-[var(--qm-purple-700)] hover:underline text-sm"
          >
            返回知识库首页
          </Link>
        </div>
      </PageLayout>
    );
  }

  // 热门场景（前5个有内容的）
  const hotScenarios = domainScenarios.slice(0, 5);

  return (
    <PageLayout title={domain.name} subtitle={domain.description} showBack>
      {/* 领域头图 */}
      <div className="mb-6 p-5 bg-gradient-to-r from-[var(--qm-purple-700)]/10 to-pink-50 rounded-2xl">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-4xl">{domain.emoji}</span>
          <div>
            <div className="text-xs text-[var(--qm-purple-700)] mb-0.5">{domain.id}</div>
            <h2 className="text-xl font-semibold text-gray-800">
              {domain.name}
            </h2>
          </div>
        </div>
        <p className="text-sm text-gray-600">{domain.description}</p>
        <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
          <span>📚 {domainContent.length} 篇内容</span>
          <span>🗂 {subtopics.length} 个子议题</span>
          <span>🎯 {domainScenarios.length} 个场景</span>
        </div>
      </div>

      {/* 子议题地图 */}
      {subtopics.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-[var(--qm-purple-700)] rounded-full"></span>
            子议题地图
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedSubtopic("")}
              className={`text-xs px-3 py-1.5 rounded-full transition-all ${
                !selectedSubtopic
                  ? "bg-[var(--qm-purple-700)] text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-[var(--qm-purple-700)]/30"
              }`}
            >
              全部
            </button>
            {subtopics.map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSubtopic(s)}
                className={`text-xs px-3 py-1.5 rounded-full transition-all ${
                  selectedSubtopic === s
                    ? "bg-[var(--qm-purple-700)] text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-[var(--qm-purple-700)]/30"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 热门场景 */}
      {hotScenarios.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-[var(--qm-rose-500)] rounded-full"></span>
            热门场景
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <button
              onClick={() => setSelectedScenario("")}
              className={`text-xs px-3 py-2 rounded-xl text-left transition-all ${
                !selectedScenario
                  ? "bg-[var(--qm-rose-100)] text-[var(--qm-rose-500)] border border-[var(--qm-rose-100)]"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-[var(--qm-rose-100)]"
              }`}
            >
              全部场景
            </button>
            {hotScenarios.map((s) => (
              <Link
                key={s.id}
                href={`/knowledge/scenario/${s.id}`}
                className="p-2 bg-white rounded-xl border border-gray-100 hover:border-[var(--qm-purple-700)]/30 transition-all text-xs text-gray-600 hover:text-[var(--qm-purple-700)]"
              >
                <span className="text-gray-400">{s.id} </span>
                {s.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 内容形式筛选 */}
      {domainTypes.length > 1 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-amber-400 rounded-full"></span>
            内容形式
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedType("")}
              className={`text-xs px-3 py-1.5 rounded-full transition-all ${
                !selectedType
                  ? "bg-amber-500 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-amber-300"
              }`}
            >
              全部形式
            </button>
            {domainTypes.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedType(t.id)}
                className={`text-xs px-3 py-1.5 rounded-full transition-all ${
                  selectedType === t.id
                    ? "bg-amber-500 text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-amber-300"
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 内容列表 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700">
            内容列表
            <span className="text-xs text-gray-400 ml-2 font-normal">
              共 {filteredContent.length} 篇
            </span>
          </h3>
        </div>

        {filteredContent.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            当前筛选条件下暂无内容
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredContent.map((c) => (
              <ContentCard key={c.content_id} content={c} />
            ))}
          </div>
        )}
      </div>

      {/* 底部导航 */}
      <div className="mt-8 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <Link
            href="/knowledge"
            className="text-sm text-[var(--qm-purple-700)] hover:underline"
          >
            ← 返回知识库首页
          </Link>
          <div className="flex items-center gap-2">
            {DOMAINS.filter((d) => d.id !== domainId)
              .slice(0, 3)
              .map((d) => (
                <Link
                  key={d.id}
                  href={`/knowledge/domain/${d.id}`}
                  className="text-xs text-gray-400 hover:text-[var(--qm-purple-700)]"
                  title={d.name}
                >
                  {d.emoji}
                </Link>
              ))}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
