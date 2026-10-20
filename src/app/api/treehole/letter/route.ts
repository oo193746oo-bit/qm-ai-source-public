import { NextRequest } from "next/server";
import { LLMClient, Config, HeaderUtils } from "coze-coding-dev-sdk";
import {
  TREEHOLE_LETTER_BUILD_ID,
  TREEHOLE_LETTER_SHA,
  TREEHOLE_SAFETY_SHA,
} from "@/lib/qm-version";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface LetterRequest {
  diary_text: string;
  checkin?: any;
  memories?: any[];
  trend?: any[];
  date: string;
}

interface LetterResponse {
  letter_text: string;
  daily_sentence: string;
  is_crisis: boolean;
  crisis_level?: string;
  char_count: number;
}

console.info("[QM:TREEHOLE:LETTER]", {
  build: TREEHOLE_LETTER_BUILD_ID,
  letterSha: TREEHOLE_LETTER_SHA.slice(0, 12),
  safetySha: TREEHOLE_SAFETY_SHA.slice(0, 12),
});

// v6.4.0 起故意不缓存：改完 Prompt 部署即生效
function loadLetterPrompt(): string {
  try {
    const spPath = path.join(process.cwd(), "src/lib/qm-ai-prompts/treehole-letter.md");
    return fs.readFileSync(spPath, "utf-8");
  } catch (error) {
    console.error("[Treehole Letter] Failed to load letter prompt:", error);
    return "你是小酷，QM AI 的树洞陪伴者。请认真回应用户的日记。";
  }
}

function loadSafetyPrompt(): string {
  try {
    const spPath = path.join(process.cwd(), "src/lib/qm-ai-prompts/treehole-safety.md");
    return fs.readFileSync(spPath, "utf-8");
  } catch (error) {
    console.error("[Treehole Letter] Failed to load safety prompt:", error);
    return "危机安全优先。如果用户有自伤自杀倾向，请提供 QM 热线 15001930070。";
  }
}

function buildQmHeaders(extra?: HeadersInit): Headers {
  const h = new Headers(extra);
  h.set("X-QM-Agent", "treehole-letter");
  h.set("X-QM-Build", TREEHOLE_LETTER_BUILD_ID);
  h.set("X-QM-Prompt-SHA", TREEHOLE_LETTER_SHA.slice(0, 12));
  return h;
}

/**
 * 本地危机关键词检测（服务端第一道防线）
 * 批2变更（2026-09-21）：与客户端 th-safety.ts 及全站统一清单（crisis-detection.ts）对齐，
 * 补齐计划暗示/告别/负担感/消失隐喻/繁体/英文各族，并新增 harm_others 级。
 */
function detectCrisisLocal(text: string): { isCrisis: boolean; level: "direct" | "indirect" | "harm_others" | "none"; matchedWords: string[] } {
  const directKeywords = [
    "自杀", "想自杀", "不想活了", "活不下去了", "不想活下去",
    "结束生命", "了结自己", "一了百了", "去死", "我想死",
    "割腕", "跳楼", "跳下去", "想跳下去", "吃安眠药", "上吊", "跳河", "烧炭",
    "自伤", "自残", "伤害自己", "割自己", "划自己",
    "楼顶", "天台", "翻栏杆", "跨出去", "翻出去",
    // —— 以下与全站统一清单对齐 ——
    "不想活", "不活了", "想死了", "想去死", "杀了我", "打死我",
    "想好要去哪里了", "地方不告诉你们", "想找个没人的地方", "安静地走",
    "明天去一个很远的地方", "可能不回来了", "具体地方不说",
    "帮我和大家说声对不起", "拖累他们太久了", "跟每个人都好好道了别",
    "帮我把信交给我妈", "帮我把信交给家人",
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
    "对话框会不会记得我", "世界会不会记得我", "想睡过去不醒",
    "去很远的地方不回来",
    "不如去死", "死了比较好", "想消失",
    "自殺", "想死", "割腕", "跳樓", "撐不下去了", "扛不住了", "活著沒意思",
    "沒有我他們會更好", "沒有我他們會更輕鬆", "我是累贅", "有我都沒一樣",
    "沒人在意我", "就這樣消失", "誰也找不到我",
    "suicide", "kill myself", "want to die", "end my life", "end it all",
    "self-harm", "cut myself", "hurt myself", "jump off", "overdose",
    "don't want to live", "better off dead", "no reason to live",
  ];
  const indirectKeywords = [
    "没什么好留恋的", "活着没意思", "活着好累", "活着没意义",
    "撑不下去了", "扛不住了", "坚持不下去了", "想解脱",
    "想消失", "想一睡不醒", "太痛苦了", "受不了了",
    "没有未来", "一片黑暗", "绝望了", "彻底绝望",
    // —— 以下与全站统一清单对齐 ——
    "不想再熬下去了",
    "日复一日地熬", "不知道哪天是个头", "看不到头", "望不到头",
    "撑了很多年撑不住", "撑不动了", "就想好好休息了",
    "人生没有意义", "觉得没意思", "看不到希望", "没有希望了",
    "熬不下去了", "想一睡不醒", "想永远睡下去",
    "活着真没什么意思", "活着没什么意思", "活着没啥意思", "活着没有什么意思",
    "每天活得没意思", "生活没什么意思", "生活没啥意思", "活得没意思",
    "找不到活着的意义", "找不到活下去的意义", "不知道活着还有什么意义", "活着不知道为了什么",
    "活下去没有意义", "生活没有什么意义", "人生没什么意义", "生无可恋",
    "我看不到活着的意义", "看不到活着的意义", "觉得生活没意思", "感觉生活没意思",
    "不想醒来", "不想睡", "醒不来", "睡过去就不用醒", "不想看到明天的太阳",
    "不想看到明天", "日子什么时候是头", "什么时候是个头",
    "沒什麼好留戀的", "活著好累", "想解脫", "活著好痛苦", "覺得活著沒意思", "好想就這樣消失",
    "tired of everything", "tired of living", "can't go on", "can't take it anymore",
    "no point in living", "nothing matters", "hopeless", "no hope",
    "want to disappear", "want to sleep forever", "want to fade away",
    "burden to everyone", "everyone would be better without me",
    "nobody would notice", "nobody cares if i'm gone",
  ];
  // 伤人意图（最高优先级，与客户端 th-safety.ts 一致）
  const harmKeywords = [
    "想杀人", "杀了他", "杀了她", "杀了他们", "弄死",
    "同归于尽", "一起死", "报复社会", "砍人",
  ];

  const harmMatches = harmKeywords.filter((w) => text.includes(w));
  if (harmMatches.length > 0) {
    return { isCrisis: true, level: "harm_others", matchedWords: harmMatches };
  }

  const directMatches = directKeywords.filter((w) => text.includes(w));
  if (directMatches.length > 0) {
    return { isCrisis: true, level: "direct", matchedWords: directMatches };
  }

  const indirectMatches = indirectKeywords.filter((w) => text.includes(w));
  if (indirectMatches.length >= 2) {
    return { isCrisis: true, level: "indirect", matchedWords: indirectMatches };
  }

  return { isCrisis: false, level: "none", matchedWords: [] };
}

/**
 * 危机安全回应（不走 LLM，确保安全流程优先）
 * 批2变更（2026-09-21）：热线块与客户端 th-safety.ts / 拍板登记对齐——
 * 补 12355（青少年）；direct/harm_others（立即危险）补 110/120 行。
 */
function getCrisisResponse(level: "direct" | "indirect" | "harm_others"): { text: string; dailySentence: string } {
  const hotlineBlock = `如果你现在有伤害自己的念头或行动，请立刻拨打 24 小时心理援助热线：
📞 15001930070（24 小时）
📞 13601658763（24 小时）
📞 12356（24 小时全国心理援助热线）
📞 12355（青少年心理服务热线）`;

  const immediateDangerLine = `如果你现在有立即伤害自己或他人的可能，请先拨打 110 或 120。`;

  if (level === "direct") {
    return {
      text: `小酷听到你说这些，非常非常担心你的安全。

${immediateDangerLine}

${hotlineBlock}

电话那头 24 小时都有人在，你不用一个人扛着。如果你身边有人，请告诉他们你现在的感受，不要一个人待着。

小酷会在这里陪着你。你愿意告诉我你现在在哪里、身边有人吗？`,
      dailySentence: "请记得：你不是一个人。24 小时都有人愿意接住你——15001930070。",
    };
  }

  if (level === "harm_others") {
    return {
      text: `你说的这些让小酷非常担心。伤害别人或自己都不是解决问题的方式。

${immediateDangerLine}

${hotlineBlock}

你现在身边有人吗？能不能先找一个安全的地方待着？

小酷会在这里陪着你。`,
      dailySentence: "请记得：你不是一个人。24 小时都有人愿意接住你——15001930070。",
    };
  }

  return {
    text: `你说的这些听起来让人心疼。你最近是不是感觉特别沉重、特别累？

${hotlineBlock}

如果你觉得自己快撑不住了，任何时候都可以打，24 小时都有人接。

小酷在这里陪着你。你愿意多说说最近发生了什么吗？`,
    dailySentence: "你不是一个人。撑不住的时候，可以打给我们：15001930070，24 小时。",
  };
}

/**
 * 构建用户消息（将输入结构化后传给 LLM）
 */
function buildUserMessage(req: LetterRequest): string {
  const { diary_text, checkin, memories, trend, date } = req;
  const parts: string[] = [];

  // 日期
  parts.push(`日期：${date}`);
  parts.push("");

  // Check-in 结果（摘要）
  if (checkin?.answers && checkin.answers.length > 0) {
    parts.push("【今日情绪收集】");
    for (const ans of checkin.answers.slice(0, 6)) {
      if (ans.skipped) continue;
      parts.push(`- ${ans.question}：${ans.answer}`);
    }
    parts.push("");
  }

  // 相关记忆（最多5条）
  if (memories && memories.length > 0) {
    parts.push("【相关记忆（最多参考，不要强行连接）】");
    memories.slice(0, 5).forEach((m, i) => {
      parts.push(`${i + 1}. ${m.fact}（来源：${m.sourceDate}）`);
    });
    parts.push("");
  }

  // 趋势摘要
  if (trend && trend.length > 0) {
    const diaryDays = trend.filter((t: any) => t.hasDiary).length;
    parts.push(`【近期趋势】过去${trend.length}天有${diaryDays}天写了日记。`);
    parts.push("");
  }

  // 日记原文（最重要）
  parts.push("【用户日记原文】");
  parts.push(diary_text);
  parts.push("");

  // 字数要求
  const diaryLen = diary_text.length;
  parts.push("【字数要求】");
  if (diaryLen < 500) {
    parts.push("用户日记不足500字，请回信500-750字，且不低于500字。");
  } else if (diaryLen < 2000) {
    const min = diaryLen;
    const max = Math.min(3000, Math.floor(diaryLen * 1.5));
    parts.push(`用户日记${diaryLen}字，请回信${min}-${max}字（1.0-1.5倍）。`);
  } else {
    parts.push("用户日记超过2000字，请回信约2000-3000字，不超过3000字。");
  }

  return parts.join("\n");
}

/**
 * 从回信中提取「今日一句话」
 */
function extractDailySentence(letterText: string): string {
  // 尝试匹配【今天的一句话】...格式
  const match = letterText.match(/【今天的一句话】\s*[\n「"]?(.+?)[\n」"]?\s*$/m);
  if (match && match[1]) {
    return match[1].trim();
  }

  // 没有的话从最后一段找一句最简短的
  const sentences = letterText
    .split(/[。\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5 && s.length < 30);

  if (sentences.length > 0) {
    return sentences[sentences.length - 1];
  }

  return "今天也辛苦了。";
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as LetterRequest;
    const { diary_text, date } = body;

    if (!diary_text || diary_text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "日记内容不能为空" }),
        { status: 400, headers: buildQmHeaders({ "Content-Type": "application/json" }) },
      );
    }

    // 第一步：危机检测（最高优先级）
    const crisisResult = detectCrisisLocal(diary_text);
    if (crisisResult.isCrisis) {
      console.log(`[Treehole Letter] Crisis detected: ${crisisResult.level}, words: ${crisisResult.matchedWords.join(",")}`);
      const crisis = getCrisisResponse(crisisResult.level === "none" ? "indirect" as const : crisisResult.level as "direct" | "indirect" | "harm_others");
      return new Response(
        JSON.stringify({
          letter_text: crisis.text,
          daily_sentence: crisis.dailySentence,
          is_crisis: true,
          crisis_level: crisisResult.level,
          char_count: crisis.text.length,
        } as LetterResponse),
        { status: 200, headers: buildQmHeaders({ "Content-Type": "application/json" }) },
      );
    }

    // 加载系统提示
    const letterPrompt = loadLetterPrompt();
    const safetyPrompt = loadSafetyPrompt();

    // 构建系统消息
    const systemMessage = `${letterPrompt}\n\n---\n安全守则：\n${safetyPrompt}\n\n---\n品牌规范：\n- AI自称「小酷」\n- 品牌色 #6B4C9A\n- 品牌Slogan「生活没有标准答案」\n- QM热线：15001930070 / 备用 13601658763\n-；用户处于紧急危险时，回信必须保留并明确提示拨打 110/120 与 12356`;

    // 构建用户消息
    const userMessage = buildUserMessage(body);

    // 调用 LLM
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    const messages = [
      { role: "system" as const, content: systemMessage },
      { role: "user" as const, content: userMessage },
    ];

    const stream = client.stream(messages, {
      model: "doubao-seed-2-0-pro-260215",
      temperature: 0.85,
    });

    // 收集完整回复
    let fullText = "";
    for await (const chunk of stream) {
      if (chunk.content) {
        fullText += chunk.content.toString();
      }
    }

    // 安全后处理：替换禁止内容
    fullText = sanitizeContent(fullText);

    // 提取今日一句话
    const dailySentence = extractDailySentence(fullText);

    const response: LetterResponse = {
      letter_text: fullText,
      daily_sentence: dailySentence,
      is_crisis: false,
      char_count: fullText.length,
    };

    console.log(`[Treehole Letter] Generated: ${fullText.length} chars for ${diary_text.length} diary chars`);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: buildQmHeaders({ "Content-Type": "application/json" }),
    });
  } catch (error) {
    console.error("[Treehole Letter] API error:", error);
    return new Response(
      JSON.stringify({ error: "服务器内部错误，请稍后重试" }),
      { status: 500, headers: buildQmHeaders({ "Content-Type": "application/json" }) },
    );
  }
}

/**
 * 安全内容后处理
 */
function sanitizeContent(text: string): string {
  let result = text;

  // 替换 400 号码
  result = result.replace(/400[- ]?\d{3,4}[- ]?\d{3,4}/g, "15001930070");
  // 移除北京心理危机相关
  result = result.replace(/北京心理危机[^，。\n]*研究中心?/g, "QM 心理援助热线");
  result = result.replace(/北京心理援助[^，。\n]*/g, "QM 心理援助热线");

  return result;
}
