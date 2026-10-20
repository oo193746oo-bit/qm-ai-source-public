// QM 情绪树洞 v2.0 - Context Capsule 生成器
// 从当日 check-in + 日记 + 7天趋势生成摘要JSON
// 不超过 5 个 top_themes、3 个 unresolved_threads
// consent_scope 控制是否注入自由对话
import type {
  ContextCapsule,
  DailyRecord,
  DailyCheckin,
  TrendDataPoint,
  DimensionCode,
} from "./th-types";
import { DIMENSION_NAMES } from "./th-questions";
import { getRecordsInRange } from "./th-storage";

/**
 * 生成 Context Capsule
 *
 * POC 版本：基于规则和关键词提取，不从日记原文提取深层信息
 * 只把 check-in 的聚合结果和简短元数据放入胶囊
 */
export function generateContextCapsule(
  todayRecord: DailyRecord,
  trend7d: TrendDataPoint[],
  consentScope: string = "treehole_to_chat_summary",
): ContextCapsule {
  const { checkin, diary, letter } = todayRecord;
  const date = todayRecord.date;

  // 情绪摘要
  const moodSummary = generateMoodSummary(checkin);

  // 能量摘要
  const energySummary = generateEnergySummary(checkin);

  // Top themes（最多5个）
  const topThemes = generateTopThemes(checkin, trend7d).slice(0, 5);

  // Unresolved threads（最多3个）
  const unresolvedThreads = generateUnresolvedThreads(checkin, trend7d).slice(0, 3);

  // 用户最有代表性的一句话（从日记摘一句话或留空）
  const userSelectedQuote = extractQuote(diary?.text || "");

  // 7天趋势叙事
  const trendNarrative = generate7dTrendNarrative(trend7d);

  // 过期时间（24小时后过期）
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 1);

  return {
    date,
    moodSummary,
    energySummary,
    topThemes,
    unresolvedThreads,
    userSelectedQuote: userSelectedQuote || undefined,
    trend7d: trendNarrative,
    consentScope,
    expiresAt: expiresAt.toISOString(),
  };
}

/**
 * 生成情绪摘要
 */
function generateMoodSummary(checkin?: DailyCheckin): string {
  if (!checkin || checkin.answers.length === 0) {
    return "今天的情绪状态还不清楚";
  }

  const valAnswer = checkin.answers.find((a) => a.dimension === "VAL");
  if (!valAnswer) {
    return "今天有记录情绪相关内容";
  }

  const ans = valAnswer.answer;
  if (ans.includes("明亮") || ans.includes("开心")) {
    return "今天整体情绪偏明亮";
  }
  if (ans.includes("平静")) {
    return "今天情绪比较平静";
  }
  if (ans.includes("灰") || ans.includes("难过") || ans.includes("失落")) {
    return "今天情绪有点低落";
  }
  if (ans.includes("沉") || ans.includes("麻木")) {
    return "今天情绪比较沉重";
  }
  if (ans.includes("焦虑") || ans.includes("紧张")) {
    return "今天有点焦虑紧张";
  }
  if (ans.includes("生气") || ans.includes("烦躁")) {
    return "今天有点生气烦躁";
  }
  return `今天的情绪底色是「${ans}」`;
}

/**
 * 生成能量摘要
 */
function generateEnergySummary(checkin?: DailyCheckin): string {
  if (!checkin) return "";

  const eneAnswer = checkin.answers.find((a) => a.dimension === "ENE");
  const motAnswer = checkin.answers.find((a) => a.dimension === "MOT");

  const parts: string[] = [];

  if (eneAnswer) {
    const ans = eneAnswer.answer;
    if (ans.includes("满") || ans.includes("精神")) {
      parts.push("身体能量比较充足");
    } else if (ans.includes("还可以") || ans.includes("够用")) {
      parts.push("身体能量够用");
    } else if (ans.includes("一点") || ans.includes("低")) {
      parts.push("身体能量偏低");
    } else if (ans.includes("几乎没") || ans.includes("没怎么")) {
      parts.push("身体能量很低");
    }
  }

  if (motAnswer) {
    const ans = motAnswer.answer;
    if (ans.includes("自己在")) {
      parts.push("动力还不错");
    } else if (ans.includes("需要推动")) {
      parts.push("动力一般");
    } else if (ans.includes("拖着")) {
      parts.push("做事情有点拖着");
    } else if (ans.includes("停住")) {
      parts.push("动力很低");
    }
  }

  return parts.join("；") || "今天的身体状态有记录";
}

/**
 * 生成主题列表
 */
function generateTopThemes(
  checkin?: DailyCheckin,
  trend7d: TrendDataPoint[] = [],
): string[] {
  const themes: string[] = [];

  if (checkin) {
    for (const ans of checkin.answers) {
      if (ans.skipped) continue;
      const dimName = DIMENSION_NAMES[ans.dimension];
      if (dimName && !themes.includes(dimName)) {
        themes.push(dimName);
      }
    }
  }

  // 从 7 天趋势中提取重复主题
  const themeCounts: Record<string, number> = {};
  for (const point of trend7d) {
    for (const t of point.themes) {
      themeCounts[t] = (themeCounts[t] || 0) + 1;
    }
  }
  const frequentThemes = Object.entries(themeCounts)
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([t]) => t);

  // 合并，去重
  const merged = [...themes];
  for (const t of frequentThemes) {
    if (!merged.includes(t)) merged.push(t);
  }

  return merged;
}

/**
 * 生成未完线索
 */
function generateUnresolvedThreads(
  checkin?: DailyCheckin,
  trend7d: TrendDataPoint[] = [],
): string[] {
  const threads: string[] = [];

  if (!checkin) return threads;

  // 从 check-in 答案中识别未解决的信号
  const unresolvedPatterns: Record<string, string[]> = {
    VAL: ["很沉", "难过", "焦虑", "生气", "麻木"],
    ENE: ["没充到", "没怎么睡", "很低", "吃不下", "忘了吃"],
    COG: ["多到很乱", "一直绕不出去", "挺占位置"],
    MOT: ["非常难", "几乎停住", "一直拖着走"],
    SELF: ["苛刻评审", "严格老师", "很陌生"],
    INT: ["有摩擦", "有点远"],
    FAM: ["很消耗", "有点压力"],
    WORK: ["快超载", "完全放不下", "比较吃力"],
    SOC: ["没有", "很强烈", "没有感到被理解"],
    MEA: ["完全看不清", "只想先过今天"],
    RES: ["没有", "什么都没有", "不知道怎样才算休息"],
  };

  for (const ans of checkin.answers) {
    if (ans.skipped) continue;
    const patterns = unresolvedPatterns[ans.dimension] || [];
    if (patterns.some((p) => ans.answer.includes(p))) {
      const dimName = DIMENSION_NAMES[ans.dimension];
      const thread = `${dimName}方面需要关注`;
      if (!threads.includes(thread)) {
        threads.push(thread);
      }
    }
  }

  return threads;
}

/**
 * 从日记中摘取一句有代表性的话（不超过 50 字）
 * 仅用于 Context Capsule 的可选字段
 */
function extractQuote(diaryText: string): string | null {
  if (!diaryText || diaryText.length < 10) return null;

  // 找第一句完整的话
  const firstSentence = diaryText.split(/[。！？.!?\n]/)[0];
  if (firstSentence && firstSentence.length <= 50) {
    return firstSentence.trim();
  }

  // 太长的话截到 50 字
  return diaryText.slice(0, 47).trim() + "...";
}

/**
 * 生成 7 天趋势的叙事描述
 */
function generate7dTrendNarrative(trend7d: TrendDataPoint[]): string {
  if (!trend7d || trend7d.length < 3) {
    return "记录还不够多，趋势还不明显";
  }

  const daysWithDiary = trend7d.filter((p) => p.hasDiary).length;

  // 计算情绪趋势
  const moodScores = trend7d
    .filter((p) => p.moodScore !== undefined)
    .map((p) => p.moodScore as number);

  let moodTrend = "情绪有起伏";
  if (moodScores.length >= 3) {
    const firstHalf = moodScores.slice(0, Math.floor(moodScores.length / 2));
    const secondHalf = moodScores.slice(Math.floor(moodScores.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    if (secondAvg - firstAvg > 0.5) {
      moodTrend = "最近情绪有向上的趋势";
    } else if (firstAvg - secondAvg > 0.5) {
      moodTrend = "最近情绪有向下的趋势";
    } else {
      moodTrend = "情绪整体比较稳定";
    }
  }

  return `过去${trend7d.length}天里有${daysWithDiary}天写了日记，${moodTrend}。这是观察记录，不是诊断结论。`;
}

/**
 * 从最近 7 天记录生成趋势数据点
 */
export function build7dTrendPoints(date: string): TrendDataPoint[] {
  const endDate = new Date(date);
  const startDate = new Date(date);
  startDate.setDate(startDate.getDate() - 6);

  const startStr = startDate.toISOString().split("T")[0];
  const endStr = endDate.toISOString().split("T")[0];

  const records = getRecordsInRange(startStr, endStr);
  const points: TrendDataPoint[] = [];

  // 填充每一天
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0];
    const record = records.find((r) => r.date === dateStr);

    let moodScore: number | undefined;
    let energyScore: number | undefined;
    let sleepScore: number | undefined;
    let motivationScore: number | undefined;
    const themes: string[] = [];

    if (record?.checkin) {
      for (const ans of record.checkin.answers) {
        const dim = ans.dimension;
        const score = answerToScore(ans.answer);

        if (dim === "VAL" && score !== undefined) moodScore = score;
        if (dim === "ENE" && score !== undefined) {
          energyScore = score;
          // 粗略估计睡眠分
          if (ans.question.includes("睡眠") || ans.question.includes("昨晚")) {
            sleepScore = score;
          }
        }
        if (dim === "MOT" && score !== undefined) motivationScore = score;

        const dimName = DIMENSION_NAMES[dim];
        if (dimName && !themes.includes(dimName)) {
          themes.push(dimName);
        }
      }
    }

    points.push({
      date: dateStr,
      moodScore,
      energyScore,
      sleepScore,
      motivationScore,
      themes,
      hasDiary: !!(record?.diary && !record.diary.isDraft),
      hasLetter: !!record?.letter,
    });
  }

  return points;
}

/**
 * 把文字答案粗略转换为 1-5 分（仅用于趋势可视化，不用于诊断）
 */
function answerToScore(answer: string): number | undefined {
  // 高分（正面）
  if (["明亮", "充得很满", "很有精神", "规律舒服", "很少很清楚", "没有", `很容易", "自己在往前走", "温柔的朋友", "很靠近", "支持"`, `很从容", "能", "有", "几乎没有", "看得挺远", "有"`,
       "开心/轻松", "平静"].includes(answer)) {
    return 5;
  }
  if (["还可以", "够用", "基本有吃", "有几个能处理", "有但不影响", `还好", "需要推动", "普通同事", "还算靠近", "舒服的距离"`, `平静", "有点忙", "大部分能", "好像有", "有一点"`,
       "看到下一步", "有一点"].includes(answer)) {
    return 4;
  }
  if ( ["有点灰", "只充一点", "有点低", "有点随便", "有点多", `挺占位置", "有点难", "一直拖着走", "严格老师", "有点远"`, `有点远", "有点压力", "比较吃力", "还挂着", "没有"`, `比较明显", "只想先过今天", "没有", "焦虑/紧张"`,
        "难过/失落", "生气/烦躁", "忽高忽低"].includes(answer)) {
    return 3;
  }
  if (["很沉", "几乎没充到", "很低", "明显吃不下/忘了吃", `多到很乱", "一直绕不出去", "非常难", "几乎停住"`, `苛刻评审", "很陌生", "有摩擦", "很消耗", "快超载"`, `完全放不下", "很强烈", "完全看不清", "麻木/空"`,
       "什么都没有"].includes(answer)) {
    return 2;
  }
  if (["没怎么睡", "不想回答", "不适用", "说不清", "其他",
       "今天没怎么和人接触", "不知道怎样才算休息"].includes(answer)) {
    return undefined; // 不计分
  }
  return undefined;
}

export { saveContextCapsule } from "./th-storage";
