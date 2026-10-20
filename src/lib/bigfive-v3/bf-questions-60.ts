// QM Big Five 60 | 大五人格特质测评 v3.0 — 题库
// license_status: unlicensed — 未宣称NEO-FFI官方授权
// 题目为 IPIP/大五风格中文原创表述，非照搬任何商业量表原题
import type { BFQuestionBank, BFQuestion } from './bf-types';

// ===== 60题题库 =====
// 每维 12 题，其中 5 题反向计分（reverse: true）
// 计分方式：5点李克特 1=非常不同意 → 5=非常同意
// 反向题：实际得分 = 6 - 原始答案

export const BF_QUESTIONS_60: BFQuestion[] = [
  // ===== O 开放性 Openness (12题，5题反向) =====
  { id: 'BF-O01', text: '我喜欢尝试新的、不同的想法和生活方式。', dimension: 'O', reverse: false, facet: 'openness_to_experience' },
  { id: 'BF-O02', text: '我对艺术、音乐或文学有浓厚的个人兴趣。', dimension: 'O', reverse: false, facet: 'aesthetics' },
  { id: 'BF-O03', text: '面对模糊或复杂的问题，我愿意花时间深入思考。', dimension: 'O', reverse: false, facet: 'intellectual_curiosity' },
  { id: 'BF-O04', text: '我经常反思自己的情绪和内心体验。', dimension: 'O', reverse: false, facet: 'introspection' },
  { id: 'BF-O05', text: '我喜欢接触来自不同文化背景的人和观点。', dimension: 'O', reverse: false, facet: 'diversity_appreciation' },
  { id: 'BF-O06', text: '我常常有很多新奇的点子和想象。', dimension: 'O', reverse: false, facet: 'imagination' },
  { id: 'BF-O07', text: '我更习惯按照熟悉的方式做事，不喜欢太大变化。', dimension: 'O', reverse: true, facet: 'routine_preference' },
  { id: 'BF-O08', text: '我觉得抽象的理论和讨论没什么实际用处。', dimension: 'O', reverse: true, facet: 'pragmatism' },
  { id: 'BF-O09', text: '我不太容易被新颖或不寻常的事物吸引。', dimension: 'O', reverse: true, facet: 'low_creative_interest' },
  { id: 'BF-O10', text: '我倾向于接受事物本来的样子，不多做联想。', dimension: 'O', reverse: true, facet: 'concreteness' },
  { id: 'BF-O11', text: '我对自己的内心世界没有太多探索的兴趣。', dimension: 'O', reverse: true, facet: 'low_introspection' },
  { id: 'BF-O12', text: '我喜欢让生活保持稳定和可预测。', dimension: 'O', reverse: true, facet: 'stability_preference' },

  // ===== C 尽责性 Conscientiousness (12题，5题反向) =====
  { id: 'BF-C01', text: '做事情前我会先制定计划，然后按步骤执行。', dimension: 'C', reverse: false, facet: 'planning' },
  { id: 'BF-C02', text: '我对自己承诺过的事情会认真负责到底。', dimension: 'C', reverse: false, facet: 'reliability' },
  { id: 'BF-C03', text: '我习惯把物品和文件整理得有条有理。', dimension: 'C', reverse: false, facet: 'orderliness' },
  { id: 'BF-C04', text: '遇到困难时，我会坚持完成目标而不是轻易放弃。', dimension: 'C', reverse: false, facet: 'perseverance' },
  { id: 'BF-C05', text: '我做事追求细节，不容易出现粗心的错误。', dimension: 'C', reverse: false, facet: 'attention_to_detail' },
  { id: 'BF-C06', text: '我会提前准备，很少到最后一刻才赶工。', dimension: 'C', reverse: false, facet: 'proactivity' },
  { id: 'BF-C07', text: '我经常把事情拖到最后期限才开始做。', dimension: 'C', reverse: true, facet: 'procrastination' },
  { id: 'BF-C08', text: '我的生活和工作空间常常有些杂乱。', dimension: 'C', reverse: true, facet: 'disorderliness' },
  { id: 'BF-C09', text: '我做事比较随性，不太喜欢被计划束缚。', dimension: 'C', reverse: true, facet: 'spontaneity' },
  { id: 'BF-C10', text: '我容易分心，很难长时间专注在一件事上。', dimension: 'C', reverse: true, facet: 'distractibility' },
  { id: 'BF-C11', text: '我常常答应了别人的事后来又忘记了。', dimension: 'C', reverse: true, facet: 'forgetfulness' },
  { id: 'BF-C12', text: '我觉得差不多就行，不必追求完美。', dimension: 'C', reverse: true, facet: 'low_achievement_striving' },

  // ===== E 外向性 Extraversion (12题，5题反向) =====
  { id: 'BF-E01', text: '在社交聚会中，我感到自在且精力充沛。', dimension: 'E', reverse: false, facet: 'gregariousness' },
  { id: 'BF-E02', text: '我喜欢主动和陌生人打招呼、建立联系。', dimension: 'E', reverse: false, facet: 'assertiveness' },
  { id: 'BF-E03', text: '我通常情绪比较高昂，容易感受到兴奋和快乐。', dimension: 'E', reverse: false, facet: 'positive_emotionality' },
  { id: 'BF-E04', text: '我说话比较多，在团体中常常主动表达想法。', dimension: 'E', reverse: false, facet: 'talkativeness' },
  { id: 'BF-E05', text: '我喜欢热闹、有很多人参与的活动。', dimension: 'E', reverse: false, facet: 'activity_level' },
  { id: 'BF-E06', text: '和人互动之后，我通常感觉更有能量。', dimension: 'E', reverse: false, facet: 'social_energy' },
  { id: 'BF-E07', text: '我更喜欢独处或只和少数几个亲近的人在一起。', dimension: 'E', reverse: true, facet: 'introversion' },
  { id: 'BF-E08', text: '在人群中我会尽量避免成为焦点。', dimension: 'E', reverse: true, facet: 'avoidance_of_attention' },
  { id: 'BF-E09', text: '我很少主动去认识新朋友。', dimension: 'E', reverse: true, facet: 'social_reserve' },
  { id: 'BF-E10', text: '社交活动之后，我常常感到疲惫需要休息。', dimension: 'E', reverse: true, facet: 'social_drain' },
  { id: 'BF-E11', text: '我是一个比较安静、内敛的人。', dimension: 'E', reverse: true, facet: 'quietness' },
  { id: 'BF-E12', text: '我不太喜欢刺激和冒险的活动。', dimension: 'E', reverse: true, facet: 'low_sensation_seeking' },

  // ===== A 宜人性 Agreeableness (12题，5题反向) =====
  { id: 'BF-A01', text: '我会主动关心身边人的感受和需要。', dimension: 'A', reverse: false, facet: 'empathy' },
  { id: 'BF-A02', text: '与人合作时，我倾向于寻找大家都能接受的方案。', dimension: 'A', reverse: false, facet: 'cooperation' },
  { id: 'BF-A03', text: '我愿意相信他人，除非对方让我失望过。', dimension: 'A', reverse: false, facet: 'trust' },
  { id: 'BF-A04', text: '别人说我比较心软，不容易拒绝人。', dimension: 'A', reverse: false, facet: 'compliance' },
  { id: 'BF-A05', text: '我习惯把别人往好的方面想。', dimension: 'A', reverse: false, facet: 'positive_regard' },
  { id: 'BF-A06', text: '看到别人难过，我会想要去帮助和安慰。', dimension: 'A', reverse: false, facet: 'altruism' },
  { id: 'BF-A07', text: '我觉得竞争和争取自己的利益是正常的。', dimension: 'A', reverse: true, facet: 'competitiveness' },
  { id: 'BF-A08', text: '我不容易被别人的情绪影响。', dimension: 'A', reverse: true, facet: 'emotional_detachment' },
  { id: 'BF-A09', text: '我对别人的动机常常持怀疑态度。', dimension: 'A', reverse: true, facet: 'suspiciousness' },
  { id: 'BF-A10', text: '如果有人冒犯我，我会记在心里。', dimension: 'A', reverse: true, facet: 'grudge_holding' },
  { id: 'BF-A11', text: '我说话比较直接，不太会顾及对方感受。', dimension: 'A', reverse: true, facet: 'bluntness' },
  { id: 'BF-A12', text: '我觉得没有必要总是迁就别人。', dimension: 'A', reverse: true, facet: 'low_accommodation' },

  // ===== N 负性情绪倾向 Neuroticism (12题，5题反向) =====
  // 注意：N维度是负性情绪倾向，不是疾病分数
  { id: 'BF-N01', text: '我很容易感到紧张或焦虑。', dimension: 'N', reverse: false, facet: 'anxiety' },
  { id: 'BF-N02', text: '我的情绪起伏比较大，容易受影响。', dimension: 'N', reverse: false, facet: 'emotional_lability' },
  { id: 'BF-N03', text: '面对压力时，我常常感到难以承受。', dimension: 'N', reverse: false, facet: 'stress_sensitivity' },
  { id: 'BF-N04', text: '我经常担心事情会出问题。', dimension: 'N', reverse: false, facet: 'worry' },
  { id: 'BF-N05', text: '我很在意别人对我的看法。', dimension: 'N', reverse: false, facet: 'self_consciousness' },
  { id: 'BF-N06', text: '心情不好的时候，我很难快速走出来。', dimension: 'N', reverse: false, facet: 'negative_mood_duration' },
  { id: 'BF-N07', text: '我通常情绪比较稳定，不容易被打扰。', dimension: 'N', reverse: true, facet: 'emotional_stability' },
  { id: 'BF-N08', text: '即使遇到困难，我也能较快恢复平静。', dimension: 'N', reverse: true, facet: 'resilience' },
  { id: 'BF-N09', text: '我很少无缘无故感到沮丧或不安。', dimension: 'N', reverse: true, facet: 'low_negative_affect' },
  { id: 'BF-N10', text: '我对自己的情绪调节能力比较有信心。', dimension: 'N', reverse: true, facet: 'emotional_self_efficacy' },
  { id: 'BF-N11', text: '我不容易因为小事而心烦。', dimension: 'N', reverse: true, facet: 'low_irritability' },
  { id: 'BF-N12', text: '压力大的时候，我仍然能保持基本的秩序感。', dimension: 'N', reverse: true, facet: 'stress_tolerance' },
];

// ===== 题库元数据 =====
export const BF_QUESTION_BANK: BFQuestionBank = {
  version: 'v3.0',
  name: 'QM Big Five 60',
  fullTitle: 'QM Big Five 60｜大五人格特质测评',
  license_status: 'unlicensed',
  license_note: '本题库为QM原创大五人格风格量表，未宣称或暗示任何官方量表授权。仅供自我探索与成长参考，不构成心理诊断。',
  totalQuestions: 60,
  scale: '1-5',
  dimensions: ['O', 'C', 'E', 'A', 'N'],
  questions: BF_QUESTIONS_60,
};

// ===== 工具函数 =====
export function getQuestionsByDimension(dim: string): BFQuestion[] {
  return BF_QUESTIONS_60.filter(q => q.dimension === dim);
}

export function getReverseQuestionIds(): string[] {
  return BF_QUESTIONS_60.filter(q => q.reverse).map(q => q.id);
}

export function validateQuestionCount(): boolean {
  const dims = ['O', 'C', 'E', 'A', 'N'] as const;
  for (const d of dims) {
    const count = BF_QUESTIONS_60.filter(q => q.dimension === d).length;
    if (count !== 12) return false;
  }
  return BF_QUESTIONS_60.length === 60;
}

export default BF_QUESTION_BANK;
