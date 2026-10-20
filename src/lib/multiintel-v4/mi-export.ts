/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// QM AI 多元智能测评 v4.0 — 导出配置
// PNG / PDF / Share 卡片配置，品牌色 #6B4C9A

import type { ExportConfig } from './mi-types';
import { QM_BRAND_COLOR, QM_BRAND_NAME } from './mi-types';

export function getExportConfig(): ExportConfig {
  return {
    png: {
      width: 750,
      height: 1800,
      includeBottom2: false,
      includeUserId: false,
      includeAnswers: false,
    },
    pdf: {
      format: 'A4',
      includeFullDashboard: true,
      includePrivateData: false,
    },
    shareCard: {
      width: 1080,
      height: 1440,
      showBottom2: false,
      showScoreDetails: false,
    },
    brandColor: QM_BRAND_COLOR,
    brandName: QM_BRAND_NAME,
  };
}

// 分享文案模板
export const SHARE_COPY_TEMPLATES = {
  headline: '我做了 QM AI 多元智能测评',
  subtitle: '发现了我的智能使用方式',
  cta: '你也来试试？',
  disclaimer: '结果仅供自我探索参考，不作为诊断依据。',
};

// 导出文件名生成
export function generateExportFileName(type: 'png' | 'pdf' | 'share'): string {
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const typeNames = { png: '多元智能报告', pdf: '多元智能完整报告', share: '多元智能分享卡' };
  return `QM_AI_${typeNames[type]}_${dateStr}.${type}`;
}
