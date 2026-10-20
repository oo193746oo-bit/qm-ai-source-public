/**
 * QM知识库 - 专业边界安全层 (QA05)
 * 8类高风险主题的安全提示规则
 * 安全提示在文章页顶部以SafetyCard展示，不向用户展示内部规则文本
 */

export interface SafetyRule {
  id: string;
  category: string;
  title: string;
  message: string;  // 用户可见的安全提示
  match_domains: string[];  // 匹配的知识库域
  match_keywords: string[];  // 匹配关键词（标题/正文）
}

export const SAFETY_RULES: SafetyRule[] = [
  // A 创伤/CPTSD
  {
    id: "SAFETY_TRAUMA",
    category: "trauma",
    title: "关于创伤话题",
    message: "如果你正在经历创伤记忆的闪回或强烈情绪反应，请先确保自己处于安全环境中。本文提供的是科普信息和自我调节方法，不替代专业创伤治疗。如果情绪难以承受，可以随时联系我们。",
    match_domains: ["D10"],
    match_keywords: ["创伤", "CPTSD", "PTSD", "闪回", "触发", "trigger", "解离", "惊恐"],
  },
  // B ADHD/神经多样性
  {
    id: "SAFETY_NEURODIVERSITY",
    category: "adhd",
    title: "关于ADHD与神经多样性",
    message: "本文提供的信息用于自我了解，不能作为诊断依据。ADHD等神经发展差异的诊断需要由专业医生进行完整评估。如果你怀疑自己有相关困扰，建议寻求专业医疗评估。",
    match_domains: ["D10"],
    match_keywords: ["ADHD", "注意力", "执行功能", "神经多样性", "多动"],
  },
  // C 进食/身体
  {
    id: "SAFETY_EATING",
    category: "eating",
    title: "关于进食与身体形象",
    message: "如果你正在经历进食方面的困扰，请知道你不需要独自面对。本文不提供任何减重方案、热量指导或催吐相关信息。进食困扰通常需要多学科专业支持，建议尽早寻求帮助。",
    match_domains: ["D10", "D01"],
    match_keywords: ["进食", "暴食", "厌食", "催吐", "身体形象", "体重", "节食"],
  },
  // D NPD/第三方诊断
  {
    id: "SAFETY_NPD",
    category: "npd",
    title: "关于人格障碍话题",
    message: "人格障碍是需要由专业心理师或精神科医生进行临床诊断的状况。本文描述的是行为模式和关系动力，不是对任何个人的诊断标签。如果你在关系中感到困扰，我们可以一起讨论发生了什么。",
    match_domains: ["D02", "D10"],
    match_keywords: ["NPD", "自恋", "人格障碍", "煤气灯", "PUA", "操控"],
  },
  // E LGBTQ+
  {
    id: "SAFETY_LGBTQ",
    category: "lgbtq",
    title: "关于性别与性向话题",
    message: "每个人的身份探索节奏都不同，没有唯一正确的方式。如果你正在经历身份相关的困惑或压力，QM提供安全、友善、不评判的空间。出柜与否、何时出柜，决定权在你。",
    match_domains: ["D05", "D06"],
    match_keywords: ["跨性别", "非二元", "出柜", "性别焦虑", "性取向", "酷儿", "过渡"],
  },
  // F 性健康/Consent
  {
    id: "SAFETY_CONSENT",
    category: "consent",
    title: "关于亲密关系与同意",
    message: "健康的亲密关系建立在尊重和知情同意之上。同意必须是自愿、具体、知情、持续且可以随时撤回的。沉默、醉酒或恐惧下的顺从不等于同意。如果你在关系中感到不安全，请寻求支持。",
    match_domains: ["D02", "D06"],
    match_keywords: ["同意", "consent", "性", "亲密", "开放式关系", "边界"],
  },
  // G 医疗
  {
    id: "SAFETY_MEDICAL",
    category: "medical",
    title: "关于身心症状",
    message: "本文提供的是心理科普信息，不能替代医疗诊断。如果你正在经历胸闷、心悸、持续疼痛、睡眠障碍等身体症状，建议先进行医学检查排除身体疾病。心理与身体常常相互影响。",
    match_domains: ["D10", "D01"],
    match_keywords: ["惊恐", "心悸", "胸闷", "睡眠", "疲惫", "身体症状", "药物"],
  },
  // H 危机/自伤
  {
    id: "SAFETY_CRISIS",
    category: "crisis",
    title: "如果你正在经历危机",
    message: "如果你正在经历自伤或自杀的念头，请立刻联系一个你信任的人，或拨打QM心理支持热线 15001930070 / 13601658763。你不需要独自面对这些感受，我们在这里。",
    match_domains: ["D01", "D10"],
    match_keywords: ["自伤", "自杀", "轻生", "危机", "伤害自己", "不想活"],
  },
];

/**
 * 检测文章是否需要安全卡，返回匹配的规则（可能多条）
 * 按匹配关键词数量排序，最多返回2条
 */
export function detectSafetyNeeds(
  domain: string,
  title: string,
  body: string
): SafetyRule[] {
  const matched: { rule: SafetyRule; relevance: number }[] = [];
  const text = (title + " " + body).toLowerCase();

  for (const rule of SAFETY_RULES) {
    const domainMatch = rule.match_domains.includes(domain);
    if (!domainMatch) continue;

    // 计算关键词匹配数量作为相关度
    let relevance = 0;
    for (const kw of rule.match_keywords) {
      if (text.includes(kw.toLowerCase())) {
        relevance++;
      }
    }

    if (relevance > 0) {
      matched.push({ rule, relevance });
    }
  }

  // 按相关度降序，去重category，最多返回2条
  const seenCategories = new Set<string>();
  return matched
    .sort((a, b) => b.relevance - a.relevance)
    .filter((item) => {
      if (seenCategories.has(item.rule.category)) return false;
      seenCategories.add(item.rule.category);
      return true;
    })
    .slice(0, 2)
    .map((item) => item.rule);
}
