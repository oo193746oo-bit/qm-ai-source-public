// QM 情绪树洞 v2.0 - localStorage 存储层
// 所有读写带 try-catch，隐私模式降级
import type {
  DailyRecord,
  TreeholeMemory,
  QuestionExposure,
  ContextCapsule,
  DiaryDraft,
  TreeholeSettings,
  STORAGE_KEYS,
} from "./th-types";
import { DEFAULT_SETTINGS } from "./th-types";

/**
 * 安全读取 localStorage（处理隐私模式/不可用情况）
 */
function safeGetItem(key: string): string | null {
  try {
    if (typeof localStorage === "undefined") return null;
    return localStorage.getItem(key);
  } catch (e) {
    console.warn("[treehole] localStorage 读取失败:", e);
    return null;
  }
}

/**
 * 安全写入 localStorage
 */
function safeSetItem(key: string, value: string): boolean {
  try {
    if (typeof localStorage === "undefined") return false;
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    console.warn("[treehole] localStorage 写入失败:", e);
    return false;
  }
}

/**
 * 安全删除 localStorage 项
 */
function safeRemoveItem(key: string): boolean {
  try {
    if (typeof localStorage === "undefined") return false;
    localStorage.removeItem(key);
    return true;
  } catch (e) {
    console.warn("[treehole] localStorage 删除失败:", e);
    return false;
  }
}

/**
 * 安全解析 JSON
 */
function safeParseJSON<T>(json: string | null, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch (e) {
    console.warn("[treehole] JSON 解析失败:", e);
    return fallback;
  }
}

// ========== 每日记录 ==========

const KEY_RECORDS = "qm_treehole_records";

function isStoredRecord(value: unknown, key: string): value is DailyRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Partial<DailyRecord>;
  if (record.date !== key) return false;
  if (record.diary !== undefined && (!record.diary || typeof record.diary !== "object" ||
    Array.isArray(record.diary) || record.diary.date !== key || typeof record.diary.text !== "string")) return false;
  if (record.letter !== undefined && (!record.letter || typeof record.letter !== "object" ||
    Array.isArray(record.letter) || record.letter.date !== key || typeof record.letter.text !== "string")) return false;
  if (record.checkin !== undefined && (!record.checkin || typeof record.checkin !== "object" ||
    Array.isArray(record.checkin) || record.checkin.date !== key || !Array.isArray(record.checkin.answers) ||
    record.checkin.answers.some(answer => !answer || typeof answer !== "object" || typeof answer.questionId !== "string" || typeof answer.answer !== "string") ||
    (record.checkin.questions !== undefined && !Array.isArray(record.checkin.questions)))) return false;
  return true;
}

function readRecordStore(): { readable: boolean; records: Record<string, DailyRecord> } {
  try {
    if (typeof localStorage === "undefined") return { readable: false, records: {} };
    const raw = localStorage.getItem(KEY_RECORDS);
    if (raw === null) return { readable: true, records: {} };
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed) ||
      Object.entries(parsed).some(([key, value]) => !isStoredRecord(value, key)))
      return { readable: false, records: {} };
    return { readable: true, records: parsed as Record<string, DailyRecord> };
  } catch {
    // 原始字节必须保留；绝不能把损坏库当空库写回。
    return { readable: false, records: {} };
  }
}

export function isRecordStoreReadable(): boolean {
  return readRecordStore().readable;
}

/** 获取所有每日记录 */
export function getAllRecords(): Record<string, DailyRecord> {
  return readRecordStore().records;
}

/** 获取单日记录 */
export function getRecord(date: string): DailyRecord | undefined {
  const all = getAllRecords();
  return all[date];
}

/** 保存单日记录 */
export function saveRecord(record: DailyRecord): boolean {
  const store = readRecordStore();
  if (!store.readable) return false;
  const all = store.records;
  all[record.date] = record;
  return safeSetItem(KEY_RECORDS, JSON.stringify(all));
}

/** 删除单日记录 */
export function deleteRecord(date: string): boolean {
  const store = readRecordStore();
  if (!store.readable) return false;
  const all = store.records;
  delete all[date];
  return safeSetItem(KEY_RECORDS, JSON.stringify(all));
}

/** 清空所有记录 */
export function clearAllRecords(): boolean {
  return safeRemoveItem(KEY_RECORDS);
}

/** 获取日期列表（按日期降序） */
export function getRecordDates(): string[] {
  const all = getAllRecords();
  return Object.keys(all).sort((a, b) => b.localeCompare(a));
}

/** 获取日期范围内的记录 */
export function getRecordsInRange(startDate: string, endDate: string): DailyRecord[] {
  const all = getAllRecords();
  const result: DailyRecord[] = [];
  for (const date of Object.keys(all)) {
    if (date >= startDate && date <= endDate) {
      result.push(all[date]);
    }
  }
  return result.sort((a, b) => a.date.localeCompare(b.date));
}

// ========== 记忆 ==========

const KEY_MEMORIES = "qm_treehole_memories";

function readMemoryStore(): { readable: boolean; memories: TreeholeMemory[] } {
  try {
    if (typeof localStorage === "undefined") return { readable: false, memories: [] };
    const raw = localStorage.getItem(KEY_MEMORIES);
    if (raw === null) return { readable: true, memories: [] };
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.some(value => !value || typeof value !== "object" ||
      typeof value.id !== "string" || typeof value.fact !== "string" ||
      typeof value.sourceDate !== "string" || typeof value.consentScope !== "string" ||
      !Array.isArray(value.dimensions) || value.dimensions.some((item: unknown) => typeof item !== "string") ||
      (value.expiryAt !== null && typeof value.expiryAt !== "string")))
      return { readable: false, memories: [] };
    return { readable: true, memories: parsed as TreeholeMemory[] };
  } catch { return { readable: false, memories: [] }; }
}

/** 获取所有记忆 */
export function getAllMemories(): TreeholeMemory[] {
  return readMemoryStore().memories;
}

/** 保存记忆 */
export function saveMemory(memory: TreeholeMemory): boolean {
  const store = readMemoryStore();
  if (!store.readable) return false;
  const all = store.memories;
  const idx = all.findIndex((m) => m.id === memory.id);
  if (idx >= 0) {
    all[idx] = memory;
  } else {
    all.push(memory);
  }
  return safeSetItem(KEY_MEMORIES, JSON.stringify(all));
}

/** 批量保存记忆 */
export function saveMemories(memories: TreeholeMemory[]): boolean {
  const store = readMemoryStore();
  if (!store.readable) return false;
  const all = store.memories;
  for (const mem of memories) {
    const idx = all.findIndex((m) => m.id === mem.id);
    if (idx >= 0) {
      all[idx] = mem;
    } else {
      all.push(mem);
    }
  }
  return safeSetItem(KEY_MEMORIES, JSON.stringify(all));
}

/** 删除记忆 */
export function deleteMemory(id: string): boolean {
  const store = readMemoryStore();
  if (!store.readable) return false;
  const all = store.memories;
  const filtered = all.filter((m) => m.id !== id);
  return safeSetItem(KEY_MEMORIES, JSON.stringify(filtered));
}

/** 清空所有记忆 */
export function clearAllMemories(): boolean {
  return safeRemoveItem(KEY_MEMORIES);
}

/** 清理过期记忆 */
export function cleanupExpiredMemories(now: string): number {
  const store = readMemoryStore();
  if (!store.readable) return 0;
  const all = store.memories;
  const nowDate = new Date(now);
  const remaining = all.filter((m) => {
    if (!m.expiryAt) return true; // 长期记忆不删除
    return new Date(m.expiryAt) > nowDate;
  });
  const removed = all.length - remaining.length;
  if (removed > 0) {
    safeSetItem(KEY_MEMORIES, JSON.stringify(remaining));
  }
  return removed;
}

// ========== 题目曝光 ==========

const KEY_EXPOSURE = "qm_treehole_exposure";

function readExposureStore(): { readable: boolean; exposures: QuestionExposure[] } {
  try {
    if (typeof localStorage === "undefined") return { readable: false, exposures: [] };
    const raw = localStorage.getItem(KEY_EXPOSURE);
    if (raw === null) return { readable: true, exposures: [] };
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.some(value => !value || typeof value !== "object" ||
      typeof value.questionId !== "string" || typeof value.shownAt !== "string" ||
      typeof value.answered !== "boolean" || typeof value.skipped !== "boolean" ||
      typeof value.avoidToday !== "boolean")) return { readable: false, exposures: [] };
    return { readable: true, exposures: parsed as QuestionExposure[] };
  } catch { return { readable: false, exposures: [] }; }
}

/** 获取所有曝光记录 */
export function getAllExposures(): QuestionExposure[] {
  return readExposureStore().exposures;
}

/** 记录一次题目曝光 */
export function recordExposure(exposure: QuestionExposure): boolean {
  const store = readExposureStore();
  if (!store.readable) return false;
  const all = store.exposures;
  all.push(exposure);
  // 只保留最近 30 天的曝光记录
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const cutoffStr = cutoff.toISOString().split("T")[0];
  const filtered = all.filter((e) => e.shownAt >= cutoffStr);
  return safeSetItem(KEY_EXPOSURE, JSON.stringify(filtered));
}

/** 批量记录曝光 */
export function recordExposures(exposures: QuestionExposure[]): boolean {
  const store = readExposureStore();
  if (!store.readable) return false;
  const all = store.exposures;
  all.push(...exposures);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const cutoffStr = cutoff.toISOString().split("T")[0];
  const filtered = all.filter((e) => e.shownAt >= cutoffStr);
  return safeSetItem(KEY_EXPOSURE, JSON.stringify(filtered));
}

/** 清空曝光记录 */
export function clearExposures(): boolean {
  return safeRemoveItem(KEY_EXPOSURE);
}

// ========== Context Capsule ==========

const KEY_CAPSULE = "qm_treehole_capsule";

function readCapsuleStore(): { readable: boolean; capsule: ContextCapsule | null } {
  try {
    if (typeof localStorage === "undefined") return { readable: false, capsule: null };
    const raw = localStorage.getItem(KEY_CAPSULE);
    if (raw === null) return { readable: true, capsule: null };
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return { readable: false, capsule: null };
    const capsule = parsed as Partial<ContextCapsule>;
    if (typeof capsule.date !== "string" || typeof capsule.moodSummary !== "string" ||
      typeof capsule.energySummary !== "string" || typeof capsule.expiresAt !== "string" ||
      !Number.isFinite(Date.parse(capsule.expiresAt)) ||
      typeof capsule.consentScope !== "string" || !Array.isArray(capsule.topThemes) ||
      capsule.topThemes.some(theme => typeof theme !== "string") ||
      !Array.isArray(capsule.unresolvedThreads) ||
      capsule.unresolvedThreads.some(thread => typeof thread !== "string")) return { readable: false, capsule: null };
    return { readable: true, capsule: capsule as ContextCapsule };
  } catch { return { readable: false, capsule: null }; }
}

/** 获取当前 Context Capsule */
export function getContextCapsule(): ContextCapsule | null {
  const capsule = readCapsuleStore().capsule;
  // 检查是否过期
  if (capsule && new Date(capsule.expiresAt) < new Date()) {
    safeRemoveItem(KEY_CAPSULE);
    return null;
  }
  return capsule;
}

/** 保存 Context Capsule */
export function saveContextCapsule(capsule: ContextCapsule): boolean {
  if (!readCapsuleStore().readable) return false;
  return safeSetItem(KEY_CAPSULE, JSON.stringify(capsule));
}

/** 删除 Context Capsule */
export function clearContextCapsule(): boolean {
  return safeRemoveItem(KEY_CAPSULE);
}

// ========== 日记草稿 ==========

const KEY_DRAFT = "qm_treehole_draft";
const diaryDraftKey = (date: string) => `${KEY_DRAFT}_${date}`;
function readRawDiaryDraft(key: string): { readable: boolean; raw: string | null } {
  try {
    if (typeof localStorage === "undefined") return { readable: false, raw: null };
    return { readable: true, raw: localStorage.getItem(key) };
  } catch { return { readable: false, raw: null }; }
}
function parseDiaryDraft(raw: string | null, date: string): DiaryDraft | null {
  if (raw === null) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const draft = value as Partial<DiaryDraft>;
      if (draft.date === date && typeof draft.text === "string" && typeof draft.savedAt === "string")
        return draft as DiaryDraft;
    }
  } catch { /* 留原件，不把格式异常当作空草稿写回。 */ }
  return null;
}

/** 获取今日草稿 */
export function getDiaryDraft(date: string): DiaryDraft | null {
  const raw = safeGetItem(diaryDraftKey(date)) ?? safeGetItem(KEY_DRAFT);
  return parseDiaryDraft(raw, date);
}

/** 当前日期草稿的原始快照，供同设备多标签在写入前检查是否已变化。 */
export function getDiaryDraftRaw(date: string): string | null {
  return safeGetItem(diaryDraftKey(date));
}

/** 保存草稿（30秒自动保存使用） */
export function saveDiaryDraft(date: string, text: string, expectedRaw?: string | null): boolean {
  const key = diaryDraftKey(date);
  const current = readRawDiaryDraft(key);
  if (!current.readable || (current.raw !== null && !parseDiaryDraft(current.raw, date))) return false;
  if (expectedRaw !== undefined && current.raw !== expectedRaw) return false;
  const draft: DiaryDraft = {
    date,
    text,
    savedAt: new Date().toISOString(),
  };
  return safeSetItem(key, JSON.stringify(draft));
}

/** 清除草稿 */
export function clearDiaryDraft(date: string): boolean {
  // 清理本日新键；早期单键仅在确属同一天时清理，不删除其他日期的旧草稿。
  const key = diaryDraftKey(date);
  const current = readRawDiaryDraft(key);
  if (!current.readable || (current.raw !== null && !parseDiaryDraft(current.raw, date))) return false;
  const legacy = readRawDiaryDraft(KEY_DRAFT);
  if (!legacy.readable) return false;
  let legacyDate: string | null = null;
  if (legacy.raw !== null) {
    try {
      const parsed: unknown = JSON.parse(legacy.raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed) ||
        typeof (parsed as Partial<DiaryDraft>).date !== "string") return false;
      legacyDate = (parsed as DiaryDraft).date;
      if (!parseDiaryDraft(legacy.raw, legacyDate)) return false;
    } catch { return false; }
  }
  if (!safeRemoveItem(key)) return false;
  return legacyDate !== date || safeRemoveItem(KEY_DRAFT);
}

// ========== 设置 ==========

const KEY_SETTINGS = "qm_treehole_settings";

function readSettingsStore(): { readable: boolean; settings: Partial<TreeholeSettings> } {
  try {
    if (typeof localStorage === "undefined") return { readable: false, settings: {} };
    const raw = localStorage.getItem(KEY_SETTINGS);
    if (raw === null) return { readable: true, settings: {} };
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return { readable: false, settings: {} };
    const settings = parsed as Partial<TreeholeSettings>;
    if ((settings.longTermMemoryEnabled !== undefined && typeof settings.longTermMemoryEnabled !== "boolean") ||
      (settings.bridgeToChatEnabled !== undefined && typeof settings.bridgeToChatEnabled !== "boolean") ||
      (settings.weatherAuthorized !== undefined && typeof settings.weatherAuthorized !== "boolean"))
      return { readable: false, settings: {} };
    return { readable: true, settings };
  } catch { return { readable: false, settings: {} }; }
}

/** 获取用户设置 */
export function getSettings(): TreeholeSettings {
  const store = readSettingsStore();
  // 设置不可读时保留原字节，桥接按保守值返回；不可把损坏设置当成新的授权。
  return store.readable ? { ...DEFAULT_SETTINGS, ...store.settings } : { ...DEFAULT_SETTINGS, bridgeToChatEnabled: false };
}

/** 更新设置 */
export function updateSettings(patch: Partial<TreeholeSettings>): boolean {
  const store = readSettingsStore();
  if (!store.readable) return false;
  const current = { ...DEFAULT_SETTINGS, ...store.settings };
  const updated = { ...current, ...patch };
  return safeSetItem(KEY_SETTINGS, JSON.stringify(updated));
}

// ========== 工具函数 ==========

/**
 * 获取今日日期字符串 YYYY-MM-DD
 */
export function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * 格式化日期为中文显示（固定 Asia/Shanghai，服务端/客户端一致且=北京时间）
 */
export function formatDateChinese(dateStr: string): string {
  const date = new Date(dateStr);
  const parts = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "long",
  }).formatToParts(date);
  const pick = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${pick("year")}年${pick("month")}月${pick("day")}日 ${pick("weekday")}`;
}

/**
 * 检查存储是否可用
 */
export function isStorageAvailable(): boolean {
  try {
    if (typeof localStorage === "undefined") return false;
    const testKey = "__qm_storage_test__";
    localStorage.setItem(testKey, "1");
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * 清空所有树洞数据（隐私操作）
 */
export function clearAllTreeholeData(): boolean {
  const keys = [KEY_RECORDS, KEY_MEMORIES, KEY_EXPOSURE, KEY_CAPSULE, KEY_DRAFT, KEY_SETTINGS];
  let success = true;
  try {
    for (let index = localStorage.length - 1; index >= 0; index--) {
      const key = localStorage.key(index);
      if ((key?.startsWith("qm_treehole_checkin_draft_") || key?.startsWith(`${KEY_DRAFT}_`)) && !safeRemoveItem(key)) success = false;
    }
  } catch { success = false; }
  for (const k of keys) {
    if (!safeRemoveItem(k)) success = false;
  }
  // 树洞带去小酷的待消费摘要属于派生敏感数据；只删树洞来源，不碰其他模块的待发送内容。
  try {
    const pendingKey = "qm_pending_xiaoku_context_v1";
    const raw = localStorage.getItem(pendingKey);
    if (raw !== null) {
      const pending: unknown = JSON.parse(raw);
      if (!pending || typeof pending !== "object" || Array.isArray(pending) ||
        typeof (pending as { source?: unknown }).source !== "string") success = false;
      else if ((pending as { source: string }).source === "treehole" && !safeRemoveItem(pendingKey)) success = false;
    }
  } catch { success = false; }
  return success;
}
