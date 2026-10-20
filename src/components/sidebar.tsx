"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  getGroupedNav,
  getActiveItem,
  type NavItem,
  type NavGroup,
} from "@/lib/navigation-registry";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  /** Pure dismissal only; navigation continues to use onClose. */
  onDismiss?: () => void;
  /** Desktop 端是否折叠到 72px 图标模式（纯CSS控制常驻，此prop控制折叠宽度） */
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  /**
   * 特殊路由处理回调。
   * 对于 action === "xiaoku_chat" 的菜单项（自由对话），
   * 不是跳转页面而是触发小酷对话。
   */
  onStartXiaoku?: () => void;
  /**
   * 强制指定当前激活的菜单项 id。
   * 用于首页/聊天同属 "/" 路由时，区分高亮"首页"还是"自由对话"。
   * 不传则根据 pathname 自动判断。
   */
  forceActiveId?: string;
  /**
   * Logo 点击自定义回调。
   * 传入后 Logo 不再走 Link href="/"，而是执行此回调。
   * 用于聊天页面："/" 是当前路由，Link 不会刷新视图，
   * 需要显式触发"回首页"状态切换。
   */
  onLogoClick?: () => void;
}

const legalLinks = [
  { name: "服务条款", href: "/terms" },
  { name: "隐私政策", href: "/privacy" },
  { name: "免责声明", href: "/disclaimer" },
  { name: "数据留存与删除", href: "/data-deletion" },
];

function SidebarBase({
  isOpen,
  onClose,
  onDismiss,
  collapsed = false,
  onToggleCollapse,
  onStartXiaoku,
  forceActiveId,
  onLogoClick,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  // 当前激活的菜单项
  const pathnameActive = getActiveItem(pathname);

  // 优先使用强制激活 id，其次使用路径匹配
  const activeItem = forceActiveId
    ? (getGroupedNav().flatMap(g => g.items).find(item => item.id === forceActiveId) || null)
    : pathnameActive;

  // 判断某个菜单项是否处于激活状态
  const isItemActive = (item: NavItem): boolean => {
    if (!activeItem) return false;
    return activeItem.id === item.id;
  };

  // 处理菜单项点击
  const handleNavClick = (item: NavItem) => {
    // 移动端点击后关闭侧栏（Desktop端通过CSS常驻，不受isOpen影响）
    onClose();

    // 小酷自由对话：触发回调而非页面跳转
    if (item.action === "xiaoku_chat" && onStartXiaoku) {
      onStartXiaoku();
      return;
    }

    // 普通路由跳转
    router.push(item.route);
  };

  // 按分组组织的导航数据
  const groupedNav = getGroupedNav();

  return (
    <>
      {/* 遮罩（仅移动端显示，Desktop通过CSS隐藏） */}
      <div
        className={`qm-sidebar-overlay ${isOpen ? "is-open" : ""} lg:hidden`}
        onClick={onDismiss ?? onClose}
        aria-hidden="true"
      />

      {/* 侧边栏
          Mobile: 抽屉模式，isOpen控制translate
          Desktop(lg+): 纯CSS常驻，collapsed控制宽度
      */}
      <aside
        className={`
          qm-sidebar
          ${isOpen ? "is-open" : ""}
          ${collapsed ? "is-collapsed" : ""} `}
        style={{ height: "100dvh" }}
      >
        <div className={`p-4 md:p-6 ${collapsed ? "lg:px-2" : ""}`}>
          {/* Logo - 点击回首页 */}
          {onLogoClick ? (
            <button
              onClick={() => {
                onLogoClick();
                onClose();
              }}
              className={`flex items-center gap-3 mb-6 md:mb-8 w-full text-left ${
                collapsed ? "lg:justify-center" : ""
              } hover:opacity-80 transition-opacity`}
              aria-label="回到首页"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl qm-logo-gradient flex items-center justify-center flex-shrink-0 shadow-sm">
                <span className="text-white text-sm md:text-base font-semibold">QM</span>
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <h2 className="text-base md:text-lg font-semibold text-[var(--qm-ink-800)] truncate">
                    QM AI
                  </h2>
                  <p className="text-xs text-[var(--qm-ink-500)] truncate">心理支持伙伴</p>
                </div>
              )}
            </button>
          ) : (
            <Link
              href="/"
              onClick={() => {
                onClose();
              }}
              className={`flex items-center gap-3 mb-6 md:mb-8 ${
                collapsed ? "lg:justify-center" : ""
              } hover:opacity-80 transition-opacity`}
              aria-label="回到首页"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl qm-logo-gradient flex items-center justify-center flex-shrink-0 shadow-sm">
                <span className="text-white text-sm md:text-base font-semibold">QM</span>
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <h2 className="text-base md:text-lg font-semibold text-[var(--qm-ink-800)] truncate">
                    QM AI
                  </h2>
                  <p className="text-xs text-[var(--qm-ink-500)] truncate">心理支持伙伴</p>
                </div>
              )}
            </Link>
          )}

          {/* Desktop 端折叠按钮（仅 lg+ 显示） */}
          {!collapsed && onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex w-full mb-4 items-center justify-center gap-2 py-2 rounded-xl text-xs text-[var(--qm-ink-500)] hover:bg-[var(--qm-surface-0)] hover:text-[var(--qm-purple-700)] transition-colors min-h-[44px]"
              aria-label="折叠侧栏"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              收起侧栏
            </button>
          )}

          {collapsed && onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex w-full mb-4 items-center justify-center py-2 rounded-xl text-[var(--qm-ink-500)] hover:bg-[var(--qm-surface-0)] hover:text-[var(--qm-purple-700)] transition-colors min-h-[44px]"
              aria-label="展开侧栏"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          )}

          {/* 分组菜单列表 */}
          <nav className="space-y-6 mb-6 md:mb-8">
            {groupedNav.map((group) => (
              <div key={group.group} className="space-y-1">
                {/* 组名：小号文字 */}
                {!collapsed && (
                  <p className="text-[11px] font-medium text-[var(--qm-ink-400)] uppercase tracking-wider px-3 mb-2">
                    {group.group}
                  </p>
                )}

                <div className={`space-y-1 ${collapsed ? "lg:space-y-2" : ""}`}>
                  {group.items.map((item) => {
                    const active = isItemActive(item);
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavClick(item)}
                        className={`
                          w-full flex items-center gap-3 rounded-xl transition-all
                          relative
                          ${collapsed
                            ? "lg:justify-center lg:py-3"
                            : "px-3 md:px-4 py-3"
                          }
                          ${active
                            ? "qm-nav-item-active"
                            : "qm-nav-item"
                          }
                          min-h-[44px] `}
                        title={collapsed ? item.label : undefined}
                        aria-current={active ? "page" : undefined}
                      >
                        {/* 当前项左侧 3px 品牌色竖条 */}
                        {active && (
                          <span
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full"
                            style={{ background: "var(--qm-purple-600)" }}
                            aria-hidden="true"
                          />
                        )}

                        <span className={`text-lg flex-shrink-0 ${collapsed ? "" : "md:text-xl"}`}>
                          {item.icon}
                        </span>
                        {!collapsed && (
                          <div className="min-w-0 flex-1 text-left">
                            <p className="text-sm font-medium truncate">
                              {item.label}
                            </p>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* 底部链接 */}
          {!collapsed && (
            <div className="border-t border-[var(--qm-line-100)] pt-4 space-y-1">
              {legalLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => onClose()}
                  className="block px-3 md:px-4 py-2 text-sm text-[var(--qm-ink-500)] hover:text-[var(--qm-purple-700)] transition-colors min-h-[40px]"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          )}

          {/* 底部热线与安全声明 */}
          <div
            className={`
              ${collapsed ? "mt-4" : "mt-6 pt-4 border-t border-[var(--qm-line-100)]"} `}
          >
            {collapsed ? (
              /* 折叠模式：仅图标 */
              <div className="hidden lg:flex justify-center">
                <div className="w-10 h-10 rounded-xl bg-[var(--qm-danger-bg)] border border-[var(--qm-danger)]/20 flex items-center justify-center" title="危机热线">
                  <span className="text-base">📞</span>
                </div>
              </div>
            ) : (
              <div className="qm-danger-panel p-4">
                <p className="text-xs text-[var(--qm-ink-600)] leading-relaxed mb-3">
                  QM AI 是心理支持助手，不能替代专业心理咨询或医疗诊断。
                </p>
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-[var(--qm-danger)]">
                    如果你正处于危机中：
                  </p>
                  <p className="text-xs text-[var(--qm-ink-700)] leading-relaxed">
                    请立即拨打 QM 热线{" "}
                    <a href="tel:15001930070" className="font-semibold text-[var(--qm-danger)] hover:underline">
                      15001930070
                    </a>
                  </p>
                  <p className="text-xs text-[var(--qm-ink-600)] leading-relaxed">
                    备用：<a href="tel:13601658763" className="text-[var(--qm-ink-600)] hover:underline">13601658763</a>
                  </p>
                  <p className="text-xs text-[var(--qm-ink-600)] leading-relaxed">
                    24小时：<a href="tel:12356" className="text-[var(--qm-ink-600)] hover:underline">12356</a>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

/**
 * 汉堡菜单按钮
 * 修复：纯CSS控制显示/隐藏，不使用isDesktop JS state
 * - Mobile: 显示（默认）
 * - Desktop(lg+): 隐藏（Sidebar常驻）
 */
export function MenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="p-2 rounded-full hover:bg-[var(--qm-surface-100)] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center lg:hidden"
      aria-label="打开菜单"
    >
      <svg
        className="w-5 h-5 text-[var(--qm-ink-600)]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  );
}

export function Sidebar(props: SidebarProps) {
  return <SidebarBase {...props} />;
}

export default function SidebarRouteGuard(props: Parameters<typeof Sidebar>[0]) {
  
  return <Sidebar {...props} />;
}
