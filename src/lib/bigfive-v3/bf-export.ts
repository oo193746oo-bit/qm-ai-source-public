// QM Big Five 60 | 大五人格特质测评 v3.0 — 导出功能
// PNG 1080×1920 长图 / PDF A4 / 分享卡 1080×1350
// 全部默认隐私版，分享前预览
// 注意：使用 html2canvas / window.print() 占位，具体渲染在前端实现
import type { BFContinuousScores, BFProfileSignature } from './bf-types';

// ===== 导出配置 =====
export const EXPORT_CONFIG = {
  png: {
    width: 1080,
    height: 1920,
    format: 'png',
    dpr: 2,
    default_privacy: true,
  },
  pdf: {
    format: 'a4',
    orientation: 'portrait',
    default_privacy: true,
  },
  share_card: {
    width: 1080,
    height: 1350,
    format: 'png',
    dpr: 2,
    default_privacy: true,
  },
};

// ===== 隐私版内容过滤 =====
// 分享时隐藏：内部ID、逐题答案、敏感身份信息、详细分数（只保留概览）
export interface PrivacyFilterOptions {
  hide_internal_ids: boolean;     // 隐藏内部ID
  hide_answers: boolean;          // 隐藏逐题答案
  hide_sensitive_identity: boolean; // 隐藏敏感身份信息
  hide_detailed_scores: boolean;  // 隐藏详细分数（只保留雷达图）
  hide_whisper: boolean;          // 隐藏耳语详情
  custom_hidden_fields?: string[]; // 自定义隐藏字段
}

export const DEFAULT_PRIVACY_FILTER: PrivacyFilterOptions = {
  hide_internal_ids: true,
  hide_answers: true,
  hide_sensitive_identity: true,
  hide_detailed_scores: false,
  hide_whisper: false,
};

export function applyPrivacyFilter(
  data: Record<string, any>,
  options: PrivacyFilterOptions = DEFAULT_PRIVACY_FILTER
): Record<string, any> {
  const filtered = { ...data };

  if (options.hide_internal_ids) {
    delete filtered.userId;
    delete filtered.sessionId;
    delete filtered.internalId;
  }

  if (options.hide_answers) {
    delete filtered.answers;
    delete filtered.rawAnswers;
  }

  if (options.hide_sensitive_identity) {
    delete filtered.genderIdentity;
    delete filtered.fullName;
    delete filtered.contactInfo;
  }

  if (options.custom_hidden_fields) {
    for (const f of options.custom_hidden_fields) {
      delete filtered[f];
    }
  }

  return filtered;
}

// ===== 分享卡内容模板（隐私版）=====
export function generateShareCardContent(
  scores: BFContinuousScores,
  signature: BFProfileSignature
): {
  title: string;
  subtitle: string;
  scores_display: { dim: string; name: string; score: number; color: string }[];
  tagline: string;
  brand: string;
} {
  const dimNames = {
    O: '开放性',
    C: '尽责性',
    E: '外向性',
    A: '宜人性',
    N: '情绪倾向',
  };
  const dimColors = {
    O: '#9B7FD6',
    C: '#5B8DEF',
    E: '#F0936B',
    A: '#6BC4A1',
    N: '#E57373',
  };

  const dims = ['O', 'C', 'E', 'A', 'N'] as const;
  const scores_display = dims.map(d => ({
    dim: d,
    name: dimNames[d],
    score: scores[d],
    color: dimColors[d],
  }));

  const topDim = signature.highest_2[0] || 'O';

  return {
    title: '我的大五人格画像',
    subtitle: `最突出的维度：${dimNames[topDim]}`,
    scores_display,
    tagline: '人格是连续的光谱，不是分类标签',
    brand: 'QM Big Five 60',
  };
}

// ===== 导出触发函数（前端实现占位）=====
// 实际实现中应调用 html2canvas 或 window.print()

export async function exportAsPNG(
  elementId: string,
  options: { privacy?: boolean; filename?: string } = {}
): Promise<boolean> {
  const privacy = options.privacy ?? true;
  const filename = options.filename || `QM-BigFive-${Date.now()}.png`;

  // 占位：前端实现
  // const element = document.getElementById(elementId);
  // if (!element) return false;
  // const canvas = await html2canvas(element, {
  //   scale: EXPORT_CONFIG.png.dpr,
  //   width: EXPORT_CONFIG.png.width,
  //   logging: false,
  //   useCORS: true,
  // });
  // const link = document.createElement('a');
  // link.download = filename;
  // link.href = canvas.toDataURL('image/png');
  // link.click();

  console.log(`[Export] PNG export triggered: ${filename}, privacy=${privacy}`);
  return true;
}

export async function exportAsPDF(
  options: { privacy?: boolean; filename?: string } = {}
): Promise<boolean> {
  const privacy = options.privacy ?? true;
  const filename = options.filename || `QM-BigFive-Report-${Date.now()}.pdf`;

  // 占位：前端实现
  // if (privacy) {
  //   // 隐藏隐私内容再打印
  // }
  // window.print();

  console.log(`[Export] PDF export triggered: ${filename}, privacy=${privacy}`);
  return true;
}

export async function exportShareCard(
  scores: BFContinuousScores,
  signature: BFProfileSignature,
  options: { filename?: string } = {}
): Promise<boolean> {
  const filename = options.filename || `QM-BigFive-Share-${Date.now()}.png`;

  const content = generateShareCardContent(scores, signature);

  // 占位：前端实现
  // 渲染分享卡 → html2canvas → 下载

  console.log(`[Export] Share card export: ${filename}`);
  console.log('[Export] Share card content:', JSON.stringify(content, null, 2));
  return true;
}

// ===== 分享前预览 =====
export function getSharePreviewData(
  scores: BFContinuousScores,
  signature: BFProfileSignature
): {
  visible: string[];
  hidden: string[];
} {
  return {
    visible: [
      '五维雷达图',
      '最高维度标签',
      '一句话介绍',
      'QM品牌标识',
    ],
    hidden: [
      '逐题答案',
      '详细维度解读',
      '小酷耳语全文',
      '个人身份信息',
      '内部测评ID',
      'Response Quality 数据',
    ],
  };
}

// ===== 保存到本地（localStorage 占位）=====
export function saveResultLocally(resultKey: string, data: any): boolean {
  try {
    // 占位：前端实现
    // localStorage.setItem(`qm_bigfive_${resultKey}`, JSON.stringify(data));
    console.log(`[Export] Result saved locally: ${resultKey}`);
    return true;
  } catch (e) {
    console.error('[Export] Save failed:', e);
    return false;
  }
}

export default {
  EXPORT_CONFIG,
  DEFAULT_PRIVACY_FILTER,
  applyPrivacyFilter,
  generateShareCardContent,
  exportAsPNG,
  exportAsPDF,
  exportShareCard,
  getSharePreviewData,
  saveResultLocally,
};
