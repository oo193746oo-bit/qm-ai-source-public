"use client";

import { useEffect, useRef, useState } from "react";
import s from "./articles.module.css";

const sources: Record<string, string> = {
  A03: "f2becb39cc7a79b695ae17052c6db6c9abbc6f9183524450eecef1147aac26a5.png",
  A04: "9d5f10d6a5bea3641961b4c2e21e316cbc5d126764e137b593ab915a529fc4e4.png",
};
const descriptions: Record<string, string[]> = {
  A03: ["走过明亮大厅的人", "桌上的报告与手提包", "坐在沙发上轻抚胸口的人", "在桌前阅读并记录的人", "沙发上交谈的两个人", "面对面倾听与交谈", "桌边认真交谈的两个人"],
  A04: ["白天的浅色床铺", "卧室窗边的人", "床头的时钟与手机", "夜里坐在床边的人", "可以暂时休息的扶手椅", "安静交谈的两个人", "夜间门口的浅木长凳、书与暖灯"],
};
export function Scene({ article, chapter }: { article: string; chapter: number }) {
  const image = useRef<HTMLImageElement>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (image.current?.complete && image.current.naturalWidth === 0) setFailed(true);
  }, [attempt]);
  // HQ 7bf859f approved this exact independent original for A04 chapter 6.
  const independent = article === "A04" && chapter === 6;
  const source = independent ? "candidates/A04-chapter6-night-bench.png" : `assets/${sources[article]}`;
  const panel = chapter ? chapter - 1 : article === "A03" ? 6 : 5;
  const rows = article === "A03" ? 4 : 3;
  return <figure className={s.scene} data-scene={`${article}-${chapter}`}>
    {!failed ? <div className={s.sceneCrop}>
      {/* The approved atlas is retained as a review reference, not claimed as a native-HD original. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={image} key={attempt} src={`/qm-articles-ui/${source}${attempt ? `?retry=${attempt}` : ""}`} alt={descriptions[article][chapter]} onError={() => setFailed(true)} style={independent ? { width: "100%", height: "100%", left: 0, top: 0, objectFit: "cover", objectPosition: "center" } : { width: "200%", height: `${rows * 538 / 260 * 100}%`, left: `${panel % 2 * -100}%`, top: `-${(Math.floor(panel / 2) * 538 + (chapter ? article === "A03" ? 75 : 85 : article === "A03" ? 76 : 74)) / 260 * 100}%` }} />
    </div> : <div className={s.imageFallback}><p>{descriptions[article][chapter]}</p><button type="button" onClick={() => { setAttempt(value => value + 1); setFailed(false); }}>重试</button></div>}
  </figure>;
}
