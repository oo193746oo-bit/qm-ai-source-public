"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { installH04ReturnFocus } from "./h04-return-focus";

/** Same native anchor and tab position; only H04-originated history returns restore focus. */
export function H04ReturnLink({ children }: { children: ReactNode }) {
  const link = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    if (link.current) return installH04ReturnFocus(window, link.current);
  }, []);
  return <a ref={link} className="extension-link" href="/about-qm">{children}</a>;
}
