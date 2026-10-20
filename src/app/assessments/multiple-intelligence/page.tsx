/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
'use client';

// QM AI 多元智能测评 v4.0 — 三阶段结果页面
// intro → quiz → result
// 品牌色 #6B4C9A，简体中文，AI 自称"小酷"

import React, { useState, useMemo } from 'react';
import { miQuestions24 } from '@/lib/multiintel-v4/mi-questions-24';
import {
  multipleIntelV4Assessment,
} from '@/lib/multiintel-v4/merge';
import { miDimensions } from '@/lib/multiintel-v4/mi-dimensions';
import { sceneDefinitions } from '@/lib/multiintel-v4/mi-scenes';
import {
  QM_BRAND_COLOR,
  QM_AI_NAME,
  QM_HOTLINE,
  QM_REFERRAL,
  QM_WECHAT,
  NORM_STATUS,
  RAW_READ_ONLY,
} from '@/lib/multiintel-v4/mi-types';
import type { MIResult, DimensionCode } from '@/lib/multiintel-v4/mi-types';

type Stage = 'intro' | 'quiz' | 'result';

const LIKERT_OPTIONS = [
  { value: 1, label: '非常不符合' },
  { value: 2, label: '比较不符合' },
  { value: 3, label: '一般' },
  { value: 4, label: '比较符合' },
  { value: 5, label: '非常符合' },
];

export default function MultipleIntelligencePage() {
  const [stage, setStage] = useState<Stage>('intro');
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [result, setResult] = useState<MIResult | null>(null);
  const [startTime] = useState(() => Date.now());

  const questions = miQuestions24;
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  const progress = Math.round((answeredCount / totalQuestions) * 100);

  // 提交答案
  const handleSubmit = () => {
    const responseTimeSeconds = Math.round((Date.now() - startTime) / 1000);
    const fullResult = multipleIntelV4Assessment.score(answers, { responseTimeSeconds });
    setResult(fullResult as MIResult);
    setStage('result');
  };

  // 选择答案
  const handleAnswer = (questionId: string, value: number) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);

    // 自动前进到下一题
    if (currentQIndex < totalQuestions - 1) {
      setTimeout(() => {
        setCurrentQIndex((prev) => prev + 1);
      }, 200);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#FAF8FC',
      fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif',
    }}>
      {/* 顶部品牌栏 */}
      <header style={{
        padding: '16px 20px',
        backgroundColor: 'white',
        borderBottom: '1px solid #EFE9F7',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          backgroundColor: QM_BRAND_COLOR,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '14px',
        }}>
          QM
        </div>
        <span style={{ fontWeight: 600, color: '#333' }}>多元智能测评</span>
        <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#999' }}>v4.0</span>
      </header>

      {/* 主体内容 */}
      <main style={{ maxWidth: '480px', margin: '0 auto', padding: '20px' }}>
        {stage === 'intro' && (
          <IntroSection onStart={() => { setStage('quiz'); setCurrentQIndex(0); }} />
        )}

        {stage === 'quiz' && (
          <QuizSection
            questions={questions}
            currentQIndex={currentQIndex}
            answers={answers}
            progress={progress}
            onAnswer={handleAnswer}
            onPrev={() => setCurrentQIndex((prev) => Math.max(0, prev - 1))}
            onSubmit={handleSubmit}
            answeredCount={answeredCount}
            totalQuestions={totalQuestions}
          />
        )}

        {stage === 'result' && result && (
          <ResultSection result={result} onRetest={() => {
            setAnswers({});
            setCurrentQIndex(0);
            setResult(null);
            setStage('intro');
          }} />
        )}
      </main>

      {/* 底部转介 */}
      {stage === 'result' && (
        <footer style={{
          maxWidth: '480px',
          margin: '0 auto',
          padding: '24px 20px 40px',
          textAlign: 'center',
        }}>
          <div style={{
            backgroundColor: '#F3EEF9',
            borderRadius: '12px',
            padding: '16px',
            fontSize: '13px',
            color: '#555',
            lineHeight: 1.6,
          }}>
            <p style={{ fontWeight: 600, color: QM_BRAND_COLOR, marginBottom: '8px' }}>
              如果你需要心理支持
            </p>
            <p>{QM_REFERRAL}</p>
            <p style={{ marginTop: '8px' }}>
              热线：{QM_HOTLINE} / 13601658763
            </p>
            <p>微信客服：{QM_WECHAT}</p>
          </div>
        </footer>
      )}
    </div>
  );
}

// ===== Intro 介绍页 =====
function IntroSection({ onStart }: { onStart: () => void }) {
  return (
    <div style={{ padding: '20px 0', textAlign: 'center' }}>
      <div style={{
        width: '80px',
        height: '80px',
        borderRadius: '20px',
        backgroundColor: QM_BRAND_COLOR,
        margin: '40px auto 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '36px',
      }}>
        🧠
      </div>

      <h1 style={{
        fontSize: '24px',
        fontWeight: 700,
        color: '#222',
        marginBottom: '12px',
      }}>
        多元智能测评 v4.0
      </h1>

      <p style={{
        fontSize: '15px',
        color: '#666',
        lineHeight: 1.6,
        marginBottom: '32px',
        padding: '0 20px',
      }}>
        基于加德纳多元智能理论，探索你当前使用八种智能的方式。
        <br />
        共 24 题，约 3-5 分钟完成。
        <br />
        结果仅供自我探索参考，不作诊断。
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        margin: '0 auto 32px',
        maxWidth: '360px',
        padding: '0 16px',
      }}>
        {[
          { icon: '📊', text: '8 维画像' },
          { icon: '🔗', text: '28 组组合' },
          { icon: '🎬', text: '故事镜映' },
          { icon: '💡', text: '行动工具' },
        ].map((item, i) => (
          <div key={i} style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '16px 12px',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}>
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>{item.icon}</div>
            <div style={{ fontSize: '13px', color: '#555' }}>{item.text}</div>
          </div>
        ))}
      </div>

      <button
        onClick={onStart}
        style={{
          backgroundColor: QM_BRAND_COLOR,
          color: 'white',
          border: 'none',
          borderRadius: '28px',
          padding: '14px 48px',
          fontSize: '16px',
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: `0 4px 12px ${QM_BRAND_COLOR}40`,
        }}
      >
        开始测评
      </button>

      <p style={{
        fontSize: '12px',
        color: '#aaa',
        marginTop: '16px',
      }}>
        norm_status = {NORM_STATUS} · raw_read_only = {RAW_READ_ONLY ? 'true' : 'false'}
      </p>
    </div>
  );
}

// ===== Quiz 答题页 =====
function QuizSection({
  questions,
  currentQIndex,
  answers,
  progress,
  onAnswer,
  onPrev,
  onSubmit,
  answeredCount,
  totalQuestions,
}: {
  questions: typeof miQuestions24;
  currentQIndex: number;
  answers: Record<string, number>;
  progress: number;
  onAnswer: (id: string, value: number) => void;
  onPrev: () => void;
  onSubmit: () => void;
  answeredCount: number;
  totalQuestions: number;
}) {
  const currentQ = questions[currentQIndex];
  const isLast = currentQIndex === totalQuestions - 1;
  const canSubmit = answeredCount >= totalQuestions * 0.8;

  return (
    <div>
      {/* 进度条 */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '13px',
          color: '#888',
          marginBottom: '8px',
        }}>
          <span>第 {currentQIndex + 1} / {totalQuestions} 题</span>
          <span>{progress}%</span>
        </div>
        <div style={{
          height: '6px',
          backgroundColor: '#EFE9F7',
          borderRadius: '3px',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            backgroundColor: QM_BRAND_COLOR,
            borderRadius: '3px',
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      {/* 题目 */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '28px 24px',
        marginBottom: '24px',
        minHeight: '180px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}>
        <p style={{
          fontSize: '18px',
          lineHeight: 1.6,
          color: '#222',
          textAlign: 'center',
          fontWeight: 500,
        }}>
          {currentQ.text}
        </p>
      </div>

      {/* 选项 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
        {LIKERT_OPTIONS.map((opt) => {
          const isSelected = answers[currentQ.id] === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onAnswer(currentQ.id, opt.value)}
              style={{
                padding: '16px 20px',
                borderRadius: '12px',
                border: isSelected ? `2px solid ${QM_BRAND_COLOR}` : '2px solid transparent',
                backgroundColor: isSelected ? '#F3EEF9' : 'white',
                fontSize: '15px',
                color: isSelected ? QM_BRAND_COLOR : '#444',
                fontWeight: isSelected ? 600 : 400,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <span style={{
                display: 'inline-block',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: isSelected ? QM_BRAND_COLOR : '#eee',
                color: isSelected ? 'white' : 'transparent',
                textAlign: 'center',
                lineHeight: '24px',
                fontSize: '12px',
                marginRight: '12px',
                verticalAlign: 'middle',
              }}>
                ✓
              </span>
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* 导航按钮 */}
      <div style={{ display: 'flex', gap: '12px' }}>
        {currentQIndex > 0 && (
          <button
            onClick={onPrev}
            style={{
              flex: 1,
              padding: '14px',
              borderRadius: '28px',
              border: '1px solid #DDD',
              backgroundColor: 'white',
              color: '#666',
              fontSize: '15px',
              cursor: 'pointer',
            }}
          >
            上一题
          </button>
        )}

        {isLast ? (
          <button
            onClick={onSubmit}
            disabled={!canSubmit}
            style={{
              flex: currentQIndex > 0 ? 2 : 1,
              padding: '14px',
              borderRadius: '28px',
              border: 'none',
              backgroundColor: canSubmit ? QM_BRAND_COLOR : '#CCC',
              color: 'white',
              fontSize: '15px',
              fontWeight: 600,
              cursor: canSubmit ? 'pointer' : 'not-allowed',
            }}
          >
            {canSubmit ? '查看结果' : `还需完成 ${Math.ceil(totalQuestions * 0.8) - answeredCount} 题`}
          </button>
        ) : (
          <button
            onClick={() => {
              if (answers[currentQ.id] !== undefined && currentQIndex < totalQuestions - 1) {
                // 题目已答且不是最后一题时，下一题按钮可用
              }
            }}
            disabled={answers[currentQ.id] === undefined}
            style={{
              flex: 1,
              padding: '14px',
              borderRadius: '28px',
              border: 'none',
              backgroundColor: answers[currentQ.id] !== undefined ? QM_BRAND_COLOR : '#DDD',
              color: 'white',
              fontSize: '15px',
              fontWeight: 600,
              cursor: answers[currentQ.id] !== undefined ? 'pointer' : 'not-allowed',
            }}
          >
            下一题
          </button>
        )}
      </div>

      <p style={{
        textAlign: 'center',
        fontSize: '12px',
        color: '#aaa',
        marginTop: '20px',
      }}>
        没有对错之分，凭第一感觉选择就好
      </p>
    </div>
  );
}

// ===== Result 结果页 =====
function ResultSection({ result, onRetest }: { result: MIResult; onRetest: () => void }) {
  const scores = result.scores;
  const sortedScores = [...scores].sort((a, b) => b.score - a.score);
  const top3 = sortedScores.slice(0, 3);
  const bottom2 = sortedScores.slice(-2);

  return (
    <div style={{ paddingBottom: '20px' }}>
      {/* Hero 区域 */}
      <div style={{
        background: `linear-gradient(135deg, ${QM_BRAND_COLOR}, #8B6CB6)`,
        borderRadius: '20px',
        padding: '28px 24px',
        color: 'white',
        marginBottom: '24px',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: '13px', opacity: 0.8, marginBottom: '8px' }}>
          你的多元智能画像
        </p>
        <h2 style={{
          fontSize: '20px',
          fontWeight: 700,
          lineHeight: 1.5,
          marginBottom: '16px',
        }}>
          {result.profileSignature.headline}
        </h2>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          flexWrap: 'wrap',
        }}>
          {top3.map((s) => (
            <span key={s.dimension} style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '12px',
            }}>
              {miDimensions[s.dimension].icon} {miDimensions[s.dimension].name} · {s.score}
            </span>
          ))}
        </div>
      </div>

      {/* 维度雷达图（简化柱状图表示） */}
      <SectionCard title="八维当前显现程度">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {sortedScores.map((s) => {
            const dim = miDimensions[s.dimension];
            return (
              <div key={s.dimension}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '13px',
                  marginBottom: '4px',
                }}>
                  <span>
                    {dim.icon} {dim.name}
                    <span style={{
                      fontSize: '11px',
                      color: '#999',
                      marginLeft: '6px',
                    }}>
                      · {manifestationLabel(s.manifestation)}
                    </span>
                  </span>
                  <span style={{ fontWeight: 600, color: QM_BRAND_COLOR }}>{s.score}</span>
                </div>
                <div style={{
                  height: '8px',
                  backgroundColor: '#F0EBF8',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${s.score}%`,
                    backgroundColor: dim.color,
                    borderRadius: '4px',
                  }} />
                </div>
              </div>
            );
          })}
        </div>
        <p style={{
          fontSize: '11px',
          color: '#999',
          marginTop: '12px',
          textAlign: 'center',
        }}>
          分数为本次题目量尺位置（0-100），不是人口百分位。norm_status = unapproved
        </p>
      </SectionCard>

      {/* 28 组 Pair Matrix（展示 Top 协同） */}
      <SectionCard title="智能组合 · 协同效应">
        {result.pairMatrix
          .filter((p) => p.relation === 'synergy')
          .sort((a, b) => b.strength - a.strength)
          .slice(0, 4)
          .map((p, i) => (
            <div key={i} style={{
              padding: '12px',
              backgroundColor: '#F9F6FD',
              borderRadius: '10px',
              marginBottom: i < 3 ? '10px' : 0,
            }}>
              <div style={{
                fontSize: '14px',
                fontWeight: 600,
                color: QM_BRAND_COLOR,
                marginBottom: '4px',
              }}>
                {miDimensions[p.pair[0]].shortName} × {miDimensions[p.pair[1]].shortName}
                <span style={{ fontWeight: 400, fontSize: '12px', marginLeft: '8px', color: '#999' }}>
                  强度 {p.strength}
                </span>
              </div>
              <p style={{ fontSize: '13px', color: '#555', lineHeight: 1.5 }}>
                {p.description}
              </p>
            </div>
          ))}
      </SectionCard>

      {/* 场景适配 */}
      <SectionCard title="场景适配度 Top 5">
        {result.sceneFits
          .sort((a, b) => b.fitScore - a.fitScore)
          .slice(0, 5)
          .map((sf, i) => {
            const def = sceneDefinitions.find((s) => s.code === sf.scene);
            return (
              <div key={sf.scene} style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px 0',
                borderBottom: i < 4 ? '1px solid #F0EBF8' : 'none',
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: '#F3EEF9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  marginRight: '12px',
                }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: '#333' }}>
                    {def?.name ?? sf.scene}
                  </div>
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    适配度 {sf.fitScore}
                  </div>
                </div>
              </div>
            );
          })}
      </SectionCard>

      {/* 温柔耳语 */}
      <SectionCard title="温柔耳语">
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
        }}>
          {result.whispers.slice(0, 8).map((w, i) => (
            <div key={i} style={{
              padding: '12px',
              backgroundColor: '#FFF9FB',
              borderRadius: '10px',
              border: '1px solid #F3E9F3',
              fontSize: '12px',
              color: '#6B4C9A',
              lineHeight: 1.5,
            }}>
              💜 {w}
            </div>
          ))}
        </div>
        {result.whispers.length > 8 && (
          <p style={{ textAlign: 'center', fontSize: '12px', color: '#999', marginTop: '12px' }}>
            共 {result.whispers.length} 条耳语 · 每次测评都会不同
          </p>
        )}
      </SectionCard>

      {/* 故事镜 - 人物 */}
      <SectionCard title="人物故事镜">
        {result.storyMirror.people.map((p, i) => (
          <div key={p.id} style={{
            marginBottom: i < result.storyMirror.people.length - 1 ? '16px' : 0,
            paddingBottom: i < result.storyMirror.people.length - 1 ? '16px' : 0,
            borderBottom: i < result.storyMirror.people.length - 1 ? '1px solid #F0EBF8' : 'none',
          }}>
            <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#222', marginBottom: '6px' }}>
              {p.name_cn}
              <span style={{ fontWeight: 400, fontSize: '12px', color: '#999', marginLeft: '8px' }}>
                {p.field} · {p.culture_region}
              </span>
            </h4>
            <p style={{ fontSize: '13px', color: '#555', lineHeight: 1.6, marginBottom: '8px' }}>
              {p.match}
            </p>
            <p style={{ fontSize: '12px', color: '#888', lineHeight: 1.6, fontStyle: 'italic' }}>
              " {p.observationQuestion}
            </p>
          </div>
        ))}
        <p style={{ fontSize: '11px', color: '#aaa', marginTop: '8px' }}>
          * 故事镜为行为镜映，不是诊断或对标。你在别人故事里看到的，也是你自己的一部分。
        </p>
      </SectionCard>

      {/* 故事镜 - 影视 */}
      <SectionCard title="影视文学故事镜">
        {result.storyMirror.media.map((m, i) => (
          <div key={m.id} style={{
            marginBottom: i < result.storyMirror.media.length - 1 ? '16px' : 0,
            paddingBottom: i < result.storyMirror.media.length - 1 ? '16px' : 0,
            borderBottom: i < result.storyMirror.media.length - 1 ? '1px solid #F0EBF8' : 'none',
          }}>
            <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#222', marginBottom: '4px' }}>
              {m.title_cn}
              <span style={{ fontWeight: 400, fontSize: '12px', color: '#999', marginLeft: '8px' }}>
                {m.media_type === 'movie' ? '电影' : m.media_type === 'tv' ? '剧集' : m.media_type === 'animation' ? '动画' : m.media_type === 'documentary' ? '纪录片' : '文学'} · {m.year}
              </span>
            </h4>
            <p style={{ fontSize: '12px', color: '#888', marginBottom: '6px' }}>
              角色：{m.character_name}
            </p>
            <p style={{ fontSize: '13px', color: '#555', lineHeight: 1.6, marginBottom: '8px' }}>
              {m.match}
            </p>
            <p style={{ fontSize: '12px', color: '#888', lineHeight: 1.6, fontStyle: 'italic' }}>
              💡 {m.transfer}
            </p>
            {m.content_warnings.length > 0 && (
              <p style={{ fontSize: '11px', color: '#c99', marginTop: '6px' }}>
                ⚠️ 内容提示：{m.content_warnings.slice(0, 3).join('、')}
              </p>
            )}
          </div>
        ))}
      </SectionCard>

      {/* 学习模式 */}
      <SectionCard title="你的学习模式偏好">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {result.learningModeMap.slice(0, 5).map((m) => (
            <div key={m.mode} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              backgroundColor: m.fitLevel === 'high' ? '#F3EEF9' : '#FAF8FC',
              borderRadius: '8px',
            }}>
              <span style={{ fontSize: '13px', fontWeight: 500 }}>{m.name}</span>
              <span style={{
                fontSize: '11px',
                color: m.fitLevel === 'high' ? QM_BRAND_COLOR : '#999',
                fontWeight: m.fitLevel === 'high' ? 600 : 400,
              }}>
                {m.fitLevel === 'high' ? '高度适配' : m.fitLevel === 'medium' ? '中等适配' : '较少使用'}
              </span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 行动工具 - 学习食谱 */}
      <SectionCard title="学习食谱 · 推荐">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {result.actionTools.learningRecipes.slice(0, 4).map((r) => (
            <div key={r.id} style={{
              padding: '12px',
              backgroundColor: '#F9F6FD',
              borderRadius: '10px',
            }}>
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: QM_BRAND_COLOR, marginBottom: '4px' }}>
                {r.title}
              </h4>
              <p style={{ fontSize: '12px', color: '#666', lineHeight: 1.5 }}>
                {r.description}
              </p>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 七日实验 */}
      <SectionCard title="七日自我探索实验">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {result.actionTools.weeklyExperiment.map((day) => (
            <div key={day.day} style={{
              display: 'flex',
              gap: '10px',
              padding: '10px 0',
              borderBottom: day.day < 7 ? '1px dashed #EFE9F7' : 'none',
            }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: QM_BRAND_COLOR,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 600,
                flexShrink: 0,
              }}>
                D{day.day}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 500, color: '#333' }}>
                  {day.title}
                </div>
                <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
                  {day.tryThis}
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* 结果置信说明 */}
      <SectionCard title="关于结果">
        <div style={{
          fontSize: '12px',
          color: '#777',
          lineHeight: 1.6,
          padding: '12px',
          backgroundColor: '#F9F8FC',
          borderRadius: '10px',
        }}>
          <p>📌 本测评共 24 题，每维 3 题，为轻量探索版。</p>
          <p>📌 0-100 分为本次题目量尺位置，不是人口百分位。</p>
          <p>📌 norm_status = {NORM_STATUS}，raw_read_only = {String(RAW_READ_ONLY)}</p>
          <p>📌 结果反映的是你当前状态下的智能调用方式，会随时间、状态、环境变化。</p>
          <p>📌 建议把结果当作一次自我观察的起点，而不是最终结论。</p>
          {result.profileSignature.responseQuality.flags.length > 0 && (
            <p style={{ marginTop: '8px', color: '#a87' }}>
              ⚠️ 回答质量提示：{result.profileSignature.responseQuality.flags.join('、')}
            </p>
          )}
        </div>
      </SectionCard>

      {/* 操作按钮 */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginTop: '24px',
      }}>
        <button
          onClick={onRetest}
          style={{
            flex: 1,
            padding: '14px',
            borderRadius: '28px',
            border: `2px solid ${QM_BRAND_COLOR}`,
            backgroundColor: 'white',
            color: QM_BRAND_COLOR,
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          重新测评
        </button>
        <button
          onClick={() => { window.location.href = '/'; }}
          style={{
            flex: 1,
            padding: '14px',
            borderRadius: '28px',
            border: 'none',
            backgroundColor: QM_BRAND_COLOR,
            color: 'white',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          和 {QM_AI_NAME} 聊聊
        </button>
      </div>
    </div>
  );
}

// ===== 辅助组件：卡片 =====
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '20px',
      marginBottom: '16px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    }}>
      <h3 style={{
        fontSize: '16px',
        fontWeight: 700,
        color: '#222',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <span style={{
          width: '4px',
          height: '16px',
          backgroundColor: QM_BRAND_COLOR,
          borderRadius: '2px',
        }} />
        {title}
      </h3>
      {children}
    </div>
  );
}

// ===== 辅助函数 =====
function manifestationLabel(m: string): string {
  switch (m) {
    case 'more_visible': return '更多显现';
    case 'moderate': return '中等显现';
    case 'less_visible': return '较少显现';
    default: return '';
  }
}
