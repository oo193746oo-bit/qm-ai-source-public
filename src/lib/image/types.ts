/**
 * QM Image Asset Type System v2.0
 * 全站图片资产类型定义 — 与 Aurora Mind Design Tokens 对齐
 *
 * 六类资产：
 * - A1  Editorial Photography  品牌Hero / 空间 / 人物局部
 * - A2  Human Moment           关系 / 情绪 / 多元生活
 * - A3  Space & Material       纸张 / 玻璃 / 织物 / 咨询空间
 * - A4  Abstract Aura          品牌背景 / AI角色 / 抽象心理概念
 * - A5  Symbol System          测评 / 工具 / 知识库 / 步骤 — 统一SVG
 * - A6  Data Visualization     测评结果 / 趋势 / 比较 — 真实数据渲染
 */

export enum AssetType {
  A1_EDITORIAL = "A1_EDITORIAL",
  A2_HUMAN_MOMENT = "A2_HUMAN_MOMENT",
  A3_SPACE_MATERIAL = "A3_SPACE_MATERIAL",
  A4_ABSTRACT_AURA = "A4_ABSTRACT_AURA",
  A5_SYMBOL = "A5_SYMBOL",
  A6_DATA_VIZ = "A6_DATA_VIZ",
}

export enum SourceType {
  /** 真实授权素材（心理师本人 / 团队 / 办公室实拍，已获得书面授权） */
  REAL_AUTHORIZED = "REAL_AUTHORIZED",
  /** 委托拍摄（商业摄影合作） */
  COMMISSIONED = "COMMISSIONED",
  /** AI 生成（仅允许用于 A4 抽象 / A5 符号 / 非特定人物概念） */
  AI_GENERATED = "AI_GENERATED",
  /** 授权图库（已购买商业授权） */
  LICENSED_STOCK = "LICENSED_STOCK",
  /** 品牌生成（品牌占位 / 渐变 / 几何图形，无版权风险） */
  BRAND_GENERATED = "BRAND_GENERATED",
}

export enum RightsStatus {
  /** 已审核 / 已授权 / 可上线 */
  CLEARED = "CLEARED",
  /** 待审核 / 待授权（占位状态，不显示真实图片） */
  PENDING = "PENDING",
  /** 受限使用（特定场景 / 特定尺寸） */
  RESTRICTED = "RESTRICTED",
  /** 禁止使用（版权不清晰 / 未授权） */
  BLOCKED = "BLOCKED",
}

export enum DeviceVariant {
  DESKTOP = "DESKTOP",
  MOBILE = "MOBILE",
}

export enum VisualLevel {
  /** 无图 — 信息清晰优先 */
  L0 = "L0",
  /** 微视觉 — 小图标 / 装饰线 / 小颗粒点缀 */
  L1 = "L1",
  /** 模块视觉 — 模块级配图，不抢主体 */
  L2 = "L2",
  /** 叙事视觉 / Hero — 同一屏最多一个 */
  L3 = "L3",
}

export enum ModuleColorRole {
  /** 小酷 — 暖色调，Human Connection */
  HUMAN_CONNECTION = "HUMAN_CONNECTION",
  /** 小雪 / 测评 — 蓝紫色，Tech Focus */
  TECH_FOCUS = "TECH_FOCUS",
  /** 树洞 — 深紫 / 深蓝，Deep Mind */
  DEEP_MIND = "DEEP_MIND",
  /** 知识库 — 中性 + 品牌色，Editorial */
  EDITORIAL = "EDITORIAL",
  /** 默认 — 品牌标准色 */
  BRAND_DEFAULT = "BRAND_DEFAULT",
}

export interface FocalPoint {
  /** 水平焦点百分比 0-100（默认 50） */
  x: number;
  /** 垂直焦点百分比 0-100（默认 50） */
  y: number;
}

export interface SafeArea {
  /** 顶部安全区百分比（文字不进入此区域） */
  top: number;
  /** 右侧安全区百分比 */
  right: number;
  /** 底部安全区百分比 */
  bottom: number;
  /** 左侧安全区百分比 */
  left: number;
}

export interface ImageAsset {
  /** 资产唯一 ID，命名规范：qm_{module}_{type}_{concept}_{device}_v{version} */
  asset_id: string;
  /** 所属模块：home / xiaoku / treehole / assessment / booking / knowledge / tools / about / therapists / fee */
  module: string;
  /** 资产类型 A1-A6 */
  asset_type: AssetType;
  /** 设备变体 */
  device_variant: DeviceVariant;
  /** 宽高比，如 "16:9" / "4:5" / "1:1" */
  aspect_ratio: string;
  /** 目标宽度（px） */
  width: number;
  /** 目标高度（px） */
  height: number;
  /** 文件格式：webp / jpg / png / svg */
  format: "webp" | "jpg" | "png" | "svg";
  /** 目标文件大小（KB） */
  target_kb: number;
  /** 简体中文 alt 文本；装饰图传空字符串 */
  alt_zh_hans: string;
  /** 是否为纯装饰图（true 时 alt=""，屏幕阅读器跳过） */
  decorative: boolean;
  /** 素材来源类型 */
  source_type: SourceType;
  /** 版权状态 — 非 CLEARED 不显示真实图片 */
  rights_status: RightsStatus;
  /** 内容版本号，如 1 */
  content_version: number;
  /** 焦点位置 — 用于响应式裁切锚点 */
  focal_point: FocalPoint;
  /** 文字安全区（百分比，0-100） */
  safe_area: SafeArea;
  /** Desktop 端图片路径（public/ 下相对路径），rights_status=CLEARED 时有效 */
  src_desktop?: string;
  /** Mobile 端图片路径（public/ 下相对路径），可选 */
  src_mobile?: string;
  /** 占位背景色（十六进制），用于 LQIP / 加载占位 */
  placeholder_color?: string;
}

export interface QmImageProps extends Omit<ImageAsset, "device_variant" | "src_desktop" | "src_mobile"> {
  /** Desktop 端图片路径 */
  src_desktop?: string;
  /** Mobile 端图片路径 */
  src_mobile?: string;
  /** 额外 className */
  className?: string;
  /** 是否为 LCP 图（设为 true 时 priority，不 lazy） */
  priority?: boolean;
  /** next/image sizes 属性 */
  sizes?: string;
  /** next/image quality（默认 75） */
  quality?: number;
}
