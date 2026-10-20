import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { THERAPISTS } from "@/lib/booking/data";
import profiles from "../_components/detail-desktop-contract.json";
import { DetailDesktopHeader, DetailServiceAction } from "../_components/detail-desktop-interactions";
import "../_components/detail-desktop.css";

function decodeName(id: string) {
  try { return decodeURIComponent(id); } catch { return ""; }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const t = THERAPISTS.find((t) => t.name === decodeName(id));
  return {
    title: t ? `${t.name} ${t.name_en} · 心理师团队 | QM上海酷儿心理咨询中心` : "心理师团队 | QM AI",
    openGraph: {
      title: t ? `${t.name} ${t.name_en} · QM上海酷儿心理咨询中心` : "QM AI - 心理支持助手",
      url: t ? `https://queermental.coze.site/therapists/${encodeURIComponent(t.name)}` : "https://queermental.coze.site",
      siteName: "QM AI", locale: "zh_CN", images: [{ url: "https://queermental.coze.site/qm-v5/og-image.png" }],
    },
    other: { "x-qm-build": "QM-UIUX-THERAPISTS-L2-001-desktop-v1.0" },
  };
}

function ProtectedParagraph({ text, terms }: { text: string; terms: string[] }) {
  const ordered = [...terms].filter(Boolean).sort((a, b) => b.length - a.length);
  if (!ordered.length) return <p>{text}</p>;
  const escaped = ordered.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const parts = text.split(new RegExp(`(${escaped.join("|")})`, "g"));
  return <p>{parts.map((part, i) => ordered.includes(part) ? <span style={{ whiteSpace: "nowrap" }} key={i}>{part}</span> : part)}</p>;
}

export default async function TherapistDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const name = decodeName(id);
  const t = THERAPISTS.find((t) => t.name === name);
  const p = profiles.find((p) => p.name === name);
  if (!t || !p) notFound();
  const [width, height, left, top] = p.photoCSS;
  return (
    <div className="qm-td-page" data-detail-version="v1.0" data-therapist-name={p.name} style={{ "--td-sans": p.order <= 20 ? `"QMTDSans-${String(p.order).padStart(2, "0")}", QMTDSans` : "QMTDSans", "--td-serif": p.order <= 20 ? `"QMTDSerif-${String(p.order).padStart(2, "0")}", QMTDSerif` : "QMTDSerif" } as CSSProperties}>
      <DetailDesktopHeader />
      <main id="therapist-main">
        <div className="crumb" aria-label="面包屑"><Link href="/therapists">{`心理师团队　›　${p.name} ${p.english}`}</Link></div>
        <section className="hero" aria-labelledby="td-name">
          <div className="photo">
            {/* Approved full-body master, positioned by the per-person contract; never object-fit:cover. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.photo} alt={`${p.name}，米色服装`} width={2048} height={3072} style={{ width, height, left, top }} fetchPriority="high" />
          </div>
          <div className="profile">
            <div className="eyebrow">QM · 专业 · 温暖 · 真人支持</div>
            <h1 id="td-name">{p.name} <span>{p.english}</span></h1>
            <p className="role">{p.coach ? "心理教练（非心理师）" : `${p.role} · ${p.level}`} · 从业 {p.years}</p>
            <blockquote>{p.quote}</blockquote>
            <div className="tags" aria-label="擅长领域">{p.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
          </div>
        </section>
        <section className="about panel" aria-labelledby="td-about">
          <div className="section-title"><h2 id="td-about">关于我</h2><span>了解我的工作方式</span></div>
          <div className="paragraphs">{p.paragraphs.map((text, i) => <ProtectedParagraph key={i} text={text} terms={p.nowrapTerms} />)}</div>
        </section>
        <section className="facts" aria-label="专业资料">{p.facts.map((f) => <div key={f.title}><strong>{f.title}</strong><span>{f.subtitle}</span></div>)}</section>
        <section className="pricing panel" aria-labelledby="td-prices">
          <div className="section-title"><h2 id="td-prices">服务与价格</h2><span>具体咨询安排，由人工客服协助对接</span></div>
          <div className={`prices${p.coach ? " coach-prices" : ""}`}>{p.cards.map((card) => (
            <article key={card.title}>
              <h3>{card.title}</h3><p>{card.description}</p>
              {card.rows.map((row) => <div className="price-row" key={row.label}><span>{row.label}</span><strong>{row.value}</strong></div>)}
              <DetailServiceAction name={p.name} service={card.title} action={card.action} />
            </article>
          ))}</div>
          <p className="note">温馨提示：具体咨询安排、可预约时间及更多服务说明，请联系人工客服了解。</p>
        </section>
        <footer><span>QM AI　·　专业的心理支持，面向真实的你</span><div><Link href="/privacy">隐私政策</Link>　　<Link href="/terms">用户协议</Link>　　<Link href="/disclaimer">免责声明</Link>　　<Link href="/data-deletion">数据留存与删除</Link></div></footer>
      </main>
    </div>
  );
}
