// QM 自助工具 v3.0 - FAST MODE 横幅组件

interface FastModeBannerProps {
  onFastEnd: () => void;
  onPause: () => void;
  onExit: () => void;
  onXiaoku: () => void;
}

export function FastModeBanner({
  onFastEnd,
  onPause,
  onExit,
  onXiaoku,
}: FastModeBannerProps) {
  return (
    <div className="bg-gradient-to-r from-[#F687B3]/10 to-[#B794F4]/10 rounded-2xl p-4 border border-[#B794F4]/20">
      <div className="space-y-3">
        <div className="flex items-start gap-2">
          <span className="text-base flex-shrink-0">⚡</span>
          <div>
            <p className="text-sm text-[#5A4A6A] font-medium">
              可以，我们缩短。
            </p>
            <p className="text-xs text-[#7A6A8A] mt-0.5">
              接下来大约还要 1 分钟。你也可以现在停。
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onFastEnd}
            className="py-2.5 bg-[#6B4C9A] text-white text-xs font-medium rounded-xl hover:bg-[#5A3D8A] transition-colors min-h-[40px]"
          >
            30秒结束版
          </button>
          <button
            onClick={onPause}
            className="py-2.5 bg-white/70 text-[#6B5B52] text-xs font-medium rounded-xl border border-[#E8DCD6] hover:bg-white transition-colors min-h-[40px]"
          >
            暂停保存
          </button>
          <button
            onClick={onExit}
            className="py-2.5 bg-white/70 text-[#6B5B52] text-xs font-medium rounded-xl border border-[#E8DCD6] hover:bg-white transition-colors min-h-[40px]"
          >
            退出
          </button>
          <button
            onClick={onXiaoku}
            className="py-2.5 bg-white/70 text-[#7C3AED] text-xs font-medium rounded-xl border border-[#B794F4]/30 hover:bg-[#F5F0FF] transition-colors min-h-[40px]"
          >
            找小酷聊聊
          </button>
        </div>
      </div>
    </div>
  );
}
