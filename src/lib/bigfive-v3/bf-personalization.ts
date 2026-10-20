// QM Big Five 60 | 大五人格特质测评 v3.0 — 多元性别与文化 opt-in 逻辑
// 规则：
// - opt_in_example_personalization 默认 false
// - 不追问、不猜测用户身份
// - 文化/移民/少数压力只作为情境变量，不解释为人格缺陷
// - 身份信息仅用于案例亲近感重排，不影响五维分数
// - 公众人物身份不得推断
import type { BFOptInPersonalization } from './bf-types';

// ===== 默认配置 =====
export const DEFAULT_PERSONALIZATION: BFOptInPersonalization = {
  enabled: false,
};

// ===== opt-in 开关 =====
export function enablePersonalization(): BFOptInPersonalization {
  return {
    enabled: true,
  };
}

export function disablePersonalization(): BFOptInPersonalization {
  return {
    enabled: false,
    age_band: undefined,
    culture_background: undefined,
    gender_identity: undefined,
    current_focus: undefined,
  };
}

// ===== 更新单一字段（仅 opt-in 已开启时生效）=====
export function updatePersonalizationField(
  current: BFOptInPersonalization,
  field: keyof BFOptInPersonalization,
  value: string | boolean | undefined
): BFOptInPersonalization {
  if (!current.enabled && field !== 'enabled') {
    return current; // 未开启时不更新其他字段
  }
  return {
    ...current,
    [field]: value,
  };
}

// ===== 可用选项 =====
export const AGE_BAND_OPTIONS = [
  { value: '18-24', label: '18-24 岁' },
  { value: '25-34', label: '25-34 岁' },
  { value: '35-44', label: '35-44 岁' },
  { value: '45-54', label: '45-54 岁' },
  { value: '55+', label: '55 岁及以上' },
  { value: 'prefer_not_to_say', label: '不想说' },
];

export const CULTURE_OPTIONS = [
  { value: 'mainland_china', label: '中国大陆' },
  { value: 'hong_kong', label: '中国香港' },
  { value: 'taiwan', label: '中国台湾' },
  { value: 'overseas_chinese', label: '海外华人' },
  { value: 'east_asian', label: '东亚其他' },
  { value: 'southeast_asian', label: '东南亚' },
  { value: 'western', label: '欧美/西方' },
  { value: 'multi_cultural', label: '多元文化背景' },
  { value: 'other', label: '其他' },
  { value: 'prefer_not_to_say', label: '不想说' },
];

export const GENDER_IDENTITY_OPTIONS = [
  { value: 'cis_female', label: '顺性别女性' },
  { value: 'cis_male', label: '顺性别男性' },
  { value: 'trans_female', label: '跨性别女性' },
  { value: 'trans_male', label: '跨性别男性' },
  { value: 'non_binary', label: '非二元' },
  { value: 'genderqueer', label: '酷儿/性别酷儿' },
  { value: 'genderfluid', label: '流性人' },
  { value: 'agender', label: '无性别' },
  { value: 'questioning', label: '探索中' },
  { value: 'other', label: '其他（自行填写）' },
  { value: 'prefer_not_to_say', label: '不想说' },
];

export const CURRENT_FOCUS_OPTIONS = [
  { value: 'work', label: '工作/职业' },
  { value: 'relationship', label: '亲密关系' },
  { value: 'self_growth', label: '自我成长' },
  { value: 'family', label: '家庭' },
  { value: 'friendship', label: '友谊' },
  { value: 'health', label: '身心健康' },
  { value: 'transition', label: '人生转折期' },
  { value: 'just_curious', label: '只是好奇' },
];

// ===== 安全提示 =====
export const PERSONALIZATION_SAFETY_NOTE = `
### 关于个性化的说明

你提供的身份信息仅用于让故事案例和成长建议更贴近你的生活经验，**不会改变你的五维人格分数**。

- 你不需要告诉我们你的性别、年龄或文化背景
- 你可以随时更改或删除这些信息
- 这些信息不会用于任何其他目的
- 人格和身份是两回事：你的身份不是你的"人格特质"，你的特质也不因为身份而"好"或"坏"
- 如果你属于少数群体，你经历的压力和适应是环境因素，不是"你的性格有问题"

如果你选择不提供这些信息，你仍然会得到完整的测评结果。 `;

// ===== 多样性重排（仅 opt-in 时可用）=====
// 身份权重不得超过人格/场景相似度（即权重上限5%）
export const IDENTITY_AFFINITY_WEIGHT_MAX = 0.05; // 5%

export function shouldUseIdentityAffinity(
  personalization: BFOptInPersonalization
): boolean {
  return personalization.enabled === true && !!personalization.gender_identity;
}

// ===== 文化/移民/少数压力作为情境变量 =====
// 这些因素只能作为"情境"理解，不能被解释为人格本身
export const CONTEXT_FACTOR_NOTE = `
请注意：以下因素会影响你在测评中的状态和感受，但它们是**情境变量**，不是你的人格本身：
- 文化适应压力
- 少数群体身份相关的压力
- 移民或旅居经历
- 当前的人生转折期
- 近期的重大生活事件

如果你的某些维度分数让你惊讶，也许可以想一想：这是我一贯的样子，还是最近的处境让我变成了这样？ `;

// ===== N维（负性情绪倾向）安全声明 =====
export const NEUROTICISM_SAFETY_NOTE = `
### 关于负性情绪倾向（N维度）

N维度测量的是你体验负性情绪的频率和强度，**不是疾病诊断**。

- 高分不代表你有焦虑症、抑郁症或其他心理疾病
- 低分也不代表你"更健康"或"更成熟"
- 情绪敏感度是一种神经特质，有代价也有优势
- 如果你最近情绪状态很不好，可能和当前压力、生活事件有关，而不是你的人格"出了问题"
- 如果你正在经历危机或强烈的痛苦，请寻求专业支持

**QM上海酷儿心理咨询中心**
- 热线：15001930070
- 联系人工客服（「联系我们」页面） `;

// ===== 验证：不猜测身份 =====
export function validateNoAssumptions(
  personalization: BFOptInPersonalization
): boolean {
  // 确保没有任何字段是猜测填充的
  // 所有字段要么是用户明确输入，要么是 undefined
  // enabled 默认 false 是合法的
  if (!personalization.enabled) {
    return (
      personalization.age_band === undefined &&
      personalization.culture_background === undefined &&
      personalization.gender_identity === undefined
    );
  }
  return true;
}

export default {
  DEFAULT_PERSONALIZATION,
  enablePersonalization,
  disablePersonalization,
  updatePersonalizationField,
  AGE_BAND_OPTIONS,
  CULTURE_OPTIONS,
  GENDER_IDENTITY_OPTIONS,
  CURRENT_FOCUS_OPTIONS,
  PERSONALIZATION_SAFETY_NOTE,
  IDENTITY_AFFINITY_WEIGHT_MAX,
  shouldUseIdentityAffinity,
  CONTEXT_FACTOR_NOTE,
  NEUROTICISM_SAFETY_NOTE,
  validateNoAssumptions,
};
