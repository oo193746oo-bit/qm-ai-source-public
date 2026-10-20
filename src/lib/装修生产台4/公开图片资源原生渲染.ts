import {spawn, type ChildProcess} from "node:child_process";
import {mkdtemp, readFile, writeFile, mkdir, copyFile, rm} from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import type {Readable, Writable} from "node:stream";
import {PUBLIC_PNG_STYLE_CHROME, PUBLIC_PNG_STYLE_REVISION, publicPaperGeometry} from "./公开图片资源契约";

type JsonObject = Record<string, unknown>;
type Pending = {resolve: (value: JsonObject) => void; reject: (error: Error) => void};
const shutdownWait = (browser: ChildProcess, closed: boolean) => new Promise<void>(resolve => {
    if (closed || browser.exitCode !== null || browser.signalCode !== null) return resolve();
    browser.once("close", () => resolve());
});
function terminate(browser: ChildProcess): void {
    if (!browser.pid || browser.exitCode !== null || browser.signalCode !== null) return;
    try {process.kill(-browser.pid, "SIGTERM");} catch {browser.kill("SIGTERM");}
}

/** 仅绘制固定公开标签、纸张、边框和装饰。函数没有任何私人信件参数。 */
export async function renderPublicPaperStyle(height64: number, incoming?: AbortSignal): Promise<Buffer> {
    const {paperHeight, height} = publicPaperGeometry(height64);
    const signal = AbortSignal.any([AbortSignal.timeout(22000), ...(incoming ? [incoming] : [])]);
    signal.throwIfAborted();
    const directory = await mkdtemp(path.join(os.tmpdir(), "qm-p4-public-style-"));
    let browser: ChildProcess | undefined;
    let browserClosed = false;
    const waiting = new Map<number, Pending>();
    let nextId = 0, remainder = Buffer.alloc(0);
    const fail = (error: Error) => {for (const item of waiting.values()) item.reject(error); waiting.clear();};
    const abort = () => {fail(new Error("公共样式生成已取消或超时")); if (browser) terminate(browser);};
    try {
        const fonts = path.join(directory, "fonts");
        const cache = path.join(directory, "font-cache");
        await mkdir(fonts); await mkdir(cache);
        const originalFonts = path.join(process.cwd(), "public/treehole/fonts");
        // 固定同族的完整字库作为原生公开页脚的系统后备，不依赖部署机任意字体。
        await copyFile(path.join(originalFonts, "NotoSansCJKSC-Regular.woff2"), path.join(fonts, "完整无衬线.woff2"));
        const xml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
        const config = path.join(directory, "fonts.conf");
        await writeFile(config, `<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "fonts.dtd"><fontconfig><include>/etc/fonts/fonts.conf</include><dir>${xml(fonts)}</dir><cachedir>${xml(cache)}</cachedir><match target="pattern"><test name="family" compare="eq"><string>sans-serif</string></test><edit name="family" mode="prepend"><string>Noto Sans CJK SC</string></edit></match><match target="font"><edit name="hintstyle"><const>hintslight</const></edit><edit name="antialias"><bool>true</bool></edit></match></fontconfig>`);
        const letterFont = await readFile(path.join(originalFonts, "批准原件字库_07.ttf"));
        signal.throwIfAborted();
        browser = spawn(process.env.QM_TREEHOLE_PUBLIC_STYLE_CHROMIUM || "/usr/bin/chromium", [
            "--headless=new", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage", "--disable-background-networking",
            "--no-first-run", "--no-default-browser-check", "--hide-scrollbars", "--remote-debugging-pipe",
            `--user-data-dir=${path.join(directory, "profile")}`, "about:blank",
        ], {detached: true, stdio: ["ignore", "ignore", "pipe", "pipe", "pipe"], env: {
            PATH: process.env.PATH, LANG: "C.UTF-8", FONTCONFIG_FILE: config, NODE_ENV: "production",
        }});
        const input = browser.stdio[3] as Writable;
        const output = browser.stdio[4] as Readable;
        browser.stderr?.on("data", () => {});
        browser.once("error", error => fail(error));
        browser.once("close", () => {browserClosed = true; fail(new Error("公共样式渲染进程已退出"));});
        input.on("error", error => fail(error));
        output.on("error", error => fail(error));
        output.on("data", (chunk: Buffer) => {
            remainder = Buffer.concat([remainder, chunk]);
            let end: number;
            while ((end = remainder.indexOf(0)) >= 0) {
                const message = remainder.subarray(0, end); remainder = remainder.subarray(end + 1);
                try {
                    const response = JSON.parse(message.toString()) as {id?: number; result?: JsonObject; error?: {message?: string}};
                    if (response.id === undefined) continue;
                    const item = waiting.get(response.id); if (!item) continue;
                    waiting.delete(response.id);
                    if (response.error) item.reject(new Error("公共样式原生绘制命令失败"));
                    else item.resolve(response.result ?? {});
                } catch {fail(new Error("公共样式原生绘制回包无效"));}
            }
        });
        signal.addEventListener("abort", abort, {once: true});
        const send = (method: string, params: JsonObject = {}, sessionId?: string): Promise<JsonObject> => {
            signal.throwIfAborted();
            return new Promise((resolve, reject) => {
                const id = ++nextId; waiting.set(id, {resolve, reject});
                input.write(JSON.stringify({id, method, params, ...(sessionId ? {sessionId} : {})}) + "\0", error => {
                    if (error) {waiting.delete(id); reject(error);}
                });
            });
        };
        const identity = await send("Browser.getVersion");
        if (identity.product !== PUBLIC_PNG_STYLE_CHROME || identity.revision !== PUBLIC_PNG_STYLE_REVISION)
            throw new Error("公共样式运行依赖版本不符");
        const target = await send("Target.createTarget", {url: "about:blank"});
        const attached = await send("Target.attachToTarget", {targetId: target.targetId, flatten: true});
        const session = String(attached.sessionId);
        await send("Emulation.setDeviceMetricsOverride", {width: 1200, height: Math.min(height, 900), deviceScaleFactor: 2, mobile: false}, session);
        await send("Page.enable", {}, session);
        const tree = await send("Page.getFrameTree", {}, session) as {frameTree: {frame: {id: string}}};
        const css = `html,body{margin:0;width:1200px;height:${height}px;background:rgb(243,237,229)}*{box-sizing:border-box}.paper{position:absolute;left:44px;top:134px;width:1112px;height:${paperHeight}px;border:1px solid rgb(205,183,159);border-radius:6px;overflow:hidden;background:linear-gradient(115deg,rgb(255,253,248) 0%,rgb(255,254,250) 58%,rgb(252,248,241) 100%);box-shadow:rgba(112,83,51,.04) 0 8px 22px}.paper:before{content:"";position:absolute;top:0;left:0;right:0;height:5px;background:linear-gradient(90deg,rgb(232,191,176),rgb(235,213,170) 26%,rgb(200,216,189) 49%,rgb(190,213,223) 70%,rgb(203,187,215))}.brandline{position:absolute;left:44px;top:44px;width:1112px;height:66px;border-bottom:1px solid rgb(216,200,183)}@font-face{font-family:LetterText;src:url(data:font/otf;base64,${letterFont.toString("base64")});font-display:block}.publicfooter{position:absolute;left:44px;top:${134 + paperHeight}px;width:1112px;padding:20px 4px 0;font:15px/27px LetterText,sans-serif;color:rgb(148,127,108)}`;
        const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><style>${css}</style></head><body><div class="brandline"></div><div class="paper"></div><div class="publicfooter">情绪树洞 · 小酷回信</div></body></html>`;
        await send("Page.setDocumentContent", {frameId: tree.frameTree.frame.id, html}, session);
        const ready = await send("Runtime.evaluate", {expression: "void document.body.offsetHeight;document.fonts.ready.then(()=>[...document.fonts].every(face=>face.status==='loaded'))", awaitPromise: true, returnByValue: true}, session) as {result?: {value?: boolean}; exceptionDetails?: unknown};
        if (ready.exceptionDetails || ready.result?.value !== true) {
            const diagnostics = await send("Runtime.evaluate", {expression: "JSON.stringify({fonts:[...document.fonts].map(f=>({family:f.family,status:f.status})),length:document.body.textContent.length})", returnByValue: true}, session);
            throw new Error(`公开页脚字库未完整加载：${JSON.stringify({ready, diagnostics})}`);
        }
        const result = await send("Page.captureScreenshot", {format: "png", captureBeyondViewport: true, fromSurface: true,
            clip: {x: 0, y: 0, width: 1200, height, scale: 1}}, session);
        signal.throwIfAborted();
        if (typeof result.data !== "string") throw new Error("公共样式图片未返回");
        const png = Buffer.from(result.data, "base64");
        if (png.length < 24 || png.readUInt32BE(0) !== 0x89504e47 || png.readUInt32BE(4) !== 0x0d0a1a0a || png.readUInt32BE(16) !== 2400 || png.readUInt32BE(20) !== height * 2)
            throw new Error("公共样式图片尺寸不完整");
        return png;
    } finally {
        signal.removeEventListener("abort", abort);
        fail(new Error("公共样式生成已结束"));
        if (browser) {
            terminate(browser);
            const forced = setTimeout(() => {if (browser?.pid) try {process.kill(-browser.pid, "SIGKILL");} catch {}}, 1500);
            try {await shutdownWait(browser, browserClosed);} finally {clearTimeout(forced);}
        }
        await rm(directory, {recursive: true, force: true});
    }
}
