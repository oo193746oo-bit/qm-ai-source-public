"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageLayout } from "@/components/page-layout";

interface ZoneRedirectProps {
  zoneId: string;
  zoneName: string;
  zoneEmoji: string;
  targetPath: string;
  targetName: string;
}

export function ZoneRedirect({
  zoneId,
  zoneName,
  zoneEmoji,
  targetPath,
  targetName,
}: ZoneRedirectProps) {
  const router = useRouter();

  useEffect(() => {
    // 延迟重定向，给用户一个视觉过渡
    const timer = setTimeout(() => {
      router.replace(targetPath);
    }, 1500);
    return () => clearTimeout(timer);
  }, [router, targetPath]);

  return (
    <PageLayout title={zoneName} showBack>
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-5xl mb-4">{zoneEmoji}</div>
        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          {zoneName}
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          内容已升级至新版知识库架构
        </p>
        <div className="flex items-center gap-3 text-sm text-gray-400">
          <span className="px-3 py-1 bg-gray-100 rounded-full text-xs">
            {zoneId}
          </span>
          <span>→</span>
          <span className="px-3 py-1 bg-[#6B4C9A]/10 text-[#6B4C9A] rounded-full text-xs">
            {targetName}
          </span>
        </div>
        <Link
          href={targetPath}
          className="mt-6 px-5 py-2 bg-[#6B4C9A] text-white rounded-full text-sm font-medium hover:bg-[#5a3d8a] transition-colors"
        >
          立即前往 →
        </Link>
        <p className="text-xs text-gray-400 mt-4">
          页面将自动跳转...
        </p>
      </div>
    </PageLayout>
  );
}
