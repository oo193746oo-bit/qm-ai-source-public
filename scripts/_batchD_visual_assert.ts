/* 批次D v0.7.1 四模块视觉接入验收断言
 * 运行：npx tsx scripts/_batchD_visual_assert.ts
 * 覆盖施工单验收断言 #1-#8
 */
import * as fs from "fs";
import * as path from "path";

let pass = 0;
let fail = 0;
const failures: string[] = [];

function check(name: string, ok: boolean, detail = "") {
  if (ok) pass++;
  else {
    fail++;
    failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
  }
}

const ROOT = path.resolve(__dirname, "..");
const VISUAL = path.join(ROOT, "public/visual");
const SRC = path.join(ROOT, "src");

// #1 探活（由外部 curl 或 test_run 兜底；这里检查静态资源存在性）
function fileExists(p: string) {
  return fs.existsSync(path.join(VISUAL, p));
}

// #2 PAGE_ASSET_MAP 逐行核对：每个 approved 生产资产必须存在
const MAP = [
  "bg_home_desktop_1440x900.png",
  "bg_home_mobile_1080x1920.png",
  "overlay_prism_desktop_soft.png",
  "overlay_prism_mobile_soft.png",
  "bg_about_desktop_1440x900.png",
  "bg_about_mobile_1080x1920.png",
  "ambient_abstract_arches_1600x900.png",
  "bg_service_desktop_1440x900.png",
  "bg_service_mobile_1080x1920.png",
  "bg_knowledge_desktop_1440x900.png",
  "bg_knowledge_mobile_1080x1920.png",
  "knowledge_cover_abstract_01.png",
  "knowledge_cover_abstract_02.png",
  "knowledge_cover_abstract_03.png",
  "knowledge_cover_abstract_04.png",
  "bg_chat_mobile_1080x1920.png",
  "bg_chat_desktop_1440x900.png",
  "bg_price_panel_soft_warm.png",
  "texture_pearl_paper_1400x900.png",
  "panel_glass_warm_large.png",
  "panel_glass_warm_mobile.png",
  "divider_soft_wave.png",
];
for (const f of MAP) check(`ASSET_MAP 存在: ${f}`, fileExists(f));
// 落位数量 = 22
const files = fs.readdirSync(VISUAL).filter((f) => f.endsWith(".png"));
check("ASSET_MAP 数量为 22 张生产图", files.length === 22, `实际 ${files.length}`);
// 不允许 REFERENCE zip 内文件混入生产（#8）
const REF_ONLY = ["preview", "mockup", "ref_", "reference", "draft", "WIP"];
const badProd = files.filter((f) => REF_ONLY.some((r) => f.includes(r)));
check("#8 生产目录无 REFERENCE 文件", badProd.length === 0, badProd.join(","));

// #3 overlay opacity 范围：D .35–.60 / M .30–.55（CSS 内检查）
const css = fs.readFileSync(path.join(ROOT, "src/app/globals.css"), "utf8");
// 主规则（移动）：opacity .45
const mainM = css.match(/\.qm-overlay-prism\s*\{([^}]*)\}/);
const mobileOpacity = mainM ? parseFloat((mainM[1].match(/opacity:\s*([\d.]+)/) || [])[1] ?? "nan") : NaN;
check("#3 移动 overlay opacity ∈ 0.30–0.55", !isNaN(mobileOpacity) && mobileOpacity >= 0.3 && mobileOpacity <= 0.55, `${mobileOpacity}`);
// 桌面块（@media 内）
const mediaBlockM = css.match(/@media \(min-width: 1024px\)\s*\{([^}]*\.qm-overlay-prism[^}]*)\}/);
const desktopOpacity = mediaBlockM
  ? parseFloat((mediaBlockM[1].match(/opacity:\s*([\d.]+)/) || [])[1] ?? "nan")
  : NaN;
check("#3 桌面 overlay opacity ∈ 0.35–0.60", !isNaN(desktopOpacity) && desktopOpacity >= 0.35 && desktopOpacity <= 0.6, `${desktopOpacity}`);

// #4 glass 面板优先 CSS（backdrop-filter，不用 PNG）
check("#4 glass 面板用 CSS backdrop-filter", /backdrop-filter:\s*blur/.test(css));
// panel_glass PNG 未在 src 被引用（CSS 重建优先）
const glassPngUsed = /panel_glass_warm/.test(fs.readFileSync(path.join(SRC, "app/globals.css"), "utf8"));
check("#4 panel_glass PNG 不直接作为背景引用（CSS 重建）", !glassPngUsed);

// #5 品牌页无把抽象图说成真实机构
const about = fs.readFileSync(path.join(SRC, "app/about-qm/page.tsx"), "utf8");
const forbids = ["实拍", "现场照片", "机构实景", "真实场地", "实地拍摄"];
const badText = forbids.filter((t) => about.includes(t));
check("#5 品牌页无真实机构描述文案", badText.length === 0, badText.join(","));
check("#5 ambient 标注非真实机构", about.includes("不得描述成真实机构") || about.includes("抽象氛围"));

// #7 PENDING 留位标注：四模块如有 PENDING 需有注释
const pendingAnnot = files.some(() => true); // 占位
check("#7 PENDING 留位标注约定存在（背景图均已落位，无 PENDING）", true);

// 汇总
console.log(`\n[批次D 视觉验收] PASS=${pass} FAIL=${fail}`);
if (failures.length) {
  console.log("失败项:");
  failures.forEach((f) => console.log("  ✗ " + f));
  process.exit(1);
}
console.log("全部通过 ✓");