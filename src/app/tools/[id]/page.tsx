import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageLayout } from "@/components/page-layout";
import { TOOL_REGISTRY } from "@/lib/tools/tool-registry";
import ToolDetailClient from "./tool-detail-client";

// 批3b(20260923)：/tools/[id] 工具详情页（842: B1-032 / B4-TOOL-F02 等 32 行）
// 数据驱动：id → TOOL_REGISTRY 查表；未知 id → notFound() 404
// 零内容发明：全部文案 TOOL_REGISTRY 直出（B4-TOOL-P01）；C8 safety_note 必显（危机安全优先）
interface ToolDetailPageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return TOOL_REGISTRY.map((t) => ({ id: t.tool_id }));
}

export async function generateMetadata({
  params,
}: ToolDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const tool = TOOL_REGISTRY.find((t) => t.tool_id === id);
  if (!tool) {
    return { title: "工具未找到 | QM AI 心理支持" };
  }
  return {
    title: `${tool.name} · 自助工具 | QM AI 心理支持`,
    description: tool.mechanism,
  };
}

export default async function ToolDetailPage({ params }: ToolDetailPageProps) {
  const { id } = await params;
  const tool = TOOL_REGISTRY.find((t) => t.tool_id === id);
  if (!tool) notFound();

  return (
    <main className="qm-page-shell">
      <div className="max-w-2xl mx-auto px-4">
        <nav
          aria-label="面包屑"
          style={{ fontSize: 13, color: "#8a8a8e", padding: "12px 4px 0" }}
        >
          <Link
            href="/tools"
            style={{ color: "inherit", textDecoration: "none" }}
          >
            自助工具
          </Link>
          <span aria-hidden style={{ margin: "0 8px" }}>/</span>
          <span style={{ color: "#3f3f46" }}>{tool.name}</span>
        </nav>
        <ToolDetailClient tool={tool} />
      </div>
    </main>
  );
}
