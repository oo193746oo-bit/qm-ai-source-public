"use client";

import Link from "next/link";
import { DesktopNavigation } from "@/components/qm-site-shell/desktop-navigation";
import * as Dialog from "@radix-ui/react-dialog";

export function ListArrow({ weight = "1.8" }: { weight?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={weight} strokeLinecap={weight === "1.6" ? "round" : undefined} strokeLinejoin={weight === "1.6" ? "round" : undefined} aria-hidden="true">
      <path d="M4 12h16m-6-6 6 6-6 6" />
    </svg>
  );
}

// Page-local adapter for the approved navigation contract. Does not import the unreviewed homepage shell.
export function ListHeader() {
  return (
    <header className="qm-approved-nav-header">
      <Link href="/" className="brand" aria-label="QM AI 首页"><i className="qmark" aria-hidden="true" />QM <span>AI</span></Link>
      <DesktopNavigation />
      <Dialog.Root>
        <Dialog.Trigger className="login">登录 / 注册 <ListArrow weight="1.6" /></Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="qm-l1-dialog-overlay" />
          <Dialog.Content className="qm-l1-dialog qm-l1-dialog-content">
            <Dialog.Title className="qm-l1-dialog-title">账号功能尚未开放</Dialog.Title>
            <Dialog.Description className="qm-l1-dialog-description">你可以先和小酷聊聊。注册与跨次聊天的记忆功能将在账号功能开放后提供。</Dialog.Description>
            <div className="qm-l1-dialog-actions">
              <Link href="/chat">先和小酷聊聊</Link>
              <Dialog.Close>关闭</Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </header>
  );
}
