/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// QM 职业价值观测评 v4.0 — 导出配置
// PNG 长图、Share Card、PDF 完整报告
// 默认隐私：隐藏姓名、user_id、assessment_id、逐题答案、身份信息

import type { ExportConfig, ModuleCode } from './wv-types';

// QM 品牌色
export const QM_BRAND = {
  primary: '#6B4C9A', // 品牌紫
  secondary: '#A78BFA',
  accent: '#F59E0B',
  background: '#FFFFFF',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  surface: '#F9FAFB',
  border: '#E5E7EB',
} as const;

export const qmExportConfig: ExportConfig = {
  png: {
    width: 1080,
    height: 1920,
    modules: [
      'hero',
      'top3_cards',
      'radar',
      'value_map',
      'top_tension',
      'env_fit',
      'profile_signature',
      'share_chat',
    ],
  },
  shareCard: {
    width: 1080,
    height: 1350,
    modules: [
      'hero',
      'top3_cards',
      'profile_signature',
      'share_chat',
    ],
  },
  pdf: {
    format: 'A4',
    modules: [
      'hero',
      'top3_cards',
      'radar',
      'ranking',
      'dual_index',
      'value_map',
      'bottom2',
      'profile_signature',
      'pair_matrix',
      'top_synergy',
      'top_tension',
      'env_fit',
      'scene_job_search',
      'scene_offer',
      'scene_promotion',
      'scene_career_change',
      'scene_salary',
      'scene_burnout',
      'scene_work_family',
      'whispers',
      'story_people',
      'story_media',
      'seven_day',
      'interview_questions',
      'communication_script',
      'offer_comparison',
    ],
  },
  privacyDefault: {
    hideName: true,
    hideUserId: true,
    hideAssessmentId: true,
    hideAnswers: true,
    hideIdentity: true,
  },
};

// 导出选项（用户可切换）
export interface ExportOptions {
  includeName: boolean;
  includeUserId: boolean;
  includeAssessmentId: boolean;
  includeAnswers: boolean;
  includeIdentity: boolean;
  includeFullReport: boolean; // PDF 时是否包含完整模块
}

export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  includeName: false,
  includeUserId: false,
  includeAssessmentId: false,
  includeAnswers: false,
  includeIdentity: false,
  includeFullReport: true,
};

// 分享卡文案模板（非敏感摘要）
export const shareCardText = {
  title: '我的职业价值观 Top3',
  subtitle: '来自 QM AI 职业价值观测评',
  footer: '扫码测一测你的职业价值观',
  qrPlaceholder: '[QM QR Code]',
  disclaimer: '本测评仅为自我探索工具，不作诊断用途。',
};

// PNG 长图模块布局配置
export const pngLayout = {
  headerHeight: 120,
  moduleGap: 32,
  padding: 48,
  footerHeight: 100,
  moduleHeights: {
    hero: 180,
    top3_cards: 360,
    radar: 380,
    value_map: 340,
    top_tension: 280,
    env_fit: 320,
    profile_signature: 120,
    share_chat: 160,
  } as Partial<Record<ModuleCode, number>>,
};

// 验证导出配置
export function validateExportConfig(): {
  png: { width: number; height: number; modules: number };
  shareCard: { width: number; height: number; modules: number };
  pdf: { format: string; modules: number };
  privacyDefaults: boolean;
  brandColor: string;
} {
  return {
    png: {
      width: qmExportConfig.png.width,
      height: qmExportConfig.png.height,
      modules: qmExportConfig.png.modules.length,
    },
    shareCard: {
      width: qmExportConfig.shareCard.width,
      height: qmExportConfig.shareCard.height,
      modules: qmExportConfig.shareCard.modules.length,
    },
    pdf: {
      format: qmExportConfig.pdf.format,
      modules: qmExportConfig.pdf.modules.length,
    },
    privacyDefaults:
      qmExportConfig.privacyDefault.hideName &&
      qmExportConfig.privacyDefault.hideUserId &&
      qmExportConfig.privacyDefault.hideAssessmentId &&
      qmExportConfig.privacyDefault.hideAnswers &&
      qmExportConfig.privacyDefault.hideIdentity,
    brandColor: QM_BRAND.primary,
  };
}

// 转介信息（唯一正式转介渠道）
export const REFERRAL_INFO = {
  organization: 'QM 上海酷儿心理咨询中心',
  hotline: '15001930070',
  wechat: '',
  note: '如需专业心理支持，可联系 QM 上海酷儿心理咨询中心。',
};

// AI 身份
export const AI_IDENTITY = {
  name: '小酷',
  fullIntroduction: 'QM AI（小酷）',
  selfReference: '小酷',
  brand: 'QM',
};

// 品牌注意事项
export const BRAND_GUIDELINES = {
  noRealTherapistNames: true, // 不出现真实心理师姓名
  noHotlineNumbers: ['400', '120', '110', '北京心理危机中心'], // 禁用热线
  onlyQMReferral: true, // 唯一转介 QM
  usePsychologist: false, // 不用"咨询师"，用户可见处用"心理师"
  language: 'zh-Hans', // 全部简体中文
};
