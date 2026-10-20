/**
 * 叙述视角识别模块
 * 用于区分：第一人称自陈、第三人称个案讨论、亲友代问
 */

export type NarrativePerspective = "self" | "professional" | "friend_family" | "unclear";

// 专业身份关键词
const PROFESSIONAL_KEYWORDS = [
  "我是咨询师", "我是心理师", "我是社工", "我是精神科医生", "我是心理学学生",
  "我是治疗师", "我是心理咨询师", "我是心理治疗师",
  "我的来访", "我的个案", "我的学生", "我的案主", "我的病人",
  "我的个案", "我的当事人",
  "在带一个个案", "在做一个个案", "接了一个个案",
  "想讨论", "想请教", "想咨询", "想聊聊个案",
  "C-SSRS", "PHQ-9", "GAD-7", "SCL-90",
  "评估量表", "临床工具", "干预思路", "个案概念化",
];

// 亲友代问/第三人称施救关键词（G1：统一入口，不再按关系词分叉）
const FRIEND_FAMILY_KEYWORDS = [
  // 亲友关系
  "我孩子", "我儿子", "我女儿", "我朋友", "我闺蜜", "我家人",
  "我对象", "我男朋友", "我女朋友", "我老公", "我老婆",
  "我伴侣", "我配偶", "我兄弟", "我姐妹",
  "我身边有个人", "我认识一个人", "我有一个朋友",
  // G1：同学/室友/学生/老师/同事/网友等第三人称信号
  "我同学", "我室友", "我舍友", "我同事", "我网友", "我群友",
  "我邻居", "我身边的人",
  "同学", "室友", "舍友", "同事", "网友", "群友", "邻居",
  "学生", "老师", "班里", "班级", "学生群", "班级群",
  "群里", "朋友圈", "微博", "动态",
  // 第三人称危机信号
  "他不想活", "她想自杀", "他有自伤", "她有抑郁",
  "他说不想活", "她说不想活", "他说要自杀", "她说要自杀",
  "他轻生", "她轻生", "他要轻生", "她要轻生",
  "我该怎么劝", "我该怎么办", "我怎么帮他", "我怎么帮她",
  "我该怎么救他", "我该怎么救她", "我该怎么帮他", "我该怎么帮她",
  // 出柜/性别认同（亲友代问场景）
  "出柜", "跨性别", "性取向", "性别认同",
];

// 第一人称自陈关键词（危机信号）
const SELF_KEYWORDS = [
  "我想死", "我不想活", "我想自杀", "我想自伤", "我想割自己",
  "我撑不下去", "我扛不住", "我好累", "我很痛苦",
  "我没有意义", "我是负担", "我是累赘",
  // 负担感/消失愿望族（第一人称）
  "我走了", "我消失", "我没了", "我不在了", "没有我",
  "我觉得没有我", "我应该会轻松", "他们应该会轻松",
];

export function detectNarrativePerspective(text: string): NarrativePerspective {
  const lowerText = text.toLowerCase();

  // 检查专业身份
  const isProfessional = PROFESSIONAL_KEYWORDS.some((keyword) =>
    lowerText.includes(keyword.toLowerCase()),
  );

  // 检查亲友代问
  const isFriendFamily = FRIEND_FAMILY_KEYWORDS.some((keyword) =>
    lowerText.includes(keyword.toLowerCase()),
  );

  // 检查第一人称自陈
  const isSelf = SELF_KEYWORDS.some((keyword) =>
    lowerText.includes(keyword.toLowerCase()),
  );

  // 优先级：第一人称自陈 > 专业身份 > 亲友代问
  if (isSelf) return "self";
  if (isProfessional) return "professional";
  if (isFriendFamily) return "friend_family";

  // 如果同时出现专业和亲友信号，需要进一步判断
  // 默认返回 unclear，由闸门处理
  return "unclear";
}

export function shouldTriggerPerspectiveGate(
  text: string,
  hasCrisisSignal: boolean,
): boolean {
  // 只有在有危机/高敏信号且视角不清时才触发闸门
  if (!hasCrisisSignal) return false;

  const perspective = detectNarrativePerspective(text);
  // 第一人称自陈直接走危机流程，不需要闸门
  if (perspective === "self") return false;
  // 专业或亲友视角，或视角不清时，触发闸门
  return perspective === "professional" || perspective === "friend_family" || perspective === "unclear";
}

export const PERSPECTIVE_GATE_QUESTION = `你现在说的是——

A. 我自己的情况
B. 我担心的亲友/朋友/家人
C. 我是专业人士（咨询师/社工/医生/老师等），在讨论工作中的个案

请回复 A、B 或 C，我会用更合适的方式陪你。`;
