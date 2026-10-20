import type { ReactNode } from "react";
import "@/styles/therapist.tokens.v3.1.css";
import "@/styles/therapist.layout.v3.1.css";
import "@/styles/therapist-page.v3.1.css";

/**
 * 心理师双页面 v3.1 golden master 专属布局层。
 * 仅负责加载 v3.1 工程 CSS 合同（tokens + layout + 页面级补充）；
 * 导航与页脚由各页面按全站已审批 SiteHeader / SiteFooter 组合，避免双导航。
 */
export default function TherapistsRouteLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
