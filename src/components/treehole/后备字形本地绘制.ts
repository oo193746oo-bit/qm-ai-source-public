/** 只使用当前浏览器已实际加载的字库。私人字形和文本不提交给资源服务。 */
export function drawLocalSerifFallback(context: CanvasRenderingContext2D, doc: Document, scale: number): void {
    const view = doc.defaultView;
    if (!view) throw new Error("本地字形渲染窗口不存在");
    const segmenter = new Intl.Segmenter("zh-CN", {granularity: "grapheme"});
    context.save();
    try {
        for (const span of doc.querySelectorAll<HTMLElement>("[data-serif-fallback]")) {
            const node = span.firstChild;
            if (!node || node.nodeType !== Node.TEXT_NODE || span.childNodes.length !== 1)
                throw new Error("本地后备字形结构不完整");
            const text = node.textContent ?? "";
            const style = view.getComputedStyle(span);
            const original = doc.createRange(); original.selectNode(node);
            const before = original.getBoundingClientRect();
            const probe = doc.createElement("i");
            probe.style.cssText = "display:inline-block;width:0;height:0;padding:0;margin:0;border:0;vertical-align:baseline;font-size:0;line-height:0";
            const cssCoordinates = style.fontFamily.startsWith("LetterText");
            let baseline: number;
            if (cssCoordinates) {
                // 正文保留整段连字，探针只附在段尾，测量后先移除。
                span.append(probe);
                try {baseline = probe.getBoundingClientRect().y;} finally {probe.remove();}
            } else {
                // 衬线标题有明确字距；首字素后锚定首行，避免段尾零宽探针落到下一行。
                const first = segmenter.segment(text)[Symbol.iterator]().next().value;
                if (!first) continue;
                const tail = (node as Text).splitText(first.segment.length);
                span.insertBefore(probe, tail);
                try {baseline = probe.getBoundingClientRect().y;}
                finally {probe.remove();(node as Text).appendData(tail.data);tail.remove();}
            }
            context.save();
            try {
                const range = doc.createRange(); range.selectNode(node);
                const after = range.getBoundingClientRect();
                if ((["x", "y", "width", "height"] as const).some(key => Math.abs(before[key] - after[key]) > 1 / 64))
                    throw new Error("本地字形测量改变原排版，已停止导出");
                const lines = [...range.getClientRects()];
                if (!lines.length) continue;

                const groups: {line: number; x: number; text: string}[] = [];
                for (const {segment, index} of segmenter.segment(text)) {
                    const part = doc.createRange(); part.setStart(node, index); part.setEnd(node, index + segment.length);
                    const box = part.getBoundingClientRect();
                    if (!box.width || !box.height || /^[\r\n\t]+$/.test(segment)) continue;
                    let line = -1, best = 0;
                    for (let i = 0; i < lines.length; i++) {
                        const overlap = Math.max(0, Math.min(lines[i].bottom, box.bottom) - Math.max(lines[i].top, box.top));
                        if (overlap > best) {best = overlap; line = i;}
                    }
                    if (line < 0) throw new Error("本地字形行位置无法核定");
                    const previous = groups.at(-1);
                    if (previous?.line === line) previous.text += segment;
                    else groups.push({line, x: box.x, text: segment});
                }
                const drawScale = cssCoordinates ? 1 : scale;
                if (cssCoordinates) context.scale(scale, scale);
                context.font = `${style.fontStyle} ${style.fontWeight} ${parseFloat(style.fontSize) * drawScale}px ${style.fontFamily}`;
                context.fillStyle = style.color;
                context.textAlign = "left"; context.textBaseline = "alphabetic";
                context.direction = style.direction === "rtl" ? "rtl" : "ltr";
                context.fontKerning = style.fontKerning as CanvasFontKerning;
                context.letterSpacing = style.letterSpacing === "normal" ? "0px" : `${parseFloat(style.letterSpacing) * drawScale}px`;
                // CSS计算值为小写，画布枚举为驼峰；直接赋计算值会静默保持auto，导致错用栅格模式。
                const rendering = style.textRendering.toLowerCase();
                context.textRendering = rendering === "geometricprecision" ? "geometricPrecision" : rendering === "optimizelegibility" ? "optimizeLegibility" : rendering === "optimizespeed" ? "optimizeSpeed" : "auto";
                for (const group of groups)
                    context.fillText(group.text, group.x * drawScale, (baseline + lines[group.line].y - lines[cssCoordinates ? lines.length - 1 : 0].y) * drawScale);
                if (node.textContent !== text) throw new Error("本地绘制改变了原文字");
            } finally {probe.remove();context.restore();}
        }
    } finally {context.restore();}
}
