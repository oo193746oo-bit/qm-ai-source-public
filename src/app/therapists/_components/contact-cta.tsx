import Link from "next/link";
import { ArrowRight, Headphones } from "lucide-react";

/**
 * 联系人工客服 — 详情页/价格区唯一业务 CTA（PF-11 权威链拍板）。
 * 禁止出现「立即预约 / 立即购买」等成交按钮；统一导流 /contact。
 */
export default function ContactCta({
  size = "md",
  align = "left",
  label = "联系人工客服",
}: {
  size?: "md" | "lg";
  align?: "left" | "center" | "stretch";
  label?: string;
}) {
  const pad =
    size === "lg"
      ? "min-h-[48px] px-7 py-3 text-[15px]"
      : "min-h-[44px] px-5 py-2 text-[13px] md:min-h-[46px]";
  const alignCls =
    align === "center"
      ? "flex justify-center"
      : align === "stretch"
        ? "flex"
        : "flex";
  return (
    <div className={alignCls}>
      <Link
        href="/contact"
        className={`group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#F6E7D4] to-[#F3D3C2] ring-1 ring-[#E8D2BE] shadow-[0_2px_10px_rgba(166,106,24,0.10)] text-[#A66A18] font-semibold transition-all duration-200 hover:shadow-[0_4px_16px_rgba(166,106,24,0.18)] hover:brightness-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A66A18]/40 active:scale-[0.99] disabled:opacity-60 ${pad} ${
          align === "stretch" ? "w-full" : ""
        }`}
        aria-label={`${label}（预约前置沟通与费用说明）`}
      >
        <Headphones className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{label}</span>
        <ArrowRight
          className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </Link>
    </div>
  );
}
