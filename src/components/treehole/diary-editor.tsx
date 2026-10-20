"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { DailyCheckin, DiaryEntry } from "@/lib/treehole/th-types";
import { getDiaryDraft, getDiaryDraftRaw, getRecord, saveDiaryDraft, formatDateChinese } from "@/lib/treehole/th-storage";
import { DesktopDiary, useDesktopOverlay } from "./desktop-panels";
import { DesktopDialog } from "./desktop-dialog";

interface DiaryEditorProps {
  date: string;
  checkin: DailyCheckin;
  onSaved: (diary: DiaryEntry, requestLetter: boolean) => boolean;
  existingDiary?: DiaryEntry;
  onBackToCheckin: () => void;
  desktop?: boolean;
}

const MAX_CHARS = 2000;
const AUTOSAVE_SECONDS = 30;

export function DiaryEditor({ date, checkin, onSaved, existingDiary, onBackToCheckin, desktop = false }: DiaryEditorProps) {
  const [text, setText] = useState("");
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [committedText, setCommittedText] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [recoverDraft, setRecoverDraft] = useState(false);
  const [recordChangedElsewhere, setRecordChangedElsewhere] = useState(false);
  const overlay = useDesktopOverlay();
  const showOverlay = overlay?.show, clearOverlay = overlay?.clear;
  const leaveOwner = useRef(Symbol("未保存日记离页弹层"));
  const backOwner = useRef(Symbol("未保存日记返回弹层"));
  const latestDraftRef = useRef<{ date: string; text: string; committedText: string | null; savedText: string | null }>({ date, text: "", committedText: null, savedText: null });
  const draftSnapshot = useRef<string | null>(null);
  const recordChangedElsewhereRef = useRef(false);
  latestDraftRef.current.date = date;
  latestDraftRef.current.text = text;
  latestDraftRef.current.committedText = committedText;

  // 删除或改写本日正式记录后，旧编辑页不得借自动保存把敏感草稿复活。
  useEffect(() => {
    recordChangedElsewhereRef.current = false;
    setRecordChangedElsewhere(false);
    const original = JSON.stringify(getRecord(date) ?? null);
    const onStorage = (event: StorageEvent) => {
      if (event.key !== "qm_treehole_records" && event.key !== null) return;
      if (JSON.stringify(getRecord(date) ?? null) === original) return;
      recordChangedElsewhereRef.current = true;
      setRecordChangedElsewhere(true);
      setSaveError("这一天的记录已在另一标签变化，已停止自动保存；当前文字仍在本页，请先核对最新记录。");
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [date]);

  // 顶部导航和浏览器返回可能在30秒自动保存前离开；同步保留未提交正文。
  useEffect(() => {
    const saveBeforeLeave = () => {
      const current = latestDraftRef.current;
      if (!current.text.trim() || current.text === current.committedText || current.text === current.savedText) return true;
      if (recordChangedElsewhereRef.current || !saveDiaryDraft(current.date, current.text, draftSnapshot.current)) return false;
      draftSnapshot.current = getDiaryDraftRaw(current.date);
      current.savedText = current.text;
      return true;
    };
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!saveBeforeLeave()) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    const beforeLink = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const navigationControl = event.target instanceof Element ? event.target.closest("a[href], .qm-sidebar nav button") : null;
      if (!navigationControl || navigationControl.getAttribute("target") === "_blank") return;
      const current = latestDraftRef.current;
      if (desktop && showOverlay && clearOverlay && current.text.trim() && current.text !== current.committedText && current.text !== current.savedText) {
        event.preventDefault();
        event.stopPropagation();
        const owner = leaveOwner.current;
        showOverlay(owner, "06", <DesktopDialog kind="leave" onSecondary={async()=>clearOverlay(owner)} onPrimary={async()=>{
          if (!saveBeforeLeave()) throw new Error("草稿保存失败，仍留在当前页面");
          clearOverlay(owner);
          window.setTimeout(()=>{if(navigationControl.isConnected && navigationControl instanceof HTMLElement)navigationControl.click();},0);
        }} />);
        return;
      }
      if (!saveBeforeLeave()) {
        event.preventDefault();
        event.stopPropagation();
        setSaveError("当前正文尚未保存，无法安全离开。文字仍在当前页面，请重试保存。");
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    window.addEventListener("pagehide", saveBeforeLeave);
    document.addEventListener("click", beforeLink, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      window.removeEventListener("pagehide", saveBeforeLeave);
      document.removeEventListener("click", beforeLink, true);
      saveBeforeLeave();
    };
  }, [desktop, showOverlay, clearOverlay]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autosaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 初始化：加载草稿或已有日记
  useEffect(() => {
    setText("");
    setLastSaved(null);
    setCommittedText(null);
    setRecoverDraft(false);
    latestDraftRef.current.savedText = null;
    draftSnapshot.current = getDiaryDraftRaw(date);
    const draft = getDiaryDraft(date);
    const committed = typeof existingDiary?.text === "string" && !existingDiary.isDraft ? existingDiary.text : null;
    const draftTime = typeof draft?.savedAt === "string" ? Date.parse(draft.savedAt) : NaN;
    const committedTime = typeof existingDiary?.updatedAt === "string" ? Date.parse(existingDiary.updatedAt) : NaN;
    // 清除旧草稿失败时，不能让早于正式日记的旧文本覆盖已提交的新正文。
    const supersedesCommitted = !Number.isFinite(draftTime) || !Number.isFinite(committedTime) || draftTime > committedTime;
    const useDraft = draft !== null && typeof draft.text === "string" && Boolean(draft.text.trim()) && (desktop
      ? draft.text !== committed && (committed === null || supersedesCommitted)
      : !existingDiary?.text);
    if (useDraft) {
      setText(draft.text);
      setLastSaved(typeof draft.savedAt === "string" && Number.isFinite(Date.parse(draft.savedAt)) ? draft.savedAt : null);
      setRecoverDraft(desktop);
      latestDraftRef.current.savedText = draft.text;
    } else if (typeof existingDiary?.text === "string" && existingDiary.text.trim()) {
      setText(existingDiary.text);
      setRecoverDraft(desktop && Boolean(existingDiary.isDraft));
      latestDraftRef.current.savedText = existingDiary.text;
    }
    setCommittedText(committed);
  }, [date, existingDiary]);

  // 30秒自动保存草稿
  useEffect(() => {
    if (!text || text === committedText) return;

    autosaveTimerRef.current = setInterval(() => {
      if (text) {
        if (!recordChangedElsewhereRef.current && saveDiaryDraft(date, text, draftSnapshot.current)) {
          draftSnapshot.current = getDiaryDraftRaw(date);
          latestDraftRef.current.savedText = text;
          setLastSaved(new Date().toISOString());
          setSaveError("");
        } else {
          setSaveError("草稿自动保存失败，文字仍在当前页面。请勿关闭浏览器。");
        }
      }
    }, AUTOSAVE_SECONDS * 1000);

    return () => {
      if (autosaveTimerRef.current) {
        clearInterval(autosaveTimerRef.current);
      }
    };
  }, [text, date, committedText]);

  const charCount = text.length;
  const isOverLimit = charCount > MAX_CHARS;
  const remainingChars = MAX_CHARS - charCount;

  const updateText = (value: string) => {
    // 保留粘贴或输入法产生的完整原文；超过现有上限时阻止提交，不截掉末尾。
    setText(value);
    setLastSaved(null);
    setSaveError("");
  };
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => updateText(e.target.value);

  // 手动保存草稿
  const handleSaveDraft = useCallback(() => {
    if (!text.trim()) return false;
    if (recordChangedElsewhereRef.current) {
      setSaveError("这一天的记录已在另一标签变化，不能用旧页面保存草稿；当前文字仍在本页。");
      return false;
    }
    setIsSaving(true);
    const saved = saveDiaryDraft(date, text, draftSnapshot.current);
    if (saved) {
      draftSnapshot.current = getDiaryDraftRaw(date);
      latestDraftRef.current.savedText = text;
      setLastSaved(new Date().toISOString());
      setSaveError("");
    } else {
      setSaveError("草稿没有保存成功，文字仍在当前页面。请重试保存。");
    }
    setTimeout(() => setIsSaving(false), 500);
    return saved;
  }, [text, date]);

  // 只保存，不请求回信
  const handleSaveOnly = () => {
    if (!text.trim() || isOverLimit) return false;

    const diary: DiaryEntry = {
      date,
      text,
      charCount: text.length,
      createdAt: existingDiary?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDraft: false,
      letterRequested: false,
    };

    if (onSaved(diary, false)) {
      latestDraftRef.current.committedText = text;
      setLastSaved(null);
      setCommittedText(text);
      setSaveError("");
      return true;
    } else {
      setSaveError("日记没有保存成功，草稿和当前正文均保留。请重试。");
      return false;
    }
  };

  // 保存并请求回信
  const handleSaveAndLetter = () => {
    if (!text.trim() || isOverLimit) return false;

    const diary: DiaryEntry = {
      date,
      text,
      charCount: text.length,
      createdAt: existingDiary?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDraft: false,
      letterRequested: true,
    };

    if (onSaved(diary, true)) {
      latestDraftRef.current.committedText = text;
      setLastSaved(null);
      setCommittedText(text);
      setSaveError("");
      return true;
    } else {
      setSaveError("日记没有保存成功，草稿和当前正文均保留。请重试。");
      return false;
    }
  };

  const formatLastSaved = (iso: string) => {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };
  const handleBack = () => {
    const current = latestDraftRef.current;
    if (desktop && showOverlay && clearOverlay) {
      if (current.text.trim() && current.text !== current.committedText && current.text !== current.savedText) {
        const owner = backOwner.current;
        showOverlay(owner, "06", <DesktopDialog kind="leave" onSecondary={async()=>clearOverlay(owner)} onPrimary={async()=>{
          if (recordChangedElsewhereRef.current || !saveDiaryDraft(current.date, current.text, draftSnapshot.current)) throw new Error("草稿保存失败或另一标签已修改，仍留在当前页面");
          draftSnapshot.current = getDiaryDraftRaw(current.date);
          current.savedText = current.text;
          clearOverlay(owner);
          onBackToCheckin();
        }} />);
        return;
      }
      onBackToCheckin();
      return;
    }
    if (text.trim() && text !== committedText) {
      if (recordChangedElsewhereRef.current || !saveDiaryDraft(date, text, draftSnapshot.current)) {
        setSaveError("当前正文尚未保存，无法安全返回。文字仍在当前页面，请重试保存。");
        return;
      }
      draftSnapshot.current = getDiaryDraftRaw(date);
      latestDraftRef.current.savedText = text;
    }
    onBackToCheckin();
  };

  if (desktop) {
    return <DesktopDiary dateDisplay={formatDateChinese(date).split("日")[0] + "日"} dateKey={date} operationKey={date}
      text={text} count={charCount} limit={MAX_CHARS}
      saveStatus={recordChangedElsewhere ? "这一天的记录已在另一标签变化，自动保存已停止；当前文字仍在本页" : saveError || (isOverLimit ? "正文超出当前提交限制，原文仍完整保留" : lastSaved ? `草稿已保存 · ${formatLastSaved(lastSaved)}` : committedText === text ? "日记已保存到此设备" : "草稿尚未保存")}
      pending={isSaving} recoverDraft={recoverDraft} onRecoverContinue={()=>setRecoverDraft(false)}
      onRecoverLater={()=>{setRecoverDraft(false);onBackToCheckin();}} onChange={updateText} onBack={handleBack}
      onSave={async kind => {
        if (!text.trim()) throw new Error("请先写下日记内容");
        if (isOverLimit) throw new Error("字数超出当前提交限制，原文仍完整保留");
        const saved = kind === "draft" ? handleSaveDraft() : kind === "diary" ? handleSaveOnly() : handleSaveAndLetter();
        if (!saved) throw new Error("这次保存未成功，文字仍在当前页面");
      }} />;
  }

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm">
      {/* 返回 check-in */}
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-sm mb-6 transition-colors"
        style={{ color: "#A1A1AA" }}
        onMouseEnter={(e) => { e.currentTarget.style.color = "#6B4C9A"; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = "#A1A1AA"; }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        <span>返回情绪收集</span>
      </button>

      {/* 邀请语 */}
      <div className="mb-6">
        <p className="text-sm italic" style={{ color: "#71717A" }}>
          「接下来这里是你的。可以写发生了什么，也可以只写一句没头没尾的话。你不需要把它整理好。」
        </p>
        <p className="text-xs mt-2" style={{ color: "#A1A1AA" }}>
          当前编辑内容暂存在此设备浏览器；请求回信时，正文会发送给回信服务。
        </p>
      </div>

      {/* 编辑器 */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          placeholder="今天想说点什么..."
          className="w-full min-h-[300px] p-4 rounded-xl text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 transition-all"
          style={{
            background: "#FAF9F7",
            color: "#4A4A4A",
            border: "1px solid #F3F4F6",
            lineHeight: 1.8,
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "rgba(107, 76, 154, 0.3)";
            e.target.style.boxShadow = "0 0 0 3px rgba(107, 76, 154, 0.1)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#F3F4F6";
            e.target.style.boxShadow = "none";
          }}
        />

        {/* 字数统计 */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          {lastSaved && (
            <span className="text-xs" style={{ color: "#A78BFA" }}>
              草稿已保存 {formatLastSaved(lastSaved)}
            </span>
          )}
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{
              color: isOverLimit ? "#EF4444" : remainingChars < 100 ? "#F59E0B" : "#A1A1AA",
              background: isOverLimit ? "rgba(239,68,68,0.1)" : "rgba(0,0,0,0.03)",
            }}
          >
            {charCount} / {MAX_CHARS}
          </span>
        </div>
      </div>

      {saveError && <p role="alert" className="mt-3 text-sm text-red-700">{saveError}</p>}
      {isOverLimit && <p role="alert" className="mt-3 text-sm text-red-700">当前正文超过现有 2000 字上限，原文仍在页面中。请自行调整后再保存，不会自动截掉末尾。</p>}

      {/* 操作按钮 */}
      <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <button
          onClick={handleSaveDraft}
          disabled={!text.trim() || isSaving}
          className="px-5 py-2.5 rounded-full text-sm font-medium transition-all disabled:opacity-50"
          style={{
            background: "#F3F4F6",
            color: "#71717A",
          }}
        >
          {isSaving ? "保存中..." : "保存草稿"}
        </button>

        <div className="flex-1" />

        <button
          onClick={handleSaveOnly}
          disabled={!text.trim() || isOverLimit}
          className="px-5 py-2.5 rounded-full text-sm font-medium transition-all disabled:opacity-50 hover:scale-105"
          style={{
            background: "white",
            color: "#6B4C9A",
            border: "1px solid #6B4C9A",
          }}
        >
          只保存日记
        </button>

        <button
          onClick={handleSaveAndLetter}
          disabled={!text.trim() || isOverLimit}
          className="px-6 py-2.5 rounded-full text-sm font-medium text-white transition-all disabled:opacity-50 hover:scale-105"
          style={{
            background: "linear-gradient(135deg, #6B4C9A, #9F7AEA)",
            boxShadow: "0 2px 8px rgba(107,76,154,0.3)",
          }}
        >
          保存并请小酷回信
        </button>
      </div>

      {/* 提示 */}
      <div className="mt-6 p-4 rounded-xl" style={{ background: "#FAF9F7" }}>
        <p className="text-xs" style={{ color: "#A1A1AA", lineHeight: 1.8 }}>
          当前草稿写入这台设备的浏览器存储；请求回信时，日记会发送给回信服务。保存失败会保留本页文字。<br />
          小酷回信会根据日记长度生成：<br />
          · 不足500字：回信约500-750字<br />
          · 500-2000字：回信约1.0-1.5倍长度
        </p>
      </div>
    </div>
  );
}
