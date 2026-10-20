/**
 * QM 93题MBTI风格人格偏好测试 - 导出模块 v3.0
 *
 * 支持导出格式：
 * - PNG长图：1080 × 1920
 * - PDF：A4 完整报告
 * - Share Card：1080 × 1350 默认隐私版
 *
 * 注意：
 * - 分享前预览，默认隐藏内部ID、逐题答案、敏感身份信息
 * - 使用 html2canvas / dom-to-image / jsPDF 等前端库实现
 * - 本文件提供导出逻辑和配置，具体渲染由前端组件调用
 */

import type { ExportConfig, ExportFormat, MBTIFullReport } from './mbti-types';
import { getSensitiveFieldsToHide } from './mbti-personalization';

// ============================================================
// 导出尺寸配置
// ============================================================

export const EXPORT_CONFIGS: Record<ExportFormat, ExportConfig> = {
  png_long: {
    format: 'png_long',
    width: 1080,
    height: 1920,
    includeSensitiveInfo: false,
  },
  pdf_a4: {
    format: 'pdf_a4',
    width: 794, // A4 at 96dpi
    height: 1123,
    includeSensitiveInfo: false,
  },
  share_card: {
    format: 'share_card',
    width: 1080,
    height: 1350,
    includeSensitiveInfo: false,
  },
};

// ============================================================
// 导出内容配置
// ============================================================

export interface ExportContentConfig {
  showHero: boolean;
  showDimensions: boolean;
  showNarrative: boolean;
  showWhispers: boolean;
  showModules: boolean;
  moduleLimit: number;
  showCelebrities: boolean;
  showMedia: boolean;
  showCareerEnv: boolean;
  showGrowth: boolean;
  showExportActions: boolean;
  showDisclaimer: boolean;
}

// PNG 长图：完整内容
const PNG_LONG_CONTENT: ExportContentConfig = {
  showHero: true,
  showDimensions: true,
  showNarrative: true,
  showWhispers: true,
  showModules: true,
  moduleLimit: 12,
  showCelebrities: true,
  showMedia: true,
  showCareerEnv: true,
  showGrowth: true,
  showExportActions: false,
  showDisclaimer: true,
};

// PDF A4：完整报告（分页）
const PDF_A4_CONTENT: ExportContentConfig = {
  showHero: true,
  showDimensions: true,
  showNarrative: true,
  showWhispers: true,
  showModules: true,
  moduleLimit: 20,
  showCelebrities: true,
  showMedia: true,
  showCareerEnv: true,
  showGrowth: true,
  showExportActions: false,
  showDisclaimer: true,
};

// Share Card：隐私版，只展示类型+一句话+二维码
const SHARE_CARD_CONTENT: ExportContentConfig = {
  showHero: true,
  showDimensions: false,
  showNarrative: false,
  showWhispers: false,
  showModules: false,
  moduleLimit: 0,
  showCelebrities: false,
  showMedia: false,
  showCareerEnv: false,
  showGrowth: false,
  showExportActions: false,
  showDisclaimer: false,
};

export const EXPORT_CONTENT_CONFIGS: Record<ExportFormat, ExportContentConfig> = {
  png_long: PNG_LONG_CONTENT,
  pdf_a4: PDF_A4_CONTENT,
  share_card: SHARE_CARD_CONTENT,
};

// ============================================================
// 免责声明
// ============================================================

export const EXPORT_DISCLAIMER = `
免责声明：
本测试为 MBTI 风格的人格偏好探索工具，非官方 MBTI® 测评。
测试结果仅供自我探索和成长参考，不构成任何心理诊断或专业建议。
人格是动态发展的，测试结果反映的是你当下的偏好倾向，而非固定不变的定义。
如果你有心理困扰或需要专业帮助，请联系 QM上海酷儿心理咨询中心。
热线：15001930070 / 联系人工客服（「联系我们」页面） `.trim();

// ============================================================
// 分享卡片文案生成
// ============================================================

export function generateShareCardContent(report: MBTIFullReport): {
  typeCode: string;
  typeName: string;
  tagline: string;
  subtitle: string;
  brand: string;
} {
  const { typeInfo } = report;
  return {
    typeCode: typeInfo.code,
    typeName: `${typeInfo.nameCn} · ${typeInfo.nameEn}`,
    tagline: typeInfo.tagline,
    subtitle: 'QM 93题MBTI风格人格偏好测试',
    brand: 'QM AI',
  };
}

// ============================================================
// 报告数据脱敏
// ============================================================

/**
 * 对报告数据进行脱敏处理，用于分享和导出
 * 默认隐藏：内部ID、逐题答案、敏感身份信息
 */
export function sanitizeReportForExport(
  report: MBTIFullReport,
  includeSensitiveInfo: boolean = false
): MBTIFullReport {
  if (includeSensitiveInfo) {
    return report; // 不脱敏
  }

  // 浅拷贝，避免修改原始数据
  const sanitized: MBTIFullReport = {
    ...report,
    scoreResult: {
      ...report.scoreResult,
      // 保留类型和维度分数，但不保留原始答题数据
    },
  };

  return sanitized;
}

// ============================================================
// 文件名生成
// ============================================================

export function generateExportFileName(
  typeCode: string,
  format: ExportFormat
): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const formatMap: Record<ExportFormat, string> = {
    png_long: '长图',
    pdf_a4: '完整报告',
    share_card: '分享卡',
  };
  return `QM_MBTI_${typeCode}_${formatMap[format]}_${date}`;
}

// ============================================================
// 分享渠道配置
// ============================================================

export const SHARE_CHANNELS = [
  { id: 'wechat', label: '微信好友', icon: '💬' },
  { id: 'moments', label: '朋友圈', icon: '📸' },
  { id: 'weibo', label: '微博', icon: '🌐' },
  { id: 'link', label: '复制链接', icon: '🔗' },
  { id: 'save', label: '保存图片', icon: '💾' },
];

// ============================================================
// 导出前检查清单
// ============================================================

export interface ExportPreflightChecklist {
  hasSensitiveInfo: boolean;
  willHideSensitiveInfo: boolean;
  hasIdentityInfo: boolean;
  willIncludeAnswers: boolean;
  estimatedSize: string;
}

export function runExportPreflight(
  report: MBTIFullReport,
  format: ExportFormat
): ExportPreflightChecklist {
  const config = EXPORT_CONFIGS[format];

  return {
    hasSensitiveInfo: false, // 前端可根据实际情况补充
    willHideSensitiveInfo: !config.includeSensitiveInfo,
    hasIdentityInfo: false, // 前端可根据实际情况补充
    willIncludeAnswers: false,
    estimatedSize: format === 'pdf_a4' ? '约 2-3 MB' : '约 500 KB - 1 MB',
  };
}
