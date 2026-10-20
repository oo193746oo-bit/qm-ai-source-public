"use client";

import Link from "next/link";
import { PageLayout } from "@/components/page-layout";
import { SCENARIOS } from "@/lib/kb/kb-meta";

export default function KnowledgeScenarioIndexPage() {
  return (
    <PageLayout
      title="场景导航"
      subtitle="从你此刻的状态出发，找到适合你的内容"
      bodyClassName="qm-bg-knowledge"
    >
      <div className="mb-8">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {SCENARIOS.map((s) => (
            <Link
              key={s.id}
              href={`/knowledge/scenario/${s.id}`}
              className="p-3 text-left bg-white rounded-xl border border-gray-100 hover:border-[var(--qm-amber-600)]/30 hover:bg-[var(--qm-amber-600)]/5 transition-all text-sm text-gray-700 hover:text-[var(--qm-amber-600)]"
            >
              <span className="text-xs text-gray-400 mr-1">{s.id}</span>
              {s.name}
            </Link>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-4">
          共 {SCENARIOS.length} 个场景入口，点击进入对应场景的内容集合
        </p>
      </div>
    </PageLayout>
  );
}