"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckInCard } from "@/components/treehole/check-in-card";
import { DiaryEditor } from "@/components/treehole/diary-editor";
import { LetterView } from "@/components/treehole/letter-view";
import {
  getTodayString,
  getRecord,
  getRecordDates,
  saveRecord,
  getAllExposures,
  getSettings,
  formatDateChinese,
  isStorageAvailable,
  isRecordStoreReadable,
  clearDiaryDraft,
} from "@/lib/treehole/th-storage";
import { selectDailyQuestions, isReviewPeriod } from "@/lib/treehole/th-daily-selector";
import { getYesterdayUnresolved, recallMemories, extractDailyMemories, saveMemories } from "@/lib/treehole/th-memory";
import { generateContextCapsule, build7dTrendPoints, saveContextCapsule } from "@/lib/treehole/th-capsule";
import { detectCrisis, getCrisisResponse } from "@/lib/treehole/th-safety";
import { consumePendingContext, goChatWithContext, peekPendingContext, savePendingContext } from "@/lib/context/pending-context";
import { TreeholeNav } from "@/components/treehole/treehole-nav";
import { DesktopFrame, DesktopSteps } from "@/components/treehole/desktop-panels";
import { DesktopLetterReadOnly } from "@/components/treehole/desktop-letter-readonly";
import type { DailyRecord, DailyCheckin, QuestionAnswer, DiaryEntry, XiaokuLetter } from "@/lib/treehole/th-types";

type Stage = "checkin" | "diary" | "letter" | "view";

export default function TreeholePage() {
  const [stage, setStage] = useState<Stage>("checkin");
  const [today, setToday] = useState("");
  const [record, setRecord] = useState<DailyRecord | null>(null);
  const [saveError, setSaveError] = useState("");
  const [letterSaveFailed, setLetterSaveFailed] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [recordStoreReadable, setRecordStoreReadable] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [desktop, setDesktop] = useState<boolean | null>(null);
  useEffect(() => {
    // 手机施工仍暂停；只在首次进入时选择桌面呈现，避免编辑中切换布局丢失未保存正文。
    setDesktop(window.matchMedia("(min-width: 701px)").matches);
  }, []);
  // E2c-4: archive/trends entries disabled when no data
  const [hasAnyRecord, setHasAnyRecord] = useState(false);
  useEffect(() => {
    const refresh = () => setHasAnyRecord(getRecordDates().length > 0);
    refresh();
    const onStorage = (event: StorageEvent) => {
      if (event.key === "qm_treehole_records" || event.key === null) refresh();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== "qm_treehole_records" && event.key !== null) return;
      const readable = isRecordStoreReadable();
      setRecordStoreReadable(readable);
      if (!readable) setRecord(null);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // 另一标签页删除/改写同日记录后，当前只读回信不得继续展示旧内容；
  // 生成中的请求也不能在记录被删除后迟到并重新写回。
  useEffect(() => {
    if (!today || (stage !== "view" && stage !== "letter")) return;
    const onStorage = (event: StorageEvent) => {
      if (event.key !== "qm_treehole_records" && event.key !== null) return;
      const current = getRecord(today);
      if (JSON.stringify(current) === JSON.stringify(record)) return;
      const diaryChanged = current?.diary?.updatedAt !== record?.diary?.updatedAt || current?.diary?.text !== record?.diary?.text;
      setRecord(current || null);
      if (current?.letter && !diaryChanged) {
        if (stage === "letter") setStage("view");
      } else {
        setStage(current?.checkin ? "diary" : "checkin");
        setSaveError("这一天的记录已在另一标签页变化，旧回信已关闭；请核对当前记录。");
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [today, stage, record]);

  // 另一标签已完成情绪收集时，旧答题页不能继续显示“尚未完成”并尝试覆盖正式记录。
  useEffect(() => {
    if (!today || stage !== "checkin") return;
    const onStorage = (event: StorageEvent) => {
      if (event.key !== "qm_treehole_records" && event.key !== null) return;
      const current = getRecord(today);
      if (!current?.checkin?.completed) return;
      setRecord(current);
      setSaveError("这一天的情绪收集已在另一标签保存，已切换到最新记录。");
      setStage("diary");
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [today, stage]);

  // 初始化
  useEffect(() => {
    const todayStr = getTodayString();
    setToday(todayStr);
    setStorageAvailable(isStorageAvailable());
    setRecordStoreReadable(isRecordStoreReadable());

    // 读取今日已有记录
    const existing = getRecord(todayStr);
    if (existing) {
      setRecord(existing);
      // 判断当前阶段
      if (existing.letter) {
        setStage("view");
      } else if (existing.diary && !existing.diary.isDraft) {
        // 单纯存在已保存日记并不代表用户请求过回信；刷新后不能代用户发起模型请求。
        setStage("diary");
      } else if (existing.checkin?.completed) {
        setStage("diary");
      } else {
        setStage("checkin");
      }
    }
    setIsLoading(false);
  }, []);

  // 完成 check-in
  const handleCheckinComplete = (checkin: DailyCheckin, exposureSaved = true) => {
    const currentRecord = getRecord(today);
    // 旧标签的问答不能覆盖另一标签已完成的收集、日记或回信。
    if (JSON.stringify(currentRecord ?? null) !== JSON.stringify(record)) {
      setSaveError("这一天的记录已在另一标签页变化，本页的回答没有覆盖最新记录。请先核对后重新进入。");
      return false;
    }
    const updated: DailyRecord = { ...currentRecord, checkin, date: today };
    if (!saveRecord(updated)) {
      return false;
    }
    setSaveError("");
    setRecord(updated);
    setHasAnyRecord(true);

    // 从 check-in 提取记忆
    const answers = checkin.answers.filter((a) => !a.skipped);
    const memories = extractDailyMemories(today, answers, "");
    const memorySaved = memories.length === 0 || saveMemories(memories);

    // 生成 Context Capsule（初始版，只有 check-in）
    const trendPoints = build7dTrendPoints(today);
    const capsule = generateContextCapsule(updated, trendPoints);
    const capsuleSaved = saveContextCapsule(capsule);
    if (!memorySaved || !capsuleSaved || !exposureSaved)
      setSaveError("情绪收集已保存在此设备，但关联资料没有全部保存成功。请勿将其视为已完整同步。");

    setStage("diary");
    return true;
  };

  // 完成日记保存
  const handleDiarySaved = (diary: DiaryEntry, requestLetter: boolean) => {
    const currentRecord = getRecord(today);
    // 另一标签页可能已删除或改写这一天；保留当前编辑文字，但不能用旧页面状态复活旧记录。
    if (!currentRecord || JSON.stringify(currentRecord) !== JSON.stringify(record)) {
      setSaveError("这一天的记录已在另一标签页变化，当前正文仍在本页。请先核对最新记录，再决定是否重新保存。");
      return false;
    }
    // P0 顺序安全：请求回信时，在写 localStorage 之前无条件对【新文本】做危机检测。
    // 覆盖同日记重入 / 修改重写再提交等路径，严禁因已有旧回信跳过检测；
    // 命中即构造危机信短路，危机内容绝不作为「普通日记 + 旧温情回信」静默存档。
    let crisisLetter: XiaokuLetter | null = null;
    if (requestLetter) {
      const crisis = detectCrisis(diary.text);
      if (crisis.isCrisis) {
        const level = crisis.level === "indirect" ? "indirect" : "direct";
        const text = getCrisisResponse(level);
        crisisLetter = {
          date: today,
          text,
          charCount: text.length,
          dailySentence: "请记得：你不是一个人。24 小时都有人愿意接住你——15001930070。",
          createdAt: new Date().toISOString(),
          isCrisis: true,
          crisisLevel: level,
        };
      }
    }

    // 正文被改写后旧回信不再对应新日记；无论是否再次请求回信都不能继续展示旧信。
    const updated: DailyRecord = {
      ...currentRecord,
      diary,
      date: today,
      letter: crisisLetter ?? undefined,
      dailySentence: crisisLetter?.dailySentence,
    };
    if (!saveRecord(updated)) {
      return false;
    }
    const draftCleared = clearDiaryDraft(today);
    setSaveError(draftCleared ? "" : "日记已保存，但旧草稿未能从此设备清除。请勿将删除操作视为完成。");
    setRecord(updated);
    setHasAnyRecord(true);

    // 更新 Context Capsule
    const trendPoints = build7dTrendPoints(today);
    const capsule = generateContextCapsule(updated, trendPoints);
    if (!saveContextCapsule(capsule))
      setSaveError((draftCleared ? "" : "旧草稿未清除；") + "日记已保存在此设备，但关联资料没有保存成功。请勿将其视为已完整同步。");

    if (requestLetter) {
      setLetterSaveFailed(false);
      setStage(crisisLetter ? "view" : "letter");
    } else {
      setStage("diary");
    }
    return true;
  };

  // 完成回信生成
  const handleLetterGenerated = (letter: XiaokuLetter) => {
    const currentRecord = getRecord(today);
    // 回信使用日记和情绪收集共同生成；任一输入、已有回信或记录身份变化都不能接纳旧请求。
    if (!currentRecord?.diary || JSON.stringify(currentRecord) !== JSON.stringify(record)) {
      setSaveError("生成期间这一天的记录已变化，旧回信没有保存。请核对最新记录后重新请求。");
      setRecord(currentRecord || null);
      setStage(currentRecord?.checkin ? "diary" : "checkin");
      return false;
    }
    const updated: DailyRecord = {
      ...currentRecord,
      letter,
      dailySentence: letter.dailySentence,
      date: today,
    };
    if (!saveRecord(updated)) {
      return false;
    }
    setSaveError("");
    setRecord(updated);
    setHasAnyRecord(true);

    // 更新 Context Capsule
    const trendPoints = build7dTrendPoints(today);
    const capsule = generateContextCapsule(updated, trendPoints);
    if (!saveContextCapsule(capsule))
      setSaveError("回信已保存在此设备，但关联资料没有保存成功。请勿将其视为已完整同步。");

    return true;
  };

  // 回到日记（重写）
  const handleBackToDiary = () => {
    setStage("diary");
  };

  // 仅带流程摘要去找小酷；日记正文可能含私密信息，不能在跨模块桥自动转发。
  const handleTalkXiaoku = () => {
    const answeredCount = record?.checkin?.answers?.length ?? 0;
    const context = {
      source: "treehole",
      summary:
        `我刚刚在情绪树洞完成了今天的记录，回答了 ${answeredCount} 个关心问题，也收到了一封回信。` +
        `我想和小酷把这些感受再聊一聊；如有需要，我会自行补充愿意分享的内容。请陪伴、梳理，不要替我下判断。` +
        `树洞回信是机器生成的贴心陪伴，不替代专业心理支持。`,
      createdAt: new Date().toISOString(),
    } as const;
    // 如果新摘要写入失败，不能让聊天读取另一个入口遗留的私人上下文。
    consumePendingContext();
    savePendingContext(context);
    const saved = peekPendingContext();
    if (saved?.source !== context.source || saved.summary !== context.summary || saved.createdAt !== context.createdAt) {
      setSaveError("未能安全带入树洞摘要。请检查浏览器存储后重试；日记和回信仍在此设备。");
      return;
    }
    goChatWithContext(context);
  };

  // 回到 check-in（重新做）
  const handleBackToCheckin = () => {
    setStage("checkin");
  };

  if (isLoading || desktop === null) {
    return (
      <div className="min-h-screen pb-12 px-4 flex items-center justify-center" style={{ background: "#FAF5F2" }}>
        <div className="text-center" style={{ color: "#71717A" }}>
          <div className="text-4xl mb-4">🌳</div>
          <p>正在打开树洞...</p>
        </div>
      </div>
    );
  }

  if (!storageAvailable) {
    return (
      <div className="min-h-screen pb-12 px-4 flex items-center justify-center" style={{ background: "#FAF5F2" }}>
        <div className="max-w-md text-center bg-white rounded-2xl p-8 shadow-sm">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-3" style={{ color: "#4A4A4A" }}>
            存储不可用
          </h2>
          <p className="text-sm mb-6" style={{ color: "#71717A", lineHeight: 1.8 }}>
            情绪树洞需要存储你的记录。<br />
            当前浏览器处于隐私模式或存储不可用。<br />
            请切换到普通模式后再使用。
          </p>
          <p className="text-xs" style={{ color: "#A1A1AA" }}>
            此页面当前使用浏览器本地存储；存储不可用时不会把记录标为已保存。
          </p>
        </div>
      </div>
    );
  }

  if (!recordStoreReadable) {
    return <div className="min-h-screen px-4 py-20" style={{ background: "#FAF5F2" }}>
      <section role="alert" className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm">
        <h2 className="text-xl font-semibold">记录暂时无法读取</h2>
        <p className="mt-4">这台设备里的树洞记录格式异常，原始数据仍保留。当前页面不会把它当作空记录重新保存；请勿清除浏览器数据。</p>
      </section>
    </div>;
  }

  const dateDisplay = formatDateChinese(today);

  if (desktop && stage === "diary" && record?.checkin) {
    return <div className="qm-treehole-desktop-wrapper"><DesktopFrame dateLabel={dateDisplay.replace("日 ", "日 · ")} operationKey={today} tab="today" visualState="01"
      storageNotice="当前版本记录保存在本机浏览器，尚未提供账号云端备份。"
      sharedShell={<TreeholeNav title="情绪树洞" />}>
      <DesktopSteps stage="diary" />
      {saveError && <p role="alert" className="mb-4 rounded-lg bg-amber-50 p-4 text-sm text-amber-900">{saveError}</p>}
      <DiaryEditor desktop date={today} checkin={record.checkin} onSaved={handleDiarySaved}
        existingDiary={record.diary} onBackToCheckin={handleBackToCheckin} />
    </DesktopFrame></div>;
  }

  if (desktop && stage === "letter" && record?.diary) {
    return <div className="qm-treehole-desktop-wrapper"><DesktopFrame dateLabel={dateDisplay.replace("日 ", "日 · ")} operationKey={today} tab="today" visualState="02"
      storageNotice="当前版本记录保存在本机浏览器，尚未提供账号云端备份。"
      sharedShell={<TreeholeNav title="情绪树洞" />}>
      <DesktopSteps stage="letter" />
      {!letterSaveFailed && <section className="paper" aria-label="已保存的日记与回信状态" aria-busy="true">
        <div className="meta"><span>← 返回情绪收集</span><span>{dateDisplay}</span></div>
        <p className="prompt">接下来这里是你的。可以写发生了什么，也可以只写一句没头没尾的话。你不需要把它整理好。</p>
        <div className="scroll-wrap"><textarea className="writing filled long-content" aria-label="已保存的日记正文" value={record.diary.text} readOnly /></div>
        <div className="meta save-line"><span>日记已保存，正在等待完整回信</span><span>{record.diary.text.length} / 2000</span></div>
        <div className="actions"><button type="button" className="action" disabled>保存草稿</button><div><button type="button" className="action" disabled>只保存日记</button><button type="button" className="action primary" disabled>保存并请小酷回信</button></div></div>
      </section>}
      <LetterView desktop date={today} diary={record.diary} checkin={record.checkin}
        onLetterGenerated={handleLetterGenerated} onLetterRevealed={() => setStage("view")}
        onSaveFailedChange={setLetterSaveFailed}
        existingLetter={undefined} onBackToDiary={handleBackToDiary} isGenerating={true} />
    </DesktopFrame></div>;
  }

  if (desktop && stage === "view" && record?.letter && record.diary && record.letter.isCrisis === false) {
    return <div className="qm-treehole-desktop-wrapper"><DesktopFrame dateLabel={dateDisplay.replace("日 ", "日 · ")} operationKey={today} tab="today" visualState="03"
      storageNotice="当前版本记录保存在本机浏览器，尚未提供账号云端备份。"
      sharedShell={<TreeholeNav title="情绪树洞" />}>
      <DesktopSteps stage={typeof record.letter.text === "string" && record.letter.text.trim() ? "letter" : "diary"} />
      {saveError && <p role="alert" className="mb-4 rounded-lg bg-amber-50 p-4 text-sm text-amber-900">{saveError}</p>}
      <DesktopLetterReadOnly dateDisplay={formatDateChinese(today).split("日")[0] + "日"}
        text={record.letter.text} onBack={handleBackToDiary} onChat={handleTalkXiaoku} />
    </DesktopFrame></div>;
  }

  return (
    <div className="min-h-screen pb-12 px-4 sm:px-6" style={{ background: "#FAF5F2" }}>
        <TreeholeNav title="情绪树洞" />
      <div className="max-w-2xl mx-auto">
        {saveError && <p role="alert" className="mb-4 rounded-lg bg-amber-50 p-4 text-sm text-amber-900">{saveError}</p>}
        

        {/* 标题区 */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🌳</div>
          <h2 className="text-2xl font-semibold mb-2" style={{ color: "#4A4A4A" }}>
            情绪树洞
          </h2>
          <p className="text-sm" style={{ color: "#71717A" }}>
            {dateDisplay}
          </p>
          <p className="text-xs mt-2" style={{ color: "#A78BFA" }}>
            生活没有标准答案
          </p>
          <div className="flex items-center justify-center gap-3 mt-4">
            {hasAnyRecord ? (
              <Link href="/treehole/archive" className="text-xs px-3 py-1.5 rounded-full hover:bg-white/60 transition-colors" style={{ color: "#6B4C9A" }}>📅 历史归档</Link>
            ) : (
              <span title="暂无历史数据，先记录今天的心情吧" aria-disabled="true" className="text-xs px-3 py-1.5 rounded-full opacity-50 cursor-not-allowed" style={{ color: "#6B4C9A" }}>📅 历史归档</span>
            )}
            {hasAnyRecord ? (
              <Link href="/treehole/trends" className="text-xs px-3 py-1.5 rounded-full hover:bg-white/60 transition-colors" style={{ color: "#6B4C9A" }}>📈 趋势观察</Link>
            ) : (
              <span title="暂无趋势数据，先记录今天的心情吧" aria-disabled="true" className="text-xs px-3 py-1.5 rounded-full opacity-50 cursor-not-allowed" style={{ color: "#6B4C9A" }}>📈 趋势观察</span>
            )}
          </div>
        </div>

        {/* 阶段指示器 */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <StageDot active={stage === "checkin" || stage === "diary" || stage === "letter" || stage === "view"} done={(stage as string) !== "checkin"} label="check-in" />
          <StageLine done={(stage as string) !== "checkin" && (stage as string) !== "diary" ? true : stage === "diary" || stage === "letter" || stage === "view" ? false : false} />
          <StageDot active={stage === "diary" || stage === "letter" || stage === "view"} done={stage === "letter" || stage === "view"} label="日记" />
          <StageLine done={stage === "letter" || stage === "view"} />
          <StageDot active={stage === "letter" || stage === "view"} done={stage === "view"} label="回信" />
        </div>

        {/* 主内容区 */}
        {stage === "checkin" && (
          <CheckInCard
            date={today}
            onComplete={handleCheckinComplete}
            existingCheckin={record?.checkin}
          />
        )}

        {stage === "diary" && record?.checkin && (
          <DiaryEditor
            date={today}
            checkin={record.checkin}
            onSaved={handleDiarySaved}
            existingDiary={record.diary}
            onBackToCheckin={handleBackToCheckin}
          />
        )}

        {stage === "letter" && record?.diary && (
          <LetterView
            date={today}
            diary={record.diary}
            checkin={record.checkin}
            onLetterGenerated={handleLetterGenerated}
            onLetterRevealed={() => setStage("view")}
            existingLetter={undefined}
            onBackToDiary={handleBackToDiary}
            isGenerating={true}
          />
        )}

        {stage === "view" && record?.letter && record.diary && (
          <div>
            <LetterView
              date={today}
              diary={record.diary}
              checkin={record.checkin}
              onLetterGenerated={handleLetterGenerated}
              onLetterRevealed={() => setStage("view")}
              existingLetter={record.letter}
              onBackToDiary={handleBackToDiary}
              isGenerating={false}
            />
            <div className="mt-6 text-center space-y-3">
              <button
                type="button"
                onClick={handleTalkXiaoku}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-sm font-medium transition-all"
                style={{ background: "#6B4C9A", minHeight: "44px" }}
              >
                💬 和小酷继续聊聊
              </button>
              <p className="text-xs" style={{ color: "#A1A1AA" }}>
                今天的记录已经保存到这台设备上
              </p>
            </div>
          </div>
        )}

        {/* 底部说明 */}
        <div className="mt-12 text-center text-xs" style={{ color: "#A1A1AA", lineHeight: 1.8 }}>
          <p>当前记录写入这台设备的浏览器存储；请求小酷回信时，日记内容会发送给回信服务。账号同步与跨设备保存尚未在此页面核实。</p>
          <p>当前浏览器记录的删除范围仅限这台设备；账号与服务端删除能力仍待权威接线核验。</p>
        </div>
      </div>
    </div>
  );
}

function StageDot({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="w-3 h-3 rounded-full transition-all"
        style={{
          backgroundColor: done ? "#6B4C9A" : active ? "#A78BFA" : "#E5E7EB",
          transform: active ? "scale(1.2)" : "scale(1)",
        }}
      />
      <span
        className="text-xs"
        style={{
          color: active || done ? "#6B4C9A" : "#A1A1AA",
        }}
      >
        {label}
      </span>
    </div>
  );
}

function StageLine({ done }: { done: boolean }) {
  return (
    <div
      className="w-12 h-0.5 rounded-full"
      style={{ backgroundColor: done ? "#6B4C9A" : "#E5E7EB" }}
    />
  );
}
