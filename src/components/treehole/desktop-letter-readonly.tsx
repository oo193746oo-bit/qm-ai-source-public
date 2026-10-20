"use client";

/** 本机回信的桌面阅读层。未取得权威信件ID/修订号时不触发PNG导出。 */
export function DesktopLetterReadOnly({ dateDisplay, text, onBack, onChat, unsaved = false }: {
  dateDisplay: string;
  text: string;
  onBack: () => void;
  onChat: () => void;
  unsaved?: boolean;
}) {
  if (typeof text !== "string" || !text.trim()) {
    return <section className="paper correspondence" role="alert"><p>回信正文不完整，当前不能把它当作已收到的回信。</p><button type="button" className="action" onClick={onBack}>返回日记</button></section>;
  }
  const parts = text.replace(/\r\n?/g, "\n").split(/\n[\t ]*\n/);
  const salutation = parts[0]?.trim() === "亲爱的你：" ? parts.shift() : undefined;
  if (parts.at(-1)?.trim() === "小酷") parts.pop();
  return <section className="paper correspondence">
    <div className="meta"><span>一封来自小酷的回信</span><span>{dateDisplay}</span></div>
    <h2 className="letter-title">给今天的你</h2>
    <article className="received-letter" aria-label="小酷回信，只读内容">
      {salutation && <p className="salutation">{salutation}</p>}
      {parts.map((paragraph, index) => <p className="letter-paragraph whitespace-pre-wrap" key={index}>{paragraph}</p>)}
      <div className="signature"><span>小酷</span><small>你的 AI 心理陪伴伙伴</small></div>
    </article>
    <div className="actions"><button type="button" className="action" disabled={unsaved} onClick={onBack}>返回日记</button><div><button type="button" className="action" disabled title="回信身份与修订号尚未接通，不能安全导出">保存 / 导出</button><button type="button" className="action primary" disabled={unsaved} onClick={onChat}>和小酷聊聊</button></div></div>
    <p className="local-note">{unsaved && "回信尚未保存，请在弹层中重试，关闭页面会丢失这封信。"}AI回信不替代专业心理支持。</p>
  </section>;
}
