"use client";

/**
 * QM 93题MBTI风格人格偏好测试 - 完整版 v3.0
 *
 * 三阶段流程：
 * 1. 介绍页（intro）— 头像、标题、说明、开始按钮
 * 2. 答题页（quiz）— 93题逐题作答，进度条，上一步
 * 3. 结果页（result）— 11分区完整报告
 *
 * 品牌色：QM紫 #6B4C9A
 * AI自称：小酷（首次 QM AI）
 * 唯一转介：QM上海酷儿心理咨询中心
 */

import { useState, useMemo, useCallback } from "react";
import { PageLayout } from "@/components/page-layout";
import {
  mbtiQuestions93,
  QUESTION_COUNTS,
} from "@/lib/mbti-v3/mbti-questions-93";
import {
  calculateMBTIScore,
  buildAnswerMap,
  CLARITY_LABELS,
} from "@/lib/mbti-v3/mbti-scoring";
import { getTypeInfo } from "@/lib/mbti-v3/mbti-type-dictionary";
import { generateMBTIReport, generateBorderlineNarrative } from "@/lib/mbti-v3/mbti-narrative";
import {
  DEFAULT_PERSONALIZATION,
  getSelfIntroduction,
  getGreeting,
} from "@/lib/mbti-v3/mbti-personalization";
import {
  EXPORT_CONFIGS,
  EXPORT_DISCLAIMER,
  generateExportFileName,
  generateShareCardContent,
} from "@/lib/mbti-v3/mbti-export";
import { savePendingContext } from "@/lib/context/pending-context";
import type {
  TypeCode,
  Pole,
  MBTIScoreResult,
  MBTIFullReport,
  PersonalizationContext,
  ExportFormat,
  MBTIQuestion,
} from "@/lib/mbti-v3/mbti-types";

type Phase = "intro" | "quiz" | "result";

// ============================================================
// 主组件
// ============================================================

export default function MBTIPage() {
  // 阶段状态
  const [phase, setPhase] = useState<Phase>("intro");

  // 答题状态
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, Pole>>(new Map());

  // 结果状态
  const [scoreResult, setScoreResult] = useState<MBTIScoreResult | null>(null);
  const [report, setReport] = useState<MBTIFullReport | null>(null);
  const [personalization, setPersonalization] = useState<PersonalizationContext>(
    DEFAULT_PERSONALIZATION
  );
  const [showIntro, setShowIntro] = useState(true);
  const [activeSection, setActiveSection] = useState<string>("hero");
  const [exportFormat, setExportFormat] = useState<ExportFormat | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const totalQuestions = mbtiQuestions93.length;
  const currentQuestion: MBTIQuestion | undefined = mbtiQuestions93[currentIndex];
  const answeredCount = answers.size;
  const progress = Math.round((answeredCount / totalQuestions) * 100);

  // ============================================================
  // 答题逻辑
  // ============================================================

  const handleAnswer = useCallback((direction: Pole) => {
    if (!currentQuestion) return;

    const newAnswers = new Map(answers);
    newAnswers.set(currentQuestion.id, direction);
    setAnswers(newAnswers);

    // 延迟 200ms 进入下一题，体验更好
    setTimeout(() => {
      if (currentIndex < totalQuestions - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        // 最后一题，计算结果
        const result = calculateMBTIScore(newAnswers, mbtiQuestions93);
        setScoreResult(result);

        const fullReport = generateMBTIReport(result, {
          moduleCount: 14,
          whisperCount: 4,
          celebrityCount: 3,
          mediaCount: 3,
          personalization,
        });
        setReport(fullReport);
        setPhase("result");
      }
    }, 200);
  }, [currentQuestion, answers, currentIndex, totalQuestions, personalization]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  const handleRestart = useCallback(() => {
    setPhase("intro");
    setCurrentIndex(0);
    setAnswers(new Map());
    setScoreResult(null);
    setReport(null);
    setShowIntro(true);
    setExportFormat(null);
    setIsExporting(false);
  }, []);

  const startQuiz = useCallback(() => {
    setPhase("quiz");
    setCurrentIndex(0);
    setAnswers(new Map());
  }, []);

  const goToAssessments = useCallback(() => {
    window.location.href = "/assessments";
  }, []);

  // ============================================================
  // 导出处理
  // ============================================================

  const handleExport = async (format: ExportFormat) => {
    setExportFormat(format);
    setIsExporting(true);
    // 实际导出逻辑由前端实现（html2canvas / jspdf 等）
    setTimeout(() => {
      setIsExporting(false);
      setExportFormat(null);
    }, 1500);
  };

  const dismissIntro = () => {
    setShowIntro(false);
  };

  const typeInfo = useMemo(() => {
    if (!scoreResult) return null;
    return getTypeInfo(scoreResult.typeCode);
  }, [scoreResult]);

  // 带结果找小酷：写入跨模块上下文桥，一次性消费
  const handleTalkToXiaoku = () => {
    if (scoreResult && typeInfo) {
      savePendingContext({
        source: "assessment",
        summary:
          `我刚做完「QM 93题MBTI风格人格偏好测试」，结果是 ${typeInfo.code} ${typeInfo.nameCn}（${typeInfo.nameEn}）` +
          (typeInfo.tagline ? `，主题「${typeInfo.tagline}」` : "") +
          `。` +
          (scoreResult.borderlineDimensions.length
            ? `其中有 ${scoreResult.borderlineDimensions.length} 个边界维度（${scoreResult.borderlineDimensions.join("/")}），结果在临界之间。`
            : "") +
          `这只是人格偏好的自我探索参考，不是诊断。想和你聊聊我的测试结果、里面的特质，还有我的一些感受。`,
        payload: { test: "mbti93", typeCode: typeInfo.code },
      });
    }
    window.location.href = "/chat";
  };

  // ============================================================
  // 阶段 1：介绍页
  // ============================================================

  if (phase === "intro") {
    return (
      <PageLayout title="MBTI 人格测试">
        <div className="max-w-md mx-auto px-4 py-12 min-h-[80vh] flex flex-col justify-center">
          {/* 头像 */}
          <div className="text-center mb-8">
            {/* B4-TEST-011：人物形象只用批准素材（Fidelity 素材链 /visual/char/），无 AI 仿制、无外来图 */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/visual/char/xiaoku_avatar_square.png"
              alt="QM AI 小酷"
              className="w-20 h-20 mx-auto rounded-full object-cover shadow-lg"
            />
            <div className="mt-3 text-sm text-[#6B4C9A] font-medium">QM AI</div>
          </div>

          {/* 标题 */}
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-4">
            QM 93题MBTI风格人格偏好测试
          </h2>

          {/* 说明 */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6 space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">
              <span className="text-[#6B4C9A] font-medium">📝 题量：</span>
              共 93 道题（外向内向23题 + 感觉直觉25题 + 思考情感22题 + 判断感知23题）
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">
              <span className="text-[#6B4C9A] font-medium">⏱️ 时长：</span>
              大约需要 10 分钟，请在安静环境下完成
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">
              <span className="text-[#6B4C9A] font-medium">💡 说明：</span>
              这不是心理诊断，而是自我探索的工具。选择你更自然、更真实的倾向，没有对错之分
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">
              <span className="text-[#6B4C9A] font-medium">🔄 可暂停：</span>
              答题中可随时返回，数据保留在本地
            </p>
          </div>

          {/* 开始按钮 */}
          <button
            onClick={startQuiz}
            className="w-full py-4 bg-[#6B4C9A] text-white rounded-xl font-medium text-lg hover:bg-[#5a3f85] transition-colors shadow-md mb-4"
          >
            开始测试
          </button>

          {/* 返回测评列表 */}
          <button
            onClick={goToAssessments}
            className="w-full py-3 text-gray-500 text-sm hover:text-[#6B4C9A] transition-colors"
          >
            ← 返回测评列表
          </button>

          {/* 底部声明 */}
          <div className="mt-8 text-center text-xs text-gray-400 space-y-1">
            <p>本测试为 MBTI 风格的人格偏好探索工具</p>
            <p>非官方 MBTI® 测评 · licensed = false</p>
            <p>结果仅供自我探索参考，不构成心理诊断</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  // ============================================================
  // 阶段 2：答题页
  // ============================================================

  if (phase === "quiz") {
    if (!currentQuestion) {
      return (
        <PageLayout title="MBTI 人格测试">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-gray-500">加载中...</div>
          </div>
        </PageLayout>
      );
    }

    const dimLabels: Record<string, string> = {
      EI: "能量方向",
      SN: "信息获取",
      TF: "决策方式",
      JP: "生活态度",
    };

    return (
      <PageLayout title="MBTI 人格测试">
        <div className="max-w-md mx-auto px-4 py-6 min-h-[80vh] flex flex-col">
          {/* 顶部进度条 */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-500">
                第 {currentIndex + 1} / {totalQuestions} 题
              </span>
              <span className="text-xs text-[#6B4C9A] font-medium">
                {progress}%
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#6B4C9A] rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-1 text-xs text-gray-400 text-right">
              {dimLabels[currentQuestion.dimension]}
            </div>
          </div>

          {/* 题目 */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
              <div className="text-xs text-[#6B4C9A] font-medium mb-3">
                Q{currentIndex + 1}
              </div>
              <h2 className="text-lg font-medium text-gray-800 leading-relaxed">
                {currentQuestion.question}
              </h2>
            </div>

            {/* 选项 */}
            <div className="space-y-3">
              {currentQuestion.options.map((option, idx) => {
                const isSelected = answers.get(currentQuestion.id) === option.direction;
                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(option.direction)}
                    className={`w-full p-4 rounded-xl text-left transition-all duration-200 border-2 ${
                      isSelected
                        ? "border-[#6B4C9A] bg-purple-50 text-[#6B4C9A]"
                        : "border-gray-100 bg-white text-gray-700 hover:border-purple-200 hover:bg-purple-50/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        isSelected
                          ? "bg-[#6B4C9A] text-white"
                          : "bg-gray-100 text-gray-500"
                      }`}>
                        {idx === 0 ? "A" : "B"}
                      </div>
                      <span className="text-sm leading-relaxed pt-0.5">
                        {option.text}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 底部操作区 */}
          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                currentIndex === 0
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-500 hover:text-[#6B4C9A] hover:bg-purple-50"
              }`}
            >
              ← 上一题
            </button>

            <button
              onClick={goToAssessments}
              className="px-4 py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              退出
            </button>
          </div>
        </div>
      </PageLayout>
    );
  }

  // ============================================================
  // 阶段 3：结果页
  // ============================================================

  if (!scoreResult || !report || !typeInfo) {
    return (
      <PageLayout title="MBTI 人格测试">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-gray-500">加载中...</div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="MBTI 人格测试">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* 首次自我介绍弹窗 */}
        {showIntro && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
              <div className="text-center mb-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-[#6B4C9A] flex items-center justify-center text-white text-2xl font-bold">
                  小酷
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed mb-4 text-sm">
                {getSelfIntroduction(personalization)}
              </p>
              <p className="text-gray-500 text-xs mb-6">
                本测试为 MBTI 风格的人格偏好探索工具，非官方 MBTI® 测评。
                结果仅供自我探索参考，不构成心理诊断。
              </p>
              <button
                onClick={dismissIntro}
                className="w-full py-3 bg-[#6B4C9A] text-white rounded-xl font-medium hover:bg-[#5a3f85] transition-colors"
              >
                开始探索我的人格报告
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* 1. Hero 区（代码+中文+英文+配图位） */}
        {/* ============================================================ */}
        <section id="hero" className="text-center mb-12">
          {/* 配图位 - SVG placeholder */}
          <div
            className="w-48 h-48 mx-auto mb-6 rounded-2xl flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, #6B4C9A 0%, ${typeInfo.accentColor} 100%)`,
            }}
          >
            <div className="text-white text-center">
              <div className="text-5xl font-bold tracking-wider">
                {typeInfo.code}
              </div>
              <div className="text-sm opacity-80 mt-1">
                {typeInfo.imageKey}
              </div>
            </div>
          </div>

          <div className="mb-2 text-sm text-[#6B4C9A] font-medium">
            QM 93题MBTI风格人格偏好测试
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-1">
            {typeInfo.code} {typeInfo.nameCn}
          </h2>
          <div className="text-lg text-gray-500 mb-3">{typeInfo.nameEn}</div>
          <div className="text-[#6B4C9A] text-sm italic">
            「{typeInfo.tagline}」
          </div>
          <p className="text-gray-500 text-xs mt-3">
            {getGreeting(personalization, scoreResult.typeCode)}
          </p>
        </section>

        {/* ============================================================ */}
        {/* 2. 四维Profile与clarity */}
        {/* ============================================================ */}
        <section id="dimensions" className="mb-12">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>📊</span> 四维人格偏好画像
          </h2>

          <div className="space-y-4">
            {(Object.keys(scoreResult.dimensions) as Array<keyof typeof scoreResult.dimensions>).map(
              (dimKey) => {
                const dim = scoreResult.dimensions[dimKey];
                const dimLabels: Record<string, string> = {
                  EI: "能量方向",
                  SN: "信息获取",
                  TF: "决策方式",
                  JP: "生活态度",
                };
                const poleALabels: Record<string, string> = {
                  EI: "外向 E",
                  SN: "感觉 S",
                  TF: "思考 T",
                  JP: "判断 J",
                };
                const poleBLabels: Record<string, string> = {
                  EI: "内向 I",
                  SN: "直觉 N",
                  TF: "情感 F",
                  JP: "感知 P",
                };

                return (
                  <div
                    key={dimKey}
                    className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        {dimLabels[dimKey]}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          dim.isBorderline
                            ? "bg-amber-100 text-amber-700"
                            : "bg-purple-100 text-purple-700"
                        }`}
                      >
                        {CLARITY_LABELS[dim.clarityLevel]} · {dim.clarity}%
                      </span>
                    </div>

                    {/* 进度条 */}
                    <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
                      <div
                        className="absolute left-0 top-0 h-full rounded-full"
                        style={{
                          width: `${dim.percentA}%`,
                          backgroundColor: dim.dominantPole === dim.poleA
                            ? "#6B4C9A"
                            : "#c9b8e0",
                        }}
                      />
                    </div>

                    <div className="flex justify-between text-xs text-gray-500">
                      <span>
                        {poleALabels[dimKey]} {dim.percentA}%
                      </span>
                      <span>
                        {dim.percentB}% {poleBLabels[dimKey]}
                      </span>
                    </div>

                    {/* 场景描述 */}
                    <div className="mt-3 text-sm text-gray-600 leading-relaxed">
                      <p className="mb-1">
                        <span className="text-[#6B4C9A] font-medium">
                          你的表现：
                        </span>{" "}
                        {dim.scenario1}
                      </p>
                      <p>
                        <span className="text-[#6B4C9A] font-medium">
                          另一个场景：
                        </span>{" "}
                        {dim.scenario2}
                      </p>
                    </div>

                    {/* 非定型说明 */}
                    <div className="mt-2 text-xs text-gray-400 italic">
                      💡 {dim.nonFixedNote}
                    </div>
                  </div>
                );
              }
            )}
          </div>

          {/* 边界维度说明 */}
          {scoreResult.borderlineDimensions.length > 0 && (
            <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="text-sm font-medium text-amber-800 mb-2">
                🔍 关于你的边界维度
              </div>
              <p className="text-sm text-amber-700 leading-relaxed">
                {generateBorderlineNarrative(scoreResult)}
              </p>
              {scoreResult.adjacentTypes.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-xs text-amber-600">邻近类型：</span>
                  {scoreResult.adjacentTypes.map((type) => (
                    <span
                      key={type}
                      className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* ============================================================ */}
        {/* 3. 整体人格叙事 */}
        {/* ============================================================ */}
        <section id="narrative" className="mb-12">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>📖</span> 你的人格叙事
          </h2>
          <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl p-5 border border-purple-100">
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {typeInfo.briefDescription}
            </p>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 4. 动态小酷心理耳语 */}
        {/* ============================================================ */}
        <section id="whispers" className="mb-12">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>💭</span> 小酷心理耳语
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            小酷有几句话想对你说，选了几条觉得可能适合你的。
          </p>

          <div className="space-y-4">
            {report.whispers.map((whisper, idx) => (
              <div
                key={whisper.id}
                className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-[#6B4C9A]"
              >
                <div className="text-xs text-[#6B4C9A] font-medium mb-2">
                  耳语 #{idx + 1}
                </div>
                <div className="space-y-2 text-sm text-gray-700 leading-relaxed">
                  <p>
                    <span className="font-medium">看见你：</span>
                    {whisper.content.seeing}
                  </p>
                  <p>
                    <span className="font-medium">具体场景：</span>
                    {whisper.content.scenario}
                  </p>
                  <p>
                    <span className="font-medium">可能的拉扯：</span>
                    {whisper.content.tension}
                  </p>
                  <p>
                    <span className="font-medium">成长视角：</span>
                    {whisper.content.growth}
                  </p>
                  <p className="text-[#6B4C9A] font-medium">
                    ❓ {whisper.content.question}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ============================================================ */}
        {/* 5. 工作/学习/关系/压力场景 */}
        {/* ============================================================ */}
        <section id="scenarios" className="mb-12">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>🎯</span> 场景化洞察
          </h2>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="text-lg mb-1">💼</div>
              <div className="text-sm font-medium text-gray-800 mb-1">工作风格</div>
              <div className="text-xs text-gray-500">你擅长的工作方式</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="text-lg mb-1">📚</div>
              <div className="text-sm font-medium text-gray-800 mb-1">学习方式</div>
              <div className="text-xs text-gray-500">你最有效的学习路径</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="text-lg mb-1">💞</div>
              <div className="text-sm font-medium text-gray-800 mb-1">关系模式</div>
              <div className="text-xs text-gray-500">你在亲密关系中的样子</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="text-lg mb-1">🌊</div>
              <div className="text-sm font-medium text-gray-800 mb-1">压力反应</div>
              <div className="text-xs text-gray-500">压力下你的表现与调节</div>
            </div>
          </div>

          <p className="text-xs text-gray-400 text-center">
            ↓ 下方模块池有更多场景化洞察，继续往下翻
          </p>
        </section>

        {/* ============================================================ */}
        {/* 6. 名人 Story Mirror */}
        {/* ============================================================ */}
        <section id="celebrity-mirror" className="mb-12">
          <h2 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
            <span>🌟</span> 名人 Story Mirror
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            ⚠️ 这些人物的类型标签仅作趣味性参照（popularly_associated），
            不代表官方认定或事实判断。
          </p>

          <div className="space-y-4">
            {report.celebrityStories.map((celebrity) => (
              <div
                key={celebrity.id}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
              >
                <div className="flex items-start gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">👤</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">
                      {celebrity.nameCn}
                    </div>
                    <div className="text-xs text-gray-400">
                      {celebrity.nameEn}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-600 space-y-2 leading-relaxed">
                  <p>
                    <span className="text-gray-500">故事：</span>
                    {celebrity.public_story_summary}
                  </p>
                  <p className="text-[#6B4C9A]">
                    <span className="font-medium">和你的连接点：</span>
                    {celebrity.connection_point}
                  </p>
                  <p className="text-amber-600 text-xs">
                    ⚠️ {celebrity.difference_reminder}
                  </p>
                  <p className="text-gray-700 font-medium">
                    💡 {celebrity.takeaway}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ============================================================ */}
        {/* 7. 影视 Story Mirror */}
        {/* ============================================================ */}
        <section id="media-mirror" className="mb-12">
          <h2 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
            <span>🎬</span> 影视 Story Mirror
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            从影视角色中看到自己的影子，也是一种自我探索。
          </p>

          <div className="space-y-4">
            {report.mediaStories.map((media) => (
              <div
                key={media.id}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
              >
                <div className="flex items-start gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">🎭</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">
                      {media.title}
                    </div>
                    <div className="text-xs text-gray-400">
                      {media.character}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-600 space-y-2 leading-relaxed">
                  <p>
                    <span className="text-gray-500">场景：</span>
                    {media.scene_description}
                  </p>
                  <p>
                    <span className="text-gray-500">行为模式：</span>
                    {media.behavior_pattern}
                  </p>
                  <p className="text-[#6B4C9A]">
                    <span className="font-medium">为什么相关：</span>
                    {media.why_relevant}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ============================================================ */}
        {/* 8. 职业任务环境（模块池：工作风格+团队角色+动机驱动） */}
        {/* ============================================================ */}
        <section id="career" className="mb-12">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>🏢</span> 职业与任务环境
          </h2>

          <div className="space-y-4">
            {report.selectedModules
              .filter((m) =>
                ["work_style", "team_role", "motivation_driver"].includes(
                  m.category
                )
              )
              .map((module) => (
                <div
                  key={module.id}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{module.icon}</span>
                    <span className="font-medium text-gray-800">
                      {module.title}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {module.content}
                  </p>
                </div>
              ))}
          </div>
        </section>

        {/* ============================================================ */}
        {/* 9. 成长探索（模块池：成长方向+发展建议+阴影面） */}
        {/* ============================================================ */}
        <section id="growth" className="mb-12">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>🌱</span> 成长探索
          </h2>

          <div className="space-y-4">
            {report.selectedModules
              .filter((m) =>
                ["growth_direction", "development_advice", "shadow_side"].includes(
                  m.category
                )
              )
              .map((module) => (
                <div
                  key={module.id}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{module.icon}</span>
                    <span className="font-medium text-gray-800">
                      {module.title}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {module.content}
                  </p>
                </div>
              ))}
          </div>
        </section>

        {/* 更多模块预览 */}
        <section id="more-modules" className="mb-12">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>✨</span> 更多关于你的发现
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            这次报告从 26 个模块中为你精选了 {report.selectedModules.length} 个维度。
            下面是其中一些：
          </p>

          <div className="grid grid-cols-2 gap-3">
            {report.selectedModules.slice(0, 8).map((module) => (
              <div
                key={module.id}
                className="bg-white rounded-xl p-3 shadow-sm border border-gray-100"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span>{module.icon}</span>
                  <span className="text-sm font-medium text-gray-700">
                    {module.title}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ============================================================ */}
        {/* 10. 保存/导出/分享/重测/和小酷聊 */}
        {/* ============================================================ */}
        <section id="actions" className="mb-12">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>📤</span> 保存与分享
          </h2>

          <div className="space-y-3">
            <button
              onClick={() => handleExport("png_long")}
              className="w-full py-3 bg-[#6B4C9A] text-white rounded-xl font-medium hover:bg-[#5a3f85] transition-colors flex items-center justify-center gap-2"
            >
              📱 保存长图 PNG (1080×1920)
            </button>

            <button
              onClick={() => handleExport("pdf_a4")}
              className="w-full py-3 bg-white text-[#6B4C9A] border border-[#6B4C9A] rounded-xl font-medium hover:bg-purple-50 transition-colors flex items-center justify-center gap-2"
            >
              📄 导出完整报告 PDF (A4)
            </button>

            <button
              onClick={() => handleExport("share_card")}
              className="w-full py-3 bg-gradient-to-r from-pink-400 to-purple-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              🎴 生成分享卡 (1080×1350)
            </button>

            <button
              onClick={handleRestart}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              🔄 重新测试
            </button>

            <button
              onClick={handleTalkToXiaoku}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              💬 带结果和小酷聊聊
            </button>
          </div>

          {/* 导出中提示 */}
          {isExporting && exportFormat && (
            <div className="mt-4 p-4 bg-purple-50 rounded-xl text-center text-sm text-purple-700">
              正在生成 {EXPORT_CONFIGS[exportFormat].format === "png_long"
                ? "长图"
                : EXPORT_CONFIGS[exportFormat].format === "pdf_a4"
                ? "PDF报告"
                : "分享卡"}
              ...
            </div>
          )}
        </section>

        {/* ============================================================ */}
        {/* 底部免责声明 */}
        {/* ============================================================ */}
        <section className="mb-8 text-center">
          <div className="text-xs text-gray-400 space-y-2 leading-relaxed">
            <p>
              本测试为 MBTI 风格的人格偏好探索工具，非官方 MBTI® 测评。
              licensed = false
            </p>
            <p>
              测试结果仅供自我探索参考，不构成任何心理诊断或专业建议。
            </p>
            <p>
              如有心理困扰，可联系 👉
              <span className="text-[#6B4C9A]"> QM上海酷儿心理咨询中心</span>
            </p>
            <p className="text-gray-500">
              热线：15001930070 / 联系人工客服（「联系我们」页面）
            </p>
            <p className="pt-2 text-gray-300">
              产品名称：QM 93题MBTI风格人格偏好测试 v3.0
            </p>
          </div>
        </section>
      </div>
    </PageLayout>
  );
}
