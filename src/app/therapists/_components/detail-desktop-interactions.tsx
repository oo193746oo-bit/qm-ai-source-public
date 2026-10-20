"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { DesktopNavigation } from "@/components/qm-site-shell/desktop-navigation";
import { Arrow } from "@/components/qm-site-shell/home-header";
import { QM_WECHAT_ID } from "@/components/copyable-wechat";

export function DetailDesktopHeader() {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <a className="skip-link" href="#therapist-main">跳到主要内容</a>
      <header className="qm-approved-nav-header">
        <Link className="brand" href="/" aria-label="QM AI 首页"><i className="qmark" aria-hidden="true" />QM <span>AI</span></Link>
        <DesktopNavigation />
        <button type="button" className="login" onClick={() => dialog.current?.showModal()}>登录 / 注册 <Arrow /></button>
      </header>
      <dialog className="td-modal" ref={dialog} aria-labelledby="td-account-title">
        <button type="button" className="modal-close" aria-label="关闭" onClick={() => dialog.current?.close()}>×</button>
        <h2 id="td-account-title">账号功能尚未开放</h2>
        <p>真实注册功能正在准备中。你可以先和小酷聊聊，当前不会声称已为你建立账号或长期记忆。</p>
        <div className="modal-actions"><Link className="modal-action primary" href="/chat">先和小酷聊聊　→</Link><button type="button" onClick={() => dialog.current?.close()}>返回</button></div>
      </dialog>
    </>
  );
}

export function DetailServiceAction({ name, service, action }: { name: string; service: string; action: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [status, setStatus] = useState("");
  async function copyWechat() {
    try {
      if (!navigator.clipboard) throw new Error("clipboard unavailable");
      await navigator.clipboard.writeText(QM_WECHAT_ID);
      setStatus("已复制");
    } catch { setStatus("未能复制，请手动复制"); }
  }
  return (
    <>
      <button type="button" className="price-action" aria-label={`${action}：${name} · ${service}`} onClick={() => { setStatus(""); dialog.current?.showModal(); }}>{`${action}　→`}</button>
      <dialog className="td-modal" ref={dialog} aria-labelledby={`td-service-${service}`}>
        <button type="button" className="modal-close" aria-label="关闭" onClick={() => dialog.current?.close()}>×</button>
        <h2 id={`td-service-${service}`}>联系人工客服</h2>
        <p>{name} · {service}</p>
        <p>人工客服会协助确认需求、人选、时间与费用。暂不在本站直接付款，也不会生成预约成功记录。</p>
        <p>客服微信：<strong>{QM_WECHAT_ID}</strong></p>
        <button type="button" onClick={copyWechat}>复制微信号</button><p role="status" aria-live="polite">{status}</p>
        <div className="modal-actions"><a className="modal-action primary" href="tel:15001930070">拨打电话</a><Link className="modal-action" href={`/contact?therapist=${encodeURIComponent(name)}&service=${encodeURIComponent(service)}`}>查看联系方式　→</Link></div>
      </dialog>
    </>
  );
}
