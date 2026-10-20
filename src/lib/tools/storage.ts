// QM 自助工具 v3.0 - localStorage 持久化层
// POC 阶段：只存使用事实 + 用户主动反馈，不存 AI 推断
// localStorage key: "qm_selfhelp_v3"

import type {
  ToolEvent,
  ToolEventType,
  ToolEventSource,
  ToolEventMetrics,
  ToolEventConsent,
} from "./types";

const STORAGE_KEY = "qm_selfhelp_v3";
const FAVORITES_KEY = "qm_selfhelp_v3_favorites";
const SETTINGS_KEY = "qm_selfhelp_v3_settings";

// URL 允许的参数白名单
export const URL_ALLOWLIST = ["tool_id", "source", "resume"];

// URL 禁止的参数
export const URL_FORBIDDEN = [
  "user_note",
  "emotion_text",
  "health_data",
  "relationship_details",
];

export interface ToolStorageData {
  events: ToolEvent[];
  version: string;
  schema_version: "3.0";
}

export interface ToolSettings {
  tool_recommendations_enabled: boolean;
  share_with_xiaoku_default: boolean;
  last_rejected_tool_at?: number;
  rejected_tool_ids: string[];
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function generateEventId(): string {
  return (
    "evt_" +
    Date.now().toString(36) +
    "_" +
    Math.random().toString(36).substring(2, 10)
  );
}

function getDeviceId(): string {
  if (!isBrowser()) return "unknown";
  let deviceId = localStorage.getItem("qm_device_id");
  if (!deviceId) {
    deviceId = "dev_" + Math.random().toString(36).substring(2, 16);
    localStorage.setItem("qm_device_id", deviceId);
  }
  return deviceId;
}

// ===== 存储读写 =====

function readStorage(): ToolStorageData {
  if (!isBrowser()) {
    return { events: [], version: "v3.0", schema_version: "3.0" };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { events: [], version: "v3.0", schema_version: "3.0" };
    const parsed = JSON.parse(raw) as ToolStorageData;
    if (!parsed.events) parsed.events = [];
    return parsed;
  } catch {
    return { events: [], version: "v3.0", schema_version: "3.0" };
  }
}

function writeStorage(data: ToolStorageData): boolean {
  if (!isBrowser()) return false;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    // 存储已满或不可用（如隐私模式），返回失败供 UI 显式反馈，不静默假成功
    return false;
  }
}

// ===== 事件操作 =====

/** 保存工具事件 */
export function saveEvent(params: {
  tool_id: string;
  event_type: ToolEventType;
  source: ToolEventSource;
  metrics?: ToolEventMetrics;
  user_note?: string;
  consent?: Partial<ToolEventConsent>;
}): ToolEvent {
  return buildAndSaveEvent(params).event;
}

/** 保存工具事件并返回落盘结果（UI 显式反馈保存失败用，B4-TOOL-F07） */
export function saveEventSafe(params: {
  tool_id: string;
  event_type: ToolEventType;
  source: ToolEventSource;
  metrics?: ToolEventMetrics;
  user_note?: string;
  consent?: Partial<ToolEventConsent>;
}): { event: ToolEvent; saved: boolean } {
  return buildAndSaveEvent(params);
}

function buildAndSaveEvent(params: {
  tool_id: string;
  event_type: ToolEventType;
  source: ToolEventSource;
  metrics?: ToolEventMetrics;
  user_note?: string;
  consent?: Partial<ToolEventConsent>;
}): { event: ToolEvent; saved: boolean } {
  const event: ToolEvent = {
    event_id: generateEventId(),
    user_or_device_id: getDeviceId(),
    tool_id: params.tool_id,
    event_type: params.event_type,
    timestamp: new Date().toISOString(),
    source: params.source,
    metrics: params.metrics,
    user_note: params.user_note,
    consent: {
      save_to_device: params.consent?.save_to_device !== false,
      share_summary_with_xiaoku: params.consent?.share_summary_with_xiaoku === true,
    },
  };

  if (event.consent.save_to_device) {
    const data = readStorage();
    data.events.push(event);
    return { event, saved: writeStorage(data) };
  }
  // 用户不同意落盘时不写设备，视为已处理
  return { event, saved: true };
}

/** 获取所有事件 */
export function getEvents(toolId?: string): ToolEvent[] {
  const data = readStorage();
  let events = data.events;
  if (toolId) {
    events = events.filter((e) => e.tool_id === toolId);
  }
  // 按时间倒序
  return [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

/** 删除某个事件 */
export function deleteEvent(eventId: string): boolean {
  const data = readStorage();
  const initial = data.events.length;
  data.events = data.events.filter((e) => e.event_id !== eventId);
  writeStorage(data);
  return data.events.length < initial;
}

/** 清空所有工具事件 */
export function clearAllEvents(): void {
  const data = readStorage();
  data.events = [];
  writeStorage(data);
}

// ===== 历史记录 =====

export interface HistoryItem {
  event_id: string;
  tool_id: string;
  tool_name: string;
  event_type: ToolEventType;
  timestamp: string;
  time_spent_sec?: number;
  helpfulness?: number;
}

/** 获取使用历史（完成或停止的事件） */
export function getHistory(): HistoryItem[] {
  const events = getEvents().filter(
    (e) => e.event_type === "completed" || e.event_type === "stopped"
  );
  return events.map((e) => ({
    event_id: e.event_id,
    tool_id: e.tool_id,
    tool_name: "", // 由调用方根据tool_id补充
    event_type: e.event_type,
    timestamp: e.timestamp,
    time_spent_sec: e.metrics?.time_spent_sec,
    helpfulness: e.metrics?.helpfulness,
  }));
}

// ===== 收藏 =====

export function getFavorites(): string[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function toggleFavorite(toolId: string): boolean {
  if (!isBrowser()) return false;
  const favs = getFavorites();
  const index = favs.indexOf(toolId);
  if (index > -1) {
    favs.splice(index, 1);
  } else {
    favs.push(toolId);
  }
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
  return index === -1; // 返回新状态：true=已收藏
}

export function isFavorite(toolId: string): boolean {
  return getFavorites().includes(toolId);
}

// ===== 设置 =====

export function getToolSettings(): ToolSettings {
  if (!isBrowser()) {
    return {
      tool_recommendations_enabled: true,
      share_with_xiaoku_default: false,
      rejected_tool_ids: [],
    };
  }
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      return {
        tool_recommendations_enabled: true,
        share_with_xiaoku_default: false,
        rejected_tool_ids: [],
      };
    }
    return JSON.parse(raw) as ToolSettings;
  } catch {
    return {
      tool_recommendations_enabled: true,
      share_with_xiaoku_default: false,
      rejected_tool_ids: [],
    };
  }
}

export function updateToolSettings(updates: Partial<ToolSettings>): void {
  if (!isBrowser()) return;
  const current = getToolSettings();
  const updated = { ...current, ...updates };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
}

/** 记录用户拒绝了某个工具推荐 */
export function recordToolRejection(toolId: string): void {
  const settings = getToolSettings();
  const rejected = [...new Set([...settings.rejected_tool_ids, toolId])];
  // 最多保留最近20个拒绝记录
  if (rejected.length > 20) rejected.shift();
  updateToolSettings({
    rejected_tool_ids: rejected,
    last_rejected_tool_at: Date.now(),
  });
}

/** 用户是否关闭了工具推荐 */
export function isToolRecommendationDisabled(): boolean {
  return !getToolSettings().tool_recommendations_enabled;
}

// ===== URL 安全校验 =====

/** 校验 URL 参数是否在白名单内 */
export function validateUrlParams(params: Record<string, string>): {
  valid: boolean;
  forbidden_params: string[];
} {
  const forbidden = Object.keys(params).filter(
    (key) => !URL_ALLOWLIST.includes(key)
  );
  return {
    valid: forbidden.length === 0,
    forbidden_params: forbidden,
  };
}

// ===== Context Capsule（工具 → 小酷） =====

export interface ContextCapsuleData {
  tool_id: string;
  tool_name: string;
  completion_status: "completed" | "stopped" | "paused";
  helpfulness?: number;
  user_note?: string;
  current_need_summary?: string;
}

const CONTEXT_CAPSULE_KEY = "qm_selfhelp_v3_context_capsule";

/** 保存 Context Capsule（用户授权时才保存） */
export function saveContextCapsule(capsule: ContextCapsuleData): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(CONTEXT_CAPSULE_KEY, JSON.stringify(capsule));
  } catch {
    // ignore
  }
}

/** 读取并清除 Context Capsule（一次性消费） */
export function consumeContextCapsule(): ContextCapsuleData | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(CONTEXT_CAPSULE_KEY);
    if (!raw) return null;
    const capsule = JSON.parse(raw) as ContextCapsuleData;
    localStorage.removeItem(CONTEXT_CAPSULE_KEY);
    return capsule;
  } catch {
    return null;
  }
}

/** 只读取不清空 */
export function peekContextCapsule(): ContextCapsuleData | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(CONTEXT_CAPSULE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ContextCapsuleData;
  } catch {
    return null;
  }
}
