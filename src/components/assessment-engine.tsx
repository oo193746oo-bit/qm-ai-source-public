'use client';

import { useState, useMemo, useEffect } from 'react';
import { AssessmentInfo, getAdlerPractice } from '@/lib/assessments/data';
import Link from 'next/link';
import { savePendingContext } from '@/lib/context/pending-context';

interface AssessmentEngineProps {
  assessment: AssessmentInfo;
}

// ============================================================
// 客户端轻量信息防火墙（仅挡姓名与 CASE 编号，不含内部字典）
// ⚠️ 本函数刻意保持轻量，不引入服务端 internal-firewall.ts 的完整词典，
//    以避免内部姓名映射泄露到前端 bundle。
// ============================================================

function clientFirewallScan(text: string): string {
  if (!text || typeof text !== 'string') return text || '';
  let result = text;
  // 姓名
  result = result.replace(/\b(Susan|Candice|Christy)\b/gi, '***');
  result = result.replace(/陈瑜倩/g, '***');
  // CASE 编号
  result = result.replace(/CASE[_-]\d+(?:[–\-~至到]\d+)?/gi, '[内部编号已隐藏]');
  result = result.replace(/SUSAN_CASE[_-]\w+/gi, '[内部编号已隐藏]');
  return result;
}


type AnswerValue = 0 | 1 | 2 | 3 | 4 | 5;

const likertLabels: Record<string, string[]> = {
  '1-5': ['非常不认同', '不太认同', '中立', '比较认同', '非常认同'],
  '0-4': ['很不像现在的我', '比较不像我', '有时像我', '比较像我', '很像现在的我'],
};

export default function AssessmentEngine({ assessment }: AssessmentEngineProps) {
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [finished, setFinished] = useState(false);

  const currentQuestion = assessment.questions[currentIndex];
  const totalQuestions = assessment.questions.length;
  const progress = ((currentIndex + 1) / totalQuestions) * 100;

  // 计算各维度得分
  const dimensionScores = useMemo(() => {
    const scores: Record<string, { raw: number; count: number; percentage: number }> = {};
    const scale = assessment.scoring.scale || '1-5';
    const min = scale === '0-4' ? 0 : 1;
    const max = scale === '0-4' ? 4 : 5;

    assessment.dimensions.forEach((dim) => {
      scores[dim.code] = { raw: 0, count: 0, percentage: 0 };
    });

    assessment.questions.forEach((q) => {
      const ans = answers[q.id];
      if (ans !== undefined) {
        const dimCode = q.dimension;
        const score = q.reverse ? (max + min - ans) : ans;
        scores[dimCode].raw += score;
        scores[dimCode].count += 1;
      }
    });

    Object.keys(scores).forEach((code) => {
      if (scores[code].count > 0) {
        scores[code].percentage = Math.round(
          ((scores[code].raw / scores[code].count - min) / (max - min)) * 100,
        );
      }
    });

    return scores;
  }, [answers, assessment]);

  const sortedDimensions = useMemo(() => {
    return [...assessment.dimensions].sort(
      (a, b) => (dimensionScores[b.code]?.percentage || 0) - (dimensionScores[a.code]?.percentage || 0),
    );
  }, [assessment.dimensions, dimensionScores]);

  // 带结果找小酷：写入跨模块上下文桥（一次性消费）
  const handleTalkResult = () => {
    const dimsDesc = sortedDimensions
      .map((d) => {
        const s = dimensionScores[d.code];
        return s ? `${d.name} ${s.percentage}%` : null;
      })
      .filter(Boolean)
      .slice(0, 3)
      .join('，');
    savePendingContext({
      source: 'assessment',
      summary:
        `我刚做完「${assessment.title}」自我探索测评，倾向比较明显的是：${dimsDesc || '各维度较为均衡'}。` +
        `这只是自我觉察参考，不是心理诊断。想和你聊聊我的测评体会、结果带来的感悟，以及我当下的感受。`,
      payload: { assessment: assessment.id, dimensions: dimsDesc },
    });
    window.location.href = '/chat';
  };

  // MBTI 特殊处理
  const mbtiResult = useMemo(() => {
    if (assessment.id !== 'mbti') return null;
    const pairs = [
      ['E', 'I'],
      ['S', 'N'],
      ['T', 'F'],
      ['J', 'P'],
    ];
    let type = '';
    pairs.forEach(([a, b]) => {
      const scoreA = dimensionScores[a]?.percentage || 50;
      const scoreB = dimensionScores[b]?.percentage || 50;
      type += scoreA >= scoreB ? a : b;
    });
    return type;
  }, [assessment.id, dimensionScores]);

  // 阿德勒指数特殊计算
  const adlerResult = useMemo(() => {
    if (assessment.id !== 'adler-index') return null;
    const scores: Record<string, number> = {};
    const maxScores: Record<string, number> = {};
    assessment.dimensions.forEach(dim => {
      const dimQuestions = assessment.questions.filter(q => q.dimension === dim.code);
      maxScores[dim.code] = dimQuestions.length * 4;
      scores[dim.code] = dimQuestions.reduce((sum: number, q) => {
        const ans = answers[q.id];
        const val = typeof ans === 'number' ? ans : 0;
        return sum + val;
      }, 0);
    });
    const total = Object.values(scores).reduce((a, b) => a + b, 0);

    const dimCodes = Object.keys(scores);
    const maxVal = Math.max(...dimCodes.map(id => scores[id]));
    const minVal = Math.min(...dimCodes.map(id => scores[id]));
    const highest = dimCodes.filter(code => scores[code] === maxVal);
    const lowest = dimCodes.filter(code => scores[code] === minVal);

    const getLevel = (score: number, dimCode: string): string => {
      const ratio = score / (maxScores[dimCode] || 24);
      if (ratio <= 1/3) return '正在探索';
      if (ratio <= 2/3) return '正在练习';
      return '相对稳定';
    };

    const totalRatio = total / (assessment.scoring.max || 96);
    const totalLevel = totalRatio <= 1/3 ? '起步探索' : totalRatio <= 2/3 ? '练习与重构' : '较稳定运用';

    const keywords: Record<string, string> = {
      A: '正在把选择拿回自己手里',
      B: '正在学习关心，但不替别人负责',
      C: '正在把自卑变成勇气',
      D: '正在重新找到与世界的连接',
    };
    const mainKeyword = lowest.length > 0 ? keywords[lowest[0]] || '正在走属于自己的路' : '正在走属于自己的路';

    const lowestCode = lowest[0] || 'A';
    const dimName = assessment.dimensions.find(d => d.code === lowestCode)?.name || '';
    const practice = getAdlerPractice(lowestCode);

    return { scores, maxScores, total, highest, lowest, getLevel, totalLevel, mainKeyword, lowestCode, dimName, practice };
  }, [assessment, answers]);

  const handleAnswer = (value: AnswerValue) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));

    setTimeout(() => {
      if (currentIndex < totalQuestions - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setFinished(true);
      }
    }, 200);
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleRestart = () => {
    setAnswers({});
    setCurrentIndex(0);
    setFinished(false);
  };

  // 起始页
  if (!started) {
    return (
      <div className="pb-12 -mx-4 sm:-mx-6 md:-mx-8 -mt-6 md:-mt-8 px-4 sm:px-6 md:px-8 pt-4 md:pt-6" style={{ background: "var(--qm-gradient-soft)", minHeight: "calc(100dvh - 56px)" }}>
        <div className="max-w-xl md:max-w-2xl mx-auto">

          <div className="rounded-3xl p-6 md:p-8 shadow-sm qm-card">
            <div
              className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center text-2xl md:text-3xl mb-5 md:mb-6 shadow-md"
              style={{ background: "var(--qm-gradient-tech)" }}
            >
              {assessment.icon}
            </div>
            <h1 className="text-xl md:text-2xl font-semibold mb-2" style={{ color: "var(--qm-ink-800)" }}>
              {assessment.title}
            </h1>
            <p className="mb-5 md:mb-6 text-sm md:text-base" style={{ color: "var(--qm-indigo-600)", fontWeight: 500 }}>
              {assessment.subtitle}
            </p>
            <p className="text-sm mb-6 leading-relaxed" style={{ color: "var(--qm-ink-600)" }}>
              {assessment.description}
            </p>

            <div className="flex items-center gap-6 text-sm mb-8" style={{ color: "var(--qm-ink-500)" }}>
              <span className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                </svg>
                {assessment.questionCount} 题
              </span>
              <span className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                {assessment.duration}
              </span>
            </div>

            <div
              className="p-4 rounded-2xl mb-6"
              style={{ background: "var(--qm-info-bg)" }}
            >
              <p className="text-xs md:text-sm leading-relaxed" style={{ color: "var(--qm-info)" }}>
                ⚠️ 本测评仅用于自我探索和了解自己，不能替代专业诊断。
                答案没有对错之分，根据自己最真实的感受选择即可。
              </p>
            </div>

            <button
              onClick={() => setStarted(true)}
              className="w-full py-4 rounded-2xl text-white font-medium text-base transition-all hover:scale-[1.01] active:scale-[0.99] shadow-md min-h-[48px]"
              style={{ background: "var(--qm-gradient-tech)" }}
            >
              开始测评
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 结果页
  if (finished) {
    return (
      <div className="pb-12 -mx-4 sm:-mx-6 md:-mx-8 -mt-6 md:-mt-8 px-4 sm:px-6 md:px-8 pt-4 md:pt-6" style={{ background: "var(--qm-gradient-soft)", minHeight: "calc(100dvh - 56px)" }}>
        <div className="max-w-xl md:max-w-3xl mx-auto">

          <div className="rounded-3xl p-6 md:p-8 shadow-sm mb-6 qm-card">
            <div className="text-center mb-6 md:mb-8">
              <div className="text-3xl md:text-4xl mb-3">✨</div>
              <h1 className="text-xl md:text-2xl font-semibold mb-2" style={{ color: "var(--qm-ink-800)" }}>
                {assessment.id === 'adler-index' ? '你的成长画像' : '测评完成'}
              </h1>
              <p className="text-sm" style={{ color: "var(--qm-ink-500)" }}>
                {assessment.id === 'adler-index'
                  ? '基于此刻的回答，看看你现在如何面对选择、关系、成长与连接'
                  : assessment.title}
              </p>
              <p className="text-xs mt-2 px-3 py-1 rounded-full inline-block" style={{ color: "var(--qm-ink-400)", background: "var(--qm-line-100)" }}>
                ⚠️ 结果仅本次浏览有效，刷新后不保留
              </p>
            </div>

            {/* MBTI 特殊结果展示 */}
            {mbtiResult && (
              <div
                className="text-center p-5 md:p-6 rounded-2xl mb-6 md:mb-8"
                style={{ background: "var(--qm-gradient-soft)" }}
              >
                <p className="text-sm mb-2" style={{ color: "var(--qm-ink-500)" }}>
                  你的性格类型是
                </p>
                <div
                  className="text-4xl md:text-5xl font-bold mb-3"
                  style={{
                    background: "var(--qm-gradient-tech)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {mbtiResult}
                </div>
                <p className="text-xs" style={{ color: "var(--qm-ink-500)" }}>
                  这是你的自然偏好倾向，不是固定标签
                </p>
              </div>
            )}

            {/* 阿德勒指数专属结果展示 */}
            {assessment.id === 'adler-index' && adlerResult && (
              <div className="mb-6 md:mb-8 p-5 md:p-6 rounded-2xl" style={{ background: "var(--qm-gradient-soft)" }}>
                <div className="text-center mb-4">
                  <p className="text-xs mb-2" style={{ color: "var(--qm-ink-500)" }}>
                    从这次回答看，你现在的成长画像是
                  </p>
                  <div className="text-xl md:text-2xl font-semibold mb-2" style={{ color: "var(--qm-ink-800)" }}>
                    {adlerResult.mainKeyword}
                  </div>
                  <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs" style={{ background: "var(--qm-purple-100)", color: "var(--qm-purple-700)" }}>
                    总分 {adlerResult.total} / {assessment.scoring.max} · {adlerResult.totalLevel}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <div className="p-4 rounded-xl bg-white/70 border border-[var(--qm-line-100)]">
                    <div className="text-xs mb-1" style={{ color: "var(--qm-ink-500)" }}>💪 比较有力量的方向</div>
                    <div className="font-semibold text-sm" style={{ color: "var(--qm-ink-800)" }}>
                      {assessment.dimensions.find(d => d.code === adlerResult.highest[0])?.name}
                    </div>
                    <div className="text-xs mt-1" style={{ color: "var(--qm-purple-700)" }}>
                      {adlerResult.scores[adlerResult.highest[0]]}分 / {adlerResult.maxScores[adlerResult.highest[0]]}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-white/70 border border-[var(--qm-line-100)]">
                    <div className="text-xs mb-1" style={{ color: "var(--qm-ink-500)" }}>🌱 最值得练习的方向</div>
                    <div className="font-semibold text-sm" style={{ color: "var(--qm-ink-800)" }}>
                      {assessment.dimensions.find(d => d.code === adlerResult.lowest[0])?.name}
                    </div>
                    <div className="text-xs mt-1" style={{ color: "var(--qm-amber-600)" }}>
                      {adlerResult.scores[adlerResult.lowest[0]]}分 / {adlerResult.maxScores[adlerResult.lowest[0]]}
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/70 border border-[var(--qm-line-100)]">
                  <div className="text-sm font-medium mb-2" style={{ color: "var(--qm-ink-800)" }}>
                    📝 7天阿德勒练习 · {adlerResult.practice.title}
                  </div>
                  <div className="text-sm leading-relaxed mb-3" style={{ color: "var(--qm-ink-600)" }}>
                    {adlerResult.practice.description}
                  </div>
                  <div className="text-xs space-y-1" style={{ color: "var(--qm-ink-600)" }}>
                    {adlerResult.practice.steps.slice(0, 3).map((step, i) => (
                      <div key={i} className="flex gap-2">
                        <span style={{ color: "var(--qm-indigo-600)" }}>{i + 1}.</span>
                        <span>{step.replace(/第\d天：/, '')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 维度得分 */}
            <h2 className="font-semibold text-lg mb-5" style={{ color: "var(--qm-ink-800)" }}>
              {assessment.id === 'adler-index' ? '四维画像' : '各维度结果'}
            </h2>

            <div className="space-y-4 mb-6 md:mb-8">
              {sortedDimensions.map((dim) => {
                const score = dimensionScores[dim.code]?.percentage || 0;
                let level = assessment.scoring.labels[0];
                if (score >= 80) level = assessment.scoring.labels[assessment.scoring.labels.length - 1];
                else if (score >= 60) level = assessment.scoring.labels[assessment.scoring.labels.length - 2] || assessment.scoring.labels[assessment.scoring.labels.length - 1];
                else if (score >= 40) level = assessment.scoring.labels[Math.floor(assessment.scoring.labels.length / 2)];
                else if (score >= 20) level = assessment.scoring.labels[1];

                return (
                  <div key={dim.code}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: "var(--qm-gradient-tech)" }}></div>
                        <span className="font-medium text-sm" style={{ color: "var(--qm-ink-800)" }}>
                          {dim.name}
                        </span>
                      </div>
                      <span className="text-xs" style={{ color: "var(--qm-ink-500)" }}>
                        {level} · {score}%
                      </span>
                    </div>
                    <div
                      className="w-full h-2.5 rounded-full overflow-hidden"
                      style={{ background: "var(--qm-line-100)" }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{ width: `${score}%`, background: "var(--qm-gradient-tech)" }}
                      ></div>
                    </div>
                    <p className="text-xs mt-1.5 ml-5" style={{ color: "var(--qm-ink-500)" }}>
                      {dim.description}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* 温馨提示 */}
            <div
              className="p-4 rounded-2xl mb-6"
              style={{ background: "var(--qm-info-bg)" }}
            >
              <p className="text-xs md:text-sm leading-relaxed" style={{ color: "var(--qm-info)" }}>
                💡 {assessment.resultNote}
              </p>
            </div>

            {/* 阿德勒指数特有内容 */}
            {assessment.id === 'adler-index' && adlerResult && (
              <>
                <div className="rounded-2xl p-5 mb-6" style={{ background: "var(--qm-surface-25)", border: "1px solid var(--qm-line-100)" }}>
                  <div className="text-sm font-medium mb-1" style={{ color: "var(--qm-indigo-600)" }}>
                    7 天阿德勒练习 · {adlerResult.practice.title}
                  </div>
                  <div className="text-sm leading-relaxed mb-3" style={{ color: "var(--qm-ink-600)" }}>
                    {adlerResult.practice.description}
                  </div>
                  {adlerResult.practice.dailyQuestion && (
                    <div className="text-xs mb-3 p-3 rounded-xl" style={{ background: "var(--qm-indigo-100)", color: "var(--qm-indigo-600)" }}>
                      每日一问：{adlerResult.practice.dailyQuestion}
                    </div>
                  )}
                  <div className="mt-2 space-y-1.5 text-sm" style={{ color: "var(--qm-ink-600)" }}>
                    {adlerResult.practice.steps.map((step, i) => (
                      <div key={i} className="flex gap-2">
                        <span style={{ color: "var(--qm-indigo-500)", minWidth: "48px" }}>Day {i + 1}</span>
                        <span>{step.replace(/第\d天：/, '')}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-xs text-center px-4 leading-relaxed mb-6" style={{ color: "var(--qm-ink-500)" }}>
                  {assessment.disclaimer || '阿德勒指数是 QM AI 基于阿德勒个体心理学设计的自我探索工具。分数反映的是你此刻的回答与生活倾向，也可能随着时间和情境变化。本工具不是医疗或心理诊断工具，不用于疾病筛查或心理健康分级。'}
                </div>

                <Link
                  href="/knowledge"
                  className="block text-center text-sm mb-6"
                  style={{ color: "var(--qm-indigo-600)" }}
                >
                  去阿德勒专区了解更多 →
                </Link>
              </>
            )}

            {/* 操作按钮 */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleRestart}
                className="flex-1 py-3.5 rounded-2xl font-medium text-sm transition-all hover:scale-[1.01] border min-h-[44px]"
                style={{ borderColor: "rgba(81, 88, 201, 0.3)", color: "var(--qm-indigo-600)", background: "transparent" }}
              >
                重新测评
              </button>
              <button
                onClick={handleTalkResult}
                className="flex-1 py-3.5 rounded-2xl text-white font-medium text-sm text-center transition-all hover:scale-[1.01] shadow-md min-h-[44px] flex items-center justify-center"
                style={{ background: "var(--qm-gradient-tech)" }}
              >
                带结果找小酷聊聊
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 答题页
  return (
    <div className="flex flex-col -mx-4 sm:-mx-6 md:-mx-8 -mt-6 md:-mt-8" style={{ background: "var(--qm-gradient-soft)", minHeight: "calc(100dvh - 56px)" }}>
      {/* 顶部：sticky 进度条 */}
      <div
        className="sticky top-0 z-30 backdrop-blur-sm px-4 sm:px-6 md:px-8 pt-4 pb-3 md:pt-6 md:pb-4 border-b"
        style={{
          background: "rgba(252, 251, 253, 0.9)",
          borderColor: "rgba(240, 235, 243, 0.5)",
        }}
      >
        <div className="max-w-xl md:max-w-2xl lg:max-w-[760px] mx-auto">

          {/* 进度条 */}
          <div>
            <div className="flex items-center justify-between text-xs mb-2" style={{ color: "var(--qm-ink-500)" }}>
              <span>第 {currentIndex + 1} / {totalQuestions} 题</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div
              className="w-full h-2 rounded-full overflow-hidden"
              style={{ background: "var(--qm-line-200)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${progress}%`,
                  background: "var(--qm-gradient-tech)",
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* 题目区 */}
      <div className="flex-1 px-4 sm:px-6 md:px-8 py-6 md:py-8 overflow-y-auto">
        <div className="max-w-xl md:max-w-2xl lg:max-w-[760px] mx-auto">
          <div className="rounded-3xl p-6 md:p-8 shadow-sm qm-card">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-5"
              style={{ background: "var(--qm-gradient-tech)" }}
            >
              {assessment.icon}
            </div>
            <h2
              className="text-lg md:text-xl font-medium mb-6 md:mb-8 leading-relaxed"
              style={{ color: "var(--qm-ink-800)" }}
            >
              {currentQuestion.text}
            </h2>

            {/* 选项 */}
            <div className="space-y-3">
              {(likertLabels[assessment.scoring.scale as keyof typeof likertLabels] || likertLabels['1-5']).map((label: string, index: number) => {
                const value = (assessment.scoring.scale === '0-4' ? index : index + 1) as AnswerValue;
                const isSelected = answers[currentQuestion.id] === value;
                return (
                  <button
                    key={label}
                    onClick={() => handleAnswer(value)}
                    className="w-full py-3.5 px-5 rounded-xl text-left transition-all text-sm flex items-center justify-between min-h-[48px] md:min-h-[52px]"
                    style={{
                      background: isSelected
                        ? "rgba(81, 88, 201, 0.1)"
                        : "rgba(0, 0, 0, 0.02)",
                      border: isSelected ? "2px solid var(--qm-indigo-500)" : "2px solid transparent",
                      color: isSelected ? "var(--qm-indigo-700)" : "var(--qm-ink-800)",
                      fontWeight: isSelected ? 500 : 400,
                    }}
                  >
                    <span>{label}</span>
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                      style={{
                        background: isSelected ? "var(--qm-indigo-500)" : "rgba(0, 0, 0, 0.08)",
                        color: isSelected ? "white" : "var(--qm-ink-500)",
                      }}
                    >
                      {value}
                    </span>
                  </button>
                );
              })}
            </div>

            {currentIndex > 0 && (
              <button
                onClick={handlePrev}
                className="mt-6 text-sm transition-colors hover:opacity-70 min-h-[40px]"
                style={{ color: "var(--qm-ink-500)" }}
              >
                ← 上一题
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 底部安全区 */}
      <div className="safe-bottom-pad" aria-hidden="true" />
    </div>
  );
}
