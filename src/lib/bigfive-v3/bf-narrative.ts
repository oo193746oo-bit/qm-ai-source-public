// QM Big Five 60 | 大五人格特质测评 v3.0 — 叙事生成器
// 功能：模块选择、耳语组合生成、Story Mirror检索、场景化叙事
import type {
  BFFullResult,
  BFModuleId,
  BFUserSignature,
  BFWhisperUnit,
  BFStoryMirrorPerson,
  BFStoryMirrorMedia,
  BFProfileSignature,
  BFContinuousScores,
  BFDimensionCode,
} from './bf-types';
import { BF_WHISPER_UNITS, getWhisperStats } from './bf-whispers';
import { BF_STORY_MIRROR_PEOPLE, getPublicReadyPeople } from './bf-story-mirror-people';
import { BF_STORY_MIRROR_MEDIA } from './bf-story-mirror-media';
import { BF_DIMENSIONS } from './bf-dimensions';
import { BF_COMBINATIONS, getTensionPairsForProfile, getPairNarrative } from './bf-combinations';
import { selectModules, sortModulesForDisplay } from './bf-module-pool';
import { getIntensityBand } from './bf-scoring';

// ============================================================
// 1. 构建 User Signature
// ============================================================
export function buildUserSignature(
  result: BFFullResult,
  optInData?: {
    age_band?: string;
    culture?: string;
    current_focus?: string;
    recent_history?: string[];
  }
): BFUserSignature {
  return {
    five_scores: result.continuous_scores,
    score_reliability: result.response_quality.overall_flag,
    norm_status: result.norm_gate.status,
    highest2: result.profile_signature.highest_2,
    lowest2: result.profile_signature.lowest_2,
    tension_pairs: result.profile_signature.tension_pairs,
    age_band: optInData?.age_band,
    culture: optInData?.culture,
    current_focus: optInData?.current_focus,
    recent_content_history: optInData?.recent_history,
  };
}

// ============================================================
// 2. 耳语生成（Whisper Composer）
// ============================================================
// 从300+基础单元中选 4-6 个，重写为连贯耳语
// 结构：看见你 → 具体场景 → 可能的拉扯 → 成长视角 → 1个问题
// 禁止直接拼接；用过渡语串联

export function composeWhisper(signature: BFUserSignature): string {
  const selectedUnits = selectWhisperUnits(signature, 5);
  return weaveWhisperUnits(signature, selectedUnits);
}

function selectWhisperUnits(signature: BFUserSignature, count: number): BFWhisperUnit[] {
  const units = [...BF_WHISPER_UNITS];
  const scored: { unit: BFWhisperUnit; score: number }[] = [];

  for (const u of units) {
    let score = 0;

    // 单维单元：匹配最高/最低维度 + 强度档位
    if (u.category === 'single_dim' && u.dimension && u.intensity_band) {
      const dim = u.dimension;
      const dimScore = signature.five_scores[dim];
      const band = getIntensityBand(dimScore);

      if (u.intensity_band === band) {
        score += 30;
      }

      // 最高两维加权
      if (signature.highest2.includes(dim)) {
        score += 15;
      }
      // 最低两维也有相关性
      if (signature.lowest2.includes(dim)) {
        score += 10;
      }
    }

    // 双维单元：匹配张力对
    if (u.category === 'pair' && u.pair) {
      const match = signature.tension_pairs.some(tp => {
        const [a, b] = tp.split('×');
        const [c, d] = u.pair!.split('×');
        return (a === c && b === d) || (a === d && b === c);
      });
      if (match) {
        score += 25;
      }
      // 最高两维的组合也相关
      if (signature.highest2.length === 2) {
        const [h1, h2] = signature.highest2;
        const [c, d] = u.pair.split('×');
        if ((h1 === c && h2 === d) || (h1 === d && h2 === c)) {
          score += 20;
        }
      }
    }

    // 场景类：基本权重
    if (u.category === 'scene') {
      score += 8;
    }

    // context类：opt-in 时加权
    if (u.category === 'context') {
      if (u.context_type === 'age' && signature.age_band) score += 20;
      if (u.context_type === 'culture' && signature.culture) score += 20;
      if (u.context_type === 'identity_safety') score += 5; // 安全提示始终轻量出现
      if (u.context_type === 'transition') score += 5;
    }

    // 结尾类：每个耳语都需要一个结尾
    if (u.category === 'closing') {
      score += 12;
    }

    scored.push({ unit: u, score });
  }

  // 排序并选取，同时保证类别多样性
  scored.sort((a, b) => b.score - a.score);

  const selected: BFWhisperUnit[] = [];
  const categoryCount: Record<string, number> = {};
  const maxPerCategory: Record<string, number> = {
    single_dim: 2,
    pair: 1,
    scene: 1,
    context: 1,
    closing: 1,
  };

  for (const { unit } of scored) {
    if (selected.length >= count) break;
    const cat = unit.category;
    if ((categoryCount[cat] || 0) < (maxPerCategory[cat] || 1)) {
      selected.push(unit);
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    }
  }

  // 保证有一个 closing
  if (!selected.some(u => u.category === 'closing')) {
    const closing = scored.find(s => s.unit.category === 'closing');
    if (closing && selected.length > 0) {
      // 替换最后一个
      selected[selected.length - 1] = closing.unit;
    }
  }

  return selected;
}

function weaveWhisperUnits(
  signature: BFUserSignature,
  units: BFWhisperUnit[]
): string {
  // 按类别排序：single_dim → pair → scene → context → closing
  const order = ['single_dim', 'pair', 'scene', 'context', 'closing'];
  const sorted = [...units].sort(
    (a, b) => order.indexOf(a.category) - order.indexOf(b.category)
  );

  // 用过渡语串联
  const parts: string[] = [];

  // 开头
  const [h1, h2] = signature.highest2;
  parts.push(`嗨，我是小酷。刚才和你一起走完了这60道题，我好像看见了你人格里一些有意思的纹路。`);

  for (let i = 0; i < sorted.length; i++) {
    const u = sorted[i];
    if (u.category === 'closing') {
      // 结尾问题单独处理
      continue;
    }
    parts.push(u.content);
  }

  // 结尾问题
  const closing = sorted.find(u => u.category === 'closing');
  if (closing) {
    parts.push(`最后，小酷想问你一个问题：${closing.content.replace(/【.*?】/, '')}`);
  }

  // 添加过渡
  const transitions = [
    '',
    '另外，',
    '还有一个角度——',
    '在这个基础上，',
    '我还想和你分享一点观察：',
  ];

  let result = parts[0] || '';
  for (let i = 1; i < parts.length; i++) {
    result += `\n\n${transitions[i % transitions.length]}${parts[i]}`;
  }

  return result;
}

// ============================================================
// 3. Story Mirror 检索
// ============================================================
// 检索权重：40% profile similarity + 20% scene + 10% culture/language
//         + 10% age/life-stage + 10% novelty + 5% opt-in identity + 5% editorial quality

export interface StoryMirrorSearchOptions {
  signature: BFProfileSignature;
  scores: BFContinuousScores;
  scene?: string;
  culture?: string;
  age_band?: string;
  opt_in_identity_affinity?: boolean;
  limit?: number;
}

export function searchStoryMirrorPeople(
  options: StoryMirrorSearchOptions
): BFStoryMirrorPerson[] {
  const { signature, scores, scene, culture, age_band, opt_in_identity_affinity, limit = 5 } = options;

  const pool = getPublicReadyPeople();
  const scored = pool.map(person => {
    let score = 0;

    // 40% profile similarity
    let simScore = 0;
    for (const dim of signature.highest_2) {
      if (person.possible_trait_connections.some(c => c.startsWith(dim))) {
        simScore += 20;
      }
    }
    score += simScore * 0.4;

    // 20% scene
    if (scene && person.context_tags.some(t => t.includes(scene))) {
      score += 20 * 0.2;
    }

    // 10% culture/language
    if (culture && person.culture_region === culture) {
      score += 10 * 0.1;
    }

    // 10% age/life-stage
    if (age_band && person.age_generation.includes(age_band.split('-')[0])) {
      score += 10 * 0.1;
    }

    // 10% novelty（用 editorial_quality 近似，实际应基于用户历史）
    score += 10 * 0.1;

    // 5% opt-in identity affinity（仅opt-in时使用）
    if (opt_in_identity_affinity && person.identity_bucket.length > 0) {
      score += 5 * 0.05;
    }

    // 5% editorial quality
    score += (person.editorial_quality / 5) * 5 * 0.05;

    return { person, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(s => s.person);
}

export function searchStoryMirrorMedia(
  options: StoryMirrorSearchOptions
): BFStoryMirrorMedia[] {
  const { signature, scores, scene, culture, limit = 4 } = options;

  const pool = BF_STORY_MIRROR_MEDIA;
  const scored = pool.map(media => {
    let score = 0;

    // profile similarity
    for (const dim of signature.highest_2) {
      if (media.trait_connections.some(c => c.startsWith(dim))) {
        score += 40;
      }
    }

    // scene match
    if (scene && media.scene_description.includes(scene)) {
      score += 20;
    }

    // culture
    if (culture && media.culture_region === culture) {
      score += 10;
    }

    // editorial quality
    score += media.editorial_quality * 2;

    return { media, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(s => s.media);
}

// ============================================================
// 4. 完整叙事生成编排
// ============================================================
export interface NarrativeResult {
  modules: BFModuleId[];
  whisper: string;
  story_mirror_people: BFStoryMirrorPerson[];
  story_mirror_media: BFStoryMirrorMedia[];
  tension_pair_narratives: typeof BF_COMBINATIONS;
}

export function generateFullNarrative(
  result: BFFullResult,
  optInData?: {
    age_band?: string;
    culture?: string;
    current_focus?: string;
    recent_history?: string[];
  }
): NarrativeResult {
  // 1. 选择模块
  const selectedModules = selectModules(result.profile_signature, 14);
  const orderedModules = sortModulesForDisplay(selectedModules);

  // 2. 构建 user signature
  const userSig = buildUserSignature(result, optInData);

  // 3. 生成耳语
  const whisper = composeWhisper(userSig);

  // 4. 检索 Story Mirror
  const smOptions = {
    signature: result.profile_signature,
    scores: result.continuous_scores,
    scene: optInData?.current_focus,
    culture: optInData?.culture,
    age_band: optInData?.age_band,
    opt_in_identity_affinity: false, // 默认不开启身份权重
    limit: 5,
  };

  const people = searchStoryMirrorPeople(smOptions);
  const media = searchStoryMirrorMedia(smOptions);

  // 5. 张力双维叙事
  const tensionNarratives = getTensionPairsForProfile(result.profile_signature.tension_pairs);

  return {
    modules: orderedModules,
    whisper,
    story_mirror_people: people,
    story_mirror_media: media,
    tension_pair_narratives: tensionNarratives as any,
  };
}

// ============================================================
// 5. 最高两维合作叙事
// ============================================================
export function getHighestTwoCooperationNarrative(
  h1: BFDimensionCode,
  h2: BFDimensionCode
): string {
  const pairKey = [h1, h2].sort().join('×');
  const pair = getPairNarrative(pairKey);
  if (!pair) {
    const d1 = BF_DIMENSIONS[h1];
    const d2 = BF_DIMENSIONS[h2];
    return `你的最高分维度是${d1.name_cn}和${d2.name_cn}。这两个特质在你身上都比较突出，它们通常会协同工作：${d1.name_cn}给你方向感，${d2.name_cn}给你行动方式。值得观察的是，当这两个维度指向不同方向时，你会怎么选择？`;
  }
  return pair.narrative;
}

// ============================================================
// 6. 生成 7天观察实验（基于个人特质）
// ============================================================
export function generateSevenDayExperiment(signature: BFProfileSignature): string {
  const [h1] = signature.highest_2;
  const [l1] = signature.lowest_2;

  const dimHigh = BF_DIMENSIONS[h1];
  const dimLow = BF_DIMENSIONS[l1];

  return `【7天观察实验】
接下来的7天，小酷邀请你做一个小小的自我观察实验：

**观察对象：** 你的${dimHigh.name_cn}特质在什么情境下最顺畅？
你的${dimLow.name_cn}特质在什么情境下最消耗？

**具体做法：**
1. 每天花3分钟回顾：今天什么时候你感到"对的感觉"（顺、自然、有能量）？那通常和${dimHigh.name_cn}有关。
2. 同时留意：今天什么时候你感到"不太对劲"（别扭、累、烦躁）？那可能和${dimLow.name_cn}的情境成本有关。
3. 不用急着改变什么，先观察就好。
4. 第7天的时候，翻一翻你的记录，看看有没有什么规律。

**为什么做这个实验？**
了解自己特质的"舒适区"和"拉扯区"，不是为了给自己贴标签，而是为了更聪明地安排生活——多待在让你顺畅的环境里，也为容易消耗的情境提前做好准备。`;
}

// ============================================================
// 7. 工具：获取各模块渲染数据
// ============================================================
export function getModuleContent(
  moduleId: BFModuleId,
  result: BFFullResult,
  narrative: NarrativeResult
): { title: string; content: string } | null {
  const scores = result.continuous_scores;
  const sig = result.profile_signature;
  const dims = BF_DIMENSIONS;

  switch (moduleId) {
    case 'hero':
      return {
        title: '你的大五人格画像',
        content: `这是基于你对60道题的回答生成的连续特质画像。大五人格不是分类，是五个维度上的连续位置——每个人都在五个维度上有自己的落点。`,
      };

    case 'highest_two_cooperation': {
      const [h1, h2] = sig.highest_2;
      return {
        title: `你的${dims[h1].name_cn}和${dims[h2].name_cn}如何合作`,
        content: getHighestTwoCooperationNarrative(h1, h2),
      };
    }

    case 'lowest_two': {
      const [l1, l2] = sig.lowest_2;
      return {
        title: `你的${dims[l1].name_cn}和${dims[l2].name_cn}——得分较低意味着什么`,
        content: `得分较低的维度，不一定是"缺点"。${dims[l1].name_cn}和${dims[l2].name_cn}在你身上表现得没那么突出，意味着这些方面不是你默认的能量流向，但也有它们独特的资源。\n\n${dims[l1].low_strength_in_context}\n\n${dims[l2].low_strength_in_context}`,
      };
    }

    case 'max_tension': {
      if (sig.tension_pairs.length === 0) return null;
      const pair = narrative.tension_pair_narratives[0];
      if (!pair) return null;
      return {
        title: `最大张力：${pair.pair}`,
        content: `${pair.narrative}\n\n${pair.caveat}`,
      };
    }

    case 'balance_dimension':
      return {
        title: '你的五维平衡度',
        content: `你的五维标准差约为 ${sig.balance}，分差范围（spread）为 ${sig.spread} 分。\n\n标准差越小，说明五个维度的得分越接近——你在各方面的发展比较均衡。分差越大，说明特质之间的对比越鲜明，某些维度会明显成为你的"主打色"。\n\n平衡和鲜明没有好坏之分。平衡的人适应面广，鲜明的人有强烈的个人风格。重要的是了解自己的模式，然后用好它。`,
      };

    case 'seven_day_experiment':
      return {
        title: '7天自我观察实验',
        content: generateSevenDayExperiment(sig),
      };

    default:
      return null; // 其他模块在对应组件中渲染
  }
}

export default {
  buildUserSignature,
  composeWhisper,
  searchStoryMirrorPeople,
  searchStoryMirrorMedia,
  generateFullNarrative,
  getHighestTwoCooperationNarrative,
  generateSevenDayExperiment,
  getModuleContent,
};
