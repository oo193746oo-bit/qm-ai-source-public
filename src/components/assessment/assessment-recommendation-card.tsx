'use client';

// ============================================================
// QM AI — Assessment Recommendation Card v1.0
// 在小酷对话中渲染可点击的测评推荐卡片
// 由 chat-interface 在 AI 回复中识别结构化 action 后自动渲染
// ============================================================

import Link from 'next/link';
import { useState } from 'react';
import {
  shouldSuppressRecommendation,
  markRecommendationDismissed,
  markRecommendationShown,
  findAssessmentByKey,
} from '@/lib/assessments/canonical-registry';

export interface RecommendationAction {
  type: 'assessment_recommendation';
  assessment_key: string;
  title: string;
  reason: string;
  cta?: string;
  route?: string;
  dismissible?: boolean;
}

export function isRecommendationAction(obj: unknown): obj is RecommendationAction {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  return (
    o.type === 'assessment_recommendation' &&
    typeof o.assessment_key === 'string' &&
    typeof o.title === 'string'
  );
}

interface Props {
  action: RecommendationAction;
  onDismissed?: () => void;
}

export function AssessmentRecommendationCard({ action, onDismissed }: Props) {
  const [dismissed, setDismissed] = useState(false);

  // 已被节流（拒绝/30天内完成/超过2次）则不显示
  if (dismissed || shouldSuppressRecommendation(action.assessment_key)) {
    return null;
  }

  // 展示时累计计数
  if (typeof window !== 'undefined') {
    markRecommendationShown();
  }

  const canonical = findAssessmentByKey(action.assessment_key);
  const targetRoute =
    action.route || canonical?.href || '/assessments';
  const displayTitle = action.title || canonical?.title || '心理测评';
  const cta = action.cta || '开始测评';

  const handleDismiss = () => {
    if (action.dismissible !== false) {
      markRecommendationDismissed(action.assessment_key);
      setDismissed(true);
      onDismissed?.();
    }
  };

  return (
    <div className="my-3 rounded-2xl border border-[#E8DCD6] bg-white overflow-hidden shadow-sm max-w-md">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#B794F4] to-[#F687B3] flex items-center justify-center text-white text-lg flex-shrink-0"
          >
            {canonical?.icon ?? '📋'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#4A4A4A] mb-1">
              {displayTitle}
            </p>
            <p className="text-xs text-[#7A6A62] leading-relaxed">
              {action.reason}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <Link
            href={targetRoute}
            className="flex-1 text-center py-2 rounded-full text-sm text-white font-medium"
            style={{
              background: 'linear-gradient(135deg, #B794F4, #F687B3)',
            }}
          >
            {cta}
          </Link>
          {action.dismissible !== false && (
            <button
              type="button"
              onClick={handleDismiss}
              className="px-3 py-2 rounded-full text-xs text-[#9B8B83] hover:bg-[#FAF5F2]"
            >
              暂不需要
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
