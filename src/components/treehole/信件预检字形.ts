/** 仅用于预算预检的字库加载，不替换、截断或归一化实际信件正文。 */
export function preflightGlyphText(paragraphs: readonly string[]): string {
    const segmenter = new Intl.Segmenter("zh-CN", { granularity: "grapheme" });
    const graphemes = new Set<string>();
    for (const paragraph of paragraphs) {
        for (const { segment } of segmenter.segment(paragraph))
            graphemes.add(segment);
    }
    return [...graphemes].join("");
}
