"use client";

import { PageLayout } from "@/components/page-layout";

/**
 * 用户协议页
 * 定稿 v1.0 · 2026-09-01
 * 逐字照录 02_用户协议_初稿v0.1.md
 */

export default function TermsPage() {
  return (
    <PageLayout title="用户协议" subtitle="使用「小酷」前请阅读">
      <div className="max-w-2xl mx-auto py-2 md:py-4">
        <div className="bg-white/80 rounded-3xl p-6 md:p-10 border border-[var(--qm-line-100)] shadow-sm">
          <div className="mb-8">
            <p className="text-xs text-[var(--qm-ink-400)]">生效日期：2026-09-07 版本：v1.0</p>
          </div>

          <div className="text-sm md:text-[15px] text-[var(--qm-ink-700)] leading-[1.8] space-y-4">
            <blockquote className="border-l-4 border-[var(--qm-purple-400)] pl-4 italic text-[var(--qm-ink-600)]">
              本协议是你与<strong>上海酷雪心理咨询中心</strong>（个人独资企业，统一社会信用代码 91310113MA1GNEEKXT，下称"我们"）之间就使用「小酷」AI 心理陪伴产品（网址：https://queermental.coze.site ，下称"本服务"）订立的协议。<strong>请你在使用前认真阅读，尤其是加粗的条款。</strong> 你点击"同意"或实际使用本服务，即视为你已阅读并同意本协议及《隐私政策》。
            </blockquote>

            <section className="mb-8">
              <h2 className="text-lg md:text-xl font-medium text-[var(--qm-ink-800)] mb-3 pb-2 border-b border-[var(--qm-line-100)]">
                第一条 服务是什么（请务必知悉）
              </h2>
              <ol className="list-decimal pl-5 space-y-2">
                <li>「小酷」是一款基于生成式人工智能技术的<strong>心理陪伴与情绪支持工具</strong>，当前功能包括：AI 文字/语音对话陪伴、私密记录（树洞）、心理测评量表、心理健康知识库文章、自助工具；当对话中识别到危机风险时，我们会向你推送心理援助热线资源。</li>
                <li><strong>本服务不是医疗服务，不是心理咨询或心理治疗，不能替代精神科医生的诊断与治疗，也不能替代持证心理咨询师的专业咨询。</strong> AI 生成的任何内容均不构成医学诊断、治疗建议或用药指导。</li>
                <li><strong>如果你正出现自伤、自杀念头或处于紧急危险中，请立即拨打 110 或 120；需要即时心理支持，请拨打 12356（全国心理援助热线，24小时免费）或危机专线 15001930070、备用 13601658763（均24小时）。</strong></li>
                <li>本服务目前处于<strong>小规模试运营（POC）阶段</strong>，我们可能随时调整、暂停或终止部分功能，并会提前在产品内公告。</li>
                <li>我们按《生成式人工智能服务管理暂行办法》第十条要求，公开本服务的适用人群（有情绪陪伴需求的成年用户，重点面向 LGBTQ 及多元性别群体）、场合（日常情绪支持，非医疗场景）与用途（陪伴、记录、科普、自助）。</li>
                <li><strong>我们不提供、不认可任何"改变性取向""性别认同矫正/扭转治疗"类内容</strong>：同性恋、双性恋、跨性别等性倾向与性别身份本身不是精神疾病，不存在也不应有所谓"矫正治疗"。本服务围绕自我接纳、支持与陪伴展开；如你在其他渠道遭遇此类"治疗"宣传，请警惕并可向我们举报。</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-lg md:text-xl font-medium text-[var(--qm-ink-800)] mb-3 pb-2 border-b border-[var(--qm-line-100)]">
                第二条 账号与登录
              </h2>
              <ol className="list-decimal pl-5 space-y-2">
                <li>你通过扣子（Coze）平台账号授权使用本服务，账号安全由你和平台共同负责；请妥善保管账号，不要转借他人。</li>
                <li>你承诺提供的信息真实、合法。<strong>本服务不面向不满 14 周岁的未成年人</strong>；不满 18 周岁的用户建议在监护人知情陪同下使用（详见《隐私政策》第六部分）。</li>
                <li>因你主动泄露账号或遭受诈骗导致的损失，由你自行承担；发现账号异常请立即通过客服渠道通知我们。</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-lg md:text-xl font-medium text-[var(--qm-ink-800)] mb-3 pb-2 border-b border-[var(--qm-line-100)]">
                第三条 使用规则（你可以做什么、不可以做什么）
              </h2>
              <ol className="list-decimal pl-5 space-y-2">
                <li>你可以在遵守法律和本协议的前提下，使用本服务进行情绪倾诉、自我记录、阅读科普内容和使用自助工具。</li>
                <li>你<strong>不得</strong>利用本服务从事以下行为：
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>发布、传输违法信息，包括危害国家安全、煽动仇恨与歧视、暴力、淫秽色情等内容（《生成式人工智能服务管理暂行办法》第四条）；</li>
                    <li>侵害他人合法权益，包括泄露他人隐私、侮辱诽谤他人、侵犯他人知识产权；</li>
                    <li>对 AI 进行诱导、攻击，试图使其输出违法或歧视性内容；</li>
                    <li>利用本服务实施诈骗、骚扰他人或其他违法活动；</li>
                    <li>对本服务进行逆向工程、批量抓取、自动化攻击或干扰服务正常运行。</li>
                  </ul>
                </li>
                <li>你在对话、树洞中记录的内容属于你的个人表达，<strong>请避免输入真实姓名、身份证号、银行卡号等与服务无关的个人敏感信息，也不要输入他人的隐私信息</strong>。</li>
                <li>依据《生成式人工智能服务管理暂行办法》第十四条，我们发现违法内容或违法使用行为时，将依法依约采取警示、限制功能、暂停或终止服务等处置措施，保存有关记录，并向有关主管部门报告。</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-lg md:text-xl font-medium text-[var(--qm-ink-800)] mb-3 pb-2 border-b border-[var(--qm-line-100)]">
                第四条 AI 生成内容的性质与使用
              </h2>
              <ol className="list-decimal pl-5 space-y-2">
                <li>本服务的回复由人工智能生成。依据《生成式人工智能服务管理暂行办法》第四条第（五）项及模型技术特性，<strong>AI 内容可能存在不准确、不完整甚至"一本正经地说错"的情况</strong>，尤其涉及医学、用药、法律等专业问题时，请勿将其作为专业意见采纳。</li>
                <li>心理测评量表的结果仅反映你作答当下的状态参考，<strong>不构成任何诊断结论</strong>；如结果提示需要关注，请联系专业机构。</li>
                <li>按《人工智能生成合成内容标识办法》（2025年9月1日施行）第四条、第八条要求，我们会在 AI 交互场景中以显著方式提示内容由 AI 生成；你不得恶意删除、篡改、伪造相关标识。</li>
                <li>你不得将 AI 生成内容冒充专业医疗意见向他人传播，不得利用本服务内容进行商业医疗/咨询活动。</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-lg md:text-xl font-medium text-[var(--qm-ink-800)] mb-3 pb-2 border-b border-[var(--qm-line-100)]">
                第五条 知识产权
              </h2>
              <ol className="list-decimal pl-5 space-y-2">
                <li>本服务的界面、知识库文章、AI 人设、提示词体系、测评工具、图文素材等知识产权归我们或相应权利人所有，未经许可不得复制、转载、商用。</li>
                <li>你在对话和树洞中输入的内容，其权利归你所有；为向你提供服务（包括在平台基础设施上存储、处理、由模型生成回复），你授予我们在实现服务目的所必需范围内使用这些内容的非独占许可。我们对其中含敏感个人信息的内容按《隐私政策》严格保护，不用于商业营销。</li>
                <li>知识库文章仅供个人学习参考，不构成医疗建议。</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-lg md:text-xl font-medium text-[var(--qm-ink-800)] mb-3 pb-2 border-b border-[var(--qm-line-100)]">
                第六条 隐私与数据保护
              </h2>
              <p>我们如何收集、使用、存储、删除你的信息，以及你享有的权利，请详见《「小酷」隐私政策》与《数据留存与删除策略》。核心承诺：</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>我们按最小必要原则收集信息，不要求实名；</li>
                <li>你的对话、树洞、测评内容属敏感个人信息，加密存储、严格权限管理；</li>
                <li>你可以随时查阅、删除自己的内容，或申请清空全部数据；</li>
                <li>我们不会出售你的个人信息。</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-lg md:text-xl font-medium text-[var(--qm-ink-800)] mb-3 pb-2 border-b border-[var(--qm-line-100)]">
                第七条 服务的变更、中断与终止
              </h2>
              <ol className="list-decimal pl-5 space-y-2">
                <li>我们将尽合理努力保障服务安全稳定（《生成式人工智能服务管理暂行办法》第十三条），但 POC 阶段不保证服务不间断、无错误。</li>
                <li>出现以下情形时，我们可能中断或终止服务：不可抗力或基础平台（扣子）故障；法律要求或主管部门要求；你严重违反本协议。</li>
                <li>你可以随时停止使用并通过产品内功能或邮件申请删除你的数据。我们停止运营时，将依法停止收集信息、公告通知，并对你的个人信息进行删除或匿名化处理（参照《个人信息保护法》第四十七条）。</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-lg md:text-xl font-medium text-[var(--qm-ink-800)] mb-3 pb-2 border-b border-[var(--qm-line-100)]">
                第八条 免责范围
              </h2>
              <p><strong>除法律另有强制性规定外，以下情形我们不承担责任：</strong></p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>因 AI 生成内容不准确、不完整，而你据此自行作出决定所导致的后果；本服务明确不提供医疗诊断与治疗建议；</li>
                <li>因你隐瞒真实紧急状况、未及时拨打紧急电话而延误求助导致的后果；<strong>我们再次提示：危机场景请第一时间拨打 110/120 或 12356 等热线</strong>；</li>
                <li>因你自身泄露账号、主动公开自己的树洞或对话内容导致的信息泄露；</li>
                <li>因不可抗力、基础电信/云服务商/扣子平台故障导致的服务中断或数据损失；</li>
                <li>因你违反本协议或法律导致的损失，以及你对第三方造成的损害，由你自行承担。</li>
                <li>本条不排除或限制法律规定不得排除的责任（如我们因过错侵害你个人信息权益的，依《个人信息保护法》第六十九条承担相应责任）。</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-lg md:text-xl font-medium text-[var(--qm-ink-800)] mb-3 pb-2 border-b border-[var(--qm-line-100)]">
                第九条 投诉与举报
              </h2>
              <ol className="list-decimal pl-5 space-y-2">
                <li>我们建立投诉举报渠道（《生成式人工智能服务管理暂行办法》第十五条）：你可通过产品内入口或邮件 <strong>queermental@dingtalk.com</strong> 反馈问题，我们将在收到后及时处理并反馈。</li>
                <li>你也可以依据《生成式人工智能服务管理暂行办法》第十八条向网信等主管部门投诉举报。</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-lg md:text-xl font-medium text-[var(--qm-ink-800)] mb-3 pb-2 border-b border-[var(--qm-line-100)]">
                第十条 协议修改与法律适用
              </h2>
              <ol className="list-decimal pl-5 space-y-2">
                <li>本协议可能更新；重大变更我们会在产品内显著提示并依法重新征求同意。你继续使用即视为接受更新后的协议；不同意可停止使用并删除数据。</li>
                <li>本协议适用中华人民共和国法律（为本协议之目的，不含冲突法规则）。</li>
                <li>因本协议产生的争议，双方应友好协商；协商不成的，任何一方可向<strong>上海市宝山区</strong>有管辖权的人民法院提起诉讼。</li>
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
