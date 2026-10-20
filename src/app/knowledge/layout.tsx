import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '知识库 - QM AI 心理支持',
  description: 'QM AI 心理支持知识库，提供心理科普、情绪调节、关系处理等方面的文章和资源。',
};

export default function KnowledgeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
