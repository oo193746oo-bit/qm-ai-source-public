"use client";

import Link from "next/link";
import { PageLayout } from "@/components/page-layout";
import { XHS_ACCOUNTS, XHS_LINK_PROPS } from "@/lib/xhs-accounts";

/**
 * 联系我们页 v3.1
 *
 * 展示QM上海酷儿心理咨询中心联系方式：
 * - 热线：15001930070 / 备用：13601658763
 * - 联系人工客服（「联系我们」页面）
 * - 微信公众号：QM酷儿心理
 * - 小红书：4个账号（数据从 xhs-accounts.ts 全局读取）
 * - 地址：上海市静安区民立路150号
 * - 工作时间：周一至周日 12:00-24:00
 *
 * 提供【找心理师】按钮跳转 /booking
 *
 * 禁止：400号码、120、110、外部机构（如北京心理危机中心）
 */

// 联系方式条目
const contactItems = [
  {
    icon: "📞",
    label: "机构热线",
    value: "15001930070",
    subtext: "备用：13601658763",
    action: "tel:15001930070",
    actionLabel: "拨打",
  },
  {
    icon: "💬",
    label: "微信客服",
    value: "",
    subtext: "添加微信，人工回复",
    action: null as string | null,
    actionLabel: null as string | null,
  },
  {
    icon: "📱",
    label: "微信公众号",
    value: "QM酷儿心理",
    subtext: "关注获取心理科普与活动信息",
    action: null as string | null,
    actionLabel: null as string | null,
  },
  {
    icon: "📍",
    label: "线下地址",
    value: "上海市静安区民立路150号",
    subtext: "QM上海酷儿心理咨询中心",
    action: null as string | null,
    actionLabel: null as string | null,
  },
  {
    icon: "🕐",
    label: "工作时间",
    value: "周一至周日 12:00-24:00",
    subtext: "全年无休，节假日正常服务",
    action: null as string | null,
    actionLabel: null as string | null,
  },
];

export default function ContactPage() {
  return (
    <PageLayout title="联系我们" subtitle="有任何问题，都欢迎联系我们">
      <div className="space-y-8 md:space-y-10">
        {/* 页面标题 */}
        <div className="max-w-2xl mx-auto text-center space-y-3">
          <h2 className="text-xl md:text-2xl font-semibold text-[#4A4A4A]">
            联系我们
          </h2>
          <p className="text-sm text-[#7A6A62] leading-relaxed">
            QM上海酷儿心理咨询中心。回复可能需要一点时间，但我们一定会回复。
          </p>
        </div>

        {/* 联系方式卡片组 */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-gradient-to-br from-[#B794F4]/10 to-[#F687B3]/10 rounded-2xl p-5 md:p-8 border border-[#B794F4]/20 space-y-5">
            {contactItems.map((item, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-4 ${
                  idx < contactItems.length - 1
                    ? "pb-5 border-b border-[#B794F4]/15"
                    : ""
                }`}
              >
                {/* 图标 */}
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-lg shrink-0 shadow-sm">
                  {item.icon}
                </div>

                {/* 内容 */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-[#9B8E8A] mb-0.5">
                    {item.label}
                  </div>
                  <div className="text-[#4A4A4A] font-medium text-sm md:text-base break-words">
                    {item.value}
                  </div>
                  {item.subtext && (
                    <div className="text-xs text-[#7A6A62] mt-0.5">
                      {item.subtext}
                    </div>
                  )}
                </div>

                {/* 操作按钮 */}
                {item.action && item.actionLabel && (
                  <a
                    href={item.action}
                    className="shrink-0 px-4 py-2 bg-white text-[#6B4C9A] text-xs font-medium rounded-xl border border-[#B794F4]/30 hover:bg-[#6B4C9A]/5 transition-colors min-h-[36px] flex items-center justify-center"
                  >
                    {item.actionLabel}
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 📕 小红书 */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/70 rounded-2xl p-5 md:p-8 border border-[#E8DCD6]/50 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FF2442]/10 flex items-center justify-center text-lg shrink-0">
                📕
              </div>
              <div>
                <h2 className="text-base font-semibold text-[#4A4A4A]">
                  小红书
                </h2>
                <p className="text-xs text-[#7A6A62]">
                  低压力了解 QM 的窗口，不是预约前置条件
                </p>
              </div>
            </div>

            {/* 主账号 */}
            <div className="rounded-xl bg-[#FF2442]/5 border border-[#FF2442]/15 p-4 space-y-2">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-[#4A4A4A] break-words">
                    {XHS_ACCOUNTS[0].handle}
                  </div>
                  <div className="text-xs text-[#7A6A62]">
                    {XHS_ACCOUNTS[0].likesSaves}
                  </div>
                </div>
                <a
                  href={XHS_ACCOUNTS[0].url}
                  {...XHS_LINK_PROPS}
                  className="shrink-0 inline-flex items-center justify-center px-4 py-2 bg-[#FF2442] text-white text-xs font-medium rounded-xl hover:bg-[#E01E3A] transition-colors min-h-[44px]"
                >
                  打开小红书主页
                </a>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {XHS_ACCOUNTS[0].topics.map((t) => (
                  <span
                    key={t}
                    className="text-[11px] px-2 py-0.5 rounded-full bg-white text-[#7A6A62] border border-[#E8DCD6]"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* 专项账号 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {XHS_ACCOUNTS.slice(1).map((acc) => (
                <div
                  key={acc.role}
                  className="rounded-xl bg-white border border-[#E8DCD6] p-3.5 space-y-2 flex flex-col"
                >
                  <div className="text-sm font-medium text-[#4A4A4A] break-words leading-snug">
                    {acc.handle}
                  </div>
                  <div className="text-xs text-[#9B8E8A]">
                    {acc.likesSaves}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {acc.topics.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#F7F2F0] text-[#7A6A62]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <a
                    href={acc.url}
                    {...XHS_LINK_PROPS}
                    className="mt-auto inline-flex items-center justify-center px-3 py-2 bg-white text-[#FF2442] text-xs font-medium rounded-xl border border-[#FF2442]/30 hover:bg-[#FF2442]/5 transition-colors min-h-[44px]"
                  >
                    打开主页
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 预约引导 CTA */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/70 rounded-2xl p-6 md:p-8 border border-[#E8DCD6]/50 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-[#5B7BBA] to-[#7B9BD8] flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="12" cy="8" r="3" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" /></svg>
            </div>
            <h3 className="text-base md:text-lg font-semibold text-[#4A4A4A]">
              想预约心理咨询？
            </h3>
            <p className="text-sm text-[#6B5B52] leading-relaxed max-w-md mx-auto">
              可以查看心理师信息，并联系人工客服了解流程和费用、协助预约。
            </p>
            <Link
              href="/therapists"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#5B7BBA] text-white text-sm font-medium rounded-xl hover:bg-[#4A6AA8] transition-colors min-h-[44px]"
            >
              找心理师
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* AI 边界声明 */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/60 rounded-2xl p-5 md:p-6 border border-[#E8DCD6]/50">
            <div className="flex items-start gap-3">
              <div className="text-lg shrink-0">🧠</div>
              <div>
                <h4 className="text-sm font-medium text-[#4A4A4A] mb-1.5">
                  AI边界声明
                </h4>
                <p className="text-sm text-[#7A6A62] leading-relaxed">
                  QM AI 用于日常心理支持、信息整理、自我探索与预约辅助，
                  不替代心理咨询、心理治疗或医疗服务。涉及诊断、药物、进食障碍的身体风险、
                  急性危机等情况，需要相应的专业评估和支持。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 危机提示 */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-[#FEF2F2] rounded-2xl p-5 md:p-6 border border-[#FC8181]/20 text-center space-y-2">
            <p className="text-xs text-[#FC8181] font-medium">
              如果你正处于心理危机中
            </p>
            <p className="text-sm text-[#7A6A62]">
              请拨打 QM 热线{" "}
              <a
                href="tel:15001930070"
                className="font-semibold text-[#FC8181] hover:underline"
              >
                15001930070
              </a>
              （备用{" "}
              <a
                href="tel:13601658763"
                className="font-semibold text-[#FC8181] hover:underline"
              >
                13601658763
              </a>
              ）
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
