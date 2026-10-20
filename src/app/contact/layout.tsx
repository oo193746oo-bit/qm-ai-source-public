import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '联系我们 - QM AI 心理支持平台',
  description: '联系 QM 酷儿心理团队，获取心理支持服务信息。',
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
