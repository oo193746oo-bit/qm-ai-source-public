import Link from 'next/link';
import { allAssessments } from '@/lib/assessments/data';
import { PageLayout } from '@/components/page-layout';

export default function AssessmentsPage() {
  return (
    <PageLayout title="心理测评" subtitle="自我探索工具">
      <div className="pb-12">
        {/* 页面标题 */}
        <div className="text-center mb-10">
          <div className="text-3xl mb-3">🔍</div>
          <h2 className="text-xl md:text-2xl font-semibold mb-2" style={{ color: 'var(--qm-ink-800)' }}>
            心理测评中心
          </h2>
          <p className="text-sm max-w-lg mx-auto" style={{ color: 'var(--qm-ink-600)', lineHeight: 1.8 }}>
            通过科学的测评工具，更好地了解自己。<br />
            所有测评仅供自我探索参考，不构成诊断。
          </p>
        </div>

        {/* 测评卡片网格 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {allAssessments.map((assessment) => {
            const isMbtiMain = assessment.id === 'mbti';
            // B4-TEST-003/F02：MBTI 入口统一指向 93 题正式版 /mbti，题数按正式源显示
            const href = isMbtiMain ? '/mbti' : `/assessments/${assessment.id}`;
            const qCount = assessment.questionCount;
            return (
            <Link
              key={assessment.id}
              href={href}
              className="block group"
            >
              <div
                className="rounded-2xl p-4 md:p-6 h-full transition-all duration-300 hover:scale-[1.02] cursor-pointer shadow-sm"
                style={{ background: 'white' }}
              >
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${assessment.color} flex items-center justify-center text-2xl mb-4 shadow-sm`}
                >
                  {assessment.icon}
                </div>
                <h3 className="font-semibold text-lg mb-1" style={{ color: 'var(--qm-ink-800)' }}>
                  {assessment.title}
                  {isMbtiMain && (
                    <span className="ml-1.5 inline-block align-middle text-[10px] px-1.5 py-0.5 rounded bg-[#6B4C9A]/10 text-[#6B4C9A] whitespace-nowrap">
                      93题完整版
                    </span>
                  )}
                </h3>
                <p className="text-sm mb-3" style={{ color: 'var(--qm-purple-400)', fontWeight: 500 }}>
                  {assessment.subtitle}
                </p>
                <p className="text-sm mb-4" style={{ color: 'var(--qm-ink-600)', lineHeight: 1.7 }}>
                  {assessment.description}
                </p>
                <div className="flex items-center justify-between text-xs" style={{ color: 'var(--qm-ink-500)' }}>
                  <span>
                    {qCount} 题 · {assessment.duration}
                  </span>
                  <span
                    className="inline-flex items-center gap-1 transition-colors group-hover:text-purple-500"
                  >
                    开始
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </span>
                </div>
              </div>
            </Link>
            );
          })}
        </div>

        {/* 温馨提示 */}
        <div
          className="mt-10 rounded-2xl p-6 text-center"
          style={{ background: 'rgba(167, 139, 250, 0.08)' }}
        >
          <div className="text-lg mb-2">💡 温馨提示</div>
          <p className="text-sm" style={{ color: 'var(--qm-ink-600)', lineHeight: 1.8 }}>
            心理测评是自我探索的工具，不是给你贴标签。<br />
            如果测评结果让你感到困扰，或者你想深入聊聊，<br />
            随时可以回到聊天，小酷会陪着你。
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-full text-sm font-medium transition-all hover:bg-[#62428B] min-h-[40px]"
            style={{ background: '#6B4C9A', color: 'white' }}
          >
            去找小酷聊聊
          </Link>
        </div>
      </div>
    </PageLayout>
  );
}
