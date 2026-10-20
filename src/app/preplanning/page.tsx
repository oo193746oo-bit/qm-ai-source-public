import { PageLayout } from "@/components/page-layout";
import { R45_ENTRY_ENABLED } from "@/lib/r45-config";
import R45Chat from "@/components/r45/r45-chat";

export const metadata = {
  title: "意定监护与预先照护规划 · QM上海酷儿心理咨询中心",
  description:
    "了解意定监护与预先照护规划：医疗意愿、财产安排、权利义务与不替代法律意见的合规说明。",
};

const SCENARIOS = [
  {
    title: "医疗决策",
    points: [
      "患病或无法表达意愿时，谁有权代为作医疗决定",
      "预先指示的效力与沟通边界",
      "提前与家人、伴侣对齐照护偏好",
    ],
  },
  {
    title: "财产安排",
    points: [
      "意定监护下的财产管理与监督机制",
      "避免财物纠纷的书面约定要点",
      "与继承、信托等安排的协调",
    ],
  },
  {
    title: "权利义务",
    points: [
      "监护人的职责、权限与限制",
      "被监护人的权利保障与撤销路径",
      "多元家庭关系下的法律适用",
    ],
  },
];

export default function PreplanningPage() {
  return (
    <PageLayout title="意定监护与预先照护规划">
    <main className="mx-auto w-full max-w-5xl px-5 py-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[24px] border border-[var(--qm-amber-100)] bg-gradient-to-br from-[var(--qm-amber-100)/60] to-[#FDF6EC] px-6 py-12 text-center">
        <h1 className="text-2xl font-semibold leading-snug text-[var(--qm-ink-900)] md:text-3xl">
          意定监护与预先照护规划
        </h1>
        <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-[var(--qm-ink-600)]">
          在健康与清醒时，提前规划未来的医疗、财产与照护选择，
          让每一个重要决定都能被尊重。QM 为你提供结构化引导与专业资源。
        </p>

        {/* 对话入口：接入平台意定监护 Bot（服务端 /api/r45/chat 转发 + SSE 流式） */}
        <div className="mt-6">
          {R45_ENTRY_ENABLED ? (
            <R45Chat />
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex cursor-not-allowed items-center gap-2 rounded-full bg-[var(--qm-line-100)] px-6 py-3 text-sm font-medium text-[var(--qm-ink-500)]"
            >
              建设中的对话服务 · 敬请期待
            </button>
          )}
        </div>
      </section>

      {/* 三大场景 */}
      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {SCENARIOS.map((s) => (
          <div
            key={s.title}
            className="rounded-[20px] border border-[var(--qm-line-100)] bg-white p-6"
          >
            <h2 className="text-base font-semibold text-[var(--qm-ink-800)]">{s.title}</h2>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--qm-ink-600)]">
              {s.points.map((p) => (
                <li key={p} className="flex gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--qm-amber-500)]" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      {/* 合规声明 */}
      <section className="mt-8 rounded-[20px] border border-[var(--qm-amber-100)] bg-[var(--qm-amber-100)/40] p-5">
        <h2 className="text-sm font-semibold text-[var(--qm-ink-700)]">合规说明</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--qm-ink-600)]">
          意定监护涉及重要法律安排，本页提供的均为概念性普及信息，
          <strong className="font-semibold text-[var(--qm-ink-800)]">不构成法律意见</strong>。
          实际规划请结合自身情况，必要时咨询具备资质的执业律师或公证机构。
        </p>
      </section>
    </main>
    </PageLayout>
  );
}