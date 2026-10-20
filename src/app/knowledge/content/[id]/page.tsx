import LegacyContentPage from "@/components/articles-ui/legacy-content-page";
import { ArticleDetail } from "@/components/articles-ui/detail";
import { articles } from "@/components/articles-ui/data";

export default async function ContentPage({ params }: { params: Promise<{id: string}> }) {
  const { id } = await params;
  if (process.env.QM_ARTICLES_REVIEW_CANDIDATE === "true" && (id === "A03" || id === "A04")) {
    const article = articles.find(item => item.id === id)!;
    return <ArticleDetail article={article} />;
  }
  return <LegacyContentPage />;
}
