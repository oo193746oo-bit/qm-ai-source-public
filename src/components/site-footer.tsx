/**
 * 全站统一页脚（Wave 1 视觉重建 20260917，照 REF 设计稿）
 * QM AI | 专业的心理支持 · 更自在的人生可能 —— A KINDER BRIGHTER YOU
 */
export function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-[#F0E4D8] bg-[#FBF6F0]/70">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-5 py-6 text-xs text-[#8A7E76] sm:flex-row">
        <p className="flex items-center gap-2">
          <span
            aria-hidden
            className="inline-block h-4 w-4 rounded-full bg-gradient-to-br from-[#F7E6D8] via-[#F2D8C4] to-[#E8BFA8]"
          />
          <span className="font-semibold text-[#5C544D]">QM AI</span>
          <span aria-hidden>|</span>
          <span>专业的心理支持 · 更自在的人生可能</span>
        </p>
        <p className="tracking-[0.25em] text-[#B09A8C]">A KINDER BRIGHTER YOU</p>
      </div>
    </footer>
  );
}
