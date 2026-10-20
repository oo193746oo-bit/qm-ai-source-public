import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '树洞 - QM AI 心理支持平台',
  description: '在 QM 树洞中倾诉你的心声，获取温暖的心理支持。',
};

export default function TreeholeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
