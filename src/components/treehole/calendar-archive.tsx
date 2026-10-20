"use client";

import { useState, useMemo, useEffect } from "react";

interface CalendarArchiveProps {
  recordDates: string[];
  selectedDate: string | null;
  onDateSelect: (date: string) => void;
}

type Ym = { year: number; month: number };

export function CalendarArchive({ recordDates, selectedDate, onDateSelect }: CalendarArchiveProps) {
  const [currentMonth, setCurrentMonth] = useState<Ym | null>(null);
  const [today, setToday] = useState("");

  useEffect(() => {
    let month: Ym;
    if (recordDates.length > 0) {
      const d = new Date(recordDates[0]);
      month = { year: d.getFullYear(), month: d.getMonth() };
    } else {
      const now = new Date();
      month = { year: now.getFullYear(), month: now.getMonth() };
    }
    setCurrentMonth(month);
    setToday(new Date().toISOString().split("T")[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];

  // 生成当前月的日历数据
  const calendarDays = useMemo(() => {
    if (!currentMonth) return [];
    const { year, month } = currentMonth;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startWeekday = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: { date: string; day: number; isCurrentMonth: boolean; hasRecord: boolean }[] = [];

    // 上个月的填充
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startWeekday - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({
        date: dateStr,
        day: d,
        isCurrentMonth: false,
        hasRecord: recordDates.includes(dateStr),
      });
    }

    // 当月
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({
        date: dateStr,
        day: d,
        isCurrentMonth: true,
        hasRecord: recordDates.includes(dateStr),
      });
    }

    // 下个月填充到 42 格（6 行）
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const nextMonth = month + 1;
      const nextYear = nextMonth > 11 ? year + 1 : year;
      const adjMonth = nextMonth > 11 ? 0 : nextMonth;
      const dateStr = `${nextYear}-${String(adjMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({
        date: dateStr,
        day: d,
        isCurrentMonth: false,
        hasRecord: recordDates.includes(dateStr),
      });
    }

    return days;
  }, [currentMonth, recordDates]);

  const goToPrevMonth = () => {
    setCurrentMonth((prev) => {
      if (!prev) return prev;
      let { year, month } = prev;
      month--;
      if (month < 0) {
        month = 11;
        year--;
      }
      return { year, month };
    });
  };

  const goToNextMonth = () => {
    setCurrentMonth((prev) => {
      if (!prev) return prev;
      let { year, month } = prev;
      month++;
      if (month > 11) {
        month = 0;
        year++;
      }
      return { year, month };
    });
  };

  const monthDisplay = currentMonth ? `${currentMonth.year}年${currentMonth.month + 1}月` : "";

  // 统计当月记录数
  const monthRecordCount = currentMonth
    ? recordDates.filter((d) => {
        const date = new Date(d);
        return date.getFullYear() === currentMonth.year && date.getMonth() === currentMonth.month;
      }).length
    : 0;

  if (!currentMonth) {
    return <div className="bg-white rounded-2xl p-5 shadow-sm"><div className="h-8" /></div>;
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      {/* 月份导航 */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPrevMonth}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-gray-100"
          style={{ color: "#71717A" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold" style={{ color: "#4A4A4A" }}>
            {monthDisplay}
          </p>
          <p className="text-xs" style={{ color: "#A1A1AA" }}>
            {monthRecordCount} 天记录
          </p>
        </div>
        <button
          onClick={goToNextMonth}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-gray-100"
          style={{ color: "#71717A" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      </div>

      {/* 星期表头 */}
      <div className="grid grid-cols-7 mb-2">
        {weekdays.map((w) => (
          <div
            key={w}
            className="text-center text-xs py-2"
            style={{ color: "#A1A1AA" }}
          >
            {w}
          </div>
        ))}
      </div>

      {/* 日期格子 */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, idx) => {
          const isSelected = selectedDate === day.date;
          const isToday = day.date === today;

          return (
            <button
              key={idx}
              onClick={() => day.hasRecord && onDateSelect(day.date)}
              disabled={!day.hasRecord && !day.isCurrentMonth}
              className="relative aspect-square flex flex-col items-center justify-center rounded-lg text-xs transition-all"
              style={{
                color: day.isCurrentMonth
                  ? isSelected
                    ? "white"
                    : "#4A4A4A"
                  : "#D1D5DB",
                backgroundColor: isSelected ? "#6B4C9A" : "transparent",
                cursor: day.hasRecord ? "pointer" : "default",
                opacity: day.isCurrentMonth ? 1 : 0.4,
              }}
              onMouseEnter={(e) => {
                if (day.hasRecord && !isSelected) {
                  e.currentTarget.style.backgroundColor = "rgba(107, 76, 154, 0.1)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
            >
              <span className={isToday && !isSelected ? "font-semibold" : ""}>
                {day.day}
              </span>
              {/* 记录小点 */}
              {day.hasRecord && (
                <span
                  className="absolute bottom-1 w-1.5 h-1.5 rounded-full"
                  style={{
                    backgroundColor: isSelected ? "white" : "#A78BFA",
                  }}
                />
              )}
              {/* 今日标记 */}
              {isToday && !isSelected && (
                <span
                  className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: "#6B4C9A" }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* 图例 */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs" style={{ color: "#A1A1AA" }}>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#A78BFA" }} />
          <span>有记录</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#6B4C9A" }} />
          <span>今天</span>
        </div>
      </div>
    </div>
  );
}
