
// 心理测评数据集合 — 7 套独立测评

export interface AssessmentQuestion {
  id: string;
  text: string;
  dimension: string; // 所属维度代码
  reverse?: boolean; // 是否反向计分
}

export interface AssessmentDimension {
  code: string;
  name: string;
  description: string;
  color: string;
}

export interface AssessmentInfo {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  duration: string;
  questionCount: number;
  icon: string;
  color: string;
  type?: 'standard' | 'growth' | 'growth-profile'; // 标准测评 / 成长画像 / 成长画像（旧）
  dimensions: AssessmentDimension[];
  questions: AssessmentQuestion[];
  scoring: {
    min: number;
    max: number;
    labels: string[]; // 5档标签
    scale?: '1-5' | '0-4'; // 计分起点，默认 1-5
  };
  resultNote: string;
  // 成长画像类型专用
  growthLevels?: {
    dimension: { low: string; mid: string; high: string };
    total: { low: string; mid: string; high: string };
  };
  sevenDayPractice?: {
    title: string;
    description: string;
    steps: string[];
  };
  disclaimer?: string;
}

// ===== 测评 1：MBTI 16型人格 =====
export const mbtiAssessment: AssessmentInfo = {
  id: 'mbti',
  title: 'MBTI 性格探索',
  subtitle: '16型人格倾向测试',
  description: '通过四个维度的偏好，了解你的性格倾向和自然反应方式。',
  duration: '约 10-15 分钟',
  questionCount: 93,
  icon: '🧩',
  color: 'from-purple-400 to-pink-400',
  dimensions: [
    { code: 'E', name: '外倾', description: '从与人互动中获取能量', color: 'bg-amber-400' },
    { code: 'I', name: '内倾', description: '从独处和内省中获取能量', color: 'bg-blue-400' },
    { code: 'S', name: '实感', description: '关注具体事实和当下细节', color: 'bg-green-400' },
    { code: 'N', name: '直觉', description: '关注可能性和未来模式', color: 'bg-purple-400' },
    { code: 'T', name: '思考', description: '基于逻辑和客观分析做决定', color: 'bg-cyan-400' },
    { code: 'F', name: '情感', description: '基于价值观和关系影响做决定', color: 'bg-pink-400' },
    { code: 'J', name: '判断', description: '喜欢有条理、有计划的生活', color: 'bg-orange-400' },
    { code: 'P', name: '感知', description: '喜欢灵活、开放的生活方式', color: 'bg-teal-400' },
  ],
  questions: [
    { id: 'Q1', text: '在社交聚会上，你通常会——', dimension: 'E' },
    { id: 'Q2', text: '你更擅长——', dimension: 'S' },
    { id: 'Q3', text: '做决定时，你更依赖——', dimension: 'T' },
    { id: 'Q4', text: '你的生活方式更偏向——', dimension: 'J' },
    { id: 'Q5', text: '周末你更愿意——', dimension: 'I' },
    { id: 'Q6', text: '你更容易被什么吸引——', dimension: 'N' },
    { id: 'Q7', text: '你更看重——', dimension: 'F' },
    { id: 'Q8', text: '面对变化，你通常——', dimension: 'P' },
    { id: 'Q9', text: '在团队中，你更喜欢——', dimension: 'E' },
    { id: 'Q10', text: '你学习新事物时更习惯——', dimension: 'S' },
    { id: 'Q11', text: '你更欣赏哪种人——', dimension: 'T' },
    { id: 'Q12', text: '你的工作/学习空间——', dimension: 'J' },
    { id: 'Q13', text: '独处对你来说——', dimension: 'I' },
    { id: 'Q14', text: '你更相信——', dimension: 'N' },
    { id: 'Q15', text: '朋友遇到困难，你会——', dimension: 'F' },
    { id: 'Q16', text: '你更喜欢——', dimension: 'P' },
    { id: 'Q17', text: '讨论问题时，你倾向于——', dimension: 'E' },
    { id: 'Q18', text: '你更关注——', dimension: 'S' },
    { id: 'Q19', text: '批评对你来说——', dimension: 'T' },
    { id: 'Q20', text: '出门旅行你通常——', dimension: 'J' },
  ],
  scoring: { min: 0, max: 100, labels: ['轻度倾向', '明显倾向', '强烈倾向'] },
  resultNote: 'MBTI 帮助你了解自己的自然偏好，而不是给你贴标签。每个人都是独特的，类型只是参考。',
};

// ===== 测评 2：情绪自评量表（20题/4维度） =====
export const moodAssessment: AssessmentInfo = {
  id: 'mood',
  title: '情绪自评',
  subtitle: '20题 4 维度快速扫描',
  description: '快速了解你最近的情绪状态：焦虑、低落、压力、睡眠影响。',
  duration: '约 3 分钟',
  questionCount: 20,
  icon: '💭',
  color: 'from-pink-400 to-rose-400',
  dimensions: [
    { code: 'anxiety', name: '焦虑感', description: '担忧、紧张、不安的程度', color: 'bg-amber-400' },
    { code: 'depression', name: '低落感', description: '情绪低落、兴趣减退的程度', color: 'bg-blue-400' },
    { code: 'stress', name: '压力感', description: '感受到的压力和应对资源的平衡', color: 'bg-rose-400' },
    { code: 'sleep', name: '睡眠影响', description: '情绪对睡眠质量的影响程度', color: 'bg-indigo-400' },
  ],
  questions: [
    { id: 'Q1', text: '最近一周，我经常感到紧张或不安', dimension: 'anxiety' },
    { id: 'Q2', text: '我对很多事情都提不起兴趣', dimension: 'depression' },
    { id: 'Q3', text: '我感觉有很多事情压得喘不过气', dimension: 'stress' },
    { id: 'Q4', text: '我入睡困难或者容易醒', dimension: 'sleep' },
    { id: 'Q5', text: '我脑子里有很多停不下来的担心', dimension: 'anxiety' },
    { id: 'Q6', text: '我常常感到情绪低落', dimension: 'depression' },
    { id: 'Q7', text: ' deadlines 或任务让我很焦虑', dimension: 'stress' },
    { id: 'Q8', text: '我醒来后还是觉得很累', dimension: 'sleep' },
    { id: 'Q9', text: '我心跳加速、手心出汗，找不到原因', dimension: 'anxiety' },
    { id: 'Q10', text: '我觉得自己没用或没价值', dimension: 'depression' },
    { id: 'Q11', text: '我很难放松下来', dimension: 'stress' },
    { id: 'Q12', text: '我睡不好的时候会更焦虑', dimension: 'sleep' },
    { id: 'Q13', text: '我害怕发生不好的事情', dimension: 'anxiety' },
    { id: 'Q14', text: '以前喜欢的事现在不想做了', dimension: 'depression' },
    { id: 'Q15', text: '我对自己要求很高，达不到就自责', dimension: 'stress' },
    { id: 'Q16', text: '我的睡眠质量影响了白天的状态', dimension: 'sleep' },
    { id: 'Q17', text: '我难以集中注意力，总在想别的事', dimension: 'anxiety' },
    { id: 'Q18', text: '我觉得未来没有什么希望', dimension: 'depression' },
    { id: 'Q19', text: '身边人的情绪也会影响到我', dimension: 'stress' },
    { id: 'Q20', text: '半夜醒来后就很难再睡着', dimension: 'sleep' },
  ],
  scoring: { min: 0, max: 100, labels: ['轻度', '轻中度', '中度', '中重度', '较重'] },
  resultNote: '本测评仅为自我觉察参考，不能替代专业诊断。如果你感觉持续困扰，建议寻求专业帮助。',
};

// ===== 测评 3：IPIP-50 大五人格 =====
export const bigFiveAssessment: AssessmentInfo = {
  id: 'bigfive',
  title: '大五人格测评',
  subtitle: 'IPIP-50 · 5维度人格剖面',
  description: '当代心理学最受认可的人格模型：开放性、尽责性、外向性、宜人性、神经质。',
  duration: '约 8 分钟',
  questionCount: 60,
  icon: '🌟',
  color: 'from-indigo-400 to-purple-400',
  dimensions: [
    { code: 'O', name: '开放性', description: '对新经验、新想法的接受程度', color: 'bg-purple-400' },
    { code: 'C', name: '尽责性', description: '自律、可靠、有组织的程度', color: 'bg-blue-400' },
    { code: 'E', name: '外向性', description: '社交活跃度和能量取向', color: 'bg-amber-400' },
    { code: 'A', name: '宜人性', description: '信任、合作、利他的倾向', color: 'bg-green-400' },
    { code: 'N', name: '神经质', description: '情绪稳定性和负面情绪敏感度', color: 'bg-rose-400' },
  ],
  questions: [
    { id: 'Q1', text: '我喜欢接触新的想法和观点', dimension: 'O' },
    { id: 'Q2', text: '我做事情很有条理', dimension: 'C' },
    { id: 'Q3', text: '我喜欢与人交往，认识新朋友', dimension: 'E' },
    { id: 'Q4', text: '我相信大多数人都是善意的', dimension: 'A' },
    { id: 'Q5', text: '我很容易感到紧张或焦虑', dimension: 'N' },
    { id: 'Q6', text: '我对艺术和美有敏锐的感受', dimension: 'O' },
    { id: 'Q7', text: '我会认真完成承诺的事情', dimension: 'C' },
    { id: 'Q8', text: '聚会中我通常很活跃', dimension: 'E' },
    { id: 'Q9', text: '我愿意帮助别人，哪怕自己不方便', dimension: 'A' },
    { id: 'Q10', text: '我的情绪容易波动', dimension: 'N' },
    { id: 'Q11', text: '我喜欢思考抽象的概念和理论', dimension: 'O' },
    { id: 'Q12', text: '我的工作/学习空间很整洁', dimension: 'C' },
    { id: 'Q13', text: '我说话直接，不绕弯子', dimension: 'E' },
    { id: 'Q14', text: '我尽量不与人发生冲突', dimension: 'A' },
    { id: 'Q15', text: '我经常担心一些事情', dimension: 'N' },
    { id: 'Q16', text: '我喜欢尝试新鲜事物', dimension: 'O' },
    { id: 'Q17', text: '我制定计划后会坚持执行', dimension: 'C' },
    { id: 'Q18', text: '我从社交中获得能量', dimension: 'E' },
    { id: 'Q19', text: '别人的感受我会考虑到', dimension: 'A' },
    { id: 'Q20', text: '我比较敏感，容易受伤', dimension: 'N' },
    { id: 'Q21', text: '我经常反思自己和人生', dimension: 'O' },
    { id: 'Q22', text: '我做事追求完美', dimension: 'C' },
    { id: 'Q23', text: '我在陌生人面前不怯场', dimension: 'E' },
    { id: 'Q24', text: '我愿意为团队利益牺牲个人利益', dimension: 'A' },
    { id: 'Q25', text: '压力大的时候我容易崩溃', dimension: 'N' },
  ],
  scoring: { min: 0, max: 100, labels: ['低', '偏低', '中等', '偏高', '高'] },
  resultNote: '大五人格描述的是你的倾向，不是好坏。每个特质在不同情境下都有独特的价值。',
};

// ===== 测评 4：霍兰德职业兴趣（RIASEC） =====
export const hollandAssessment: AssessmentInfo = {
  id: 'holland',
  title: '霍兰德职业兴趣',
  subtitle: 'RIASEC 6类型兴趣探索',
  description: '发现你的职业兴趣类型：现实型、研究型、艺术型、社会型、企业型、常规型。',
  duration: '约 8 分钟',
  questionCount: 30,
  icon: '💼',
  color: 'from-emerald-400 to-teal-400',
  dimensions: [
    { code: 'R', name: '现实型', description: '动手操作、机械、技术、户外', color: 'bg-orange-400' },
    { code: 'I', name: '研究型', description: '探索、分析、研究、理论', color: 'bg-blue-400' },
    { code: 'A', name: '艺术型', description: '创造、表达、艺术、设计', color: 'bg-purple-400' },
    { code: 'S', name: '社会型', description: '助人、教育、咨询、服务', color: 'bg-green-400' },
    { code: 'E', name: '企业型', description: '领导、影响、销售、创业', color: 'bg-rose-400' },
    { code: 'C', name: '常规型', description: '有序、细致、数据、管理', color: 'bg-cyan-400' },
  ],
  questions: [
    { id: 'Q1', text: '我喜欢动手修理或组装东西', dimension: 'R' },
    { id: 'Q2', text: '我喜欢分析问题、寻找规律', dimension: 'I' },
    { id: 'Q3', text: '我喜欢用创意的方式表达自己', dimension: 'A' },
    { id: 'Q4', text: '我喜欢帮助别人解决问题', dimension: 'S' },
    { id: 'Q5', text: '我喜欢带领团队达成目标', dimension: 'E' },
    { id: 'Q6', text: '我做事很有条理和规范', dimension: 'C' },
    { id: 'Q7', text: '我喜欢户外活动和体力劳动', dimension: 'R' },
    { id: 'Q8', text: '我喜欢阅读科学或学术书籍', dimension: 'I' },
    { id: 'Q9', text: '我对艺术、音乐、戏剧感兴趣', dimension: 'A' },
    { id: 'Q10', text: '我喜欢教育或指导别人', dimension: 'S' },
    { id: 'Q11', text: '我喜欢做决策、影响他人', dimension: 'E' },
    { id: 'Q12', text: '我喜欢整理和归档信息', dimension: 'C' },
    { id: 'Q13', text: '我操作工具或机械很上手', dimension: 'R' },
    { id: 'Q14', text: '我对事物的原理和原因很好奇', dimension: 'I' },
    { id: 'Q15', text: '我喜欢设计或创造新东西', dimension: 'A' },
    { id: 'Q16', text: '我愿意倾听别人的烦恼', dimension: 'S' },
    { id: 'Q17', text: '我擅长说服别人接受我的观点', dimension: 'E' },
    { id: 'Q18', text: '我关注细节，做事认真细致', dimension: 'C' },
    { id: 'Q19', text: '比起在办公室，我更喜欢实际操作的工作', dimension: 'R' },
    { id: 'Q20', text: '我喜欢做实验或研究项目', dimension: 'I' },
    { id: 'Q21', text: '我有独特的审美和风格', dimension: 'A' },
    { id: 'Q22', text: '我愿意为公益或社区服务', dimension: 'S' },
    { id: 'Q23', text: '我喜欢创业或做有挑战性的项目', dimension: 'E' },
    { id: 'Q24', text: '我擅长管理日程和资源', dimension: 'C' },
    { id: 'Q25', text: '我喜欢建造或制作有形的东西', dimension: 'R' },
    { id: 'Q26', text: '我享受深入思考复杂问题的过程', dimension: 'I' },
    { id: 'Q27', text: '我喜欢写作、绘画或音乐创作', dimension: 'A' },
    { id: 'Q28', text: '我能感受到别人的情绪变化', dimension: 'S' },
    { id: 'Q29', text: '我在竞争中感到兴奋', dimension: 'E' },
    { id: 'Q30', text: '我喜欢按照明确的流程来做事', dimension: 'C' },
  ],
  scoring: { min: 0, max: 100, labels: ['低', '中等', '高'] },
  resultNote: '职业兴趣测试帮助你了解自己喜欢什么类型的工作，可以作为职业规划的参考，但不是唯一答案。',
};

// ===== 测评 5：职业价值观 =====
export const workValuesAssessment: AssessmentInfo = {
  id: 'work-values',
  title: '职业价值观',
  subtitle: '8 项核心价值优先级排序',
  description: '发现对你最重要的职业价值，帮助你做出更符合内心的职业选择。',
  duration: '约 5 分钟',
  questionCount: 24,
  icon: '🎯',
  color: 'from-amber-400 to-orange-400',
  dimensions: [
    { code: 'achievement', name: '成就满足', description: '做出成果、实现目标的成就感', color: 'bg-amber-400' },
    { code: 'security', name: '稳定安全', description: '工作稳定、收入可预期', color: 'bg-blue-400' },
    { code: 'autonomy', name: '自主独立', description: '能自己决定工作方式和节奏', color: 'bg-purple-400' },
    { code: 'growth', name: '成长发展', description: '持续学习和职业晋升空间', color: 'bg-green-400' },
    { code: 'relation', name: '人际和谐', description: '友好的同事关系和工作氛围', color: 'bg-pink-400' },
    { code: 'meaning', name: '意义贡献', description: '工作对社会或他人有价值', color: 'bg-rose-400' },
    { code: 'balance', name: '生活平衡', description: '工作与个人生活的平衡', color: 'bg-teal-400' },
    { code: 'reward', name: '经济回报', description: '薪资和福利的丰厚程度', color: 'bg-cyan-400' },
  ],
  questions: [
    { id: 'Q1', text: '对我来说，工作做出成绩很重要', dimension: 'achievement' },
    { id: 'Q2', text: '我希望工作是稳定的，不用太担心失业', dimension: 'security' },
    { id: 'Q3', text: '我希望能自主决定怎么做事', dimension: 'autonomy' },
    { id: 'Q4', text: '我希望工作中能不断学到新东西', dimension: 'growth' },
    { id: 'Q5', text: '和同事处好关系对我很重要', dimension: 'relation' },
    { id: 'Q6', text: '我希望我的工作对别人有帮助', dimension: 'meaning' },
    { id: 'Q7', text: '工作不影响个人生活对我很重要', dimension: 'balance' },
    { id: 'Q8', text: '高收入是我选择工作的重要因素', dimension: 'reward' },
    { id: 'Q9', text: '我享受完成有挑战的任务后的满足感', dimension: 'achievement' },
    { id: 'Q10', text: '变化太多的工作会让我不安', dimension: 'security' },
    { id: 'Q11', text: '被管太多会让我失去动力', dimension: 'autonomy' },
    { id: 'Q12', text: '我在意职业发展的上升空间', dimension: 'growth' },
    { id: 'Q13', text: '我喜欢在氛围好的团队里工作', dimension: 'relation' },
    { id: 'Q14', text: '我希望工作有超越赚钱的意义', dimension: 'meaning' },
    { id: 'Q15', text: '加班太多的工作我很难接受', dimension: 'balance' },
    { id: 'Q16', text: '我愿意为更高的收入付出更多努力', dimension: 'reward' },
    { id: 'Q17', text: '做出别人认可的成果让我有动力', dimension: 'achievement' },
    { id: 'Q18', text: '福利保障（社保、公积金、假期）很重要', dimension: 'security' },
    { id: 'Q19', text: '我喜欢按自己的方式和节奏做事', dimension: 'autonomy' },
    { id: 'Q20', text: '我希望工作能让我不断提升自己', dimension: 'growth' },
    { id: 'Q21', text: '同事关系不好会严重影响我的工作感受', dimension: 'relation' },
    { id: 'Q22', text: '能帮助他人的工作让我感到满足', dimension: 'meaning' },
    { id: 'Q23', text: '我需要时间和精力照顾自己和家人', dimension: 'balance' },
    { id: 'Q24', text: '薪资水平是我评价一份工作的重要标准', dimension: 'reward' },
  ],
  scoring: { min: 0, max: 100, labels: ['低优先', '中等', '高优先'] },
  resultNote: '职业价值观没有对错，了解自己最看重什么，能帮助你在选择时更笃定。',
};

// ===== 测评 6：多元智能测评 =====
export const multipleIntelAssessment: AssessmentInfo = {
  id: 'multiple-intelligence',
  title: '多元智能测评',
  subtitle: '8 种智能优势发现',
  description: '加德纳多元智能理论：发现你的天赋和擅长的学习方式。',
  duration: '约 6 分钟',
  questionCount: 24,
  icon: '🧠',
  color: 'from-violet-400 to-fuchsia-400',
  dimensions: [
    { code: 'linguistic', name: '语言智能', description: '文字、语言、阅读、表达能力', color: 'bg-blue-400' },
    { code: 'logical', name: '逻辑数学智能', description: '推理、分析、解决问题能力', color: 'bg-indigo-400' },
    { code: 'spatial', name: '空间智能', description: '想象、方向感、视觉设计能力', color: 'bg-purple-400' },
    { code: 'musical', name: '音乐智能', description: '节奏、音调、音乐感受能力', color: 'bg-pink-400' },
    { code: 'bodily', name: '身体动觉智能', description: '运动、协调、动手操作能力', color: 'bg-orange-400' },
    { code: 'interpersonal', name: '人际智能', description: '理解他人、社交、合作能力', color: 'bg-green-400' },
    { code: 'intrapersonal', name: '内省智能', description: '自我觉察、反思、情绪管理能力', color: 'bg-amber-400' },
    { code: 'naturalist', name: '自然观察智能', description: '观察自然、识别分类的能力', color: 'bg-emerald-400' },
  ],
  questions: [
    { id: 'Q1', text: '我擅长用语言表达自己的想法', dimension: 'linguistic' },
    { id: 'Q2', text: '我很擅长逻辑推理和解决问题', dimension: 'logical' },
    { id: 'Q3', text: '我空间感好，看地图导航没问题', dimension: 'spatial' },
    { id: 'Q4', text: '我对音乐节奏和音调很敏感', dimension: 'musical' },
    { id: 'Q5', text: '我擅长运动或手工操作', dimension: 'bodily' },
    { id: 'Q6', text: '我很容易理解别人的感受', dimension: 'interpersonal' },
    { id: 'Q7', text: '我经常反思自己的想法和行为', dimension: 'intrapersonal' },
    { id: 'Q8', text: '我对植物、动物、自然现象感兴趣', dimension: 'naturalist' },
    { id: 'Q9', text: '我喜欢阅读和写作', dimension: 'linguistic' },
    { id: 'Q10', text: '我对数字和数据很敏感', dimension: 'logical' },
    { id: 'Q11', text: '我喜欢绘画或视觉设计', dimension: 'spatial' },
    { id: 'Q12', text: '我能轻松记住歌曲的旋律和歌词', dimension: 'musical' },
    { id: 'Q13', text: '我学动作类的东西很快', dimension: 'bodily' },
    { id: 'Q14', text: '朋友有心事常来找我聊', dimension: 'interpersonal' },
    { id: 'Q15', text: '我清楚自己的优点和不足', dimension: 'intrapersonal' },
    { id: 'Q16', text: '我喜欢户外活动和自然环境', dimension: 'naturalist' },
    { id: 'Q17', text: '我学新语言或词汇很快', dimension: 'linguistic' },
    { id: 'Q18', text: '我喜欢做策略或分析类的游戏', dimension: 'logical' },
    { id: 'Q19', text: '我擅长在脑子里想象物体的样子', dimension: 'spatial' },
    { id: 'Q20', text: '音乐能很强烈地影响我的情绪', dimension: 'musical' },
    { id: 'Q21', text: '我动手能力强，喜欢 DIY', dimension: 'bodily' },
    { id: 'Q22', text: '我在团队中能很好地协作', dimension: 'interpersonal' },
    { id: 'Q23', text: '我能觉察到自己情绪变化的原因', dimension: 'intrapersonal' },
    { id: 'Q24', text: '我能区分不同植物或动物的种类', dimension: 'naturalist' },
  ],
  scoring: { min: 0, max: 100, labels: ['待发展', '中等', '优势领域'] },
  resultNote: '每个人都拥有多种智能，只是发展程度不同。了解自己的智能优势，可以更好地发挥天赋、选择学习方式。',
};

// ===== 测评 7：阿德勒指数（成长画像）=====
export const adlerIndexAssessment: AssessmentInfo = {
  id: 'adler-index',
  title: '阿德勒指数',
  subtitle: '看看你现在如何面对选择、关系、成长与共同体',
  description: '这不是在测你是不是一个"够不够阿德勒"的人。它只是想看看，当你面对选择、关系、自卑、失败和他人的目光时，现在的你通常会怎么做。没有标准答案，请选择最接近"现在的你"的答案。',
  duration: '4-6 分钟',
  questionCount: 24,
  icon: '🌱',
  color: 'from-amber-200 to-rose-200',
  type: 'growth',
  dimensions: [
    { code: 'A', name: '选择与行动感', description: '面对限制和不确定性时，是否仍能识别自己可以选择和行动的部分。对应阿德勒概念：目的论、创造性自我、主体性。', color: '#F59E0B' },
    { code: 'B', name: '课题与边界感', description: '能否区分自己的选择、责任和情绪，与他人的选择、反应和情绪。对应阿德勒概念：课题分离、责任归位、边界。', color: '#10B981' },
    { code: 'C', name: '勇气与成长感', description: '如何面对自卑、失败、比较、不完美和新挑战。对应阿德勒概念：自卑与超越、鼓励、追求优越。', color: '#8B5CF6' },
    { code: 'D', name: '连接与共同体感', description: '是否体验到归属、合作、接受帮助、贡献以及人与人之间的平等。对应阿德勒概念：社会兴趣、共同体感、贡献感、平等感。', color: '#EC4899' },
  ],
  questions: [
    // A 选择与行动感
    { id: 'A1', text: '遇到挫折时，我通常能找到一个自己还能做的小行动。', dimension: 'A' },
    { id: 'A2', text: '我能区分无法改变的事实，和我仍然可以选择的回应。', dimension: 'A' },
    { id: 'A3', text: '即使过去的经历正在影响我，我仍然能尝试新的做法。', dimension: 'A' },
    { id: 'A4', text: '遇到问题时，我更容易问"接下来我想怎么做"，而不只是反复想"为什么会这样"。', dimension: 'A' },
    { id: 'A5', text: '我可以允许自己暂时做不到，同时保留以后重新选择的空间。', dimension: 'A' },
    { id: 'A6', text: '做决定时，我愿意承担属于自己的那部分后果。', dimension: 'A' },
    // B 课题与边界感
    { id: 'B1', text: '别人不认同我时，我能区分"他的看法"和"我的选择"。', dimension: 'B' },
    { id: 'B2', text: '我可以关心别人，但不会把解决对方所有问题都当成自己的责任。', dimension: 'B' },
    { id: 'B3', text: '我表达自己的需要后，能允许对方有自己的回应。', dimension: 'B' },
    { id: 'B4', text: '我比较能识别一件事里哪些是我能控制的，哪些不是。', dimension: 'B' },
    { id: 'B5', text: '在关系中，我能设置边界，而不是主要靠讨好维持关系。', dimension: 'B' },
    { id: 'B6', text: '我能区分"支持别人"和"替别人承担"之间的不同。', dimension: 'B' },
    // C 勇气与成长感
    { id: 'C1', text: '看到别人比我优秀时，我更容易想"我可以学什么"，而不是马上否定自己。', dimension: 'C' },
    { id: 'C2', text: '失败后，我比较能把它看成反馈，而不是证明"我不行"。', dimension: 'C' },
    { id: 'C3', text: '我愿意做一点有风险、但符合自己方向的尝试。', dimension: 'C' },
    { id: 'C4', text: '我能承认自己的不足，同时不把"不足"直接等同于"没有价值"。', dimension: 'C' },
    { id: 'C5', text: '我更关注自己有没有比昨天前进一步，而不是一定要赢过别人。', dimension: 'C' },
    { id: 'C6', text: '即使害怕，我有时仍然能去做对自己重要的事情。', dimension: 'C' },
    // D 连接与共同体感
    { id: 'D1', text: '我的生活中至少有一些关系，让我感到"我属于这里"。', dimension: 'D' },
    { id: 'D2', text: '我能感受到自己对别人有价值，即使只是很小的贡献。', dimension: 'D' },
    { id: 'D3', text: '我既能帮助别人，也能在需要时接受别人的帮助。', dimension: 'D' },
    { id: 'D4', text: '我比较能把别人看作伙伴，而不只是竞争者或评审者。', dimension: 'D' },
    { id: 'D5', text: '我能在关系中感受到平等，而不是总觉得自己高人一等或低人一等。', dimension: 'D' },
    { id: 'D6', text: '我知道哪些人或群体，是我愿意持续建立连接的共同体。', dimension: 'D' },
  ],
  scoring: { min: 0, max: 96, labels: ['起步探索', '练习与重构', '较稳定运用'], scale: '0-4' },
  resultNote: '阿德勒指数是 QM AI 基于阿德勒个体心理学设计的自我探索工具。分数反映的是你此刻的回答与生活倾向，也可能随着时间和情境变化。本工具不是医疗或心理诊断工具，不用于疾病筛查或心理健康分级。',
  growthLevels: {
    dimension: { low: '正在探索', mid: '正在练习', high: '相对稳定' },
    total: { low: '起步探索', mid: '练习与重构', high: '较稳定运用' },
  },
  sevenDayPractice: {
    title: '7 天阿德勒练习',
    description: '根据你目前最值得练习的方向，每天一个小行动。',
    steps: [],
  },
  disclaimer: '阿德勒指数是 QM AI 基于阿德勒个体心理学设计的自我探索工具。分数反映的是你此刻的回答与生活倾向，也可能随着时间和情境变化。本工具不是医疗或心理诊断工具，不用于疾病筛查或心理健康分级。',
};

// 7 天练习按维度路由
export function getAdlerPractice(dimCode: string): { title: string; description: string; dailyQuestion: string; steps: string[] } {
  switch (dimCode) {
    case 'A':
      return {
        title: '选择小步',
        description: '每天发现一个"原本以为没办法，但其实还有小选择"的瞬间。',
        dailyQuestion: '今天有哪件事，我原本觉得「没办法」，但其实仍然有一个很小的选择？',
        steps: [
          '第1天：留意一个你觉得"没办法"的时刻，写下它。',
          '第2天：在那件"没办法"的事里，找出一个最小的、你还能选择的动作。',
          '第3天：真的去做那个最小的选择，注意做完后的感受。',
          '第4天：再找一件"没办法"的事，重复上面的练习。',
          '第5天：回顾这几天，你发现自己"能选"的部分变多了吗？',
          '第6天：选一个对你重要的领域，主动做一个小小的选择。',
          '第7天：总结：什么情境下我更容易想起"我还能选择"？',
        ],
      };
    case 'B':
      return {
        title: '课题分离三问',
        description: '学习区分"我的课题"和"别人的课题"，把精力放回自己能控制的部分。',
        dailyQuestion: '1. 这件事最后的后果由谁承担？  2. 我能控制什么？  3. 如果我只负责自己的部分，我会怎么做？',
        steps: [
          '第1天：找一件让你纠结的关系事，问自己三问。',
          '第2天：只做你能控制的部分，观察对方的反应和你的感受。',
          '第3天：练习表达需要后，允许对方有自己的回应。',
          '第4天：找一件你习惯替别人承担的事，试着把它还回去。',
          '第5天：在一段重要关系中，设置一个你一直想说的边界。',
          '第6天：回顾本周，哪些事是"别人的课题"，哪些是"我的课题"？',
          '第7天：总结：区分课题之后，我的生活有什么变化？',
        ],
      };
    case 'C':
      return {
        title: '勇气小步',
        description: '每天选一件"有一点害怕，但对我重要"的事情，做一个足够小的行动。',
        dailyQuestion: '今天，我愿意带一点害怕，去做的那件小事是什么？',
        steps: [
          '第1天：列出3件你想做但因为害怕一直没做的事。',
          '第2天：选其中最小的一件，拆成一个"5分钟就能做"的小行动。',
          '第3天：真的去做那个5分钟的行动，然后记录感受。',
          '第4天：找一个你通常会回避的社交场景，做一个最小的尝试。',
          '第5天：允许自己失败一次，然后写下：失败了以后，我还是有价值的吗？',
          '第6天：跟自己做一个"我不需要完美"的约定。',
          '第7天：回顾：这周我做了哪些"带一点害怕但仍然去做"的事？',
        ],
      };
    case 'D':
    default:
      return {
        title: '共同体微行动',
        description: '每天完成一个真实的小连接：表达感谢、接受帮助、提供小帮助、参与共同体。',
        dailyQuestion: '今天，我可以做的一个小小的连接行动是什么？',
        steps: [
          '第1天：对一个帮助过你的人，说一声具体的谢谢。',
          '第2天：当你需要帮助时，主动向一个人开口求助。',
          '第3天：为一个你在乎的人做一件不期回报的小事。',
          '第4天：在一个群体中（工作/学习/兴趣），主动做一点贡献。',
          '第5天：试着把一个你原本看作"竞争者"的人，当作"伙伴"来看待。',
          '第6天：找出3个让你感到"我属于这里"的瞬间或人。',
          '第7天：回顾这周：连接给你带来了什么感受？',
        ],
      };
  }
}

// 全部测评列表
export const genderDiversityAssessment = {
  id: "gender-diversity",
  slug: "gender-diversity",
  questionCount: 48,
  title: "性别多元指数",
  subtitle: "探索你的性别体验地图",
  description: "性别不是非黑即白的二元选项。通过53道题目，从10个维度了解你独特的性别体验。",
  icon: "🌈",
  color: "from-pink-400 to-purple-500",
  type: "growth",
  resultTitle: "我的性别体验地图",
  dimensions: [
    { code: "G1", name: "内在性别认同", description: "你内心深处对自己性别的感受", color: "bg-pink-400" },
    { code: "G2", name: "性别表达与呈现", description: "你外在的穿着、举止、风格表达", color: "bg-purple-400" },
    { code: "G3", name: "身体体验与性别", description: "你对自己身体的感受与性别之间的关系", color: "bg-rose-400" },
    { code: "G4", name: "社会性别体验", description: "在社会环境中你对自身性别的体验", color: "bg-blue-400" },
    { code: "G5", name: "性别探索历程", description: "你在性别方面的探索过程和阶段", color: "bg-indigo-400" },
    { code: "G6", name: "性别流动与变化", description: "你对性别流动性的感受与体验", color: "bg-cyan-400" },
    { code: "G7", name: "性别相关情绪", description: "性别带给你的情绪感受与调节", color: "bg-amber-400" },
    { code: "G8", name: "身份标签与命名", description: "你对性别身份标签的使用与感受", color: "bg-teal-400" },
    { code: "G9", name: "跨文化/跨地区视角", description: "不同文化环境对你性别体验的影响", color: "bg-emerald-400" },
    { code: "G10", name: "性别与交叉身份", description: "性别与其他身份维度的交织体验", color: "bg-orange-400" },
  ],
  questions: [
    { id: "GENDER_G1Q1", text: "我内心对自己性别的感受，与出生时被指派的性别一致。", dimension: "G1" },
    { id: "GENDER_G1Q2", text: "我清楚地知道自己认同的性别是什么。", dimension: "G1" },
    { id: "GENDER_G1Q3", text: "当别人用我认同的性别称谓称呼我时，我会感到舒服和被看见。", dimension: "G1" },
    { id: "GENDER_G1Q4", text: "我对自己性别的认同，是经过思考和探索后形成的。", dimension: "G1" },
    { id: "GENDER_G1Q5", text: "我的性别认同在过去几年里没有太大变化。", dimension: "G1", reverse: true },
    { id: "GENDER_G1Q6", text: "我能够坦然地承认自己的性别认同。", dimension: "G1" },
    { id: "GENDER_G2Q1", text: "我的外在穿着和打扮，符合我内心想要的性别表达。", dimension: "G2" },
    { id: "GENDER_G2Q2", text: "我对自己的性别表达方式感到舒适和自在。", dimension: "G2" },
    { id: "GENDER_G2Q3", text: "在不同场合（工作、家庭、朋友），我的性别表达会有所不同。", dimension: "G2" },
    { id: "GENDER_G2Q4", text: "我会因为担心别人的眼光而调整自己的性别表达。", dimension: "G2", reverse: true },
    { id: "GENDER_G2Q5", text: "我喜欢尝试不同风格的性别表达，不拘泥于一种样子。", dimension: "G2" },
    { id: "GENDER_G3Q1", text: "我对自己的身体感到舒适和自在。", dimension: "G3" },
    { id: "GENDER_G3Q2", text: "我的身体和我认同的性别之间，没有让我困扰的差距。", dimension: "G3" },
    { id: "GENDER_G3Q3", text: "有些身体部位会让我感到不适或烦躁。", dimension: "G3", reverse: true },
    { id: "GENDER_G3Q4", text: "我能以接纳的态度看待自己的身体。", dimension: "G3" },
    { id: "GENDER_G3Q5", text: "身体的变化（比如发型、着装、体态）会影响我对自己性别的感受。", dimension: "G3" },
    { id: "GENDER_G3Q6", text: "我对身体的感受，会随着时间和环境而变化。", dimension: "G3" },
    { id: "GENDER_G4Q1", text: "在日常生活中，别人对我的性别认知和我自己的认同基本一致。", dimension: "G4" },
    { id: "GENDER_G4Q2", text: "我在公共场合会因为性别相关的问题感到不安或紧张。", dimension: "G4", reverse: true },
    { id: "GENDER_G4Q3", text: "我能感受到社会对不同性别的期待和规范。", dimension: "G4" },
    { id: "GENDER_G4Q4", text: "我有过因为性别表达而被误解或被评判的经历。", dimension: "G4", reverse: true },
    { id: "GENDER_G4Q5", text: "在安全的环境里，我可以更自由地表达自己的性别。", dimension: "G4" },
    { id: "GENDER_G5Q1", text: "我曾经花时间思考或探索过自己的性别。", dimension: "G5" },
    { id: "GENDER_G5Q2", text: "我的性别认同是在不断探索中逐渐清晰的。", dimension: "G5" },
    { id: "GENDER_G5Q3", text: "在探索性别这件事上，我感到有压力或困惑。", dimension: "G5", reverse: true },
    { id: "GENDER_G5Q4", text: "我接触过关于多元性别的信息，这帮助我更了解自己。", dimension: "G5" },
    { id: "GENDER_G5Q5", text: "我觉得自己的性别探索还在继续，还没有到终点。", dimension: "G5" },
    { id: "GENDER_G6Q1", text: "我对自己性别的感受，有时候会有变化。", dimension: "G6" },
    { id: "GENDER_G6Q2", text: "我觉得性别不是固定不变的，而是可以流动的。", dimension: "G6" },
    { id: "GENDER_G6Q3", text: "不同的环境或关系中，我对自己性别的感受不太一样。", dimension: "G6" },
    { id: "GENDER_G6Q4", text: "性别变化会让我感到不安或混乱。", dimension: "G6", reverse: true },
    { id: "GENDER_G6Q5", text: "我可以接受自己的性别感受是变化的，不需要急于定下来。", dimension: "G6" },
    { id: "GENDER_G7Q1", text: "想到性别相关的事情，我通常会感到平和或接纳。", dimension: "G7" },
    { id: "GENDER_G7Q2", text: "性别相关的困扰会影响我的情绪和睡眠。", dimension: "G7", reverse: true },
    { id: "GENDER_G7Q3", text: "我有一些方法可以调节性别带来的情绪波动。", dimension: "G7" },
    { id: "GENDER_G7Q4", text: "当我能够做真实的自己时，我会感到轻松和愉悦。", dimension: "G7" },
    { id: "GENDER_G7Q5", text: "有时候我会因为性别相关的事情感到焦虑或低落。", dimension: "G7", reverse: true },
    { id: "GENDER_G8Q1", text: "我有一个自己认同的性别身份标签。", dimension: "G8" },
    { id: "GENDER_G8Q2", text: "使用合适的身份标签，会让我感到被看见和确认。", dimension: "G8" },
    { id: "GENDER_G8Q3", text: "我不太确定该用什么标签来描述自己的性别。", dimension: "G8", reverse: true },
    { id: "GENDER_G8Q4", text: "我觉得不需要标签也可以，重要的是我自己的感受。", dimension: "G8" },
    { id: "GENDER_G8Q5", text: "我曾因为标签的问题感到困惑或有压力。", dimension: "G8", reverse: true },
    { id: "GENDER_G9Q1", text: "我生活的文化环境，对我的性别表达和认同有影响。", dimension: "G9" },
    { id: "GENDER_G9Q2", text: "在不同的文化或环境中，我对性别的感受会有所不同。", dimension: "G9" },
    { id: "GENDER_G9Q3", text: "我所在的文化环境对多元性别比较包容和理解。", dimension: "G9" },
    { id: "GENDER_G9Q4", text: "家庭的文化观念，会影响我对自己性别的表达和公开程度。", dimension: "G9" },
    { id: "GENDER_G9Q5", text: "如果环境更友好，我会更自由地表达自己的性别。", dimension: "G9" },
    { id: "GENDER_G10Q1", text: "我的性别体验，和我的性取向是交织在一起的。", dimension: "G10" },
    { id: "GENDER_G10Q2", text: "我的文化背景、种族或地域，会影响我的性别体验。", dimension: "G10" },
    { id: "GENDER_G10Q3", text: "我的年龄或人生阶段，会影响我对性别的感受。", dimension: "G10" },
    { id: "GENDER_G10Q4", text: "我同时面临多重身份带来的压力（比如性别+性取向+家庭）。", dimension: "G10", reverse: true },
    { id: "GENDER_G10Q5", text: "我的职业或社会角色，会影响我的性别表达。", dimension: "G10" },
    { id: "GENDER_G10Q6", text: "我能从不同的身份维度中找到力量和支持。", dimension: "G10" },
  ],
  scoring: {
    minScore: 0,
    maxScore: 4,
    labels: ["完全不符合", "不太符合", "一般", "比较符合", "非常符合"],
  },
};

export const allAssessments: AssessmentInfo[] = [
  mbtiAssessment,
  moodAssessment,
  bigFiveAssessment,
  hollandAssessment,
  workValuesAssessment,
  multipleIntelAssessment,
  adlerIndexAssessment,
  genderDiversityAssessment as unknown as AssessmentInfo,
];

export function getAssessment(id: string): AssessmentInfo | undefined {
  return allAssessments.find((a) => a.id === id);
}



