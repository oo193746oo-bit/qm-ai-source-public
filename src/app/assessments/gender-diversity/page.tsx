/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
'use client';

// QM-GDI-48 v4.1 三阶段页面
// 1. intro 介绍页
// 2. quiz 答题页
// 3. result 结果页
//
// 独立三阶段页面：/assessments/gender-diversity

import React, { useState, useCallback } from 'react';
import { GDI_QUESTIONS_48, LIKERT_CONFIG, TOTAL_QUESTIONS } from '@/lib/gdi-v41/gdi-questions-48';
import { buildAssessmentProfile, canGenerateResult, computeQualityGate } from '@/lib/gdi-v41/gdi-scoring';
import { GDI_DIMENSIONS, DIMENSION_ORDER } from '@/lib/gdi-v41/gdi-dimensions';
import { selectModulesForProfile } from '@/lib/gdi-v41/gdi-module-pool';
import { recommendWhispersForProfile, getRandomOpenQuestion } from '@/lib/gdi-v41/gdi-whispers';
import { generateStoryMirrorSet } from '@/lib/gdi-v41/gdi-mirror-reasoning';
import { generateNarrative, generateActionSuggestions, generateOpenQuestion, generateSafetyNote } from '@/lib/gdi-v41/gdi-narrative';
import { BRAND_COLOR } from '@/lib/gdi-v41/gdi-visualizations';
import { AnswerMap, AnswerValue, AssessmentProfile, ModuleDefinition, Whisper } from '@/lib/gdi-v41/gdi-types';

type Phase = 'intro' | 'quiz' | 'result';

const GenderDiversityPage: React.FC = () => {
  const [phase, setPhase] = useState<Phase>('intro');
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [profile, setProfile] = useState<AssessmentProfile | null>(null);
  const [selectedModules, setSelectedModules] = useState<ModuleDefinition[]>([]);
  const [whispers, setWhispers] = useState<Whisper[]>([]);
  const [openQuestion, setOpenQuestion] = useState('');
  const [actionSuggestions, setActionSuggestions] = useState<string[]>([]);
  const [safetyNote, setSafetyNote] = useState<string | null>(null);
  const [storyMirror, setStoryMirror] = useState<{ people: any[]; media: any[] } | null>(null);
  const [narrative, setNarrative] = useState<any>(null);

  // === 开始测评 ===
  const handleStart = useCallback(() => {
    setPhase('quiz');
    setStartTime(Date.now());
    setCurrentQuestionIndex(0);
    setAnswers({});
  }, []);

  // === 回答问题 ===
  const handleAnswer = useCallback((questionId: string, value: AnswerValue) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  }, []);

  // === 下一题 ===
  const handleNext = useCallback(() => {
    if (currentQuestionIndex < GDI_QUESTIONS_48.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  }, [currentQuestionIndex]);

  // === 上一题 ===
  const handlePrev = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  }, [currentQuestionIndex]);

  // === 提交答案 ===
  const handleSubmit = useCallback(() => {
    if (!startTime) return;

    const durationSeconds = (Date.now() - startTime) / 1000;
    const quality = computeQualityGate(answers, durationSeconds);

    if (quality.completionStatus === 'insufficient') {
      alert('答题完成度不足75%，请至少完成36题（75%）才能提交。');
      return;
    }

    const newProfile = buildAssessmentProfile(answers, durationSeconds);
    setProfile(newProfile);

    // 生成模块
    const modules = selectModulesForProfile(newProfile);
    setSelectedModules(modules);

    // 生成耳语
    const selectedWhispers = recommendWhispersForProfile(newProfile, 12);
    setWhispers(selectedWhispers);

    // 生成开放问题（1个）
    const oq = generateOpenQuestion(newProfile);
    setOpenQuestion(oq);

    // 生成行动建议
    const actions = generateActionSuggestions(newProfile);
    setActionSuggestions(actions);

    // 生成安全提示
    const safety = generateSafetyNote(newProfile);
    setSafetyNote(safety);

    // 生成Story Mirror
    const mirror = generateStoryMirrorSet(newProfile);
    setStoryMirror(mirror);

    // 生成叙事
    const narr = generateNarrative(newProfile);
    setNarrative(narr);

    setPhase('result');
  }, [answers, startTime]);

  // === 重新测评 ===
  const handleRestart = useCallback(() => {
    setPhase('intro');
    setAnswers({});
    setCurrentQuestionIndex(0);
    setStartTime(null);
    setProfile(null);
    setSelectedModules([]);
    setWhispers([]);
    setOpenQuestion('');
    setActionSuggestions([]);
    setSafetyNote(null);
    setStoryMirror(null);
    setNarrative(null);
  }, []);

  // === 计算进度 ===
  const answeredCount = Object.values(answers).filter(
    (v) => typeof v === 'number' && v >= 1 && v <= 7
  ).length;
  const progress = (answeredCount / TOTAL_QUESTIONS) * 100;
  const completionRate = answeredCount / TOTAL_QUESTIONS;
  const canSubmit = completionRate >= 0.75;

  const currentQuestion = GDI_QUESTIONS_48[currentQuestionIndex];

  // ===== 渲染 =====
  if (phase === 'intro') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.header}>
            <div style={styles.logo}>QM</div>
            <h1 style={styles.title}>性别多元指数</h1>
            <p style={styles.subtitle}>QM-GDI-48 v4.1 · 研究知情版</p>
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>关于这个测评</h2>
            <p style={styles.paragraph}>
              QM性别多元指数是一份自我探索工具，帮助你了解自己性别体验的多个侧面。
              它不是诊断，也不会给你下任何身份判定。
            </p>
            <p style={styles.paragraph}>
              本测评包含48道题目，从8个维度描绘你的性别画像。每道题都是7点量表，
              你可以选择"非常不符合"到"非常符合"，也可以选择"不适用/不想回答"。
            </p>
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>8个维度</h2>
            <div style={styles.dimGrid}>
              {DIMENSION_ORDER.map((dim) => (
                <div key={dim} style={styles.dimCard}>
                  <div style={{ ...styles.dimCode, color: GDI_DIMENSIONS[dim].color }}>
                    {dim}
                  </div>
                  <div style={styles.dimName}>{GDI_DIMENSIONS[dim].name}</div>
                  <div style={styles.dimDef}>{GDI_DIMENSIONS[dim].definition}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>你需要知道</h2>
            <ul style={styles.infoList}>
              <li>共48题，约需8-12分钟完成</li>
              <li>7点李克特量表 + "不适用/不想回答"选项</li>
              <li>反向题自动计分，无需你操心</li>
              <li>没有总分，每个维度独立解读</li>
              <li>不诊断，不鉴定任何性别身份</li>
              <li>高低都不是优劣，只是不同的经验形态</li>
            </ul>
          </div>

          <div style={styles.disclaimerBox}>
            <p style={styles.disclaimerText}>
              <strong>研究知情声明：</strong>
              本测评处于研究阶段，其信效度数据仍在积累中。结果仅供自我探索参考，
              不应用于任何临床诊断、法律用途或重大人生决策。
            </p>
          </div>

          <button style={styles.startButton} onClick={handleStart}>
            开始探索
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'quiz') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          {/* 进度条 */}
          <div style={styles.progressBarContainer}>
            <div
              style={{
                ...styles.progressBar,
                width: `${progress}%`,
                backgroundColor: BRAND_COLOR,
              }}
            />
            <span style={styles.progressText}>
              {currentQuestionIndex + 1} / {TOTAL_QUESTIONS}
            </span>
          </div>

          {/* 题号和维度标签 */}
          <div style={styles.questionMeta}>
            <span style={styles.questionNum}>第 {currentQuestionIndex + 1} 题</span>
            <span style={{ ...styles.dimensionBadge, backgroundColor: GDI_DIMENSIONS[currentQuestion.dimension].color }}>
              {GDI_DIMENSIONS[currentQuestion.dimension].name}
            </span>
          </div>

          {/* 题目 */}
          <h2 style={styles.questionText}>{currentQuestion.text}</h2>

          {/* 选项 */}
          <div style={styles.optionsContainer}>
            {LIKERT_CONFIG.labels.map((label, index) => {
              const value = (index + 1) as AnswerValue;
              const isSelected = answers[currentQuestion.id] === value;
              return (
                <button
                  key={index}
                  style={{
                    ...styles.likertButton,
                    backgroundColor: isSelected ? BRAND_COLOR : '#fff',
                    color: isSelected ? '#fff' : '#333',
                    borderColor: isSelected ? BRAND_COLOR : '#ddd',
                  }}
                  onClick={() => {
                    handleAnswer(currentQuestion.id, value);
                    if (currentQuestionIndex < TOTAL_QUESTIONS - 1) {
                      handleNext();
                    }
                  }}
                >
                  <div style={styles.likertNumber}>{index + 1}</div>
                  <div style={styles.likertLabel}>{label}</div>
                </button>
              );
            })}
          </div>

          {/* N/A 按钮 */}
          <button
            style={{
              ...styles.naButton,
              backgroundColor: answers[currentQuestion.id] === 'N/A' ? '#eee' : '#f8f8f8',
              borderColor: answers[currentQuestion.id] === 'N/A' ? '#999' : '#ddd',
            }}
            onClick={() => {
              handleAnswer(currentQuestion.id, 'N/A');
              if (currentQuestionIndex < TOTAL_QUESTIONS - 1) {
                handleNext();
              }
            }}
          >
            不适用 / 不想回答
          </button>

          {/* 导航按钮 */}
          <div style={styles.navButtons}>
            <button
              style={{ ...styles.navButton, visibility: currentQuestionIndex === 0 ? 'hidden' : 'visible' }}
              onClick={handlePrev}
            >
              ← 上一题
            </button>

            {currentQuestionIndex === TOTAL_QUESTIONS - 1 ? (
              <button
                style={{
                  ...styles.submitButton,
                  opacity: canSubmit ? 1 : 0.5,
                  cursor: canSubmit ? 'pointer' : 'not-allowed',
                }}
                onClick={handleSubmit}
                disabled={!canSubmit}
              >
                提交答案
              </button>
            ) : (
              <button
                style={styles.navButton}
                onClick={handleNext}
              >
                下一题 →
              </button>
            )}
          </div>

          {!canSubmit && (
            <p style={styles.completionHint}>
              完成度 {Math.round(completionRate * 100)}%，至少需要75%（36题）才能提交
            </p>
          )}
        </div>
      </div>
    );
  }

  if (phase === 'result' && profile && narrative) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          {/* 结果头部 */}
          <div style={styles.resultHeader}>
            <div style={styles.logo}>QM</div>
            <h1 style={styles.resultTitle}>你的性别多元画像</h1>
            <p style={styles.resultSubtitle}>QM-GDI-48 v4.1</p>
          </div>

          {/* Headline */}
          <div style={styles.headlineBox}>
            <p style={styles.headlineText}>{narrative.headline}</p>
          </div>

          {/* 雷达图占位 */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>八维概览</h3>
            <div style={styles.radarPlaceholder}>
              <div style={styles.radarGrid}>
                {DIMENSION_ORDER.map((dim) => {
                  const score = profile.plotScores[dim] ?? 0;
                  return (
                    <div key={dim} style={styles.radarBarRow}>
                      <div style={{ ...styles.radarBarLabel, color: GDI_DIMENSIONS[dim].color }}>
                        {GDI_DIMENSIONS[dim].name}
                      </div>
                      <div style={styles.radarBarTrack}>
                        <div
                          style={{
                            ...styles.radarBarFill,
                            width: `${score}%`,
                            backgroundColor: GDI_DIMENSIONS[dim].color,
                          }}
                        />
                      </div>
                      <div style={styles.radarBarValue}>
                        {profile.scores[dim].incomplete ? '—' : `${Math.round(score)}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 逐维解读 */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>逐维解读</h3>
            {DIMENSION_ORDER.map((dim) => (
              <div key={dim} style={styles.dimInsightCard}>
                <div style={{ ...styles.dimInsightHeader, borderLeftColor: GDI_DIMENSIONS[dim].color }}>
                  <span style={{ ...styles.dimInsightCode, color: GDI_DIMENSIONS[dim].color }}>
                    {dim}
                  </span>
                  <span style={styles.dimInsightName}>{GDI_DIMENSIONS[dim].name}</span>
                  <span style={styles.dimInsightScore}>
                    {profile.scores[dim].incomplete ? '数据不足' : `${Math.round(profile.plotScores[dim] ?? 0)}分`}
                  </span>
                </div>
                <p style={styles.dimInsightText}>
                  {narrative.dimensionInsights[dim]}
                </p>
              </div>
            ))}
          </div>

          {/* Pair组合 */}
          {narrative.pairInsights.length > 0 && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>维度之间</h3>
              {narrative.pairInsights.map((insight: string, idx: number) => (
                <div key={idx} style={styles.pairCard}>
                  <p style={styles.pairText}>{insight}</p>
                </div>
              ))}
            </div>
          )}

          {/* 安全环境提示 */}
          {safetyNote && (
            <div style={{ ...styles.section, ...styles.safetySection }}>
              <h3 style={styles.safetyTitle}>安全环境提示</h3>
              <p style={styles.safetyText}>{safetyNote}</p>
            </div>
          )}

          {/* 小酷耳语 */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>小酷耳语</h3>
            <div style={styles.whispersGrid}>
              {whispers.slice(0, 6).map((whisper) => (
                <div key={whisper.id} style={styles.whisperCard}>
                  <p style={styles.whisperText}>"{whisper.text}"</p>
                </div>
              ))}
            </div>
          </div>

          {/* 开放问题 */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>给你的一个问题</h3>
            <div style={styles.openQuestionBox}>
              <p style={styles.openQuestionText}>💭 {openQuestion}</p>
            </div>
          </div>

          {/* Story Mirror 人物 */}
          {storyMirror && storyMirror.people.length > 0 && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Story Mirror · 人物</h3>
              <p style={styles.mirrorNote}>
                以下人物基于行为主题相似性进行镜像匹配，不做身份判定。
              </p>
              <div style={styles.peopleGrid}>
                {storyMirror.people.map((result: any) => {
                  const person = result.item;
                  return (
                    <div key={person.id} style={styles.personCard}>
                      <h4 style={styles.personName}>{person.chineseName}</h4>
                      <p style={styles.personField}>{person.field}</p>
                      <p style={styles.personDesc}>{person.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Story Mirror 影视/文学 */}
          {storyMirror && storyMirror.media.length > 0 && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Story Mirror · 影视文学</h3>
              <p style={styles.mirrorNote}>
                以下作品基于主题相似性推荐，做行为镜像和叙事连接。
              </p>
              <div style={styles.mediaGrid}>
                {storyMirror.media.map((result: any) => {
                  const media = result.item;
                  return (
                    <div key={media.id} style={styles.mediaCard}>
                      <div style={styles.mediaTypeBadge}>
                        {media.type === 'film' ? '电影' : media.type === 'tv' ? '剧集' : media.type === 'documentary' ? '纪录片' : '文学'}
                      </div>
                      <h4 style={styles.mediaName}>{media.chineseTitle}</h4>
                      <p style={styles.mediaYear}>{media.year}</p>
                      <p style={styles.mediaDesc}>{media.description}</p>
                      {media.contentWarnings.length > 0 && (
                        <p style={styles.contentWarning}>
                          ⚠ 内容提示：{media.contentWarnings.join('、')}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 探索行动建议 */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>探索实验</h3>
            <ul style={styles.actionList}>
              {actionSuggestions.map((action, idx) => (
                <li key={idx} style={styles.actionItem}>
                  {action}
                </li>
              ))}
            </ul>
          </div>

          {/* 结果说明 */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>结果说明</h3>
            <div style={styles.disclaimerBox}>
              <p style={styles.disclaimerText}>
                <strong>心理测量学状态：</strong>
                本测评（QM-GDI-48 v4.1）处于研究阶段，其信效度数据仍在积累中。
                结果仅供自我探索参考，不应用于任何临床诊断、法律用途或重大人生决策。
              </p>
              <p style={styles.disclaimerText}>
                <strong>非诊断声明：</strong>
                本测评不诊断，不鉴定任何性别身份。高低分都不代表好坏，
                只是描述了你性别经验的不同侧面。
              </p>
              <p style={styles.disclaimerText}>
                <strong>AI说明：</strong>
                本测评中的AI助手"小酷"自称QM AI，仅提供信息性和支持性的回应，
                不提供诊断或专业建议。
              </p>
            </div>
          </div>

          {/* 专业支持 */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>专业支持</h3>
            <div style={styles.supportBox}>
              <p style={styles.supportTitle}>QM上海酷儿心理咨询中心</p>
              <p style={styles.supportItem}>主热线：15001930070</p>
              <p style={styles.supportItem}>备用热线：13601658763</p>
              <p style={styles.supportItem}>联系人工客服（「联系我们」页面）</p>
            </div>
          </div>

          {/* 导出和操作按钮 */}
          <div style={styles.actionButtons}>
            <button style={styles.actionBtn}>导出PNG</button>
            <button style={styles.actionBtn}>导出PDF</button>
            <button style={styles.actionBtn}>分享卡片</button>
          </div>

          <div style={styles.chatSection}>
            <button style={styles.chatButton}>
              💬 和小酷聊聊你的画像
            </button>
          </div>

          <button style={styles.restartButton} onClick={handleRestart}>
            重新测评
          </button>

          <p style={styles.footerText}>
            QM-GDI-48 v4.1 · 研究知情版 · 生成时间：
            {new Date().toLocaleString('zh-CN')}
          </p>
        </div>
      </div>
    );
  }

  return null;
};

// === 样式 ===
const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#F5F0FF',
    padding: '20px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    fontFamily: '"PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", sans-serif',
  },
  card: {
    maxWidth: '720px',
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '32px',
    boxShadow: '0 4px 24px rgba(107, 76, 154, 0.1)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  logo: {
    width: '56px',
    height: '56px',
    lineHeight: '56px',
    textAlign: 'center',
    backgroundColor: BRAND_COLOR,
    color: '#fff',
    borderRadius: '14px',
    fontSize: '20px',
    fontWeight: 700,
    margin: '0 auto 16px',
  },
  title: {
    fontSize: '28px',
    color: '#333',
    margin: '0 0 8px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#999',
    margin: 0,
  },
  section: {
    marginBottom: '28px',
  },
  sectionTitle: {
    fontSize: '18px',
    color: '#333',
    margin: '0 0 16px',
    paddingLeft: '12px',
    borderLeft: `4px solid ${BRAND_COLOR}`,
  },
  paragraph: {
    fontSize: '15px',
    lineHeight: 1.8,
    color: '#555',
    margin: '0 0 12px',
  },
  dimGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
  },
  dimCard: {
    padding: '12px',
    backgroundColor: '#faf8ff',
    borderRadius: '8px',
    border: '1px solid #eee',
  },
  dimCode: {
    fontSize: '14px',
    fontWeight: 700,
    marginBottom: '4px',
  },
  dimName: {
    fontSize: '13px',
    color: '#333',
    fontWeight: 600,
    marginBottom: '4px',
  },
  dimDef: {
    fontSize: '12px',
    color: '#888',
    lineHeight: 1.5,
  },
  infoList: {
    fontSize: '14px',
    color: '#555',
    lineHeight: 2,
    paddingLeft: '20px',
    margin: 0,
  },
  disclaimerBox: {
    backgroundColor: '#faf8ff',
    border: '1px solid #e5def0',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '24px',
  },
  disclaimerText: {
    fontSize: '13px',
    color: '#777',
    lineHeight: 1.7,
    margin: '0 0 8px',
  },
  startButton: {
    width: '100%',
    padding: '16px',
    backgroundColor: BRAND_COLOR,
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '18px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  // Quiz styles
  progressBarContainer: {
    position: 'relative',
    height: '6px',
    backgroundColor: '#eee',
    borderRadius: '3px',
    marginBottom: '24px',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.3s ease',
  },
  progressText: {
    position: 'absolute',
    right: 0,
    top: '-20px',
    fontSize: '12px',
    color: '#999',
  },
  questionMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  questionNum: {
    fontSize: '14px',
    color: '#999',
  },
  dimensionBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    color: '#fff',
    fontWeight: 500,
  },
  questionText: {
    fontSize: '20px',
    color: '#333',
    lineHeight: 1.6,
    marginBottom: '24px',
    fontWeight: 500,
  },
  optionsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '16px',
  },
  likertButton: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    backgroundColor: '#fff',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
  },
  likertNumber: {
    width: '24px',
    height: '24px',
    lineHeight: '24px',
    textAlign: 'center',
    borderRadius: '50%',
    backgroundColor: 'rgba(0,0,0,0.05)',
    fontSize: '12px',
    fontWeight: 600,
    marginRight: '12px',
  },
  likertLabel: {
    fontSize: '15px',
  },
  naButton: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    backgroundColor: '#f8f8f8',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#666',
    fontFamily: 'inherit',
    marginBottom: '20px',
  },
  navButtons: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
  },
  navButton: {
    padding: '12px 24px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontSize: '15px',
    color: '#555',
    fontFamily: 'inherit',
  },
  submitButton: {
    padding: '12px 32px',
    backgroundColor: BRAND_COLOR,
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: 600,
    fontFamily: 'inherit',
  },
  completionHint: {
    textAlign: 'center',
    fontSize: '13px',
    color: '#999',
    marginTop: '12px',
  },
  // Result styles
  resultHeader: {
    textAlign: 'center',
    marginBottom: '24px',
  },
  resultTitle: {
    fontSize: '26px',
    color: '#333',
    margin: '8px 0 4px',
  },
  resultSubtitle: {
    fontSize: '13px',
    color: '#999',
    margin: 0,
  },
  headlineBox: {
    backgroundColor: '#faf8ff',
    borderLeft: `4px solid ${BRAND_COLOR}`,
    padding: '16px 20px',
    borderRadius: '0 8px 8px 0',
    marginBottom: '28px',
  },
  headlineText: {
    fontSize: '15px',
    color: '#555',
    lineHeight: 1.8,
    margin: 0,
  },
  radarPlaceholder: {
    backgroundColor: '#faf8ff',
    borderRadius: '12px',
    padding: '20px',
  },
  radarBarRow: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '10px',
    gap: '10px',
  },
  radarBarLabel: {
    width: '90px',
    fontSize: '13px',
    fontWeight: 500,
    textAlign: 'right',
  },
  radarBarTrack: {
    flex: 1,
    height: '8px',
    backgroundColor: '#eee',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  radarBarFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.5s ease',
  },
  radarBarValue: {
    width: '40px',
    fontSize: '13px',
    color: '#666',
    textAlign: 'right',
  },
  dimInsightCard: {
    marginBottom: '16px',
    backgroundColor: '#fafafa',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  dimInsightHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 16px',
    backgroundColor: '#fff',
    borderLeft: '4px solid',
    borderBottom: '1px solid #eee',
    gap: '8px',
  },
  dimInsightCode: {
    fontSize: '13px',
    fontWeight: 700,
  },
  dimInsightName: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#333',
    flex: 1,
  },
  dimInsightScore: {
    fontSize: '13px',
    color: '#999',
  },
  dimInsightText: {
    padding: '12px 16px',
    fontSize: '14px',
    color: '#555',
    lineHeight: 1.7,
    margin: 0,
  },
  pairCard: {
    backgroundColor: '#faf8ff',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '8px',
  },
  pairText: {
    fontSize: '14px',
    color: '#555',
    lineHeight: 1.7,
    margin: 0,
  },
  safetySection: {
    backgroundColor: '#fff5f5',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid #ffd4d4',
  },
  safetyTitle: {
    fontSize: '16px',
    color: '#c0392b',
    margin: '0 0 12px',
  },
  safetyText: {
    fontSize: '14px',
    color: '#555',
    lineHeight: 1.7,
    margin: 0,
    whiteSpace: 'pre-line',
  },
  whispersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
  },
  whisperCard: {
    backgroundColor: '#faf8ff',
    padding: '12px',
    borderRadius: '8px',
    borderLeft: `3px solid ${BRAND_COLOR}`,
  },
  whisperText: {
    fontSize: '13px',
    color: '#666',
    lineHeight: 1.6,
    margin: 0,
    fontStyle: 'italic',
  },
  openQuestionBox: {
    backgroundColor: '#fff8ef',
    border: '1px solid #ffe0b2',
    borderRadius: '8px',
    padding: '16px',
    textAlign: 'center',
  },
  openQuestionText: {
    fontSize: '16px',
    color: '#795548',
    margin: 0,
    fontWeight: 500,
  },
  mirrorNote: {
    fontSize: '12px',
    color: '#999',
    marginBottom: '12px',
  },
  peopleGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
  },
  personCard: {
    backgroundColor: '#fafafa',
    padding: '12px',
    borderRadius: '8px',
  },
  personName: {
    fontSize: '14px',
    color: '#333',
    margin: '0 0 4px',
  },
  personField: {
    fontSize: '11px',
    color: BRAND_COLOR,
    margin: '0 0 6px',
  },
  personDesc: {
    fontSize: '12px',
    color: '#777',
    lineHeight: 1.5,
    margin: 0,
  },
  mediaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
  },
  mediaCard: {
    backgroundColor: '#fafafa',
    padding: '12px',
    borderRadius: '8px',
    position: 'relative',
  },
  mediaTypeBadge: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    padding: '2px 8px',
    backgroundColor: BRAND_COLOR,
    color: '#fff',
    borderRadius: '4px',
    fontSize: '10px',
  },
  mediaName: {
    fontSize: '13px',
    color: '#333',
    margin: '0 0 2px',
    paddingRight: '32px',
  },
  mediaYear: {
    fontSize: '11px',
    color: '#999',
    margin: '0 0 6px',
  },
  mediaDesc: {
    fontSize: '11px',
    color: '#777',
    lineHeight: 1.4,
    margin: '0 0 6px',
  },
  contentWarning: {
    fontSize: '10px',
    color: '#e67e22',
    margin: 0,
  },
  actionList: {
    paddingLeft: '20px',
    margin: 0,
  },
  actionItem: {
    fontSize: '14px',
    color: '#555',
    lineHeight: 1.8,
    marginBottom: '6px',
  },
  supportBox: {
    backgroundColor: '#f5f0ff',
    borderRadius: '8px',
    padding: '16px',
  },
  supportTitle: {
    fontSize: '15px',
    color: BRAND_COLOR,
    fontWeight: 600,
    margin: '0 0 8px',
  },
  supportItem: {
    fontSize: '13px',
    color: '#555',
    margin: '4px 0',
  },
  actionButtons: {
    display: 'flex',
    gap: '10px',
    marginBottom: '16px',
  },
  actionBtn: {
    flex: 1,
    padding: '12px',
    border: `1px solid ${BRAND_COLOR}`,
    backgroundColor: '#fff',
    color: BRAND_COLOR,
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontFamily: 'inherit',
  },
  chatSection: {
    marginBottom: '16px',
  },
  chatButton: {
    width: '100%',
    padding: '14px',
    backgroundColor: BRAND_COLOR,
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 600,
    fontFamily: 'inherit',
  },
  restartButton: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    backgroundColor: '#fafafa',
    color: '#666',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontFamily: 'inherit',
    marginBottom: '16px',
  },
  footerText: {
    textAlign: 'center',
    fontSize: '11px',
    color: '#bbb',
    margin: 0,
  },
};

export default GenderDiversityPage;
