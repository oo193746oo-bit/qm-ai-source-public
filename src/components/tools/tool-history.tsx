// QM 自助工具 v3.0 - 历史记录与收藏页

import { useState, useMemo } from "react";
import { useTools } from "@/hooks/use-tools";
import { getToolById } from "@/lib/tools/tool-registry";
import type { Tool } from "@/lib/tools/types";

interface ToolHistoryProps {
  onBack: () => void;
  onSelectTool: (tool: Tool) => void;
  onHome: () => void;
  onXiaoku: () => void;
}

export function ToolHistory({
  onBack,
  onSelectTool,
  onHome,
  onXiaoku,
}: ToolHistoryProps) {
  const { history, favorites, deleteEvent, toggleFavorite } = useTools();
  const [activeTab, setActiveTab] = useState<"history" | "favorites">("history");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const favoriteTools = useMemo(() => {
    return favorites
      .map((id) => getToolById(id))
      .filter((t): t is Tool => t !== undefined);
  }, [favorites]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return "刚刚";
    if (diffMin < 60) return `${diffMin}分钟前`;
    if (diffHour < 24) return `${diffHour}小时前`;
    if (diffDay < 7) return `${diffDay}天前`;
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const handleDelete = (eventId: string) => {
    deleteEvent(eventId);
    setShowDeleteConfirm(null);
  };

  return (
    <div className="space-y-5">
      {/* 返回 */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-[#9B8E8A] hover:text-[#6B5F5A] min-h-[44px]"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        返回
      </button>

      {/* 标题 */}
      <div className="space-y-1">
        <h1 className="text-xl font-medium text-[#4A4A4A]">历史与收藏</h1>
        <p className="text-sm text-[#9B8E8A]">
          只保存在当前浏览器，不跨设备同步
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-white/50 rounded-2xl p-1 border border-[#E8DCD6]/50">
        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 py-2.5 text-sm font-medium rounded-xl transition-all min-h-[40px] ${
            activeTab === "history"
              ? "bg-white text-[#4A4A4A] shadow-sm"
              : "text-[#9B8E8A]"
          }`}
        >
          历史记录（{history.length}）
        </button>
        <button
          onClick={() => setActiveTab("favorites")}
          className={`flex-1 py-2.5 text-sm font-medium rounded-xl transition-all min-h-[40px] ${
            activeTab === "favorites"
              ? "bg-white text-[#4A4A4A] shadow-sm"
              : "text-[#9B8E8A]"
          }`}
        >
          我的收藏（{favorites.length}）
        </button>
      </div>

      {/* 历史列表 */}
      {activeTab === "history" && (
        <div className="space-y-2">
          {history.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-[#9B8E8A]">还没有使用记录</p>
              <p className="text-xs text-[#C9BDB5] mt-1">
                完成一个工具后，记录会出现在这里
              </p>
            </div>
          ) : (
            history.map((item) => {
              const tool = getToolById(item.tool_id);
              if (!tool) return null;
              return (
                <div
                  key={item.event_id}
                  className="bg-white rounded-2xl p-4 border border-[#F0E8E3] hover:border-[#B794F4]/20 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => onSelectTool(tool)}
                      className="flex-1 text-left min-h-[44px]"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-medium text-[#4A4A4A]">
                          {tool.name}
                        </h3>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded ${
                            item.event_type === "completed"
                              ? "bg-green-50 text-green-600"
                              : "bg-[#FAF5F2] text-[#9B8E8A]"
                          }`}
                        >
                          {item.event_type === "completed" ? "已完成" : "中途停止"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#B5A8A3]">
                        <span>{formatTime(item.timestamp)}</span>
                        {item.time_spent_sec && (
                          <>
                            <span>·</span>
                            <span>
                              {Math.floor(item.time_spent_sec / 60)}分
                              {item.time_spent_sec % 60}秒
                            </span>
                          </>
                        )}
                        {item.helpfulness && (
                          <>
                            <span>·</span>
                            <span>
                              {item.helpfulness >= 4
                                ? "有帮助"
                                : item.helpfulness === 3
                                ? "没感觉"
                                : "不太适合"}
                            </span>
                          </>
                        )}
                      </div>
                    </button>

                    {/* 删除按钮 */}
                    <button
                      onClick={() => setShowDeleteConfirm(item.event_id)}
                      className="p-2 text-[#C9BDB5] hover:text-[#FC8181] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                      aria-label="删除记录"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* 删除确认 */}
                  {showDeleteConfirm === item.event_id && (
                    <div className="mt-3 pt-3 border-t border-[#F0E8E3] flex items-center gap-2">
                      <p className="text-xs text-[#9B8E8A] flex-1">
                        确定删除这条记录吗？删除后不可恢复。
                      </p>
                      <button
                        onClick={() => setShowDeleteConfirm(null)}
                        className="px-3 py-1.5 text-xs text-[#6B5B52] bg-[#FAF5F2] rounded-lg min-h-[32px]"
                      >
                        取消
                      </button>
                      <button
                        onClick={() => handleDelete(item.event_id)}
                        className="px-3 py-1.5 text-xs text-white bg-[#FC8181] rounded-lg min-h-[32px]"
                      >
                        删除
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 收藏列表 */}
      {activeTab === "favorites" && (
        <div className="space-y-2">
          {favoriteTools.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-[#9B8E8A]">还没有收藏的工具</p>
              <p className="text-xs text-[#C9BDB5] mt-1">
                在工具详情页点击 ⭐ 可以收藏
              </p>
            </div>
          ) : (
            favoriteTools.map((tool) => (
              <div
                key={tool.tool_id}
                className="bg-white rounded-2xl p-4 border border-[#F0E8E3] hover:border-[#B794F4]/20 transition-all"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onSelectTool(tool)}
                    className="flex-1 text-left min-h-[44px]"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-medium text-[#4A4A4A]">
                        {tool.name}
                      </h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#B794F4]/10 text-[#7C3AED]">
                        {tool.category_name}
                      </span>
                    </div>
                    <p className="text-xs text-[#B5A8A3]">
                      约{tool.time_estimate_min}分钟
                    </p>
                  </button>
                  <button
                    onClick={() => toggleFavorite(tool.tool_id)}
                    className="p-2 text-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label="取消收藏"
                  >
                    ⭐
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 说明 */}
      <div className="bg-[#FAF5F2]/50 rounded-xl p-4">
        <p className="text-xs text-[#B5A8A3] leading-relaxed">
          💡 这些数据只保存在你当前的浏览器里（本地存储）。
          清除浏览器数据或更换设备，记录会丢失。
        </p>
      </div>

      {/* 底部入口 */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onHome}
          className="flex-1 py-3 bg-white/70 text-[#6B5B52] text-sm font-medium rounded-2xl border border-[#E8DCD6] hover:bg-white transition-all min-h-[44px]"
        >
          回到首页
        </button>
        <button
          onClick={onXiaoku}
          className="flex-1 py-3 bg-white/70 text-[#6B5B52] text-sm font-medium rounded-2xl border border-[#E8DCD6] hover:bg-white transition-all min-h-[44px]"
        >
          找小酷聊聊
        </button>
      </div>
    </div>
  );
}
