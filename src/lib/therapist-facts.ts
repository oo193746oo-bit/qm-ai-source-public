/**
 * 小雪反幻觉 · 确定性事实注入模块（仅服务端使用）
 *
 * 职责：
 * 1. 从 THERAPISTS 数据源生成精简的事实文本，注入 system prompt
 * 2. 提供姓名白名单验证，用于输出后扫描
 * 3. 提供基于用户消息的候选预筛选（代码侧确定性筛选，LLM 只负责解释）
 * 4. 统一术语：用"心理师"而非"咨询师"
 *
 * 安全：禁止在 'use client' 组件中 import
 *
 * 2026-08-29 Lumen 修复：引号污染脚本曾把本文件中的字符串分隔符
 * 错误转换（英文引号→中文弯引号、空三元、空数组关键词），导致构建失败
 * 与意图识别失效。本版重写受影响的四个集合与两个函数，语法与逻辑一并修复。
 */

import { THERAPISTS, PRICE_REGISTRY } from "./booking/data";
import type { Therapist } from "./booking/types";

// ============================================================
// 〇、数据加载健康检查（fail-closed）
// ============================================================

export interface TherapistDataHealth {
  loaded: boolean;
  count: number;
  expectedCount: number;
  idsUnique: boolean;
  pricingComplete: boolean;
  dataVersion: string;
}

const DATA_VERSION = "THERAPISTS_REGISTRY_v4.0_24P";
const EXPECTED_THERAPIST_COUNT = 24;

/**
 * S3 去推荐化开关：检查期设为 true，小雪不主动推荐心理师卡片
 * Lara 09-11 01:14 拍板：网信办检查期间不推卡片
 * 解除条件：Lara 明确解除后改回 false
 */
export const XIAOXUE_NO_RECOMMEND = true;

export function checkTherapistDataHealth(): TherapistDataHealth {
  const therapists = THERAPISTS.filter((t) => t.role === "心理师");
  const names = therapists.map((t) => t.name);
  const uniqueNames = new Set(names);
  const pricingTiers = Object.keys(PRICE_REGISTRY);
  return {
    loaded: therapists.length > 0,
    count: therapists.length,
    expectedCount: EXPECTED_THERAPIST_COUNT,
    idsUnique: uniqueNames.size === names.length,
    pricingComplete: pricingTiers.length >= 3,
    dataVersion: DATA_VERSION,
  };
}

// ============================================================
// 一、心理师事实文本生成
// ============================================================

/**
 * v11.0 去推荐化：不再注入24人逐条档案，只返回简短说明。
 * 数据数组保留在 data.ts 中，安全网（detectFabricatedNames）仍使用。
 */
export function buildTherapistsFactBlock(): string {
  const noRecommendNote = XIAOXUE_NO_RECOMMEND
    ? "【当前阶段】禁止主动推荐任何心理师，用户明确要求推荐时也引导联系人工客服。"
    : "";
  return [
    "<therapists_data>",
    "QM 有不同价位（400-1500元/小时）和擅长方向的心理师。小雪不点名推荐具体人选。",
    "用户想找心理师时：收集需求（困扰方向/预算/时间/形式偏好），完成后告知团队人工匹配。",
    "用户主动提到心理师名字时：记录为偏好，不确认/否认/补充其背景，引导联系人工客服。",
    noRecommendNote,
    "</therapists_data>",
  ].join("\n");
}

// ============================================================
// 二、价格事实文本
// ============================================================

export function buildPricingFactBlock(): string {
  // v11.0 去推荐化后价格档以公开口径为准（400-1500元/小时），
  // 不再逐条展开 PRICE_REGISTRY，避免数据字段变动导致注入格式错误。
  return [
    "<pricing_data>",
    "以下是QM公开收费标准。回答费用问题时必须使用这些数据，禁止编造价格。",
    "称呼统一用「心理师」，不要使用「咨询师」。",
    "个体咨询费用区间为 400-1500 元/小时，具体价位以心理师个人资料和预约时确认为准。",
    "用户询问具体价格时，引导联系人工客服或在预约流程中查看，不要自行报价具体数字。",
    "</pricing_data>",
  ].join("\n");
}

// ============================================================
// 二-B、价格规则文本（与 pricing_data 互补：一个管数字，一个管规则）
// ============================================================

export function buildPricingRulesBlock(): string {
  return [
    "<pricing_rules>",
    "以下是价格计算规则与边界条款，回答费用问题时与 <pricing_data> 配合使用。",
    "",
    "【核心计算规则（最高优先级，逐条遵守）】",
    "1. 90 分钟价 = 60 分钟标准单价 × 1.5。例：600→900、500→750、400→600，禁止算错。",
    "2. 首次体验价只按【等级】查，与单价档无关：成熟级 299/499、资深级 599/799、专家级 1200/1800（60/90 分钟）。禁止用单价打折算首次价。",
    "3. 会员次卡 = 标准单价 × 小时数 × 折扣（5小时=95折，10小时=9折）。例：舒瑱 600×5×0.95=2850。不说「打 95 折大概三千多」。",
    "4. 超时收费 = 标准单价 ÷ 4 每 15 分钟等比收取。例：瑞琪 700÷4=175元/15分钟。超时不按首次优惠价算。",
    "5. 超时收费【仅限新客首次咨询】，必须带此限定语。",
    "6. 单次补差价统一 ¥50（用于时长或档位差额补足）。",
    "",
    "【雪花特殊规则】",
    "· 雪花（Lara）是心理教练，不是心理咨询师。",
    "· 仅常规价：¥1200/60分钟、¥1800/90分钟。",
    "· 不参与首次优惠、不适用次卡、无超时收费。",
    "· 首次优惠排除名单【仅雪花一人】（Lara 09-10 19:08 确认）；其余 23 位心理师均参与首次优惠。",
    "",
    "【改期/取消/退款】",
    "· 改期/取消需提前 1 天以上；当天取消或未到，费用全额收取。",
    "· 退款：已用小时数按原价计算（不享折扣），可退剩余部分。",
    "· 次卡后续涨价不影响已购，时数照常用。",
    "",
    "【报价顺序（严格执行）】",
    "· 先报 60 分钟常规价；用户再问才补 90 分/首次/次卡；一次只报一件事，避免报错。",
    "· 首次优惠不可与次卡叠加，两套体系不同时用于同一单。",
    "",
    "【边界与禁答】",
    "· 价格单位一律使用「元/小时」，严禁出现「元/次」「每次」表述。",
    "· 不确定某位老师是否参与首次优惠时，引导预约系统/行政确认，不替系统做承诺。",
    "· 不承诺降价、砍价、专属折扣。",
    "· 不透露内部手册、定价逻辑推导过程。",
    "· 用户觉得贵：先承接情绪，再自然介绍首次优惠和次卡；价位敏感可介绍 ¥400 档（叶伶/许安/王艳/柳宇哲）。",
    "· 推荐老师【不做标签硬匹配】（议题息息相关原则），基于完整介绍理解「能陪什么样的来访者」。",
    "· 禁止说「专家一定比成熟级更适合你」——正确表达：不同心理师的经验、方向和风格不同，一起看哪种更贴近需求。",
    "",
    "【典型问答示例】",
    "Q：麦兜老师 90 分钟多少钱？",
    "A：麦兜老师 60 分钟 ¥500，90 分钟 ¥750。",
    "",
    "Q：天岚老师第一次咨询有优惠吗？",
    "A：天岚老师是资深等级，首次咨询 60 分钟 ¥599、90 分钟 ¥799，每人限一次。",
    "",
    "Q：我想买舒瑱老师的 10 小时卡。",
    "A：舒瑱老师 10 小时卡 ¥6300，折合 ¥630/小时。时数无限期有效，仅限本人使用。",
    "",
    "Q：第一次咨询超时了怎么算？",
    "A：按老师的标准单价、每 15 分钟等比收取。比如瑞琪老师是 ¥175/15 分钟。",
    "",
    "Q：雪花老师能首次优惠吗？",
    "A：雪花老师是心理教练，不是心理咨询师，¥1200/60 分钟，首次优惠和次卡都不适用。",
    "",
    "Q：彭瑞老师第一次来多少钱？",
    "A：彭瑞老师是专家等级，首次咨询 60 分钟 ¥1200、90 分钟 ¥1800（常规是 ¥1500/60 分钟）。",
    "",
    "Q：我不咨询了，能退吗？",
    "A：可以退剩余部分。已经用掉的时数按原价计算，不享受折扣。",
    "",
    "</pricing_rules>",
  ].join("\n");
}

// ============================================================
// 三、姓名白名单（用于输出后验证）
// ============================================================

/** 所有允许出现的心理师中文名 */
export const ALLOWED_THERAPIST_NAMES: string[] = THERAPISTS.map((t) => t.name);

/** 所有允许出现的心理师英文名 */
export const ALLOWED_THERAPIST_NAMES_EN: string[] = THERAPISTS.map((t) => t.name_en);

/**
 * 检测输出文本中是否包含不在白名单中的疑似心理师姓名
 *
 * 策略：
 * 1. 主要检测"姓名+称谓"模式，其中姓名前面必须是边界（标点/空格/句首/常见动词）
 * 2. 提取姓名后与白名单比对
 * 3. 对"心理咨询师"这个固定职业词不做幻觉判定（由术语统一处理）
 *
 * 边界字符：句首、空格、标点、常见动词（找/选/是/有/和/跟/给/向/帮/为/让/叫/请/推荐/介绍）
 *
 * @returns 检测到的违规姓名片段列表
 */
export function detectFabricatedNames(text: string): string[] {
  if (!text || typeof text !== "string") return [];

  // 先保护"心理咨询师"国家职业资格名，避免"心理师"被拆成单字姓名误判
  const PROTECTED = "\u0000PROT_ZIXUNSHI\u0000";
  text = text.replace(/心理咨询师/g, PROTECTED);

  const fabricated: string[] = [];

  // 通用/泛指词，不算编造
  const GENERIC_WORDS = new Set<string>([
    "心理", "咨询", "这位", "那位", "你的", "我的", "该", "此", "那", "这",
    "任何", "每位", "各位", "其他", "某", "有的", "有些", "相关", "专业",
    "QM", "一位", "一", "哪个", "某位", "找个", "找一", "个", "位",
    // 单字高频动词/形容词/助词，2字扫描时极易把普通词切成"姓名"
    "多", "少", "好", "的", "和", "与", "及", "或", "在",
    "把", "被", "让", "给", "向", "从", "对", "为", "等",
    "哪", "每", "各", "其", "本", "些", "种", "类", "找", "选",
    "看", "问", "帮", "叫", "请", "如", "像", "更", "最", "很", "也", "都",
    "还", "就", "才", "只", "名", "按", "照", "要", "会", "能", "可",
    "到", "来", "去", "说", "想", "是", "有", "了",
    // 双字泛指/词组
    "多位", "很多", "许多", "不少", "大量", "大批", "若干", "一些",
    "多数", "少数", "按照", "一个", "几个", "两名", "三位", "这个", "那个",
  ]);

  // 姓名前面允许的"边界"字符（标点/空白/英文数字/常见引导动词）
  const BOUNDARY_CHARS = new Set<string>([
    " ", "\t", "\n", "，", "。", "、", "；", "：", "？", "！",
    ",", ":", ";", "?", "!", "（", "）", "(", ")", "[", "]",
    "【", "】", "'", "\u201c", "\u201d", "\u2018", "\u2019", "\u2026", "\u2014", "-", "\u00b7", "/",
  ]);
  const BOUNDARY_VERBS = new Set<string>([
    "找", "选", "是", "有", "和", "跟", "给", "向", "帮", "为",
    "让", "叫", "请", "看", "问", "像", "如", "与", "了", "把",
  ]);
  const BOUNDARY_TWOCHARS = new Set<string>([
    "推荐", "介绍", "比如", "例如", "觉得", "认为", "想看", "想找",
    "那位", "这位", "有位", "有个", "我是", "你是",
  ]);

  function isAtBoundary(idx: number): boolean {
    if (idx === 0) return true;
    const before = text[idx - 1];
    if (BOUNDARY_CHARS.has(before)) return true;
    if (/[0-9a-zA-Z]/.test(before)) return true;
    if (BOUNDARY_VERBS.has(before)) return true;
    if (idx >= 2 && BOUNDARY_TWOCHARS.has(text.slice(idx - 2, idx))) return true;
    return false;
  }

  // 中文心理师姓名为 2-3 字（白名单内无单字姓名）。
  // 不扫描 1 字"姓名"：单字+称谓在正常句子里大量出现（"很多心理师""找心理师"），误报率不可接受。
  const found: { name: string; title: string; start: number; end: number }[] = [];

  for (let nameLen = 3; nameLen >= 2; nameLen--) {
    for (const title of ["心理师", "咨询师", "治疗师", "顾问", "老师"]) {
      const re = new RegExp(`([\\u4e00-\\u9fa5]{${nameLen}})${title}`, "g");
      let m: RegExpExecArray | null;
      while ((m = re.exec(text)) !== null) {
        const start = m.index;
        const prefix = m[1];
        const end = start + nameLen + title.length;

        // 如果已被更长的匹配覆盖，跳过
        if (found.some((f) => start >= f.start && end <= f.end)) continue;

        if (GENERIC_WORDS.has(prefix)) continue;
        if (prefix.includes("心理") || prefix.includes("咨询")) continue;
        if (!isAtBoundary(start)) continue;

        // v10.4: 白名单严格完整匹配，不再使用 includes 子串匹配（防止编造姓名漏过）
        const isAllowed =
          ALLOWED_THERAPIST_NAMES.includes(prefix) ||
          ALLOWED_THERAPIST_NAMES_EN.includes(prefix);

        if (!isAllowed) {
          found.push({ name: prefix, title, start, end });
        }
      }
    }
  }

  for (const f of found) {
    const full = f.name + f.title;
    if (!fabricated.includes(full)) {
      fabricated.push(full);
    }
  }

  return fabricated;
}

/**
 * 术语统一：把输出中的"咨询师"替换为"心理师"
 * 注意：
 * - "心理咨询师" 是国家职业资格的正式名称，保留不动（如"国家二级心理咨询师"）
 * - 其余"咨询师"统一替换为"心理师"
 */
export function normalizeTerminology(text: string): string {
  if (!text) return text;
  // 先保护"心理咨询师"，替换为占位符
  const PROTECTED = "\u0000PROTECTED_XINLI_ZIXUNSHI\u0000";
  return text
    .replace(/心理咨询师/g, PROTECTED)
    .replace(/咨询师/g, "心理师")
    .replace(new RegExp(PROTECTED, "g"), "心理咨询师");
}

// ============================================================
// 四、基于用户消息的候选预筛选
// ============================================================

export interface CandidateResult {
  therapists: Therapist[];
  intentHint: "COST" | "MATCH" | "NAMED" | "LOW_PRESSURE" | "GENERAL";
  namedTherapist?: Therapist;
  zeroCandidates: boolean;
}

/**
 * 从用户消息中检测意图并预筛选候选心理师
 * 这是代码侧的确定性筛选，LLM 拿到候选后只能解释，不能自己编人
 */
export function preselectCandidates(userMessage: string): CandidateResult {
  const text = userMessage.trim();

  // 1. 指定心理师意图（中文名精确匹配 → 英文名精确匹配）
  for (const t of THERAPISTS) {
    if (text.includes(t.name)) {
      return { therapists: [t], intentHint: "NAMED", namedTherapist: t, zeroCandidates: false };
    }
  }
  for (const t of THERAPISTS) {
    if (
      t.name_en.length >= 3 &&
      text.toLowerCase().includes(t.name_en.toLowerCase())
    ) {
      return { therapists: [t], intentHint: "NAMED", namedTherapist: t, zeroCandidates: false };
    }
  }

  // 2. 费用意图（不筛选人，只标记）
  const feeKeywords = [
    "多少钱", "费用", "收费", "价格", "怎么收费", "收费标准",
    "贵不贵", "价位", "价钱", "咨询费", "一次多少", "小时费",
    "付费", "付款", "怎么付", "便宜", "优惠", "折扣",
  ];
  if (feeKeywords.some((kw) => text.includes(kw))) {
    return { therapists: [], intentHint: "COST", zeroCandidates: false };
  }

  // 3. 低压力意图（只是了解、犹豫期，不直接筛人）
  const lowKeywords = [
    "流程", "怎么咨询", "怎么开始", "第一次", "没咨询过",
    "有用吗", "有效吗", "靠谱吗", "正规吗", "保密",
    "线上还是线下", "视频", "面询", "时长", "多久一次",
    "需要准备", "不好意思", "犹豫", "考虑",
  ];
  if (lowKeywords.some((kw) => text.includes(kw))) {
    return { therapists: [], intentHint: "LOW_PRESSURE", zeroCandidates: false };
  }

  // 4. 找心理师 / 推荐意图 → 按议题关键词筛选
  // 必须明确指向“心理师/人选/推荐”，避免“有没有优惠”“介绍一下流程”被误判为推荐。
  const matchKeywords = [
    "推荐心理师", "推荐咨询师", "找心理师", "找咨询师", "找老师",
    "哪位心理师", "哪位咨询师", "哪个心理师", "哪个咨询师",
    "适合的心理师", "合适的心理师", "匹配", "安排心理师",
    "想做咨询", "要咨询", "约咨询", "预约心理师", "预约咨询师",
    "心理咨询", "想找个", "帮我找", "给我推荐",
  ];
  const wantsMatch = matchKeywords.some((kw) => text.includes(kw));

  if (wantsMatch) {
    // S3 检查期：直接走零候选，不筛选不推荐
    if (XIAOXUE_NO_RECOMMEND) {
      return { therapists: [], intentHint: "MATCH", zeroCandidates: true };
    }
    const candidates = filterByTopics(text);
    if (candidates.length === 0) {
      return { therapists: [], intentHint: "MATCH", zeroCandidates: true };
    }
    return {
      therapists: candidates.slice(0, 3),
      intentHint: "MATCH",
      zeroCandidates: false,
    };
  }

  return { therapists: [], intentHint: "GENERAL", zeroCandidates: false };
}

/**
 * 根据用户消息中的议题关键词筛选心理师
 */
function filterByTopics(text: string): Therapist[] {
  const topicAreas: { keywords: string[]; areaMatch: string[] }[] = [
    {
      keywords: ["焦虑", "压力", "抑郁", "低落", "惊恐", "情绪"],
      areaMatch: ["抑郁焦虑", "情绪问题", "情绪管理", "情绪困境", "情绪障碍", "惊恐症状"],
    },
    {
      keywords: ["恋爱", "感情", "亲密", "分手", "失恋", "伴侣"],
      areaMatch: ["情感恋爱", "亲密关系", "婚恋情感", "多元伴侣", "失恋分手"],
    },
    {
      keywords: ["家庭", "父母", "原生"],
      areaMatch: ["婚姻家庭", "亲子关系", "原生家庭"],
    },
    {
      keywords: ["职场", "工作", "职业", "拖延"],
      areaMatch: ["职场课题", "职业发展", "职场发展", "职业转型", "拖延动力"],
    },
    {
      keywords: ["创伤", "阴影", "PTSD"],
      areaMatch: ["心理创伤", "性之创伤"],
    },
    {
      keywords: ["ADHD", "注意力", "多动"],
      areaMatch: ["ADHD多动议题", "ADHD"],
    },
    {
      keywords: ["LGBT", "同性恋", "出柜", "性别", "酷儿", "跨性别", "多元性别"],
      areaMatch: ["LGBTQ+", "性别多元", "性别多元LGBTQ+"],
    },
    {
      keywords: ["身份", "认同", "自我探索", "迷茫", "自我成长"],
      areaMatch: ["身份认同", "自我认同", "自我成长", "自我探索", "个人成长"],
    },
    {
      keywords: ["进食", "饮食", "减肥", "身材", "容貌", "暴食", "厌食"],
      areaMatch: ["进食障碍", "容貌焦虑", "减肥教练", "营养咨询"],
    },
    {
      keywords: ["失眠", "睡眠"],
      areaMatch: ["睡眠障碍", "失眠障碍"],
    },
    {
      keywords: ["婚姻"],
      areaMatch: ["婚姻家庭"],
    },
    {
      keywords: ["孩子", "儿童", "青少年", "亲子"],
      areaMatch: ["青少年儿童", "亲子教育", "儿童心理", "亲子关系"],
    },
    {
      keywords: ["海外", "留学", "跨文化", "移民"],
      areaMatch: ["海外华人", "文化适应", "海外学生"],
    },
    {
      keywords: ["人际", "社交"],
      areaMatch: ["人际关系", "人际困扰", "社交障碍"],
    },
  ];

  const matchedAreas = new Set<string>();
  for (const topic of topicAreas) {
    if (topic.keywords.some((kw) => text.includes(kw))) {
      for (const area of topic.areaMatch) {
        matchedAreas.add(area);
      }
    }
  }

  if (matchedAreas.size === 0) {
    // 没有明确议题，返回前3位默认展示
    return THERAPISTS.filter((t) => t.role === "心理师").slice(0, 3);
  }

  // 按匹配的领域数量排序，取前3
  const scored = THERAPISTS.filter((t) => t.role === "心理师").map((t) => ({
    therapist: t,
    score: t.areas.filter((a) =>
      Array.from(matchedAreas).some((ma) => a.includes(ma) || ma.includes(a)),
    ).length,
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.filter((s) => s.score > 0).slice(0, 3).map((s) => s.therapist);
}

/**
 * 将候选心理师生成为注入 prompt 的文本块
 */
export function buildCandidatesBlock(candidates: Therapist[]): string {
  if (candidates.length === 0) return "";

  const lines = [
    "<recommended_candidates>",
    "以下是系统根据用户需求从确定性数据源预筛选的心理师候选。你只能从这些候选中选择介绍，禁止添加名单外的任何人。每位候选的背景/认证是该位专属，介绍时必须逐字对应，禁止跨人拼接或把别人的学历/医院/认证安到她身上。不排名、不百分比、不「最好/唯一/成功率最高」。",
    "",
  ];

  for (const t of candidates) {
    const base = "· " + t.name + "（" + t.name_en + "）";
    lines.push(base);
    if (t.background) {
      lines.push("  背景：" + t.background);
    }
  }

  lines.push("");
  lines.push("</recommended_candidates>");
  return lines.join("\n");
}

/**
 * 零候选时的明确指令（fail-closed，禁止 LLM 编人）
 */
export function buildZeroCandidatesBlock(): string {
  return [
    "<zero_candidates>",
    "系统按当前条件没有筛到合适的心理师。",
    "你必须告诉用户：「按目前这些条件，我暂时没有从当前QM心理师资料里筛到足够合适的人选。我可以和您一起放宽一个条件，或者整理给人工继续确认。」",
    "禁止编造任何姓名来填补候选。",
    "</zero_candidates>",
  ].join("\n");
}
