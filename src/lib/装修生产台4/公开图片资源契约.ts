/** 公共纸张样式资源，不接收信件内容、身份或账号。最终信件PNG仍由浏览器本地合成。 */
export const PUBLIC_PNG_STYLE_VERSION = "QM_TREEHOLE_PUBLIC_STYLE_v3";
export const PUBLIC_PNG_STYLE_URL = "/api/public-assets/treehole-style";
export const PUBLIC_PNG_STYLE_CHROME = "Chrome/154.0.8037.57";
export const PUBLIC_PNG_STYLE_REVISION = "@73c14f6228d7cd537c855007e8f88678969cc0eb";
export function publicPaperGeometry(height64: number): {paperHeight: number; height: number} {
    if (!Number.isSafeInteger(height64) || height64 < 64)
        throw new Error("公共样式尺寸无效");
    const paperHeight = height64 / 64;
    const height = Math.ceil(225 + paperHeight);
    if (height * 2 > 32767 || 2400 * height * 2 > 64000000)
        throw new Error("公共样式尺寸超过完整图片预算");
    return {paperHeight, height};
}
