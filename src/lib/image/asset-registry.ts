/**
 * QM Image Asset Registry v2.0
 * 图片资产注册表 — 全站图片资产的单一事实源
 *
 * 命名规范：qm_{module}_{type}_{concept}_{device}_v{version}.{ext}
 * 如：qm_home_a1_calm-hero_desktop_v1.webp
 *
 * 注意：
 * - 真实人物/团队/心理师照片：source_type = REAL_AUTHORIZED，rights_status = PENDING，src 为空
 *   （上传真实授权照片后更新 src 并将 rights_status 改为 CLEARED）
 * - 抽象/符号/品牌占位：source_type = BRAND_GENERATED，rights_status = CLEARED
 * - 所有 A6 数据可视化：不使用图片 src，由前端真实数据渲染
 */

import {
  AssetType,
  DeviceVariant,
  ImageAsset,
  RightsStatus,
  SourceType,
} from "./types";

// ─── 性能预算常量 ───────────────────────────────────────────────
export const ASSET_PERFORMANCE_BUDGET = {
  hero_desktop_kb: 220,
  hero_mobile_kb: 140,
  card_kb: 90,
  portrait_kb: 80,
  symbol_svg_kb: 24,
} as const;

// ─── 资产注册表 ─────────────────────────────────────────────────
/**
 * 初始资产条目：覆盖 10 个页面模块的 A1-A6 类型
 * 共 18 条初始资产
 */
export const IMAGE_ASSET_REGISTRY: ImageAsset[] = [
  // ─── 首页 Home ──────────────────────────────────────────────
  {
    asset_id: "qm_home_a1_calm-hero_desktop_v1",
    module: "home",
    asset_type: AssetType.A1_EDITORIAL,
    device_variant: DeviceVariant.DESKTOP,
    aspect_ratio: "16:9",
    width: 1920,
    height: 1080,
    format: "webp",
    target_kb: ASSET_PERFORMANCE_BUDGET.hero_desktop_kb,
    alt_zh_hans: "柔和自然光下的静谧空间，体现心理温度与安心感",
    decorative: false,
    source_type: SourceType.AI_GENERATED,
    rights_status: RightsStatus.PENDING,
    content_version: 1,
    focal_point: { x: 65, y: 45 },
    safe_area: { top: 10, right: 60, bottom: 15, left: 8 },
    src_desktop: "",
    src_mobile: "",
    placeholder_color: "#F8F5FC",
  },
  {
    asset_id: "qm_home_a1_calm-hero_mobile_v1",
    module: "home",
    asset_type: AssetType.A1_EDITORIAL,
    device_variant: DeviceVariant.MOBILE,
    aspect_ratio: "4:5",
    width: 800,
    height: 1000,
    format: "webp",
    target_kb: ASSET_PERFORMANCE_BUDGET.hero_mobile_kb,
    alt_zh_hans: "柔和自然光下的静谧空间，体现心理温度与安心感",
    decorative: false,
    source_type: SourceType.AI_GENERATED,
    rights_status: RightsStatus.PENDING,
    content_version: 1,
    focal_point: { x: 50, y: 40 },
    safe_area: { top: 20, right: 10, bottom: 30, left: 10 },
    src_desktop: "",
    src_mobile: "",
    placeholder_color: "#F8F5FC",
  },
  {
    asset_id: "qm_home_a4_brand-aura_desktop_v1",
    module: "home",
    asset_type: AssetType.A4_ABSTRACT_AURA,
    device_variant: DeviceVariant.DESKTOP,
    aspect_ratio: "16:9",
    width: 1920,
    height: 1080,
    format: "webp",
    target_kb: 120,
    alt_zh_hans: "",
    decorative: true,
    source_type: SourceType.BRAND_GENERATED,
    rights_status: RightsStatus.CLEARED,
    content_version: 1,
    focal_point: { x: 50, y: 50 },
    safe_area: { top: 0, right: 0, bottom: 0, left: 0 },
    placeholder_color: "#EEE7F7",
  },

  // ─── 小酷 XiaoKu ─────────────────────────────────────────────
  {
    asset_id: "qm_xiaoku_a4_soft-aura_desktop_v1",
    module: "xiaoku",
    asset_type: AssetType.A4_ABSTRACT_AURA,
    device_variant: DeviceVariant.DESKTOP,
    aspect_ratio: "1:1",
    width: 800,
    height: 800,
    format: "webp",
    target_kb: 60,
    alt_zh_hans: "",
    decorative: true,
    source_type: SourceType.BRAND_GENERATED,
    rights_status: RightsStatus.CLEARED,
    content_version: 1,
    focal_point: { x: 50, y: 50 },
    safe_area: { top: 0, right: 0, bottom: 0, left: 0 },
    placeholder_color: "#FBEAF0",
  },

  // ─── 情绪树洞 Tree Hole ──────────────────────────────────────
  {
    asset_id: "qm_treehole_a3_paper-letter_desktop_v1",
    module: "treehole",
    asset_type: AssetType.A3_SPACE_MATERIAL,
    device_variant: DeviceVariant.DESKTOP,
    aspect_ratio: "16:9",
    width: 1200,
    height: 675,
    format: "webp",
    target_kb: 120,
    alt_zh_hans: "摊开的信纸与温暖灯光，传递倾诉与被倾听的安全感",
    decorative: false,
    source_type: SourceType.AI_GENERATED,
    rights_status: RightsStatus.PENDING,
    content_version: 1,
    focal_point: { x: 45, y: 55 },
    safe_area: { top: 15, right: 15, bottom: 15, left: 15 },
    placeholder_color: "#F4F1F5",
  },
  {
    asset_id: "qm_treehole_a4_deep-aura_desktop_v1",
    module: "treehole",
    asset_type: AssetType.A4_ABSTRACT_AURA,
    device_variant: DeviceVariant.DESKTOP,
    aspect_ratio: "16:9",
    width: 1920,
    height: 1080,
    format: "webp",
    target_kb: 100,
    alt_zh_hans: "",
    decorative: true,
    source_type: SourceType.BRAND_GENERATED,
    rights_status: RightsStatus.CLEARED,
    content_version: 1,
    focal_point: { x: 50, y: 50 },
    safe_area: { top: 0, right: 0, bottom: 0, left: 0 },
    placeholder_color: "#342050",
  },

  // ─── 心理测评 Assessment ─────────────────────────────────────
  {
    asset_id: "qm_assessment_a1_tech-hero_desktop_v1",
    module: "assessment",
    asset_type: AssetType.A1_EDITORIAL,
    device_variant: DeviceVariant.DESKTOP,
    aspect_ratio: "16:9",
    width: 1600,
    height: 900,
    format: "webp",
    target_kb: ASSET_PERFORMANCE_BUDGET.hero_desktop_kb,
    alt_zh_hans: "人在专注阅读的画面，体现科学测评与自我探索",
    decorative: false,
    source_type: SourceType.AI_GENERATED,
    rights_status: RightsStatus.PENDING,
    content_version: 1,
    focal_point: { x: 40, y: 50 },
    safe_area: { top: 10, right: 55, bottom: 15, left: 8 },
    placeholder_color: "#E8EAFE",
  },
  {
    asset_id: "qm_assessment_a4_tech-aura_desktop_v1",
    module: "assessment",
    asset_type: AssetType.A4_ABSTRACT_AURA,
    device_variant: DeviceVariant.DESKTOP,
    aspect_ratio: "16:9",
    width: 1200,
    height: 675,
    format: "webp",
    target_kb: 80,
    alt_zh_hans: "",
    decorative: true,
    source_type: SourceType.BRAND_GENERATED,
    rights_status: RightsStatus.CLEARED,
    content_version: 1,
    focal_point: { x: 50, y: 50 },
    safe_area: { top: 0, right: 0, bottom: 0, left: 0 },
    placeholder_color: "#E8EAFE",
  },

  // ─── 安排预约 Booking ────────────────────────────────────────
  {
    asset_id: "qm_booking_a3_counseling-space_desktop_v1",
    module: "booking",
    asset_type: AssetType.A3_SPACE_MATERIAL,
    device_variant: DeviceVariant.DESKTOP,
    aspect_ratio: "16:9",
    width: 1400,
    height: 788,
    format: "webp",
    target_kb: 150,
    alt_zh_hans: "温暖舒适的心理咨询空间一角，柔和光线与绿植",
    decorative: false,
    source_type: SourceType.AI_GENERATED,
    rights_status: RightsStatus.PENDING,
    content_version: 1,
    focal_point: { x: 50, y: 55 },
    safe_area: { top: 10, right: 50, bottom: 15, left: 8 },
    placeholder_color: "#F9F7FA",
  },

  // ─── 知识库 Knowledge ────────────────────────────────────────
  {
    asset_id: "qm_knowledge_a3_books-editorial_desktop_v1",
    module: "knowledge",
    asset_type: AssetType.A3_SPACE_MATERIAL,
    device_variant: DeviceVariant.DESKTOP,
    aspect_ratio: "16:9",
    width: 1400,
    height: 788,
    format: "webp",
    target_kb: 140,
    alt_zh_hans: "桌面上摊开的书籍与便签，呈现阅读与思考的氛围",
    decorative: false,
    source_type: SourceType.AI_GENERATED,
    rights_status: RightsStatus.PENDING,
    content_version: 1,
    focal_point: { x: 50, y: 60 },
    safe_area: { top: 10, right: 55, bottom: 15, left: 8 },
    placeholder_color: "#F4F1F5",
  },
  {
    asset_id: "qm_knowledge_a4_editorial-aura_desktop_v1",
    module: "knowledge",
    asset_type: AssetType.A4_ABSTRACT_AURA,
    device_variant: DeviceVariant.DESKTOP,
    aspect_ratio: "4:3",
    width: 800,
    height: 600,
    format: "webp",
    target_kb: 60,
    alt_zh_hans: "",
    decorative: true,
    source_type: SourceType.BRAND_GENERATED,
    rights_status: RightsStatus.CLEARED,
    content_version: 1,
    focal_point: { x: 50, y: 50 },
    safe_area: { top: 0, right: 0, bottom: 0, left: 0 },
    placeholder_color: "#F8F5FC",
  },

  // ─── 自助工具 Tools ──────────────────────────────────────────
  {
    asset_id: "qm_tools_a3_hand-light_desktop_v1",
    module: "tools",
    asset_type: AssetType.A3_SPACE_MATERIAL,
    device_variant: DeviceVariant.DESKTOP,
    aspect_ratio: "16:9",
    width: 1200,
    height: 675,
    format: "webp",
    target_kb: 120,
    alt_zh_hans: "双手与柔和光线的特写，传递陪伴与支持的力量",
    decorative: false,
    source_type: SourceType.AI_GENERATED,
    rights_status: RightsStatus.PENDING,
    content_version: 1,
    focal_point: { x: 50, y: 55 },
    safe_area: { top: 10, right: 50, bottom: 15, left: 8 },
    placeholder_color: "#FCEAE8",
  },

  // ─── 关于QM About ────────────────────────────────────────────
  {
    asset_id: "qm_about_a2_team-photo_desktop_v1",
    module: "about",
    asset_type: AssetType.A2_HUMAN_MOMENT,
    device_variant: DeviceVariant.DESKTOP,
    aspect_ratio: "16:9",
    width: 1600,
    height: 900,
    format: "webp",
    target_kb: ASSET_PERFORMANCE_BUDGET.hero_desktop_kb,
    alt_zh_hans: "QM团队合影",
    decorative: false,
    source_type: SourceType.REAL_AUTHORIZED,
    rights_status: RightsStatus.PENDING,
    content_version: 1,
    focal_point: { x: 50, y: 45 },
    safe_area: { top: 10, right: 10, bottom: 25, left: 10 },
    src_desktop: "",
    src_mobile: "",
    placeholder_color: "#F4F1F5",
  },
  {
    asset_id: "qm_about_a1_space-interior_desktop_v1",
    module: "about",
    asset_type: AssetType.A1_EDITORIAL,
    device_variant: DeviceVariant.DESKTOP,
    aspect_ratio: "16:9",
    width: 1400,
    height: 788,
    format: "webp",
    target_kb: 160,
    alt_zh_hans: "QM工作室内部空间，温暖的咨询环境",
    decorative: false,
    source_type: SourceType.REAL_AUTHORIZED,
    rights_status: RightsStatus.PENDING,
    content_version: 1,
    focal_point: { x: 50, y: 55 },
    safe_area: { top: 10, right: 50, bottom: 15, left: 8 },
    src_desktop: "",
    placeholder_color: "#F9F7FA",
  },

  // ─── 心理师 Therapists ───────────────────────────────────────
  {
    asset_id: "qm_therapists_a1-portrait-placeholder_desktop_v1",
    module: "therapists",
    asset_type: AssetType.A1_EDITORIAL,
    device_variant: DeviceVariant.DESKTOP,
    aspect_ratio: "3:4",
    width: 400,
    height: 533,
    format: "webp",
    target_kb: ASSET_PERFORMANCE_BUDGET.portrait_kb,
    alt_zh_hans: "心理师肖像占位",
    decorative: false,
    source_type: SourceType.BRAND_GENERATED,
    rights_status: RightsStatus.CLEARED,
    content_version: 1,
    focal_point: { x: 50, y: 35 },
    safe_area: { top: 10, right: 10, bottom: 10, left: 10 },
    placeholder_color: "#EEE7F7",
  },

  // ─── 费用 FAQ 联系 Fee/Contact ───────────────────────────────
  {
    asset_id: "qm_fee_a5_info-icon_desktop_v1",
    module: "fee",
    asset_type: AssetType.A5_SYMBOL,
    device_variant: DeviceVariant.DESKTOP,
    aspect_ratio: "1:1",
    width: 80,
    height: 80,
    format: "svg",
    target_kb: 4,
    alt_zh_hans: "",
    decorative: true,
    source_type: SourceType.BRAND_GENERATED,
    rights_status: RightsStatus.CLEARED,
    content_version: 1,
    focal_point: { x: 50, y: 50 },
    safe_area: { top: 0, right: 0, bottom: 0, left: 0 },
    placeholder_color: "#F8F5FC",
  },
  {
    asset_id: "qm_contact_a4_brand-soft_desktop_v1",
    module: "contact",
    asset_type: AssetType.A4_ABSTRACT_AURA,
    device_variant: DeviceVariant.DESKTOP,
    aspect_ratio: "16:9",
    width: 1200,
    height: 675,
    format: "webp",
    target_kb: 80,
    alt_zh_hans: "",
    decorative: true,
    source_type: SourceType.BRAND_GENERATED,
    rights_status: RightsStatus.CLEARED,
    content_version: 1,
    focal_point: { x: 50, y: 50 },
    safe_area: { top: 0, right: 0, bottom: 0, left: 0 },
    placeholder_color: "#F8F5FC",
  },
];

// ─── 查询函数 ──────────────────────────────────────────────────

/**
 * 根据 asset_id 获取资产条目
 */
export function getAssetById(assetId: string): ImageAsset | undefined {
  return IMAGE_ASSET_REGISTRY.find((a) => a.asset_id === assetId);
}

/**
 * 根据模块名获取该模块下的所有资产
 */
export function getAssetsByModule(module: string): ImageAsset[] {
  return IMAGE_ASSET_REGISTRY.filter((a) => a.module === module);
}

/**
 * 根据资产类型获取所有对应资产
 */
export function getAssetsByType(assetType: AssetType): ImageAsset[] {
  return IMAGE_ASSET_REGISTRY.filter((a) => a.asset_type === assetType);
}

/**
 * 获取指定模块和设备的 Hero 级资产
 */
export function getHeroAsset(
  module: string,
  device: DeviceVariant = DeviceVariant.DESKTOP,
): ImageAsset | undefined {
  return IMAGE_ASSET_REGISTRY.find(
    (a) =>
      a.module === module &&
      a.device_variant === device &&
      (a.asset_type === AssetType.A1_EDITORIAL ||
        a.asset_type === AssetType.A4_ABSTRACT_AURA),
  );
}
