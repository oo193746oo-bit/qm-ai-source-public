import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '心理测评 - QM AI 心理支持平台',
  description: '专业心理测评量表，帮助你更好地了解自己。包含 SCL-90、Big Five、价值观测评等多种量表。',
};

export default function AssessmentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
