import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '隐私政策 - QM AI 心理支持',
  description: 'QM AI 心理支持隐私政策，了解我们如何保护你的个人信息。',
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
