export { shouldSearch } from "./should-search";
export { cachedSearch, getRealtimeCacheSize } from "./cache";
export { formatRealtimeResults } from "./format";
export { verifySearchResults, classifyReliability } from "./verify";
export type {
  SearchDecision,
  RealtimeSearchResult,
  CachedSearchResponse,
  RealtimeMessage,
  RealtimeIntent,
  RealtimeVerification,
  SearchOptions,
  SourceReliability,
  VerificationConfidence,
} from "./types";
