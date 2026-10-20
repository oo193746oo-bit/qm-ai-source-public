import { THERAPISTS } from "./booking/data";

/**
 * 小雪 AI 对话 ↔ 结构化预约表单 数据桥接
 *
 * 设计原则：
 * - AI 对话中确认的字段作为 suggestion 写入 localStorage
 * - 结构化表单加载时读取 suggestion，展示"从小雪对话带来"标记
 * - 用户确认后才写入正式 draft，不会自动覆盖
 *
 * 仅客户端使用。
 */

export interface XiaoxueSuggestion {
  schemaVersion: 1;
  updatedAt: number;
  fields: {
    core_topics?: string[];
    language_preference?: string[];
    concerns?: string[];
    service_mode?: string;
    therapist_preference?: string;
    budget_level?: 'junior' | 'mature' | 'senior' | 'expert';
    availability?: string;
    city?: string;
    notes?: string;
  };
  source: "xiaoxue_ai";
}

const STORAGE_KEY = "xiaoxue_structured_bridge_v1";

export function saveXiaoxueSuggestion(s: XiaoxueSuggestion): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* ignore quota */
  }
}

export function readXiaoxueSuggestion(): XiaoxueSuggestion | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as XiaoxueSuggestion;
    if (!parsed || parsed.schemaVersion !== 1) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearXiaoxueSuggestion(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * 从 AI 对话消息中粗提取用户已提及的字段（轻量、保守，不做 NLP 推断）
 * 只做关键词命中，避免"AI 猜"。
 */
export function extractSuggestionFromMessages(
  msgs: { role: string; content: string }[],
): XiaoxueSuggestion["fields"] {
  const userTexts = msgs
    .filter((m) => m.role === "user")
    .map((m) => m.content)
    .join("\n");

  const fields: XiaoxueSuggestion["fields"] = {};

  // 核心议题（多标签）
  const topics: string[] = [];
  if (/焦虑|压力|紧张|panic|惊恐/.test(userTexts)) topics.push("anxiety");
  if (/抑郁|低落|没兴趣|提不起劲/.test(userTexts)) topics.push("depression");
  if (/分手|失恋|恋爱|感情|亲密关系/.test(userTexts)) topics.push("relationship");
  if (/家庭|父母|原生/.test(userTexts)) topics.push("family");
  if (/职场|工作|职业|拖延/.test(userTexts)) topics.push("work");
  if (/创伤|PTSD/.test(userTexts)) topics.push("trauma");
  if (/ADHD|注意力|多动/.test(userTexts)) topics.push("adhd");
  if (/LGBT|同性恋|出柜|性别|酷儿|跨性别/.test(userTexts)) topics.push("lgbtq");
  if (/身份|认同|迷茫|自我探索/.test(userTexts)) topics.push("identity");
  if (/进食|暴食|厌食|减肥|身材|容貌/.test(userTexts)) topics.push("eating");
  if (/失眠|睡眠/.test(userTexts)) topics.push("sleep");
  if (topics.length > 0) fields.core_topics = topics;

  // 服务形式
  if (/线上|视频|远程/.test(userTexts)) fields.service_mode = "online";
  else if (/线下|到店|面对面|当面/.test(userTexts)) fields.service_mode = "offline";

  // 预算层级（只识别明确档位词，不猜金额）
  if (/入门级|新手/.test(userTexts)) fields.budget_level = 'junior';
  else if (/成熟级/.test(userTexts)) fields.budget_level = 'mature';
  else if (/资深级/.test(userTexts)) fields.budget_level = 'senior';
  else if (/专家级/.test(userTexts)) fields.budget_level = 'expert';

  // 时间偏好（输出表单使用的枚举值，不输出中文）
  if (/周末|周六|周日/.test(userTexts)) fields.availability = 'weekend';
  else if (/工作日晚上|周中晚上|晚上/.test(userTexts)) fields.availability = 'weekday_evening';
  else if (/工作日白天|周中白天|白天/.test(userTexts)) fields.availability = 'weekday_day';

  // 城市
  const cityMatch = userTexts.match(/(上海|北京|深圳|广州|杭州|成都|南京|武汉|西安|纽约|伦敦|多伦多|悉尼|东京)/);
  if (cityMatch) fields.city = cityMatch[1];

  // 语言
  const langs: string[] = [];
  if (/英语|英文|english/i.test(userTexts)) langs.push("english");
  if (/沪语|上海话/.test(userTexts)) langs.push("shanghainese");
  if (/粤语|广东话/.test(userTexts)) langs.push("cantonese");
  if (langs.length > 0) fields.language_preference = langs;

  // 用户指定心理师：只记录 THERAPISTS 白名单中的中文姓名，避免把“想找心理师聊聊”误提取成“聊聊”。
  const namedCandidates = userTexts.match(/[\u4e00-\u9fa5]{2,4}/g) || [];
  const allowedNames = THERAPISTS.map((t) => t.name);
  const named = namedCandidates.find((name) => allowedNames.includes(name));
  if (named) fields.therapist_preference = named;

  return fields;
}
