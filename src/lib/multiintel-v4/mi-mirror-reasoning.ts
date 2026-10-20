/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// QM AI 多元智能测评 v4.0 — Mirror Reasoning Engine
// 根据用户分数从人物/影视库中筛选并生成镜映式的推理结果
// 使用 behavioral_mirror 方式：我们在别人身上看到的，也是我们自己的一部分

import type {
  DimensionScore,
  DimensionCode,
  PeopleStoryMirror,
  MediaStoryMirror,
  MirrorReasoningResult,
  PairPattern,
} from './mi-types';
import { miDimensions } from './mi-dimensions';

// ===== 计算匹配度 =====
function calculateMatchScore(
  connections: DimensionCode[],
  pairConnections: Array<[DimensionCode, DimensionCode]>,
  scores: DimensionScore[],
  pairs: PairPattern[],
): number {
  const scoreMap = new Map<DimensionCode, number>();
  for (const s of scores) scoreMap.set(s.dimension, s.score);

  // 维度匹配：连接的维度分数越高，匹配度越高
  let dimScore = 0;
  for (const dim of connections) {
    dimScore += scoreMap.get(dim) ?? 50;
  }
  dimScore = dimScore / connections.length;

  // Pair 匹配：如果 story 的 pair 和用户的 pair 关系类型一致，加分
  let pairScore = 0;
  if (pairConnections.length > 0) {
    const pairScoreMap = new Map<string, PairPattern>();
    for (const p of pairs) {
      const key = [...p.pair].sort().join('-');
      pairScoreMap.set(key, p);
    }
    let pairMatch = 0;
    for (const pc of pairConnections) {
      const key = [...pc].sort().join('-');
      const userPair = pairScoreMap.get(key);
      if (userPair) {
        // 如果用户的 pair 是 synergy 或 complement，匹配度高
        if (userPair.relation === 'synergy' || userPair.relation === 'complement') {
          pairMatch += userPair.strength;
        } else {
          pairMatch += userPair.strength * 0.5; // friction/switch 也有共鸣，但方向不同
        }
      } else {
        pairMatch += 50;
      }
    }
    pairScore = pairMatch / pairConnections.length;
  } else {
    pairScore = 50;
  }

  return dimScore * 0.6 + pairScore * 0.4;
}

// ===== 选择并生成人物推理结果 =====
export interface MirrorOptions {
  count?: number;           // 返回几条，默认 3
  avoidRecent?: string[];    // 避免重复的 recent_exposure_key
  preferCultures?: string[]; // 偏好文化区域
  seedFirst?: boolean;       // 是否优先 seed 人物/影视
}

export function selectAndReasonPeople(
  scores: DimensionScore[],
  pairs: PairPattern[],
  people: PeopleStoryMirror[],
  opts: MirrorOptions = {},
): Array<PeopleStoryMirror & MirrorReasoningResult> {
  const { count = 3, avoidRecent = [], seedFirst = true } = opts;

  // 计算每个人物的匹配度
  const scored = people.map((p) => ({
    person: p,
    score: calculateMatchScore(
      p.possible_intelligence_connections,
      p.pair_connections,
      scores,
      pairs,
    ),
  }));

  // 排序：优先 seed，然后按匹配度
  scored.sort((a, b) => {
    const aSeed = a.person.id.startsWith('person-seed-') ? 1 : 0;
    const bSeed = b.person.id.startsWith('person-seed-') ? 1 : 0;
    if (seedFirst && aSeed !== bSeed) return bSeed - aSeed;
    return b.score - a.score;
  });

  // 过滤掉最近出现过的
  const recentSet = new Set(avoidRecent);
  const filtered = scored.filter((s) => !recentSet.has(s.person.recent_exposure_key));

  // 确保维度组合多样：同维度组合不能每次返回相同人物
  const selected: Array<PeopleStoryMirror & MirrorReasoningResult> = [];
  const usedDimCombos = new Set<string>();

  for (const item of filtered) {
    if (selected.length >= count) break;

    const dimKey = item.person.possible_intelligence_connections.sort().join(',');
    // 组合多样化：相似的组合尽量只选一个
    if (usedDimCombos.has(dimKey) && selected.length > 0) continue;
    usedDimCombos.add(dimKey);

    const reasoning = buildReasoning(item.person, item.score, scores, pairs);
    selected.push({ ...item.person, ...reasoning });
  }

  // 如果不够 count，放宽组合限制
  if (selected.length < count) {
    for (const item of filtered) {
      if (selected.length >= count) break;
      if (selected.find((s) => s.id === item.person.id)) continue;
      const reasoning = buildReasoning(item.person, item.score, scores, pairs);
      selected.push({ ...item.person, ...reasoning });
    }
  }

  return selected;
}

// ===== 选择并生成影视推理结果 =====
export function selectAndReasonMedia(
  scores: DimensionScore[],
  pairs: PairPattern[],
  media: MediaStoryMirror[],
  opts: MirrorOptions = {},
): Array<MediaStoryMirror & MirrorReasoningResult> {
  const { count = 3, avoidRecent = [], seedFirst = true } = opts;

  const scored = media.map((m) => ({
    media: m,
    score: calculateMatchScore(
      m.possible_intelligence_connections,
      m.pair_connections,
      scores,
      pairs,
    ),
  }));

  scored.sort((a, b) => {
    const aSeed = a.media.id.startsWith('media-seed-') ? 1 : 0;
    const bSeed = b.media.id.startsWith('media-seed-') ? 1 : 0;
    if (seedFirst && aSeed !== bSeed) return bSeed - aSeed;
    return b.score - a.score;
  });

  const recentSet = new Set(avoidRecent);
  const filtered = scored.filter((s) => !recentSet.has(s.media.id));

  const selected: Array<MediaStoryMirror & MirrorReasoningResult> = [];
  const usedDimCombos = new Set<string>();
  const usedTypes = new Set<string>();

  for (const item of filtered) {
    if (selected.length >= count) break;

    const dimKey = item.media.possible_intelligence_connections.sort().join(',');
    if (usedDimCombos.has(dimKey) && selected.length > 0) continue;
    usedDimCombos.add(dimKey);

    // 媒介类型多样化
    if (usedTypes.has(item.media.media_type) && selected.length > 0) {
      // 如果还有其他类型可选，就跳过相同类型
      const hasOtherTypes = filtered.some(
        (f) => !usedTypes.has(f.media.media_type) && !selected.find((s) => s.id === f.media.id),
      );
      if (hasOtherTypes) continue;
    }
    usedTypes.add(item.media.media_type);

    const reasoning = buildMediaReasoning(item.media, item.score, scores, pairs);
    selected.push({ ...item.media, ...reasoning });
  }

  // 如果不够，放宽限制
  if (selected.length < count) {
    for (const item of filtered) {
      if (selected.length >= count) break;
      if (selected.find((s) => s.id === item.media.id)) continue;
      const reasoning = buildMediaReasoning(item.media, item.score, scores, pairs);
      selected.push({ ...item.media, ...reasoning });
    }
  }

  return selected;
}

// ===== 构建人物推理结果 =====
function buildReasoning(
  person: PeopleStoryMirror,
  matchScore: number,
  scores: DimensionScore[],
  pairs: PairPattern[],
): MirrorReasoningResult {
  const scoreMap = new Map<DimensionCode, number>();
  for (const s of scores) scoreMap.set(s.dimension, s.score);

  const connections = person.possible_intelligence_connections;
  const dimNames = connections.map((d) => miDimensions[d]?.name ?? d).join('、');

  // story：故事简介，镜映式表达
  const story = person.public_story_summary;

  // match：连接 2-3 维/组合
  const match = `这个故事与你当前的${dimNames}维度的显现方式有呼应。` + `${person.universal_story_tags.slice(0, 2).join('；')}，可能是你在 TA 身上看到自己的地方。`;

  // whyYou：为什么本次选中
  const topDims = [...scores].sort((a, b) => b.score - a.score).slice(0, 2);
  const topDimName = topDims[0] ? miDimensions[topDims[0].dimension]?.name : '';
  const whyYou = `在你目前的智能画像中，${topDimName}的显现程度较高，` + `而这个人物的故事里，${person.behavior_tags.slice(0, 2).join('、')}也是重要的线索。` + `也许是因为你在这些方面正在经历或思考着什么，所以 TA 的故事吸引了你的注意。`;

  // difference：差异提醒
  const lowDims = [...scores].sort((a, b) => a.score - b.score).slice(0, 1);
  const lowDimName = lowDims[0] ? miDimensions[lowDims[0].dimension]?.name : '';
  const difference = `当然，每个人的故事都是独一无二的。TA 所处的时代、环境、经历都和你不同，` + `而且 TA 可能在${lowDimName}方面的调用方式和你不一样。` + `这是镜映，不是对标——你看到的是共鸣的部分，不是全部。`;

  // transfer：迁移场景
  const transfer = `你可以把这个故事的启发带到自己的生活里：` + `在你感到${person.tension_or_cost_tags[0] ?? '有挑战'}的时候，` + `想一想 TA 是怎么面对的——不是"我要像 TA 一样"，而是"TA 的方式里，有什么是我也可以试试的"。` + `比如${person.growth_tags[0] ?? '持续成长'}的过程，可能也在你的人生里发生着。`;

  // observationQuestion：一个观察问题
  const observationQuestion = `接下来一周，` + `你可以留意自己在什么时候会想到${person.name_cn}的故事？` + `那个时刻，你正在经历什么？`;

  return {
    story,
    match,
    whyYou,
    difference,
    transfer,
    observationQuestion,
  };
}

// ===== 构建影视推理结果 =====
function buildMediaReasoning(
  media: MediaStoryMirror,
  matchScore: number,
  scores: DimensionScore[],
  pairs: PairPattern[],
): MirrorReasoningResult {
  const connections = media.possible_intelligence_connections;
  const dimNames = connections.map((d) => miDimensions[d]?.name ?? d).join('、');

  const story = media.story_scene_summary;

  const match = `这部作品与你当前的${dimNames}维度的显现方式有呼应。` + `${media.universal_story_tags.slice(0, 2).join('；')}，` + `可能是你在其中被触动的原因。`;

  const topDims = [...scores].sort((a, b) => b.score - a.score).slice(0, 2);
  const topDimName = topDims[0] ? miDimensions[topDims[0].dimension]?.name : '';
  const whyYou = `在你目前的智能画像中，${topDimName}的显现程度较高，` + `而这部作品里，${media.behavior_tags.slice(0, 2).join('、')}也是重要的主题。` + `也许是因为你正在经历或思考类似的事情，所以这个故事能引起你的共鸣。`;

  const lowDims = [...scores].sort((a, b) => a.score - b.score).slice(0, 1);
  const lowDimName = lowDims[0] ? miDimensions[lowDims[0].dimension]?.name : '';
  const difference = `当然，这是别人的故事，有它的艺术加工和时代背景。` + `你在${lowDimName}方面的调用方式可能和角色很不一样，` + `你的处境和选择也会不同。这是镜映，不是答案——你有你自己的路要走。`;

  const transfer = `看完后，你可以把这个故事的启发带到自己的生活里：` + `下次遇到${media.context_tags.slice(-1)[0] ?? '类似的情境'}时，` + `想一想这个故事里的角色是怎么面对的——不是照搬，而是"如果是我，我会怎么做？"` + `故事里的勇气、智慧或温柔，也可能在你身上。`;

  const observationQuestion = `如果这部作品有一个场景让你特别有感觉，` + `那可能就是你需要听的那句话。` + `你可以问问自己：它为什么触动了我？我在其中看到了什么？`;

  return {
    story,
    match,
    whyYou,
    difference,
    transfer,
    observationQuestion,
  };
}
