import Link from "next/link";
import { Fragment } from "react";
import { ArticleCard, Legal } from "./catalogue";
import { cards } from "./data";
import { Scene } from "./scene";
import s from "./articles.module.css";

type Article = { id: string; reader_h1: string; card_summary: string; topic_label: string; public_body_markdown: string; public_body_sha256: string };
function inline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => part.startsWith("**") ? <strong key={index}>{part.slice(2, -2)}</strong> : part);
}
export function ArticleDetail({ article }: { article: Article }) {
  let chapter = 0;
  const blocks = article.public_body_markdown.trim().split(/\n\s*\n/);
  const related = cards.filter(card => card.id === (article.id === "A03" ? "A04" : "A03") || card.id === "S04");
  return <div className={s.surface}><main className={s.page} data-articles-review="isolated-fixture" data-article-id={article.id}>
    <Link className={s.back} href="/knowledge">← 返回科普文章</Link>
    <header className={s.heading}><p className={s.label}>{article.topic_label}</p><h1>{article.reader_h1}</h1><p className={s.summary}>{article.card_summary}</p></header>
    <div className={s.reading}><Scene article={article.id} chapter={0} />
      <article className={s.body} data-body-sha={article.public_body_sha256}>
        {blocks.map((block, index) => {
          if (block.startsWith("# ")) return null; // The identical H1 is rendered once above.
          if (block === "## 导言") return <h2 key={index} className={s.srOnly}>导言</h2>;
          if (block.startsWith("## ")) {
            chapter += 1;
            return <Fragment key={index}><h2>{inline(block.slice(3))}</h2><Scene article={article.id} chapter={chapter} /></Fragment>;
          }
          return <p key={index} className={article.id === "A03" && (block.startsWith("检查有它检查的时间") || block.startsWith("下次胸口又不舒服")) ? s.medical : undefined}>{inline(block)}</p>;
        })}
      </article><div className={s.ending}><Link className={s.read} href="/knowledge">返回文章列表　←</Link></div>
    </div>
    <section className={s.related}><h2>继续了解</h2><div className={s.grid}>{related.map(card => <ArticleCard key={card.id} card={card} />)}</div></section><Legal />
  </main></div>;
}
