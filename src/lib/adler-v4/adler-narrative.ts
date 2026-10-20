/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// QM 阿德勒指数 v4.0 — 叙事生成与结果组装
// Profile → Pair Pattern → Current Life Task → Story Evidence →
// Similarity → Counterpoint → Why You → Difference → Transfer → 1 Question

import type {
  ScoringResult,
  PairPatternResult,
  ProfileSignature,
  WhisperUnit,
  PersonStory,
  MediaStory,
  CourageMicroStep,
  SevenDayBoard,
  AdlerFullResult,
  LifeTaskCode,
  SceneCode,
  ModuleCode,
} from './adler-types';
import { DIMENSION_NAMES } from './adler-types';
import { adlerDimensions } from './adler-dimensions';
import { adlerPairMatrix } from './adler-pair-matrix';
import { adlerScenes, recommendScenesByProfile } from './adler-scenes';
import { selectResultModules } from './adler-module-pool';
import { recommendWhispers } from './adler-whispers';
import { findMatchingPeople } from './adler-story-people';
import { findMatchingMedia } from './adler-story-media';
import {
  generateSevenDayBoard,
  generateCourageMicroStep,
} from './adler-action-tools';
import {
  calcAdlerScores,
  calcAllPairPatterns,
  inferCurrentLifeTask,
  inferCurrentContext,
  buildProfileSignature,
  type RawAnswers,
} from './adler-scoring';
import { adlerianLenses } from './adler-lenses';

// ===== 生成一句话 Profile Signature =====
export function generateProfileNarrative(
  scoring: ScoringResult,
  pairPatterns: PairPatternResult[],
): string {
  const top2Dims = scoring.top2.map((s) => s.dimension);
  const bottom2Dims = scoring.bottom2.map((s) => s.dimension);

  const topNames = top2Dims.map((d) => adlerDimensions[d].name);
  const bottomNames = bottom2Dims.map((d) => adlerDimensions[d].name);

  // 找最强的 pair
  const topPair = pairPatterns.sort((a, b) => b.confidence - a.confidence)[0];
  const pairDef = topPair ? adlerPairMatrix[topPair.pair] : null;
  const pairCat = topPair && pairDef
    ? pairDef.categories[topPair.category as keyof typeof pairDef.categories].label
    : '';

  let narrative = `在这份结果里，${topNames[0]}和${topNames[1]}是你目前比较显现的两个面向。`;

  if (topPair && pairCat) {
    narrative += `它们之间的关系，目前更偏向"${pairCat}"的状态。`;
  }

  if (scoring.spread > 30) {
    narrative += `四个维度之间的差异比较大，你在不同情境下可能有很不一样的反应。`;
  } else if (scoring.spread < 10) {
    narrative += `四个维度的位置比较接近，你在各个方面的发展相对均衡。`;
  }

  narrative += `\n\n这只是你此时此刻的一个画像，不是固定的类型。`;
  narrative += `它会随着你的经历、状态和情境而变化。`;

  return narrative;
}

// ===== Why You 算法链路 =====
export interface WhyYouResult {
  profile: string;
  pairPattern: string;
  currentLifeTask: string;
  storyEvidence: string;
  similarity: string;
  counterpoint: string;
  whyYou: string;
  difference: string;
  transfer: string;
  question: string;
}

export function buildWhyYouNarrative(
  scoring: ScoringResult,
  topPair: PairPatternResult,
  lifeTask: LifeTaskCode,
  story: { name: string; storyEvidence: string; counterpointTags: string[] },
): WhyYouResult {
  const topDimName = DIMENSION_NAMES[scoring.top2[0].dimension];
  const pairDef = adlerPairMatrix[topPair.pair];
  const pairCatName = pairDef?.categories[topPair.category as keyof typeof pairDef.categories]?.label || '';

  const lifeTaskNames: Record<LifeTaskCode, string> = {
    friendship: '友谊',
    work: '工作',
    love: '爱与亲密',
    self: '自我关系',
    community: '共同体',
  };

  return {
    profile: `你的画像中，${topDimName}比较突出，这和TA的故事有某种呼应。`,
    pairPattern: `你们在${pairDef?.name || ''}上，都呈现出${pairCatName}的模式。`,
    currentLifeTask: `目前你在${lifeTaskNames[lifeTask]}这个生活任务上，可能有一些和TA类似的议题。`,
    storyEvidence: story.storyEvidence,
    similarity: '相似的不是"你们是同一种人"，而是你们在某个特定的生活情境中，遇到了类似的挑战。',
    counterpoint: `但也有不同：${story.counterpointTags[0] || '你们的背景、时代和具体处境都不一样。'}`,
    whyYou: '这个故事之所以出现在你的结果里，是因为它可能映照出了你目前正在面对的某个面向——不是说你和TA一样，而是TA的经历可能会给你带来一点启发。',
    difference: `请记住：TA是TA，你是你。你们的起点、资源、面临的具体处境都不同。TA的经历不能定义你，你的人生是你自己的。`,
    transfer: '如果从TA的故事里带一点东西回到你目前的生活，也许你可以想一想：TA面对困难时的态度，有没有哪一部分是你也可以尝试的？',
    question: `在你目前的${lifeTaskNames[lifeTask]}议题里，你最想从TA的故事里带走什么？`,
  };
}

// ===== 组装完整结果 =====
export function buildAdlerResult(
  answers: RawAnswers,
  options: {
    preferredLifeTask?: LifeTaskCode;
    preferredScene?: SceneCode;
    cultureRegion?: string;
    ageGen?: string;
    optInIdentity?: string[];
    difficultyLevel?: 'gentle' | 'medium' | 'stretch';
  } = {},
): AdlerFullResult {
  // 1. 评分
  const scoring = calcAdlerScores(answers);

  // 2. Pair Pattern
  const pairPatterns = calcAllPairPatterns(scoring.rawScores);

  // 3. 当前生活任务 & 场景
  const currentLifeTask = inferCurrentLifeTask(scoring.rawScores, options.preferredLifeTask);
  const currentContext = inferCurrentContext(scoring.rawScores, options.preferredScene);

  // 4. Profile Signature
  const profileSignature = buildProfileSignature(
    scoring,
    pairPatterns,
    currentLifeTask,
    currentContext,
  );

  // 5. 选择模块
  const selectedModules = selectResultModules(
    scoring.rawScores,
    pairPatterns,
    currentContext,
    scoring.responseQuality,
  );

  // 6. 推荐场景（至少6个）
  const selectedScenes = recommendScenesByProfile(scoring.rawScores, 6);

  // 7. 小酷耳语
  const topPairCodes = pairPatterns
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3)
    .map((p) => p.pair);

  const featuredWhispers = recommendWhispers(
    scoring.rawScores,
    currentContext,
    topPairCodes,
    6,
  );

  // 8. Story Mirror 人物
  const storyMirrorPeople = findMatchingPeople(
    scoring.rawScores,
    topPairCodes,
    currentLifeTask,
    currentContext,
    options.cultureRegion,
    options.ageGen,
    options.optInIdentity,
    3,
  );

  // 9. Story Mirror 影视
  const storyMirrorMedia = findMatchingMedia(
    scoring.rawScores,
    topPairCodes,
    currentLifeTask,
    currentContext,
    undefined,
    2,
  );

  // 10. 24 小时勇气微行动
  const lowestDim = scoring.bottom2[0]?.dimension || 'A';
  const relatedLens = adlerDimensions[lowestDim].adlerianConcepts[0] ? 'courage' : 'belonging';
  const microStep = generateCourageMicroStep(
    lowestDim,
    (relatedLens as any) || 'encouragement',
  );

  // 11. 7 天练习板
  const sevenDayBoard = generateSevenDayBoard(currentLifeTask, scoring.rawScores);

  return {
    scoring,
    profileSignature,
    pairPatterns,
    currentLifeTask,
    currentContext,
    selectedModules: selectedModules as ModuleCode[],
    selectedScenes,
    featuredWhispers: featuredWhispers as WhisperUnit[],
    storyMirrorPeople: storyMirrorPeople as PersonStory[],
    storyMirrorMedia: storyMirrorMedia as MediaStory[],
    microStep: microStep as CourageMicroStep,
    sevenDayBoard,
    timestamp: new Date().toISOString(),
    normStatus: 'unapproved',
    rawAssessmentReadOnly: true,
  };
}

// ===== 生成鼓励语（Encouragement Composer）=====
export function composeEncouragement(
  scoring: ScoringResult,
  scene: SceneCode,
  difficulty: 'gentle' | 'medium' | 'stretch' = 'gentle',
): string {
  const sceneDef = adlerScenes[scene];

  const base = sceneDef?.encouragement || '你已经做得很好了。';

  const dim = scoring.bottom2[0]?.dimension || 'C';
  const dimName = DIMENSION_NAMES[dim];

  let addon = '';
  if (difficulty === 'gentle') {
    addon = `慢慢来，不用急。你现在的样子就已经很好了。`;
  } else if (difficulty === 'medium') {
    addon = `如果愿意，可以试着在${dimName}上多走一小步——不用很大，一点点就好。`;
  } else {
    addon = `你比自己以为的更有力量。如果准备好了，试试用一个新的方式面对${dimName}的议题。`;
  }

  return `${base}\n\n${addon}`;
}
