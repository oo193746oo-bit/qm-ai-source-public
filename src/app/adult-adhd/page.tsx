/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
"use client";

/**
 * QM 成人ADHD评估 v4.0 - 完整版独立页面
 *
 * 三阶段流程：
 * 1. 介绍页（intro）— 头像、标题、双层架构说明、非诊断声明、开始按钮
 * 2. 答题页（quiz）— 48题逐题作答，进度条，上一题，退出
 * 3. 结果页（result）— 多屏完整报告
 *
 * 品牌色：QM紫 #6B4C9A
 * AI自称：小酷（首次 QM AI）
 * 唯一转介：QM上海酷儿心理咨询中心
 */

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { PageLayout } from "@/components/page-layout";
import {
  calculateADHDScore,
  buildAnswerMap,
  scoreToVisualPosition,
} from "@/lib/adult-adhd-v4/scoring";
import { generateADHDReport } from "@/lib/adult-adhd-v4/narrative";
import { CATEGORY_NAMES } from "@/lib/adult-adhd-v4/dimensions";
import { getSupportMatrixCell } from "@/lib/adult-adhd-v4/support-matrix";
import { buildAssessmentPrep } from "@/lib/adult-adhd-v4/assessment-prep";
import { selectWhispers, WHISPERS } from "@/lib/adult-adhd-v4/whispers";
import {
  matchStoryMirrorPeople,
  STORY_MIRROR_PEOPLE,
} from "@/lib/adult-adhd-v4/story-mirror-people";
import {
  matchStoryMirrorMedia,
  STORY_MIRROR_MEDIA,
} from "@/lib/adult-adhd-v4/story-mirror-media";
import { selectModules, TOTAL_MODULE_COUNT } from "@/lib/adult-adhd-v4/module-pool";
import {
  SCENES_16,
  estimateSceneChallenge,
  getTopScenes,
} from "@/lib/adult-adhd-v4/scenes";
import { getTopChallenges } from "@/lib/adult-adhd-v4/executive-function";
import { PRIMARY_COLOR, getScoreColor, VISUAL_POSITION_DISCLAIMER } from "@/lib/adult-adhd-v4/visualizations";
import {
  EXPORT_CONFIGS,
  EXPORT_DISCLAIMER,
  generateExportFileName,
} from "@/lib/adult-adhd-v4/export";
import { REFERRAL_INFO } from "@/lib/adult-adhd-v4/safety-gates";
import { EVIDENCE_SUMMARY } from "@/lib/adult-adhd-v4/evidence-registry";
import {
  DEFAULT_PERSONALIZATION,
  getSelfIntroduction,
} from "@/lib/adult-adhd-v4/personalization";
import type { PersonalizationContext } from "@/lib/adult-adhd-v4/personalization";
import { adhdQuestions48, QUESTION_COUNT } from "@/lib/adult-adhd-v4/questions-48";

type Phase = "intro" | "quiz" | "result";

// ============================================================
// 主组件
// ============================================================

export default function AdultADHDPage() {
  // 阶段状态
  const [phase, setPhase] = useState<Phase>("intro");

  // 答题状态
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, number>>(new Map());

  // 结果状态
  const [result, setResult] = useState<ADHDResult | null>(null);
  const [report, setReport] = useState<any>(null);
  const [personalization, setPersonalization] = useState<PersonalizationContext>(
    DEFAULT_PERSONALIZATION
  );
  const [activeSection, setActiveSection] = useState<string>("hero");
  const [exportFormat, setExportFormat] = useState<ExportFormat | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const totalQuestions = QUESTION_COUNT;
  const currentQuestion: ADHDQuestion | undefined = adhdQuestions48[currentIndex];
  const answeredCount = answers.size;
  const progress = Math.round((answeredCount / totalQuestions) * 100);

  // ============================================================
  // 答题逻辑
  // ============================================================

  const handleAnswer = useCallback(
    (value: number) => {
      if (!currentQuestion) return;

      const newAnswers = new Map(answers);
      newAnswers.set(currentQuestion.id, value);
      setAnswers(newAnswers);

      setTimeout(() => {
        if (currentIndex < totalQuestions - 1) {
          setCurrentIndex(currentIndex + 1);
        } else {
          // 最后一题，计算结果
          const scoringResult = calculateADHDScore(newAnswers, adhdQuestions48);
          const screeningSignal: ScreeningSignal = "unavailable"; // 官方筛查模块未启用

          const supportCell = getSupportMatrixCell(
            screeningSignal,
            scoringResult.functionalImpact.mean
          );

          // 构建 user signature
          const topEF = getTopChallenges(scoringResult.executiveFunction, 3);
          const sceneChallenges = estimateSceneChallenge(
            {
              inattention: scoringResult.core.inattention_mean,
              hyperactivity: scoringResult.core.hyperactivity_mean,
              impulsivity: scoringResult.core.impulsivity_mean,
            },
            scoringResult.executiveFunction as any
          );
          const topSceneIds = getTopScenes(sceneChallenges, 5);

          const userSignature: UserSignature = {
            official_screening_signal: screeningSignal,
            qm_core: scoringResult.core,
            executive_function: scoringResult.executiveFunction,
            emotion_regulation: scoringResult.emotionRegulation,
            functional_impact: scoringResult.functionalImpact,
            developmental: scoringResult.developmental,
            overlap: scoringResult.overlap,
            support_priority: supportCell.priority,
            top_3_domains: [],
            bottom_3_domains: [],
            top_3_ef: topEF,
            weakest_3_ef: [],
            primary_scenes: topSceneIds,
          };

          const assessmentPrep = buildAssessmentPrep({
            core: scoringResult.core,
            execFn: scoringResult.executiveFunction,
            impact: scoringResult.functionalImpact,
            dev: scoringResult.developmental,
            overlap: scoringResult.overlap,
          });

          const fullResult: ADHDResult = {
            assessment_version: "4.0.0",
            assessment_id: "adult-adhd",
            official_screening_signal: screeningSignal,
            norm_status: "unapproved",
            raw_assessment_read_only: true,
            qm_core_profile: scoringResult.core,
            executive_function_profile: scoringResult.executiveFunction,
            emotion_regulation_context: scoringResult.emotionRegulation,
            functional_impact_profile: scoringResult.functionalImpact,
            developmental_context: scoringResult.developmental,
            overlap_context: scoringResult.overlap,
            support_priority: supportCell.priority,
            support_matrix_cell: supportCell,
            selected_modules: selectModules({ topSceneIds, minTotal: 22 }),
            user_signature: userSignature,
            confidence_notes: [
              "本结果基于你的自我报告，仅供自我觉察参考",
              "官方筛查模块（ASRS）未启用，当前仅呈现QM Context Profile",
              "回忆信息可能存在偏差，尤其是童年部分",
              "跨情境信息来自自我评估，未收集他人视角",
              "结果不构成诊断，也不能替代专业评估",
            ],
            assessment_prep: assessmentPrep,
          };

          const fullReport = generateADHDReport({
            qm_core_profile: scoringResult.core,
            executive_function_profile: scoringResult.executiveFunction,
            functional_impact_profile: scoringResult.functionalImpact,
            developmental_context: scoringResult.developmental,
            overlap_context: scoringResult.overlap,
          });

          setResult(fullResult);
          setReport(fullReport);
          setPhase("result");
        }
      }, 200);
    },
    [currentQuestion, answers, currentIndex, totalQuestions]
  );

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  const handleRestart = useCallback(() => {
    setPhase("intro");
    setCurrentIndex(0);
    setAnswers(new Map());
    setResult(null);
    setReport(null);
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

  const handleExport = async (format: ExportFormat) => {
    setExportFormat(format);
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      setExportFormat(null);
    }, 1500);
  };

  // 选中的耳语
  const selectedWhispers = useMemo(() => {
    if (!result) return [];
    return selectWhispers(result.user_signature, 5);
  }, [result]);

  // 选中的人物
  const selectedPeople = useMemo(() => {
    if (!result) return [];
    return matchStoryMirrorPeople(result.user_signature, { count: 3 });
  }, [result]);

  // 选中的影视
  const selectedMedia = useMemo(() => {
    if (!result) return [];
    return matchStoryMirrorMedia(result.user_signature, 3);
  }, [result]);

  // Top 场景
  const topScenes = useMemo(() => {
    if (!result) return [];
    const challenges = estimateSceneChallenge(
      {
        inattention: result.qm_core_profile.inattention_mean,
        hyperactivity: result.qm_core_profile.hyperactivity_mean,
        impulsivity: result.qm_core_profile.impulsivity_mean,
      },
      result.executive_function_profile as any
    );
    const ids = getTopScenes(challenges, 6);
    return ids
      .map((id) => ({
        scene: SCENES_16.find((s) => s.id === id),
        challenge: challenges[id],
      }))
      .filter((x) => x.scene);
  }, [result]);

  // ============================================================
  // 阶段 1：介绍页
  // ============================================================

  if (phase === "intro") {
    return (
      <PageLayout title="">
        <div className="max-w-md mx-auto px-4 py-12 min-h-[80vh] flex flex-col justify-center">
          {/* 头像 */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto rounded-full bg-[#6B4C9A] flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              小酷
            </div>
            <div className="mt-3 text-sm text-[#6B4C9A] font-medium">QM AI</div>
          </div>

          {/* 标题 */}
          <h1 className="text-2xl font-bold text-gray-800 text-center mb-2">
            成人ADHD评估
          </h1>
          <p className="text-sm text-gray-500 text-center mb-6">
            Adult ADHD Screening &amp; Context Profile
          </p>
          <p className="text-sm text-[#6B4C9A] text-center mb-6 font-medium">
            双层循证架构
          </p>

          {/* 说明卡片 */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6 space-y-4">
            <div>
              <span className="text-[#6B4C9A] font-medium text-sm">📝 题量：</span>
              <span className="text-sm text-gray-600">
                共 48 道题（核心症状18题 + 执行功能8题 + 情绪调节5题 + 功能影响6题 + 发展情境5题 + 重叠因素6题）
              </span>
            </div>
            <div>
              <span className="text-[#6B4C9A] font-medium text-sm">⏱️ 时长：</span>
              <span className="text-sm text-gray-600">
                大约需要 8-10 分钟，请找一个安静不被打扰的环境完成
              </span>
            </div>
            <div>
              <span className="text-[#6B4C9A] font-medium text-sm">🧠 架构：</span>
              <span className="text-sm text-gray-600">
                Evidence Screener（官方筛查层）+ QM Context Profile（48题扩展画像）
              </span>
            </div>
            <div>
              <span className="text-[#6B4C9A] font-medium text-sm">⚠️ 说明：</span>
              <span className="text-sm text-gray-600">
                这是筛查与自我觉察工具，不是诊断。请根据你过去6个月的真实情况作答，没有对错之分。
              </span>
            </div>
            <div>
              <span className="text-[#6B4C9A] font-medium text-sm">👤 适用：</span>
              <span className="text-sm text-gray-600">
                成年人自评。若你是在为他人做，请记住第二视角会有偏差。
              </span>
            </div>
          </div>

          {/* 非诊断声明 */}
          <div className="bg-purple-50 rounded-lg p-4 mb-6 text-xs text-gray-600 leading-relaxed">
            <p className="font-medium text-[#6B4C9A] mb-1">非诊断声明</p>
            <p>
              本测评是结构化自我观察工具，不构成ADHD或任何心理疾病的诊断。
              诊断需要由经过专业训练的心理师或精神科医生，结合发展史、多情境信息和功能影响综合判断。
              官方ASRS筛查模块需由项目方另行配置经批准的版本。
            </p>
          </div>

          {/* 开始按钮 */}
          <button
            onClick={startQuiz}
            className="w-full py-4 bg-[#6B4C9A] text-white rounded-xl font-medium text-base shadow-md hover:bg-[#5a3f85] active:scale-[0.98] transition-all"
          >
            开始测试
          </button>

          {/* 返回 */}
          <button
            onClick={goToAssessments}
            className="w-full py-3 mt-3 text-sm text-gray-500 hover:text-gray-700"
          >
            返回测评列表
          </button>
        </div>
      </PageLayout>
    );
  }

  // ============================================================
  // 阶段 2：答题页
  // ============================================================

  if (phase === "quiz") {
    return (
      <PageLayout title="">
        <div className="max-w-md mx-auto px-4 py-6 min-h-[85vh] flex flex-col">
          {/* 顶部：进度 + 退出 */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={goToAssessments}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              退出
            </button>
            <div className="text-sm text-gray-500">
              {answeredCount} / {totalQuestions}
            </div>
          </div>

          {/* 进度条 */}
          <div className="w-full h-2 bg-gray-100 rounded-full mb-2">
            <div
              className="h-full bg-[#6B4C9A] rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* 维度标签 */}
          {currentQuestion && (
            <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-purple-50 text-[#6B4C9A] text-xs rounded-full font-medium">
                {CATEGORY_NAMES[currentQuestion.category]}
              </span>
              <span className="ml-2 text-xs text-gray-400">
                {currentQuestion.timeFrame}
              </span>
            </div>
          )}

          {/* 题目 */}
          <div className="flex-1 flex flex-col justify-center">
            {currentQuestion && (
              <>
                <h2 className="text-lg font-medium text-gray-800 mb-8 leading-relaxed">
                  {currentQuestion.text}
                </h2>

                {/* 选项 */}
                <div className="space-y-3">
                  {currentQuestion.options.map((opt) => {
                    const isSelected = answers.get(currentQuestion.id) === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => handleAnswer(opt.value)}
                        className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                          isSelected
                            ? "border-[#6B4C9A] bg-purple-50"
                            : "border-gray-100 bg-white hover:border-purple-200"
                        }`}
                      >
                        <span className="text-sm text-gray-700">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* 底部：上一题 */}
          <div className="mt-6 flex justify-between">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className={`text-sm ${
                currentIndex === 0
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              上一题
            </button>
            <div className="text-xs text-gray-400">
              第 {currentIndex + 1} 题
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  // ============================================================
  // 阶段 3：结果页
  // ============================================================

  if (phase === "result" && result && report) {
    const core = result.qm_core_profile;
    const execFn = result.executive_function_profile;
    const impact = result.functional_impact_profile;
    const dev = result.developmental_context;
    const overlap = result.overlap_context;
    const emotion = result.emotion_regulation_context;

    return (
      <PageLayout title="">
        <div className="max-w-lg mx-auto px-4 py-8 pb-20">
          {/* === 第一屏：Hero + 非诊断说明 + 筛查状态 === */}
          <section id="hero" className="mb-10">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#6B4C9A] flex items-center justify-center text-white text-xl font-bold mb-3">
                小酷
              </div>
              <h1 className="text-xl font-bold text-gray-800 mb-1">
                你的 QM Context Profile
              </h1>
              <p className="text-sm text-gray-500">成人ADHD评估 · 48题</p>
            </div>

            {/* 非诊断声明 */}
            <div className="bg-purple-50 rounded-xl p-4 mb-6 text-xs text-gray-600 leading-relaxed">
              <p className="font-medium text-[#6B4C9A] mb-2">重要说明</p>
              <p>
                这份报告是基于你自我回答的结构化观察，<strong>不是诊断</strong>。
                它的作用是帮你更清楚地看见自己的模式，以及为可能的专业评估准备资料。
                ADHD的诊断需要专业人员结合发展史、多情境和功能影响综合判断。
              </p>
            </div>

            {/* 筛查状态卡 V01 */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6">
              <h3 className="text-base font-medium text-gray-800 mb-3">
                筛查总览
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">官方筛查模块</div>
                  <div className="text-sm font-medium text-gray-700">未启用</div>
                  <div className="text-xs text-gray-400 mt-1">
                    ASRS 模块需项目方另行配置
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">功能影响</div>
                  <div className="text-sm font-medium text-gray-700">
                    {impact.mean.toFixed(1)} / 4
                  </div>
                  <div className="text-xs text-gray-400 mt-1">6领域均值</div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                官方筛查模块需由项目方另行配置经批准的ASRS版本。
                当前结果呈现QM 48题扩展画像。
              </p>
            </div>

            {/* 支持矩阵结论 */}
            <div
              className="rounded-xl p-5 mb-6"
              style={{ backgroundColor: `${PRIMARY_COLOR}15` }}
            >
              <h3 className="text-base font-medium text-[#6B4C9A] mb-2">
                {result.support_matrix_cell.headline}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {result.support_matrix_cell.description}
              </p>
            </div>
          </section>

          {/* === 第二屏：核心症状 + 执行功能 + 任务生命周期 === */}
          <section id="core-exec" className="mb-10">
            {/* V02 Core Symptom Bars */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6">
              <h3 className="text-base font-medium text-gray-800 mb-4">
                核心症状自评轮廓
              </h3>
              <div className="space-y-4">
                {[
                  { name: "注意力", score: core.inattention_mean, count: core.inattention_frequent_count, total: 9 },
                  { name: "多动", score: core.hyperactivity_mean, count: core.hyperactivity_frequent_count, total: 5 },
                  { name: "冲动", score: core.impulsivity_mean, count: core.impulsivity_frequent_count, total: 4 },
                ].map((item) => (
                  <div key={item.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{item.name}</span>
                      <span className="text-gray-500">{item.score.toFixed(1)} / 4</span>
                    </div>
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(item.score / 4) * 100}%`,
                          backgroundColor: PRIMARY_COLOR,
                        }}
                      />
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      自评"经常/非常经常" {item.count} 题（共{item.total}题）
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-4">
                以上为自我报告频率，不等于临床诊断标准。
                {VISUAL_POSITION_DISCLAIMER}
              </p>
            </div>

            {/* V03 Executive Function Heatmap */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6">
              <h3 className="text-base font-medium text-gray-800 mb-2">
                执行功能画像
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                把"注意力差"拆成8个具体环节，看看卡在哪一步
              </p>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { key: "start", name: "启动", score: execFn.start },
                  { key: "prioritize", name: "优先级", score: execFn.prioritize },
                  { key: "time", name: "时间感", score: execFn.time },
                  { key: "workingMemory", name: "工作记忆", score: execFn.workingMemory },
                  { key: "switch", name: "切换", score: execFn.switch },
                  { key: "sustain", name: "持续", score: execFn.sustain },
                  { key: "organize", name: "组织", score: execFn.organize },
                  { key: "finish", name: "收尾", score: execFn.finish },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="aspect-square rounded-lg flex flex-col items-center justify-center p-2"
                    style={{ backgroundColor: getScoreColor(item.score) + "30" }}
                  >
                    <div className="text-xs font-medium text-gray-700 mb-1">
                      {item.name}
                    </div>
                    <div className="text-sm font-bold" style={{ color: PRIMARY_COLOR }}>
                      {item.score}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* V04 Task Lifecycle */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6">
              <h3 className="text-base font-medium text-gray-800 mb-4">
                任务生命周期卡点
              </h3>
              <div className="flex items-center justify-between">
                {[
                  { name: "启动", score: execFn.start, color: PRIMARY_COLOR },
                  { name: "持续", score: execFn.sustain, color: "#8B6FC2" },
                  { name: "切换", score: execFn.switch, color: "#A78BD1" },
                  { name: "收尾", score: execFn.finish, color: "#C4AFE0" },
                ].map((stage, idx) => (
                  <div key={stage.name} className="flex-1 text-center relative">
                    <div
                      className="w-12 h-12 mx-auto rounded-full flex items-center justify-center text-white text-sm font-medium"
                      style={{
                        backgroundColor: stage.color,
                        opacity: 0.4 + (stage.score / 4) * 0.6,
                      }}
                    >
                      {stage.score}
                    </div>
                    <div className="text-xs text-gray-600 mt-2">{stage.name}</div>
                    {idx < 3 && (
                      <div
                        className="absolute top-6 left-full w-full h-0.5 -translate-x-1/2"
                        style={{ backgroundColor: "#E5E7EB" }}
                      />
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-4 text-center">
                颜色越深表示该环节的挑战越大
              </p>
            </div>
          </section>

          {/* === 第三屏：功能影响 + 发展 === */}
          <section id="impact-dev" className="mb-10">
            {/* V05 Functional Impact Radar */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6">
              <h3 className="text-base font-medium text-gray-800 mb-2">
                功能影响
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                这些困难对你生活各领域的影响程度
              </p>
              <div className="space-y-3">
                {[
                  { name: "工作/学习", score: impact.work_study },
                  { name: "任务/行政", score: impact.admin_tasks },
                  { name: "关系", score: impact.relationships },
                  { name: "财务/消费", score: impact.finances },
                  { name: "健康规律", score: impact.health_routine },
                  { name: "整体生活质量", score: impact.overall_quality },
                ].map((item) => (
                  <div key={item.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">{item.name}</span>
                      <span className="text-gray-500">{item.score} / 4</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(item.score / 4) * 100}%`,
                          backgroundColor: getScoreColor(item.score),
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* V07 Development Timeline */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6">
              <h3 className="text-base font-medium text-gray-800 mb-4">
                发展时间线
              </h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-3 h-3 rounded-full bg-[#6B4C9A] mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-gray-700">12岁以前</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {dev.childhood_onset_label} · {dev.childhood_external_clues === 2 ? "有外部反馈" : dev.childhood_external_clues === 1 ? "不确定外部反馈" : "无明确外部反馈"}
                    </div>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-3 h-3 rounded-full bg-[#8B6FC2] mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-gray-700">青少年→成年</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {dev.continuity === 2 ? "能观察到核心模式的连续性" : dev.continuity === 1 ? "不确定是否有连续性" : "未观察到明显连续性"}
                    </div>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-3 h-3 rounded-full bg-[#A78BD1] mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-gray-700">当前</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      持续{dev.duration_label} · 出现在{dev.cross_setting_label}
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-4">
                童年记忆可能存在偏差，这不代表什么。专业评估中会一起探索。
              </p>
            </div>
          </section>

          {/* === 第四屏：情绪调节 + 重叠因素 === */}
          <section id="emotion-overlap" className="mb-10">
            {/* V08 Emotion Regulation Panel */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-medium text-gray-800">
                  情绪调节
                </h3>
                <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded">
                  非DSM核心维度
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                常见相关体验，但不是ADHD的核心诊断标准
              </p>
              <div className="space-y-3">
                {[
                  { name: "挫败阈值", score: emotion.frustration_threshold },
                  { name: "恢复速度", score: emotion.recovery_speed },
                  { name: "批评触发", score: emotion.criticism_trigger },
                  { name: "过载", score: emotion.overwhelm },
                  { name: "情绪影响行动", score: emotion.action_impact },
                ].map((item) => (
                  <div key={item.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">{item.name}</span>
                      <span className="text-gray-500">{item.score} / 4</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-400"
                        style={{ width: `${(item.score / 4) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-4">
                情绪调节困难可能和注意力困难同时出现，但原因可能很多，需要综合考虑。
              </p>
            </div>

            {/* V09 Overlap Check Table */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6">
              <h3 className="text-base font-medium text-gray-800 mb-2">
                重叠因素检查
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                以下因素可能和注意力困难有重叠，专业评估中值得一起讨论
              </p>
              <div className="space-y-2">
                {[
                  { name: "睡眠", value: overlap.sleep },
                  { name: "焦虑/压力", value: overlap.anxiety_stress },
                  { name: "低落/疲惫", value: overlap.low_mood_energy },
                  { name: "情绪高涨", value: overlap.elevated_mood },
                  { name: "物质/身体", value: overlap.substance_body },
                  { name: "创伤/环境变化", value: overlap.trauma_environment },
                ].map((item) => {
                  const labels = ["否", "不确定", "是"];
                  const colors = ["bg-green-50 text-green-600", "bg-amber-50 text-amber-600", "bg-rose-50 text-rose-600"];
                  return (
                    <div
                      key={item.name}
                      className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0"
                    >
                      <span className="text-sm text-gray-700">{item.name}</span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${colors[item.value]}`}
                      >
                        {labels[item.value]}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-400 mt-4">
                这些只提示评估议题，不是替代诊断。有重叠不代表注意力困难就是它们引起的。
              </p>
            </div>
          </section>

          {/* === 第五屏：16场景叙事 === */}
          <section id="scenes" className="mb-10">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6">
              <h3 className="text-base font-medium text-gray-800 mb-2">
                12场景热力
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                根据你的回答，以下场景可能最具挑战性
              </p>
              <div className="grid grid-cols-3 gap-2">
                {topScenes.slice(0, 12).map((item: any) => (
                  <div
                    key={item.scene.id}
                    className="aspect-square rounded-lg flex flex-col items-center justify-center p-2 text-center"
                    style={{ backgroundColor: getScoreColor(item.challenge.total) + "25" }}
                  >
                    <div className="text-lg mb-1">{item.scene.icon}</div>
                    <div className="text-xs text-gray-700">{item.scene.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* === 第六屏：小酷耳语 === */}
          <section id="whispers" className="mb-10">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 rounded-full bg-[#6B4C9A] flex items-center justify-center text-white text-xs font-bold mr-2">
                  小酷
                </div>
                <h3 className="text-base font-medium text-gray-800">小酷耳语</h3>
              </div>
              <div className="space-y-5">
                {selectedWhispers.map((w, idx) => (
                  <div key={w.id} className="bg-purple-50/50 rounded-lg p-4">
                    <div className="text-sm text-gray-700 font-medium mb-2">
                      💭 {w.friction}
                    </div>
                    <div className="text-xs text-gray-500 mb-2">
                      卡在：{w.task_stage} · {w.scene}
                    </div>
                    <div className="text-xs text-gray-600 mb-2">
                      💡 {w.reframe}
                    </div>
                    <div className="text-xs text-[#6B4C9A] mb-2">
                      🧪 试试：{w.experiment}
                    </div>
                    <div className="text-xs text-gray-400 mb-2">
                      ⚠️ {w.boundary}
                    </div>
                    <div className="text-xs text-gray-600 italic">
                      ❓ {w.question}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* === 第七屏：Story Mirror 人物 === */}
          <section id="story-mirror-people" className="mb-10">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6">
              <h3 className="text-base font-medium text-gray-800 mb-2">
                Story Mirror · 人物
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                这些故事被选中，是因为某些场景与你本次报告的困难相似；
                这不表示你与TA有相同诊断或人生路径。
              </p>
              <div className="space-y-4">
                {selectedPeople.map((p) => (
                  <div key={p.id} className="border border-gray-100 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-gray-800">{p.name_cn}</div>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        p.disclosure_class === 'verified_adhd_disclosure'
                          ? 'bg-green-50 text-green-600'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {p.disclosure_class === 'verified_adhd_disclosure' ? '公开披露' : '行为镜像'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mb-2">
                      {p.field} · {p.culture_region}
                    </div>
                    <div className="text-xs text-gray-500 mb-3">
                      {p.public_story_summary}
                    </div>
                    <div className="text-xs text-gray-400">
                      来源状态：{p.review_status === 'public_ready' ? '已审核' : p.review_status === 'source_review_required' ? '需来源审核' : '草稿'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* === 第八屏：Story Mirror 影视 === */}
          <section id="story-mirror-media" className="mb-10">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6">
              <h3 className="text-base font-medium text-gray-800 mb-2">
                Story Mirror · 影视与故事
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                这些作品可以作为理解自己体验的叙事镜像，不代表角色有ADHD。
              </p>
              <div className="space-y-4">
                {selectedMedia.map((m) => (
                  <div key={m.id} className="border border-gray-100 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-gray-800">{m.title_cn}</div>
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                        {m.type}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mb-2">{m.summary}</div>
                    <div className="text-xs text-[#6B4C9A]">
                      镜像角度：{m.mirror_angles.join('、')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* === 第九屏：7天摩擦日志 === */}
          <section id="friction-log" className="mb-10">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6">
              <h3 className="text-base font-medium text-gray-800 mb-2">
                7天摩擦日志
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                用7天时间验证你的观察，而不是被标签定义
              </p>
              <div className="bg-purple-50/50 rounded-lg p-4">
                <p className="text-sm text-gray-700 mb-3">📋 每天记录3个信息：</p>
                <ol className="text-xs text-gray-600 space-y-2 list-decimal pl-4">
                  <li><strong>场景：</strong>你在做什么？在哪？和谁？</li>
                  <li><strong>摩擦：</strong>哪里卡住了？启动难/分心/烦躁/忘事？</li>
                  <li><strong>什么帮到了你：</strong>那天有没有什么方法让事情变容易了一点？</li>
                </ol>
              </div>
              <p className="text-xs text-gray-400 mt-4">
                7天后回头看，你可能会发现规律，也可能发现有些时候其实没那么难。
              </p>
            </div>
          </section>

          {/* === 第十屏：支持策略矩阵 === */}
          <section id="support-strategies" className="mb-10">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6">
              <h3 className="text-base font-medium text-gray-800 mb-4">
                支持策略方向
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: '🏠', name: '环境支持', desc: '减少干扰，优化空间' },
                  { icon: '📋', name: '任务设计', desc: '拆解步骤，降低门槛' },
                  { icon: '⏰', name: '时间外化', desc: '计时器，时间块' },
                  { icon: '🔔', name: '提醒系统', desc: '清单，自动化提醒' },
                  { icon: '🔄', name: '减少切换', desc: '集中处理同类任务' },
                  { icon: '🏃', name: '身体调节', desc: '运动，唤醒水平' },
                  { icon: '💬', name: '沟通边界', desc: '提前说明，减少误解' },
                  { icon: '📝', name: '专业支持', desc: '心理师，执行功能教练' },
                ].map((item) => (
                  <div
                    key={item.name}
                    className="bg-gray-50 rounded-lg p-3"
                  >
                    <div className="text-lg mb-1">{item.icon}</div>
                    <div className="text-sm font-medium text-gray-700">{item.name}</div>
                    <div className="text-xs text-gray-500">{item.desc}</div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-4">
                策略是实验，不是处方。可以从1-2个开始试试，看看哪些对你有用。
              </p>
            </div>
          </section>

          {/* === 第十一屏：专业评估准备 === */}
          <section id="assessment-prep" className="mb-10">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6">
              <h3 className="text-base font-medium text-gray-800 mb-2">
                专业评估准备表
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                如果你打算找专业心理师聊聊，这份清单可以帮你准备
              </p>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-xs text-gray-500 mb-1">最困扰的3个场景</div>
                  <div className="text-gray-700">
                    {result.assessment_prep.top_bothering_scenes.join('、') || '待补充'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">执行功能最卡的环节</div>
                  <div className="text-gray-700">
                    {result.assessment_prep.executive_stuck_points.join('、')}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">功能影响领域</div>
                  <div className="text-gray-700">
                    {result.assessment_prep.functional_impact_areas.join('、')}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">12岁前线索</div>
                  <div className="text-gray-700">{result.assessment_prep.childhood_clues}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">跨情境</div>
                  <div className="text-gray-700">{result.assessment_prep.cross_setting}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">值得讨论的重叠因素</div>
                  <div className="text-gray-700">
                    {result.assessment_prep.overlap_items.join('、')}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">可以问专业人员的3个问题</div>
                  <ul className="text-gray-700 list-disc pl-4 text-xs">
                    {result.assessment_prep.questions_to_professional.map((q, i) => (
                      <li key={i} className="mb-1">{q}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* 转介信息 */}
            <div
              className="rounded-xl p-5 mb-6"
              style={{ backgroundColor: `${PRIMARY_COLOR}10` }}
            >
              <h3 className="text-base font-medium text-[#6B4C9A] mb-3">
                专业支持
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                {result.support_priority === 'professional_assessment'
                  ? '这份结果不能告诉你是否有ADHD，但已经提供了值得带去专业评估的线索。'
                  : '如果你想更深入地了解自己的困难，可以考虑寻求专业支持。'}
              </p>
              <div className="bg-white rounded-lg p-4 space-y-2">
                <div className="text-sm font-medium text-gray-800">
                  {REFERRAL_INFO.organization}
                </div>
                <div className="text-xs text-gray-600">
                  📞 热线：{REFERRAL_INFO.hotline_primary}（主）/ {REFERRAL_INFO.hotline_backup}（备）
                </div>
                <div className="text-xs text-gray-600">
                  💬 微信客服：{REFERRAL_INFO.wechat}
                </div>
              </div>
            </div>
          </section>

          {/* === 第十二屏：循证治疗教育（高层级） === */}
          <section id="treatment-edu" className="mb-10">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6">
              <h3 className="text-base font-medium text-gray-800 mb-3">
                关于支持选项
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                成人注意力困难的支持可能包括以下方向，具体需要和专业人员一起评估：
              </p>
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm font-medium text-gray-700 mb-1">🧠 专业评估</div>
                  <div className="text-xs text-gray-500">
                    由经过训练的心理师或精神科医生进行全面评估，了解困难的原因和程度
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm font-medium text-gray-700 mb-1">💬 心理/行为策略</div>
                  <div className="text-xs text-gray-500">
                    认知行为疗法、执行功能教练、正念等，可以帮助发展应对策略
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm font-medium text-gray-700 mb-1">🏠 环境调整</div>
                  <div className="text-xs text-gray-500">
                    优化工作和生活环境，减少干扰，设计适合自己的系统和工具
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm font-medium text-gray-700 mb-1">💊 药物可能是选项</div>
                  <div className="text-xs text-gray-500">
                    在合格医疗人员评估下，药物治疗可能是一个选项。
                    具体用药需要医生评估后决定，本测评不提供药物建议。
                  </div>
                </div>
              </div>
              <p className="text-xs text-rose-500 mt-4">
                ⚠️ AI不提供诊断、开药、具体药物推荐、剂量建议或开始/停药指导。
              </p>
            </div>
          </section>

          {/* === 第十三屏：结果边界与信心说明 === */}
          <section id="confidence" className="mb-10">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6">
              <h3 className="text-base font-medium text-gray-800 mb-3">
                结果的边界
              </h3>
              <ul className="text-xs text-gray-500 space-y-2">
                {result.confidence_notes.map((note, i) => (
                  <li key={i} className="flex items-start">
                    <span className="text-[#6B4C9A] mr-2">·</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* === 底部：导出 / 复测 / 和小酷聊 === */}
          <section id="actions" className="mb-10">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6">
              <h3 className="text-base font-medium text-gray-800 mb-4">
                保存与分享
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {EXPORT_CONFIGS.map((config) => (
                  <button
                    key={config.format}
                    onClick={() => handleExport(config.format)}
                    disabled={isExporting}
                    className="flex flex-col items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="text-2xl mb-1">{config.icon}</div>
                    <div className="text-xs font-medium text-gray-700">
                      {config.label}
                    </div>
                  </button>
                ))}
              </div>
              {isExporting && (
                <p className="text-xs text-gray-400 text-center mt-3">
                  正在生成...
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleRestart}
                className="py-3 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50"
              >
                重新测试
              </button>
              <button
                className="py-3 bg-[#6B4C9A] text-white rounded-xl text-sm font-medium hover:bg-[#5a3f85]"
              >
                和小酷聊结果
              </button>
            </div>

            <button
              onClick={goToAssessments}
              className="w-full py-3 mt-3 text-sm text-gray-400 hover:text-gray-600"
            >
              返回测评列表
            </button>
          </section>

          {/* 证据与版本说明 */}
          <div className="text-center text-xs text-gray-400 space-y-1">
            <p>QM AI 成人ADHD评估 v4.0 · {EVIDENCE_SUMMARY.version_note}</p>
            <p>
              循证来源：{EVIDENCE_SUMMARY.total_references} 项 · 上次审核 {EVIDENCE_SUMMARY.last_audit_date}
            </p>
            <p>{EXPORT_DISCLAIMER.trim()}</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  // fallback
  return null;
}
