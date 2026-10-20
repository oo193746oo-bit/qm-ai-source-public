"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

/**
 * 关于我 — 桌面完整呈现；移动端可展开/收起（响应式矩阵：关于我可展开）。
 * 数据合同：about 缺失时隐藏区块（非必填可隐藏），不得虚构。
 */
export default function AboutSection({ paragraphs }: { paragraphs: string[] }) {
  const [open, setOpen] = useState(false);
  if (!paragraphs.length) return null;

  return (
    <section aria-label="关于我" className="rounded-3xl border border-[#F3E8DB] bg-white p-5 shadow-[0_4px_18px_rgba(93,64,28,0.05)] sm:p-7">
      <div className="flex items-center gap-2.5">
        <span aria-hidden="true" className="h-4 w-1 rounded-full bg-gradient-to-b from-[#D98A73] to-[#C4786B]" />
        <h2 className="font-qm-serif text-lg font-bold text-[#4A3B2E] sm:text-xl">关于我</h2>
      </div>
      <div
        className={`relative mt-3 overflow-hidden transition-[max-height] duration-300 ${
          open ? "max-h-[2000px]" : "max-h-[220px] md:max-h-none"
        }`}
      >
        <div className="space-y-3 text-justify text-[14px] leading-[1.9] text-[#5C5248] sm:text-[15px]">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        {!open && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent md:hidden"
          />
        )}
      </div>
      {paragraphs.length > 0 && (
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="mt-2 inline-flex min-h-[44px] w-full items-center justify-center gap-1 rounded-xl text-[13px] font-medium text-[#A66A18] transition-colors hover:bg-[#FBEEDC]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A66A18]/40 md:hidden"
        >
          {open ? "收起" : "展开全部"}
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>
      )}
    </section>
  );
}
