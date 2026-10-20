export type RealtimeSourceKind = "reported" | "claim" | "reaction";
export type RealtimeIntent = "news" | "weather" | "traffic" | "general_realtime";
export type SourceReliability = "official" | "established_media" | "general" | "ugc" | "unknown";
export type VerificationConfidence = "high" | "medium" | "low" | "insufficient";

export interface RealtimeSearchResult {
  title: string;
  url: string;
  source: string;
  publishedAt?: string;
  snippet: string;
  sourceKind: RealtimeSourceKind;
  reliability: SourceReliability;
  relevanceScore?: number;
  freshnessScore?: number;
}

export interface RealtimeVerification {
  confidence: VerificationConfidence;
  accepted: boolean;
  independentSourceCount: number;
  officialSourceCount: number;
  datedSourceCount: number;
  freshSourceCount: number;
  conflictDetected: boolean;
  possibleEntityMismatch: boolean;
  staleRisk: boolean;
  issues: string[];
  secondarySearchUsed: boolean;
  evidenceNote: string;
}

export interface RealtimeSearchResponse {
  results: RealtimeSearchResult[];
  summary?: string;
  provider: "coze-volcengine-internet-search";
  searchedAt: string;
  verification: RealtimeVerification;
}

export interface SearchDecision {
  shouldSearch: boolean;
  query: string;
  reason: string;
  freshnessRequired: boolean;
  intent: RealtimeIntent;
}

export interface SearchOptions {
  freshnessRequired?: boolean;
  intent?: RealtimeIntent;
}

export interface CachedSearchResponse extends RealtimeSearchResponse {
  cacheHit: boolean;
  durationMs: number;
}

export interface RealtimeMessage {
  role: "system" | "user" | "assistant";
  content: string;
}
