"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CalendarArchive } from "@/components/treehole/calendar-archive";
import {
  getAllRecords,
  getRecordDates,
  getRecord,
  getTodayString,
  formatDateChinese,
  isStorageAvailable,
  isRecordStoreReadable,
} from "@/lib/treehole/th-storage";
import { TreeholeNav } from "@/components/treehole/treehole-nav";
import { DesktopArchive, DesktopFrame, type ArchiveSummary } from "@/components/treehole/desktop-panels";
import type { DailyRecord } from "@/lib/treehole/th-types";

function validRecordDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const year = Number(value.slice(0, 4));
  if (year < 100 || year > 9999) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

export default function ArchivePage() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<DailyRecord | null>(null);
  const [recordDates, setRecordDates] = useState<string[]>([]);
  const [invalidDateCount, setInvalidDateCount] = useState(0);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [recordStoreReadable, setRecordStoreReadable] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [desktop, setDesktop] = useState<boolean | null>(null);
  const [calendarCursor, setCalendarCursor] = useState(() => {
    const date = getTodayString();
    return { year: Number(date.slice(0, 4)), month: Number(date.slice(5, 7)) };
  });
  const [openDate, setOpenDate] = useState<string | null>(null);

  useEffect(() => setDesktop(window.matchMedia("(min-width: 701px)").matches), []);

  useEffect(() => {
    setStorageAvailable(isStorageAvailable());
    const readable = isRecordStoreReadable();
    setRecordStoreReadable(readable);
    if (!readable) { setIsLoading(false); return; }
    const allDates = getRecordDates();
    const dates = allDates.filter(validRecordDate);
    setInvalidDateCount(allDates.length - dates.length);
    setRecordDates(dates);

    // 默认选中最新一条
    if (dates.length > 0) {
      setSelectedDate(dates[0]);
      const rec = getRecord(dates[0]);
      if (rec) setSelectedRecord(rec);
      setCalendarCursor({ year: Number(dates[0].slice(0, 4)), month: Number(dates[0].slice(5, 7)) });
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    const refresh = (event: StorageEvent) => {
      if (event.key !== "qm_treehole_records" && event.key !== null) return;
      const readable = isRecordStoreReadable();
      setRecordStoreReadable(readable);
      if (!readable) {
        setRecordDates([]); setSelectedRecord(null); setSelectedDate(null); setOpenDate(null);
        return;
      }
      const allDates = getRecordDates();
      const dates = allDates.filter(validRecordDate);
      setInvalidDateCount(allDates.length - dates.length);
      setRecordDates(dates);
      if (selectedDate) {
        const current = getRecord(selectedDate) || null;
        setSelectedRecord(current);
        if (!current) {
          setSelectedDate(null);
          setOpenDate(null);
        }
      }
    };
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, [selectedDate]);

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    const rec = getRecord(date);
    setSelectedRecord(rec || null);
    setOpenDate(null);
  };

  if (isLoading || desktop === null) {
    return (
      <div className="min-h-screen pb-12 px-4 flex items-center justify-center" style={{ background: "#FAF5F2" }}>
        <div className="text-center" style={{ color: "#71717A" }}>
          <div className="text-4xl mb-4">📅</div>
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  if (!recordStoreReadable) return <div role="alert" className="mx-auto max-w-xl p-8">历史记录暂时无法读取，原始数据仍保留；不会把损坏数据当空归档覆盖。请勿清除浏览器数据。</div>;

  if (desktop) {
    const summaries: ArchiveSummary[] = recordDates.flatMap(date => {
      const item = getRecord(date);
      if (!item) return [];
      return [{ date, dateLabel: formatDateChinese(date), title: "当天的记录",
        excerpt: item.diary?.text || item.letter?.text || "当日情绪收集已完成",
        hasDiary: Boolean(item.diary), hasLetter: Boolean(item.letter) }];
    });
    return <div className="qm-treehole-desktop-wrapper"><DesktopFrame
      dateLabel={formatDateChinese(getTodayString()).replace("日 ", "日 · ")}
      operationKey={selectedDate || "archive-empty"} tab="archive" visualState={selectedRecord ? "11" : "12"}
      storageNotice="当前版本记录保存在本机浏览器，尚未提供账号云端备份。"
      sharedShell={<TreeholeNav title="历史归档" />}>
      {!storageAvailable && <p role="alert">此设备的浏览器存储不可用，暂时无法读取历史记录。</p>}
      {invalidDateCount > 0 && <p role="alert">有 {invalidDateCount} 条日期格式异常的本地记录未显示在日历中，原始数据仍保留；请勿将其视为已删除。</p>}
      <DesktopArchive year={calendarCursor.year} month={calendarCursor.month}
        selectedDate={selectedDate || ""} records={summaries}
        onMonth={delta => {
          const next = new Date(Date.UTC(calendarCursor.year, calendarCursor.month - 1 + delta, 1));
          if (next.getUTCFullYear() < 100 || next.getUTCFullYear() > 9999) return;
          setCalendarCursor({ year: next.getUTCFullYear(), month: next.getUTCMonth() + 1 });
          setSelectedDate(null);
          setSelectedRecord(null);
          setOpenDate(null);
        }}
        onSelect={handleDateSelect}
        onOpen={date => {
          if (!getRecord(date)) return;
          setOpenDate(date);
          requestAnimationFrame(() => document.getElementById("treehole-archive-detail")?.scrollIntoView({ block: "start", behavior: "smooth" }));
        }} />
      {openDate && openDate === selectedDate && selectedRecord && <section id="treehole-archive-detail" className="paper" aria-label={`${openDate} 的完整记录`}>
        <div className="meta"><h2>{formatDateChinese(openDate)}</h2><button type="button" onClick={() => setOpenDate(null)}>收起详情</button></div>
        {selectedRecord.checkin && <div className="mt-5"><h3>当日情绪收集</h3>{selectedRecord.checkin.answers.map((answer, index) => <p key={`${answer.questionId}-${index}`}>{answer.question}：{answer.skipped ? "已跳过" : answer.answer}</p>)}</div>}
        {selectedRecord.diary && <div className="mt-5"><h3>完整日记</h3><p className="whitespace-pre-wrap break-words">{selectedRecord.diary.text}</p></div>}
        {selectedRecord.letter && <div className="mt-5"><h3>小酷回信</h3><p className="whitespace-pre-wrap break-words">{selectedRecord.letter.text}</p>{selectedRecord.letter.isCrisis && <p>这是一封危机安全回应</p>}</div>}
      </section>}
    </DesktopFrame></div>;
  }

  return (
    <div className="min-h-screen pb-12 px-4 sm:px-6" style={{ background: "#FAF5F2" }}>
        <TreeholeNav title="历史归档" />
      <div className="max-w-3xl mx-auto">
        {/* 返回 */}
        <div className="mb-6">
          <Link
            href="/treehole"
            className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-full transition-colors hover:bg-white/60"
            style={{ color: "#6B4C9A" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            <span>回到树洞</span>
          </Link>
          <Link
            href="/treehole/trends"
            className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-full transition-colors hover:bg-white/60"
            style={{ color: "#6B4C9A" }}
          >
            <span>📈 趋势观察</span>
          </Link>
        </div>

        {/* 标题 */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">📅</div>
          <h1 className="text-2xl font-semibold mb-2" style={{ color: "#4A4A4A" }}>
            历史归档
          </h1>
          <p className="text-sm" style={{ color: "#71717A" }}>
            按日期查看过去的记录
          </p>
          <p className="text-xs mt-2" style={{ color: "#A1A1AA" }}>
            共 {recordDates.length} 天记录
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 日历 */}
          <div className="lg:col-span-1">
            <CalendarArchive
              recordDates={recordDates}
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
            />
          </div>

          {/* 详情 */}
          <div className="lg:col-span-2">
            {!selectedDate || !selectedRecord ? (
              <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                <div className="text-4xl mb-4 opacity-50">📝</div>
                <p style={{ color: "#71717A" }}>
                  {recordDates.length === 0
                    ? "还没有记录，去写第一篇日记吧"
                    : "选择一个日期查看详情"}
                </p>
                {recordDates.length === 0 && (
                  <Link
                    href="/treehole"
                    className="inline-block mt-4 px-6 py-2.5 rounded-full text-sm font-medium text-white transition-all hover:scale-105"
                    style={{ background: "linear-gradient(135deg, #6B4C9A, #9F7AEA)" }}
                  >
                    开始记录
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h2 className="text-lg font-semibold mb-1" style={{ color: "#4A4A4A" }}>
                    {formatDateChinese(selectedDate)}
                  </h2>
                  {selectedRecord.dailySentence && (
                    <p className="text-sm italic" style={{ color: "#6B4C9A" }}>
                      「{selectedRecord.dailySentence}」
                    </p>
                  )}
                </div>

                {/* Check-in */}
                {selectedRecord.checkin && (
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: "#6B4C9A" }}>
                      <span>📊</span>
                      <span>当日情绪收集</span>
                    </h3>
                    <div className="space-y-3">
                      {selectedRecord.checkin.answers.map((ans, idx) => (
                        <div key={idx} className="py-2 border-b border-gray-100 last:border-0">
                          <p className="text-sm font-medium" style={{ color: "#4A4A4A" }}>
                            {ans.question}
                          </p>
                          <p
                            className="text-sm mt-1"
                            style={{ color: ans.skipped ? "#A1A1AA" : "#71717A" }}
                          >
                            {ans.skipped ? "已跳过" : ans.answer}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 日记 */}
                {selectedRecord.diary && (
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: "#6B4C9A" }}>
                      <span>📝</span>
                      <span>日记</span>
                      <span className="text-xs font-normal ml-auto" style={{ color: "#A1A1AA" }}>
                        {selectedRecord.diary.charCount} 字
                      </span>
                    </h3>
                    <div
                      className="text-sm whitespace-pre-wrap leading-relaxed"
                      style={{ color: "#4A4A4A" }}
                    >
                      {selectedRecord.diary.text}
                    </div>
                    {selectedRecord.diary.isDraft && (
                      <p className="text-xs mt-4 px-3 py-1.5 rounded-full inline-block" style={{ background: "#FEF3C7", color: "#92400E" }}>
                        草稿状态
                      </p>
                    )}
                  </div>
                )}

                {/* 回信 */}
                {selectedRecord.letter && (
                  <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: "#6B4C9A" }}>
                      <span>💌</span>
                      <span>小酷回信</span>
                    </h3>
                    <div
                      className="text-sm whitespace-pre-wrap leading-relaxed"
                      style={{ color: "#4A4A4A" }}
                    >
                      {selectedRecord.letter.text}
                    </div>
                    {selectedRecord.letter.isCrisis && (
                      <div className="mt-4 p-3 rounded-lg" style={{ background: "#FEE2E2", color: "#991B1B" }}>
                        <p className="text-xs">⚠️ 这是一封危机安全回应</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 隐私说明 */}
        <div className="mt-12 text-center text-xs" style={{ color: "#A1A1AA", lineHeight: 1.8 }}>
          <p>当前历史记录来自此设备的浏览器存储。本页尚无删除入口；账号、跨设备保存和完整删除范围仍待真实服务接通后核验。</p>
        </div>
      </div>
    </div>
  );
}
