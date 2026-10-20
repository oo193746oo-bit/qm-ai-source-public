import { BrandHomeExtension } from "@/components/qm-brand-desktop/brand-home-extension";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Arrow, HomeHeader } from "@/components/qm-site-shell/home-header";
import "./home.css";

export const metadata: Metadata = {
  title: "QM 酷儿心理 · 首页",
  openGraph: {
    title: "QM 酷儿心理 · 首页",
    images: [{ url: "https://queermental.coze.site/qm-v5/og-image.png" }],
  },
  other: {
    "x-qm-build": "v3.2.0-home-r1",
    "qm-home-task": "QM-UIUX-HOME-001",
    "qm-home-spec": "v1.3",
  },
};

const entries = [
  ["自助工具", "用练习照顾当下的自己", "/tools"],
  ["心理测试", "从不同角度了解自己", "/assessments"],
  ["心理知识", "读懂情绪与关系", "/knowledge"],
  ["树洞日记", "留下此刻的心情与生活", "/treehole"],
] as const;
const legal = [
  ["隐私政策", "/privacy"],
  ["用户协议", "/terms"],
  ["免责声明", "/disclaimer"],
  ["数据留存与删除", "/data-deletion"],
] as const;

export default function HomePage() {
  return (
    <div className="qm-home" data-task="QM-UIUX-HOME-001" data-spec="v1.3">
      <HomeHeader />
      <main className="home-main">
        <div className="intro">
          <div>
            <div className="eyebrow">AI 陪伴 · 真人支持</div>
            <p>这里有愿意听你说话的小酷，也有能支持你的<span className="semantic-unit">真人心理师。</span></p>
          </div>
        </div>
        <section className="hero" aria-labelledby="home-welcome">
          <div className="hero-bg" aria-hidden="true" />
          <Image
            className="portrait"
            src="/qm-home-v410/xiaoku-welcome.png"
            alt="小酷，你的 AI 心理陪伴伙伴"
            width={1080}
            height={1457}
            priority
            decoding="sync"
            loading="eager"
            unoptimized
          />
          <div className="copy">
            <h1 id="home-welcome">嗨，很高兴见到你。</h1>
            <p className="lead">
              我是小酷，你的 AI 心理陪伴伙伴。
              <br />
              <strong>今天，想从哪里说起？</strong>
            </p>
          </div>
          <div className="welcome-action">
            <Link className="cta" href="/chat">
              和小酷聊聊 <Arrow />
            </Link>
          </div>
        </section>
        <section className="human" aria-labelledby="home-human">
          <div className="left">
            <div>
              <h2 id="home-human">需要真人支持时，<span className="human-availability">我们也在。</span></h2>
              <p>QM 心理咨询团队 · 多元文化理解 · <span className="semantic-unit">人工协助匹配</span></p>
            </div>
          </div>
          <div className="actions">
            <Link href="/therapists">
              认识心理师 <Arrow />
            </Link>
            <Link href="/about-qm">
              了解 QM <Arrow />
            </Link>
          </div>
        </section>
        <section className="section" aria-labelledby="home-explore">
          <div className="section-heading">
            <h2 id="home-explore">探索 QM</h2>
          </div>
          <nav className="cards" aria-label="探索QM栏目">
            {entries.map(([title, description, href]) => (
              <Link className="card" href={href} key={href}>
                <div>
                  <b>{title}</b>
                  <p>{description}</p>
                </div>
                <Arrow className="entry-arrow" />
              </Link>
            ))}
          </nav>
        </section>
        <BrandHomeExtension />
      </main>
      <footer className="home-footer">
        <nav aria-label="法律信息">
          {legal.map(([label, href]) => (
            <Link href={href} key={href}>
              {label}
            </Link>
          ))}
        </nav>
      </footer>
    </div>
  );
}
