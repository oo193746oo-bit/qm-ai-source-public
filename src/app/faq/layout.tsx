import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '常见问题 - QM AI 心理支持',
  description: 'QM AI 心理支持常见问题解答，包括咨询相关、AI 相关、隐私相关、服务相关问题。',
};

export default function FaqLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
