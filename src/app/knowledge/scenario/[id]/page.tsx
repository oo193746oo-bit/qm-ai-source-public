"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageLayout } from "@/components/page-layout";
import {
  getScenario,
  SCENARIOS,
  PURPOSES,
  CONTENT_TYPES,
  getDomain,
} from "@/lib/kb/kb-meta";
import {
  getContentByScenario,
  getPublicContent,
} from "@/lib/kb/kb-registry";
import { ContentCard } from "@/components/kb/content-card";

export default function ScenarioPage() {
  const params = useParams();
  const scenarioId = params.id as string;
  const scenario = getScenario(scenarioId);

  const [selectedPurpose, setSelectedPurpose] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");

  // 该场景下的内容
  const scenarioContent = useMemo(
    () => getContentByScenario(scenarioId),
    [scenarioId]
  );

  // 该场景涉及的目的
  const scenarioPurposes = useMemo(() => {
    const purposeIds = new Set<string>();
    for (const c of scenarioContent) {
      c.purpose_tags.forEach((p) => purposeIds.add(p));
    }
    return PURPOSES.filter((p) => purposeIds.has(p.id));
  }, [scenarioContent]);

  // 该场景涉及的内容形式
  const scenarioTypes = useMemo(() => {
    const typeIds = new Set<string>();
    for (const c of scenarioContent) {
      typeIds.add(c.content_type);
    }
    return CONTENT_TYPES.filter((t) => typeIds.has(t.id));
  }, [scenarioContent]);

  // 按目的分组
  const contentByPurpose = useMemo(() => {
    const groups: Record<string, typeof scenarioContent> = {};
    for (const c of scenarioContent) {
      for (const p of c.purpose_tags) {
        if (!groups[p]) groups[p] = [];
        groups[p].push(c);
      }
    }
    return groups;
  }, [scenarioContent]);

  // 筛选后
  const filteredContent = useMemo(() => {
    let result = scenarioContent;

    if (selectedPurpose) {
      result = result.filter((c) => c.purpose_tags.includes(selectedPurpose));
    }
    if (selectedType) {
      result = result.filter((c) => c.content_type === selectedType);
    }

    return result;
  }, [scenarioContent, selectedPurpose, selectedType]);

  // 相关场景（同领域附近）
  const relatedScenarios = useMemo(() => {
    // 简单取前后几个场景
    const idx = SCENARIOS.findIndex((s) => s.id === scenarioId);
    if (idx === -1) return [];
    const related: typeof SCENARIOS = [];
    for (let i = Math.max(0, idx - 2); i <= Math.min(SCENARIOS.length - 1, idx + 2); i++) {
      if (i !== idx) related.push(SCENARIOS[i]);
    }
    return related.slice(0, 4);
  }, [scenarioId]);

  if (!scenario) {
    return (
      <PageLayout title="场景不存在" showBack>
        <div className="text-center py-12 text-gray-400">
          <p className="mb-4">找不到这个场景</p>
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

  return (
    <PageLayout title={scenario.name} subtitle="找到适合你此刻的内容" showBack>
      {/* 场景头图 */}
      <div className="mb-6 p-5 bg-gradient-to-r from-pink-50 to-[var(--qm-purple-700)]/10 rounded-2xl">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">💭</span>
          <div>
            <div className="text-xs text-[var(--qm-purple-700)] mb-0.5">
              场景 {scenario.id}
            </div>
            <h2 className="text-lg font-semibold text-gray-800">
              {scenario.name}
            </h2>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          从不同目的和形式中，找到最适合你的方式
        </p>
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
          <span>📚 {scenarioContent.length} 篇内容</span>
          <span>🎯 {scenarioPurposes.length} 种目的</span>
          <span>📄 {scenarioTypes.length} 种形式</span>
        </div>
      </div>

      {/* 目的筛选 */}
      {scenarioPurposes.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-[var(--qm-purple-700)] rounded-full"></span>
            你想得到什么
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedPurpose("")}
              className={`text-xs px-3 py-1.5 rounded-full transition-all ${
                !selectedPurpose
                  ? "bg-[var(--qm-purple-700)] text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-[var(--qm-purple-700)]/30"
              }`}
            >
              全部目的
            </button>
            {scenarioPurposes.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPurpose(p.id)}
                className={`text-xs px-3 py-1.5 rounded-full transition-all ${
                  selectedPurpose === p.id
                    ? "bg-[var(--qm-purple-700)] text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-[var(--qm-purple-700)]/30"
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 内容形式筛选 */}
      {scenarioTypes.length > 1 && (
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
            {scenarioTypes.map((t) => (
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

      {/* 按目的分组展示（未筛选目的时） */}
      {!selectedPurpose ? (
        <div className="mb-6">
          {scenarioPurposes.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              这个场景的内容正在整理中，敬请期待
            </div>
          ) : (
            scenarioPurposes.map((p) => {
              const items = contentByPurpose[p.id] || [];
              if (items.length === 0) return null;
              return (
                <div key={p.id} className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 bg-[var(--qm-purple-700)]/10 text-[var(--qm-purple-700)] rounded-full">
                      {p.name}
                    </span>
                    <span className="text-xs text-gray-400">
                      {items.length} 篇
                    </span>
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {items.slice(0, 4).map((c) => (
                      <ContentCard key={c.content_id} content={c} variant="compact" />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* 筛选后平铺 */
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
      )}

      {/* 相关场景 */}
      {relatedScenarios.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-green-400 rounded-full"></span>
            相关场景
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {relatedScenarios.map((s) => (
              <Link
                key={s.id}
                href={`/knowledge/scenario/${s.id}`}
                className="p-3 bg-white rounded-xl border border-gray-100 hover:border-[var(--qm-purple-700)]/30 transition-all"
              >
                <div className="text-xs text-gray-400 mb-1">{s.id}</div>
                <div className="text-sm text-gray-700 hover:text-[var(--qm-purple-700)]">
                  {s.name}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 底部导航 */}
      <div className="mt-8 pt-4 border-t border-gray-100">
        <Link
          href="/knowledge"
          className="text-sm text-[var(--qm-purple-700)] hover:underline"
        >
          ← 返回知识库首页
        </Link>
      </div>
    </PageLayout>
  );
}
