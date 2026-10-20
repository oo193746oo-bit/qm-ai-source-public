/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// QM AI 多元智能测评 v4.0 — 集成钩子
// 导出 multipleIntelV4Assessment（兼容 AssessmentInfo）和 addMultipleIntelV4 函数
// 注意：id 保持 'multiple-intelligence' 覆盖旧版，不新建 id

import { miQuestions24, TOTAL_QUESTIONS, QUESTIONNAIRE_VERSION } from './mi-questions-24';
import { scoreAssessment } from './mi-scoring';
import { calculateSceneFits, getTopScenes } from './mi-scenes';
import { selectModules } from './mi-module-pool';
import { whispers } from './mi-whispers';
import { peopleStoryMirrors } from './mi-story-mirror-people';
import { mediaStoryMirrors } from './mi-story-mirror-media';
import { selectAndReasonPeople, selectAndReasonMedia } from './mi-mirror-reasoning';
import { generateHeadline, generateProfileSummary } from './mi-narrative';
import {
  getLearningModeMap,
  getExpressionMap,
  getEnvironmentFit,
  getEnergyFriction,
} from './mi-learning';
import {
  getLearningRecipes,
  getProjectRoleCards,
  getCommunicationTranslations,
  getSkillPracticeMenu,
  getWeeklyExperiment,
} from './mi-action-tools';
import { getExportConfig } from './mi-export';
import {
  applyPersonalization,
  DEFAULT_PERSONALIZATION,
} from './mi-personalization';
import {
  NORM_STATUS,
  RAW_READ_ONLY,
  QM_BRAND_COLOR,
  QM_AI_NAME,
  QM_HOTLINE,
  QM_REFERRAL,
  QM_WECHAT,
} from './mi-types';
import type {
  MIResult,
  DimensionScore,
  PersonalizationOptions,
} from './mi-types';

// ===== Assessment Info（兼容框架的测评定义） =====
export interface AssessmentInfo {
  id: string;
  name: string;
  version: string;
  questionCount: number;
  dimensionCount: number;
  description: string;
  brandColor: string;
  aiName: string;
  referral: string;
  hotline: string;
  wechat: string;
  normStatus: string;
  rawReadOnly: boolean;
  // 方法
  getQuestions: () => { id: string; text: string }[];
  score: (answers: Record<string, number>, options?: { responseTimeSeconds?: number }) => MIResult;
}

// ===== 测评定义 =====
export const multipleIntelV4Assessment: AssessmentInfo = {
  id: 'multiple-intelligence',
  name: '多元智能测评 v4.0',
  version: 'v4.0',
  questionCount: TOTAL_QUESTIONS,
  dimensionCount: 8,
  description:
    '基于加德纳多元智能理论的轻量探索版测评，共 24 题，约 3-5 分钟完成。' +
    '结果展示 8 维当前显现程度、28 组智能组合、14 类场景适配、' +
    '温柔耳语、故事镜、学习食谱等行动工具。仅供自我探索，不作诊断。',
  brandColor: QM_BRAND_COLOR,
  aiName: QM_AI_NAME,
  referral: QM_REFERRAL,
  hotline: QM_HOTLINE,
  wechat: QM_WECHAT,
  normStatus: NORM_STATUS,
  rawReadOnly: RAW_READ_ONLY,

  getQuestions() {
    return miQuestions24.map((q) => ({ id: q.id, text: q.text }));
  },

  score(answers, options) {
    return computeFullResult(answers, options?.responseTimeSeconds);
  },
};

// ===== 计算完整结果 =====
function computeFullResult(
  answers: Record<string, number>,
  responseTimeSeconds?: number,
  personalizationOpts?: PersonalizationOptions,
): MIResult {
  // 1. 基础评分
  const scored = scoreAssessment(answers, { responseTimeSeconds });

  // 2. 场景适配
  const sceneFits = calculateSceneFits(scored.scores);
  // 更新 profileSignature 中的 contextFit
  scored.profileSignature.contextFit = getTopScenes(scored.scores, 5);

  // 3. 模块选择
  const selectedModules = selectModules(scored.scores, { minCount: 18 });

  // 4. 耳语筛选（每次 ≥ 12 条）
  const selectedWhispers = selectWhispers(scored.scores, 15);

  // 5. Story Mirror 人物
  const peopleResults = selectAndReasonPeople(
    scored.scores,
    scored.pairMatrix,
    peopleStoryMirrors,
    { count: 3 },
  );

  // 6. Story Mirror 影视
  const mediaResults = selectAndReasonMedia(
    scored.scores,
    scored.pairMatrix,
    mediaStoryMirrors,
    { count: 3 },
  );

  // 7. 学习模式、表达通道、环境适配
  const learningModeMap = getLearningModeMap(scored.scores);
  const expressionMap = getExpressionMap(scored.scores);
  const environmentFit = getEnvironmentFit(scored.scores);
  const energyFriction = getEnergyFriction(sceneFits);

  // 8. 行动工具
  const learningRecipes = getLearningRecipes(scored.scores);
  const projectRoleCards = getProjectRoleCards(scored.scores);
  const communicationTranslations = getCommunicationTranslations(scored.scores);
  const skillPracticeMenu = getSkillPracticeMenu(scored.scores);
  const weeklyExperiment = getWeeklyExperiment(scored.scores);

  // 9. 导出配置
  const exportConfig = getExportConfig();

  // 10. 构建 headline（覆盖评分里的简单版本）
  const headline = generateHeadline(scored.scores);
  scored.profileSignature.headline = headline;

  // 组装结果
  const result: MIResult = {
    questionnaireVersion: scored.questionnaireVersion as any,
    normStatus: 'unapproved',
    scores: scored.scores,
    profileSignature: scored.profileSignature,
    pairMatrix: scored.pairMatrix,
    sceneFits,
    learningModeMap,
    expressionMap,
    environmentFit,
    energyFriction,
    selectedModules,
    whispers: selectedWhispers,
    storyMirror: {
      people: peopleResults,
      media: mediaResults,
    },
    actionTools: {
      learningRecipes,
      projectRoleCards,
      communicationTranslations,
      skillPracticeMenu,
      weeklyExperiment,
    },
    exportConfig,
    personalization: personalizationOpts ?? DEFAULT_PERSONALIZATION,
  };

  // 应用个性化（如果 opt-in）
  if (personalizationOpts?.opt_in_example_personalization) {
    return applyPersonalization(result, personalizationOpts);
  }

  return result;
}

// ===== 耳语筛选 =====
function selectWhispers(scores: DimensionScore[], count: number): string[] {
  const scoreMap = new Map<string, number>();
  for (const s of scores) scoreMap.set(s.dimension, s.score);

  const topDims = [...scores].sort((a, b) => b.score - a.score).slice(0, 3).map((s) => s.dimension);
  const bottomDim = [...scores].sort((a, b) => a.score - b.score)[0].dimension;

  // 分类选择
  const selected: string[] = [];
  const usedIds = new Set<string>();

  // Top 3 维度各选 2 条 single_dimension
  for (const dim of topDims) {
    const dimWhispers = whispers.filter(
      (w) => w.category === 'single_dimension' && w.dimension === dim,
    );
    const picked = pickRandom(dimWhispers, 2, usedIds);
    for (const w of picked) {
      selected.push(w.text);
      usedIds.add(w.id);
    }
  }

  // 较少显现维度选 1 条（温和的）
  const lowWhispers = whispers.filter(
    (w) =>
      w.category === 'single_dimension' &&
      w.dimension === bottomDim &&
      (w.intensity === 'low' || w.intensity === 'mid_low'),
  );
  const lowPicked = pickRandom(lowWhispers, 1, usedIds);
  for (const w of lowPicked) {
    selected.push(w.text);
    usedIds.add(w.id);
  }

  // pair_combination 选 2 条（和 Top3 的组合相关）
  const topPairWhispers = whispers.filter(
    (w) =>
      w.category === 'pair_combination' &&
      w.pair &&
      topDims.some((d) => w.pair!.includes(d)),
  );
  const pairPicked = pickRandom(topPairWhispers, 2, usedIds);
  for (const w of pairPicked) {
    selected.push(w.text);
    usedIds.add(w.id);
  }

  // top3_synergy 选 1 条
  const synergyWhispers = whispers.filter((w) => w.category === 'top3_synergy');
  const synergyPicked = pickRandom(synergyWhispers, 1, usedIds);
  for (const w of synergyPicked) {
    selected.push(w.text);
    usedIds.add(w.id);
  }

  // scene 选 1 条（最高分场景相关）
  const topScene = getTopScenes(scores, 1)[0]?.scene;
  if (topScene) {
    const sceneWhispers = whispers.filter(
      (w) => w.category === 'scene' && w.scene === topScene,
    );
    const scenePicked = pickRandom(sceneWhispers, 1, usedIds);
    for (const w of scenePicked) {
      selected.push(w.text);
      usedIds.add(w.id);
    }
  }

  // life_domain 选 1 条
  const lifeWhispers = whispers.filter((w) => w.category === 'life_domain');
  const lifePicked = pickRandom(lifeWhispers, 1, usedIds);
  for (const w of lifePicked) {
    selected.push(w.text);
    usedIds.add(w.id);
  }

  // identity_culture 选 1 条
  const idWhispers = whispers.filter((w) => w.category === 'identity_culture');
  const idPicked = pickRandom(idWhispers, 1, usedIds);
  for (const w of idPicked) {
    selected.push(w.text);
    usedIds.add(w.id);
  }

  // experiment 选 1 条
  const expWhispers = whispers.filter((w) => w.category === 'experiment');
  const expPicked = pickRandom(expWhispers, 1, usedIds);
  for (const w of expPicked) {
    selected.push(w.text);
    usedIds.add(w.id);
  }

  // open_question 选 1 条
  const qWhispers = whispers.filter((w) => w.category === 'open_question');
  const qPicked = pickRandom(qWhispers, 1, usedIds);
  for (const w of qPicked) {
    selected.push(w.text);
    usedIds.add(w.id);
  }

  // 如果还不够，从所有剩余的里面补
  if (selected.length < count) {
    const remaining = whispers.filter((w) => !usedIds.has(w.id));
    const extra = pickRandom(remaining, count - selected.length, usedIds);
    for (const w of extra) {
      selected.push(w.text);
      usedIds.add(w.id);
    }
  }

  // 打乱顺序
  return shuffleArray(selected);
}

function pickRandom<T>(arr: T[], n: number, _used?: Set<string>): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// ===== addMultipleIntelV4 钩子 =====
// 用于在现有 assessments 注册处添加 v4 版本（覆盖旧版 id）
export function addMultipleIntelV4(
  existing: Record<string, AssessmentInfo>,
): Record<string, AssessmentInfo> {
  return {
    ...existing,
    'multiple-intelligence': multipleIntelV4Assessment,
  };
}

// 也支持数组形式注册
export function addMultipleIntelV4ToList(
  existing: AssessmentInfo[],
): AssessmentInfo[] {
  const filtered = existing.filter((a) => a.id !== 'multiple-intelligence');
  return [...filtered, multipleIntelV4Assessment];
}
