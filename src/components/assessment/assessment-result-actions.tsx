'use client';

// ============================================================
// QM AI — Assessment Result Actions v1.0
// 所有测评结果页统一使用：
//   1. 保存长图   2. 导出PDF   3. 分享给朋友   4. 和小酷聊聊
//
// POC 实现：
//   - PDF：window.print()（配合 print CSS）
//   - 长图/分享：调用 props.onExportImage / onShare 回调；
//                如未提供则降级为提示用户使用系统截图
//   - 和小酷聊聊：构造 assessment handoff URL 跳转首页
//
// 隐私原则（A04 / A12）：
//   URL 只携带不透明 token，绝不放原始分或敏感结果
// ============================================================

import { useState } from 'react';
import {
  buildHandoffUrl,
  type HandoffContext,
} from '@/lib/assessments/canonical-registry';

export interface ResultPayload {
  assessment_key: string;
  assessment_name: string;
  assessment_version: string;
  public_summary: string;
  key_dimensions: { name: string; value: string }[];
  themes: string[];
  focus_suggestions: string[];
  boundary_note?: string;
}

interface Props {
  result: ResultPayload;
  /** 可选：测评自己实现的长图生成函数 */
  onExportImage?: () => void | Promise<void>;
  /** 可选：测评自己实现的分享卡片生成函数 */
  onShare?: () => void | Promise<void>;
  /** 按钮文案自定义 */
  labels?: {
    image?: string;
    pdf?: string;
    share?: string;
    chat?: string;
  };
  /** 是否在点击"和小酷聊聊"前先让用户勾选"记住摘要"（MVP 记忆 opt-in） */
  enableMemoryOptIn?: boolean;
}

export function AssessmentResultActions({
  result,
  onExportImage,
  onShare,
  labels,
  enableMemoryOptIn = true,
}: Props) {
  const [busy, setBusy] = useState<null | 'image' | 'pdf' | 'share' | 'chat'>(
    null,
  );
  const [showMemoryPrompt, setShowMemoryPrompt] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handlePdf = () => {
    setBusy('pdf');
    try {
      window.print();
    } finally {
      setTimeout(() => setBusy(null), 800);
    }
  };

  const handleImage = async () => {
    setBusy('image');
    try {
      if (onExportImage) {
        await onExportImage();
      } else {
        flash('请使用手机/电脑的系统截图功能保存结果');
      }
    } finally {
      setBusy(null);
    }
  };

  const handleShare = async () => {
    setBusy('share');
    try {
      if (onShare) {
        await onShare();
      } else if (onExportImage) {
        await onExportImage();
        flash('图片已生成，可在系统分享中发送');
      } else {
        flash('请使用系统截图后，再通过系统分享发送');
      }
    } finally {
      setBusy(null);
    }
  };

  const goChat = (remember: boolean) => {
    const context: Omit<HandoffContext, 'valid'> = {
      assessment_key: result.assessment_key,
      assessment_name: result.assessment_name,
      assessment_version: result.assessment_version,
      completed_at: new Date().toISOString(),
      public_summary: result.public_summary,
      key_dimensions: result.key_dimensions,
      themes: result.themes,
      focus_suggestions: result.focus_suggestions,
      boundary_note:
        result.boundary_note ??
        '本结果仅供自我觉察参考，不构成诊断、鉴定或标签。',
    };
    const url = buildHandoffUrl(context);

    try {
      if (remember) {
        // MVP 长期记忆：只存公开摘要，不存逐题答案（A07）
        const list = JSON.parse(
          localStorage.getItem('qm_assessment_memory') ?? '[]',
        ) as Array<Record<string, unknown>>;
        list.push({
          id: `mem_${Date.now()}`,
          ...context,
          created_at: new Date().toISOString(),
        });
        localStorage.setItem('qm_assessment_memory', JSON.stringify(list));
      }
    } catch {
      /* localStorage 不可用时忽略 */
    }

    setShowMemoryPrompt(false);
    setBusy(null);
    window.location.href = url;
  };

  const handleChat = () => {
    setBusy('chat');
    if (enableMemoryOptIn) {
      setShowMemoryPrompt(true);
    } else {
      goChat(false);
    }
  };

  const btnBase =
    'flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-sm font-medium transition-all duration-200 disabled:opacity-50';

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 print:hidden">
        <button
          type="button"
          onClick={handleImage}
          disabled={busy !== null}
          className={`${btnBase} bg-white border border-[#E8DCD6] text-[#6B5B52] hover:border-[#B794F4] hover:text-[#6B4C9A]`}
        >
          <span className="text-base">🖼️</span>
          {labels?.image ?? '保存长图'}
        </button>

        <button
          type="button"
          onClick={handlePdf}
          disabled={busy !== null}
          className={`${btnBase} bg-white border border-[#E8DCD6] text-[#6B5B52] hover:border-[#B794F4] hover:text-[#6B4C9A]`}
        >
          <span className="text-base">📄</span>
          {labels?.pdf ?? '导出PDF'}
        </button>

        <button
          type="button"
          onClick={handleShare}
          disabled={busy !== null}
          className={`${btnBase} bg-white border border-[#E8DCD6] text-[#6B5B52] hover:border-[#B794F4] hover:text-[#6B4C9A]`}
        >
          <span className="text-base">💌</span>
          {labels?.share ?? '分享给朋友'}
        </button>

        <button
          type="button"
          onClick={handleChat}
          disabled={busy !== null}
          className={`${btnBase} text-white shadow-sm hover:shadow-md hover:scale-[1.02]`}
          style={{
            background: 'linear-gradient(135deg, #B794F4, #F687B3)',
          }}
        >
          <span className="text-base">💬</span>
          {labels?.chat ?? '和小酷聊聊'}
        </button>
      </div>

      <p className="text-xs text-[#A79A92] mt-3 text-center leading-relaxed print:hidden">
        分享给朋友只包含公开摘要，详细结果只保存在你自己的设备上。
      </p>

      {/* 记忆 opt-in 弹层 */}
      {showMemoryPrompt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => {
            setShowMemoryPrompt(false);
            setBusy(null);
          }}
        >
          <div
            className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-2xl mb-3">🧠</div>
            <h3 className="text-lg font-medium text-[#4A4A4A] mb-2">
              要不要让小酷记住这次测评？
            </h3>
            <p className="text-sm text-[#7A6A62] leading-relaxed mb-4">
              我们只会保存测评名称、公开摘要和你最关心的主题，
              <strong>不会保存你的逐题答案或敏感数据</strong>。
              你可以随时在对话里说「忘掉这次测评」或「清空记忆」删除。
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => goChat(true)}
                className="w-full py-3 rounded-2xl text-white text-sm font-medium"
                style={{
                  background: 'linear-gradient(135deg, #B794F4, #F687B3)',
                }}
              >
                记住，去聊
              </button>
              <button
                type="button"
                onClick={() => goChat(false)}
                className="w-full py-3 rounded-2xl text-sm text-[#7A6A62] bg-[#FAF5F2] hover:bg-[#F0E6E0]"
              >
                只在这次对话中使用
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-full bg-[#4A4A4A] text-white text-sm shadow-lg">
          {toast}
        </div>
      )}
    </>
  );
}
