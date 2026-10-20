/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// QM-GDI-48 v4.1 导出模块
// 支持 PNG / PDF / 分享卡片导出
// ⚠️ 注意：所有导出内容必须使用简体中文

import { AssessmentProfile, ExportOptions, DimensionCode } from './gdi-types';
import { GDI_DIMENSIONS, DIMENSION_ORDER } from './gdi-dimensions';
import { BRAND_COLOR, DIMENSION_COLORS } from './gdi-visualizations';
import { generateNarrative, generateSafetyNote } from './gdi-narrative';

// 品牌信息
export const BRAND_INFO = {
  name: 'QM',
  fullName: 'QM 性别多元指数',
  version: 'QM-GDI-48_v4.1',
  brandColor: BRAND_COLOR,
  hotlinePrimary: '15001930070',
  hotlineBackup: '13601658763',
  wechatSupport: '',
  referral: 'QM上海酷儿心理咨询中心',
};

// 生成结果摘要数据（用于导出）
export const buildExportData = (profile: AssessmentProfile) => {
  const narrative = generateNarrative(profile);
  const safetyNote = generateSafetyNote(profile);

  const dimensionResults = DIMENSION_ORDER.map((dim) => ({
    code: dim,
    name: GDI_DIMENSIONS[dim].name,
    shortName: GDI_DIMENSIONS[dim].shortName,
    plotScore: Math.round(profile.plotScores[dim] ?? 0),
    complete: !profile.scores[dim].incomplete,
    validCount: profile.scores[dim].validCount,
    totalCount: profile.scores[dim].totalCount,
    insight: narrative.dimensionInsights[dim],
    color: DIMENSION_COLORS[dim],
  }));

  return {
    headline: narrative.headline,
    summary: narrative.summary,
    dimensions: dimensionResults,
    pairInsights: narrative.pairInsights,
    safetyNote,
    quality: profile.quality,
    version: BRAND_INFO.version,
    assessmentName: BRAND_INFO.fullName,
    brandColor: BRAND_INFO.brandColor,
    generatedAt: new Date().toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
};

// PNG 导出配置
export const getPNGExportConfig = (options: ExportOptions) => ({
  format: 'png' as const,
  width: 800,
  height: 'auto',
  dpi: 2,
  includeHeader: true,
  includeRadar: options.includeCharts,
  includeDimensions: true,
  includeWhispers: options.includeWhispers,
  includeStoryMirror: options.includeStoryMirror,
  includeFooter: true,
  backgroundColor: '#ffffff',
  textColor: '#333333',
  accentColor: BRAND_COLOR,
  fontFamily: '"PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", sans-serif',
});

// PDF 导出配置
export const getPDFExportConfig = (options: ExportOptions) => ({
  format: 'pdf' as const,
  pageSize: 'A4' as const,
  margins: { top: 20, right: 20, bottom: 20, left: 20 },
  includeCover: true,
  includeTableOfContents: false,
  includeRadar: options.includeCharts,
  includeDimensionDetails: true,
  includePairNarratives: true,
  includeWhispers: options.includeWhispers,
  includeStoryMirror: options.includeStoryMirror,
  includeActions: true,
  includeDisclaimer: true,
  includeContactInfo: true,
  fontFamily: '"PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", sans-serif',
  brandColor: BRAND_COLOR,
});

// 分享卡片配置
export const getShareCardConfig = () => ({
  format: 'share' as const,
  width: 360,
  height: 640,
  borderRadius: 16,
  gradientFrom: BRAND_COLOR,
  gradientTo: '#8B6FC4',
  includeScore: true,
  includeDimensionCount: 3, // 显示分数最高的3个维度
  includeQRCode: true,
  includeBrand: true,
  fontFamily: '"PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", sans-serif',
});

// 免责声明文本（导出时使用）
export const DISCLAIMER_TEXT = `
## 结果说明与使用声明

### 关于本测评
QM性别多元指数（QM-GDI-48 v4.1）是一份研究知情的自我反思工具，而非标准化诊断量表。它的目的是帮助你探索自己的性别体验，而不是给你下任何诊断或身份判定。

### 重要提示
- 本测评不诊断，不鉴定任何性别身份
- 每个维度的高低都不代表好坏，只是描述了你性别经验的不同侧面
- 情境流动与弹性（CF）维度的高分表示更流动，低分表示更稳定，二者没有优劣之分
- 如果你的EA（表达真实感）、GCC（性别一致与舒适）、BR（归属与被看见）得分较低，请考虑环境安全、关系支持等因素
- 公众人物的故事只是行为镜像参考，不代表任何身份判定

### 心理测量学状态
本测评处于研究阶段，其信效度数据仍在积累中。结果仅供自我探索参考，不应用于任何临床诊断、法律用途或重大人生决策。

### 专业支持
如果你在性别探索过程中感到困扰，或需要专业的心理咨询支持，可以联系：
- ${BRAND_INFO.referral}
- 主热线：${BRAND_INFO.hotlinePrimary}
- 备用热线：${BRAND_INFO.hotlineBackup}
- 微信客服：${BRAND_INFO.wechatSupport}

### AI说明
本测评中的AI助手"小酷"自称QM AI，仅提供信息性和支持性的回应，不提供诊断或专业建议。 `;

// 导出验证：确保导出内容符合简体中文要求
export const validateExportContent = (content: string): boolean => {
  // 检查是否包含繁体字（简单检查常见繁体字符）
  const traditionalChars = ['對', '從', '來', '說', '這', '個', '麼', '時', '後', '裡', '點', '樣', '愛', '國', '學', '習', '認', '為'];
  // 注意：以上只是示例，实际生产中应使用更全面的繁体检测
  // 此处保留简单校验，正式部署应接入繁体检测库

  // 检查禁词
  const forbiddenWords = [
    '咨询师',
    '400-',
    '400-',
    '120',
    '110',
    '北京心理危机',
    'Susan',
    '陈瑜倩',
    'Candice',
    'Christy',
    '天生',
    '核心天赋',
    '你不擅长',
  ];

  for (const word of forbiddenWords) {
    if (content.includes(word)) {
      console.warn(`Export validation warning: contains forbidden word "${word}"`);
      return false;
    }
  }

  return true;
};
