/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// QM-GDI-48 v4.1 叙事生成引擎
// 基于确定性分数的叙事生成，不做身份判定
// 全部使用"你的体验/你的感受"等主体性语言

import { AssessmentProfile, DimensionCode, NarrativeResult } from './gdi-types';
import { GDI_DIMENSIONS, DIMENSION_INSIGHTS } from './gdi-dimensions';
import { getPairNarratives, getPairNarrativeType } from './gdi-pair-matrix';
import { getScoreTertile } from './gdi-scoring';

// 生成总览Headline
export const generateHeadline = (profile: AssessmentProfile): string => {
  const validDims = Object.values(profile.scores).filter((s) => !s.incomplete);
  const validCount = validDims.length;

  // 找出最高和最低的维度
  const scoredDims = Object.entries(profile.plotScores)
    .filter(([, score]) => score !== null)
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));

  const highestDim = scoredDims[0]?.[0] as DimensionCode | undefined;
  const lowestDim = scoredDims[scoredDims.length - 1]?.[0] as DimensionCode | undefined;

  // CF 特殊处理：高=更流动，低=更稳定
  let descriptor = '';
  if (highestDim === 'CF') {
    descriptor = '你的性别体验呈现出较强的流动与弹性';
  } else if (highestDim) {
    descriptor = `你在${GDI_DIMENSIONS[highestDim].name}方面体验较为突出`;
  }

  let lowNote = '';
  if (lowestDim && lowestDim !== highestDim) {
    if (lowestDim === 'CF') {
      lowNote = '，同时你的性别体验相对稳定和一致';
    } else if (['EA', 'GCC', 'BR'].includes(lowestDim)) {
      lowNote = `，而在${GDI_DIMENSIONS[lowestDim].name}方面可能需要更多关注和支持`;
    } else {
      lowNote = `，而在${GDI_DIMENSIONS[lowestDim].name}方面还有更多探索空间`;
    }
  }

  return `这是一份属于你的性别多元画像。${descriptor}${lowNote}。这只是一个起点——你的性别体验比任何问卷都更丰富、更复杂。`;
};

// 生成总结
export const generateSummary = (profile: AssessmentProfile): string => {
  const quality = profile.quality;

  let qualityNote = '';
  if (quality.completionStatus === 'partial') {
    qualityNote = '你完成了大部分题目，以下解读基于你的作答生成。部分维度可能因为有效题数不足而未计算分数。';
  } else if (quality.speedFlag === 'very_fast') {
    qualityNote = '你的作答速度较快，以下结果仅供参考。如果你愿意，可以花更多时间重新作答，可能会得到更细致的画像。';
  } else if (quality.speedFlag === 'fast') {
    qualityNote = '你的作答速度偏快，以下结果基于你的快速反应生成。';
  } else {
    qualityNote = '你花了充分的时间完成作答，以下结果基于你的认真思考生成。';
  }

  return `${qualityNote}\n\n这份画像不是诊断，也不是身份判定。它只是一面镜子，帮助你看见自己的性别体验中可能存在的某些模式。每一个维度的高低都不代表好坏——它们只是描述了你性别经验的不同侧面。`;
};

// 生成逐维解读
export const generateDimensionInsights = (
  profile: AssessmentProfile
): Record<DimensionCode, string> => {
  const dims: DimensionCode[] = ['IGS', 'SDO', 'EA', 'CF', 'GCC', 'GAE', 'SNA', 'BR'];
  const insights: Partial<Record<DimensionCode, string>> = {};

  for (const dim of dims) {
    const score = profile.plotScores[dim];
    const scoreInfo = profile.scores[dim];

    if (scoreInfo.incomplete || score === null) {
      insights[dim] = `这个维度的有效作答不足4题，暂时无法生成解读。如果你愿意，可以补答相关题目后重新查看结果。`;
    } else {
      const tertile = getScoreTertile(score);
      if (tertile === 'high') {
        insights[dim] = DIMENSION_INSIGHTS[dim].high;
      } else if (tertile === 'low') {
        insights[dim] = DIMENSION_INSIGHTS[dim].low;
      } else {
        insights[dim] = DIMENSION_INSIGHTS[dim].mid;
      }
    }
  }

  return insights as Record<DimensionCode, string>;
};

// 获取Top Pair组合
export const getTopPairInsights = (
  profile: AssessmentProfile,
  count: number = 3
): string[] => {
  const dims: DimensionCode[] = ['IGS', 'SDO', 'EA', 'CF', 'GCC', 'GAE', 'SNA', 'BR'];
  const pairs: { key: string; score: number; narrative: string }[] = [];

  for (let i = 0; i < dims.length; i++) {
    for (let j = i + 1; j < dims.length; j++) {
      const a = dims[i];
      const b = dims[j];
      const scoreA = profile.plotScores[a];
      const scoreB = profile.plotScores[b];

      if (scoreA === null || scoreB === null) continue;

      const pairN = getPairNarratives(a, b);
      if (!pairN) continue;

      const type = getPairNarrativeType(scoreA, scoreB);
      const narrative = pairN.narratives[type];

      // 分数差距越大，Pair越"有趣"
      const diff = Math.abs(scoreA - scoreB);
      const bothExtreme =
        (scoreA >= 66 || scoreA < 33) && (scoreB >= 66 || scoreB < 33);
      const interestingness = diff + (bothExtreme ? 20 : 0);

      pairs.push({
        key: `${a}-${b}`,
        score: interestingness,
        narrative,
      });
    }
  }

  // 按"有趣程度"排序，取前count个
  pairs.sort((a, b) => b.score - a.score);
  return pairs.slice(0, count).map((p) => p.narrative);
};

// 生成完整叙事
export const generateNarrative = (profile: AssessmentProfile): NarrativeResult => {
  const headline = generateHeadline(profile);
  const summary = generateSummary(profile);
  const dimensionInsights = generateDimensionInsights(profile);
  const pairInsights = getTopPairInsights(profile, 3);

  return {
    headline,
    summary,
    dimensionInsights,
    pairInsights,
  };
};

// 安全环境提示（EA/GCC/BR低时必须考虑环境、安全、关系）
export const generateSafetyNote = (profile: AssessmentProfile): string | null => {
  const ea = profile.plotScores.EA;
  const gcc = profile.plotScores.GCC;
  const br = profile.plotScores.BR;

  const lowDims: string[] = [];
  if (ea !== null && ea < 33) lowDims.push(GDI_DIMENSIONS.EA.name);
  if (gcc !== null && gcc < 33) lowDims.push(GDI_DIMENSIONS.GCC.name);
  if (br !== null && br < 33) lowDims.push(GDI_DIMENSIONS.BR.name);

  if (lowDims.length === 0) return null;

  const dimList = lowDims.join('、');
  return `在${dimList}维度上，你的得分相对较低。这可能和你当前所处的环境、安全感以及关系支持有关。\n\n请记住：\n- 你的感受是真实的，但它不一定会永远这样\n- 在不安全的环境里，保护好自己是第一位的\n- 低分数不是你的"问题"，它可能在告诉你一些关于环境的信息\n- 如果你感到困扰，可以考虑寻求支持\n\n如果你需要专业支持，可以联系 QM上海酷儿心理咨询中心（主热线：15001930070，备用：13601658763，联系人工客服（「联系我们」页面））。`;
};

// 生成一个开放问题
export const generateOpenQuestion = (profile: AssessmentProfile): string => {
  const dims: DimensionCode[] = ['IGS', 'SDO', 'EA', 'CF', 'GCC', 'GAE', 'SNA', 'BR'];

  // 找得分最低的维度
  const scoredDims = dims
    .filter((d) => !profile.scores[d].incomplete && profile.plotScores[d] !== null)
    .sort((a, b) => (profile.plotScores[a] ?? 0) - (profile.plotScores[b] ?? 0));

  const lowestDim = scoredDims[0];

  const questionsByDim: Record<DimensionCode, string[]> = {
    IGS: [
      '如果不用任何标签，你会怎么描述你内心的性别感受？',
      '什么时候你最能感受到"自己"的存在？',
      '你对自己的性别有什么好奇的地方？',
    ],
    SDO: [
      '如果现有的标签都不合适，你会想创造一个什么样的词来描述自己？',
      '"暂时不确定"对你来说是一种舒服的状态吗？为什么？',
      '你更害怕被别人贴错标签，还是找不到自己的标签？',
    ],
    EA: [
      '如果没有人评判你，你最想尝试什么样的性别表达？',
      '你觉得最像你的那个瞬间是什么样的？',
      '有没有一件小事是你一直想试但还没试的？',
    ],
    CF: [
      '你有没有注意到自己在不同人面前性别感受不太一样？',
      '如果你的性别是天气，你更喜欢什么样的天气？',
      '稳定和流动，哪一种让你更有安全感？',
    ],
    GCC: [
      '什么时候你觉得自己的身体和感受最协调？',
      '如果可以改变一件小事让你感觉更对，你会改变什么？',
      '称谓对你来说有多重要？为什么？',
    ],
    GAE: [
      '最近一次让你觉得"这就是我"的时刻是什么？',
      '你还记得第一次感受到性别愉悦是什么时候吗？',
      '如果每天都能有一个小小的性别肯定时刻，你希望它是什么？',
    ],
    SNA: [
      '你有没有想过，你的哪些选择是出于自己的意愿，哪些是为了避免别人不满？',
      '如果完全不用在意社会规范，你会想怎么生活？',
      '你最想"重新解释"的一条性别规则是什么？',
    ],
    BR: [
      '你能想象一个让你完全做自己的社群是什么样的吗？',
      '有没有一个人或一个地方让你觉得被正确看见了？',
      '你最想让别人理解你的性别什么？',
    ],
  };

  const questions = questionsByDim[lowestDim] || questionsByDim.IGS;
  return questions[Math.floor(Math.random() * questions.length)];
};

// 生成探索行动建议
export const generateActionSuggestions = (profile: AssessmentProfile): string[] => {
  const suggestions: string[] = [];
  const dims: DimensionCode[] = ['IGS', 'SDO', 'EA', 'CF', 'GCC', 'GAE', 'SNA', 'BR'];

  // 基于低分维度给出行动建议
  const lowDims = dims
    .filter((d) => !profile.scores[d].incomplete && (profile.plotScores[d] ?? 0) < 50)
    .sort((a, b) => (profile.plotScores[a] ?? 0) - (profile.plotScores[b] ?? 0));

  const actionsByDim: Record<DimensionCode, string[]> = {
    IGS: [
      '尝试每天花5分钟安静地坐着，注意自己内在的感受',
      '写一写：什么时候我最觉得"这就是我"',
      '读一些关于性别探索的书或文章，看看哪些描述让你有共鸣',
    ],
    SDO: [
      '列一个清单：哪些标签我试过，感觉怎样',
      '尝试对自己说"我还在想"，看看感觉如何',
      '和信任的朋友聊聊：性别对你来说意味着什么',
    ],
    EA: [
      '在安全的环境里，尝试一件小小的新的表达实验',
      '观察自己：哪些穿着/姿态/声音让我感觉最自在',
      '从一件配饰或一件衣服开始，慢慢找到更像自己的风格',
    ],
    CF: [
      '注意观察：在不同情境下，我的性别感受有什么变化',
      '记录一周内不同场合下的性别感受变化',
      '如果变化让你困惑，试着把它当成探索的机会而不是问题',
    ],
    GCC: [
      '列一个清单：哪些小事情能让我感觉更协调',
      '从最容易改变的地方开始，比如称谓或发型',
      '在安全的人面前，练习使用让你舒服的称谓',
    ],
    GAE: [
      '收集那些让你感觉"对"的小瞬间，记在手机里',
      '试着有意识地做一件让你感觉性别愉悦的小事',
      '注意别人怎么称呼你——哪些称呼让你心里一亮',
    ],
    SNA: [
      '下次做选择时，问问自己：这是我想做的，还是我怕别人不高兴',
      '读一些关于性别规范的文章，增加对规范的觉察',
      '从一件小事开始，尝试做"不太符合规范"的选择',
    ],
    BR: [
      '寻找线上或线下的相关社群，先从观察开始',
      '如果身边没有理解你的人，试试从书或电影中寻找共鸣',
      '给一个信任的人写一封信（不一定寄出），说说你的性别感受',
    ],
  };

  // 从最低的2-3个维度各取1-2条建议
  const targetDims = lowDims.slice(0, 3);
  for (const dim of targetDims) {
    const actions = actionsByDim[dim];
    const randomAction = actions[Math.floor(Math.random() * actions.length)];
    suggestions.push(randomAction);
  }

  // 始终加一条通用建议
  const generalSuggestions = [
    '记住：这只是你现在的样子，不代表你永远会是这样',
    '对自己温柔一点——探索需要时间',
    '你的感受是真实的，即使你还说不清楚',
    '如果有机会，和你信任的人聊聊你的感受',
  ];
  suggestions.push(generalSuggestions[Math.floor(Math.random() * generalSuggestions.length)]);

  return suggestions;
};
