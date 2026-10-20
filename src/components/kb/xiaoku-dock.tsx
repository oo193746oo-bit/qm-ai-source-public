"use client";

import Link from "next/link";
import { KnowledgeContent } from "@/lib/kb/kb-registry";
import { XiaokuAction } from "@/lib/kb/kb-meta";
import { goChatWithContext } from "@/lib/context/pending-context";

interface XiaokuDockProps {
  content: KnowledgeContent;
}

/**
 * 小酷 Dock（Contextual Xiaoku Dock）
 * 根据文章目的动态显示 2-4 个按钮
 * 按钮跳转时只带 content_id / topic / purpose，不带敏感数据
 *
 * 动作类型：
 * - chat: 和小酷聊聊这个
 * - exercise: 试试相关练习
 * - assessment: 做相关测评
 * - treehole: 写进情绪树洞
 * - theory: 看更深入的理论
 * - resources: 查看求助资源
 */
export function XiaokuDock({ content }: XiaokuDockProps) {
  const actions = content.xiaoku_actions;
  const topic = content.subtopic;
  const purpose = content.purpose_tags[0] || "";

  const handleTalkXiaoku = () => {
    goChatWithContext({
      source: "knowledge",
      summary:
        `我从知识库文章《${content.title}》（话题：${topic}，目的：${purpose}）过来，` +
        `想顺着这篇文章聊聊我的实际情况。请先说清楚你的理解，结合我的处境回应，不强加建议。` +
        `内容仅供了解和自我觉察参考，不构成诊断或专业意见。`,
    });
  };

  // 构建安全跳转URL（只传非敏感参数）
  const buildUrl = (action: XiaokuAction): string => {
    const baseParams = `content_id=${encodeURIComponent(content.content_id)}&topic=${encodeURIComponent(topic)}&purpose=${encodeURIComponent(purpose)}`;
    switch (action) {
      case "chat":
        return `/chat?${baseParams}&action=chat`;
      case "exercise":
        return `/knowledge/domain/D12?${baseParams}&action=exercise`;
      case "assessment":
        return `/knowledge/domain/D16?${baseParams}&action=assessment`;
      case "treehole":
        return `/treehole?${baseParams}&action=treehole`;
      case "theory":
        return `/knowledge/domain/D16?${baseParams}&action=theory`;
      case "resources":
        return `/knowledge/domain/D11?${baseParams}&action=resources`;
      default:
        return `/knowledge`;
    }
  };

  // 动作按钮配置
  const actionConfig: Record<XiaokuAction, { label: string; emoji: string; desc: string }> = {
    chat: { label: "和小酷聊聊", emoji: "💬", desc: "继续深入聊这个话题" },
    exercise: { label: "试试练习", emoji: "🧘", desc: "做一个相关的小练习" },
    assessment: { label: "做相关测评", emoji: "📊", desc: "用工具更了解自己" },
    treehole: { label: "写进树洞", emoji: "🌳", desc: "把感受写进情绪树洞" },
    theory: { label: "看更深入的理论", emoji: "📚", desc: "了解背后的心理学理论" },
    resources: { label: "查看求助资源", emoji: "🆘", desc: "需要更多支持时看这里" },
  };

  // 显示文案
  const dockMessage =
    "这篇内容和你正在找的是同一个方向吗？如果你愿意，我可以陪你继续聊，也可以带你去一个更具体的练习。";

  // 只取前 4 个动作
  const displayActions = actions.slice(0, 4);

  return (
    <div className="mt-8 p-5 bg-[var(--qm-purple-50)] rounded-2xl border border-[var(--qm-purple-200)]/60">
      {/* 小酷头像 + 问候 */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-[#6B4C9A]/20 flex items-center justify-center text-xl flex-shrink-0">
          🐧
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-[#6B4C9A] mb-1">小酷说</div>
          <p className="text-sm text-gray-600 leading-relaxed">{dockMessage}</p>
        </div>
      </div>

      {/* 动作按钮 */}
      <div className="grid grid-cols-2 gap-2">
        {displayActions.map((action) => {
          const config = actionConfig[action];
          if (action === "chat") {
            return (
              <button
                key={action}
                type="button"
                onClick={handleTalkXiaoku}
                className="group flex items-center gap-3 p-3 bg-white rounded-xl hover:bg-[#6B4C9A]/5 border border-gray-100 hover:border-[#6B4C9A]/30 transition-all text-left"
              >
                <span className="text-xl">{config.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 group-hover:text-[#6B4C9A] transition-colors">
                    {config.label}
                  </div>
                  <div className="text-xs text-gray-400 truncate">
                    {config.desc}
                  </div>
                </div>
              </button>
            );
          }
          return (
            <Link
              key={action}
              href={buildUrl(action)}
              className="group flex items-center gap-3 p-3 bg-white rounded-xl hover:bg-[#6B4C9A]/5 border border-gray-100 hover:border-[#6B4C9A]/30 transition-all"
            >
              <span className="text-xl">{config.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800 group-hover:text-[#6B4C9A] transition-colors">
                  {config.label}
                </div>
                <div className="text-xs text-gray-400 truncate">
                  {config.desc}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* 安全提示 */}
      <p className="text-xs text-gray-400 mt-3 text-center">
        你的对话和数据都受到隐私保护 · QM AI 不替代专业服务
      </p>
    </div>
  );
}
