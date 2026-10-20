import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '关于 QM - QM AI 心理支持',
  description: '了解 QM AI 心理支持平台，我们的使命、团队和服务。',
};

export default function AboutQmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
