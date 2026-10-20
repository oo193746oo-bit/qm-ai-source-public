// ============================================================
// QM AI 知识库 v3.0 元数据常量
// 来源：QM_AI_知识库500%重构_全站内部信息防火墙与用户内容架构_v3.0
// 所有列表均从需求JSON导入，禁止手工修改避免错误
// ============================================================

// ---------- 16 个一级领域 ----------
export interface Domain {
  id: string;
  name: string;
  emoji: string;
  description: string;
}

export const DOMAINS: Domain[] = [
  { id: "D01", name: "情绪与感受", emoji: "🌧️", description: "焦虑、低落、愤怒、麻木——理解你的情绪信号" },
  { id: "D02", name: "亲密关系", emoji: "💞", description: "依恋、沟通、冲突、边界——在亲密中看见自己" },
  { id: "D03", name: "家庭与选择的家", emoji: "🏠", description: "原生家庭、出柜、chosen family——家不只有一种样子" },
  { id: "D04", name: "友谊与社交", emoji: "🤝", description: "社交疲惫、讨好、孤独——关系的多种可能" },
  { id: "D05", name: "性别与性别表达", emoji: "🏳️‍⚧️", description: "跨性别、非二元、性别焦虑——性别比你想的更多元" },
  { id: "D06", name: "性取向与吸引", emoji: "🏳️‍🌈", description: "同性、双性、无性、泛性——关于爱与吸引的光谱" },
  { id: "D07", name: "自我与成长", emoji: "🦋", description: "自尊、认同、价值感——认识自己，成为自己" },
  { id: "D08", name: "工作与职业", emoji: "💼", description: "倦怠、转行、职场身份——工作里的心理议题" },
  { id: "D09", name: "学习与执行功能", emoji: "📚", description: "拖延、注意力、考试压力——学习背后的心理" },
  { id: "D10", name: "身心与日常", emoji: "🌿", description: "睡眠、饮食、身体信号——身心一体的自我照顾" },
  { id: "D11", name: "危机与求助", emoji: "🆘", description: "自伤念头、危机信号、求助资源——你不是一个人" },
  { id: "D12", name: "心理工具箱", emoji: "🧰", description: "接地练习、正念、认知工具——一些可以马上用的方法" },
  { id: "D13", name: "多元文化心理", emoji: "🌍", description: "文化差异、移民、身份拉扯——多元背景下的心理" },
  { id: "D14", name: "人生阶段与转折", emoji: "🚪", description: "青春期、成年初显期、重大转变——人生路上的节点" },
  { id: "D15", name: "神经多样性与注意", emoji: "🧠", description: "ADHD、自闭谱系、神经多样性——不同的大脑，同样有价值" },
  { id: "D16", name: "心理学怎么理解人", emoji: "🔬", description: "阿德勒、依恋、认知流派——心理学理论入门与导航" },
];

// ---------- 24 种用户访问画像 ----------
export interface UserProfile {
  id: string;
  name: string;
}

export const USER_PROFILES: UserProfile[] = [
  { id: "U01", name: "第一次接触心理知识" },
  { id: "U02", name: "正在情绪困扰中" },
  { id: "U03", name: "关系探索者" },
  { id: "U04", name: "性别/性取向探索者" },
  { id: "U05", name: "持续成长实践者" },
  { id: "U06", name: "马上想找方法的人" },
  { id: "U07", name: "专业/学术学习者" },
  { id: "U08", name: "高痛苦/危机用户" },
  { id: "U09", name: "陪伴支持者" },
  { id: "U10", name: "重返用户" },
  { id: "U11", name: "学生/备考者" },
  { id: "U12", name: "职场人士" },
  { id: "U13", name: "管理者" },
  { id: "U14", name: "自由职业/创业者" },
  { id: "U15", name: "跨文化/移民生活者" },
  { id: "U16", name: "多元性别用户" },
  { id: "U17", name: "LGBQ+用户" },
  { id: "U18", name: "神经多样性探索者" },
  { id: "U19", name: "照护者/家属" },
  { id: "U20", name: "刚经历失去的人" },
  { id: "U21", name: "重大转折中的人" },
  { id: "U22", name: "低能量用户" },
  { id: "U23", name: "视觉/互动学习者" },
  { id: "U24", name: "深度理论学习者" },
];

// ---------- 36 种生命场景 ----------
export interface Scenario {
  id: string;
  name: string;
}

export const SCENARIOS: Scenario[] = [
  { id: "S01", name: "我是不是有问题" },
  { id: "S02", name: "我现在很难受" },
  { id: "S03", name: "我不知道自己是什么感受" },
  { id: "S04", name: "我总在想同一件事" },
  { id: "S05", name: "我睡不好" },
  { id: "S06", name: "我什么都不想做" },
  { id: "S07", name: "我对自己很失望" },
  { id: "S08", name: "我不知道该怎么选" },
  { id: "S09", name: "TA为什么这样对我" },
  { id: "S10", name: "我们总是吵架" },
  { id: "S11", name: "我想设边界但不敢" },
  { id: "S12", name: "我刚分手/失去" },
  { id: "S13", name: "我不知道要不要出柜" },
  { id: "S14", name: "我在探索自己的性别" },
  { id: "S15", name: "我觉得没有人理解我" },
  { id: "S16", name: "我在家庭里很累" },
  { id: "S17", name: "我工作快撑不住了" },
  { id: "S18", name: "我不知道要不要离职/转行" },
  { id: "S19", name: "我总拖延" },
  { id: "S20", name: "我注意力很散" },
  { id: "S21", name: "我考试/学习压力很大" },
  { id: "S22", name: "我想更了解自己" },
  { id: "S23", name: "我想改变但不知道从哪开始" },
  { id: "S24", name: "我想学一个心理学理论" },
  { id: "S25", name: "我只想随便看看" },
  { id: "S26", name: "我想帮助一个重要的人" },
  { id: "S27", name: "我想找一个练习" },
  { id: "S28", name: "我想找一句能帮我说出口的话" },
  { id: "S29", name: "我想知道什么时候该找专业帮助" },
  { id: "S30", name: "我刚做完心理测评" },
  { id: "S31", name: "我刚写完情绪树洞" },
  { id: "S32", name: "我最近反复回来" },
  { id: "S33", name: "我在文化/家庭期待之间拉扯" },
  { id: "S34", name: "我对身体/外在感到不自在" },
  { id: "S35", name: "我在重大人生转折点" },
  { id: "S36", name: "我担心自己会伤害自己" },
];

// ---------- 24 种用户目的 ----------
export interface Purpose {
  id: string;
  name: string;
}

export const PURPOSES: Purpose[] = [
  { id: "P01", name: "心理科普" },
  { id: "P02", name: "快速理解" },
  { id: "P03", name: "自我练习" },
  { id: "P04", name: "情绪稳定" },
  { id: "P05", name: "关系沟通" },
  { id: "P06", name: "边界话术" },
  { id: "P07", name: "决策支持" },
  { id: "P08", name: "自我探索" },
  { id: "P09", name: "理论基础" },
  { id: "P10", name: "理论深潜" },
  { id: "P11", name: "工具使用" },
  { id: "P12", name: "测评前理解" },
  { id: "P13", name: "测评后延伸" },
  { id: "P14", name: "树洞后延伸" },
  { id: "P15", name: "支持他人" },
  { id: "P16", name: "危机求助" },
  { id: "P17", name: "资源导航" },
  { id: "P18", name: "故事共鸣" },
  { id: "P19", name: "视觉学习" },
  { id: "P20", name: "互动学习" },
  { id: "P21", name: "反思写作" },
  { id: "P22", name: "长期学习路径" },
  { id: "P23", name: "复习回顾" },
  { id: "P24", name: "和小酷继续聊" },
];

// ---------- 24 种内容形式 ----------
export interface ContentType {
  id: string;
  name: string;
}

export const CONTENT_TYPES: ContentType[] = [
  { id: "CT01", name: "心理科普长文" },
  { id: "CT02", name: "3分钟快速读懂" },
  { id: "CT03", name: "场景故事" },
  { id: "CT04", name: "自我练习" },
  { id: "CT05", name: "互动选择练习" },
  { id: "CT06", name: "分步指南" },
  { id: "CT07", name: "关系话术卡" },
  { id: "CT08", name: "情绪急救卡" },
  { id: "CT09", name: "视觉图谱" },
  { id: "CT10", name: "对比表" },
  { id: "CT11", name: "FAQ问答" },
  { id: "CT12", name: "误区澄清" },
  { id: "CT13", name: "理论入门" },
  { id: "CT14", name: "理论深潜" },
  { id: "CT15", name: "研究解读" },
  { id: "CT16", name: "复合教学场景" },
  { id: "CT17", name: "多元叙事" },
  { id: "CT18", name: "支持者指南" },
  { id: "CT19", name: "测评引导" },
  { id: "CT20", name: "测评结果延伸" },
  { id: "CT21", name: "树洞写作引导" },
  { id: "CT22", name: "7天练习" },
  { id: "CT23", name: "学习路径" },
  { id: "CT24", name: "资源导航" },
];

// ---------- 深度层级（L1-L5） ----------
export interface DepthLevel {
  level: string;
  name: string;
  description: string;
}

export const DEPTH_LEVELS: DepthLevel[] = [
  { level: "L1", name: "直觉", description: "一句话知道这是什么" },
  { level: "L2", name: "体验", description: "能感受到、能命名" },
  { level: "L3", name: "理解", description: "知道为什么会这样" },
  { level: "L4", name: "行动", description: "知道可以做什么" },
  { level: "L5", name: "深化", description: "深入理论与系统理解" },
];

// ---------- 阅读负荷 ----------
export interface ReadingLoad {
  level: string;
  name: string;
  minutes: string;
}

export const READING_LOADS: ReadingLoad[] = [
  { level: "Light", name: "轻阅读", minutes: "1-3分钟" },
  { level: "Medium", name: "中等阅读", minutes: "4-8分钟" },
  { level: "Deep", name: "深度阅读", minutes: "9-20分钟" },
];

// ---------- 七层信息架构 ----------
export interface LayerSpec {
  layer: string;
  page: string;
  spec: string;
}

export const LAYERS: LayerSpec[] = [
  { layer: "Layer 0", page: "知识库首页", spec: "搜索、为你推荐、16领域、按我现在需要什么入口、小酷导览" },
  { layer: "Layer 1", page: "领域页", spec: "领域说明、子议题地图、热门场景、内容形式筛选" },
  { layer: "Layer 2", page: "议题页", spec: "具体议题、用户问题、不同场景、不同角色/处境视角" },
  { layer: "Layer 3", page: "场景/目的页", spec: "例如我想设边界：科普/练习/话术/故事/理论" },
  { layer: "Layer 4", page: "内容形式页", spec: "按24种形式筛选，支持轻/中/深阅读负荷" },
  { layer: "Layer 5", page: "内容预览页", spec: "标题、副标题、适合谁、阅读时间、你会得到什么" },
  { layer: "Layer 6", page: "完整版内容页", spec: "完整图文/互动/练习/工具+小酷Dock+相关推荐" },
];

// ---------- 可见性分级 ----------
export const VISIBILITY = {
  PUBLIC_READY: "public_ready",
  PUBLIC_REWRITE_REQUIRED: "public_rewrite_required",
  INTERNAL_ONLY: "internal_only",
  RESTRICTED_SENSITIVE: "restricted_sensitive",
  UNKNOWN: "unknown",
} as const;

export type Visibility = typeof VISIBILITY[keyof typeof VISIBILITY];

// ---------- 小酷Dock动作类型 ----------
export type XiaokuAction = "chat" | "exercise" | "assessment" | "treehole" | "theory" | "resources";

// ---------- 查找辅助函数 ----------
export function getDomain(id: string): Domain | undefined {
  return DOMAINS.find((d) => d.id === id);
}

export function getScenario(id: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}

export function getPurpose(id: string): Purpose | undefined {
  return PURPOSES.find((p) => p.id === id);
}

export function getContentType(id: string): ContentType | undefined {
  return CONTENT_TYPES.find((c) => c.id === id);
}

export function getUserProfile(id: string): UserProfile | undefined {
  return USER_PROFILES.find((u) => u.id === id);
}
