import { searchRealtime } from "./search";
import type { CachedSearchResponse, RealtimeSearchResponse, SearchOptions } from "./types";

const TTL_MS = 30 * 60 * 1000;
const MAX_ENTRIES = 100;

interface CacheEntry {
  value: RealtimeSearchResponse;
  timestamp: number;
  lastAccess: number;
}

const cache = new Map<string, CacheEntry>();

function normalizeQuery(query: string, options: SearchOptions): string {
  return `${query.trim().toLowerCase().replace(/\s+/g, " ")}::${options.intent || "general"}::${options.freshnessRequired ? "fresh" : "normal"}`;
}

function evictIfNeeded(): void {
  if (cache.size <= MAX_ENTRIES) return;
  let oldestKey: string | null = null;
  let oldestAccess = Infinity;
  for (const [key, entry] of cache.entries()) {
    if (entry.lastAccess < oldestAccess) {
      oldestAccess = entry.lastAccess;
      oldestKey = key;
    }
  }
  if (oldestKey) cache.delete(oldestKey);
}

export async function cachedSearch(query: string, options: SearchOptions = {}): Promise<CachedSearchResponse> {
  const started = Date.now();
  const key = normalizeQuery(query, options);
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && now - hit.timestamp < TTL_MS) {
    hit.lastAccess = now;
    return { ...hit.value, cacheHit: true, durationMs: Date.now() - started };
  }
  if (hit) cache.delete(key);

  const value = await searchRealtime(query, options);
  // 只有通过验证且非 insufficient 的结果才缓存；避免错误命中/瞬时旧闻污染 30 分钟。
  if (value.results.length > 0 && value.verification.confidence !== "insufficient") {
    cache.set(key, { value, timestamp: now, lastAccess: now });
    evictIfNeeded();
  }
  return { ...value, cacheHit: false, durationMs: Date.now() - started };
}

export function getRealtimeCacheSize(): number {
  return cache.size;
}
