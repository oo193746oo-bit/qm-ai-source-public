/** 公共纸张样式资源只接收几何尺寸；私人信件始终在浏览器本地合成。 */
export const PUBLIC_PNG_STYLE_VERSION = "QM_TREEHOLE_PUBLIC_STYLE_v3";
export const PUBLIC_PNG_STYLE_URL = "/api/public-assets/treehole-style";

export function publicPaperGeometry(height64: number): {paperHeight: number; height: number} {
    if (!Number.isSafeInteger(height64) || height64 < 64)
        throw new Error("公共样式尺寸无效");
    const paperHeight = height64 / 64;
    const height = Math.ceil(225 + paperHeight);
    if (height * 2 > 32767 || 2400 * height * 2 > 64000000)
        throw new Error("公共样式尺寸超过完整图片预算");
    return {paperHeight, height};
}
