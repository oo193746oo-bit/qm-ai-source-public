// SCL-90 症状自评量表 — 测评数据定义
// 标准 SCL-90 中文版本（90题 / 10因子 / 1-5分制）
// 注意：本题库为标准公开版本，若 Lara 有 DS1 定稿题库需替换 questions 数组
// V01 总分等级表：已 approved（按中国常模实现）
// V02 阳性症状痛苦水平公式：已 approved（PSDI = 总分 / 阳性项目数）

export interface Scl90Factor {
  code: string;
  name: string;
  enName: string;
  itemCount: number;
  description: string;
  color: string;
}

export interface Scl90Question {
  id: string;
  text: string;
  dimension: string; // 所属因子代码 F1-F10
}

// 总分筛查等级（V01 approved，基于中国常模）
export type TotalScreeningLevel = 'minimal' | 'mild' | 'moderate' | 'severe';

export const TOTAL_SCREENING_LEVELS: Record<TotalScreeningLevel, { label: string; description: string }> = {
  minimal: {
    label: '常规范围',
    description: '总分在常规范围内，建议继续保持自我观察。',
  },
  mild: {
    label: '轻度症状困扰',
    description: '存在轻度症状困扰，建议关注自身状态，加强自我照顾。',
  },
  moderate: {
    label: '中度症状困扰',
    description: '存在中度症状困扰，建议考虑寻求专业心理支持。',
  },
  severe: {
    label: '较明显症状困扰',
    description: '症状困扰较为明显，建议尽快联系专业心理或医疗资源。',
  },
};

// 因子筛查档位（V01 approved）
export type FactorScreeningTier = 'normal' | 'mild' | 'moderate' | 'severe';

export const FACTOR_SCREENING_TIERS: Record<FactorScreeningTier, { label: string }> = {
  normal: { label: '常规范围' },
  mild: { label: '轻度' },
  moderate: { label: '中度' },
  severe: { label: '偏重' },
};

// SCL-90 专用测评信息接口
export interface Scl90AssessmentInfo {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  duration: string;
  questionCount: number;
  icon: string;
  color: string;
  type: 'symptom-screen';
  scale: '1-5';
  scaleLabels: string[];
  factors: Scl90Factor[];
  questions: Scl90Question[];
  // V01: 总分等级表 — 已 approved
  totalScreeningStatus: 'approved';
  // V02: 阳性症状痛苦水平 — 已 approved
  psdiStatus: 'approved';
  resultNote: string;
  disclaimer: string;
}

export const scl90Factors: Scl90Factor[] = [
  { code: 'F1', name: '躯体化', enName: 'Somatization', itemCount: 12, description: '反映身体不适感，包括心血管、胃肠道、呼吸等系统的不适，以及头痛、背痛、肌肉酸痛等其他躯体表现。', color: '#8B5CF6' },
  { code: 'F2', name: '强迫症状', enName: 'Obsessive-Compulsive', itemCount: 10, description: '反映明知没有必要但又无法摆脱的无意义思想、冲动和行为，以及一些认知障碍的行为征象。', color: '#06B6D4' },
  { code: 'F3', name: '人际关系敏感', enName: 'Interpersonal Sensitivity', itemCount: 9, description: '反映个人的不自在感和自卑感，尤其是在与他人比较时更突出。', color: '#F59E0B' },
  { code: 'F4', name: '抑郁', enName: 'Depression', itemCount: 13, description: '反映与临床上抑郁症状群相联系的广泛概念，包括抑郁苦闷的感情和心境。', color: '#3B82F6' },
  { code: 'F5', name: '焦虑', enName: 'Anxiety', itemCount: 10, description: '反映临床上与焦虑症状相联系的精神症状及体验，如烦躁、坐立不安、神经过敏、紧张等。', color: '#EF4444' },
  { code: 'F6', name: '敌对', enName: 'Hostility', itemCount: 6, description: '反映敌对的思想、情感和行为，包括厌烦、争论、摔物直到争斗和不可抑制的冲动爆发。', color: '#F97316' },
  { code: 'F7', name: '恐怖', enName: 'Phobic Anxiety', itemCount: 7, description: '反映恐怖症状，恐惧的对象包括出门旅行、空旷场地、人群或公共场所和交通工具。', color: '#14B8A6' },
  { code: 'F8', name: '偏执', enName: 'Paranoid Ideation', itemCount: 6, description: '反映偏执性思维的基本特征，主要指投射性思维、猜疑、关系妄想、被动体验与夸大等。', color: '#A855F7' },
  { code: 'F9', name: '精神病性', enName: 'Psychoticism', itemCount: 10, description: '反映各种急性症状和行为，包括幻听、思维播散、被控制感等精神分裂样症状项目。', color: '#EC4899' },
  { code: 'F10', name: '其他', enName: 'Additional Items', itemCount: 7, description: '反映睡眠、饮食、死亡观念等其他症状项目，不能归入其他因子的反应。', color: '#6B7280' },
];

export const scl90Questions: Scl90Question[] = [
  // F1 躯体化 (12): 1,4,12,27,40,42,48,49,52,53,56,58
  { id: 'Q1', text: '头痛', dimension: 'F1' },
  { id: 'Q4', text: '头昏或昏倒', dimension: 'F1' },
  { id: 'Q12', text: '胸痛', dimension: 'F1' },
  { id: 'Q27', text: '腰痛', dimension: 'F1' },
  { id: 'Q40', text: '恶心或胃部不舒服', dimension: 'F1' },
  { id: 'Q42', text: '肌肉酸痛', dimension: 'F1' },
  { id: 'Q48', text: '呼吸有困难', dimension: 'F1' },
  { id: 'Q49', text: '一阵阵发冷或发热', dimension: 'F1' },
  { id: 'Q52', text: '身体发麻或刺痛', dimension: 'F1' },
  { id: 'Q53', text: '喉咙有梗塞感', dimension: 'F1' },
  { id: 'Q56', text: '感到身体的某一部分软弱无力', dimension: 'F1' },
  { id: 'Q58', text: '感到手或脚发重', dimension: 'F1' },
  // F2 强迫症状 (10): 3,9,10,28,38,45,46,51,55,65
  { id: 'Q3', text: '头脑中有不必要的想法或字句盘旋', dimension: 'F2' },
  { id: 'Q9', text: '忘性大', dimension: 'F2' },
  { id: 'Q10', text: '担心自己的衣饰整齐及仪态的端正', dimension: 'F2' },
  { id: 'Q28', text: '感到难以完成任务', dimension: 'F2' },
  { id: 'Q38', text: '做事必须做得很慢以保证做得正确', dimension: 'F2' },
  { id: 'Q45', text: '做事必须反复检查', dimension: 'F2' },
  { id: 'Q46', text: '难以作出决定', dimension: 'F2' },
  { id: 'Q51', text: '脑子变空了', dimension: 'F2' },
  { id: 'Q55', text: '不能集中注意', dimension: 'F2' },
  { id: 'Q65', text: '必须反复洗手、点数', dimension: 'F2' },
  // F3 人际关系敏感 (9): 6,21,34,36,37,41,61,69,73
  { id: 'Q6', text: '对旁人责备求全', dimension: 'F3' },
  { id: 'Q21', text: '同异性相处时感到害羞不自在', dimension: 'F3' },
  { id: 'Q34', text: '您的感情容易受到伤害', dimension: 'F3' },
  { id: 'Q36', text: '感到别人不理解您、不同情您', dimension: 'F3' },
  { id: 'Q37', text: '感到人们对您不友好、不喜欢您', dimension: 'F3' },
  { id: 'Q41', text: '感到比不上他人', dimension: 'F3' },
  { id: 'Q61', text: '当别人看着您或谈论您时感到不自在', dimension: 'F3' },
  { id: 'Q69', text: '感到对别人神经过敏', dimension: 'F3' },
  { id: 'Q73', text: '感到在公共场合吃东西很不舒服', dimension: 'F3' },
  // F4 抑郁 (13): 5,14,15,20,22,26,29,30,31,32,54,71,79
  { id: 'Q5', text: '对异性的兴趣减退', dimension: 'F4' },
  { id: 'Q14', text: '感到自己的精力下降，活动减慢', dimension: 'F4' },
  { id: 'Q15', text: '想结束自己的生命', dimension: 'F4' },
  { id: 'Q20', text: '容易哭泣', dimension: 'F4' },
  { id: 'Q22', text: '感到受骗、中了圈套或有人想抓住您', dimension: 'F4' },
  { id: 'Q26', text: '经常责怪自己', dimension: 'F4' },
  { id: 'Q29', text: '感到孤独', dimension: 'F4' },
  { id: 'Q30', text: '感到苦闷', dimension: 'F4' },
  { id: 'Q31', text: '过分担忧', dimension: 'F4' },
  { id: 'Q32', text: '对事物不感兴趣', dimension: 'F4' },
  { id: 'Q54', text: '感到前途没有希望', dimension: 'F4' },
  { id: 'Q71', text: '感到任何事情都很困难', dimension: 'F4' },
  { id: 'Q79', text: '感到自己没有什么价值', dimension: 'F4' },
  // F5 焦虑 (10): 2,17,23,33,39,57,72,78,80,86
  { id: 'Q2', text: '神经过敏，心中不踏实', dimension: 'F5' },
  { id: 'Q17', text: '发抖', dimension: 'F5' },
  { id: 'Q23', text: '无缘无故地突然感到害怕', dimension: 'F5' },
  { id: 'Q33', text: '感到害怕', dimension: 'F5' },
  { id: 'Q39', text: '心跳得很厉害', dimension: 'F5' },
  { id: 'Q57', text: '感到紧张或容易紧张', dimension: 'F5' },
  { id: 'Q72', text: '一阵阵恐惧或惊恐', dimension: 'F5' },
  { id: 'Q78', text: '感到坐立不安、心神不定', dimension: 'F5' },
  { id: 'Q80', text: '感到熟悉的东西变成陌生或不像是真的', dimension: 'F5' },
  { id: 'Q86', text: '感到要赶快把事情做完', dimension: 'F5' },
  // F6 敌对 (6): 11,24,63,67,74,81
  { id: 'Q11', text: '容易烦恼和激动', dimension: 'F6' },
  { id: 'Q24', text: '自己不能控制地大发脾气', dimension: 'F6' },
  { id: 'Q63', text: '有想打人或伤害他人的冲动', dimension: 'F6' },
  { id: 'Q67', text: '有想摔坏或破坏东西的想法', dimension: 'F6' },
  { id: 'Q74', text: '经常与人争论', dimension: 'F6' },
  { id: 'Q81', text: '大叫或摔东西', dimension: 'F6' },
  // F7 恐怖 (7): 13,25,47,50,70,75,82
  { id: 'Q13', text: '害怕空旷的场所或街道', dimension: 'F7' },
  { id: 'Q25', text: '怕单独出门', dimension: 'F7' },
  { id: 'Q47', text: '怕乘电车、公共汽车、地铁或火车', dimension: 'F7' },
  { id: 'Q50', text: '因为感到害怕而避开某些东西、场合或活动', dimension: 'F7' },
  { id: 'Q70', text: '在商店或电影院等人多的地方感到不自在', dimension: 'F7' },
  { id: 'Q75', text: '单独一人时神经很紧张', dimension: 'F7' },
  { id: 'Q82', text: '害怕会在公共场合昏倒', dimension: 'F7' },
  // F8 偏执 (6): 8,18,43,68,76,83
  { id: 'Q8', text: '责怪别人制造麻烦', dimension: 'F8' },
  { id: 'Q18', text: '感到大多数人都不可信任', dimension: 'F8' },
  { id: 'Q43', text: '感到有人在监视您、谈论您', dimension: 'F8' },
  { id: 'Q68', text: '有一些别人没有的想法', dimension: 'F8' },
  { id: 'Q76', text: '别人对您的成绩没有作出恰当的评价', dimension: 'F8' },
  { id: 'Q83', text: '感到别人想占您的便宜', dimension: 'F8' },
  // F9 精神病性 (10): 7,16,35,62,77,84,85,87,88,90
  { id: 'Q7', text: '感到别人能控制您的思想', dimension: 'F9' },
  { id: 'Q16', text: '听到旁人听不到的声音', dimension: 'F9' },
  { id: 'Q35', text: '旁人能知道您的私下想法', dimension: 'F9' },
  { id: 'Q62', text: '有一些不属于您自己的想法', dimension: 'F9' },
  { id: 'Q77', text: '即使和别人在一起也感到孤单', dimension: 'F9' },
  { id: 'Q84', text: '为一些有关"性"的想法而很苦恼', dimension: 'F9' },
  { id: 'Q85', text: '您认为应该因为自己的过错而受到惩罚', dimension: 'F9' },
  { id: 'Q87', text: '感到自己的身体有严重问题', dimension: 'F9' },
  { id: 'Q88', text: '从未感到和其他人很亲近', dimension: 'F9' },
  { id: 'Q90', text: '感到自己的脑子有毛病', dimension: 'F9' },
  // F10 其他 (7): 19,44,59,60,64,66,89
  { id: 'Q19', text: '胃口不好', dimension: 'F10' },
  { id: 'Q44', text: '难以入睡', dimension: 'F10' },
  { id: 'Q59', text: '想到死亡的事', dimension: 'F10' },
  { id: 'Q60', text: '吃得太多', dimension: 'F10' },
  { id: 'Q64', text: '醒得太早', dimension: 'F10' },
  { id: 'Q66', text: '睡得不稳不深', dimension: 'F10' },
  { id: 'Q89', text: '感到自己有罪', dimension: 'F10' },
];

export const scl90Assessment: Scl90AssessmentInfo = {
  id: 'scl90',
  title: 'SCL-90 情绪自评',
  subtitle: '90题症状筛查与自我观察',
  description:
    '这是一份症状筛查与自我观察工具。通过 90 道题目了解你最近一周的身心感受与状态。它不是诊断工具，不用于疾病判断，只是帮助你更清晰地看见自己当下的状态，找到值得关注的方向。',
  duration: '约 12-15 分钟',
  questionCount: 90,
  icon: '🌿',
  color: 'from-teal-200 to-indigo-200',
  type: 'symptom-screen',
  scale: '1-5',
  scaleLabels: ['从无', '很轻', '中度', '偏重', '严重'],
  factors: scl90Factors,
  questions: scl90Questions,
  // V01: 总分等级表 — 已 approved（基于中国常模筛查阈值）
  totalScreeningStatus: 'approved',
  // V02: 阳性症状痛苦水平 — 已 approved（PSDI = 总分 / 阳性项目数）
  psdiStatus: 'approved',
  resultNote:
    'SCL-90 是一份自我观察工具，不是诊断工具。分数反映的是你最近一周的感受强度，不等于疾病标签。筛查等级基于量表常模范围，不构成任何疾病诊断。如果你感到持续困扰或有安全担忧，请联系 QM 上海酷儿心理咨询中心获取专业支持。',
  disclaimer:
    '本测评是症状筛查与自我观察工具，不能替代专业的精神科或心理咨询诊断。任何因子分数和筛查等级均不构成疾病判断，也不应被解读为你患有某种障碍。如果你有自伤、自杀想法或感到极度危险，请立即拨打 QM 心理援助热线 15001930070 或联系身边信任的人。',
};

// 危机风险题 ID 列表（用于安全闸门）
// Q15: 想结束自己的生命（F4 抑郁因子）
// Q59: 想到死亡的事（F10 其他因子）
export const SCL90_CRISIS_QUESTIONS = ['Q15', 'Q59'];

// 危机阈值：得分 >= 4 视为需要触发安全覆盖
export const SCL90_CRISIS_THRESHOLD = 4;
