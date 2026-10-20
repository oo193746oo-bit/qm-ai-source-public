"use client";

import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import * as Popover from "@radix-ui/react-popover";
import { useState } from "react";
import { DesktopNavigation } from "./desktop-navigation";

const navigation = [
  ["首页", "/"],
  ["和小酷聊聊", "/chat"],
  ["找心理师", "/therapists"],
  ["自助工具", "/tools"],
  ["了解 QM", "/about-qm"],
] as const;

export function Arrow({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 12h16m-6-6 6 6-6 6" />
    </svg>
  );
}

export function HomeHeader({ legacy = false }: { legacy?: boolean } = {}) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className={"home-header qm-approved-nav-header" + (legacy ? " qm-nav-legacy" : "")}>
      <Link className="brand" href="/" aria-label="QM AI 首页">
        <i className="qmark" aria-hidden="true" />
        QM <span>AI</span>
      </Link>
      <DesktopNavigation />
      <div className="header-actions">
        <Popover.Root open={menuOpen} onOpenChange={setMenuOpen}>
          <Popover.Trigger
            className="menu-trigger"
            aria-label="打开导航菜单"
            aria-controls="qm-home-mobile-menu"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              aria-hidden="true"
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              id="qm-home-mobile-menu"
              className="qm-home-surface mobile-menu"
              align="end"
              sideOffset={8}
              aria-label="手机导航菜单"
            >
              <nav aria-label="手机主导航">
                {navigation.map(([label, href]) => (
                  <Link
                    key={href}
                    href={href}
                    aria-current={href === "/" ? "page" : undefined}
                    onClick={() => setMenuOpen(false)}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
        <Dialog.Root>
          <Dialog.Trigger className="login">
            登录 / 注册 <Arrow />
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="qm-home-dialog-overlay" />
            <Dialog.Content className="qm-home-surface account-dialog">
              <Dialog.Title>账号功能尚未开放</Dialog.Title>
              <Dialog.Description>
                你可以先和小酷聊聊。注册与跨次聊天的记忆功能将在账号功能开放后提供。
              </Dialog.Description>
              <div className="dialog-actions">
                <Dialog.Close asChild>
                  <Link href="/chat" className="dialog-primary">
                    先和小酷聊聊 <Arrow />
                  </Link>
                </Dialog.Close>
                <Dialog.Close className="dialog-close">关闭</Dialog.Close>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </header>
  );
}
