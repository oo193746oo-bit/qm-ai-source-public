"use client";

import { PageLayout } from "@/components/page-layout";

/**
 * 数据留存与删除策略页
 * 定稿 v1.0 · 2026-09-01
 * 按工单 PART 5 收录映射组织四节内容
 * 方案B/C、决策点、工程实现10项等内部内容不上页
 */

export default function DataDeletionPage() {
  return (
    <PageLayout title="数据留存与删除策略" subtitle="你的数据由你掌控">
      <div className="max-w-2xl mx-auto py-2 md:py-4">
        <div className="bg-white/80 rounded-3xl p-6 md:p-10 border border-[var(--qm-line-100)] shadow-sm">
          <div className="mb-8">
            <p className="text-xs text-[var(--qm-ink-400)]">生效日期：2026-09-07 版本：v1.0</p>
          </div>

          <div className="text-sm md:text-[15px] text-[var(--qm-ink-700)] leading-[1.8] space-y-4">
            <blockquote className="border-l-4 border-[var(--qm-purple-400)] pl-4 italic text-[var(--qm-ink-600)]">
              本策略是《「小酷」隐私政策》的补充，说明我们如何留存和删除你的数据。
            </blockquote>

            <section className="mb-8">
              <h2 className="text-lg md:text-xl font-medium text-[var(--qm-ink-800)] mb-3 pb-2 border-b border-[var(--qm-line-100)]">
                一、我们留存哪些数据
              </h2>
              <p>我们按<strong>最小必要原则</strong>收集信息，只留存提供服务所必需的数据：</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>AI 对话记录</strong>：你与「小酷」的文字对话内容、对话时间；</li>
                <li><strong>语音消息</strong>：你主动发送的语音及其转写文字；</li>
                <li><strong>树洞记录</strong>：你在"树洞"留言墙主动发布的留言；</li>
                <li><strong>测评结果</strong>：你完成心理测评量表的作答与结果；</li>
                <li><strong>账号标识</strong>：你的扣子平台用户 ID、昵称、头像；</li>
                <li><strong>安全日志</strong>：访问时间、访问页面、崩溃日志、IP 地址（用于安全与故障排查）。</li>
              </ul>
              <p className="mt-2">你的对话、树洞、测评内容反映你的心理健康状况，且可能涉及你的性别身份与性倾向，均属于<strong>敏感个人信息</strong>，我们采取加密存储、严格权限管理等保护措施。</p>
            </section>

            <section className="mb-8">
              <h2 className="text-lg md:text-xl font-medium text-[var(--qm-ink-800)] mb-3 pb-2 border-b border-[var(--qm-line-100)]">
                二、数据留存多久
              </h2>
              <p>依据《个人信息保护法》第十九条"保存期限应当为实现处理目的所必要的最短时间"原则，我们采用分类留存策略：</p>
              
              <div className="overflow-x-auto my-4">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-[var(--qm-purple-50)]">
                      <th className="border border-[var(--qm-line-100)] p-2 text-left">数据类型</th>
                      <th className="border border-[var(--qm-line-100)] p-2 text-left">留存期限</th>
                      <th className="border border-[var(--qm-line-100)] p-2 text-left">说明</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-[var(--qm-line-100)] p-2">AI 对话记录</td>
                      <td className="border border-[var(--qm-line-100)] p-2"><strong>90 天</strong></td>
                      <td className="border border-[var(--qm-line-100)] p-2">仅保留最近 90 天会话上下文，到期滚动删除</td>
                    </tr>
                    <tr>
                      <td className="border border-[var(--qm-line-100)] p-2">语音消息</td>
                      <td className="border border-[var(--qm-line-100)] p-2"><strong>90 天</strong></td>
                      <td className="border border-[var(--qm-line-100)] p-2">原始音频随对话记录留存 90 天（供你回听），到期与对话记录一并删除</td>
                    </tr>
                    <tr>
                      <td className="border border-[var(--qm-line-100)] p-2">树洞记录</td>
                      <td className="border border-[var(--qm-line-100)] p-2">随账号保存</td>
                      <td className="border border-[var(--qm-line-100)] p-2">你发布的留言默认运营后台可见（用于安全巡查与内容审核），你可改为"仅自己可见"；支持单条删除 + 一键清空</td>
                    </tr>
                    <tr>
                      <td className="border border-[var(--qm-line-100)] p-2">测评结果</td>
                      <td className="border border-[var(--qm-line-100)] p-2"><strong>90 天</strong></td>
                      <td className="border border-[var(--qm-line-100)] p-2">到期匿名化或删除</td>
                    </tr>
                    <tr>
                      <td className="border border-[var(--qm-line-100)] p-2">安全日志</td>
                      <td className="border border-[var(--qm-line-100)] p-2"><strong>不少于 6 个月</strong></td>
                      <td className="border border-[var(--qm-line-100)] p-2">依《网络安全法》第二十三条留存</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p>超出期限或你删除后，我们将删除或匿名化处理；因法定留存期限未届满而暂不能删除的，我们将<strong>停止除存储和安全保护之外的一切处理</strong>（依据《个人信息保护法》第四十七条第二款）。</p>
            </section>

            <section className="mb-8">
              <h2 className="text-lg md:text-xl font-medium text-[var(--qm-ink-800)] mb-3 pb-2 border-b border-[var(--qm-line-100)]">
                三、你如何删除数据
              </h2>
              <p>我们提供两种删除通道：</p>

              <h3 className="text-base md:text-lg font-medium text-[var(--qm-ink-800)] mt-4 mb-2">第一通道：产品内自助（主打）</h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li><strong>删除单条/单段</strong>：对话长按删除；树洞条目删除；测评记录逐条删除；</li>
                <li><strong>清空某类数据</strong>：「设置 → 隐私与数据 → 清空对话记录 / 清空树洞 / 清空测评」，二次确认后执行；</li>
                <li><strong>清空全部内容数据</strong>：「设置 → 隐私与数据 → 清空我的全部数据」，确认后删除对话、树洞、测评数据；</li>
                <li><strong>撤回同意</strong>：关闭语音授权即停止语音收集；注销扣子账号后，触发删除。</li>
              </ol>

              <h3 className="text-base md:text-lg font-medium text-[var(--qm-ink-800)] mt-4 mb-2">第二通道：人工通道（兜底）</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>你发送邮件至 <strong>queermental@dingtalk.com</strong>，主题"数据删除/查阅申请"；</li>
                <li>我们在<strong>验证身份后 15 个工作日内</strong>完成并回复（对齐《个保法》第五十条受理机制）；</li>
                <li>拒绝请求须书面说明理由，告知投诉途径。</li>
              </ul>

              <p className="mt-4"><strong>删除后的法律保留</strong>：网络安全日志依法留存满 6 个月后方可删除，此期间<strong>停止除存储与安全保护外的一切处理</strong>（《个保法》第四十七条第二款）。</p>
            </section>

            <section className="mb-8">
              <h2 className="text-lg md:text-xl font-medium text-[var(--qm-ink-800)] mb-3 pb-2 border-b border-[var(--qm-line-100)]">
                四、特殊情形
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>不满 14 周岁用户</strong>：发现后立即删除全部数据（《个保法》第三十一条）；</li>
                <li><strong>用户死亡</strong>：近亲属可依《个保法》第四十九条行使查阅、删除等权利；</li>
                <li><strong>停止运营</strong>：停止收集、公告通知、对存量数据删除或匿名化（参照《个保法》第四十七条）。</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-lg md:text-xl font-medium text-[var(--qm-ink-800)] mb-3 pb-2 border-b border-[var(--qm-line-100)]">
                五、联系我们
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>个人信息处理者：<strong>上海酷雪心理咨询中心</strong>，地址：上海市静安区民立路150号二座3201室。</li>
                <li>数据事务联系邮箱：<strong>queermental@dingtalk.com</strong>。我们将在验证身份后 15 个工作日内回复。</li>
                <li>如你认为我们的处理活动侵害了你的权益，可向国家网信部门或地方网信部门投诉举报。</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
