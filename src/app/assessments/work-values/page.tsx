/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// QM 职业价值观测评 v4.0 — 升级版结果页
// 4 屏+ 信息架构，12 种可视化
// 第一屏：Top3 价值卡 + 8 维雷达 + 一句话 Profile
// 第二屏：Top8 排序 + Intrinsic/Extrinsic 双指数 + Value Map
// 第三屏：28 组 Tension Matrix + Work Environment Fit
// 第四屏以后：职业场景、Trade-off、Value Gap、小酷耳语、Story Mirror、7天实验、面试反问、沟通脚本、Offer比较、导出和小酷聊

'use client';

import React, { useMemo, useState } from 'react';
import type {
  DimensionScore,
  ScoringResult,
  ValuePair,
  EnvFitResult,
  ModuleCode,
  SceneCode,
  WhisperUnit,
  PersonStory,
  MediaStory,
  SevenDayPractice,
} from '@/lib/workvalues-v4/wv-types';
import { DIMENSION_ORDER } from '@/lib/workvalues-v4/wv-types';
import { wvDimensions, getDimensionName, getDimensionColor } from '@/lib/workvalues-v4/wv-dimensions';
import { wvPairMatrix, getTopTensionPairs, getTopSynergyPairs } from '@/lib/workvalues-v4/wv-pair-matrix';
import { wvScenes, recommendScenesByValues } from '@/lib/workvalues-v4/wv-scenes';
import { calcEnvFit, wvEnvParameters, ENV_PARAM_ORDER } from '@/lib/workvalues-v4/wv-env-fit';
import { wvModulePool, selectModules } from '@/lib/workvalues-v4/wv-module-pool';
import { selectPersonalWhispers } from '@/lib/workvalues-v4/wv-whispers';
import { getDiversePeopleStories } from '@/lib/workvalues-v4/wv-personalization';
import { findMediaByValues } from '@/lib/workvalues-v4/wv-story-mirror-media';
import { buildNarrative, generateSevenDayPractice } from '@/lib/workvalues-v4/wv-narrative';
import {
  getRecommendedInterviewQuestions,
  greenRedFlags,
  negotiationScripts,
  communicationTemplates,
} from '@/lib/workvalues-v4/wv-decision-tools';
import { QM_BRAND, qmExportConfig, AI_IDENTITY, REFERRAL_INFO } from '@/lib/workvalues-v4/wv-export';

// ===== 组件 Props =====
interface WorkValuesResultPageProps {
  scoring: ScoringResult;
  currentScene?: SceneCode;
  tradeoffEnabled?: boolean;
  diversityTags?: string[];
}

// ===== 主组件 =====
export default function WorkValuesResultPage({
  scoring,
  currentScene,
  tradeoffEnabled = false,
  diversityTags,
}: WorkValuesResultPageProps) {
  const hasData = !!scoring?.top3?.length;
  const safeScoring = scoring ?? { top3: [], dimensionScores: [], pairTensions: [], rawScores: {}, sortedScores: [] } as any;
  const topDimensions = hasData ? safeScoring.top3.map((s: any) => s.dimension) : [];

  const envFit = useMemo(
    () => hasData ? calcEnvFit(safeScoring.dimensionScores) : { results: [], dominantEnv: null } as any,
    [safeScoring.dimensionScores, hasData],
  );

  const selectedModules = useMemo(
    () => hasData ? selectModules(safeScoring.dimensionScores, tradeoffEnabled, currentScene) : [],
    [safeScoring.dimensionScores, tradeoffEnabled, currentScene, hasData],
  );

  const narrative = useMemo(
    () => hasData ? buildNarrative(safeScoring, wvPairMatrix, envFit, currentScene) : {} as any,
    [safeScoring, envFit, currentScene, hasData],
  );

  const sevenDay = useMemo(
    () => hasData ? generateSevenDayPractice(safeScoring) : { days: [] } as any,
    [safeScoring, hasData],
  );

  const whispers = useMemo(
    () => hasData ? selectPersonalWhispers(topDimensions, currentScene, undefined, 3) : [],
    [topDimensions, currentScene, hasData],
  );

  const peopleStories = useMemo(
    () => hasData ? getDiversePeopleStories(topDimensions, { culture: !!diversityTags, gender: false, careerStage: false }, diversityTags, 3) : [],
    [topDimensions, diversityTags, hasData],
  );

  const mediaStories = useMemo(
    () => hasData ? findMediaByValues(topDimensions, 3) : [],
    [topDimensions, hasData],
  );

  const recommendedScenes = useMemo(
    () => hasData ? recommendScenesByValues(topDimensions).slice(0, 4) : [],
    [topDimensions, hasData],
  );

  const interviewQuestions = useMemo(
    () => hasData ? getRecommendedInterviewQuestions(topDimensions, 2) : [],
    [topDimensions, hasData],
  );

  const [activeTab, setActiveTab] = useState<'core' | 'dynamics' | 'scenes' | 'tools'>('core');

  if (!hasData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-4xl mb-3">🎯</div>
          <p className="text-gray-500 text-sm">请先完成测评，查看结果</p>
          <a
            href="/assessments"
            className="inline-block mt-5 px-5 py-2.5 rounded-xl font-medium text-white transition-all hover:opacity-90"
            style={{ backgroundColor: QM_BRAND.primary }}
          >
            ← 返回测评中心
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 pt-4">
        <a href="/assessments" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-purple-600 transition-colors" aria-label="返回测评中心">← 返回测评中心</a>
      </div>
      {/* 顶部 Hero */}
      <HeroSection scoring={scoring} narrative={narrative} />

      {/* Tab 导航 */}
      <TabNav activeTab={activeTab} onChange={setActiveTab} />

      {/* 内容区域 */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {activeTab === 'core' && (
          <CoreTab scoring={scoring} envFit={envFit} />
        )}
        {activeTab === 'dynamics' && (
          <DynamicsTab scoring={scoring} envFit={envFit} />
        )}
        {activeTab === 'scenes' && (
          <ScenesTab
            scoring={scoring}
            recommendedScenes={recommendedScenes}
            currentScene={currentScene}
          />
        )}
        {activeTab === 'tools' && (
          <ToolsTab
            scoring={scoring}
            sevenDay={sevenDay}
            interviewQuestions={interviewQuestions}
            whispers={whispers}
            peopleStories={peopleStories}
            mediaStories={mediaStories}
          />
        )}
      </div>

      {/* 底部导出 & 和小酷聊 */}
      <FooterSection scoring={scoring} />
    </div>
  );
}

// ===== Hero 头部 =====
function HeroSection({
  scoring,
  narrative,
}: {
  scoring: ScoringResult;
  narrative: ReturnType<typeof buildNarrative>;
}) {
  return (
    <div
      className="text-white py-12 px-4"
      style={{ background: `linear-gradient(135deg, ${QM_BRAND.primary} 0%, #8B5CF6 100%)` }}
    >
      <div className="max-w-4xl mx-auto">
        <p className="text-sm opacity-80 mb-2">QM AI · 职业价值观测评 v4.0</p>
        <h1 className="text-2xl font-bold mb-4">{narrative.headline}</h1>
        <p className="text-base opacity-90 mb-6">{narrative.coreStory}</p>

        {/* Top3 快速预览 */}
        <div className="flex gap-3 flex-wrap">
          {scoring.top3.map((s, i) => (
            <div
              key={s.dimension}
              className="bg-white/20 backdrop-blur rounded-xl px-4 py-3 flex-1 min-w-[120px]"
            >
              <div className="text-xs opacity-75">Top{i + 1}</div>
              <div className="font-semibold">
                {wvDimensions[s.dimension].name}
              </div>
              <div className="text-lg font-bold">{s.score}分</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===== Tab 导航 =====
function TabNav({
  activeTab,
  onChange,
}: {
  activeTab: string;
  onChange: (tab: 'core' | 'dynamics' | 'scenes' | 'tools') => void;
}) {
  const tabs = [
    { key: 'core', label: '核心价值' },
    { key: 'dynamics', label: '价值动态' },
    { key: 'scenes', label: '职业场景' },
    { key: 'tools', label: '工具与对话' },
  ];

  return (
    <div className="bg-white border-b sticky top-0 z-10">
      <div className="max-w-4xl mx-auto flex">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`flex-1 py-4 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'text-purple-700 border-b-2 border-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => onChange(tab.key as any)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ===== 核心价值 Tab =====
function CoreTab({
  scoring,
  envFit,
}: {
  scoring: ScoringResult;
  envFit: EnvFitResult;
}) {
  return (
    <div className="space-y-8">
      {/* Top3 价值卡 */}
      <Section title="你的 Top3 核心价值" subtitle="这些是你在职业选择中最看重的东西">
        <div className="grid gap-4 md:grid-cols-3">
          {scoring.top3.map((s, i) => (
            <ValueCard key={s.dimension} score={s} rank={i + 1} />
          ))}
        </div>
      </Section>

      {/* 8 维雷达图 */}
      <Section title="8 维价值轮廓" subtitle="完整呈现你的职业价值观全貌">
        <RadarChart scores={scoring.dimensionScores} />
      </Section>

      {/* Top8 排序 */}
      <Section title="价值优先级排序" subtitle="从高到低，看看你的价值排序">
        <RankingChart scores={scoring.sortedScores} />
      </Section>

      {/* 双指数 */}
      <Section title="内在价值 & 外在价值" subtitle="两个独立指数，不强制相加为 100%">
        <DualIndexChart
          intrinsic={scoring.intrinsicIndex}
          extrinsic={scoring.extrinsicIndex}
        />
      </Section>

      {/* Value Map */}
      <Section title="Value Map 价值地图" subtitle="X轴：内在↔外在 | Y轴：自我导向↔关系/社会导向">
        <ValueMapChart scores={scoring.dimensionScores} />
      </Section>
    </div>
  );
}

// ===== 价值动态 Tab =====
function DynamicsTab({
  scoring,
  envFit,
}: {
  scoring: ScoringResult;
  envFit: EnvFitResult;
}) {
  const topTensions = getTopTensionPairs(scoring.rawScores, 5);
  const topSynergies = getTopSynergyPairs(scoring.rawScores, 3);

  return (
    <div className="space-y-8">
      {/* Tension Matrix */}
      <Section title="28 组价值组合矩阵" subtitle="看看哪些价值互相促进，哪些容易拉扯">
        <PairMatrixHeatmap scores={scoring.rawScores} />
      </Section>

      {/* Top 协同 */}
      <Section title="你的协同价值" subtitle="这些价值组合通常会互相加强">
        <div className="space-y-4">
          {topSynergies.map(({ pair, note }) => (
            <div key={pair.pair.join('-')} className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="font-semibold text-green-800">
                {wvDimensions[pair.pair[0]].name} × {wvDimensions[pair.pair[1]].name}
              </div>
              <p className="text-sm text-green-700 mt-1">{pair.synergyWhen}</p>
              <p className="text-sm text-green-600 mt-2">{note}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Top 张力 */}
      <Section title="值得留意的价值张力" subtitle="这些组合在某些选择里可能让你纠结">
        <div className="space-y-4">
          {topTensions.map(({ pair, note }) => (
            <div key={pair.pair.join('-')} className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="font-semibold text-amber-800">
                {wvDimensions[pair.pair[0]].name} × {wvDimensions[pair.pair[1]].name}
              </div>
              <p className="text-sm text-amber-700 mt-1">{pair.tensionWhen}</p>
              <p className="text-sm text-amber-600 mt-2">{note}</p>
              <p className="text-sm text-amber-700 mt-2 italic">
                💡 {pair.observation}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* Work Environment Fit */}
      <Section title="Work Environment Fit" subtitle="基于你价值观的理想工作环境参数">
        <EnvFitChart envFit={envFit} />
        <div className="mt-4 p-4 bg-purple-50 rounded-xl">
          <h4 className="font-medium text-purple-900 mb-2">看 JD / 面试时可以关注：</h4>
          <ul className="text-sm text-purple-800 space-y-1">
            {envFit.jdChecklist.slice(0, 5).map((item, i) => (
              <li key={i}>• {item}</li>
            ))}
          </ul>
        </div>
      </Section>
    </div>
  );
}

// ===== 职业场景 Tab =====
function ScenesTab({
  scoring,
  recommendedScenes,
  currentScene,
}: {
  scoring: ScoringResult;
  recommendedScenes: string[];
  currentScene?: string;
}) {
  const scenes = recommendedScenes
    .map((code) => wvScenes[code as SceneCode])
    .filter(Boolean);

  return (
    <div className="space-y-6">
      <p className="text-gray-600">
        根据你的价值优先级，以下几个职业场景可能特别值得关注。
        每个场景都有对应的思考方向和建议。
      </p>

      {scenes.map((scene) => (
        <div
          key={scene.code}
          className="bg-white rounded-2xl border border-gray-200 p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">{scene.icon}</span>
            <h3 className="text-lg font-semibold">{scene.name}</h3>
            {scene.code === currentScene && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                当前关注
              </span>
            )}
          </div>
          <p className="text-gray-600 text-sm mb-4">{scene.guidance}</p>

          <div className="space-y-3">
            {scoring.top3.map((s) => {
              const specific = scene.valueSpecific[s.dimension];
              if (!specific) return null;
              return (
                <div key={s.dimension} className="flex gap-3 text-sm">
                  <div
                    className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                    style={{ backgroundColor: getDimensionColor(s.dimension) }}
                  />
                  <div>
                    <span className="font-medium">
                      {wvDimensions[s.dimension].name}：
                    </span>
                    <span className="text-gray-600">{specific}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-700 mb-2">可以问问自己：</p>
            <ul className="text-sm text-gray-600 space-y-1">
              {scene.reflectionQuestions.slice(0, 3).map((q, i) => (
                <li key={i}>• {q}</li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}

// ===== 工具与对话 Tab =====
function ToolsTab({
  scoring,
  sevenDay,
  interviewQuestions,
  whispers,
  peopleStories,
  mediaStories,
}: {
  scoring: ScoringResult;
  sevenDay: SevenDayPractice;
  interviewQuestions: ReturnType<typeof getRecommendedInterviewQuestions>;
  whispers: WhisperUnit[];
  peopleStories: PersonStory[];
  mediaStories: MediaStory[];
}) {
  return (
    <div className="space-y-8">
      {/* 小酷耳语 */}
      <Section title="小酷想对你说" subtitle="来自 QM AI 的心理耳语">
        <div className="space-y-4">
          {whispers.map((w) => (
            <div
              key={w.id}
              className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-5 border border-purple-100"
            >
              <p className="text-purple-900 font-medium mb-2">{w.opening}</p>
              <p className="text-sm text-purple-800 mb-2">{w.sceneContext}</p>
              <p className="text-sm text-gray-700 mb-2">{w.dynamic}</p>
              <p className="text-sm text-gray-600 italic mb-3">{w.painPoint}</p>
              <p className="text-sm text-purple-700">👀 {w.observation}</p>
              <p className="text-sm font-medium text-purple-900 mt-3">
                💭 {w.question}
              </p>
              {w.safetyNote && (
                <p className="text-xs text-rose-600 mt-3 p-3 bg-rose-50 rounded-lg">
                  ⚠️ {w.safetyNote}
                </p>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* Story Mirror 人物 */}
      <Section title="Story Mirror · 人物" subtitle="从别人的故事里，看见自己的价值">
        <p className="text-sm text-gray-500 mb-4">
          这些不是榜样或认证，只是和你价值模式相似的人的故事。
          每个人的路都是独特的，仅供参考。
        </p>
        <div className="space-y-4">
          {peopleStories.map((p) => (
            <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-semibold">{p.nameCn}</span>
                  <span className="text-sm text-gray-500 ml-2">{p.field}</span>
                </div>
                <div className="flex gap-1">
                  {p.connectedValues.map((v) => (
                    <span
                      key={v}
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: getDimensionColor(v) + '20',
                        color: getDimensionColor(v),
                      }}
                    >
                      {getDimensionName(v)}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-2">{p.publicStorySummary}</p>
              <p className="text-xs text-gray-500">
                <span className="font-medium">和你的不同：</span>{p.difference}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                <span className="font-medium">代价与限制：</span>{p.costLimitation}
              </p>
              <p className="text-xs text-purple-600 mt-2 italic">
                💡 {p.observation}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* Story Mirror 影视 */}
      <Section title="Story Mirror · 影视文学" subtitle="从角色和情节里，看见自己的价值冲突">
        <div className="space-y-4">
          {mediaStories.map((m) => (
            <div key={m.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-semibold">{m.title}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    {m.type === 'movie' ? '电影' : m.type === 'book' ? '文学' : m.type === 'tv' ? '剧集' : m.type === 'anime' ? '动画' : '戏剧'}
                  </span>
                </div>
                <div className="flex gap-1">
                  {m.valuePattern.map((v) => (
                    <span
                      key={v}
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: getDimensionColor(v) + '20',
                        color: getDimensionColor(v),
                      }}
                    >
                      {getDimensionName(v)}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-2">{m.sceneDescription}</p>
              <p className="text-xs text-gray-500">
                <span className="font-medium">为什么相关：</span>{m.whyRelevant}
              </p>
              <p className="text-xs text-purple-600 mt-2 italic">
                💡 {m.observation}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* 7 天观察 */}
      <Section title="7 天价值观察" subtitle="用一周时间，在真实生活中验证你的核心价值">
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-100">
          <h4 className="font-semibold text-amber-900 mb-2">{sevenDay.title}</h4>
          <p className="text-sm text-amber-800 mb-4">{sevenDay.description}</p>
          <p className="text-sm font-medium text-amber-900 mb-2">每日一问：{sevenDay.dailyQuestion}</p>
          <ol className="text-sm text-amber-800 space-y-1 mt-4">
            {sevenDay.dailySteps.map((step, i) => (
              <li key={i} className="flex gap-2">
                <span className="font-medium">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      {/* 面试反问 */}
      <Section title="面试反问清单" subtitle="根据你的核心价值，面试时可以问这些问题">
        <div className="space-y-3">
          {interviewQuestions.map((q, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: getDimensionColor(q.dimension) + '20',
                    color: getDimensionColor(q.dimension),
                  }}
                >
                  {getDimensionName(q.dimension)}
                </span>
              </div>
              <p className="font-medium text-gray-800 mb-1">❓ {q.question}</p>
              <p className="text-sm text-gray-500">目的：{q.purpose}</p>
              <p className="text-sm text-gray-500">听什么：{q.whatToListen}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Green/Red Flags */}
      <Section title="Green / Red Flags" subtitle="找工作时，哪些信号要注意">
        <div className="grid md:grid-cols-2 gap-4">
          {scoring.top3.map((s) => {
            const flags = greenRedFlags[s.dimension];
            return (
              <div key={s.dimension} className="space-y-3">
                <h4 className="font-medium" style={{ color: getDimensionColor(s.dimension) }}>
                  {wvDimensions[s.dimension].name}
                </h4>
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-green-800 mb-2">✅ Green Flags</p>
                  <ul className="text-sm text-green-700 space-y-1">
                    {flags.greenFlags.slice(0, 3).map((f, i) => (
                      <li key={i}>• {f}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-red-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-red-800 mb-2">🚩 Red Flags</p>
                  <ul className="text-sm text-red-700 space-y-1">
                    {flags.redFlags.slice(0, 3).map((f, i) => (
                      <li key={i}>• {f}</li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* 沟通脚本 */}
      <Section title="沟通脚本模板" subtitle="和主管、HR 沟通时可以参考的话术">
        <div className="space-y-4">
          {communicationTemplates
            .filter((t) => scoring.top3.some((s) => s.dimension === t.valueAnchor))
            .slice(0, 3)
            .map((t, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{t.situation}</span>
                  <span className="text-xs text-gray-500">
                    对象：{t.audience === 'manager' ? '主管' : t.audience === 'hr' ? 'HR' : '同事'}
                  </span>
                </div>
                <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 font-mono whitespace-pre-line">
                  {t.template}
                </div>
              </div>
            ))}
        </div>
      </Section>
    </div>
  );
}

// ===== 底部 =====
function FooterSection({ scoring }: { scoring: ScoringResult }) {
  return (
    <div className="bg-white border-t mt-12 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-2">想聊得更深入？</h3>
            <p className="text-gray-600 text-sm">
              和 {AI_IDENTITY.name} 继续对话，探索你的职业价值观在具体情境中的应用。
            </p>
          </div>
          <button
            className="px-6 py-3 rounded-xl font-medium text-white transition-all hover:opacity-90"
            style={{ backgroundColor: QM_BRAND.primary }}
          >
            和小酷聊聊 →
          </button>
        </div>

        <div className="mt-8 pt-6 border-t flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-500">
            <p>QM AI · 职业价值观测评 v4.0</p>
            <p className="mt-1">
              本测评仅为自我探索参考，不作诊断用途。
              如需专业心理支持，可联系 {REFERRAL_INFO.organization}。
            </p>
          </div>
          <div className="flex gap-3">
            <a href="/" className="inline-flex items-center px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
              返回首页
            </a>
            <button className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
              分享结果
            </button>
            <button className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
              导出 PDF
            </button>
            <button className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
              保存长图
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== 通用组件 =====

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function ValueCard({ score, rank }: { score: DimensionScore; rank: number }) {
  const dim = wvDimensions[score.dimension];
  return (
    <div
      className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
      style={{ borderTop: `4px solid ${dim.color}` }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400">TOP{rank}</span>
        <span className="text-2xl font-bold" style={{ color: dim.color }}>
          {score.score}
        </span>
      </div>
      <h3 className="font-semibold text-gray-900 mb-1">{dim.name}</h3>
      <p className="text-xs text-gray-500 mb-3">{dim.description}</p>
      <div className="text-xs text-gray-600">
        <p className="mb-1">✨ 被满足时：{dim.whenSatisfied[0]}</p>
        <p>⚠️ 缺失时：{dim.whenMissing[0]}</p>
      </div>
    </div>
  );
}

// ===== 图表占位组件 =====
// 实际项目中使用 Recharts 或类似库渲染，这里输出结构化数据供集成

function RadarChart({ scores }: { scores: DimensionScore[] }) {
  const data = scores.map((s) => ({
    dimension: wvDimensions[s.dimension].name,
    score: s.score,
    color: wvDimensions[s.dimension].color,
  }));

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100">
      <div className="text-center text-sm text-gray-400 mb-4">
        📊 雷达图（集成时使用 Recharts 渲染）
      </div>
      <div className="grid grid-cols-4 gap-2 text-xs">
        {data.map((d) => (
          <div key={d.dimension} className="text-center">
            <div
              className="w-3 h-3 rounded-full mx-auto mb-1"
              style={{ backgroundColor: d.color }}
            />
            <div className="text-gray-600">{d.dimension}</div>
            <div className="font-semibold" style={{ color: d.color }}>
              {d.score}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RankingChart({ scores }: { scores: DimensionScore[] }) {
  const maxScore = 100;

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 space-y-3">
      {scores.map((s, i) => (
        <div key={s.dimension} className="flex items-center gap-3">
          <span className="text-xs text-gray-400 w-6 text-right">{i + 1}</span>
          <span className="text-sm w-20 flex-shrink-0">
            {wvDimensions[s.dimension].name}
          </span>
          <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${(s.score / maxScore) * 100}%`,
                backgroundColor: wvDimensions[s.dimension].color,
                opacity: i < 3 ? 1 : 0.6,
              }}
            />
          </div>
          <span
            className="text-sm font-semibold w-10 text-right"
            style={{ color: wvDimensions[s.dimension].color }}
          >
            {s.score}
          </span>
        </div>
      ))}
    </div>
  );
}

function DualIndexChart({
  intrinsic,
  extrinsic,
}: {
  intrinsic: number;
  extrinsic: number;
}) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="bg-gradient-to-br from-purple-100 to-purple-50 rounded-2xl p-6 text-center">
        <p className="text-sm text-purple-600 mb-1">内在价值指数</p>
        <p className="text-4xl font-bold text-purple-700 mb-2">{intrinsic}</p>
        <p className="text-xs text-purple-500">成就 · 自主 · 成长 · 意义</p>
      </div>
      <div className="bg-gradient-to-br from-blue-100 to-cyan-50 rounded-2xl p-6 text-center">
        <p className="text-sm text-blue-600 mb-1">外在价值指数</p>
        <p className="text-4xl font-bold text-blue-700 mb-2">{extrinsic}</p>
        <p className="text-xs text-blue-500">稳定 · 回报</p>
      </div>
    </div>
  );
}

function ValueMapChart({ scores }: { scores: DimensionScore[] }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100">
      <div className="text-center text-sm text-gray-400 mb-4">
        🗺️ Value Map 二维图（X轴：内在↔外在，Y轴：自我导向↔关系导向）
      </div>
      <div className="relative h-64 bg-gray-50 rounded-xl border border-gray-200">
        {/* 坐标轴 */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-300" />
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-300" />
        <div className="absolute top-2 left-2 text-xs text-gray-400">内在/自我</div>
        <div className="absolute top-2 right-2 text-xs text-gray-400">外在/自我</div>
        <div className="absolute bottom-2 left-2 text-xs text-gray-400">内在/关系</div>
        <div className="absolute bottom-2 right-2 text-xs text-gray-400">外在/关系</div>

        {/* 维度点 */}
        {scores.map((s) => {
          const dim = wvDimensions[s.dimension];
          const x = 50 + dim.valueMap.x * 40; // 10%-90%
          const y = 50 - dim.valueMap.y * 35; // 15%-85%
          return (
            <div
              key={s.dimension}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white shadow-md"
                style={{
                  backgroundColor: dim.color,
                  transform: `scale(${0.7 + (s.score / 100) * 0.5})`,
                }}
              >
                {dim.shortName}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PairMatrixHeatmap({ scores }: { scores: Record<string, number> }) {
  const dims = DIMENSION_ORDER;

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 overflow-x-auto">
      <div className="text-center text-sm text-gray-400 mb-4">
        📊 28 组价值组合矩阵（绿色=协同、黄色=条件张力、红色=取舍）
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="p-1"></th>
            {dims.map((d) => (
              <th key={d} className="p-1 font-medium text-gray-500">
                {wvDimensions[d].shortName}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dims.map((dimA, i) => (
            <tr key={dimA}>
              <td className="p-1 font-medium text-gray-600 text-right pr-2">
                {wvDimensions[dimA].shortName}
              </td>
              {dims.map((dimB, j) => {
                if (i === j) {
                  return <td key={dimB} className="p-1 bg-gray-100" />;
                }
                if (j < i) {
                  // 下三角：显示张力值
                  const pair = wvPairMatrix.find(
                    (p) =>
                      (p.pair[0] === dimA && p.pair[1] === dimB) ||
                      (p.pair[0] === dimB && p.pair[1] === dimA),
                  );
                  const scoreA = scores[dimA] || 0;
                  const scoreB = scores[dimB] || 0;
                  const gap = Math.abs(scoreA - scoreB);
                  let bg = 'bg-green-100';
                  if (pair?.category === 'tradeoff') bg = 'bg-red-100';
                  else if (pair?.category === 'conditional_tension') bg = 'bg-amber-100';
                  return (
                    <td key={dimB} className="p-1">
                      <div className={`w-full h-6 rounded ${bg} flex items-center justify-center text-xs`}>
                        {gap}
                      </div>
                    </td>
                  );
                }
                // 上三角：显示分类颜色
                const pair = wvPairMatrix.find(
                  (p) =>
                    (p.pair[0] === dimA && p.pair[1] === dimB) ||
                    (p.pair[0] === dimB && p.pair[1] === dimA),
                );
                let bg = 'bg-green-200';
                if (pair?.category === 'tradeoff') bg = 'bg-red-200';
                else if (pair?.category === 'conditional_tension') bg = 'bg-amber-200';
                return (
                  <td key={dimB} className="p-1">
                    <div className={`w-full h-6 rounded ${bg}`} />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EnvFitChart({ envFit }: { envFit: EnvFitResult }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 space-y-3">
      {ENV_PARAM_ORDER.map((code) => {
        const param = wvEnvParameters[code];
        const score = envFit.params[code];
        return (
          <div key={code} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-700">{param.name}</span>
              <span className="text-purple-600 font-semibold">{score}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-24 text-right flex-shrink-0">
                {param.lowLabel}
              </span>
              <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-400 to-purple-600"
                  style={{ width: `${score}%` }}
                />
              </div>
              <span className="text-xs text-gray-400 w-24 flex-shrink-0">
                {param.highLabel}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
