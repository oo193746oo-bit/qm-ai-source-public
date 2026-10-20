// QM 自助工具 v3.0 - 推荐引擎
// 语义匹配 30 + 状态匹配 20 + 目标匹配 15 + 时间匹配 10 + 难度匹配 10 + 历史帮助度 10 + 新颖度 5 = 100
// 安全门控是先决条件，不是权重

import { TOOL_REGISTRY, getToolById } from "./tool-registry";
import type { Tool, ToolRecommendation, QuickMatchAnswer } from "./types";
import {
  getToolSettings,
  recordToolRejection,
  isFavorite,
  getEvents,
} from "./storage";

export interface RecommendContext {
  // 用户当前的需求描述（来自聊天或Quick Match）
  need_text?: string;
  // 当前情绪/唤起强度 0-10
  intensity?: number;
  // 用户可用时间（分钟）
  available_time_min?: number;
  // 用户偏好方向：body(身体) / thought(想法) / relation(关系) / action(行动)
  preferred_direction?: "body" | "thought" | "relation" | "action" | "uncertain";
  // 用户目标
  user_goal?: string;
  // 意图类型：A倾诉 / B请求方法 / C想练习 / D高唤起稳定 / E不想被建议
  intent_type?: "A" | "B" | "C" | "D" | "E";
  // 是否可以闭眼/安静
  can_close_eyes?: boolean;
  // 引导风格偏好：direct(直接) / gentle(温柔)
  guidance_style?: "direct" | "gentle";
  // 明确不想做的类别
  excluded_category_ids?: string[];
  // 来源
  source?: "xiaoku" | "quick_match" | "library";
}

// 关键词到类别的映射（用于语义匹配）
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  C1: ["紧张", "焦虑", "心跳", "压力", "冲动", "愤怒", "上头", "慌", "稳", "呼吸"],
  C2: ["反刍", "想太多", "不真实", "漂浮", "闪回", "停不下来", "脑内", "走神", "注意力"],
  C3: ["想不开", "钻牛角", "非黑即白", "灾难化", "读心", "想法", "认知", "解释"],
  C4: ["自责", "自我攻击", "不够好", "自我批评", "自我慈悲", "内在", "原谅"],
  C5: ["睡", "失眠", "身体紧", "放松", "肌肉", "肩颈", "累", "疲惫", "睡前"],
  C6: ["关系", "边界", "吵架", "冲突", "沟通", "委屈", "别人", "朋友", "家人"],
  C7: ["没动力", "拖延", "迷茫", "决定", "选择", "行动", "目标", "价值", "不知道做什么"],
  C8: ["危险", "冲动", "伤害", "失控", "求助", "安全", "危机", "想不开", "自杀"],
};

// 方向到类别的映射
const DIRECTION_CATEGORIES: Record<string, string[]> = {
  body: ["C1", "C2", "C5"],
  thought: ["C3", "C4", "C2"],
  relation: ["C6", "C4"],
  action: ["C7", "C1"],
};

/**
 * 安全门控：如果有即时危险信号，直接返回安全类工具，不走普通推荐
 */
function safetyGateCheck(ctx: RecommendContext): boolean {
  const dangerKeywords = [ `自杀", "想死", "自伤", "伤害自己", "不想活", "活不下去"`, `跳楼", "割腕", "危险", "失控", "要疯了"`,
  ];
  const text = (ctx.need_text || "").toLowerCase();
  const hasDanger = dangerKeywords.some((k) => text.includes(k));
  const highIntensity = ctx.intensity !== undefined && ctx.intensity >= 9;
  return hasDanger || highIntensity;
}

/**
 * 计算语义匹配分（0-30）
 */
function calcSemanticFit(tool: Tool, ctx: RecommendContext): number {
  if (!ctx.need_text) return 15; // 中性分

  const text = ctx.need_text.toLowerCase();
  let score = 0;

  // 关键词匹配：工具的keywords和scenarios
  const toolKeywords = [...tool.keywords, ...tool.scenarios];
  const matches = toolKeywords.filter((k) =>
    text.includes(k.toLowerCase())
  ).length;
  score += Math.min(matches * 6, 20);

  // 类别关键词匹配
  const catKw = CATEGORY_KEYWORDS[tool.category_id] || [];
  const catMatches = catKw.filter((k) => text.includes(k)).length;
  score += Math.min(catMatches * 3, 10);

  return Math.min(score, 30);
}

/**
 * 计算状态匹配分（0-20）
 */
function calcStateFit(tool: Tool, ctx: RecommendContext): number {
  if (ctx.intensity === undefined) return 10;

  const intensity = ctx.intensity;

  // C1即时稳定：高强度匹配高
  if (tool.category_id === "C1") {
    return intensity >= 7 ? 20 : intensity >= 4 ? 12 : 5;
  }

  // C8安全求助：极高强度匹配高
  if (tool.category_id === "C8") {
    return intensity >= 9 ? 20 : intensity >= 7 ? 12 : 3;
  }

  // C5身体放松睡前：中低强度匹配高
  if (tool.category_id === "C5") {
    return intensity <= 4 ? 18 : intensity <= 6 ? 12 : 6;
  }

  // C3认知：中强度匹配
  if (tool.category_id === "C3") {
    return intensity >= 3 && intensity <= 7 ? 18 : 10;
  }

  // C4自我慈悲：中低强度
  if (tool.category_id === "C4") {
    return intensity >= 2 && intensity <= 6 ? 16 : 10;
  }

  // C7价值行动：低强度匹配
  if (tool.category_id === "C7") {
    return intensity <= 5 ? 16 : 8;
  }

  // C2接地：中高强度
  if (tool.category_id === "C2") {
    return intensity >= 4 && intensity <= 8 ? 16 : 10;
  }

  // C6关系：中强度
  if (tool.category_id === "C6") {
    return intensity >= 3 && intensity <= 7 ? 16 : 10;
  }

  return 10;
}

/**
 * 计算目标匹配分（0-15）
 */
function calcGoalFit(tool: Tool, ctx: RecommendContext): number {
  if (!ctx.preferred_direction || ctx.preferred_direction === "uncertain")
    return 8;

  const directionCats = DIRECTION_CATEGORIES[ctx.preferred_direction] || [];
  if (directionCats.includes(tool.category_id)) {
    return 15;
  }

  // 相邻类别给一半
  return 5;
}

/**
 * 计算时间匹配分（0-10）
 */
function calcTimeFit(tool: Tool, ctx: RecommendContext): number {
  if (!ctx.available_time_min) return 7;

  const available = ctx.available_time_min;
  const needed = tool.time_estimate_min;

  if (needed <= available) {
    // 时间充足
    if (needed >= available * 0.6) return 10; // 接近可用时间，匹配度高
    return 7; // 时间很充裕
  } else {
    // 时间不够
    const ratio = available / needed;
    return Math.floor(ratio * 6); // 最多6分
  }
}

/**
 * 计算难度匹配分（0-10）
 */
function calcDifficultyFit(tool: Tool, ctx: RecommendContext): number {
  // 高强度偏好低难度
  if (ctx.intensity !== undefined && ctx.intensity >= 7) {
    return tool.difficulty === 1 ? 10 : tool.difficulty === 2 ? 5 : 2;
  }

  // 低强度可以接受更高难度
  if (ctx.intensity !== undefined && ctx.intensity <= 3) {
    return tool.difficulty <= 2 ? 8 : 6;
  }

  // 中等强度：难度1和2都可以
  return tool.difficulty <= 2 ? 9 : 6;
}

/**
 * 计算历史帮助度（0-10）
 */
function calcHistoryHelpfulness(tool: Tool, _ctx: RecommendContext): number {
  const events = getEvents(tool.tool_id);
  const ratedEvents = events.filter(
    (e) => e.metrics?.helpfulness !== undefined
  );

  if (ratedEvents.length === 0) return 5; // 无历史，中性分

  const avgHelpfulness =
    ratedEvents.reduce((sum, e) => sum + (e.metrics?.helpfulness || 3), 0) /
    ratedEvents.length;

  // 1-5 映射到 0-10
  return Math.round(((avgHelpfulness - 1) / 4) * 10);
}

/**
 * 计算新颖度（0-5）
 */
function calcNovelty(tool: Tool, _ctx: RecommendContext): number {
  const events = getEvents(tool.tool_id);
  if (events.length === 0) return 5; // 没用过，新颖
  if (events.length === 1) return 3;
  if (events.length <= 3) return 2;
  return 1;
}

/**
 * 主推荐函数：返回 Top1 + 备选1
 * 不显示伪精确分数给用户
 */
export function recommendTools(
  ctx: RecommendContext,
  options?: { topN?: number }
): ToolRecommendation[] {
  const topN = options?.topN || 2;
  const settings = getToolSettings();

  // 如果用户明确不想被建议（intent_type E），返回空
  if (ctx.intent_type === "E" && ctx.source === "xiaoku") {
    return [];
  }

  // 如果用户关闭了工具推荐，且来源是小酷
  if (!settings.tool_recommendations_enabled && ctx.source === "xiaoku") {
    return [];
  }

  let candidates = [...TOOL_REGISTRY];

  // 排除用户明确不想做的类别
  if (ctx.excluded_category_ids && ctx.excluded_category_ids.length > 0) {
    candidates = candidates.filter(
      (t) => !ctx.excluded_category_ids!.includes(t.category_id)
    );
  }

  // 排除最近拒绝过的工具（降权而非完全排除）
  const recentlyRejected = new Set(settings.rejected_tool_ids.slice(-10));

  // 安全门控：如果有即时危险，只推荐安全类
  const isSafetyMode = safetyGateCheck(ctx);
  if (isSafetyMode) {
    candidates = candidates.filter((t) => t.category_id === "C8");
  }

  // 对每个候选工具评分
  const scored = candidates.map((tool) => {
    const semantic = calcSemanticFit(tool, ctx);
    const state = calcStateFit(tool, ctx);
    const goal = calcGoalFit(tool, ctx);
    const time = calcTimeFit(tool, ctx);
    const difficulty = calcDifficultyFit(tool, ctx);
    const history = calcHistoryHelpfulness(tool, ctx);
    const novelty = calcNovelty(tool, ctx);

    let total = semantic + state + goal + time + difficulty + history + novelty;

    // 拒绝过的工具降权20%
    if (recentlyRejected.has(tool.tool_id)) {
      total *= 0.8;
    }

    // 收藏的工具适度加分
    if (isFavorite(tool.tool_id)) {
      total += 3;
    }

    return { tool, score: total };
  });

  // 排序
  scored.sort((a, b) => b.score - a.score);

  // 返回 Top N，附带推荐理由
  const results: ToolRecommendation[] = scored.slice(0, topN).map((s) => ({
    tool: s.tool,
    score: s.score,
    reason: generateReason(s.tool, ctx, isSafetyMode),
  }));

  return results;
}

/**
 * 生成推荐理由（用户可见，不说匹配度百分比）
 */
function generateReason(
  tool: Tool,
  ctx: RecommendContext,
  isSafetyMode: boolean
): string {
  if (isSafetyMode) {
    return "现在最重要的是先保证安全，这个工具可以帮你一步一步回到更安全的状态。";
  }

  const reasons: string[] = [];

  if (ctx.intensity !== undefined && ctx.intensity >= 7) {
    if (tool.category_id === "C1") {
      reasons.push("你现在唤起比较高，它可以先帮你把强度降下来一点。");
    } else if (tool.category_id === "C8") {
      reasons.push("当情绪很强的时候，先照顾安全是最重要的。");
    }
  }

  if (ctx.available_time_min && tool.time_estimate_min <= ctx.available_time_min) {
    reasons.push(`大约${tool.time_estimate_min}分钟，在你可用的时间里。`);
  }

  if (tool.difficulty === 1) {
    reasons.push("步骤简单，不需要准备什么。");
  }

  if (reasons.length === 0) {
    reasons.push(tool.mechanism);
  }

  return reasons[0];
}

/**
 * Quick Match 结果转换为推荐上下文
 */
export function quickMatchAnswersToContext(
  answers: QuickMatchAnswer[]
): RecommendContext {
  const ctx: RecommendContext = {
    source: "quick_match",
  };

  answers.forEach((answer, index) => {
    if (answer.skipped) return;

    const options = answer.selected_options || [];

    switch (index) {
      case 0: // 需求类型
        if (options.includes("高唤起") || options.includes("想先稳一下")) {
          ctx.intent_type = "D";
        } else if (options.includes("想解决问题") || options.includes("方法")) {
          ctx.intent_type = "B";
        } else if (options.includes("想练习")) {
          ctx.intent_type = "C";
        } else if (options.includes("想聊聊")) {
          ctx.intent_type = "A";
        }
        break;
      case 1: // 强度
        if (options.includes("很轻")) ctx.intensity = 2;
        else if (options.includes("中等")) ctx.intensity = 5;
        else if (options.includes("很强")) ctx.intensity = 8;
        else if (options.includes("说不清")) ctx.intensity = 5;
        break;
      case 2: // 可用时间
        if (options.includes("1-3分钟")) ctx.available_time_min = 3;
        else if (options.includes("5分钟")) ctx.available_time_min = 5;
        else if (options.includes("10分钟")) ctx.available_time_min = 10;
        else if (options.includes("15分钟")) ctx.available_time_min = 15;
        break;
      case 3: // 方向偏好
        if (options.includes("身体")) ctx.preferred_direction = "body";
        else if (options.includes("想法")) ctx.preferred_direction = "thought";
        else if (options.includes("关系")) ctx.preferred_direction = "relation";
        else if (options.includes("行动")) ctx.preferred_direction = "action";
        break;
      case 4: // 能否闭眼
        ctx.can_close_eyes = options.includes("可以");
        break;
      case 5: // 引导风格
        if (options.includes("直接")) ctx.guidance_style = "direct";
        else if (options.includes("温柔")) ctx.guidance_style = "gentle";
        break;
      case 6: // 不想做的类别
        ctx.excluded_category_ids = options;
        break;
    }

    // 开放输入也加入need_text
    if (answer.free_text && answer.free_text.trim()) {
      ctx.need_text = (ctx.need_text || "") + " " + answer.free_text;
    }
  });

  return ctx;
}

/**
 * 小酷聊天中判断是否应该推荐工具
 * 返回 null 表示不推荐，否则返回推荐列表
 */
export function shouldRecommendInChat(
  userMessage: string,
  context: Omit<RecommendContext, "source">
): ToolRecommendation[] | null {
  const settings = getToolSettings();

  // 用户关闭了推荐
  if (!settings.tool_recommendations_enabled) {
    return null;
  }

  // 检查是否有明确不想被建议的信号
  const rejectionSignals = [
    "不想用工具",
    "不要推荐",
    "不想做",
    "我只是想说说",
    "不用了",
  ];
  if (rejectionSignals.some((s) => userMessage.includes(s))) {
    // 记录拒绝时间，10轮内不主动推荐
    return null;
  }

  // 检查是否有请求方法/工具的信号
  const requestSignals = [
    "怎么办",
    "怎么缓解",
    "有什么办法",
    "帮我",
    "推荐",
    "工具",
    "练习",
    "该怎么做",
  ];

  const hasRequest = requestSignals.some((s) => userMessage.includes(s));

  // 只有用户明确请求，或者高唤起状态，才推荐
  if (!hasRequest && context.intent_type !== "D") {
    return null;
  }

  const results = recommendTools(
    { ...context, source: "xiaoku" },
    { topN: 2 }
  );

  return results.length > 0 ? results : null;
}

// 导出供外部使用
export { recordToolRejection, getToolById };
