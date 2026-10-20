"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import type { DailyCheckin, DailyQuestion, QuestionAnswer, DimensionCode } from "@/lib/treehole/th-types";
import {
  selectDailyQuestions,
  getSeason,
  getTimeSegment,
  isReviewPeriod,
} from "@/lib/treehole/th-daily-selector";
import {
  getAllExposures,
  recordExposures,
  getSettings,
} from "@/lib/treehole/th-storage";
import { getYesterdayUnresolved } from "@/lib/treehole/th-memory";
import { DIMENSION_NAMES } from "@/lib/treehole/th-questions";

const checkinDraftKey = (date: string) => `qm_treehole_checkin_draft_${date}`;
type CheckinDraft = { date: string; questions: DailyQuestion[]; answers: QuestionAnswer[]; avoidTopics: DimensionCode[]; startedAt: string };
function isCheckinDraft(value: unknown, date: string): value is CheckinDraft {
  if (!value || typeof value !== "object") return false;
  const draft = value as Partial<CheckinDraft>;
  return draft.date === date && typeof draft.startedAt === "string" &&
    Array.isArray(draft.questions) && draft.questions.length > 0 &&
    new Set(draft.questions.map(q => q?.id)).size === draft.questions.length &&
    draft.questions.every(q => q && typeof q.id === "string" && q.id.length > 0 && typeof q.question === "string" && q.question.length > 0 &&
      typeof q.dimension === "string" && q.dimension in DIMENSION_NAMES &&
      Array.isArray(q.options) && q.options.length > 0 && q.options.every(option => typeof option === "string" && option.length > 0)) &&
    Array.isArray(draft.answers) && draft.answers.length <= draft.questions.length &&
    draft.answers.every((answer, index) => answer && answer.questionId === draft.questions?.[index]?.id &&
      typeof answer.answer === "string" &&
      (answer.skipped === true ? (answer.answer === "跳过" || answer.answer === "不想回答这类问题") :
        (answer.skipped === false || answer.skipped === undefined) && draft.questions?.[index]?.options.includes(answer.answer)) &&
      answer.question === draft.questions?.[index]?.question &&
      typeof answer.answeredAt === "string" && answer.dimension === draft.questions?.[index]?.dimension) &&
    Array.isArray(draft.avoidTopics) && draft.avoidTopics.every(topic => typeof topic === "string" && topic in DIMENSION_NAMES);
}

interface CheckInCardProps {
  date: string;
  onComplete: (checkin: DailyCheckin, exposureSaved?: boolean) => boolean;
  existingCheckin?: DailyCheckin;
}

export function CheckInCard({ date, onComplete, existingCheckin }: CheckInCardProps) {
  const [questions, setQuestions] = useState<DailyQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<QuestionAnswer[]>([]);
  const [avoidTopics, setAvoidTopics] = useState<DimensionCode[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [completionSaveFailed, setCompletionSaveFailed] = useState(false);
  const [draftError, setDraftError] = useState("");
  const [emptyQuestions, setEmptyQuestions] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [startedAt, setStartedAt] = useState("");
  const lastAdvanceAt = useRef(-Infinity);
  const draftSnapshot = useRef<string | null>(null);
  const exposureSaveFailed = useRef(false);
  useEffect(() => { exposureSaveFailed.current = false; }, [date]);

  // 初始化：根据日期和历史选择今日题目
  useEffect(() => {
    setEmptyQuestions(false);
    // 如果已有完成的 check-in，直接恢复
    if (existingCheckin?.completed) {
      draftSnapshot.current = null;
      // 早期本机记录可能只存答案；可继续阅读，不把缺失题序当成新一轮问答。
      setQuestions(existingCheckin.questions || []);
      setAnswers(existingCheckin.answers);
      setCurrentIndex(existingCheckin.questions?.length || 0);
      setAvoidTopics(existingCheckin.avoidTopics || []);
      setIsLoaded(true);
      return;
    }

    try {
      const raw = localStorage.getItem(checkinDraftKey(date));
      if (raw) {
        const saved: unknown = JSON.parse(raw);
        if (!isCheckinDraft(saved, date)) {
          setDraftError("上次的情绪收集进度无法安全读取。原数据仍保留在此设备，请勿直接重新答题覆盖它。");
          setIsLoaded(true);
          return;
        }
        setQuestions(saved.questions);
        setAnswers(saved.answers);
        setAvoidTopics(saved.avoidTopics);
        setCurrentIndex(saved.answers.length);
        setStartedAt(saved.startedAt);
        draftSnapshot.current = raw;
        // 答完所有题只代表进度已留在本机；正式记录可能在最后一步写入失败。
        setCompletionSaveFailed(saved.answers.length === saved.questions.length);
        setDraftError("");
        setIsLoaded(true);
        return;
      }
    } catch {
      setDraftError("情绪收集进度暂时无法读取。请检查此设备的浏览器存储后重试，原回答不会在这里被覆盖。");
      setIsLoaded(true);
      return;
    }

    const dateObj = new Date(date);
    const weekday = dateObj.getDay();
    const hour = new Date().getHours();
    const timeSegment = getTimeSegment(hour);
    const month = dateObj.getMonth() + 1;
    const season = getSeason(month);

    // 读取历史曝光
    const exposureHistory = getAllExposures();

    // 昨日未完线索
    const yesterday = new Date(date);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    const yesterdayMemories = getYesterdayUnresolved(yesterdayStr);

    // 读取设置
    const settings = getSettings();

    // 选择今日题目
    let selected: DailyQuestion[];
    try {
      selected = selectDailyQuestions({
        date,
        weekday,
        timeSegment,
        season,
        exposureHistory,
        yesterdayUnresolvedMemories: yesterdayMemories,
        avoidTopics: [],
        isReviewPeriod: isReviewPeriod(date),
      });
    } catch {
      selected = [];
    }

    if (selected.length === 0) {
      setDraftError("今天的问题暂时无法准备，请重试；不会把空题目当作已完成。");
      setEmptyQuestions(true);
      setIsLoaded(true);
      return;
    }
    const createdAt = new Date().toISOString();
    try {
      const initial = JSON.stringify({ date, questions: selected, answers: [], avoidTopics: [], startedAt: createdAt });
      localStorage.setItem(checkinDraftKey(date), initial);
      draftSnapshot.current = initial;
    } catch {
      setDraftError("无法保存情绪收集进度，暂不能安全开始。请检查浏览器存储后重试。");
      setIsLoaded(true);
      return;
    }
    setDraftError("");
    setEmptyQuestions(false);
    setStartedAt(createdAt);
    setAnswers([]);
    setAvoidTopics([]);
    setCurrentIndex(0);
    setQuestions(selected);
    setIsLoaded(true);
  }, [date, existingCheckin, loadAttempt]);

  const progress = useMemo(() => {
    if (questions.length === 0) return 0;
    return ((currentIndex) / questions.length) * 100;
  }, [currentIndex, questions.length]);

  const handleAnswer = (answer: string, skipped: boolean = false) => {
    // 同一位置的快速连击不能顺手把下一道题也跳过；正常逐题操作不受影响。
    if (performance.now() - lastAdvanceAt.current < 300) return;
    const currentQuestion = questions[currentIndex];
    if (!currentQuestion) return;

    const newAnswer: QuestionAnswer = {
      questionId: currentQuestion.id,
      dimension: currentQuestion.dimension,
      question: currentQuestion.question,
      answer: skipped ? "跳过" : answer,
      skipped,
      answeredAt: new Date().toISOString(),
    };

    const newAnswers = [...answers, newAnswer];
    const newAvoidTopics = skipped && answer === "不想回答这类问题"
      ? [...avoidTopics, currentQuestion.dimension] : avoidTopics;
    try {
      if (localStorage.getItem(checkinDraftKey(date)) !== draftSnapshot.current) {
        setDraftError("这一天的答题进度已在另一标签变化，本页没有覆盖新答案。请先读取最新进度，再继续回答。");
        return;
      }
      const next = JSON.stringify({ date, questions, answers: newAnswers, avoidTopics: newAvoidTopics, startedAt });
      localStorage.setItem(checkinDraftKey(date), next);
      draftSnapshot.current = next;
    } catch {
      setDraftError("这次回答没有保存，仍停留在当前题；请检查浏览器存储后重试。");
      return;
    }
    lastAdvanceAt.current = performance.now();
    setDraftError("");
    setAnswers(newAnswers);

    // 如果用户跳过，且不想回答这类问题，加入 avoid
    if (skipped && answer === "不想回答这类问题") {
      setAvoidTopics(newAvoidTopics);
    }

    // 记录曝光
    if (!recordExposures([{
      questionId: currentQuestion.id,
      shownAt: date,
      answered: !skipped,
      skipped,
      avoidToday: skipped && answer === "不想回答这类问题",
    }])) {
      exposureSaveFailed.current = true;
      setDraftError("本次回答已保存，但题目轮换记录未能保存；完成时会提示关联资料不完整。");
    }

    // 前进到下一题
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // 完成
      const checkin: DailyCheckin = {
        date,
        questions,
        answers: newAnswers,
        completed: true,
        startedAt: existingCheckin?.startedAt || startedAt,
        completedAt: new Date().toISOString(),
        avoidTopics: skipped && answer === "不想回答这类问题"
          ? [...avoidTopics, currentQuestion.dimension]
          : avoidTopics,
      };
      if (!onComplete(checkin, !exposureSaveFailed.current)) {
        // 只重试保存这组确定答案，不能重新答最后一题或重复增加曝光。
        setAnswers(newAnswers);
        setCurrentIndex(questions.length);
        setCompletionSaveFailed(true);
      } else {
        try { localStorage.removeItem(checkinDraftKey(date)); } catch { /* 已完成记录优先；旧进度不会覆盖它。 */ }
      }
    }
  };

  const handleSkip = () => {
    handleAnswer("跳过", true);
  };

  const handleAvoid = () => {
    handleAnswer("不想回答这类问题", true);
  };

  if (!isLoaded) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
        <p style={{ color: "#A1A1AA" }}>加载中...</p>
      </div>
    );
  }

  if (questions.length === 0 && !existingCheckin?.completed) {
    return <div className="bg-white rounded-2xl p-8 text-center shadow-sm" role="alert">
      <p>{draftError || "今天的问题暂时无法准备。"}</p>
      <button type="button" onClick={() => { setIsLoaded(false); setLoadAttempt(value => value + 1); }} className="mt-4 rounded-full px-5 py-2 text-white" style={{ background: "#6B4C9A" }}>重试读取</button>
      {emptyQuestions && <button type="button" onClick={() => {
        const now = new Date().toISOString();
        if (!onComplete({ date, questions: [], answers: [], completed: true, startedAt: now, completedAt: now, avoidTopics: [] }))
          setDraftError("跳过情绪收集后仍未保存，请检查存储并重试，不能误认为已进入日记。");
      }} className="ml-3 rounded-full px-5 py-2 text-white" style={{ background: "#6B4C9A" }}>跳过情绪收集，直接写日记</button>}
    </div>;
  }

  const currentQuestion = questions[currentIndex];
  const isCompleted = currentIndex >= questions.length;

  if (isCompleted || existingCheckin?.completed) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
        <div className="text-4xl mb-4">✨</div>
        <h3 className="text-lg font-semibold mb-2" style={{ color: "#4A4A4A" }}>
          {completionSaveFailed ? "情绪收集尚未保存" : "今日情绪收集已完成"}
        </h3>
        <p className="text-sm mb-6" style={{ color: "#71717A" }}>
          {completionSaveFailed ? "刚才的答案仍在当前页面，请重试保存后继续。" : "谢谢你花一分钟和自己在一起"}
        </p>
        <button
          onClick={() => {
            const checkin: DailyCheckin = {
              date,
              questions,
              answers,
              completed: true,
              startedAt: existingCheckin?.startedAt || startedAt,
              completedAt: existingCheckin?.completedAt || new Date().toISOString(),
              avoidTopics,
            };
            const saved = onComplete(checkin, !exposureSaveFailed.current);
            setCompletionSaveFailed(!saved);
            if (saved) try { localStorage.removeItem(checkinDraftKey(date)); } catch { /* 已完成记录优先。 */ }
          }}
          className="px-6 py-2.5 rounded-full text-sm font-medium text-white transition-all hover:scale-105"
          style={{ background: "linear-gradient(135deg, #6B4C9A, #9F7AEA)" }}
        >
          {completionSaveFailed ? "重试保存并继续" : "继续写日记"}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm">
      {draftError && <div role="alert" className="mb-4 text-sm text-red-700">{draftError}
        {draftError.includes("另一标签") && <button type="button" onClick={() => { setIsLoaded(false); setLoadAttempt(value => value + 1); }} className="ml-3 underline">读取最新进度</button>}
      </div>}
      {/* 进度条 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs" style={{ color: "#A1A1AA" }}>
            第 {currentIndex + 1} / {questions.length} 题
          </span>
          <span className="text-xs" style={{ color: "#6B4C9A" }}>
            约 1 分钟
          </span>
        </div>
        <div className="h-1.5 rounded-full" style={{ background: "#F3F4F6" }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #A78BFA, #6B4C9A)",
            }}
          />
        </div>
      </div>

      {/* 维度标签 */}
      {currentQuestion && (
        <div className="mb-4">
          <span
            className="inline-block text-xs px-3 py-1 rounded-full"
            style={{
              background: "rgba(107, 76, 154, 0.1)",
              color: "#6B4C9A",
            }}
          >
            {DIMENSION_NAMES[currentQuestion.dimension]}
            {currentQuestion.isFollowUp && " · 接续昨日"}
          </span>
        </div>
      )}

      {/* 问题 */}
      <h2 className="text-xl font-semibold mb-6" style={{ color: "#4A4A4A" }}>
        {currentQuestion?.question}
      </h2>

      {/* 选项 */}
      <div className="space-y-3 mb-6">
        {currentQuestion?.options.map((option, idx) => (
          <button
            key={idx}
            onClick={() => handleAnswer(option)}
            className="w-full text-left px-5 py-3.5 rounded-xl transition-all hover:scale-[1.01] hover:shadow-md text-sm"
            style={{
              background: "#FAF5F2",
              color: "#4A4A4A",
              border: "1px solid transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(107, 76, 154, 0.3)";
              e.currentTarget.style.background = "rgba(107, 76, 154, 0.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "transparent";
              e.currentTarget.style.background = "#FAF5F2";
            }}
          >
            {option}
          </button>
        ))}
      </div>

      {/* 跳过按钮 */}
      <div className="flex items-center justify-center gap-4 text-sm">
        <button
          onClick={handleSkip}
          className="transition-colors"
          style={{ color: "#A1A1AA" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#71717A"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#A1A1AA"; }}
        >
          跳过这题
        </button>
        <span style={{ color: "#E5E7EB" }}>|</span>
        <button
          onClick={handleAvoid}
          className="transition-colors"
          style={{ color: "#A1A1AA" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#71717A"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#A1A1AA"; }}
        >
          不想回答这类
        </button>
      </div>

      {/* 底部说明 */}
      <p className="text-xs text-center mt-6" style={{ color: "#A1A1AA" }}>
        没有对错，只是你今天的状态
      </p>
    </div>
  );
}
