"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Therapist } from "@/lib/booking/types";
import {
  resolveTherapistPair,
  therapistIdByCnName,
  THERAPIST_META,
} from "@/lib/therapistAssetResolver.v3.1";
import { TherapistImage } from "./therapist-image";

/**
 * v3.1 心理师列表页客户端：hero + filterbar（议题/语言/等级/价格 + 排序）+ 3 列 grid。
 * 全部类名命中 therapist.layout.v3.1.css 合同；筛选/排序为真实数据派生，不引入新事实。
 */

const LEVELS = ["专家等级", "资深等级", "成熟等级", "心理教练"] as const;

const PRICE_TIERS = [
  { k: "p600-", label: "¥600 及以下", test: (p: number) => p <= 600 },
  { k: "p601-1000", label: "¥601–1000", test: (p: number) => p > 600 && p <= 1000 },
  { k: "p1001+", label: "¥1000 以上", test: (p: number) => p > 1000 },
] as const;

const SORTS = [
  { k: "recommend", label: "推荐排序" },
  { k: "price-asc", label: "价格从低到高" },
  { k: "price-desc", label: "价格从高到低" },
] as const;

type SortKey = (typeof SORTS)[number]["k"];

type DropdownProps = {
  label: string;
  badge?: number;
  open: boolean;
  onToggle: () => void;
  onClear?: () => void;
  children: React.ReactNode;
};

/** 统一下拉外壳：触发按钮用 v3.1 .therapist-filter，面板为页面级补充类 */
function Dropdown({ label, badge, open, onToggle, onClear, children }: DropdownProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onToggle();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onToggle]);

  return (
    <div className="qm-dropdown" ref={ref}>
      <button
        type="button"
        className="therapist-filter"
        aria-expanded={open}
        onClick={onToggle}
      >
        <span>
          {badge ? `${label} · ${badge}` : label}
        </span>
        <ChevronDown size={14} aria-hidden className="qm-chevron" />
      </button>
      {open ? (
        <div className="qm-filter-panel">
          <div className="qm-filter-panel__head">
            <span>{label}</span>
            {onClear ? (
              <button type="button" className="qm-filter-panel__clear" onClick={onClear}>
                清空
              </button>
            ) : null}
          </div>
          {children}
        </div>
      ) : null}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button type="button" className="qm-chip" aria-pressed={active} onClick={onClick}>
      {children}
    </button>
  );
}

const priceOf = (t: Therapist) => t.pricing?.regular60 ?? t.price;

export function TherapistListClient({ roster }: { roster: Therapist[] }) {
  const [openPanel, setOpenPanel] = useState<"area" | "lang" | "level" | "price" | "sort" | null>(null);
  const [areaSel, setAreaSel] = useState<string[]>([]);
  const [langSel, setLangSel] = useState<string[]>([]);
  const [levelSel, setLevelSel] = useState<string>("");
  const [priceSel, setPriceSel] = useState<string[]>([]);
  const [sort, setSort] = useState<SortKey>("recommend");

  const areaOptions = useMemo(() => {
    const seen: string[] = [];
    for (const t of roster) for (const a of t.areas) if (!seen.includes(a)) seen.push(a);
    return seen;
  }, [roster]);

  const langOptions = useMemo(() => {
    const seen: string[] = [];
    for (const t of roster) for (const l of t.languages) if (!seen.includes(l)) seen.push(l);
    return seen;
  }, [roster]);

  const filtered = useMemo(() => {
    let list = roster.filter((t) => {
      if (areaSel.length && !t.areas.some((a) => areaSel.includes(a))) return false;
      if (langSel.length && !t.languages.some((l) => langSel.includes(l))) return false;
      if (levelSel && t.level !== levelSel) return false;
      if (priceSel.length) {
        const p = priceOf(t);
        const hit = PRICE_TIERS.some((tier) => priceSel.includes(tier.k) && tier.test(p));
        if (!hit) return false;
      }
      return true;
    });
    if (sort === "price-asc") list = [...list].sort((a, b) => priceOf(a) - priceOf(b));
    if (sort === "price-desc") list = [...list].sort((a, b) => priceOf(b) - priceOf(a));
    return list;
  }, [roster, areaSel, langSel, levelSel, priceSel, sort]);

  const toggle = (panel: "area" | "lang" | "level" | "price" | "sort") =>
    setOpenPanel((v) => (v === panel ? null : panel));

  return (
    <>
      <section className="therapist-list-hero" data-shell-slot="list-hero">
        <p className="therapist-list-hero__eyebrow">PROFESSIONAL · WARM · HUMAN</p>
        <h2>心理师团队</h2>
        <p className="therapist-list-hero__subtitle">多元视角 · 专业陪伴 · 看见更好的你</p>
      </section>

      <section className="therapist-filterbar" aria-label="筛选与排序">
        <div className="therapist-filterbar__group">
          <Dropdown
            label="议题"
            badge={areaSel.length || undefined}
            open={openPanel === "area"}
            onToggle={() => toggle("area")}
            onClear={() => setAreaSel([])}
          >
            <div className="qm-chip-row">
              {areaOptions.map((a) => (
                <Chip
                  key={a}
                  active={areaSel.includes(a)}
                  onClick={() =>
                    setAreaSel((v) => (v.includes(a) ? v.filter((x) => x !== a) : [...v, a]))
                  }
                >
                  {a}
                </Chip>
              ))}
            </div>
          </Dropdown>

          <Dropdown
            label="语言"
            badge={langSel.length || undefined}
            open={openPanel === "lang"}
            onToggle={() => toggle("lang")}
            onClear={() => setLangSel([])}
          >
            <div className="qm-chip-row">
              {langOptions.map((l) => (
                <Chip
                  key={l}
                  active={langSel.includes(l)}
                  onClick={() =>
                    setLangSel((v) => (v.includes(l) ? v.filter((x) => x !== l) : [...v, l]))
                  }
                >
                  {l}
                </Chip>
              ))}
            </div>
          </Dropdown>

          <Dropdown
            label="等级"
            badge={levelSel ? 1 : undefined}
            open={openPanel === "level"}
            onToggle={() => toggle("level")}
            onClear={() => setLevelSel("")}
          >
            <div className="qm-chip-row">
              {LEVELS.map((lv) => (
                <Chip key={lv} active={levelSel === lv} onClick={() => setLevelSel((v) => (v === lv ? "" : lv))}>
                  {lv}
                </Chip>
              ))}
            </div>
          </Dropdown>

          <Dropdown
            label="价格"
            badge={priceSel.length || undefined}
            open={openPanel === "price"}
            onToggle={() => toggle("price")}
            onClear={() => setPriceSel([])}
          >
            <div className="qm-chip-row">
              {PRICE_TIERS.map((tier) => (
                <Chip
                  key={tier.k}
                  active={priceSel.includes(tier.k)}
                  onClick={() =>
                    setPriceSel((v) => (v.includes(tier.k) ? v.filter((x) => x !== tier.k) : [...v, tier.k]))
                  }
                >
                  {tier.label}
                </Chip>
              ))}
            </div>
          </Dropdown>
        </div>

        <div className="therapist-filterbar__group">
          <Dropdown
            label={SORTS.find((s) => s.k === sort)?.label ?? "推荐排序"}
            open={openPanel === "sort"}
            onToggle={() => toggle("sort")}
          >
            <div className="qm-chip-row">
              {SORTS.map((s) => (
                <Chip key={s.k} active={sort === s.k} onClick={() => { setSort(s.k); setOpenPanel(null); }}>
                  {s.label}
                </Chip>
              ))}
            </div>
          </Dropdown>
        </div>
      </section>

      {filtered.length > 0 ? (
        <section className="therapist-grid" aria-label="心理师列表">
          {filtered.map((t) => {
            const tid = therapistIdByCnName(t.name);
            const meta = THERAPIST_META.find((m) => m.cnName === t.name);
            const pair = tid ? resolveTherapistPair(tid, "list") : null;
            return (
              <article className="therapist-card" key={t.name}>
                <div className="therapist-card__top">
                  <div className="therapist-card__photo">
                    {pair ? (
                      <TherapistImage
                        desktop={pair.desktop}
                        mobile={pair.mobile}
                        alt={meta?.listAlt ?? `${t.name}心理师头像`}
                        name={t.name}
                        objectPositionPct={pair.objectPositionPct}
                      />
                    ) : (
                      <div className="therapist-photo-fallback is-error">
                        <span>{t.name}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="therapist-card__name">
                      {t.name}
                      <span className="therapist-card__name-en">{t.name_en}</span>
                    </h3>
                    <p className="therapist-card__meta">
                      {t.level}
                      {t.years ? ` · 从业 ${t.years}` : ""}
                    </p>
                  </div>
                </div>

                <div className="therapist-tags">
                  {t.areas.map((a) => (
                    <span className="therapist-tag" key={a}>
                      {a}
                    </span>
                  ))}
                                  </div>

                <div className="therapist-card__commerce">
                  <div>
                    <span className="therapist-card__price">¥{priceOf(t)}</span>
                    <span className="therapist-card__duration"> / 60分钟</span>
                  </div>
                  <Link
                    className="qm-cta"
                    href={`/therapists/${encodeURIComponent(t.name)}`}
                    aria-label={`查看 ${t.name} 的详情`}
                  >
                    查看详情<span aria-hidden>→</span>
                  </Link>
                </div>

                {t.style ? <p className="therapist-card__quote">「{t.style}」</p> : null}
              </article>
            );
          })}
        </section>
      ) : (
        <p className="qm-list-empty" role="status">
          按当前筛选暂时没有匹配的心理师，可以放宽一个条件，或联系人工客服帮你继续确认。
        </p>
      )}
    </>
  );
}
