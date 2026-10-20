'use client';

import { useParams, notFound } from 'next/navigation';
import AssessmentEngine from '@/components/assessment-engine';
import { allAssessments } from '@/lib/assessments/data';
import { PageLayout } from '@/components/page-layout';

export default function AssessmentPage() {
  const params = useParams<{ id: string }>();
  const assessment = allAssessments.find((a) => a.id === params.id);

  if (!assessment) {
    notFound();
  }

  return (
    <PageLayout title={assessment?.title || '心理测评'} showBack>
      <AssessmentEngine assessment={assessment!} />
    </PageLayout>
  );
}
