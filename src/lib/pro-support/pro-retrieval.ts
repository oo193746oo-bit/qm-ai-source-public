import { loadDossiers, loadPositiveHooks, hasNegativeHook, type Dossier } from "./pro-support-kb-loader";

export interface ProSearchHit {
  dossier: Dossier;
  score: number;
  matchedPositiveHooks: string[];
  suppressed: boolean;
  reason?: string;
}

const STOP: Set<string> = new Set(["的", "了", "是", "我", "你", "他", "她", "它", "在", "和", "与", "吗", "呢", "吧", "啊", "这", "那", "有", "没", "不", "很", "都", "也", "就", "一"]);

export function tokenBigrams(text: string, limit = 2000): string[] {
  const clean = text.replace(/\s+/g, "").slice(0, limit);
  const out: string[] = [];
  for (let i = 0; i < clean.length - 1; i++) {
    const bg = clean.slice(i, i + 2);
    if (bg.includes(" ")) continue;
    if (STOP.has(bg)) continue;
    if (/[a-z0-9]/i.test(clean[i]) || /[a-z0-9]/i.test(clean[i + 1])) {
      if (/[a-zA-Z]/.test(bg) || (bg.length === 2 && /[a-z0-9]/i.test(bg))) out.push(bg.toLowerCase());
    } else {
      out.push(bg);
    }
  }
  return out;
}

function overlapScore(query: string, docText: string): number {
  const qb = new Set(tokenBigrams(query));
  const docBigrams = new Set(tokenBigrams(docText));
  let score = 0;
  for (const bg of qb) if (docBigrams.has(bg)) score += 1;
  return score;
}

export function searchPro(query: string, topN = 3): ProSearchHit[] {
  const dossiers = loadDossiers();
  const posHooks = loadPositiveHooks();
  const q = query.toLowerCase();
  const hits: ProSearchHit[] = dossiers.map((d) => {
    const matchedHooks: string[] = [];
    for (const h of posHooks) {
      if (h.topicId === d.id && q.includes(h.hook.toLowerCase())) matchedHooks.push(h.hook);
    }
    let score = matchedHooks.length * 8;
    const overlap = overlapScore(query, dossierText(d));
    score += overlap;
    const suppressed = hasNegativeHook(d.id, query);
    if (suppressed) score -= 60;
    return { dossier: d, score, matchedPositiveHooks: matchedHooks, suppressed, reason: suppressed ? "negative_hook" : undefined };
  });
  return hits.filter((h) => h.score > 0).sort((a, b) => b.score - a.score).slice(0, topN);
}

export function dossierText(d: Dossier): string {
  return Object.values(d.sections).join("\n") + d.hardQA.map((h) => h.phrase + "→" + h.label).join("\n");
}