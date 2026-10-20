'use client';
import React from 'react';
export const QM_WECHAT_ID = 'queermental2';
type CWProps = { [key: string]: any };
const CopyableWechat: React.FC<CWProps> = () => {
  const [copied, setCopied] = React.useState(false);
  const copy = () => {
    try {
      navigator.clipboard?.writeText(QM_WECHAT_ID);
    } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
      <a href="/contact" style={{ textDecoration: 'none' }}>
        <button type="button" style={{ minHeight: 48, padding: '12px 20px', borderRadius: 999, border: 'none', background: '#5B5BD6', color: '#fff', fontSize: 16, cursor: 'pointer' }}>
          联系人工客服
        </button>
      </a>
      <button
        type="button"
        onClick={copy}
        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', color: 'inherit', font: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}
      >
        <span style={{ fontSize: 14, color: '#444' }}>客服微信：</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#5B5BD6' }}>{QM_WECHAT_ID}</span>
        <span style={{ fontSize: 12, color: '#999' }}>{copied ? '已复制 ✓' : '（点击复制）'}</span>
      </button>
    </div>
  );
};
export default CopyableWechat;
export { CopyableWechat };