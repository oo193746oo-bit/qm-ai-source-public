// ============================================================
// R3.8 / F-1 危机资源跨轮保持（P1 安全）
// 依据：02_UIUX批次/危机修复R38_20261003/R38_F1方案稿_危机资源跨轮保持_20261003.md
// 边界铁律：
//  1. 不改 crisis-hardgates.ts（R3.7 硬闸）——本模块只管"报警后的持续陪伴"
//  2. 不改当轮文案主体与 R3.7 判定逻辑；资源行由独立组件在响应尾部附加
//  3. 不做自动"好转判定"退出；TTL 自然过期才静默退出
//  4. 号码纪律：仅授权清单号码（12356 / 15001930070）；queermental2 不进资源行
// 存储：模块级内存 Map + TTL（route 无状态转发架构下的最小实现；
//       单实例部署生命周期内有效，与现有架构一致）
// ============================================================

export type PersistLevel = "direct" | "gentle";

export interface CrisisPersistState {
  level: PersistLevel;   // 当前生效级别（升级就高）
  first_seen: number;    // 首次触发时间戳 ms
  last_seen: number;     // 最近一次触发/刷新时间戳 ms
  ttl_ms: number;        // 距 last_seen 的有效时长
}

const TTL_MS: Record<PersistLevel, number> = {
  direct: 72 * 60 * 60 * 1000,  // direct/means/imminent 类：72h
  gentle: 24 * 60 * 60 * 1000,  // gentle 类：24h
};

// 用户主动安全出口后的降级 TTL（保守：不立即清零，只缩短）
const SAFE_EXIT_TTL_MS = 2 * 60 * 60 * 1000; // 2h 内仍保持轻资源行

const store = new Map<string, CrisisPersistState>();
let lastSweepAt = 0;

function sweep(now: number) {
  if (now - lastSweepAt < 10 * 60 * 1000 && store.size < 5000) return;
  lastSweepAt = now;
  for (const [k, v] of store) {
    if (now - v.last_seen > v.ttl_ms) store.delete(k);
  }
}

// ---------- 会话键 ----------
// 优先级：显式会话参数（body）> 请求头 > bot+IP 兜底（同 IP 视为同会话，保守侧偏宽）
export function sessionKeyFrom(
  req: Request,
  botId: string,
  body: Record<string, unknown> | null
): string {
  const b = body || {};
  const explicit =
    (typeof b.conversationId === "string" && b.conversationId) ||
    (typeof b.conversation_id === "string" && b.conversation_id) ||
    (typeof b.sessionId === "string" && b.sessionId) ||
    (typeof b.session_id === "string" && b.session_id);
  if (explicit) return `${botId}:c:${explicit}`;
  const hdr = req.headers.get("x-qm-session") || req.headers.get("x-session-id");
  if (hdr) return `${botId}:c:${hdr}`;
  const fwd = req.headers.get("x-forwarded-for") || "";
  const ip = fwd.split(",")[0].trim() || req.headers.get("x-real-ip") || "anon";
  return `${botId}:ip:${ip}`;
}

// ---------- 状态写入 / 刷新 ----------
// 危机轮触发时调用；TTL 内再次触发 → 刷新 last_seen，level 升级就高
export function recordCrisisHit(key: string, level: PersistLevel) {
  const now = Date.now();
  sweep(now);
  const prev = store.get(key);
  const stillActive = prev && now - prev.last_seen <= prev.ttl_ms;
  const effLevel: PersistLevel =
    level === "direct" ? "direct" : stillActive && prev!.level === "direct" ? "direct" : "gentle";
  store.set(key, {
    level: effLevel,
    first_seen: stillActive && prev ? prev.first_seen : now,
    last_seen: now,
    ttl_ms: TTL_MS[effLevel],
  });
}

// 用户主动表达当下安全：降级 gentle + 缩短 TTL（保守，不立即清零）
export function markSafeExit(key: string): boolean {
  const now = Date.now();
  const prev = store.get(key);
  if (!prev || now - prev.last_seen > prev.ttl_ms) return false;
  store.set(key, { ...prev, level: "gentle", last_seen: now, ttl_ms: SAFE_EXIT_TTL_MS });
  return true;
}

// TTL 内有效状态；过期静默清除（不自动好转判定，到点即出）
export function getActiveCrisis(key: string): CrisisPersistState | null {
  const now = Date.now();
  const v = store.get(key);
  if (!v) return null;
  if (now - v.last_seen > v.ttl_ms) {
    store.delete(key);
    return null;
  }
  return v;
}

// ---------- 轻资源行 ----------
// 号码纪律：仅授权清单（12356 / 15001930070）
export const LIGHT_RESOURCE_LINE =
  "如果此刻很难，可以拨打 24 小时心理援助热线 12356，或联系 QM 心理支持 15001930070。你现在不是一个人。";

// 用户主动安全出口（保守匹配明确短语；阿花 QA 附加条件）
export const SAFE_EXIT_RE =
  /(我(现在|今晚|今天|这会儿)?(没事|安全|好)了|没事了|伤口(已经)?(处理好了|包好了)|处理好了伤口|今晚有朋友(陪|在)|朋友(今晚)?陪我|家人(今晚)?陪我|已经(回家|到(家|医院)了))/;
