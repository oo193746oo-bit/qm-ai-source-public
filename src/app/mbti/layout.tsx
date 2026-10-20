import type { Metadata } from "next";

// 批3b(20260923)：/mbti 页 title 定制（原沿用根 layout 默认「QM AI - 心理支持助手」）
export const metadata: Metadata = {
  title: "MBTI 十六型人格 · 自助工具 | QM AI 心理支持",
  description: "MBTI 十六型人格自助测评工具，了解自己的人格偏好与优势。",
};

export default function MbtiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
