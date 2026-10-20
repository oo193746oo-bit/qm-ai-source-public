import {PUBLIC_PNG_STYLE_VERSION, publicPaperGeometry} from "@/lib/装修生产台4/公开图片资源契约";
import {renderPublicPaperStyle} from "@/lib/装修生产台4/公开图片资源原生渲染";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
let running = false;
/** 固定公开纸张资源。拒收文字、身份及任何未列明参数，不属于大脑业务接口。 */
export async function GET(request: Request): Promise<Response> {
    const params = new URL(request.url).searchParams;
    const keys = [...params.keys()];
    if (keys.length !== 2 || new Set(keys).size !== 2 || keys.some(key => key !== "version" && key !== "height64") ||
        params.get("version") !== PUBLIC_PNG_STYLE_VERSION || !/^\d{1,7}$/.test(params.get("height64") ?? ""))
        return Response.json({error: "公共样式请求无效"}, {status: 400});
    const height64 = Number(params.get("height64"));
    try {publicPaperGeometry(height64);} catch {return Response.json({error: "公共样式尺寸无效"}, {status: 400});}
    if (running) return Response.json({error: "图片样式资源繁忙，请稍后重试"}, {status: 429, headers: {"Retry-After": "2"}});
    running = true;
    try {
        const png = await renderPublicPaperStyle(height64, request.signal);
        return new Response(new Uint8Array(png), {headers: {"Content-Type": "image/png", "Cache-Control": "no-store",
            "X-QM-PNG-Style-Version": PUBLIC_PNG_STYLE_VERSION, "X-Content-Type-Options": "nosniff"}});
    } catch {
        return Response.json({error: "图片样式资源暂时不可用，请稍后重试"}, {status: 503, headers: {"Cache-Control": "no-store"}});
    } finally {running = false;}
}
