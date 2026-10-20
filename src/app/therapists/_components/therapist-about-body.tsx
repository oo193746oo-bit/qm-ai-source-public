"use client";

import { useState } from "react";

/**
 * 「关于我」正文：手机端默认 6 行折叠（layout.v3.1.css 的
 * .therapist-about__body[data-collapsed="true"] 规则），可展开/收起；
 * 桌面端不折叠、开关隐藏（同一 DOM，行为由 CSS 断点控制）。
 */
export function TherapistAboutBody({ body }: { body: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <p className="therapist-about__body" data-collapsed={expanded ? "false" : "true"}>
        {body}
      </p>
      <button
        type="button"
        className="therapist-about__toggle"
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? "收起" : "展开全部"}
      </button>
    </>
  );
}
