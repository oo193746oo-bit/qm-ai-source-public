import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '服务条款 - QM AI 心理支持',
  description: 'QM AI 心理支持服务条款，了解使用我们服务的条款和条件。',
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
