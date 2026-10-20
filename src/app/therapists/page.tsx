import type { Metadata } from "next";
import { THERAPISTS } from "@/lib/booking/data";
import { ApprovedTherapistList } from "./_components/approved-therapist-list";
import "./therapists-l1.css";

/**
 * QM-UIUX-THERAPISTS-L1-001 / v1.1: desktop list against approved v2.10.
 * Preserve original SEO/build anchor; task metadata identifies this isolated candidate.
 * Mobile and detail construction are deferred; the homepage candidate is not imported.
 */
export const metadata: Metadata = {
  title: "心理师团队 · QM上海酷儿心理咨询中心",
  description:
    "浏览 QM 酷儿心理团队的心理师与职场教练，了解擅长方向与收费，通过人工客服完成预约前置沟通。",
  openGraph: {
    title: "QM AI - 心理支持助手",
    description:
      "面向多元性别人群的心理支持助手，提供安全、温暖的情绪支持空间。",
    url: "https://queermental.coze.site/therapists",
    siteName: "QM AI",
    locale: "zh_CN",
    images: [{ url: "https://queermental.coze.site/qm-v5/og-image.png" }],
  },
  other: {
    "x-qm-build": "v3.1-phase1-r3-fixbatch1-immersive",
    "qm-task": "QM-UIUX-THERAPISTS-L1-001",
    "qm-spec": "v1.1",
    "qm-approved-visual": "v2.10",
  },
};


/**
 * Booking data stays unchanged; the page-local approved contract owns display/position only.
 */
export default async function TherapistListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const roster = THERAPISTS.filter(
    (t) => t.role === "心理师" || t.role === "心理教练（非心理师）",
  );

  return <ApprovedTherapistList roster={roster} initialQuery={await searchParams} />;
}
