"use client";

import { useState, useEffect, useRef } from "react";
import type { DailyCheckin, DiaryEntry, XiaokuLetter } from "@/lib/treehole/th-types";
import { generateLetter, calculateTargetLength } from "@/lib/treehole/th-ai-service";
import { formatDateChinese } from "@/lib/treehole/th-storage";
import { useDesktopOverlay } from "./desktop-panels";
import { DesktopDialog } from "./desktop-dialog";
import { DesktopLetterReadOnly } from "./desktop-letter-readonly";

interface LetterViewProps {
  date: string;
  diary: DiaryEntry;
  checkin?: DailyCheckin;
  onLetterGenerated: (letter: XiaokuLetter) => boolean;
  onLetterRevealed: () => void;
  existingLetter?: XiaokuLetter;
  onBackToDiary: () => void;
  isGenerating: boolean;
  desktop?: boolean;
  onSaveFailedChange?: (failed: boolean) => void;
}

export function LetterView({
  date,
  diary,
  checkin,
  onLetterGenerated,
  onLetterRevealed,
  existingLetter,
  onBackToDiary,
  isGenerating,
  desktop = false,
  onSaveFailedChange,
}: LetterViewProps) {
  const overlay = useDesktopOverlay();
  const dialogOwner = useRef(Symbol("回信生成失败弹层"));
  const saveDialogOwner = useRef(Symbol("回信保存失败弹层"));
  const backRef = useRef(onBackToDiary);
  backRef.current = onBackToDiary;
  const retryRef = useRef<() => void>(() => {});
  const onSaveFailedChangeRef = useRef(onSaveFailedChange);
  onSaveFailedChangeRef.current = onSaveFailedChange;
  const [letter, setLetter] = useState<XiaokuLetter | null>(existingLetter || null);
  const [loading, setLoading] = useState(isGenerating && !existingLetter);
  const [error, setError] = useState<string | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const letterRef = useRef<HTMLDivElement>(null);
  const generation = useRef(0);
  const retryBusy = useRef(false);
  const onLetterGeneratedRef = useRef(onLetterGenerated);
  onLetterGeneratedRef.current = onLetterGenerated;
  const onLetterRevealedRef = useRef(onLetterRevealed);
  onLetterRevealedRef.current = onLetterRevealed;
  // 保存回信会从存储重新读取记录，checkin 对象引用随之变化；只按内容变化重启生成。
  const checkinKey = JSON.stringify(checkin ?? null);
  const showOverlay = overlay?.show;
  const clearOverlay = overlay?.clear;
  useEffect(() => { onSaveFailedChangeRef.current?.(saveFailed); }, [saveFailed]);
  useEffect(() => {
    if (!saveFailed) return;
    const warnBeforeLeave = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeLeave);
    return () => window.removeEventListener("beforeunload", warnBeforeLeave);
  }, [saveFailed]);
  useEffect(() => {
    if (!desktop || !error || !showOverlay) return;
    const owner = dialogOwner.current;
    showOverlay(owner, "08", <DesktopDialog kind="generate-failed" onSecondary={async () => backRef.current()} onPrimary={async () => retryRef.current()} />);
    return () => clearOverlay?.(owner);
  }, [desktop, error, showOverlay, clearOverlay]);
  useEffect(() => {
    if (!desktop || !saveFailed || !letter || !showOverlay) return;
    const owner = saveDialogOwner.current;
    showOverlay(owner, "09", <DesktopDialog kind="letter-save-failed"
      letterSaveDescription="回信已生成，但尚未保存。完整内容仍在当前页面；请重试保存。由于信件身份尚未核定，目前不能导出图片。"
      secondaryDisabled secondaryLabel="图片导出暂不可用"
      onSecondary={async () => {}}
      onPrimary={async () => {
        const saved = onLetterGeneratedRef.current(letter);
        setSaveFailed(!saved);
        if (!saved) throw new Error("回信仍未保存");
        onLetterRevealedRef.current();
      }} />);
    return () => clearOverlay?.(owner);
  }, [desktop, saveFailed, letter, showOverlay, clearOverlay]);

  // 生成回信
  useEffect(() => {
    const selectedGeneration = ++generation.current;
    let typeInterval: ReturnType<typeof setInterval> | null = null;
    if (existingLetter) {
      setLetter(existingLetter);
      setDisplayedText(existingLetter.text);
      return () => { generation.current++; retryBusy.current = false; };
    }

    if (!isGenerating) return () => { generation.current++; retryBusy.current = false; };

    const generate = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await generateLetter({
          diaryText: diary.text,
          checkin,
          date,
        });
        if (generation.current !== selectedGeneration) return;
        if (!result.letter.text.trim()) throw new Error("回信正文不完整");

        setLetter(result.letter);
        // 服务已返回完整回信时立即尝试保存；逐字动画不能成为权威写入的前提。
        const saved = onLetterGeneratedRef.current(result.letter);
        setSaveFailed(!saved);
        // B3-SAFE-V03：危机信不做打字机动效（高风险状态降低动效），立即完整呈现
        if (result.letter.isCrisis) {
          setDisplayedText(result.letter.text);
          if (saved) onLetterRevealedRef.current();
          return;
        }
        if (desktop && saved) {
          setDisplayedText(result.letter.text);
          onLetterRevealedRef.current();
          return;
        }
        // 打字机效果（非危机回信）
        let i = 0;
        const text = result.letter.text;
        typeInterval = setInterval(() => {
          if (generation.current !== selectedGeneration) {
            if (typeInterval) clearInterval(typeInterval);
            return;
          }
          if (i < text.length) {
            setDisplayedText(text.slice(0, i + 1));
            i++;
          } else {
            if (typeInterval) clearInterval(typeInterval);
            if (saved) onLetterRevealedRef.current();
          }
        }, 15);
      } catch (e) {
        if (generation.current !== selectedGeneration) return;
        console.error("生成回信失败:", e);
        setError("生成回信时出现了一点小问题，请稍后再试");
      } finally {
        if (generation.current === selectedGeneration) setLoading(false);
      }
    };

    // React 开发模式会立即执行一次 setup→cleanup→setup；先让本轮存活到下个任务，避免同封信打两次真实模型请求。
    const launchTimer = window.setTimeout(() => { if (generation.current === selectedGeneration) void generate(); }, 0);
    return () => { generation.current++; retryBusy.current = false; window.clearTimeout(launchTimer); if (typeInterval) clearInterval(typeInterval); };
  }, [isGenerating, existingLetter, diary.text, date, checkinKey]);

  const dateDisplay = formatDateChinese(date);
  const target = calculateTargetLength(diary.charCount);
  const retryGeneration = () => {
    if (retryBusy.current) return;
    retryBusy.current = true;
    const selectedGeneration = ++generation.current;
    setError(null);
    setLoading(true);
    generateLetter({ diaryText: diary.text, checkin, date }).then((result) => {
      if (generation.current !== selectedGeneration) return;
      retryBusy.current = false;
      if (!result.letter.text.trim()) throw new Error("回信正文不完整");
      setLetter(result.letter);
      setDisplayedText(result.letter.text);
      setLoading(false);
      const saved = onLetterGeneratedRef.current(result.letter);
      setSaveFailed(!saved);
      if (saved) onLetterRevealedRef.current();
    }).catch(() => {
      if (generation.current !== selectedGeneration) return;
      retryBusy.current = false;
      setError("重试还是失败了，请稍后再试");
      setLoading(false);
    });
  };
  retryRef.current = retryGeneration;

  // 桌面失败由批准的08态弹层表达，避免旧版失败卡在遮罩后重复露出。
  if (desktop && error) return null;
  if (desktop && saveFailed && letter && !letter.isCrisis) {
    return <DesktopLetterReadOnly dateDisplay={dateDisplay.split("日")[0] + "日"} text={letter.text}
      onBack={onBackToDiary} onChat={() => {}} unsaved />;
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-sm">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">💌</div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: "#4A4A4A" }}>
            小酷正在给你写回信
          </h3>
          <p className="text-sm mb-6" style={{ color: "#71717A" }}>
            认真读完了你写的，正在慢慢组织语言...
          </p>
          <div className="flex items-center justify-center gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full animate-bounce"
                style={{
                  backgroundColor: "#6B4C9A",
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            ))}
          </div>
          <p className="text-xs mt-4" style={{ color: "#A1A1AA" }}>
            预计回信约 {target.min}-{target.max} 字
          </p>
          <button type="button" onClick={onBackToDiary} className="mt-6 px-4 py-2.5 rounded-full text-sm" style={{ background: "#F3F4F6", color: "#555" }}>
            返回日记
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
        <div className="text-4xl mb-4">😌</div>
        <h3 className="text-lg font-semibold mb-2" style={{ color: "#4A4A4A" }}>
          暂时写不了回信
        </h3>
        <p className="text-sm mb-6" style={{ color: "#71717A" }}>
          {error}
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onBackToDiary}
            className="px-5 py-2.5 rounded-full text-sm font-medium"
            style={{ background: "#F3F4F6", color: "#71717A" }}
          >
            回到日记
          </button>
          <button
            onClick={retryGeneration}
            className="px-5 py-2.5 rounded-full text-sm font-medium text-white"
            style={{ background: "linear-gradient(135deg, #6B4C9A, #9F7AEA)" }}
          >
            再试一次
          </button>
        </div>
      </div>
    );
  }

  if (!letter) {
    return null;
  }

  return (
    <div className="space-y-4">
      {saveFailed && <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
        <p>回信已经写好，但尚未保存。当前完整回信仍在页面中，请勿关闭。</p>
        <button type="button" className="mt-3 underline" onClick={() => {
          const saved = onLetterGeneratedRef.current(letter);
          setSaveFailed(!saved);
          if (saved) onLetterRevealedRef.current();
        }}>重试保存回信</button>
      </div>}
      {/* 回信卡 */}
      <div ref={letterRef} className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm">
        {/* 日期 */}
        <p className="text-xs mb-6" style={{ color: "#A1A1AA" }}>
          {dateDisplay}
        </p>

        {/* 危机标记（B3-SAFE-V06：键盘/读屏顺序先到关键行动，危机卡置于称呼与正文之前；
            热线卡与拍板登记对齐：12356/12355/15001930070/13601658763，立即危险 110/120） */}
        {letter.isCrisis && (
          <div className="mt-6 p-4 rounded-xl" role="alert" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
            <p className="text-sm font-medium" style={{ color: "#991B1B" }}>
              ⚠️ 这是一封危机安全回应
            </p>
            <p className="text-sm mt-2" style={{ color: "#B91C1C" }}>
              如果你正在经历危机，请立刻拨打：
            </p>
            <div className="text-sm mt-2 space-y-1" style={{ color: "#7F1D1D" }}>
              <p>📞 全国心理援助热线：<a href="tel:12356" className="underline">12356</a>（7×24 小时）</p>
              <p>📞 青少年心理服务热线：<a href="tel:12355" className="underline">12355</a></p>
              <p>📞 QM 心理援助热线：<a href="tel:15001930070" className="underline">15001930070</a>（24 小时）</p>
              <p>📞 备用热线：<a href="tel:13601658763" className="underline">13601658763</a></p>
              <p>💬 <a href="/contact" className="underline">联系人工客服（「联系我们」页面）</a></p>
              <p className="pt-1">如当下处于立即危险，请同时拨打 110 或 120。</p>
            </div>
          </div>
        )}

        {/* 称呼 */}
        <p className="text-sm mb-4" style={{ color: "#6B4C9A", fontWeight: 500 }}>
          亲爱的你：
        </p>

        {/* 回信正文 */}
        <div
          className="text-sm leading-loose whitespace-pre-wrap"
          style={{ color: "#4A4A4A", letterSpacing: "0.02em" }}
        >
          {displayedText}
        </div>

        {/* 加载中显示渐隐 */}
        {loading && displayedText.length < letter.text.length && (
          <span className="inline-block w-2 h-4 ml-1 animate-pulse" style={{ background: "#6B4C9A" }} />
        )}

        {/* 分割线 */}
        <div className="my-6 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(107,76,154,0.2), transparent)" }} />

        {/* 今日一句话 */}
        {letter.dailySentence && (
          <div className="text-center py-4">
            <p className="text-xs mb-2" style={{ color: "#A78BFA" }}>
              今天的一句话
            </p>
            <p
              className="text-base font-medium italic"
              style={{ color: "#6B4C9A" }}
            >
              「{letter.dailySentence}」
            </p>
          </div>
        )}

        {/* 落款 */}
        <div className="text-right mt-6">
          <p className="text-sm" style={{ color: "#6B4C9A" }}>
            小酷
          </p>
          <p className="text-xs mt-1" style={{ color: "#A1A1AA" }}>
            {dateDisplay}
          </p>
        </div>
      </div>

      {/* 操作栏 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={onBackToDiary}
            className="px-4 py-2 rounded-full text-xs font-medium transition-colors"
            style={{ background: "#F3F4F6", color: "#71717A" }}
          >
            修改日记
          </button>
          <button
            type="button"
            disabled
            title="当前回信缺少可核验的信件身份和版本，暂不能生成获批PNG"
            className="px-4 py-2 rounded-full text-xs font-medium transition-colors"
            style={{ background: "#F3F4F6", color: "#71717A", opacity: 0.6 }}
          >
            保存/导出
          </button>
          <span className="text-xs" style={{ color: "#A1A1AA" }}>
            {letter.charCount} 字
          </span>
        </div>
        <p className="text-xs text-center mt-3" style={{ color: "#A1A1AA" }}>
          当前回信缺少可核验的信件身份和版本，图片导出暂不可用；不能以打印或PDF代替获批PNG。
        </p>
      </div>
    </div>
  );
}
