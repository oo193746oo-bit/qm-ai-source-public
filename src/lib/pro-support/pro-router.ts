import { loadDossiers } from "./pro-support-kb-loader";
import { searchPro } from "./pro-retrieval";

export interface ProClassify {
  isPro: boolean;
  topicId?: string;
  routeLabel: string;
  source: "hardQA" | "retrieval" | "general";
  matchedPhrase?: string;
}

/** 本地确定性专业路由：先扫各卷宗 Hard QA，再回退 BM25 检索；零 LLM。判错不阻断（兜底 GENERAL）。 */
export function classifyPro(text: string): ProClassify {
  const dossiers = loadDossiers();
  for (const d of dossiers) {
    for (const qa of d.hardQA) {
      if (text.includes(qa.phrase)) {
        return { isPro: true, topicId: d.id, routeLabel: qa.label, source: "hardQA", matchedPhrase: qa.phrase };
      }
    }
  }
  const hits = searchPro(text, 1);
  if (hits.length > 0 && hits[0].score > 0 && !hits[0].suppressed) {
    return { isPro: true, topicId: hits[0].dossier.id, routeLabel: "ALLOW_TOPIC_SOURCE_AWARE", source: "retrieval" };
  }
  return { isPro: false, routeLabel: "GENERAL", source: "general" };
}

export function hotspotCrisisLabel(label: string): boolean {
  return /^SAFETY_(ROUTE|CRISIS|THIRD_PERSON)/i.test(label) || /_CRISIS_/i.test(label);
}