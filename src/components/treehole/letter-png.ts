import { browserLetterPngRenderer } from './浏览器信件图片';
import { preflightGlyphText } from './信件预检字形';
import { normalizeSerifFallbackGlyphs, normalizeLetterFallbackGlyphs } from './衬线后备字形排版';
/** QM-UIUX-TREEHOLE-DESKTOP-001：确定信件的客户端PNG渲染，不请求模型或改存储。 */
export interface LetterPngSnapshot {
    letterId: string;
    revision: string;
    dateKey: string;
    dateDisplay: string;
    authorLabel: string;
    title: string;
    salutation: string;
    paragraphs: readonly string[];
    signature: string;
    signatureDescription: string;
    isCrisis: boolean;
}
export interface LetterPngResult {
    blob: Blob;
    width: 2400;
    height: number;
    letterId: string;
    revision: string;
    filename: string;
}
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
export interface NativePngRequest {
    readonly html: string;
    /** 同源实际排版文档，仅本地默认渲染器使用，不序列化到外部。 */
    readonly document?: Document;
    readonly widthCSS: 1200;
    readonly heightCSS: number;
    readonly scale: 2;
    readonly letterId: string;
    readonly revision: string;
    readonly rendererVersion: string;
}
export interface NativePngRenderer {
    readonly version: string;
    capture(request: NativePngRequest, signal?: AbortSignal): Promise<{
        blob: Blob;
        letterId: string;
        revision: string;
        rendererVersion: string;
    }>;
}
function isCalendarDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
        return false;
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return year >= 100 && year <= 9999 && date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
const active = new Set<string>();
const resourceTimeout = 25000;
function abortable<T>(pending: Promise<T>, signal: AbortSignal): Promise<T> {
    signal.throwIfAborted();
    return new Promise((resolve, reject) => {
        const onAbort = () => reject(signal.reason);
        signal.addEventListener("abort", onAbort, { once: true });
        pending.then(resolve, reject).finally(() => signal.removeEventListener("abort", onAbort));
    });
}
async function resource(url: string, signal?: AbortSignal): Promise<Response> {
    const response = await fetch(url, { signal: AbortSignal.any([AbortSignal.timeout(resourceTimeout), ...(signal ? [signal] : [])]) });
    if (!response.ok)
        throw new Error(`导出资源读取失败（HTTP ${response.status}）`);
    return response;
}
async function asDataUrl(blob: Blob, signal: AbortSignal): Promise<string> {
    signal.throwIfAborted();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        const cleanup = () => signal.removeEventListener("abort", onAbort);
        const onAbort = () => { cleanup(); reader.abort(); reject(signal.reason); };
        signal.addEventListener("abort", onAbort, { once: true });
        reader.onload = () => { cleanup(); resolve(String(reader.result)); };
        reader.onerror = () => { cleanup(); reject(new Error("导出字体读取失败")); };
        reader.readAsDataURL(blob);
    });
}
export function letterPngMarkup(snapshot: LetterPngSnapshot): string {
    const s = (value: string) => escapeHtml(value);
    return `<main class="export-sheet"><div class="export-brand"><div class="brand"><i class="qmark"></i>QM <span>AI</span></div><span>一封来自小酷的回信</span></div><section class="paper correspondence"><div class="meta"><span>${s(snapshot.authorLabel)}</span><span>${s(snapshot.dateDisplay)}</span></div><h2 class="letter-title">${s(snapshot.title)}</h2><article class="received-letter" aria-label="小酷回信，只读内容"><p class="salutation">${s(snapshot.salutation)}</p>${snapshot.paragraphs.map(text => `<p class="letter-paragraph">${s(text)}</p>`).join("")}<div class="signature"><span>${s(snapshot.signature)}</span><small>${s(snapshot.signatureDescription)}</small></div></article><p class="local-note">AI回信不替代专业心理支持。</p></section><footer>情绪树洞 · 小酷回信</footer></main>`;
}
/** 返回完整PNG字节；是否真正写入用户磁盘由浏览器决定。 */
export async function renderLetterPng(input: LetterPngSnapshot, renderer: NativePngRenderer = browserLetterPngRenderer, signal?: AbortSignal): Promise<LetterPngResult> {
    const rendererVersion = renderer?.version;
    const capture = renderer?.capture;
    if(typeof rendererVersion!=="string"||!rendererVersion.trim()||typeof capture!=="function")throw new Error("图片渲染器身份不完整，未触发下载");
    // 绑定本次选择的版本与方法；字体等异步等待期间的对象变更不能偷换本次渲染器。
    const captureSelected = capture.bind(renderer);
    if(!input||typeof input!=="object"||typeof input.isCrisis!=="boolean")throw new Error("信件安全状态不完整，未套用普通信件模板");
    if(input.isCrisis)throw new Error("危机回应导出规则尚待核定，当前不能套用普通信件模板");
    const required=[input.letterId,input.revision,input.dateKey,input.dateDisplay,input.authorLabel,input.title,input.salutation,input.signature,input.signatureDescription];
    if(required.some(value=>typeof value!=="string"||!value.trim())||!isCalendarDate(input.dateKey)||!Array.isArray(input.paragraphs)||input.paragraphs.some(value=>typeof value!=="string")||!input.paragraphs.some(value=>/[^\p{White_Space}\p{Default_Ignorable_Code_Point}]/u.test(value)))throw new Error("信件身份、所属日期或正文不完整");
    const snapshot: Readonly<LetterPngSnapshot> = Object.freeze({ ...input, paragraphs: Object.freeze([...input.paragraphs]) });
    const identity = JSON.stringify([snapshot.letterId, snapshot.revision]);
    if (active.has(identity))
        throw new Error("这封回信正在导出，请等待");
    active.add(identity);
    const renderSignal = AbortSignal.any([AbortSignal.timeout(resourceTimeout), ...(signal ? [signal] : [])]);
    const frame = document.createElement("iframe");
    frame.title = "回信图片渲染";
    frame.setAttribute("aria-hidden", "true");
    frame.tabIndex = -1;
    frame.style.cssText = "position:fixed;left:-20000px;top:0;width:1200px;height:1px;border:0;pointer-events:none";
    try {
        renderSignal.throwIfAborted();
        const css = await abortable((await resource("/treehole/export/png-template.css", renderSignal)).text(), renderSignal);
        const primaryCoverage: unknown = await abortable((await resource("/treehole/fonts/衬线主字库覆盖.json", renderSignal)).json(), renderSignal);
        if (!Array.isArray(primaryCoverage) || !primaryCoverage.length || primaryCoverage.some(value => !Number.isInteger(value) || value < 0 || value > 0x10ffff))
            throw new Error("衬线字库覆盖资料不完整，未生成图片");
        const serifPrimary = new Set<number>(primaryCoverage);
        const letterCoverage: unknown = await abortable((await resource("/treehole/fonts/正文主字库覆盖.json", renderSignal)).json(), renderSignal);
        if (!Array.isArray(letterCoverage) || !letterCoverage.length || letterCoverage.some(value => !Number.isInteger(value) || value < 0 || value > 0x10ffff))
            throw new Error("正文字库覆盖资料不完整，未生成图片");
        const letterPrimary = new Set<number>(letterCoverage);
        const identityCoverage: unknown = await abortable((await resource("/treehole/fonts/身份主字库覆盖.json", renderSignal)).json(), renderSignal);
        if (!Array.isArray(identityCoverage) || !identityCoverage.length || identityCoverage.some(value => !Number.isInteger(value) || value < 0 || value > 0x10ffff))
            throw new Error("身份字库覆盖资料不完整，未生成图片");
        const identityPrimary = new Set<number>(identityCoverage);
        document.body.appendChild(frame);
        const doc = frame.contentDocument;
        if (!doc)
            throw new Error("浏览器不能创建图片渲染区");
        const fields = [snapshot.authorLabel, snapshot.title, snapshot.salutation, ...snapshot.paragraphs, snapshot.signature, snapshot.signatureDescription];
        const needsBudgetPreflight = fields.reduce((total, value) => total + value.length, 0) > 50000 || snapshot.paragraphs.length > 256;
        const prefix = (value: string) => { let result = "", count = 0; for (const character of value) {
            if (count++ === 100)
                break;
            result += character;
        } return result; };
        const probeSnapshot = needsBudgetPreflight ? { ...snapshot, authorLabel: prefix(snapshot.authorLabel), title: prefix(snapshot.title), salutation: prefix(snapshot.salutation), paragraphs: snapshot.paragraphs.slice(0, 4).map(prefix), signature: prefix(snapshot.signature), signatureDescription: prefix(snapshot.signatureDescription) } : snapshot;
        doc.open();
        doc.write(`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><style>${css}</style></head><body>${letterPngMarkup(probeSnapshot)}</body></html>`);
        doc.close();
        normalizeSerifFallbackGlyphs(doc, serifPrimary);
        normalizeLetterFallbackGlyphs(doc, letterPrimary, identityPrimary);
        void doc.body.offsetHeight;
        await abortable(doc.fonts.ready, renderSignal);
        renderSignal.throwIfAborted();
        if (needsBudgetPreflight) {
            // 大正文先用真实字库测量，避免把明显超出画布预算的全文交给同步DOM排版。
            // 字符/段数仅决定是否预检，不是正文上限；原文换行依pre-wrap保留。
            const paragraph = doc.querySelector<HTMLElement>(".letter-paragraph")!;
            // 让实际排版只加载正文需要的字形；模板中未使用的字体不是导出依赖。
            // 去重以完整字素为单位，保留emoji/选择符/组合音标，不展开重复换行或万段正文。
            paragraph.textContent = preflightGlyphText(snapshot.paragraphs);
            void paragraph.offsetHeight;
            await abortable(doc.fonts.ready, renderSignal);
            renderSignal.throwIfAborted();
            const style = doc.defaultView!.getComputedStyle(paragraph);
            const measuring = doc.createElement("canvas");
            try {
                const context = measuring.getContext("2d");
                if (!context)
                    throw new Error("浏览器不能创建全文预算测量画布");
                context.font = style.font;
                const lineHeight = parseFloat(style.lineHeight);
                const lineWidth = doc.querySelector<HTMLElement>(".received-letter")!.getBoundingClientRect().width;
                const allowance = parseFloat(style.fontSize);
                const lowerHeight = snapshot.paragraphs.reduce((sum, value) => {
                    if (!value.length) return sum;
                    const lines = value.replace(/\r\n?/g, "\n").split("\n");
                    // 尾部换行后的空字符串不额外算一行，保守下界不误拒绝合法正文。
                    if (lines.at(-1) === "") lines.pop();
                    return sum + lines.reduce((height, line) => height + Math.max(1, Math.ceil(context.measureText(line).width / (lineWidth + allowance))) * lineHeight, 0);
                }, 0);
                if (lowerHeight * 2 > 32767 || 2400 * lowerHeight * 2 > 64000000)
                    throw new Error("当前浏览器不能安全绘制这封长信，未裁切或缩字");
            }
            finally {
                measuring.width = 0;
                measuring.height = 0;
            }
            doc.body.innerHTML = letterPngMarkup(snapshot);
            normalizeSerifFallbackGlyphs(doc, serifPrimary);
            normalizeLetterFallbackGlyphs(doc, letterPrimary, identityPrimary);
            void doc.body.offsetHeight;
            await abortable(doc.fonts.ready, renderSignal);
            renderSignal.throwIfAborted();
        }
        // 后备字库完成后重新触发布局，再等待由最终字形触发的字体加载；不能使用字体替换前的纸张高度。
        void doc.body.offsetHeight;
        await abortable(doc.fonts.ready, renderSignal);
        void doc.body.offsetHeight;
        renderSignal.throwIfAborted();
        const sheet = doc.querySelector<HTMLElement>(".export-sheet");
        if (!sheet)
            throw new Error("信件模板加载失败");
        const bounds = sheet.getBoundingClientRect();
        const height = Math.ceil(Math.max(bounds.bottom, doc.body.scrollHeight));
        if (doc.documentElement.scrollWidth > 1200 || bounds.width !== 1200)
            throw new Error("信件横向溢出，已停止导出以保留全文");
        // 整张信件（含标题、称呼和落款）均受同一画布预算约束，不依赖被选渲染器自行兜底。
        if (!Number.isFinite(height) || height <= 0 || height * 2 > 32767 || 2400 * height * 2 > 64000000)
            throw new Error("当前浏览器不能安全绘制这封长信，未裁切或缩字");
        const normalize = (value: string) => value.replace(/[\s"']/g, "").toUpperCase();
        const faceKey = (family: string, weight: string, style: string, range: string) => [family, weight, style, range].map(normalize).join("|");
        const loaded = new Set([...doc.fonts].filter(face => face.status === "loaded").map(face => faceKey(face.family, face.weight, face.style, face.unicodeRange)));
        const failed = new Set([...doc.fonts].filter(face => face.status === "error").map(face => faceKey(face.family, face.weight, face.style, face.unicodeRange)));
        const fontRules = [...doc.styleSheets[0].cssRules].filter(rule => rule.type === CSSRule.FONT_FACE_RULE) as CSSFontFaceRule[];
        const ruleKey = (rule: CSSFontFaceRule) => faceKey(rule.style.getPropertyValue("font-family"), rule.style.getPropertyValue("font-weight") || "normal", rule.style.getPropertyValue("font-style") || "normal", rule.style.getPropertyValue("unicode-range") || "U+0-10FFFF");
        const fontUrls = (text: string) => [...text.matchAll(/url\("([^\"]+)"\)/g)].map(match => match[1]);
        for (const rule of fontRules.filter(rule => failed.has(ruleKey(rule)))) {
            for (const url of fontUrls(rule.cssText))
                await resource(url, renderSignal);
            throw new Error("字体资源无法加载或解析，未生成缺字图片");
        }
        const selected = fontRules.filter(rule => loaded.has(ruleKey(rule)));
        if (!selected.length)
            throw new Error("确定字库未实际加载，未生成图片");
        const serializedDocument=doc.documentElement.cloneNode(true) as HTMLElement;
        {
            const usedUrls = [...new Set(selected.flatMap(rule => fontUrls(rule.cssText)))];
            const fonts = await Promise.all(usedUrls.map(async (url) => [url, await asDataUrl(await abortable((await resource(url, renderSignal)).blob(), renderSignal), renderSignal)] as const));
            let embeddedCss = [...doc.styleSheets[0].cssRules].filter(rule => rule.type !== CSSRule.FONT_FACE_RULE || loaded.has(ruleKey(rule as CSSFontFaceRule))).map(rule => rule.cssText).join("\n");
            for (const [url, data] of fonts)
                embeddedCss = embeddedCss.split(`url("${url}")`).join(`url("${data}")`);
            // 序列化副本嵌入同一原字节，实际排版文档不重复解析数十MB完整字库。
            serializedDocument.querySelector("style")!.textContent=embeddedCss;
        }
        renderSignal.throwIfAborted();
        const roleCoverage = await abortable((await resource("/treehole/fonts/角色字形覆盖.json", renderSignal)).json(), renderSignal) as {
            sans: number[];
            serif: number[];
            emoji: number[];
        };
        const sans = new Set([...roleCoverage.sans, ...roleCoverage.emoji]);
        const serif = new Set([...roleCoverage.serif, ...roleCoverage.emoji]);
        // format 14证明的是“基础字+选择符”序列，不能把选择符当任意独立字放行。
        const variants = await abortable((await resource("/treehole/fonts/实际字库变体序列覆盖.json", renderSignal)).json(), renderSignal) as Record<"sans" | "serif" | "emoji", Record<string, number[]>>;
        const unsupported = (value: string, coverage: Set<number>, role: "sans" | "serif") => {
            let previous: number | undefined;
            for (const character of value) {
                const scalar = character.codePointAt(0)!;
                if ((scalar >= 0xFE00 && scalar <= 0xFE0F) || (scalar >= 0xE0100 && scalar <= 0xE01EF)) {
                    if (previous === undefined || ![...(variants[role][scalar] || []), ...(variants.emoji[scalar] || [])].includes(previous))
                        return true;
                    previous = undefined;
                    continue;
                }
                if (!/[\r\n\t]/.test(character) && !coverage.has(scalar))
                    return true;
                previous = scalar;
            }
            return false;
        };
        if ([snapshot.authorLabel, snapshot.salutation, ...snapshot.paragraphs, snapshot.signatureDescription, snapshot.dateDisplay].some(value => unsupported(value, sans, "sans")) || [snapshot.title, snapshot.signature].some(value => unsupported(value, serif, "serif")))
            throw new Error("当前字体不能完整呈现这封回信，未生成缺字图片");
        renderSignal.throwIfAborted();
        const captured = await abortable(captureSelected(Object.freeze({ html: serializedDocument.outerHTML, document: renderer === browserLetterPngRenderer ? doc : undefined, widthCSS: 1200 as const, heightCSS: height, scale: 2 as const, letterId: snapshot.letterId, revision: snapshot.revision, rendererVersion }), renderSignal), renderSignal);
        renderSignal.throwIfAborted();
        if (captured.letterId !== snapshot.letterId || captured.revision !== snapshot.revision || captured.rendererVersion !== rendererVersion)
            throw new Error("导出回包与这封回信的身份或渲染版本不符，未触发下载");
        const blob = captured.blob;
        if (!blob.size || blob.type !== "image/png")
            throw new Error("本地渲染器未返回有效PNG，未触发下载");
        const header = new DataView(await blob.slice(0, 24).arrayBuffer());
        if (header.byteLength < 24 || header.getUint32(0) !== 0x89504e47 || header.getUint32(4) !== 0x0d0a1a0a || header.getUint32(16) !== 2400 || header.getUint32(20) !== height * 2)
            throw new Error("PNG尺寸或文件格式不完整，未裁切、缩字或下载");
        const decoding = createImageBitmap(blob);
        void decoding.then(bitmap => { if (renderSignal.aborted)
            bitmap.close(); }, () => { });
        const bitmap = await abortable(decoding, renderSignal);
        try {
            if (bitmap.width !== 2400 || bitmap.height !== height * 2)
                throw new Error("PNG全文尺寸不符");
        }
        finally {
            bitmap.close();
        }
        renderSignal.throwIfAborted();
        return { blob, width: 2400, height: height * 2, letterId: snapshot.letterId, revision: snapshot.revision, filename: `小酷回信_${snapshot.dateKey}_${snapshot.revision.replace(/[^a-zA-Z0-9_-]/g, "_")}.png` };
    }
    finally {
        frame.remove();
        active.delete(identity);
    }
}
export function triggerLetterPngDownload(result: LetterPngResult, signal?: AbortSignal): void {
    signal?.throwIfAborted();
    const url = URL.createObjectURL(result.blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = result.filename;
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    try {
        signal?.throwIfAborted();
        anchor.click();
    }
    finally {
        anchor.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    }
}
