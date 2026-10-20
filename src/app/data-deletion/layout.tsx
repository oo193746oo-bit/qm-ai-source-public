import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '数据删除 - QM AI 心理支持',
  description: 'QM AI 心理支持数据删除指南，了解如何删除你的个人数据。',
};

export default function DataDeletionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
