"use client";

import { PageLayout } from "@/components/page-layout";

/**
 * 隐私政策页
 * 定稿 v1.0 · 2026-09-01
 * 逐字照录 01_隐私政策_初稿v0.1.md
 */

export default function PrivacyPage() {
  return (
    <PageLayout title="隐私政策" subtitle="你的数据由你掌控">
      <div className="max-w-2xl mx-auto py-2 md:py-4">
        <div className="bg-white/80 rounded-3xl p-6 md:p-10 border border-[var(--qm-line-100)] shadow-sm">
          <div className="mb-8">
            <p className="text-xs text-[var(--qm-ink-400)]">生效日期：2026-09-07 版本：v1.0</p>
          </div>

          <div className="text-sm md:text-[15px] text-[var(--qm-ink-700)] leading-[1.8] space-y-4">
            <blockquote className="border-l-4 border-[var(--qm-purple-400)] pl-4 italic text-[var(--qm-ink-600)]">
              说明：本产品目前处于小规模试运营（POC）阶段。本政策可能随产品调整而更新；若更新影响你的重要权益，我们会在产品内以显著方式重新征求你的同意。
            </blockquote>

            <section className="mb-8">
              <h2 className="text-lg md:text-xl font-medium text-[var(--qm-ink-800)] mb-3 pb-2 border-b border-[var(--qm-line-100)]">
                写在前面（请先读这一段）
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>「小酷」是什么</strong>：「小酷」是一款面向 LGBTQ 及多元性别群体的 AI 心理陪伴产品（网址：https://queermental.coze.site ），提供 AI 文字/语音对话陪伴（支持语音回听）、树洞留言墙、心理测评量表、心理健康知识文章与自助工具。</li>
                <li><strong>我们是谁</strong>：本产品由<strong>上海酷雪心理咨询中心</strong>（个人独资企业，统一社会信用代码 91310113MA1GNEEKXT，2019 年成立，下称"我们"）开发和运营，团队位于上海。<strong>我们是你个人信息处理活动的"个人信息处理者"</strong>，依法承担个人信息保护责任。</li>
                <li><strong>你写下的内容很重要</strong>：你在对话、树洞、测评中写下的情绪、心理困扰、性别身份与性倾向相关内容，属于法律规定的<strong>敏感个人信息（医疗健康、特定身份类）</strong>。我们按照"<strong>最少收集、最短留存、最高审慎</strong>"的原则对待它：能不收集的就不收集，能匿名的就匿名，你随时可以删除。</li>
                <li><strong>本产品不要求实名注册</strong>，不收集你的姓名、身份证号、手机号、精确位置、通讯录、相册等与服务无关的信息。</li>
                <li><strong>紧急情况请直接求助</strong>：如果你正处于自伤、自杀或其他生命危险中，请<strong>立即拨打 110（公安）或 120（急救）</strong>；也可随时拨打 <strong>12356（全国心理援助热线，24小时免费）</strong>。AI 对话不能处理紧急危机，请勿等待 AI 回复。</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-lg md:text-xl font-medium text-[var(--qm-ink-800)] mb-3 pb-2 border-b border-[var(--qm-line-100)]">
                一、我们收集哪些信息、用来做什么
              </h2>
              <p>我们只收集提供服务所必需的信息，遵循《中华人民共和国个人信息保护法》第五条、第六条规定的<strong>合法、正当、必要和诚信原则</strong>，以及"最小范围"要求。</p>
              
              <div className="overflow-x-auto my-4">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-[var(--qm-purple-50)]">
                      <th className="border border-[var(--qm-line-100)] p-2 text-left">信息类型</th>
                      <th className="border border-[var(--qm-line-100)] p-2 text-left">具体内容</th>
                      <th className="border border-[var(--qm-line-100)] p-2 text-left">用途</th>
                      <th className="border border-[var(--qm-line-100)] p-2 text-left">是否敏感个人信息</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-[var(--qm-line-100)] p-2"><strong>账号与标识信息</strong></td>
                      <td className="border border-[var(--qm-line-100)] p-2">你使用扣子（Coze）平台账号授权登录时的平台账号标识（用户 ID）、昵称、头像（以平台实际返回为准）；我们不另行收集你的手机号</td>
                      <td className="border border-[var(--qm-line-100)] p-2">识别你的身份、保存你的树洞与测评记录、保证数据与你本人对应</td>
                      <td className="border border-[var(--qm-line-100)] p-2">一般个人信息</td>
                    </tr>
                    <tr>
                      <td className="border border-[var(--qm-line-100)] p-2"><strong>AI 对话内容</strong></td>
                      <td className="border border-[var(--qm-line-100)] p-2">你与「小酷」的文字对话内容、对话时间；你使用语音功能时发送的语音及其转写文字</td>
                      <td className="border border-[var(--qm-line-100)] p-2">为你生成陪伴式回复；危机风险识别与热线资源推送；产品安全与质量改进</td>
                      <td className="border border-[var(--qm-line-100)] p-2"><strong>敏感</strong>（心理/情绪健康内容；可能含性别身份、性倾向信息）</td>
                    </tr>
                    <tr>
                      <td className="border border-[var(--qm-line-100)] p-2"><strong>树洞留言</strong></td>
                      <td className="border border-[var(--qm-line-100)] p-2">你在"树洞"留言墙主动发布的留言内容与时间</td>
                      <td className="border border-[var(--qm-line-100)] p-2">留言默认对运营后台可见（用于安全巡查与内容审核，防范危机与违规内容）；你可在发布设置中改为"仅自己可见"，改后不进入后台巡查</td>
                      <td className="border border-[var(--qm-line-100)] p-2"><strong>敏感</strong>（同上）</td>
                    </tr>
                    <tr>
                      <td className="border border-[var(--qm-line-100)] p-2"><strong>测评信息</strong></td>
                      <td className="border border-[var(--qm-line-100)] p-2">你完成心理测评量表的作答与结果（如情绪状态测评）</td>
                      <td className="border border-[var(--qm-line-100)] p-2">生成测评结果供你参考</td>
                      <td className="border border-[var(--qm-line-100)] p-2"><strong>敏感</strong>（心理健康类）</td>
                    </tr>
                    <tr>
                      <td className="border border-[var(--qm-line-100)] p-2"><strong>语音信息</strong></td>
                      <td className="border border-[var(--qm-line-100)] p-2">你主动发送的语音消息（含原始音频）与转写文字</td>
                      <td className="border border-[var(--qm-line-100)] p-2">语音转文字用于生成回复；<strong>原始音频随对话记录留存 90 天，供你回听</strong>，到期与对话记录一并删除；我们不做声纹识别</td>
                      <td className="border border-[var(--qm-line-100)] p-2"><strong>敏感</strong></td>
                    </tr>
                    <tr>
                      <td className="border border-[var(--qm-line-100)] p-2"><strong>设备与日志（最小集）</strong></td>
                      <td className="border border-[var(--qm-line-100)] p-2">访问时间、访问页面、崩溃日志、设备型号与操作系统版本、IP 地址（用于安全与故障排查）</td>
                      <td className="border border-[var(--qm-line-100)] p-2">保障服务安全稳定、排查故障、网络安全防护（网络日志依《网络安全法》第二十三条留存不少于六个月）</td>
                      <td className="border border-[var(--qm-line-100)] p-2">一般个人信息</td>
                    </tr>
                    <tr>
                      <td className="border border-[var(--qm-line-100)] p-2"><strong>你主动提供的其他信息</strong></td>
                      <td className="border border-[var(--qm-line-100)] p-2">你通过客服等渠道主动提供的信息</td>
                      <td className="border border-[var(--qm-line-100)] p-2">响应你的请求与投诉</td>
                      <td className="border border-[var(--qm-line-100)] p-2">视内容而定</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p><strong>我们不收集</strong>：精确地理位置、通讯录、相册/摄像头内容（除非你主动发送）、身份证信息、银行卡与支付信息（本产品 POC 阶段不收费）。</p>

              <h3 className="text-base md:text-lg font-medium text-[var(--qm-ink-800)] mt-4 mb-2">关于敏感个人信息的特别说明（重要）</h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li>依据《个人信息保护法》第二十八条，<strong>敏感个人信息</strong>是一旦泄露或者非法使用，容易导致人格尊严受到侵害或者人身、财产安全受到危害的个人信息，包括<strong>医疗健康、特定身份</strong>等信息。你的对话、树洞、测评内容反映你的心理健康状况，且可能涉及你的性别身份与性倾向，<strong>均属于敏感个人信息</strong>。</li>
                <li>依据《个人信息保护法》第二十九条、第三十条，我们处理上述敏感个人信息，<strong>以取得你的单独同意为前提</strong>，并在此向你说明处理的必要性与影响：
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li><strong>必要性</strong>：不获得你的对话与测评内容，「小酷」就无法为你提供陪伴回复、树洞保存和测评服务；</li>
                    <li><strong>对你的影响</strong>：这些信息一旦泄露可能令你感到不安或遭受歧视，因此我们采取加密存储、严格访问控制、最短留存等措施（详见第六部分）。</li>
                  </ul>
                </li>
                <li>你可以<strong>拒绝</strong>提供敏感信息，但那样我们可能无法为你提供对应的对话、树洞或测评功能；你仍可浏览知识库文章。</li>
                <li><strong>请不要在对话中留下你的真实姓名、身份证号、住址、联系方式等与他人无关的他人隐私</strong>；也请避免透露他人的敏感信息。</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-lg md:text-xl font-medium text-[var(--qm-ink-800)] mb-3 pb-2 border-b border-[var(--qm-line-100)]">
                二、我们如何使用这些信息
              </h2>
              <p>我们仅为以下目的使用你的信息：</p>
              <ol className="list-decimal pl-5 space-y-2">
                <li><strong>提供服务</strong>：生成 AI 陪伴回复、保存和展示你的树洞记录、生成测评结果、提供知识库与自助工具；</li>
                <li><strong>危机安全保护</strong>：当 AI 识别到自伤、自杀或其他紧急危机信号时，向你推送心理援助热线资源（热线号码：<strong>15001930070、13601658763、12356，均为 24 小时</strong>；紧急情况提示 110/120）。依据《个人信息保护法》第十三条第（四）项，紧急情况下为保护自然人生命健康所必需的处理，不需另行取得同意；</li>
                <li><strong>安全与合规</strong>：防范滥用、违法内容处置、网络安全防护，依据《网络安全法》第二十三条、第四十四条留存和处置相关记录；</li>
                <li><strong>产品改进</strong>：在<strong>去标识化或匿名化处理后</strong>（《个人信息保护法》第七十三条定义：去标识化指不借助额外信息无法识别特定个人；匿名化指无法识别且不能复原），用于改进「小酷」的回复质量与危机识别能力。</li>
              </ol>
              <p>我们<strong>不会</strong>：</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>❌ 出售你的个人信息；</li>
                <li>❌ 将你的对话、树洞、测评内容用于向你推送商业广告或用户画像营销；</li>
                <li>❌ 将你的对话内容提供给大模型服务商用于训练其通用模型（我们通过平台协议要求受托方作此约定，见第三部分）；</li>
                <li>❌ 仅依据 AI 对你的心理状态判断作出对你权益有重大影响的决定（依据《个人信息保护法》第二十四条，AI 测评结果不构成诊断，你有权拒绝"AI 说了算"）。</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-lg md:text-xl font-medium text-[var(--qm-ink-800)] mb-3 pb-2 border-b border-[var(--qm-line-100)]">
                三、信息存储在哪里、存多久
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>存储地点</strong>：你的信息存储于<strong>中华人民共和国境内</strong>的服务器（依托扣子/Coze 平台及其云服务基础设施）。我们不向境外提供你的个人信息。</li>
                <li><strong>存储期限</strong>：依据《个人信息保护法》第十九条"保存期限应当为实现处理目的所必要的最短时间"原则，我们采用分类留存策略，具体期限见我们公开的《数据留存与删除策略》。摘要如下：
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>对话记录：仅留存最近 <strong>90 天</strong>，到期滚动删除；</li>
                    <li>语音消息：原始音频随对话记录留存 <strong>90 天</strong>（供你回听），到期与对话记录一并删除；</li>
                    <li>树洞留言：你发布的留言<strong>默认运营后台可见</strong>（用于安全巡查与内容审核），你可在发布设置中改为"仅自己可见"，改后不进入后台巡查；</li>
                    <li>测评结果：留存 <strong>90 天</strong>，到期匿名化或删除；</li>
                    <li>网络安全日志：依《网络安全法》第二十三条<strong>留存不少于六个月</strong>；</li>
                    <li>超出期限或你删除后，我们将删除或匿名化处理；因法定留存期限未届满而暂不能删除的，我们将<strong>停止除存储和安全保护之外的一切处理</strong>（依据《个人信息保护法》第四十七条第二款）。</li>
                  </ul>
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-lg md:text-xl font-medium text-[var(--qm-ink-800)] mb-3 pb-2 border-b border-[var(--qm-line-100)]">
                四、第三方与委托处理
              </h2>
              <p>我们依托扣子（Coze）平台（运营者：北京春田知韵科技有限公司及其关联方，订阅版服务涉及北京火山引擎科技有限公司）提供服务。各方法律关系如下。</p>
              <ol className="list-decimal pl-5 space-y-2">
                <li><strong>扣子平台作为受托处理方</strong>：平台为「小酷」提供智能体运行、数据存储与模型接入服务。平台隐私政策明确：<strong>利用平台发布智能体供最终用户使用的，由开发者（即我们）以自己名义作为最终用户个人信息的个人信息处理者</strong>，平台按其《数据处理协议》作为受托方处理数据。我们与平台约定：
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>平台不得将你的对话内容用于其通用模型训练（平台订阅版条款载明"不会使用客户数据和内容来训练或优化本服务"）；</li>
                    <li>平台采取访问控制、加密等安全措施；</li>
                    <li>平台进行内容安全审查时，可能按法律法规要求检测相关内容并在法定时间内留存日志。</li>
                  </ul>
                </li>
                <li><strong>模型服务商</strong>：生成回复所需的大语言模型、语音识别/合成服务由平台接入（含火山引擎等已完成算法备案的模型服务）。你的消息内容仅在为你生成回复所必需的范围内被传输处理，我们通过平台协议要求其不用于通用模型训练。</li>
                <li><strong>热线机构</strong>：我们仅向你<strong>提供</strong>热线号码，<strong>不会</strong>主动把你的个人信息发送给任何热线机构。只有当你本人拨打热线时，你与热线之间的信息处理由热线机构依其规则负责。若出现你正在实施危及生命行为的极端紧急情形，我们在能够取得你位置等信息的前提下可能协助报警求助；此类处理依据《个人信息保护法》第十三条第（四）项进行。</li>
                <li>除上述及法律法规要求外，我们<strong>不向任何第三方提供</strong>你的个人信息；如未来确需向其他个人信息处理者提供，我们将依《个人信息保护法》第二十三条告知你接收方信息并取得你的<strong>单独同意</strong>。</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-lg md:text-xl font-medium text-[var(--qm-ink-800)] mb-3 pb-2 border-b border-[var(--qm-line-100)]">
                五、你的权利
              </h2>
              <p>依据《个人信息保护法》第四章（第四十四条至第五十条），你对自己的个人信息享有以下权利，我们建立便捷的受理机制（第五十条）：</p>
              
              <div className="overflow-x-auto my-4">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-[var(--qm-purple-50)]">
                      <th className="border border-[var(--qm-line-100)] p-2 text-left">你的权利</th>
                      <th className="border border-[var(--qm-line-100)] p-2 text-left">法律依据</th>
                      <th className="border border-[var(--qm-line-100)] p-2 text-left">如何行使</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-[var(--qm-line-100)] p-2"><strong>知情、决定权</strong>，限制或拒绝他人处理</td>
                      <td className="border border-[var(--qm-line-100)] p-2">《个保法》第四十四条</td>
                      <td className="border border-[var(--qm-line-100)] p-2">通过本政策及产品内提示知情；可随时停止使用相关功能</td>
                    </tr>
                    <tr>
                      <td className="border border-[var(--qm-line-100)] p-2"><strong>查阅、复制</strong>你的个人信息</td>
                      <td className="border border-[var(--qm-line-100)] p-2">《个保法》第四十五条</td>
                      <td className="border border-[var(--qm-line-100)] p-2">产品内：对话记录可直接回看；树洞在"树洞"页面查看；测评结果在"测评"页面查看。如需完整数据副本，发邮件申请（见第八部分）</td>
                    </tr>
                    <tr>
                      <td className="border border-[var(--qm-line-100)] p-2"><strong>更正、补充</strong></td>
                      <td className="border border-[var(--qm-line-100)] p-2">《个保法》第四十六条</td>
                      <td className="border border-[var(--qm-line-100)] p-2">树洞记录可自行编辑/删除；其他信息有误可邮件申请更正</td>
                    </tr>
                    <tr>
                      <td className="border border-[var(--qm-line-100)] p-2"><strong>删除</strong>你的个人信息</td>
                      <td className="border border-[var(--qm-line-100)] p-2">《个保法》第四十七条</td>
                      <td className="border border-[var(--qm-line-100)] p-2">① 单条：对话内删除、树洞内删除；② 清空：通过产品内"设置-隐私与数据-清空我的数据"；③ 人工：邮件申请。详见《数据留存与删除策略》</td>
                    </tr>
                    <tr>
                      <td className="border border-[var(--qm-line-100)] p-2"><strong>撤回同意</strong></td>
                      <td className="border border-[var(--qm-line-100)] p-2">《个保法》第十五条</td>
                      <td className="border border-[var(--qm-line-100)] p-2">撤回授权（如关闭语音权限）或注销/清空数据。撤回不影响撤回前已进行处理的效力</td>
                    </tr>
                    <tr>
                      <td className="border border-[var(--qm-line-100)] p-2"><strong>要求解释说明</strong></td>
                      <td className="border border-[var(--qm-line-100)] p-2">《个保法》第四十八条</td>
                      <td className="border border-[var(--qm-line-100)] p-2">对我们的处理规则有疑问，可邮件要求解释</td>
                    </tr>
                    <tr>
                      <td className="border border-[var(--qm-line-100)] p-2"><strong>注销账号</strong></td>
                      <td className="border border-[var(--qm-line-100)] p-2">《个保法》第四十七条</td>
                      <td className="border border-[var(--qm-line-100)] p-2">通过扣子平台账号注销流程处理；我们收到平台注销通知后删除或匿名化你的内容数据</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p>我们在<strong>验证你的身份后 15 个工作日内</strong>响应你的请求；如拒绝你的请求，我们将说明理由（《个保法》第五十条）。你也有权向网信等履行个人信息保护职责的部门投诉、举报（《个保法》第六十五条）。</p>
            </section>

            <section className="mb-8">
              <h2 className="text-lg md:text-xl font-medium text-[var(--qm-ink-800)] mb-3 pb-2 border-b border-[var(--qm-line-100)]">
                六、未成年人保护
              </h2>
              <ol className="list-decimal pl-5 space-y-2">
                <li>本产品面向<strong>成年人</strong>提供心理陪伴服务，<strong>不面向不满 14 周岁的未成年人</strong>。依据《个人信息保护法》第三十一条，处理不满 14 周岁未成年人个人信息须取得监护人同意并制定专门规则；我们不会在明知的情况下收集不满 14 周岁未成年人的个人信息。若你是不满 14 周岁的用户，请停止使用，并请监护人联系我们删除相关信息。</li>
                <li>已满 14 周岁不满 18 周岁的青少年，建议在监护人知情和陪同下使用；如遇心理困扰，请优先告知可信任的成年人、学校心理老师，或拨打 <strong>12356</strong>。</li>
                <li>我们将按《生成式人工智能服务管理暂行办法》第十条要求，采取措施防范未成年人对 AI 陪伴的过度依赖，包括：连续使用较长时间时弹出休息提醒、夜间使用时提示线下求助渠道、危机话题一律引导至真人热线而非延长对话。</li>
                <li>本产品不提供也不认可任何"改变性取向""性别认同矫正/扭转"类内容——同性恋、跨性别本身不是疾病，无需也不应被"治疗"；我们提供的是支持、陪伴与自我接纳。</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-lg md:text-xl font-medium text-[var(--qm-ink-800)] mb-3 pb-2 border-b border-[var(--qm-line-100)]">
                七、我们如何保护你的信息
              </h2>
              <ol className="list-decimal pl-5 space-y-2">
                <li>依据《个人信息保护法》第五十一条与《数据安全法》第二十七条，我们建立内部数据安全管理制度，对个人信息<strong>分类分级管理</strong>（心理类数据列为最高保护等级），采取<strong>加密存储、访问权限最小化、去标识化</strong>等技术措施，对团队接触数据的人员进行权限管控与安全培训。</li>
                <li>依据《网络安全法》第二十三条，我们按网络安全等级保护制度要求履行安全保护义务，留存网络日志不少于六个月。</li>
                <li>发生或可能发生信息泄露、篡改、丢失时，我们将依据《个人信息保护法》第五十七条立即采取补救措施，并通知主管部门和受影响的你。</li>
                <li>处理敏感个人信息前，我们已按《个人信息保护法》第五十五条、第五十六条开展<strong>个人信息保护影响评估（PIA）</strong>，评估报告至少留存三年。</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-lg md:text-xl font-medium text-[var(--qm-ink-800)] mb-3 pb-2 border-b border-[var(--qm-line-100)]">
                八、政策更新与联系我们
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>本政策更新时，我们会在产品内以显著方式公告；涉及处理目的、信息种类等重大变更的，将依法重新取得你的同意（《个保法》第十四条、第十七条）。</li>
                <li>个人信息处理者：<strong>上海酷雪心理咨询中心</strong>，地址：上海市静安区民立路150号二座3201室。</li>
                <li>个人信息保护/隐私事务联系邮箱：<strong>queermental@dingtalk.com</strong>（反馈、投诉与隐私事务共用）。我们将在验证身份后 15 个工作日内回复。</li>
                <li>危机求助（24 小时）：<strong>12356（全国心理援助热线，免费）</strong>；危机专线 <strong>15001930070</strong>、备用 <strong>13601658763</strong>；紧急危险请拨 <strong>110 / 120</strong>。</li>
                <li>如你认为我们的处理活动侵害了你的权益，可向国家网信部门或地方网信部门投诉举报。</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-lg md:text-xl font-medium text-[var(--qm-ink-800)] mb-3 pb-2 border-b border-[var(--qm-line-100)]">
                附：本政策主要法律依据
              </h2>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>《中华人民共和国个人信息保护法》（2021年8月20日通过，2021年11月1日施行）：第五条、第六条、第十三条、第十四条、第十五条、第十七条、第十九条、第二十三条、第二十四条、第二十八条、第二十九条、第三十条、第三十一条、第四十四条至第五十条、第五十一条、第五十五条、第五十六条、第五十七条、第六十五条、第七十三条；</li>
                <li>《中华人民共和国网络安全法》（2016年通过，根据2025年10月28日修正决定修正，自2026年1月1日起施行）：第二十三条（网络日志留存不少于六个月）、第四十三条（合法正当必要原则）、第四十四条（安全保护）、第四十五条（删除/更正请求权）；</li>
                <li>《中华人民共和国数据安全法》（2021年6月10日通过，2021年9月1日施行）：第二十一条（数据分类分级）、第二十七条（全流程数据安全管理）；</li>
                <li>《生成式人工智能服务管理暂行办法》（2023年7月13日公布，2023年8月15日施行）：第九条、第十条、第十一条；</li>
                <li>《人工智能生成合成内容标识办法》（2025年3月14日公布，2025年9月1日施行）：第四条、第八条。</li>
              </ul>
              <p className="text-xs text-[var(--qm-ink-500)] mt-4 italic">以上法条条文号均经联网核对官方来源（全国人大网、中国政府网、中央网信办网站），律师审阅时请再行复核。</p>
            </section>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
