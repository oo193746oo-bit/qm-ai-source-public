"use client";

import Image from "next/image";
import Link from "next/link";
import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { Therapist } from "@/lib/booking/types";
import { useSearchParams } from "next/navigation";
import { approvedDisplay } from "./approved-l1-display";
import { ListArrow, ListHeader } from "./list-header";

const options = {
  area: ["情感恋爱", "抑郁焦虑", "人际关系", "海外华人", "婚姻家庭", "自我成长"],
  language: ["普通话", "英语", "沪语"],
  level: ["专家等级", "资深等级", "成熟等级", "心理教练"],
  price: ["700元及以下", "701至1000元", "1000元以上"],
  sort: ["price-up", "price-down"],
} as const;
type Filters = Record<keyof typeof options, string>;
type Query = Record<string, string | string[] | undefined>;
const emptyFilters: Filters = { area: "", language: "", level: "", price: "", sort: "" };

function readFilters(query: Query): Filters {
  const result = { ...emptyFilters };
  for (const key of Object.keys(options) as (keyof Filters)[]) {
    const value = query[key];
    if (typeof value === "string" && (options[key] as readonly string[]).includes(value)) result[key] = value;
  }
  return result;
}

function Portrait({ entry, priority }: { entry: (typeof approvedDisplay)[number]; priority: boolean }) {
  const [failed, setFailed] = useState(false);
  return <div className="portrait">
    {failed ? <span className="image-error" role="status">{entry.name}的照片加载失败</span> : <Image
      src={`/qm-therapists-l1-v210/${entry.asset}`} alt={`${entry.name}的米色服装照片`} width={2048} height={3072}
      unoptimized decoding="sync" priority={priority} loading={priority ? undefined : "lazy"} style={entry.position as CSSProperties} onError={() => setFailed(true)}
    />}
  </div>;
}

export function ApprovedTherapistList({ roster, initialQuery }: { roster: Therapist[]; initialQuery: Query }) {
  // 重新挂载、后退和前进均以Next当前URL为状态来源。
  // App Router将原生replaceState同步到useSearchParams。
  const searchParams = useSearchParams();
  const filters = useMemo(
    () => readFilters(searchParams ? Object.fromEntries(searchParams.entries()) : initialQuery),
    [searchParams, initialQuery],
  );

  const selectRefs = useRef<Partial<Record<keyof Filters, HTMLSelectElement>>>({});
  // 保留原生下拉控件，仅在当前值与URL不同时恢复，避免正常选择重复改写选项。
  // 布局阶段同步，使后退和前进恢复后的首次绘制即采用正确控件值。
  useLayoutEffect(() => {
    for (const key of Object.keys(options) as (keyof Filters)[]) {
      const select = selectRefs.current[key];
      if (select && select.value !== filters[key]) select.value = filters[key];
    }
  }, [filters]);

  const filtered = useMemo(() => {
    const list = roster.map((member, index) => ({ member, index })).filter(({ member: t }) => {
      const price = t.pricing?.regular60 ?? t.price;
      return (!filters.area || t.areas.some((a) => a.includes(filters.area)))
        && (!filters.language || t.languages.some((l) => l.includes(filters.language)))
        && (!filters.level || t.level === filters.level)
        && (!filters.price || (filters.price === "700元及以下" ? price <= 700 : filters.price === "701至1000元" ? price > 700 && price <= 1000 : price > 1000));
    });
    if (filters.sort) list.sort((a, b) => {
      const difference = (a.member.pricing?.regular60 ?? a.member.price) - (b.member.pricing?.regular60 ?? b.member.price);
      return (filters.sort === "price-up" ? difference : -difference) || a.index - b.index;
    });
    return list;
  }, [roster, filters]);

  const change = (key: keyof Filters, value: string) => {
    const url = new URL(window.location.href);
    // 同步读取真实URL，确保同一React批次连续事件保留之前的修改，避免展开旧渲染快照。
    const next = readFilters(Object.fromEntries(url.searchParams.entries()));
    next[key] = value;
    for (const key of Object.keys(options) as (keyof Filters)[]) {
      if (next[key]) url.searchParams.set(key, next[key]); else url.searchParams.delete(key);
    }
    window.history.replaceState(null, "", url.toString());
  };

  return <div className="qm-l1">
    <ListHeader />
    <main>
      <section className="page-intro"><div><div className="eyebrow">QM · 专业 · 温暖 · 真人支持</div><h1>心理师团队</h1><p>多元视角 · 专业陪伴 · 看见更好的你</p></div></section>
      <section className="browse" aria-label="团队筛选与成员">
        <div className="filters">
          <div className="filter-links">
            {([["area", "议题"], ["language", "语言"], ["level", "等级"], ["price", "价格"]] as const).map(([key, label]) => <label className="select-field" key={key}>
              <span className="sr-only">{label}</span><select aria-label={label} defaultValue={filters[key]} ref={(node) => { if (node) selectRefs.current[key] = node; else delete selectRefs.current[key]; }} onChange={(e) => change(key, e.target.value)}>
                <option value="">{label}</option>{options[key].map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>)}
          </div>
          <label className="select-field sort"><span className="sr-only">排序</span><select aria-label="排序" defaultValue={filters.sort} ref={(node) => { if (node) selectRefs.current.sort = node; else delete selectRefs.current.sort; }} onChange={(e) => change("sort", e.target.value)}><option value="">团队原顺序</option><option value="price-up">价格由低到高</option><option value="price-down">价格由高到低</option></select></label>
        </div>
        <div className="result-line"><span id="count" role="status" aria-live="polite">{`${filtered.length} 位团队成员`}</span><span>选择人选后，由人工客服协助预约</span></div>
        <div className="grid">
          {filtered.map(({ member: t, index }) => {
            const entry = approvedDisplay.find((item) => item.name === t.name);
            if (!entry) throw new Error(`Missing approved display contract: ${t.name}`);
            return <article className="therapist" data-name={t.name} data-photo={entry.asset} key={t.name}>
              <div className="profile"><Portrait entry={entry} priority={index < 3} /><div className="bio"><h2>{t.name}{" "}<span>{t.name_en}</span></h2><div className="role" title={t.role}>{entry.role}</div><div className="tags">{entry.tags.map((tag, i) => <span key={i} title={t.areas[i]}>{tag}</span>)}</div></div></div>
              <div className="card-bottom"><span className="price">{`¥${t.pricing?.regular60 ?? t.price}`}<small> / 60分钟</small></span><Link className="detail" href={`/therapists/${encodeURIComponent(t.name)}`} aria-label={`查看${t.name}的详情`}>查看详情 <ListArrow /></Link></div>
              <p className="style-quote">{entry.quote.map((clause, i) => <span className={clause.className} key={i}>{clause.text}</span>)}</p>
            </article>;
          })}
        </div>
        {!filtered.length && <div className="empty" role="status">暂时没有符合条件的成员，请尝试其他关键词。</div>}
      </section>
      <section className="help-bottom"><div><h2>合适的支持，可以一起寻找。</h2><p>告诉客服你的需求、语言或人选偏好，我们会协助对接。</p></div><Link className="primary" href="/contact">联系人工客服 <ListArrow /></Link></section>
      <footer><span>QM · 多元文化理解 · 真人心理支持</span><nav aria-label="法律信息"><Link href="/about-qm">了解 QM</Link><Link href="/privacy">隐私政策</Link><Link href="/terms">服务条款</Link></nav></footer>
    </main>
  </div>;
}
