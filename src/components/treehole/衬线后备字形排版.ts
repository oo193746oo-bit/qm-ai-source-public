/** 后备字形保留父级行度量，避免独立渲染模式改变整行高度。 */
export function normalizeSerifFallbackGlyphs(doc: Document, primaryCoverage: ReadonlySet<number>): void {
    normalizeFallbackGlyphs(doc, primaryCoverage, ".brand,.letter-title,.signature span", "QM Serif");
}
export function normalizeLetterFallbackGlyphs(doc: Document, primaryCoverage: ReadonlySet<number>, identityCoverage: ReadonlySet<number>): void {
    normalizeFallbackGlyphs(doc, primaryCoverage, ".received-letter", "LetterText");
    normalizeFallbackGlyphs(doc, identityCoverage, ".meta", "LetterText");
}
function normalizeFallbackGlyphs(doc: Document, primaryCoverage: ReadonlySet<number>, selectors: string, family: string): void {
    const segmenter = new Intl.Segmenter("zh-CN", { granularity: "grapheme" });
    for (const element of doc.querySelectorAll(selectors)) {
        const walker = doc.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        const nodes: Text[] = [];
        while (walker.nextNode()) nodes.push(walker.currentNode as Text);
        for (const node of nodes) {
            const parent = node.parentElement;
            if (!parent || parent.closest("[data-serif-fallback]") ||
                doc.defaultView?.getComputedStyle(parent).fontFamily.split(",")[0].replace(/["']/g, "").trim() !== family) continue;
            const groups: { fallback: boolean; text: string }[] = [];
            for (const { segment } of segmenter.segment(node.data)) {
                const fallback = [...segment].some(character => !/[\s\p{Mark}\p{Control}]/u.test(character) && !primaryCoverage.has(character.codePointAt(0)!));
                const last = groups.at(-1);
                if (last?.fallback === fallback) last.text += segment;
                else groups.push({ fallback, text: segment });
            }
            if (!groups.some(group => group.fallback)) continue;
            const fragment = doc.createDocumentFragment();
            for (const group of groups) {
                if (!group.fallback) fragment.append(doc.createTextNode(group.text));
                else {
                    const span = doc.createElement("span");
                    span.dataset.serifFallback = "true";
                    span.style.textRendering = "geometricPrecision";
                    span.style.lineHeight = family === "LetterText" ? "inherit" : "0";
                    span.textContent = group.text;
                    fragment.append(span);
                }
            }
            node.replaceWith(fragment);
        }
    }
}
