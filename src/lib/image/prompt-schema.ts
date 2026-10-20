/**
 * QM Image Prompt Schema v2.0
 * 工具无关的图片生成提示工程 — 可用于 Midjourney / DALL-E / Firefly / SDXL 等
 *
 * 字段：
 * [ASSET_TYPE] [PAGE_MODULE] [USER_PURPOSE] [SUBJECT] [EMOTIONAL_TONE]
 * [COMPOSITION] [LIGHTING] [MATERIAL] [QM_COLOR_ROLE] [NEGATIVE_SPACE]
 * [REALISM] [DIVERSITY_RULE] [DO_NOT_INCLUDE] [CROP_SAFE_AREA] [OUTPUT_RATIO]
 */

import { AssetType, ModuleColorRole } from "./types";

// ─── 品牌前缀 ──────────────────────────────────────────────────
/**
 * 品牌前缀 — 每张生成图的开头
 */
export const BRAND_PREFIX =
  "Premium editorial mental-health visual for QM Queer Mental, calm, intelligent, inclusive, contemporary, psychologically warm, restrained, low saturation, tactile materiality, soft directional light, generous negative space.";

// ─── 人物追加 ──────────────────────────────────────────────────
/**
 * 人物追加 — 涉及人物时添加
 */
export const PERSON_SUFFIX =
  "Natural candid posture, realistic skin texture, non-staged, non-corporate, diverse without tokenization. Direct eye contact optional.";

// ─── Negative Prompt ───────────────────────────────────────────
/**
 * 全局 Negative Prompt
 */
export const NEGATIVE_PROMPT =
  "Cheap 3D, glossy plastic, corporate handshake, exaggerated smile, stock-photo look, neon cyberpunk, rainbow tokenism, over-retouched skin, text in image, fake therapist portrait, distorted hands, deformed faces, extra fingers, watermark, logo, QR code.";

// ─── 模块 → 色彩角色映射 ───────────────────────────────────────
/**
 * 模块色彩角色 — 决定图片的主色调倾向
 */
export const MODULE_COLOR_ROLE: Record<string, ModuleColorRole> = {
  // 小酷 — 暖色调，Human Connection
  xiaoku: ModuleColorRole.HUMAN_CONNECTION,
  // 小雪 / 测评 — 蓝紫色，Tech Focus
  xiaoxue: ModuleColorRole.TECH_FOCUS,
  assessment: ModuleColorRole.TECH_FOCUS,
  // 树洞 — 深紫 / 深蓝，Deep Mind
  treehole: ModuleColorRole.DEEP_MIND,
  // 知识库 — 中性 + 品牌色，Editorial
  knowledge: ModuleColorRole.EDITORIAL,
  // 默认品牌色
  home: ModuleColorRole.BRAND_DEFAULT,
  booking: ModuleColorRole.BRAND_DEFAULT,
  tools: ModuleColorRole.HUMAN_CONNECTION,
  about: ModuleColorRole.BRAND_DEFAULT,
  therapists: ModuleColorRole.BRAND_DEFAULT,
  fee: ModuleColorRole.BRAND_DEFAULT,
  contact: ModuleColorRole.BRAND_DEFAULT,
};

// ─── 色彩角色描述 ──────────────────────────────────────────────
const COLOR_ROLE_DESCRIPTIONS: Record<ModuleColorRole, string> = {
  [ModuleColorRole.HUMAN_CONNECTION]:
    "Warm human connection palette: soft rose, warm amber, gentle coral, with subtle brand purple accents. Skin tones remain natural and true, never tinted purple.",
  [ModuleColorRole.TECH_FOCUS]:
    "Tech focus palette: calm indigo, clear cyan, muted purples. Precise, intelligent, clear-headed atmosphere.",
  [ModuleColorRole.DEEP_MIND]:
    "Deep mind palette: deep purple, midnight indigo, soft navy. Contemplative, safe, introspective atmosphere — never scary or gloomy.",
  [ModuleColorRole.EDITORIAL]:
    "Editorial neutral palette: warm off-white, soft paper tones, with brand purple as accent highlight. Magazine-quality reading atmosphere.",
  [ModuleColorRole.BRAND_DEFAULT]:
    "Brand palette anchored in QM purple (#6B4C9A) with soft gradient transitions. Purple is anchor, not overlay filter.",
};

// ─── 资产类型描述 ──────────────────────────────────────────────
const ASSET_TYPE_DESCRIPTIONS: Record<AssetType, string> = {
  [AssetType.A1_EDITORIAL]:
    "A1 Editorial Photography — premium editorial style, soft directional light, generous negative space, tactile materiality, restrained composition.",
  [AssetType.A2_HUMAN_MOMENT]:
    "A2 Human Moment — authentic human connection, candid emotions, diverse people shown as whole persons first, identities second. No tokenization, no stereotypes.",
  [AssetType.A3_SPACE_MATERIAL]:
    "A3 Space & Material — material-driven: paper, glass, fabric, wood, books, counseling space details. Texture and warmth as primary visual language.",
  [AssetType.A4_ABSTRACT_AURA]:
    "A4 Abstract Aura — abstract gradient fields, soft light, atmospheric depth. Brand-aligned, no figurative representation, pure color and light.",
  [AssetType.A5_SYMBOL]:
    "A5 Symbol System — minimal geometric SVG-style line icon, single stroke weight, optically balanced. Not a photograph.",
  [AssetType.A6_DATA_VIZ]:
    "A6 Data Visualization — NOTE: Real data charts must be rendered by frontend code from actual computed data, NOT generated as AI images. This type is for conceptual reference only.",
};

// ─── buildImagePrompt 函数 ─────────────────────────────────────

export interface BuildImagePromptOptions {
  /** 资产类型 */
  asset_type: AssetType;
  /** 模块名（用于推断色彩角色） */
  module: string;
  /** 用户目的 / 使用场景 */
  purpose?: string;
  /** 主体描述 */
  subject?: string;
  /** 情绪基调 */
  tone?: string;
  /** 构图方式 */
  composition?: string;
  /** 光线描述 */
  lighting?: string;
  /** 材质倾向 */
  material?: string;
  /** 覆盖色彩角色（不指定则按 module 推断） */
  color_role?: ModuleColorRole;
  /** 留白比例描述 */
  negative_space?: string;
  /** 真实度描述 */
  realism?: string;
  /** 多元化要求 */
  diversity?: string;
  /** 裁切安全区描述 */
  crop_safe?: string;
  /** 输出比例，如 "16:9" / "4:5" */
  output_ratio?: string;
}

/**
 * 构建完整的图片生成 Prompt
 */
export function buildImagePrompt(options: BuildImagePromptOptions): string {
  const {
    asset_type,
    module,
    purpose = "",
    subject = "",
    tone = "calm, warm, trustworthy",
    composition = "balanced, editorial framing",
    lighting = "soft directional natural light, gentle contrast",
    material = "",
    color_role,
    negative_space = "generous, breathing room",
    realism = "photorealistic, natural skin texture, no over-retouching",
    diversity = "diverse without tokenization, authentic representation",
    crop_safe = "important content centered, safe margins for responsive cropping",
    output_ratio = "16:9",
  } = options;

  const role = color_role ?? MODULE_COLOR_ROLE[module] ?? ModuleColorRole.BRAND_DEFAULT;
  const colorDesc = COLOR_ROLE_DESCRIPTIONS[role];
  const typeDesc = ASSET_TYPE_DESCRIPTIONS[asset_type];

  const hasHuman =
    asset_type === AssetType.A1_EDITORIAL ||
    asset_type === AssetType.A2_HUMAN_MOMENT;

  const parts: string[] = [
    BRAND_PREFIX,
    "", `[ASSET_TYPE] ${typeDesc}`, `[MODULE] ${module}`,
    purpose && `[PURPOSE] ${purpose}`,
    subject && `[SUBJECT] ${subject}`, `[TONE] ${tone}`, `[COMPOSITION] ${composition}`, `[LIGHTING] ${lighting}`,
    material && `[MATERIAL] ${material}`, `[COLOR_ROLE] ${colorDesc}`, `[NEGATIVE_SPACE] ${negative_space}`, `[REALISM] ${realism}`, `[DIVERSITY] ${diversity}`, `[CROP_SAFE] ${crop_safe}`, `[OUTPUT_RATIO] ${output_ratio}`,
    "",
    hasHuman && `[PERSON_NOTE] ${PERSON_SUFFIX}`,
    "", `[NEGATIVE] ${NEGATIVE_PROMPT}`,
  ].filter(Boolean) as string[];

  return parts.join("\n");
}

// ─── MASTER_PROMPT ─────────────────────────────────────────────
/**
 * 总控 Master Prompt — QM IMAGE LANGUAGE ORCHESTRATOR v2.0
 * 用于任何生成任务前的系统级约束
 */
export const MASTER_PROMPT = `【QM IMAGE LANGUAGE ORCHESTRATOR v2.0】
目标：把QM图片从"每页找一张紫色图"升级为长期可维护的Image Language System，并与QM Aurora Mind统一。

P0 规则（必须遵守）：
1. 图片不是页面必填项；先判断是否提供品牌、理解、信任、导航或叙事价值。纯装饰且影响阅读/性能时不用图。
2. 禁止"所有Hero必须有图、所有卡片必须有图"。
3. 只使用A1-A6六类资产。
4. 色彩只读取QM Aurora Mind Design Tokens；紫色是锚点，不是全站滤镜。
5. 小酷偏Human Connection；小雪/测评偏Tech Focus；树洞偏Deep Mind；知识库偏Editorial。
6. 人物先是一个真实的人，再是身份语境；禁止把LGBTQ+、海外华人、多元性别做成刻板图库。
7. 具体心理师、团队、办公室只能使用真实且已授权素材；无素材用品牌占位，不得AI生成假人替代。
8. 雷达图、柱状图、百分比、趋势图必须由真实数据渲染；AI图片只能做背景/概念视觉。
9. 每个资产记录Desktop/Mobile构图、alt、来源、版权状态、版本、focal point、safe area。
10. Desktop与Mobile不允许同一Hero粗暴居中裁切。
11. 生成图默认不含可读文字；正文/标题/logo由前端渲染。
12. 全部用户可见中文为简体中文。

决策路径：
模块 → 是否需要图 → 资产类型 → Aurora Mind色彩角色 → Desktop/Mobile构图 → 真实性/隐私/数据/版权门控 → alt/命名 → 压缩/响应式加载。

Aurora Mind 色板锚点：
- 品牌紫：#6B4C9A（锚点，不是滤镜）
- Tech：indigo #3F46A8→#6670E8，cyan #2389A6→#36A4BE
- Warm：rose #B84F78→#D0648E，amber #A66A18→#C78726，coral #D56F68
- Neutral：ink #19161D→#807886，line #D8D1DD→#F0EBF3
- Semantic：success #2F8A6A，warning #B67822，danger #B84D5B，info #5262B8

生成后自检：
- 手/眼/脸自然，无畸形
- 无错误文字/logo/QR
- 不身份刻板，不彩虹旗套路
- 文字安全区完整
- Mobile可独立构图
- 与Aurora Mind色板一致
- 肤色不被紫色overlay污染`;
