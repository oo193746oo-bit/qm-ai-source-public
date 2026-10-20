"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Card } from "./types";
import s from "./articles.module.css";
import { acceptedCoverImages } from "./image-map";

const version = "dbeec24b3f5561dd6ff6ac2ea036eb57a4bfc777b8194b4d00e85e6ba736a955";
const storageKey = "qm-articles-review-" + version;
const topics = ["全部", "情绪与身心", "关系与家庭", "身份与文化", "工作与生活", "心理知识与求助"];
// Presentation-only fixture membership; never feeds the public registry or ranking.
const membership: Record<string, string[]> = {
  "情绪与身心": ["A03", "A04", "A05", "A08", "D01", "D02", "D03"],
  "关系与家庭": ["B01", "B02", "B05", "B06", "B09", "C04", "C07", "D07", "B03", "B04", "B07", "B08", "D05"],
  "身份与文化": ["C01", "C02", "C03", "C04", "C05", "C06", "C07", "C08"],
  "工作与生活": ["A01", "A02", "A06", "A07", "A08", "C06"],
  "心理知识与求助": ["D01", "D02", "D03", "D04", "D06", "S01", "S02", "S03", "S04", "C08"],
};

export function Legal() {
  return <footer className={s.legal}>{[["隐私政策", "/privacy"], ["用户协议", "/terms"], ["免责声明", "/disclaimer"], ["数据留存与删除", "/data-deletion"]].map(([title, href]) => <Link key={href} href={href}>{title}</Link>)}</footer>;
}

export function ArticleCard({ card, remember }: { card: Card; remember?: (id: string) => void }) {
  const available = card.id === "A03" || card.id === "A04";
  const image = acceptedCoverImages[card.id];
  return <article className={s.card} data-article-id={card.id}>
    <div aria-hidden="true" className={s.cardImage} style={image ? { backgroundImage: `url("${image.source}")`, backgroundSize: "cover", backgroundPosition: image.position } : { backgroundPosition: `${(card.index % 6) * 20}% ${(Math.floor(card.index / 6) * 281 + 60) / 1546 * 100}%` }} />
    <div className={s.copy}><p className={s.label}>{card.topic_label}</p><h2>{card.card_title}</h2><p className={s.cardSummary}>{card.card_summary}</p>
      {available ? <Link id={`read-${card.id}`} className={s.read} href={`/knowledge/content/${card.id}`} onClick={() => remember?.(card.id)}>阅读全文 <span aria-hidden="true">→</span></Link> : <span className={s.read} aria-disabled="true">阅读全文 <span aria-hidden="true">→</span></span>}
    </div>
  </article>;
}

type Saved = { topic: string; count: number; y: number; focus: string };
export function Catalogue({ cards }: { cards: Card[] }) {
  const [topic, setTopic] = useState("全部");
  const [count, setCount] = useState(8);
  const [phase, setPhase] = useState<"ready" | "loading" | "error">("ready");
  const busy = useRef(false);
  const endStatus = useRef<HTMLParagraphElement>(null);
  const focusEnd = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const current = useRef({ topic, count });
  current.current = { topic, count };
  const filtered = topic === "全部" ? cards : (membership[topic] || []).map(id => cards.find(card => card.id === id)!);
  const visible = filtered.slice(0, count);
  function remember(focus = "") {
    try { sessionStorage.setItem(storageKey, JSON.stringify({ ...current.current, y: window.scrollY, focus })); } catch { /* Storage refusal must not prevent reading. */ }
  }
  useEffect(() => {
    let saved: Saved | null = null;
    try { saved = JSON.parse(sessionStorage.getItem(storageKey) || "null"); } catch { /* optional visit memory */ }
    if (saved && topics.includes(saved.topic) && Number.isInteger(saved.count) && saved.count >= 8 && saved.count <= 40) {
      const restore = saved;
      setTopic(restore.topic); setCount(restore.count);
      // Wait for the restored cards and fonts, then restore position without moving focus.
      void document.fonts.ready.then(() => requestAnimationFrame(() => requestAnimationFrame(() => {
        document.getElementById(restore.focus)?.focus({ preventScroll: true });
        window.scrollTo(0, restore.y);
      })));
    }
    const save = () => remember(document.activeElement?.id || "");
    window.addEventListener("pagehide", save);
    return () => { window.removeEventListener("pagehide", save); controller.current?.abort(); };
    // Visit state is restored only on entry, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (focusEnd.current) {
      focusEnd.current = false;
      endStatus.current?.focus({ preventScroll: true });
    }
  }, [count]);
  function choose(next: string) {
    focusEnd.current = false;
    controller.current?.abort(); controller.current = null; busy.current = false;
    setTopic(next); setCount(8); setPhase("ready");
    current.current = { topic: next, count: 8 }; remember();
  }
  async function append() {
    if (busy.current || visible.length === filtered.length) return;
    busy.current = true; setPhase("loading");
    const request = new AbortController(); controller.current = request;
    try {
      // A static, version-pinned review input. No public discovery API is called.
      const pages = [...new Set(filtered.slice(count, count + 8).map(card => Math.floor(card.index / 8)))];
      const replies = await Promise.all(pages.map(async page => {
        const response = await fetch(`/qm-articles-ui/fixtures/catalogue-page-${page}.json`, { signal: request.signal, cache: "no-store" });
        if (!response.ok) throw new Error("fixture unavailable");
        const payload: { fixture: string; page: number; items: Card[] } = await response.json();
        const expected = cards.slice(page * 8, page * 8 + 8);
        if (payload.fixture !== version || payload.page !== page || JSON.stringify(payload.items) !== JSON.stringify(expected)) throw new Error("fixture identity mismatch");
        return payload.items;
      }));
      if (!replies.length || request.signal.aborted || controller.current !== request) return;
      const nextCount = Math.min(count + 8, filtered.length);
      // Only reconnect focus when this user still owns the control being removed.
      focusEnd.current = nextCount === filtered.length && document.activeElement?.id === "append-articles";
      setCount(nextCount); setPhase("ready");
    } catch {
      if (!request.signal.aborted && controller.current === request) setPhase("error");
    } finally {
      if (controller.current === request) { busy.current = false; controller.current = null; }
    }
  }
  return <div className={s.surface}><main className={s.page} data-articles-review="isolated-fixture">
    <section className={s.intro}><div className={s.heroArt} aria-hidden="true" /><div className={s.introCopy}><h1>科普文章</h1><p>从具体生活出发，理解情绪、关系与自己。</p></div></section>
    <div className={s.topics} role="group" aria-label="文章议题">{topics.map(item => <button key={item} type="button" aria-pressed={topic === item} onClick={() => choose(item)}>{item}</button>)}<span className={s.count}>共{filtered.length}篇文章</span></div>
    <section className={s.grid} aria-label={topic + "文章"}>{visible.map(card => <ArticleCard key={card.id} card={card} remember={id => remember(`read-${id}`)} />)}</section>
    <div className={s.next} aria-busy={phase === "loading"}>
      <p ref={endStatus} tabIndex={-1} role="status" aria-live="polite">{phase === "error" ? "暂时没能展开更多文章，已展示的文章仍可阅读。" : visible.length === filtered.length ? `已展示全部 ${filtered.length} 篇` : `已展示 ${visible.length} / ${filtered.length} 篇`}</p>
      {visible.length < filtered.length && <button id="append-articles" type="button" aria-disabled={phase === "loading"} onClick={append}>{phase === "loading" ? "正在展开…" : phase === "error" ? "重试展开　↓" : "展开更多文章　↓"}</button>}
    </div><Legal />
  </main></div>;
}
