// QM 阿德勒指数 v4.0 — 升级版结果页
// 4 屏+ 信息架构，16 种可视化
// 第一屏：Headline + 4D Compass + 一句话 Profile
// 第二屏：Profile Table + 两张二维 Map + 6-Pair Matrix
// 第三屏：Life Tasks + Context Heatmap + 7个 Lens
// 第四屏以后：场景解读、小酷耳语、Story Mirror、行动工具、7天练习板、导出

'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import type {
  ScoringResult,
  PairPatternResult,
  ProfileSignature,
  WhisperUnit,
  PersonStory,
  MediaStory,
  SevenDayBoard,
  CourageMicroStep,
  ModuleCode,
  SceneCode,
  LifeTaskCode,
} from '@/lib/adler-v4/adler-types';
import {
  DIMENSION_ORDER,
  DIMENSION_NAMES,
  QM_BRAND_COLOR,
} from '@/lib/adler-v4/adler-types';
import { adlerDimensions } from '@/lib/adler-v4/adler-dimensions';
import { adlerPairMatrix } from '@/lib/adler-v4/adler-pair-matrix';
import { adlerianLenses } from '@/lib/adler-v4/adler-lenses';
import { adlerScenes, getSceneName } from '@/lib/adler-v4/adler-scenes';
import { adlerModulePool } from '@/lib/adler-v4/adler-module-pool';
import { visualSpec } from '@/lib/adler-v4/adler-visuals';
import { adlerActionTools } from '@/lib/adler-v4/adler-action-tools';
import { QM_BRAND, crisisResources } from '@/lib/adler-v4/adler-export';
import { buildWhyYouNarrative, generateProfileNarrative } from '@/lib/adler-v4/adler-narrative';

// ===== 组件 Props =====
interface AdlerResultPageProps {
  scoring: ScoringResult;
  profileSignature: ProfileSignature;
  pairPatterns: PairPatternResult[];
  currentLifeTask: LifeTaskCode;
  currentContext: SceneCode;
  selectedModules: ModuleCode[];
  selectedScenes: SceneCode[];
  featuredWhispers: WhisperUnit[];
  storyMirrorPeople: PersonStory[];
  storyMirrorMedia: MediaStory[];
  microStep: CourageMicroStep;
  sevenDayBoard: SevenDayBoard;
}

// ===== 主组件 =====
export default function AdlerResultPage({
  scoring,
  profileSignature,
  pairPatterns,
  currentLifeTask,
  currentContext,
  selectedModules,
  selectedScenes,
  featuredWhispers,
  storyMirrorPeople,
  storyMirrorMedia,
  microStep,
  sevenDayBoard,
}: AdlerResultPageProps) {
  const [difficulty, setDifficulty] = useState<'gentle' | 'medium' | 'stretch'>('gentle');

  const hasData = scoring && scoring.top2 && scoring.bottom2;

  const narrative = useMemo(
    () => hasData ? generateProfileNarrative(scoring, pairPatterns) : '',
    [scoring, pairPatterns, hasData],
  );

  const topPairs = useMemo(
    () => hasData ? [...pairPatterns].sort((a, b) => b.confidence - a.confidence).slice(0, 3) : [],
    [pairPatterns, hasData],
  );

  // 空数据保护
  if (!hasData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">阿德勒指数</h1>
          <p className="text-gray-600 mb-6">请先完成测评以查看结果</p>
          <Link href="/assessments" className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            返回测评列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8FF] text-[#2D2040]">
      {/* ===== 第一屏：Hero + 4D Compass ===== */}
      <section className="px-6 pt-8 pb-10">
        <div className="text-center mb-6">
          <p className="text-sm text-[#6B5B80] mb-2">QM 阿德勒指数 · v4.0</p>
          <h1 className="text-2xl font-bold mb-2" style={{ color: QM_BRAND_COLOR }}>
            {scoring.headline}
          </h1>
          <p className="text-[#6B5B80] text-sm max-w-md mx-auto">
            阿德勒取向自我探索画像 · 不是诊断 · 不是人格定型
          </p>
        </div>

        {/* 4D Compass 四维罗盘 */}
        <div className="relative w-full max-w-sm mx-auto aspect-square mb-6">
          <FourDCompass scores={scoring.rawScores} />
        </div>

        <p className="text-center text-[#2D2040] max-w-md mx-auto leading-relaxed">
          {narrative}
        </p>

        <p className="text-center text-xs text-[#6B5B80] mt-4">
          0-100 为本次维度位置，不是人口百分位 · norm_status: unapproved
        </p>
      </section>

      {/* ===== 第二屏：Profile Table ===== */}
      <section className="px-6 py-8 bg-white border-t border-b border-[#E8E0F5]">
        <h2 className="text-lg font-bold mb-4" style={{ color: QM_BRAND_COLOR }}>
          四维度画像
        </h2>
        <div className="space-y-4">
          {DIMENSION_ORDER.map((code) => {
            const dim = adlerDimensions[code];
            const score = scoring.rawScores[code];
            return (
              <div
                key={code}
                className="p-4 rounded-xl border border-[#E8E0F5] bg-[#FAF8FF]"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{dim.name}</span>
                  <span className="text-sm text-[#6B5B80]">{score} 位</span>
                </div>
                <div className="w-full h-2 bg-[#E8E0F5] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${score}%`, backgroundColor: dim.color }}
                  />
                </div>
                <p className="text-xs text-[#6B5B80] mt-2">{dim.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ===== 第三屏：6 组 Pair ===== */}
      <section className="px-6 py-8">
        <h2 className="text-lg font-bold mb-4" style={{ color: QM_BRAND_COLOR }}>
          维度之间的关系
        </h2>
        <p className="text-sm text-[#6B5B80] mb-4">
          四个维度不是孤立的，它们之间有6种不同的组合方式。每一种组合都有它的资源和张力。
        </p>

        {/* 6-Pair Matrix 概览 */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {pairPatterns.map((pp) => {
            const pairDef = adlerPairMatrix[pp.pair];
            const catLabel =
              pairDef?.categories[pp.category as keyof typeof pairDef.categories]?.label ||
              '';
            return (
              <div
                key={pp.pair}
                className="p-3 rounded-xl border border-[#E8E0F5] bg-white text-sm"
              >
                <div className="font-medium mb-1">{pairDef?.name}</div>
                <div className="text-xs text-[#6B5B80]">{catLabel}</div>
              </div>
            );
          })}
        </div>

        {/* Top 3 Pairs 详解 */}
        <div className="space-y-4">
          {topPairs.map((pp) => {
            const pairDef = adlerPairMatrix[pp.pair];
            const cat = pairDef?.categories[pp.category as keyof typeof pairDef.categories];
            return (
              <div
                key={pp.pair}
                className="p-4 rounded-xl border border-[#E8E0F5] bg-white"
              >
                <h3 className="font-medium mb-2" style={{ color: QM_BRAND_COLOR }}>
                  {pairDef?.name} · {cat?.label}
                </h3>
                <p className="text-sm text-[#2D2040] mb-3">{cat?.description}</p>
                <div className="text-xs text-[#6B5B80] space-y-1">
                  <p>💡 可能的资源：{cat?.possibleResources.join('、')}</p>
                  <p>⚡ 可能的张力：{cat?.possibleTensions.join('、')}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ===== 第四屏：生活任务 + 场景 ===== */}
      <section className="px-6 py-8 bg-white border-t border-b border-[#E8E0F5]">
        <h2 className="text-lg font-bold mb-4" style={{ color: QM_BRAND_COLOR }}>
          生活任务与当前情境
        </h2>

        <div className="p-4 rounded-xl bg-[#FAF8FF] mb-6">
          <p className="text-sm text-[#6B5B80] mb-1">你目前的生活任务</p>
          <p className="font-medium">
            {currentLifeTask === 'friendship' && '友谊'}
            {currentLifeTask === 'work' && '工作'}
            {currentLifeTask === 'love' && '爱与亲密'}
            {currentLifeTask === 'self' && '自我关系'}
            {currentLifeTask === 'community' && '共同体'}
          </p>
        </div>

        <h3 className="font-medium mb-3">和你相关的情境</h3>
        <div className="grid grid-cols-2 gap-2">
          {selectedScenes.slice(0, 6).map((code) => {
            const scene = adlerScenes[code];
            return (
              <div
                key={code}
                className="p-3 rounded-lg border border-[#E8E0F5] text-sm"
              >
                <span className="mr-1">{scene.icon}</span>
                {scene.name}
              </div>
            );
          })}
        </div>
      </section>

      {/* ===== 第五屏：7 个阿德勒 Lens ===== */}
      <section className="px-6 py-8">
        <h2 className="text-lg font-bold mb-4" style={{ color: QM_BRAND_COLOR }}>
          阿德勒视角
        </h2>
        <p className="text-sm text-[#6B5B80] mb-4">
          我们可以用不同的阿德勒镜头来看你的结果。其中私人逻辑和目标取向是探索性假设，不是事实判断。
        </p>
        <div className="grid grid-cols-1 gap-3">
          {Object.values(adlerianLenses).map((lens) => (
            <div
              key={lens.code}
              className="p-3 rounded-xl border border-[#E8E0F5] bg-white"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm">{lens.name}</span>
                {lens.isHypothetical && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#E8E0F5] text-[#6B5B80]">
                    假设性探索
                  </span>
                )}
              </div>
              <p className="text-xs text-[#6B5B80]">{lens.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== 第六屏：小酷耳语 ===== */}
      <section className="px-6 py-8 bg-white border-t border-b border-[#E8E0F5]">
        <h2 className="text-lg font-bold mb-2" style={{ color: QM_BRAND_COLOR }}>
          小酷耳语
        </h2>
        <p className="text-sm text-[#6B5B80] mb-4">
          一些和你此刻可能相关的小观察。它们不一定都对，选你有感觉的就好。
        </p>

        <div className="space-y-4">
          {featuredWhispers.slice(0, 5).map((w) => (
            <div
              key={w.id}
              className="p-4 rounded-xl bg-[#FAF8FF] border border-[#E8E0F5]"
            >
              <p className="text-sm mb-2">💫 {w.seeing}</p>
              <p className="text-xs text-[#6B5B80] mb-2">
                <span className="font-medium">可能的假设：</span>
                {w.possibleHypothesis}
              </p>
              <p className="text-xs text-[#6B5B80] mb-2">
                <span className="font-medium">但也可能是：</span>
                {w.alternativeExplanations[0]}
                {w.alternativeExplanations[1] && ` / ${w.alternativeExplanations[1]}`}
              </p>
              <p className="text-sm" style={{ color: QM_BRAND_COLOR }}>
                {w.encouragement}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== 第七屏：Story Mirror 人物 ===== */}
      <section className="px-6 py-8">
        <h2 className="text-lg font-bold mb-2" style={{ color: QM_BRAND_COLOR }}>
          Story Mirror · 人物
        </h2>
        <p className="text-xs text-[#6B5B80] mb-4">
          这些人物的公开故事可能和你目前的某些议题有呼应。
          人物不是"生活风格认证"，也不代表QM声称他们接受过阿德勒指数测评。
        </p>

        <div className="space-y-4">
          {storyMirrorPeople.slice(0, 3).map((p) => {
            const whyYou = buildWhyYouNarrative(
              scoring,
              topPairs[0],
              currentLifeTask,
              { name: p.nameCn, storyEvidence: p.storyEvidence, counterpointTags: p.counterpointTags },
            );
            return (
              <div
                key={p.id}
                className="p-4 rounded-xl border border-[#E8E0F5] bg-white"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium">{p.nameCn}</h3>
                    <p className="text-xs text-[#6B5B80]">
                      {p.nameEn} · {p.field}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#E8E0F5] text-[#6B5B80]">
                    {p.cultureRegion}
                  </span>
                </div>
                <p className="text-xs text-[#2D2040] mb-2">{p.publicStorySummary}</p>
                <div className="text-xs text-[#6B5B80] space-y-1 mb-2">
                  <p><span className="font-medium">Story Evidence：</span>{p.storyEvidence.slice(0, 60)}...</p>
                  <p><span className="font-medium">Difference：</span>{whyYou.difference.slice(0, 40)}...</p>
                </div>
                <p className="text-xs" style={{ color: QM_BRAND_COLOR }}>
                  {whyYou.question}
                </p>
                {p.contentWarning && (
                  <p className="text-xs text-amber-600 mt-2">
                    ⚠️ 内容提示：{p.contentWarning.slice(0, 30)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ===== 第八屏：Story Mirror 影视 ===== */}
      <section className="px-6 py-8 bg-white border-t border-b border-[#E8E0F5]">
        <h2 className="text-lg font-bold mb-2" style={{ color: QM_BRAND_COLOR }}>
          Story Mirror · 影视与文学
        </h2>
        <p className="text-xs text-[#6B5B80] mb-4">
          这些作品的某些剧情，可能和你目前的状态有呼应。我们不会给角色贴阿德勒类型标签，只看故事本身。
        </p>

        <div className="space-y-4">
          {storyMirrorMedia.slice(0, 2).map((m) => (
            <div
              key={m.id}
              className="p-4 rounded-xl border border-[#E8E0F5] bg-[#FAF8FF]"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium">{m.titleCn}</h3>
                  <p className="text-xs text-[#6B5B80]">
                    {m.titleEn} · {m.type === 'movie' ? '电影' : m.type === 'tv' ? '剧集' : m.type === 'book' ? '文学' : '纪录片'}
                  </p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white border border-[#E8E0F5]">
                  {m.cultureRegion}
                </span>
              </div>
              <p className="text-xs text-[#2D2040] mb-2">{m.keyPlotDescription}</p>
              {m.contentWarning && (
                <p className="text-xs text-amber-600">
                  ⚠️ 内容提示：{m.contentWarning.slice(0, 40)}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ===== 第九屏：24 小时勇气微行动 ===== */}
      <section className="px-6 py-8">
        <h2 className="text-lg font-bold mb-2" style={{ color: QM_BRAND_COLOR }}>
          24 小时勇气微行动
        </h2>
        <p className="text-sm text-[#6B5B80] mb-4">
          选一个你今天想尝试的难度。不用勉强，选你觉得舒服的就好。
        </p>

        {/* 难度选择 */}
        <div className="flex gap-2 mb-4">
          {(['gentle', 'medium', 'stretch'] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all ${
                difficulty === d
                  ? 'text-white'
                  : 'bg-[#FAF8FF] text-[#6B5B80] border border-[#E8E0F5]'
              }`}
              style={difficulty === d ? { backgroundColor: QM_BRAND_COLOR } : {}}
            >
              {d === 'gentle' && '轻轻版'}
              {d === 'medium' && '适中版'}
              {d === 'stretch' && '挑战版'}
            </button>
          ))}
        </div>

        <div className="p-5 rounded-xl bg-white border border-[#E8E0F5]">
          <h3 className="font-medium mb-2">{microStep.title}</h3>
          <p className="text-sm text-[#6B5B80] mb-3">{microStep.description}</p>
          <div
            className="p-4 rounded-xl text-sm"
            style={{ backgroundColor: '#FAF8FF' }}
          >
            <p className="font-medium mb-1" style={{ color: QM_BRAND_COLOR }}>
              你的 24 小时小行动
            </p>
            <p>
              {difficulty === 'gentle' && microStep.steps.gentle}
              {difficulty === 'medium' && microStep.steps.medium}
              {difficulty === 'stretch' && microStep.steps.stretch}
            </p>
          </div>
        </div>
      </section>

      {/* ===== 第十屏：7 天练习板 ===== */}
      <section className="px-6 py-8 bg-white border-t border-b border-[#E8E0F5]">
        <h2 className="text-lg font-bold mb-2" style={{ color: QM_BRAND_COLOR }}>
          7 天阿德勒练习板
        </h2>
        <p className="text-sm text-[#6B5B80] mb-4">{sevenDayBoard.description}</p>

        <div className="space-y-3">
          {sevenDayBoard.dailyStructure.map((d) => (
            <div key={d.day} className="p-3 rounded-xl border border-[#E8E0F5] bg-[#FAF8FF]">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">第 {d.day} 天</span>
                <span className="text-xs text-[#6B5B80]">{d.lifeTask}</span>
              </div>
              <p className="text-xs text-[#2D2040]">
                <span className="font-medium">行动：</span>{d.actionStep.slice(0, 30)}...
              </p>
              <p className="text-xs text-[#6B5B80] mt-1">
                💭 {d.observation.slice(0, 30)}...
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== 第十一屏：行动工具 ===== */}
      <section className="px-6 py-8">
        <h2 className="text-lg font-bold mb-4" style={{ color: QM_BRAND_COLOR }}>
          行动工具库
        </h2>
        <div className="grid grid-cols-1 gap-3">
          {adlerActionTools.slice(0, 7).map((tool) => (
            <div
              key={tool.id}
              className="p-4 rounded-xl border border-[#E8E0F5] bg-white"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{tool.icon}</span>
                <span className="font-medium">{tool.name}</span>
              </div>
              <p className="text-xs text-[#6B5B80]">{tool.description.slice(0, 50)}...</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== 底部：免责声明 + 资源 ===== */}
      <section className="px-6 py-8 bg-[#FAF8FF] border-t border-[#E8E0F5]">
        <div className="text-center mb-6">
          <p className="text-sm font-medium mb-2" style={{ color: QM_BRAND_COLOR }}>
            关于 QM 阿德勒指数
          </p>
          <p className="text-xs text-[#6B5B80] leading-relaxed">
            {QM_BRAND.disclaimer}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#E8E0F5]">
          <p className="text-sm font-medium mb-2">如果你需要更多支持</p>
          <p className="text-xs text-[#6B5B80] mb-2">
            {crisisResources.institution}
          </p>
          <div className="text-xs space-y-1">
            <p>📞 热线（主）：{crisisResources.primaryHotline}</p>
            <p>📞 热线（备）：{crisisResources.secondaryHotline}</p>
            <p>💬 微信客服：{crisisResources.wechatSupport}</p>
          </div>
          <p className="text-xs text-[#6B5B80] mt-2">{crisisResources.note}</p>
        </div>

        <p className="text-center text-xs text-[#6B5B80] mt-6">
          — 小酷 · QM AI —
        </p>
        <p className="text-center text-xs text-[#999] mt-1">
          本结果基于你此刻的回答，会随着时间和情境变化
        </p>
      </section>

      {/* ===== 隐私合规标记 ===== */}
      <div className="hidden">
        {/* 前台禁止展示的字段 - 在此标记确保不在UI中出现 */}
        {/* - 逐题答案: 不在结果页展示 */}
        {/* - assessment_id: 不在结果页展示 */}
        {/* - user_id: 不在结果页展示 */}
        {/* - 内部权重: 不在结果页展示 */}
        {/* - 数据库ID: 不在结果页展示 */}
        {/* - 审核URL: 不在结果页展示 */}
        {/* - Prompt: 不在结果页展示 */}
        {/* - 身份字段: 不在结果页展示 */}
      </div>
    </div>
  );
}

// ===== 4D Compass 子组件 =====
function FourDCompass({ scores }: { scores: Record<string, number> }) {
  const size = 280;
  const center = size / 2;
  const maxRadius = size / 2 - 30;

  // 四个维度对应的角度（0度在上方，顺时针）
  const angles = {
    A: -90,    // 上：选择与行动感
    B: 0,      // 右：课题与边界感
    C: 90,     // 下：勇气与成长感
    D: 180,    // 左：连接与共同体感
  };

  const dimLabels = {
    A: '选择行动',
    B: '课题边界',
    C: '勇气成长',
    D: '连接共同体',
  };

  const dimColors = {
    A: '#8B6FD1',
    B: '#6B8AC9',
    C: '#9B6BC9',
    D: '#C96B9A',
  };

  // 计算每个维度的点位置
  const points = DIMENSION_ORDER.map((dim) => {
    const score = scores[dim] || 0;
    const radius = (score / 100) * maxRadius;
    const angleRad = (angles[dim as keyof typeof angles] * Math.PI) / 180;
    const x = center + radius * Math.cos(angleRad);
    const y = center + radius * Math.sin(angleRad);
    return { dim, x, y };
  });

  // 多边形路径
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + ' Z';

  // 标签位置
  const labelPositions = DIMENSION_ORDER.map((dim) => {
    const angleRad = (angles[dim as keyof typeof angles] * Math.PI) / 180;
    const labelRadius = maxRadius + 20;
    const x = center + labelRadius * Math.cos(angleRad);
    const y = center + labelRadius * Math.sin(angleRad);
    return { dim, x, y };
  });

  // 同心圆（3层）
  const rings = [0.33, 0.66, 1.0];

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full">
      {/* 背景圆 */}
      <circle
        cx={center}
        cy={center}
        r={maxRadius}
        fill="none"
        stroke="#E8E0F5"
        strokeWidth="1"
      />

      {/* 同心圆 */}
      {rings.map((r, i) => (
        <circle
          key={i}
          cx={center}
          cy={center}
          r={maxRadius * r}
          fill="none"
          stroke="#E8E0F5"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
      ))}

      {/* 十字轴线 */}
      <line x1={center} y1={center - maxRadius} x2={center} y2={center + maxRadius} stroke="#E8E0F5" strokeWidth="1" />
      <line x1={center - maxRadius} y1={center} x2={center + maxRadius} y2={center} stroke="#E8E0F5" strokeWidth="1" />

      {/* 多边形（用户的位置） */}
      <path
        d={pathD}
        fill={QM_BRAND_COLOR}
        fillOpacity="0.15"
        stroke={QM_BRAND_COLOR}
        strokeWidth="2"
      />

      {/* 各维度点 */}
      {points.map((p) => (
        <circle
          key={p.dim}
          cx={p.x}
          cy={p.y}
          r="5"
          fill={dimColors[p.dim as keyof typeof dimColors]}
          stroke="white"
          strokeWidth="2"
        />
      ))}

      {/* 维度标签 */}
      {labelPositions.map((lp) => (
        <text
          key={lp.dim}
          x={lp.x}
          y={lp.y}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="11"
          fill="#6B5B80"
          className="font-medium"
        >
          {dimLabels[lp.dim as keyof typeof dimLabels]}
        </text>
      ))}

      {/* 中心点 */}
      <circle cx={center} cy={center} r="3" fill={QM_BRAND_COLOR} fillOpacity="0.3" />
    </svg>
  );
}
