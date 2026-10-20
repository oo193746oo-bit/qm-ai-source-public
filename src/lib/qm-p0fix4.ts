// ---- [QM:P0FIX4 20260917] shingle containment helpers ----
// Catches PARAPHRASED upstream second drafts: P0FIX3 verbatim-window (70%) misses
// same-meaning reworded replays. Normalization strips whitespace/punct/markdown;
// 8-char shingle containment vs accumulation tail. True new content hits <20%.
export function qmNormalizeText(s: string): string {
  return s.replace(/[\s\p{P}\p{S}]+/gu, "");
}

export function qmShingleRatio(chunk: string, accTail: string): number {
  const c = qmNormalizeText(chunk);
  const t = qmNormalizeText(accTail);
  const W = 8;
  if (c.length < W || t.length < 16) return 0;
  const tot = c.length - W + 1;
  let hit = 0;
  for (let i = 0; i + W <= c.length; i++) {
    if (t.indexOf(c.slice(i, i + W)) !== -1) hit++;
  }
  return tot > 0 ? hit / tot : 0;
}

// ---- [QM:P0FIX5 20260917] unified guard + final-frame duplicate collapse (v2) ----
// Root cause of 100% pass-through: guard only in main LLM loop; the
// role-governance retryStream loop had NO gate and shipped replay chunks.
export function qmGuardDrop(content: string, acc: string): boolean {
  if (!content || content.length < 40) return false;
  if (acc.length <= 300) return false;
  if (acc.indexOf(content) !== -1) return true;
  const r = qmShingleRatio(content, acc.slice(-2000));
  return r >= 0.55;
}

// Final-frame collapse (second gate): locate the replay start via a
// contiguous band of probe windows (60 chars) that heavily overlap everything
// before them (shingle >= 0.55). Tail beyond band start is a replay of the
// first draft -> keep first occurrence only. Crisis hotline never trimmed.

export function qmCollapseReplay(text: string): string {
  if (!text || text.length < 600) return text;
  if (text.indexOf("15001930070") !== -1) return text;
  const map: number[] = [];
  let norm = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (/[\s\p{P}\p{S}]/u.test(ch)) continue;
    norm += ch;
    map.push(i);
  }
  const L = norm.length;
  if (L < 600) return text;
  const tryCut = (s: number): string | null => {
    const collapsed = text.slice(0, map[s]).replace(/[\s,，、]+$/u, "");
    return collapsed.length >= 200 ? collapsed : null;
  };
  // pass 1: head-anchored - replay draft opens with a near-copy of the first draft opening
  const HW = 80;
  for (let s = Math.floor(L * 0.15); s + HW <= L; s += 2) {
    if (qmShingleRatio(norm.slice(s, s + HW), norm.slice(0, HW)) >= 0.85) {
      let bestS = s, bestR = -1;
      for (let t = s; t < s + 40 && t + HW <= L; t += 1) {
        const r = qmShingleRatio(norm.slice(t, t + HW), norm.slice(0, HW));
        if (r >= bestR) { bestR = r; bestS = t; }
      }
      const c = tryCut(bestS);
      if (c) return c;
    }
  }
  // pass 2: contiguous band fallback for heavily-paraphrased openings
  const PW = 60;
  const step = Math.max(1, Math.floor(L * 0.01));
  let run = 0;
  let runStart = -1;
  for (let s = Math.floor(L * 0.15); s + PW + 200 <= L; s += step) {
    if (qmShingleRatio(norm.slice(s, s + PW), norm.slice(0, s)) >= 0.55) {
      if (run === 0) runStart = s;
      run++;
      if (run >= 8) {
        const c = tryCut(runStart);
        if (c) return c;
        return text;
      }
    } else {
      run = 0;
    }
  }
  return text;
}
