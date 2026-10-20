// QM 自助工具 v3.0 - 首屏 Hero 组件

interface ToolHeroProps {
  onQuickMatch: () => void;
  onBrowseAll: () => void;
  onXiaoku: () => void;
  onHome: () => void;
  toolCount?: number;
}

export function ToolHero({
  onQuickMatch,
  onBrowseAll,
  onXiaoku,
  onHome,
  toolCount = 40,
}: ToolHeroProps) {
  return (
    <div className="space-y-8">
      {/* 主标题区 */}
      <div className="text-center space-y-4 pt-4 pb-2">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 border border-[#E8DFDA] text-xs text-[#9B8E8A]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--qm-purple-400)]" />
          结构化自助练习 · 共 {toolCount} 个
        </div>
        <h2 className="text-2xl md:text-3xl font-medium text-[#4A4A4A] leading-snug">
          给此刻的自己，
          <br />
          一个可操作的小工具
        </h2>
      </div>

      {/* 说明卡片 */}
      <div className="bg-white/70 rounded-3xl p-6 space-y-4 border border-[#E8DCD6]/50 backdrop-blur-sm">
        <p className="text-sm text-[#6B5B52] leading-relaxed">
          这里不是日记，也不是测试。
        </p>
        <p className="text-sm text-[#6B5B52] leading-relaxed">
          你可以选一个 3-15 分钟的结构化练习，先照顾当下的情绪、身体、思维或关系。
        </p>
        <p className="text-sm text-[#6B5B52] leading-relaxed">
          每个工具都会解释为什么这样做，也会一步一步陪你完成。你可以随时暂停，做不完也不代表失败。
        </p>

        {/* 快速信息 */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="flex items-center gap-2 text-xs text-[#9B8E8A]">
            <span className="text-base">⏱️</span>
            <span>大多数工具 3-12 分钟</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#9B8E8A]">
            <span className="text-base">🧘</span>
            <span>深度工具约 10-15 分钟</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#9B8E8A]">
            <span className="text-base">⏸️</span>
            <span>可随时暂停</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#9B8E8A]">
            <span className="text-base">💾</span>
            <span>进度在当前设备保存</span>
          </div>
        </div>
      </div>

      {/* CTA 按钮区 */}
      <div className="space-y-3">
        <button
          onClick={onQuickMatch}
          className="w-full py-4 bg-[var(--qm-purple-600)] text-white hover:bg-[var(--qm-purple-700)] font-medium rounded-2xl hover:shadow-lg hover:shadow-[var(--qm-purple-400)]/20 transition-all duration-300 min-h-[44px] active:scale-[0.99]"
        >
          帮我选一个
        </button>

        <button
          onClick={onBrowseAll}
          className="w-full py-4 bg-white/70 text-[#6B5B52] font-medium rounded-2xl border border-[#E8DCD6] hover:bg-white transition-all duration-300 min-h-[44px]"
        >
          浏览全部 {toolCount} 个工具
        </button>

        <div className="flex gap-3">
          <button
            onClick={onXiaoku}
            className="flex-1 py-3.5 bg-white/70 text-[#6B5B52] text-sm font-medium rounded-2xl border border-[#E8DCD6] hover:bg-white transition-all duration-300 min-h-[44px]"
          >
            找小酷聊聊
          </button>
          <button
            onClick={onHome}
            className="flex-1 py-3.5 bg-white/70 text-[#6B5B52] text-sm font-medium rounded-2xl border border-[#E8DCD6] hover:bg-white transition-all duration-300 min-h-[44px]"
          >
            回到首页
          </button>
        </div>
      </div>

      {/* 安全提示 */}
      <div className="text-center text-xs text-[#C9BDB5] leading-relaxed pt-2">
        <p>
          如果你正在经历心理危机或有伤害自己的想法，
          <br />
          请立即拨打 QM 心理援助热线：
          <span className="text-[#FC8181] font-medium"> 15001930070</span>
        </p>
      </div>
    </div>
  );
}
