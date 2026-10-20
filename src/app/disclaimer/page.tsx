"use client";

import { PageLayout } from "@/components/page-layout";

/**
 * 免责声明页
 * 定稿 v1.0 · 2026-09-01
 * 逐字照录 03_免责声明_初稿v0.1.md
 */

export default function DisclaimerPage() {
  return (
    <PageLayout title="免责声明" subtitle="请在使用前了解">
      <div className="max-w-2xl mx-auto py-2 md:py-4">
        <div className="bg-white/80 rounded-3xl p-6 md:p-10 border border-[var(--qm-line-100)] shadow-sm">
          <div className="mb-8">
            <p className="text-xs text-[var(--qm-ink-400)]">生效日期：2026-09-07 版本：v1.0</p>
          </div>

          <div className="text-sm md:text-[15px] text-[var(--qm-ink-700)] leading-[1.8] space-y-4">
            <blockquote className="border-l-4 border-[var(--qm-purple-400)] pl-4 italic text-[var(--qm-ink-600)]">
              本免责声明是《「小酷」用户协议》的组成部分。请在使用「小酷」前仔细阅读。
            </blockquote>

            <section className="mb-8">
              <h2 className="text-lg md:text-xl font-medium text-[var(--qm-ink-800)] mb-3 pb-2 border-b border-[var(--qm-line-100)]">
                一、服务性质
              </h2>
              <ol className="list-decimal pl-5 space-y-2">
                <li>「小酷」是一款基于生成式人工智能技术的<strong>心理陪伴与情绪支持工具</strong>，由<strong>上海酷雪心理咨询中心</strong>（个人独资企业，统一社会信用代码 91310113MA1GNEEKXT）开发和运营。</li>
                <li><strong>本服务不是医疗服务，不是心理咨询或心理治疗，不能替代精神科医生的诊断与治疗，也不能替代持证心理咨询师的专业咨询。</strong></li>
                <li>AI 生成的任何内容均<strong>不构成医学诊断、治疗建议或用药指导</strong>，也不应作为你作出任何重大决定的唯一依据。</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-lg md:text-xl font-medium text-[var(--qm-ink-800)] mb-3 pb-2 border-b border-[var(--qm-line-100)]">
                二、AI 内容的局限性
              </h2>
              <ol className="list-decimal pl-5 space-y-2">
                <li>本服务的回复由人工智能生成，<strong>可能存在不准确、不完整甚至"一本正经地说错"的情况</strong>，尤其涉及医学、用药、法律等专业问题时，请勿将其作为专业意见采纳。</li>
                <li>心理测评量表的结果仅反映你作答当下的状态参考，<strong>不构成任何诊断结论</strong>；如结果提示需要关注，请联系专业机构。</li>
                <li>我们依据《人工智能生成合成内容标识办法》（2025年9月1日施行）第四条、第八条要求，在 AI 交互场景中以显著方式提示内容由 AI 生成。</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-lg md:text-xl font-medium text-[var(--qm-ink-800)] mb-3 pb-2 border-b border-[var(--qm-line-100)]">
                三、紧急情况
              </h2>
              <ol className="list-decimal pl-5 space-y-2">
                <li><strong>如果你正出现自伤、自杀念头或处于紧急危险中，请立即拨打 110 或 120；需要即时心理支持，请拨打 12356（全国心理援助热线，24小时免费）或危机专线 15001930070、备用 13601658763（均24小时）。</strong></li>
                <li>AI 对话<strong>不能处理紧急危机</strong>，请勿等待 AI 回复。因你隐瞒真实紧急状况、未及时拨打紧急电话而延误求助导致的后果，由你自行承担。</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-lg md:text-xl font-medium text-[var(--qm-ink-800)] mb-3 pb-2 border-b border-[var(--qm-line-100)]">
                四、免责范围
              </h2>
              <p><strong>除法律另有强制性规定外，以下情形我们不承担责任：</strong></p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>因 AI 生成内容不准确、不完整，而你据此自行作出决定所导致的后果；</li>
                <li>因你隐瞒真实紧急状况、未及时拨打紧急电话而延误求助导致的后果；</li>
                <li>因你自身泄露账号、主动公开自己的树洞或对话内容导致的信息泄露；</li>
                <li>因不可抗力、基础电信/云服务商/扣子平台故障导致的服务中断或数据损失；</li>
                <li>因你违反本协议或法律导致的损失，以及你对第三方造成的损害，由你自行承担。</li>
              </ol>
              <p>本条不排除或限制法律规定不得排除的责任（如我们因过错侵害你个人信息权益的，依《个人信息保护法》第六十九条承担相应责任）。</p>
            </section>

            <section className="mb-8">
              <h2 className="text-lg md:text-xl font-medium text-[var(--qm-ink-800)] mb-3 pb-2 border-b border-[var(--qm-line-100)]">
                五、投诉与联系
              </h2>
              <ol className="list-decimal pl-5 space-y-2">
                <li>如你对本服务有任何疑问或投诉，可通过邮件 <strong>queermental@dingtalk.com</strong> 联系我们，我们将在收到后及时处理并反馈。</li>
                <li>你也可以依据《生成式人工智能服务管理暂行办法》第十八条向网信等主管部门投诉举报。</li>
              </ol>
            </section>

            <div className="mt-8 p-4 bg-[var(--qm-purple-50)] rounded-2xl">
              <p className="text-sm text-[var(--qm-ink-700)]">
                <strong>再次提醒</strong>：你正在使用的是一个 AI 陪伴工具。它能倾听，但不能救急；能陪伴，但不能看病。难受的时候，除了找「小酷」聊聊，也请记得拨打 <strong>12356（24小时）</strong>，或在危急时拨打 <strong>110 / 120</strong>。
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
