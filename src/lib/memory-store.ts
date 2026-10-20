// ================================================================
// QM AI 本地记忆存储 (Plan B: localStorage)
//
// L1: 身份档案 (qm_ai_profile) — 昵称、代词、城市、沟通偏好等
// L3: 安全标记 (qm_ai_safety_flags) — 自伤/自杀/家暴等危机相关标记
//
// 所有数据仅保存在用户本地浏览器，不出端、不训练、不出售。
// ================================================================

export interface Profile {
  nickname?: string;
  pronouns?: string;
  age?: string;
  occupation?: string;
  city?: string;
  communicationPrefs?: string[];
  updatedAt: number;
}

export interface SafetyFlags {
  hasSelfHarmIdeation?: boolean;
  hasSuicideHistory?: boolean;
  hasDomesticViolenceRisk?: boolean;
  crisisResourceUsed?: boolean;
  lastCrisisAt?: number;
  notes?: string;
  updatedAt: number;
}

const PROFILE_KEY = "qm_ai_profile";
const SAFETY_KEY = "qm_ai_safety_flags";

// ----------------------------------------------------------------
// 内部工具：安全读取 / 写入 localStorage
// ----------------------------------------------------------------
function safeRead<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function safeWrite<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota / privacy mode errors
  }
}

function safeRemove(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

function now(): number {
  return Date.now();
}

// ================================================================
// L1: 身份档案
// ================================================================

export function getProfile(): Profile | null {
  return safeRead<Profile>(PROFILE_KEY);
}

export function saveProfile(partial: Partial<Profile>): Profile {
  const existing = getProfile() ?? ({} as Profile);
  // 数组合并（沟通偏好取并集，去重）
  let mergedPrefs = existing.communicationPrefs ?? [];
  if (partial.communicationPrefs && partial.communicationPrefs.length > 0) {
    const set = new Set([...mergedPrefs, ...partial.communicationPrefs]);
    mergedPrefs = Array.from(set);
  }

  const next: Profile = {
    ...existing,
    ...partial,
    communicationPrefs: mergedPrefs.length > 0 ? mergedPrefs : undefined,
    updatedAt: now(),
  };
  safeWrite(PROFILE_KEY, next);
  return next;
}

export function clearProfile(): void {
  safeRemove(PROFILE_KEY);
}

// ================================================================
// L3: 安全标记
// ================================================================

export function getSafetyFlags(): SafetyFlags | null {
  return safeRead<SafetyFlags>(SAFETY_KEY);
}

export function saveSafetyFlags(partial: Partial<SafetyFlags>): SafetyFlags {
  const existing = getSafetyFlags() ?? ({} as SafetyFlags);
  const next: SafetyFlags = {
    ...existing,
    ...partial,
    updatedAt: now(),
  };
  // notes 追加而非覆盖
  if (partial.notes && existing.notes && partial.notes !== existing.notes) {
    next.notes = `${existing.notes}\n${partial.notes}`;
  }
  safeWrite(SAFETY_KEY, next);
  return next;
}

export function clearSafetyFlags(): void {
  safeRemove(SAFETY_KEY);
}

// ================================================================
// 清除所有记忆
// ================================================================

export function clearAllMemory(): void {
  clearProfile();
  clearSafetyFlags();
  // 同时清除 Onboarding 画像（与 use-onboarding 共用的 key）
  safeRemove("qm_ai_profile");
}

// ================================================================
// 生成注入到 AI 对话的记忆上下文文本
// ================================================================

export function getMemoryContextString(): string {
  const profile = getProfile();
  const safety = getSafetyFlags();

  const parts: string[] = [];
  const profileLines: string[] = [];
  const safetyLines: string[] = [];

  if (profile) {
    if (profile.nickname) profileLines.push(`- 用户希望被称呼为：${profile.nickname}`);
    if (profile.pronouns) profileLines.push(`- 代词偏好：${profile.pronouns}`);
    if (profile.age) profileLines.push(`- 年龄段：${profile.age}`);
    if (profile.occupation) profileLines.push(`- 职业/身份：${profile.occupation}`);
    if (profile.city) profileLines.push(`- 所在城市：${profile.city}`);
    if (profile.communicationPrefs && profile.communicationPrefs.length > 0) {
      profileLines.push(`- 沟通偏好：${profile.communicationPrefs.join("、")}`);
    }
  }

  if (safety) {
    if (safety.hasSelfHarmIdeation)
      safetyLines.push(`- 用户曾表达自伤意念，请保持温和、不评判，必要时提供危机资源。`);
    if (safety.hasSuicideHistory)
      safetyLines.push(`- 用户曾提及自杀相关经历，请格外谨慎、稳定陪伴。`);
    if (safety.hasDomesticViolenceRisk)
      safetyLines.push(`- 用户可能处于家暴/亲密关系暴力风险中，优先确认安全。`);
    if (safety.crisisResourceUsed)
      safetyLines.push(`- 用户此前已使用过危机资源，可在合适时机温和跟进。`);
  }

  if (profileLines.length > 0) {
    parts.push(`【用户档案】（来自本地记忆，仅用于本次对话）\n${profileLines.join("\n")}`);
  }
  if (safetyLines.length > 0) {
    parts.push(`【安全提示】\n${safetyLines.join("\n")}`);
  }

  if (parts.length === 0) return "";

  return `以下是用户在本地保存的记忆信息，请用于让对话更连贯，但不要主动提及"系统""记忆""档案"等字眼：\n\n${parts.join("\n\n")}`;
}

// ================================================================
// 从对话中提取关键信息并保存（简单关键词匹配）
// ================================================================

interface ChatMessage {
  role: string;
  content: string;
}

const NICKNAME_PATTERNS: RegExp[] = [
  /(?:我叫|我是|叫我|称呼我|可以叫我|你可以叫我|我的名字(?:是|叫))\s*([^\s,。，、；：！？!?]{2,12})/,
  /(?:my name is|call me|i'm|i am)\s+([a-zA-Z][a-zA-Z\s]{1,20})/i,
];

const PRONOUN_MAP: Record<string, string> = {
  她: "她",
  他: "他",
  "TA": "TA",
  ta: "TA",
  "她们": "她们",
  "他们": "他们",
  "它们": "TA",
};

const PRONOUN_HINT = /(?:代词|称呼我用|用什么代词|我用)([^。，！？\n]{0,12})(她|他|TA|她们|他们)/;

const CITY_HINT = /(?:我在|我住在|我来自|目前在|现在在|坐标)([一-龥]{2,8}(?:市|省|区|县)?)/;
const OCCUPATION_HINT = /(?:我是(?:一名|一个)?|职业是|做)(学生|老师|程序员|设计师|工程师|医生|护士|律师|记者|作家|艺术家|自由职业|上班族|产品经理|运营|销售|HR|会计|研究员|大学生|研究生|博士生)(?:的)?/;
const AGE_HINT = /(?:我今年|我现在|年龄是?)\s*(\d{1,2})\s*岁/;

const SELF_HARM_KEYWORDS = ["割腕", "自残", "自伤", "划自己", "伤害自己"];
const SUICIDE_KEYWORDS = ["自杀", "想死", "不想活", "结束生命", "了结自己", "跳楼", "吃安眠药"];
const DV_KEYWORDS = ["家暴", "家庭暴力", "被打", "伴侣打我", "老公打我", "老婆打我", "控制我", "威胁我"];

function pickNickname(text: string): string | undefined {
  for (const re of NICKNAME_PATTERNS) {
    const m = text.match(re);
    if (m && m[1]) {
      const name = m[1].trim();
      // 过滤明显不是名字的词
      if (
        name.length >= 2 &&
        !/^(你好|谢谢|再见|没事|没有|不是|因为|所以|但是|如果|就是|一个|这个|那个|什么|怎么|为什么)$/.test(
          name,
        )
      ) {
        return name;
      }
    }
  }
  return undefined;
}

function detectCrisisKeywords(text: string): {
  selfHarm?: boolean;
  suicide?: boolean;
  dv?: boolean;
} {
  const result: { selfHarm?: boolean; suicide?: boolean; dv?: boolean } = {};
  if (SELF_HARM_KEYWORDS.some((k) => text.includes(k))) result.selfHarm = true;
  if (SUICIDE_KEYWORDS.some((k) => text.includes(k))) result.suicide = true;
  if (DV_KEYWORDS.some((k) => text.includes(k))) result.dv = true;
  return result;
}

export function extractAndSaveMemory(messages: ChatMessage[]): void {
  if (!Array.isArray(messages) || messages.length === 0) return;

  // 只扫描最近 20 条用户消息，避免越扫越慢
  const recentUser = messages
    .filter((m) => m.role === "user" && typeof m.content === "string")
    .slice(-20);

  if (recentUser.length === 0) return;

  const profilePatch: Partial<Profile> = {};
  let profileChanged = false;
  const safetyPatch: Partial<SafetyFlags> = {};
  let safetyChanged = false;

  for (const msg of recentUser) {
    const text = msg.content;
    if (!text || text.length < 2) continue;

    // 跳过系统指令 / 画像数据注入
    if (text.startsWith("[系统") || text.startsWith("【")) continue;

    // 昵称
    if (!profilePatch.nickname) {
      const nick = pickNickname(text);
      if (nick) {
        profilePatch.nickname = nick;
        profileChanged = true;
      }
    }

    // 代词
    if (!profilePatch.pronouns) {
      const pm = text.match(PRONOUN_HINT);
      if (pm && pm[2]) {
        profilePatch.pronouns = PRONOUN_MAP[pm[2]] ?? pm[2];
        profileChanged = true;
      }
    }

    // 城市
    if (!profilePatch.city) {
      const cm = text.match(CITY_HINT);
      if (cm && cm[1]) {
        profilePatch.city = cm[1];
        profileChanged = true;
      }
    }

    // 职业
    if (!profilePatch.occupation) {
      const om = text.match(OCCUPATION_HINT);
      if (om && om[1]) {
        profilePatch.occupation = om[1];
        profileChanged = true;
      }
    }

    // 年龄
    if (!profilePatch.age) {
      const am = text.match(AGE_HINT);
      if (am && am[1]) {
        const ageNum = parseInt(am[1], 10);
        if (ageNum >= 10 && ageNum <= 100) {
          profilePatch.age = `${ageNum}岁`;
          profileChanged = true;
        }
      }
    }

    // 危机关键词
    const crisis = detectCrisisKeywords(text);
    if (crisis.selfHarm) {
      safetyPatch.hasSelfHarmIdeation = true;
      safetyChanged = true;
    }
    if (crisis.suicide) {
      safetyPatch.hasSelfHarmIdeation = true;
      safetyPatch.hasSuicideHistory = true;
      safetyPatch.lastCrisisAt = now();
      safetyChanged = true;
    }
    if (crisis.dv) {
      safetyPatch.hasDomesticViolenceRisk = true;
      safetyChanged = true;
    }
  }

  if (profileChanged) {
    saveProfile(profilePatch);
  }
  if (safetyChanged) {
    saveSafetyFlags(safetyPatch);
  }
}
