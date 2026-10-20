// QM 情绪树洞 v2.1 - Safety Override
// 危机安全优先于文学性、长回信、理论分析和记忆召回
// 检测自伤/自杀/伤人意图关键词；危机时停止文学化回信，进入QM安全流程
// v2.1 批2变更（2026-09-21）：关键词族与全站统一清单（src/lib/crisis-detection.ts）对齐，
// 补齐计划暗示/告别/负担感/消失隐喻/繁体/英文各族；危机卡热线按拍板登记
// （99_项目总记录/危机回撤机制拍板登记_Lara_20260917.md）补 12355。除对齐外零自由发挥。

/**
 * 危机关键词分级
 * direct：明确的自伤/自杀计划或意图
 * indirect：间接的死亡愿望、绝望、撑不下去
 * harm_others：伤人/报复意图
 * 注意：每一项必须是独立字符串（普通引号分隔），绝不能整串反引号包裹，
 * 否则 text.includes 恒不命中，客户端危机检测将整体失效。
 */
const CRISIS_KEYWORDS = {
  direct: [
    "自杀", "想自杀", "不想活了", "活不下去了", "不想活下去",
    "结束生命", "了结自己", "一了百了", "去死", "我想死",
    "割腕", "跳楼", "吃安眠药", "上吊", "跳河", "烧炭",
    "楼顶", "天台", "跳下去", "想跳下去", "翻栏杆", "跨出去",
    "自伤", "自残", "伤害自己", "割自己", "划自己",
    "我不在了", "离开这个世界", "与世长辞",
    "死了算了", "不如死了算了", "想消失",
    // —— 以下与全站统一清单（crisis-detection.ts）对齐 ——
    // 原有补充族
    "不想活", "不活了", "想死了", "想去死", "杀了我", "打死我",
    // 计划暗示/行踪保密
    "想好要去哪里了", "地方不告诉你们", "想找个没人的地方", "安静地走",
    "明天去一个很远的地方", "可能不回来了", "具体地方不说",
    // 告别/愧疚
    "帮我和大家说声对不起", "拖累他们太久了", "跟每个人都好好道了别",
    "帮我把信交给我妈", "帮我把信交给家人",
    // 自我负担/无价值感
    "没有我他们会更好", "没有我他们会更轻松", "我是累赘", "有我没我都一样",
    "没人会注意到我", "我这种人不该被生下来",
    "我是负担", "拖后腿", "活着浪费", "不拖累", "不给你们添麻烦",
    "少我一个无所谓", "我消失了也没人发现",
    "没有我他们更轻松", "没有我他们会轻松", "没我他们更轻松",
    "我是所有人的负担", "我是大家的负担",
    "没有我他们会过得更好", "没有我他们过得更好", "没我他们会更好",
    "我拖累他们", "我只会添麻烦", "我只会添乱",
    "世界有没有我都一样", "有没有我都一样", "没有人会注意到我消失",
    "没人会注意到我消失", "我消失了就好了", "没人会在意我没了",
    "没有我他们会更好吧", "没有他们可能会过得更好",
    // 消失隐喻
    "对话框会不会记得我", "世界会不会记得我", "想睡过去不醒",
    "去很远的地方不回来",
    // 直白补充
    "不如去死", "死了比较好",
    // 繁体中文
    "自殺", "想死", "割腕", "跳樓",
    "撐不下去了", "扛不住了", "活著沒意思",
    "沒有我他們會更好", "沒有我他們會更輕鬆", "我是累贅", "有我都沒一樣",
    "沒人在意我", "就這樣消失", "誰也找不到我",
    // 英文
    "suicide", "kill myself", "want to die", "end my life", "end it all",
    "self-harm", "cut myself", "hurt myself", "jump off", "overdose",
    "don't want to live", "better off dead", "no reason to live",
  ],
  indirect: [
    "没什么好留恋的", "活着没意思", "活着好累", "活着没意义",
    "人生没有意义", "觉得没意思", "看不到希望", "没有希望了",
    "撑不下去了", "扛不住了", "坚持不下去了", "熬不下去了",
    "想解脱", "想一睡不醒", "想永远睡下去",
    "太痛苦了", "受不了了", "受够了", "熬不下去",
    "没有未来", "一片黑暗", "绝望了", "彻底绝望",
    "活着真没什么意思", "每天都一样",
    // —— 以下与全站统一清单（crisis-detection.ts）对齐 ——
    "不想再熬下去了",
    // 存在性绝望/耗竭
    "日复一日地熬", "不知道哪天是个头", "看不到头", "望不到头",
    "撑了很多年撑不住", "撑不动了", "就想好好休息了",
    "活着没什么意思", "活着没啥意思", "活着没有什么意思",
    "每天活得没意思", "生活没什么意思", "生活没啥意思", "活得没意思",
    "找不到活着的意义", "找不到活下去的意义", "不知道活着还有什么意义", "活着不知道为了什么",
    "活下去没有意义", "生活没有什么意义", "人生没什么意义", "生无可恋",
    "我看不到活着的意义", "看不到活着的意义", "觉得生活没意思", "感觉生活没意思",
    // 被动意念（不想醒来类）
    "不想醒来", "不想睡", "醒不来", "睡过去就不用醒", "不想看到明天的太阳",
    "不想看到明天", "日子什么时候是头", "什么时候是个头",
    // 繁体中文
    "沒什麼好留戀的", "活著好累", "想解脫",
    "活著好痛苦", "覺得活著沒意思", "好想就這樣消失",
    // 英文
    "tired of everything", "tired of living", "can't go on", "can't take it anymore",
    "no point in living", "nothing matters", "hopeless", "no hope",
    "want to disappear", "want to sleep forever", "want to fade away",
    "burden to everyone", "everyone would be better without me",
    "nobody would notice", "nobody cares if i'm gone",
  ],
  harm_others: [
    "想杀人", "杀了他", "杀了她", "杀了他们", "弄死",
    "同归于尽", "一起死", "报复社会", "砍人",
  ],
};

export interface CrisisDetectionResult {
  isCrisis: boolean;
  level: "direct" | "indirect" | "harm_others" | "none";
  matchedWords: string[];
}

/**
 * 检测文本中是否包含危机关键词
 */
export function detectCrisis(text: string): CrisisDetectionResult {
  if (!text || typeof text !== "string") {
    return { isCrisis: false, level: "none", matchedWords: [] };
  }

  const lowerText = text.toLowerCase();

  // 检查伤人意图（最高优先级）
  const harmMatches = CRISIS_KEYWORDS.harm_others.filter((word) =>
    lowerText.includes(word.toLowerCase()),
  );
  if (harmMatches.length > 0) {
    return { isCrisis: true, level: "harm_others", matchedWords: harmMatches };
  }

  // 检查直接自伤/自杀
  const directMatches = CRISIS_KEYWORDS.direct.filter((word) =>
    lowerText.includes(word.toLowerCase()),
  );
  if (directMatches.length > 0) {
    return { isCrisis: true, level: "direct", matchedWords: directMatches };
  }

  // 检查间接信号（需匹配 >=2 个才判定）
  const indirectMatches = CRISIS_KEYWORDS.indirect.filter((word) =>
    lowerText.includes(word.toLowerCase()),
  );
  if (indirectMatches.length >= 2) {
    return { isCrisis: true, level: "indirect", matchedWords: indirectMatches };
  }

  return { isCrisis: false, level: "none", matchedWords: [] };
}

/**
 * 危机回应文案
 * 热线统一口径（与 /api/chat 危机卡、小酷危机卡及拍板登记一致）：
 * 12356（全国 7×24）→ 12355（青少年）→ 15001930070（QM 24h）→ 13601658763（备用）→ 110/120（立即危险）
 * 微信客服 queermental2 不进 AI 自动话术（拍板 09-17）。
 */
export const CRISIS_RESPONSES = {
  direct: `小酷听到你说这些，非常担心你的安全。

如果你现在有立即伤害自己或他人的可能，请先拨打 110 或 120。

请立刻拨打心理援助热线：
📞 全国心理援助热线：12356（7×24 小时）
📞 青少年心理服务热线：12355
📞 QM 心理援助热线：15001930070（24 小时）
📞 备用热线：13601658763

如果你身边有人，请告诉他们你现在的感受，不要一个人待着。还有一件事想说：作为跨性别者或性少数，你的身份处境、家里和身边人的反应，都可能让这份沉重更重——这不是你的错。现在你的身体状态怎么样？有没有哪里不舒服需要先处理？`,

  indirect: `你说的这些听起来让人心疼。你最近是不是感觉特别沉重、特别累？

如果你觉得自己撑不住了，请一定记得：
📞 全国心理援助热线：12356（7×24 小时）
📞 青少年心理服务热线：12355
📞 QM 心理援助热线：15001930070（24 小时）
📞 备用热线：13601658763

你愿意多说说最近发生了什么吗？`,

  harm_others: `你说的这些让小酷非常担心。伤害别人或自己都不是解决问题的方式。

如果你现在有立即伤害自己或他人的可能，请先拨打 110 或 120。

请你现在立刻拨打心理援助热线：
📞 全国心理援助热线：12356（7×24 小时）
📞 青少年心理服务热线：12355
📞 QM 心理援助热线：15001930070（24 小时）
📞 备用热线：13601658763

你现在身边有人吗？能不能先找一个安全的地方待着？`,
};

/**
 * 获取安全流程回应
 */
export function getCrisisResponse(level: "direct" | "indirect" | "harm_others"): string {
  return CRISIS_RESPONSES[level] || CRISIS_RESPONSES.direct;
}

/**
 * 检查回信内容是否包含禁止内容（外部机构/诈骗号码）
 * 注：110/120 为统一危机热线口径中的一部分，不在禁止之列。
 */
export function validateSafetyContent(text: string): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // 禁止 400 开头的疑似诈骗号码
  if (/400[- ]?\d{3,4}[- ]?\d{3,4}/.test(text)) {
    issues.push("包含禁止的 400 号码");
  }

  // 禁止外部机构名（北京心理危机中心等非本方渠道）
  if (text.includes("北京心理危机") || text.includes("北京心理援助")) {
    issues.push("包含禁止提及的外部机构（北京心理危机中心）");
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * 对 AI 生成的回信做安全后处理
 * - 移除外部机构名 / 诈骗号码，替换为本方统一热线
 * - 保留 12356 / 12355 / 15001930070 / 13601658763 / 110 / 120（统一口径内号码不干扰）
 */
export function sanitizeLetterContent(text: string): string {
  let result = text;

  // 移除/替换 400 开头的疑似诈骗号码
  result = result.replace(/400[- ]?\d{3,4}[- ]?\d{3,4}/g, "12356");

  // 替换北京心理危机中心等外部机构名
  result = result.replace(/北京心理危机[^\s，。、]*研究中心?/g, "全国心理援助热线");
  result = result.replace(/北京心理援助[^\s，。、]*/g, "全国心理援助热线");

  return result;
}
