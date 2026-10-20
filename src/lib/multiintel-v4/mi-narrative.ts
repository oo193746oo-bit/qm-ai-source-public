/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// QM AI 多元智能测评 v4.0 — 叙事生成器
// 生成 headline、维度叙事、Pair 叙事、Profile 摘要
// 中文，QM 风格，非诊断，温柔中立

import type {
  DimensionCode,
  DimensionScore,
  PairPattern,
  ProfileSignature,
} from './mi-types';
import { miDimensions } from './mi-dimensions';

const dimShortNames: Record<DimensionCode, string> = {
  linguistic: '语言',
  logical: '逻辑',
  spatial: '空间',
  musical: '音乐',
  bodily: '动觉',
  interpersonal: '人际',
  intrapersonal: '内省',
  naturalist: '自然',
};

// ===== 生成 Headline =====
export function generateHeadline(scores: DimensionScore[]): string {
  const sorted = [...scores].sort((a, b) => b.score - a.score);
  const top3 = sorted.slice(0, 3);
  const topNames = top3.map((s) => dimShortNames[s.dimension]);

  // 找最高维度的描述
  const topDim = top3[0];
  const dimContent = miDimensions[topDim.dimension];
  const highDesc = dimContent.whatItMayMean.high[0];

  // 根据分数差距选择不同的 headline 模板
  const topGap = top3[0].score - top3[1].score;
  const spread = sorted[0].score - sorted[7].score;

  if (spread < 15) {
    // 比较均衡
    return `你的当前轮廓：八种智能的调用方式比较均衡，整体呈现出一种灵活的多通道状态。`;
  }

  if (topGap > 25) {
    // 第一明显领先
    return `你的当前轮廓：${topNames[0]}的显现尤为显著，${topNames[1]}和${topNames[2]}也比较活跃。` + `${highDesc.replace('你', '你可能')}`;
  }

  return `你的当前轮廓：${topNames.join('、')}的显现程度相对较高。` + `${highDesc.replace('你', '你可能')}`;
}

// ===== 生成维度叙事 =====
export function generateDimensionNarrative(
  dim: DimensionCode,
  score: number,
): {
  title: string;
  opening: string;
  highOrLow: string;
  scenes: string;
  resources: string;
  friction: string;
  bridge: string;
  observation: string;
} {
  const content = miDimensions[dim];
  const isHigh = score >= 60;
  const isLow = score < 34;

  const title = content.name;

  let opening = '';
  if (isHigh) {
    opening = `在本次测评中，${content.name}的当前显现程度较高（${score}分）。` + `这意味着你目前比较常使用这种方式来理解和处理世界。`;
  } else if (isLow) {
    opening = `在本次测评中，${content.name}的当前显现程度较低（${score}分）。` + `这只是说明在本次题目覆盖的情境中，你比较少通过这种方式来处理信息，不代表你没有这种能力。`;
  } else {
    opening = `在本次测评中，${content.name}的当前显现程度处于中等水平（${score}分）。` + `你会在需要的时候调用它，但它不是你最常用的方式。`;
  }

  const highOrLow = isHigh
    ? content.whatItMayMean.high.slice(0, 2).join(' ')
    : content.whatItMayMean.low.slice(0, 2).join(' ');

  const scenes = content.scenes.learning + content.scenes.work;

  const resources = content.resourceInContext.slice(0, 2).join('；');
  const friction = content.frictionInContext.slice(0, 2).join('；');
  const bridge = content.bridgeStrategy[0];
  const observation = content.observationQuestion;

  return {
    title,
    opening,
    highOrLow,
    scenes,
    resources,
    friction,
    bridge,
    observation,
  };
}

// ===== 生成 Pair 叙事 =====
export function generatePairNarrative(pair: PairPattern): {
  title: string;
  description: string;
  relationLabel: string;
  examples: string;
  bridge: string;
} {
  const [d1, d2] = pair.pair;
  const name1 = dimShortNames[d1];
  const name2 = dimShortNames[d2];

  const relationLabels: Record<string, string> = {
    synergy: '协同组合',
    complement: '互补组合',
    context_switch: '场景切换组合',
    possible_friction: '潜在摩擦组合',
  };

  const title = `${name1} × ${name2}`;
  const relationLabel = relationLabels[pair.relation] ?? '组合';
  const description = pair.description;
  const examples = pair.examples.slice(0, 2).join('、');
  const bridge = pair.bridgeIfFriction ?? '保持觉察，两种方式都有它们的价值。';

  return {
    title,
    description,
    relationLabel,
    examples,
    bridge,
  };
}

// ===== 生成 Profile 摘要 =====
export function generateProfileSummary(signature: ProfileSignature): string {
  const topNames = signature.top3.map((d) => dimShortNames[d]);
  const bottomNames = signature.bottom2.map((d) => dimShortNames[d]);

  const parts: string[] = [];

  parts.push( `这是你本次的多元智能画像：${topNames.join('、')}的当前显现程度相对较高。`,
  );

  // 均衡度
  if (signature.balance >= 80) {
    parts.push(`整体来看，你八种智能的调用方式比较均衡，没有某一项特别突出或特别少用。`);
  } else if (signature.balance >= 60) {
    parts.push(`同时，你的不同维度之间有一定的差异，但整体还是比较多样的。`);
  } else {
    parts.push(`你的不同维度之间差异比较明显，有几个维度调用得比较多，有几个比较少。`);
  }

  // 表达方向
  const dirs = Object.entries(signature.expressionLens) as [string, number][];
  dirs.sort((a, b) => b[1] - a[1]);
  const topDir = dirs[0][0];
  const dirLabels: Record<string, string> = {
    symbolic: '符号与表达',
    object: '物体与空间',
    people: '人际与内省',
  };
  parts.push(`从表达方向来看，你整体更偏向${dirLabels[topDir]}的方向。`);

  // Pair 模式
  const synergies = signature.pairPatterns.filter((p) => p.relation === 'synergy');
  if (synergies.length > 0) {
    const topSynergy = synergies.sort((a, b) => b.strength - a.strength)[0];
    const synergyNames = topSynergy.pair.map((d) => dimShortNames[d]).join('和');
    parts.push(`${synergyNames}的协同效应比较明显，它们经常一起工作。`);
  }

  // 温和结尾
  parts.push( `请记得：这只是你在此时此刻的一个快照，不是你的全部，也不是最终结论。` + `不同的时间、状态、环境下，你的调用方式可能会不一样。`,
  );

  return parts.join('');
}
