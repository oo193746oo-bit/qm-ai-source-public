/**
 * 心理师四端派生取景图映射（黄金样板 v3.0）
 * 资产来源：资产包v3.0/03_24人四端派生取景/JPG（96张，GPT 已批准）
 * 取景已按 04_24人焦点与响应式配置/therapist_focus_config.v3.json 烘焙进图片本身；
 * 页面只需按端选择对应 context 文件并 object-cover 满窗显示。
 *
 * 红线：contain 仅允许用于母图回退保护场景（见 TherapistPhoto 组件），
 * 禁止人物过小/两侧空洞的旧 v1.0 口径（整图+object-contain 已作废）。
 */

export type TherapistPhotoContext =
  | "list_desktop"
  | "list_mobile"
  | "detail_desktop"
  | "detail_mobile";

const CTX_SIZE: Record<TherapistPhotoContext, number> = {
  list_desktop: 640,
  list_mobile: 480,
  detail_desktop: 960,
  detail_mobile: 640,
};

/** 派生取景图 URL（public/therapists/derive/<ctx>/<slug>_<ctx>_<w>x<w>.jpg） */
export function derivedPhotoUrl(
  slug: string,
  ctx: TherapistPhotoContext,
): string {
  const w = CTX_SIZE[ctx];
  return `/therapists/derive/${ctx}/${slug}_${ctx}_${w}x${w}.jpg`;
}

/** 母图 URL（仅作为派生图加载失败时的回退保护，配合 object-contain 使用） */
export function motherPhotoUrl(slug: string): string {
  return `/therapists/${slug}.jpg`;
}
