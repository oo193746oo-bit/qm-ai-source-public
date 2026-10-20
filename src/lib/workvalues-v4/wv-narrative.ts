/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// QM 职业价值观测评 v4.0 — 叙事生成器
// 基于已核验的结构化事实生成个性化叙事，AI 不直接改分

import type {
  ScoringResult,
  ValuePair,
  DimensionScore,
  CareerScene,
  EnvFitResult,
  SevenDayPractice,
  SceneCode,
} from './wv-types';
import { wvDimensions } from './wv-dimensions';
import { getTopTensionPairs, getTopSynergyPairs } from './wv-pair-matrix';
import { wvScenes } from './wv-scenes';

/**
 * 生成结果页的核心叙事
 * 所有事实都来自 Scoring Engine 和 Pair Matrix，AI 只负责组织语言
 */
export function buildNarrative(
  scoring: ScoringResult,
  pairs: ValuePair[],
  envFit: EnvFitResult,
  currentScene?: SceneCode,
): {
  headline: string;
  coreStory: string;
  dynamicsStory: string;
  sceneStory?: string;
  closing: string;
} {
  const topDim = scoring.top3[0];
  const topDimName = wvDimensions[topDim.dimension].name;
  const secondDim = scoring.top3[1];
  const secondDimName = wvDimensions[secondDim.dimension].name;
  const thirdDim = scoring.top3[2];
  const thirdDimName = wvDimensions[thirdDim.dimension].name;

  // Headline（类型仅作 Headline，不代表整个人）
  const headline = generateHeadline(scoring);

  // 核心故事
  const coreStory = buildCoreStory(scoring);

  // 价值动态故事
  const dynamicsStory = buildDynamicsStory(scoring, pairs);

  // 场景故事（可选）
  let sceneStory: string | undefined;
  if (currentScene && wvScenes[currentScene]) {
    sceneStory = buildSceneStory(scoring, wvScenes[currentScene]);
  }

  // 结尾
  const closing = buildClosing(scoring);

  return { headline, coreStory, dynamicsStory, sceneStory, closing };
}

function generateHeadline(scoring: ScoringResult): string {
  const top = scoring.top3[0];
  const second = scoring.top3[1];
  const topName = wvDimensions[top.dimension].name;
  const secondName = wvDimensions[second.dimension].name;

  const spread = scoring.spread;

  if (spread < 20) {
    return '你的价值观比较均衡，没有特别极端的偏好';
  }

  if (top.score - second.score > 15) {
    return `${topName}是你最核心的职业价值`;
  }

  return `${topName}和${secondName}是你职业选择的两大支柱`;
}

function buildCoreStory(scoring: ScoringResult): string {
  const topNames = scoring.top3
    .map((s) => wvDimensions[s.dimension].name)
    .join('、');
  const bottomNames = scoring.bottom2
    .map((s) => wvDimensions[s.dimension].name)
    .join('和');

  const parts: string[] = [];

  parts.push(`在8项职业价值中，你最看重的是${topNames}。`);
  parts.push(`相对来说，${bottomNames}在你的优先级里排得靠后一些。`);

  if (scoring.spread >= 40) {
    parts.push('你的价值优先级非常鲜明——知道自己要什么、不要什么。');
  } else if (scoring.spread >= 20) {
    parts.push('你有比较清晰的价值排序，但不是非黑即白的类型。');
  } else {
    parts.push('你的各项价值分布比较均衡，没有哪一项是压倒性的。');
  }

  parts.push( `你的内在价值指数是 ${scoring.intrinsicIndex} 分，` + `外在价值指数是 ${scoring.extrinsicIndex} 分。` +
    '这两个是独立的指数，分别反映你对内在满足和外在条件的重视程度。',
  );

  return parts.join('');
}

function buildDynamicsStory(
  scoring: ScoringResult,
  pairs: ValuePair[],
): string {
  const topTensions = getTopTensionPairs(scoring.rawScores, 3);
  const topSynergies = getTopSynergyPairs(scoring.rawScores, 2);

  const parts: string[] = [];

  if (topSynergies.length > 0) {
    const syn = topSynergies[0];
    const dimNames = syn.pair.pair.map(
      (d) => wvDimensions[d].name,
    ).join('和');
    parts.push( `你的价值组合里，${dimNames}是比较协同的——它们常常互相促进，一起变强。`,
    );
  }

  if (topTensions.length > 0) {
    const ten = topTensions[0];
    const dimNames = ten.pair.pair.map(
      (d) => wvDimensions[d].name,
    ).join('和');
    parts.push( `同时，${dimNames}这组价值可能会在某些选择里让你纠结——` +
      '不是它们本身矛盾，而是现实中很难同时满足。',
    );
  }

  if (topTensions.length > 1) {
    parts.push(
      '这些价值的拉扯不是"问题"，它只是说明你是一个有多种追求的人。' +
      '重要的不是消除张力，而是知道什么时候哪一个更重要。',
    );
  }

  return parts.join(' ');
}

function buildSceneStory(
  scoring: ScoringResult,
  scene: CareerScene,
): string {
  const parts: string[] = [];

  parts.push(`在${scene.name}这个场景里，你的价值优先级会特别清晰地体现出来。`);
  parts.push(scene.guidance);

  if (scoring.top3.length > 0) {
    const topDim = scoring.top3[0].dimension;
    const specific = scene.valueSpecific[topDim];
    if (specific) {
      parts.push(`对你来说，特别需要关注的是${wvDimensions[topDim].name}这一块：${specific}`);
    }
  }

  return parts.join(' ');
}

function buildClosing(scoring: ScoringResult): string {
  return (
    '职业价值观没有对错，也没有"最好"的组合。' +
    '它只是帮你看见：在工作中，你希望什么被满足？' +
    '了解这些，可以让你在做选择时更笃定，也更清楚自己在取舍什么。' +
    '如果想聊得更深入，可以和小酷继续对话。'
  );
}

/**
 * 生成 7 天价值观察实验
 * 基于 Top1 价值维度
 */
export function generateSevenDayPractice(
  scoring: ScoringResult,
): SevenDayPractice {
  const topDim = scoring.top3[0].dimension;
  const dimInfo = wvDimensions[topDim];

  const practices: Record<string, { title: string; description: string; dailySteps: string[]; dailyQuestion: string }> = {
    achievement: {
      title: '7 天成就观察',
      description: '用一周时间，观察成就感在你工作中的真实样子——什么时候来，什么时候走，它到底需要什么。',
      dailySteps: [
        '第1天：列出最近3件让你有"做成了"感觉的事，越具体越好。',
        '第2天：在工作中留意：什么时候你最投入？完全忘记了时间？',
        '第3天：今天做一件"小而有结果"的事，注意做完后的感受。',
        '第4天：观察：你的成就感，更多来自自己的判断还是别人的认可？',
        '第5天：如果今天没有做出什么"成绩"，你的感受是怎样的？',
        '第6天：跟一个信任的人聊聊：对你来说，"做得好"的标准是什么？',
        '第7天：回顾这一周：你对自己的成就感有什么新的发现？',
      ],
      dailyQuestion: '今天，你感受到成就感了吗？它从哪来的？',
    },
    security: {
      title: '7 天安全感观察',
      description: '用一周时间，看看你对"稳定"和"安全"的真实感受——它到底在保护你，还是在限制你？',
      dailySteps: [
        '第1天：想一想："工作稳定"对你来说具体意味着什么？列出来。',
        '第2天：今天有没有哪个瞬间感到不安？触发点是什么？',
        '第3天：试着做一件"有点不确定但也没什么大不了"的小事，观察自己的反应。',
        '第4天：你心里那个"够安全"的标准，是从哪来的？',
        '第5天：如果有一天工作不再稳定了，你有什么"兜底"的资源？列出来。',
        '第6天：跟朋友聊聊：他们觉得你是个"求稳"的人吗？为什么？',
        '第7天：回顾一周：安全感对你来说，是避风港还是金丝笼？',
      ],
      dailyQuestion: '今天，你感到安稳吗？什么让你安心，什么让你不安？',
    },
    autonomy: {
      title: '7 天自主感观察',
      description: '用一周时间，看看你对"自己说了算"的真实需求——什么时候特别想要，有了之后真的更开心吗？',
      dailySteps: [
        '第1天：想一想：在工作中，你最想自己决定的是什么？',
        '第2天：今天留意：什么时候你觉得"被管得很烦"？具体烦什么？',
        '第3天：主动做一个小小的决定（哪怕很小），注意做完后的感受。',
        '第4天：如果完全没人管你，你觉得自己会更有效率还是更低？为什么？',
        '第5天：今天试着跟领导/同事表达一个你的想法，看看会怎样。',
        '第6天：想一想：你想要的自主，是"不想被管"还是"想自己负责"？',
        '第7天：回顾一周：你对自主权的需求，比你想象的多还是少？',
      ],
      dailyQuestion: '今天，你觉得自己能做主的事情有多少？感觉怎么样？',
    },
    growth: {
      title: '7 天成长观察',
      description: '用一周时间，看看你对"成长"的真实感受——是真的在进步，还是在用"努力"的感觉安慰自己？',
      dailySteps: [
        '第1天：列出最近3个月你学到的3件新东西，越具体越好。',
        '第2天：今天学一个小技能/一个新概念，不用多，15分钟就行。',
        '第3天：观察：你成长的动力，更多是向往（想变好）还是恐惧（怕落后）？',
        '第4天：给自己的成长速度打个分（1-10），这个分数是怎么来的？',
        '第5天：如果一个月完全不学习新东西，你会有什么感觉？',
        '第6天：跟别人聊聊：你成长最快的时期是什么时候？那时候发生了什么？',
        '第7天：回顾一周：你对"成长"的定义有没有变化？',
      ],
      dailyQuestion: '今天，你觉得自己成长了吗？哪怕只有一点点。',
    },
    relation: {
      title: '7 天关系观察',
      description: '用一周时间，看看工作中的人际关系对你到底有多重要——它是力量来源还是能量消耗？',
      dailySteps: [
        '第1天：列一下工作中你觉得"相处舒服"的3个人，为什么是他们？',
        '第2天：今天主动对一位同事说一句真诚的话，观察对方和自己的反应。',
        '第3天：注意：工作中哪些人际互动让你充电，哪些让你耗电？',
        '第4天：想一想：你在工作中需要多少人际互动才觉得够？',
        '第5天：如果可以选择，你更想一个人干活还是跟团队一起？为什么？',
        '第6天：跟一个工作中不太熟的同事聊5分钟天（非工作话题）。',
        '第7天：回顾一周：你对工作关系的需求，比你想象的多还是少？',
      ],
      dailyQuestion: '今天，工作中有什么人际互动让你印象深刻？',
    },
    meaning: {
      title: '7 天意义感观察',
      description: '用一周时间，看看你对"工作意义"的真实感受——它是必需品，还是锦上添花？',
      dailySteps: [
        '第1天：想一想：你做的工作，对谁有价值？具体是什么价值？',
        '第2天：今天留意：什么时候你觉得"这份工作值了"？',
        '第3天：如果钱不是问题，你还会做现在这份工作吗？为什么？',
        '第4天：做一件小小的"帮助别人"的事，注意做完后的感受。',
        '第5天：想一想：你心中"有意义的工作"是什么样子的？',
        '第6天：跟身边人聊聊：他们觉得自己的工作有意义吗？',
        '第7天：回顾一周：意义感对你来说，到底有多重要？',
      ],
      dailyQuestion: '今天，你觉得工作有意义吗？那个意义是什么？',
    },
    balance: {
      title: '7 天平衡观察',
      description: '用一周时间，看看你对"工作生活平衡"的真实状态——是真的需要平衡，还是在用平衡逃避什么？',
      dailySteps: [
        '第1天：记录今天的时间都花在哪了：工作、休息、关系、兴趣、其他。',
        '第2天：今天准时下班（或到点停手），哪怕还有事没做完。感觉怎么样？',
        '第3天：想一想：如果工作减少1/3，你多出来的时间会做什么？',
        '第4天：今天做一件"跟工作完全无关"的事，全情投入。',
        '第5天：观察：你"忙"的事情里，有多少是真的重要的？',
        '第6天：跟家人/朋友聊一聊：他们觉得你工作忙吗？',
        '第7天：回顾一周：你理想中的平衡，具体是什么样子？',
      ],
      dailyQuestion: '今天，你觉得工作和生活的比例怎么样？',
    },
    reward: {
      title: '7 天回报观察',
      description: '用一周时间，看看你对"经济回报"的真实态度——是安全感、自由、还是证明？',
      dailySteps: [
        '第1天：算一算：你现在的收入，你满意吗？满意/不满意的点是什么？',
        '第2天：想一想：如果收入翻倍，你的生活会有什么不一样？',
        '第3天：观察：什么时候你特别在意"值不值这个价"？',
        '第4天：查一下你这个岗位的市场行情，看看你大概在什么位置。',
        '第5天：想一想：你心中"够花"的收入是多少？那个数字从哪来的？',
        '第6天：跟朋友聊聊（如果方便）：你们觉得谈钱尴尬吗？为什么？',
        '第7天：回顾一周：钱对你来说，到底意味着什么？',
      ],
      dailyQuestion: '今天，你有没有想到钱？是什么触发的？',
    },
  };

  const practice = practices[topDim] || practices.achievement;

  return {
    title: practice.title,
    description: practice.description,
    focusDimension: topDim,
    dailySteps: practice.dailySteps,
    dailyQuestion: practice.dailyQuestion,
  };
}
