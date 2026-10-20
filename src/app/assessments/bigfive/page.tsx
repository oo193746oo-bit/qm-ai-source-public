'use client';

import { useState, useMemo } from 'react';
import { BF_QUESTION_BANK } from '@/lib/bigfive-v3/bf-questions-60';
import { computeFullResult, getIntensityBand } from '@/lib/bigfive-v3/bf-scoring';
import { BF_DIMENSIONS } from '@/lib/bigfive-v3/bf-dimensions';
import { BF_COMBINATIONS, getTensionPairsForProfile } from '@/lib/bigfive-v3/bf-combinations';
import { generateFullNarrative, generateSevenDayExperiment, getHighestTwoCooperationNarrative } from '@/lib/bigfive-v3/bf-narrative';
import { DEFAULT_PERSONALIZATION } from '@/lib/bigfive-v3/bf-personalization';
import { CRISIS_REFERRAL, type BFContinuousScores } from '@/lib/bigfive-v3/bf-types';
import type { BFAnswer, BFFullResult, BFModuleId } from '@/lib/bigfive-v3/bf-types';

// QM Big Five 60 | 大五人格特质测评 v3.0 — 结果页
// 升级版入口：/assessments/bigfive
// 包含 11+ 分区：Hero → 五维雷达 → 连续位置 → Profile Signature → 组合关系 → 五维深度 → 现实场景 → 小酷心理耳语 → Story Mirror → 7天观察实验 → 保存/PDF/分享/和小酷聊

const BRAND_COLOR = '#6B4C9A';

export default function BigFiveV3Page() {
  const [phase, setPhase] = useState<'intro' | 'questions' | 'result'>('intro');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<BFAnswer[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);

  const questions = BF_QUESTION_BANK.questions;

  const result = useMemo<BFFullResult | null>(() => {
    if (phase !== 'result' || answers.length === 0 || !endTime) return null;
    return computeFullResult(answers, startTime || undefined, endTime);
  }, [phase, answers, startTime, endTime]);

  const narrative = useMemo(() => {
    if (!result) return null;
    return generateFullNarrative(result, {
      age_band: undefined,
      culture: undefined,
      current_focus: undefined,
    });
  }, [result]);

  const handleStart = () => {
    setStartTime(Date.now());
    setPhase('questions');
    setCurrentQ(0);
  };

  const handleAnswer = (answer: number) => {
    const q = questions[currentQ];
    const newAnswers = [...answers.filter(a => a.questionId !== q.id), { questionId: q.id, answer }];
    setAnswers(newAnswers);

    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      setEndTime(+new Date());
      setPhase('result');
    }
  };

  const handleRestart = () => {
    setPhase('intro');
    setAnswers([]);
    setCurrentQ(0);
    setStartTime(null);
    setEndTime(null);
  };

  // ===== Intro 页 =====
  if (phase === 'intro') {
    return (
      <div className="min-h-screen pb-12" style={{ background: '#FAF5F2' }}>
        <div className="max-w-2xl mx-auto px-4 pt-12">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🧠</div>
            <h1 className="text-2xl font-semibold mb-2" style={{ color: BRAND_COLOR }}>
              QM Big Five 60
            </h1>
            <p className="text-lg mb-1" style={{ color: '#4A4A4A' }}>
              大五人格特质测评
            </p>
            <p className="text-sm" style={{ color: '#71717A' }}>
              v3.0 · 60题 · 约 5-10 分钟
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
            <h2 className="font-semibold mb-3" style={{ color: BRAND_COLOR }}>这是什么</h2>
            <p className="text-sm leading-relaxed" style={{ color: '#4A4A4A' }}>
              大五人格（Big Five / Five-Factor Model）是心理学中被广泛研究的人格特质模型。它把人格分为五个连续维度：开放性（O）、尽责性（C）、外向性（E）、宜人性（A）和负性情绪倾向（N）。
            </p>
            <p className="text-sm leading-relaxed mt-2" style={{ color: '#4A4A4A' }}>
              每个人都在这五个维度上有自己的位置，没有"最好"的组合。这份测评是自我探索的工具，不是诊断。
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
            <h2 className="font-semibold mb-3" style={{ color: BRAND_COLOR }}>你会得到什么</h2>
            <ul className="text-sm space-y-2" style={{ color: '#4A4A4A' }}>
              <li>✦ 五维连续位置画像（非类型标签）</li>
              <li>✦ 你的 Profile Signature（最高两维、张力对等）</li>
              <li>✦ 多个现实场景的特质解读</li>
              <li>✦ 小酷心理耳语（个性化叙事）</li>
              <li>✦ Story Mirror 人物与影视镜像</li>
              <li>✦ 7天自我观察实验</li>
            </ul>
          </div>

          <div className="rounded-2xl p-5 mb-6" style={{ background: 'rgba(107, 76, 154, 0.08)' }}>
            <p className="text-xs leading-relaxed" style={{ color: '#71717A' }}>
              ⚠️ 温馨提示：本测评为QM原创大五人格风格量表，未宣称或暗示任何官方量表授权。
              结果仅供自我探索参考，不构成心理诊断。如果你正经历强烈的情绪困扰，请联系专业心理支持。
            </p>
          </div>

          <button
            onClick={handleStart}
            className="w-full py-4 rounded-2xl text-white font-medium text-lg transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md"
            style={{ background: `linear-gradient(135deg, ${BRAND_COLOR}, #8B6CBA)` }}
          >
            开始测评
          </button>
        </div>
      </div>
    );
  }

  // ===== 答题页 =====
  if (phase === 'questions') {
    const q = questions[currentQ];
    const progress = ((currentQ + 1) / questions.length) * 100;
    const answered = answers.find(a => a.questionId === q.id)?.answer;

    return (
      <div className="min-h-screen pb-12" style={{ background: '#FAF5F2' }}>
        <div className="max-w-2xl mx-auto px-4 pt-8">
          {/* 进度条 */}
          <div className="mb-8">
            <div className="flex justify-between text-xs mb-2" style={{ color: '#71717A' }}>
              <span>第 {currentQ + 1} 题 / 共 {questions.length} 题</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-2 rounded-full" style={{ background: '#E5E5E5' }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${progress}%`, background: BRAND_COLOR }}
              />
            </div>
          </div>

          {/* 题目 */}
          <div className="bg-white rounded-2xl p-8 mb-8 shadow-sm min-h-[200px] flex items-center">
            <p className="text-xl leading-relaxed" style={{ color: '#4A4A4A' }}>
              {q.text}
            </p>
          </div>

          {/* 选项 */}
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(val => (
              <button
                key={val}
                onClick={() => handleAnswer(val)}
                className="w-full py-4 px-5 rounded-xl text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
                style={{
                  background: answered === val ? BRAND_COLOR : 'white',
                  color: answered === val ? 'white' : '#4A4A4A',
                  boxShadow: answered === val ? `0 4px 20px ${BRAND_COLOR}40` : '0 1px 3px rgba(0,0,0,0.05)',
                }}
              >
                <div className="flex items-center justify-between">
                  <span>
                    {val === 1 && '非常不同意'}
                    {val === 2 && '比较不同意'}
                    {val === 3 && '中立 / 不确定'}
                    {val === 4 && '比较同意'}
                    {val === 5 && '非常同意'}
                  </span>
                  <span className="text-sm opacity-70">{val}</span>
                </div>
              </button>
            ))}
          </div>

          {/* 返回按钮 */}
          {currentQ > 0 && (
            <button
              onClick={() => setCurrentQ(currentQ - 1)}
              className="mt-6 w-full py-3 text-sm"
              style={{ color: '#71717A' }}
            >
              ← 上一题
            </button>
          )}
        </div>
      </div>
    );
  }

  // ===== 结果页 =====
  if (phase === 'result' && result && narrative) {
    const scores = result.continuous_scores;
    const sig = result.profile_signature;
    const dims = ['O', 'C', 'E', 'A', 'N'] as const;

    return (
      <div className="min-h-screen pb-20" style={{ background: '#FAF5F2' }}>
        <div className="max-w-2xl mx-auto px-4 pt-8">
          {/* Hero */}
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">✨</div>
            <h1 className="text-2xl font-semibold mb-2" style={{ color: BRAND_COLOR }}>
              你的大五人格画像
            </h1>
            <p className="text-sm" style={{ color: '#71717A' }}>
              基于你对 60 道题的回答 · 连续特质模型，不是类型标签
            </p>
          </div>

          {/* 五维雷达图区域（CSS实现）*/}
          <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
            <h2 className="font-semibold mb-4 text-center" style={{ color: BRAND_COLOR }}>
              五维概览
            </h2>
            <div className="flex justify-center mb-6">
              <SimpleRadarChart scores={scores} />
            </div>
            <div className="grid grid-cols-5 gap-2 text-center">
              {dims.map(d => (
                <div key={d}>
                  <div className="text-xs mb-1" style={{ color: BF_DIMENSIONS[d].color }}>
                    {BF_DIMENSIONS[d].name_cn}
                  </div>
                  <div className="text-lg font-semibold" style={{ color: '#4A4A4A' }}>
                    {scores[d]}
                  </div>
                  <div className="text-xs" style={{ color: '#A1A1AA' }}>
                    /100
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 连续位置说明 */}
          <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
            <h2 className="font-semibold mb-3" style={{ color: BRAND_COLOR }}>
              关于连续位置
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: '#4A4A4A' }}>
              分数是你在五个维度上的相对位置（0-100分内部位置），不是人口百分位。
              大五人格是连续谱——没有"你是什么型"，只有"你在每个维度上大概在什么位置"。
            </p>
            <p className="text-sm leading-relaxed mt-2" style={{ color: '#71717A' }}>
              {result.norm_gate.status === 'unapproved' &&
                '⚠️ 当前版本未建立与本题库匹配的常模数据，因此不提供人口百分位对比。以上分数仅为你在本题库内的位置参考。'}
            </p>
          </div>

          {/* Profile Signature */}
          <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
            <h2 className="font-semibold mb-4" style={{ color: BRAND_COLOR }}>
              Profile Signature · 你的画像签名
            </h2>
            <div className="space-y-4">
              <div className="p-4 rounded-xl" style={{ background: 'rgba(155, 127, 214, 0.1)' }}>
                <div className="text-xs mb-1" style={{ color: BRAND_COLOR }}>最高两维</div>
                <div className="text-base font-medium" style={{ color: '#4A4A4A' }}>
                  {sig.highest_2.map(d => BF_DIMENSIONS[d].name_cn).join(' + ')}
                </div>
              </div>
              <div className="p-4 rounded-xl" style={{ background: 'rgba(91, 141, 239, 0.1)' }}>
                <div className="text-xs mb-1" style={{ color: '#5B8DEF' }}>最低两维</div>
                <div className="text-base font-medium" style={{ color: '#4A4A4A' }}>
                  {sig.lowest_2.map(d => BF_DIMENSIONS[d].name_cn).join(' + ')}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(240, 147, 107, 0.1)' }}>
                  <div className="text-xs mb-1" style={{ color: '#F0936B' }}>分差范围</div>
                  <div className="text-lg font-semibold" style={{ color: '#4A4A4A' }}>{sig.spread}</div>
                </div>
                <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(107, 196, 161, 0.1)' }}>
                  <div className="text-xs mb-1" style={{ color: '#6BC4A1' }}>平衡度</div>
                  <div className="text-lg font-semibold" style={{ color: '#4A4A4A' }}>{sig.balance}</div>
                </div>
              </div>
              {sig.tension_pairs.length > 0 && (
                <div className="p-4 rounded-xl" style={{ background: 'rgba(229, 115, 115, 0.1)' }}>
                  <div className="text-xs mb-1" style={{ color: '#E57373' }}>张力维度对</div>
                  <div className="text-base font-medium" style={{ color: '#4A4A4A' }}>
                    {sig.tension_pairs.join(' · ')}
                  </div>
                  <p className="text-xs mt-2" style={{ color: '#71717A' }}>
                    这些维度对之间分差较大，可能是你内在拉扯感的来源之一。
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 最高两维合作 */}
          <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
            <h2 className="font-semibold mb-3" style={{ color: BRAND_COLOR }}>
              你的最高两维如何合作
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: '#4A4A4A' }}>
              {getHighestTwoCooperationNarrative(sig.highest_2[0], sig.highest_2[1])}
            </p>
          </div>

          {/* 五维深度卡片 */}
          <div className="space-y-4 mb-6">
            <h2 className="font-semibold px-1" style={{ color: BRAND_COLOR }}>
              五维深度解读
            </h2>
            {dims.map(d => (
              <DimensionCard key={d} dim={d} score={scores[d]} />
            ))}
          </div>

          {/* 现实场景模块精选 */}
          <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
            <h2 className="font-semibold mb-4" style={{ color: BRAND_COLOR }}>
              现实场景 · 工作与关系
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2" style={{ color: BRAND_COLOR }}>💼 工作场景</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#4A4A4A' }}>
                  你的{BF_DIMENSIONS[sig.highest_2[0]].name_cn}特质在工作中最突出。
                  {BF_DIMENSIONS[sig.highest_2[0]].strength_in_context}
                </p>
                <p className="text-sm leading-relaxed mt-2" style={{ color: '#71717A' }}>
                  可能需要留意的是：{BF_DIMENSIONS[sig.highest_2[0]].cost_in_context}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium mb-2" style={{ color: BRAND_COLOR }}>💞 亲密关系</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#4A4A4A' }}>
                  在关系中，你的{BF_DIMENSIONS['A'].name_cn}和{BF_DIMENSIONS[sig.highest_2[0]].name_cn}
                  的互动方式很重要。{BF_COMBINATIONS.find(c => c.pair.includes('A'))?.narrative?.substring(0, 80)}...
                </p>
              </div>
            </div>
          </div>

          {/* 小酷心理耳语 */}
          <div className="rounded-2xl p-6 mb-6 shadow-sm" style={{ background: `linear-gradient(135deg, ${BRAND_COLOR}15, #F687B315)` }}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">💜</span>
              <h2 className="font-semibold" style={{ color: BRAND_COLOR }}>
                小酷心理耳语
              </h2>
            </div>
            <div className="text-sm leading-loose whitespace-pre-line" style={{ color: '#4A4A4A' }}>
              {narrative.whisper}
            </div>
          </div>

          {/* Story Mirror - 人物 */}
          {narrative.story_mirror_people.length > 0 && (
            <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold" style={{ color: BRAND_COLOR }}>
                  🪞 人物 Story Mirror
                </h2>
                <span className="text-xs" style={{ color: '#A1A1AA' }}>故事镜像，非人格断言</span>
              </div>
              <div className="space-y-3">
                {narrative.story_mirror_people.slice(0, 3).map(p => (
                  <div key={p.id} className="p-4 rounded-xl" style={{ background: '#FAF5F2' }}>
                    <div className="font-medium text-sm mb-1" style={{ color: '#4A4A4A' }}>
                      {p.name_cn} · {p.field}
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: '#71717A' }}>
                      {p.public_story_summary}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {p.behavior_tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(107, 76, 154, 0.1)', color: BRAND_COLOR }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs mt-3" style={{ color: '#A1A1AA' }}>
                ⚠️ Story Mirror 仅做叙事参考，不声称这些公众人物的真实大五人格分数。
              </p>
            </div>
          )}

          {/* Story Mirror - 影视 */}
          {narrative.story_mirror_media.length > 0 && (
            <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold" style={{ color: BRAND_COLOR }}>
                  🎬 影视镜像
                </h2>
                <span className="text-xs" style={{ color: '#A1A1AA' }}>故事对照</span>
              </div>
              <div className="space-y-3">
                {narrative.story_mirror_media.slice(0, 3).map(m => (
                  <div key={m.id} className="p-4 rounded-xl" style={{ background: '#FAF5F2' }}>
                    <div className="font-medium text-sm mb-1" style={{ color: '#4A4A4A' }}>
                      {m.title}
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: '#71717A' }}>
                      {m.why_relevant}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7天观察实验 */}
          <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
            <h2 className="font-semibold mb-3" style={{ color: BRAND_COLOR }}>
              🔬 7天自我观察实验
            </h2>
            <div className="text-sm leading-relaxed whitespace-pre-line" style={{ color: '#4A4A4A' }}>
              {generateSevenDayExperiment(sig)}
            </div>
          </div>

          {/* Response Quality */}
          {result.response_quality.warnings.length > 0 && (
            <div className="bg-amber-50 rounded-2xl p-6 mb-6 border border-amber-200">
              <h3 className="font-medium text-sm mb-2" style={{ color: '#B45309' }}>
                ⚠️ 作答质量提示
              </h3>
              <ul className="text-xs space-y-1" style={{ color: '#92400E' }}>
                {result.response_quality.warnings.map((w, i) => (
                  <li key={i}>· {w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 导出操作区 */}
          <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
            <h2 className="font-semibold mb-4 text-center" style={{ color: BRAND_COLOR }}>
              保存与分享
            </h2>
            <div className="grid grid-cols-3 gap-3">
              <button
                className="py-3 rounded-xl text-sm transition-all hover:scale-105"
                style={{ background: 'rgba(107, 76, 154, 0.1)', color: BRAND_COLOR }}
              >
                📷 保存长图
              </button>
              <button
                className="py-3 rounded-xl text-sm transition-all hover:scale-105"
                style={{ background: 'rgba(107, 76, 154, 0.1)', color: BRAND_COLOR }}
              >
                📄 导出PDF
              </button>
              <button
                className="py-3 rounded-xl text-sm transition-all hover:scale-105"
                style={{ background: 'rgba(107, 76, 154, 0.1)', color: BRAND_COLOR }}
              >
                🔗 分享
              </button>
            </div>
            <p className="text-xs text-center mt-3" style={{ color: '#A1A1AA' }}>
              分享版默认隐私模式，隐藏逐题答案和详细解读
            </p>
          </div>

          {/* 和小酷聊 */}
          <div className="rounded-2xl p-6 mb-6 text-center" style={{ background: `linear-gradient(135deg, ${BRAND_COLOR}, #8B6CBA)` }}>
            <div className="text-3xl mb-2">💬</div>
            <h3 className="text-white font-semibold mb-2">想和小酷聊聊你的结果？</h3>
            <p className="text-white/80 text-sm mb-4">
              关于你的画像、特质、或者任何感受，都可以来找小酷说说话。
            </p>
            <button
              className="px-6 py-2.5 rounded-full bg-white text-sm font-medium transition-all hover:scale-105"
              style={{ color: BRAND_COLOR }}
            >
              去和小酷聊聊 →
            </button>
          </div>

          {/* 重测 */}
          <div className="text-center mb-8">
            <button
              onClick={handleRestart}
              className="text-sm"
              style={{ color: '#71717A' }}
            >
              重新测评
            </button>
          </div>

          {/* 底部声明 */}
          <div className="text-center pb-8">
            <p className="text-xs leading-relaxed" style={{ color: '#A1A1AA' }}>
              QM Big Five 60 · v3.0 · license_status: unlicensed<br />
              本题库为QM原创大五人格风格量表，未宣称任何官方量表授权。<br />
              结果仅供自我探索参考，不构成心理诊断。<br />
              <br />
              如果你正经历情绪危机，可以联系：<br />
              {CRISIS_REFERRAL.org_name}<br />
              热线：{CRISIS_REFERRAL.hotline} · 微信：{CRISIS_REFERRAL.wechat}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ===== 简单雷达图组件（CSS/SVG实现）=====
function SimpleRadarChart({ scores }: { scores: BFContinuousScores }) {
  const dims = ['O', 'C', 'E', 'A', 'N'] as const;
  const size = 240;
  const center = size / 2;
  const maxRadius = 90;
  const colors = { O: '#9B7FD6', C: '#5B8DEF', E: '#F0936B', A: '#6BC4A1', N: '#E57373' };

  // 计算五个顶点的坐标
  const points = dims.map((d, i) => {
    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    const r = (scores[d] / 100) * maxRadius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  });

  // 外层网格
  const gridLevels = [0.25, 0.5, 0.75, 1];
  const gridPolygons = gridLevels.map(level => {
    return dims
      .map((_, i) => {
        const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
        const r = level * maxRadius;
        return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
      })
      .join(' ');
  });

  // 轴线
  const axisLines = dims.map((_, i) => {
    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    return {
      x1: center,
      y1: center,
      x2: center + maxRadius * Math.cos(angle),
      y2: center + maxRadius * Math.sin(angle),
    };
  });

  // 数据多边形
  const dataPolygon = points.map(p => `${p.x},${p.y}`).join(' ');

  // 维度标签位置
  const labelPositions = dims.map((d, i) => {
    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    const labelR = maxRadius + 20;
    return {
      x: center + labelR * Math.cos(angle),
      y: center + labelR * Math.sin(angle),
      text: d,
      color: colors[d],
    };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* 网格 */}
      {gridPolygons.map((poly, i) => (
        <polygon
          key={i}
          points={poly}
          fill="none"
          stroke="#E5E5E5"
          strokeWidth="1"
        />
      ))}
      {/* 轴线 */}
      {axisLines.map((line, i) => (
        <line
          key={i}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          stroke="#E5E5E5"
          strokeWidth="1"
        />
      ))}
      {/* 数据区域 */}
      <polygon
        points={dataPolygon}
        fill={BRAND_COLOR}
        fillOpacity="0.2"
        stroke={BRAND_COLOR}
        strokeWidth="2"
      />
      {/* 数据点 */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill={BRAND_COLOR} />
      ))}
      {/* 维度标签 */}
      {labelPositions.map((label, i) => (
        <text
          key={i}
          x={label.x}
          y={label.y}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="12"
          fontWeight="600"
          fill={label.color}
        >
          {label.text}
        </text>
      ))}
    </svg>
  );
}

// ===== 维度深度卡片 =====
function DimensionCard({ dim, score }: { dim: 'O' | 'C' | 'E' | 'A' | 'N'; score: number }) {
  const d = BF_DIMENSIONS[dim];
  const band = getIntensityBand(score);
  const bandLabel = d.intensity_bands[band];

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ background: d.color }}
          />
          <span className="font-semibold" style={{ color: '#4A4A4A' }}>
            {d.name_cn}
          </span>
          <span className="text-xs" style={{ color: '#A1A1AA' }}>
            {d.name_en}
          </span>
        </div>
        <span className="text-lg font-semibold" style={{ color: d.color }}>
          {score}
        </span>
      </div>

      {/* 分数条 */}
      <div className="w-full h-2 rounded-full mb-4" style={{ background: '#F0F0F0' }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${score}%`, background: d.color }}
        />
      </div>

      <p className="text-xs mb-2" style={{ color: d.color, fontWeight: 500 }}>
        位置：{bandLabel}
      </p>

      <p className="text-xs leading-relaxed mb-3" style={{ color: '#71717A' }}>
        {d.daily_meaning}
      </p>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2 rounded-lg" style={{ background: 'rgba(107, 196, 161, 0.08)' }}>
          <div className="font-medium mb-1" style={{ color: '#6BC4A1' }}>情境资源</div>
          <p style={{ color: '#71717A', fontSize: '11px', lineHeight: 1.6 }}>
            {score >= 50 ? d.strength_in_context.substring(0, 40) + '...' : d.low_strength_in_context.substring(0, 40) + '...'}
          </p>
        </div>
        <div className="p-2 rounded-lg" style={{ background: 'rgba(229, 115, 115, 0.08)' }}>
          <div className="font-medium mb-1" style={{ color: '#E57373' }}>情境成本</div>
          <p style={{ color: '#71717A', fontSize: '11px', lineHeight: 1.6 }}>
            {score >= 50 ? d.cost_in_context.substring(0, 40) + '...' : d.low_cost_in_context.substring(0, 40) + '...'}
          </p>
        </div>
      </div>
    </div>
  );
}
