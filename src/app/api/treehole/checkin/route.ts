import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CheckinAnalyzeRequest {
  answers: Array<{
    questionId: string;
    dimension: string;
    question: string;
    answer: string;
    skipped?: boolean;
  }>;
  date: string;
}

interface CheckinAnalyzeResponse {
  mood_summary: string;
  energy_summary: string;
  key_themes: string[];
  unresolved_signals: string[];
  suggested_followups: string[];
}

/**
 * 每日情绪收集结果分析 API
 *
 * POC 版本：使用规则分析，不调用 LLM（减少延迟和成本）
 * MVP 版本：可以调用 LLM 做更精细的分析和记忆提取
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CheckinAnalyzeRequest;
    const { answers, date } = body;

    if (!answers || answers.length === 0) {
      return new Response(
        JSON.stringify({ error: "回答不能为空" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // POC 版本：本地规则分析
    const result = analyzeCheckinLocally(answers, date);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[Treehole Checkin] API error:", error);
    return new Response(
      JSON.stringify({ error: "服务器内部错误" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

function analyzeCheckinLocally(
  answers: CheckinAnalyzeRequest["answers"],
  date: string,
): CheckinAnalyzeResponse {
  const validAnswers = answers.filter((a) => !a.skipped);

  // 情绪摘要
  let moodSummary = "今天的情绪有记录";
  const valAnswer = validAnswers.find((a) => a.dimension === "VAL");
  if (valAnswer) {
    const ans = valAnswer.answer;
    if (ans.includes("明亮") || ans.includes("开心")) {
      moodSummary = "今天整体情绪偏明亮";
    } else if (ans.includes("平静")) {
      moodSummary = "今天情绪比较平静";
    } else if (ans.includes("灰") || ans.includes("难过") || ans.includes("失落")) {
      moodSummary = "今天情绪有点低落";
    } else if (ans.includes("沉") || ans.includes("麻木")) {
      moodSummary = "今天情绪比较沉重";
    } else if (ans.includes("焦虑") || ans.includes("紧张")) {
      moodSummary = "今天有点焦虑紧张";
    } else if (ans.includes("生气") || ans.includes("烦躁")) {
      moodSummary = "今天有点生气烦躁";
    }
  }

  // 能量摘要
  let energySummary = "";
  const eneAnswer = validAnswers.find((a) => a.dimension === "ENE");
  const motAnswer = validAnswers.find((a) => a.dimension === "MOT");
  if (eneAnswer) {
    const ans = eneAnswer.answer;
    if (ans.includes("满") || ans.includes("精神")) energySummary = "身体能量比较充足";
    else if (ans.includes("还可以") || ans.includes("够用")) energySummary = "身体能量够用";
    else if (ans.includes("一点") || ans.includes("低")) energySummary = "身体能量偏低";
    else if (ans.includes("几乎没") || ans.includes("没怎么")) energySummary = "身体能量很低";
  }
  if (motAnswer) {
    const ans = motAnswer.answer;
    if (ans.includes("自己在")) energySummary = energySummary ? energySummary + "，动力还不错" : "动力还不错";
    else if (ans.includes("推动")) energySummary = energySummary ? energySummary + "，动力一般" : "动力一般";
    else if (ans.includes("拖着")) energySummary = energySummary ? energySummary + "，做事有点拖着" : "做事情有点拖着";
    else if (ans.includes("停住")) energySummary = energySummary ? energySummary + "，动力很低" : "动力很低";
  }

  // 主题
  const dimensionNames: Record<string, string> = {
    VAL: "情绪色调",
    ENE: "睡眠与身体能量",
    COG: "认知负荷",
    MOT: "动力与行动",
    SELF: "自我关系",
    INT: "亲密关系",
    FAM: "家庭关系",
    WORK: "工作学习",
    SOC: "人际连接",
    MEA: "意义与方向",
    RES: "恢复资源",
  };

  const keyThemes = validAnswers
    .map((a) => dimensionNames[a.dimension] || a.dimension)
    .filter((v, i, arr) => arr.indexOf(v) === i);

  // 未完信号
  const unresolvedKeywords: Record<string, string[]> = {
    VAL: ["很沉", "难过", "焦虑", "生气", "麻木"],
    ENE: ["没充到", "没怎么睡", "很低", "吃不下", "忘了吃"],
    COG: ["多到很乱", "一直绕不出去", "挺占位置"],
    MOT: ["非常难", "几乎停住", "拖着"],
    SELF: ["苛刻", "严格", "很陌生"],
    INT: ["有摩擦", "有点远"],
    FAM: ["很消耗", "有点压力"],
    WORK: ["快超载", "完全放不下", "吃力"],
    SOC: ["没有", "很强烈"],
    MEA: ["完全看不清", "只想先过今天"],
    RES: ["没有", "什么都没有"],
  };

  const unresolvedSignals: string[] = [];
  for (const ans of validAnswers) {
    const patterns = unresolvedKeywords[ans.dimension] || [];
    if (patterns.some((p) => ans.answer.includes(p))) {
      const dimName = dimensionNames[ans.dimension] || ans.dimension;
      unresolvedSignals.push(`${dimName}：${ans.answer}`);
    }
  }

  // 建议的 follow-up（明天可问的）
  const suggestedFollowups: string[] = [];
  for (const signal of unresolvedSignals.slice(0, 2)) {
    suggestedFollowups.push(`继续关注${signal.split("：")[0]}的变化`);
  }

  return {
    mood_summary: moodSummary,
    energy_summary: energySummary || "身体状态有记录",
    key_themes: keyThemes,
    unresolved_signals: unresolvedSignals,
    suggested_followups: suggestedFollowups,
  };
}
