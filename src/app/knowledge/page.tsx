import { Catalogue } from "@/components/articles-ui/catalogue";
import { cards } from "@/components/articles-ui/data";
import KnowledgePageClient from "./knowledge-page-client";
import { getExploreRecommendations } from "@/lib/kb/kb-recommend";

// 每次真实访问继续使用原随机推荐；客户端不重复随机导致水合差异。
export const dynamic = "force-dynamic";

export default function KnowledgePage() {
  if (process.env.QM_ARTICLES_REVIEW_CANDIDATE === "true") return <Catalogue cards={cards} />;
  return <KnowledgePageClient exploreRecs={getExploreRecommendations(5)} />;
}
