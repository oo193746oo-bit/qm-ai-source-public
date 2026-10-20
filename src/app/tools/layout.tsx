import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '自助工具 - QM AI 心理支持',
  description: 'QM AI 心理支持自助工具，包括呼吸练习、情绪日记、冥想引导等。',
};

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
