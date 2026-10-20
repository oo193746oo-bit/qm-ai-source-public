import type { Metadata } from "next";
import { BrandIndependent } from "@/components/qm-brand-desktop/brand-independent";
import "./brand-desktop.css";

const description = "QM以多元文化视角提供心理支持。理解具体处境，尊重不同的生活选择。";
export const metadata: Metadata = {
  title: "关于QM · 生活没有标准答案",
  description,
  openGraph: {
    title: "关于QM · 生活没有标准答案",
    description,
    url: "https://queermental.coze.site/about-qm",
    images: [{ url: "/qm-brand-desktop/independent/brand-space.webp", alt: "QM品牌空间情境" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "关于QM · 生活没有标准答案",
    description,
    images: ["/qm-brand-desktop/independent/brand-space.webp"],
  },
};

export default function AboutQMPage() { return <BrandIndependent />; }
