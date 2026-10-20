/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/**
 * QM 成人ADHD评估 v4.0 - 导出配置
 *
 * PNG / PDF / Share
 * 默认隐私版：隐藏功能损害细节、童年史、重叠因素与身份信息
 */

import type { ExportConfig, ExportFormat } from './types';

export const EXPORT_CONFIGS: ExportConfig[] = [
  {
    format: 'png',
    label: '保存长图',
    description: 'PNG长图，只保留非敏感摘要，便于保存和回顾',
    includes_sensitive: false,
    icon: '🖼️',
  },
  {
    format: 'pdf',
    label: 'PDF完整报告',
    description: 'A4 PDF，包含完整结果和专业评估准备表，适合就诊时携带',
    includes_sensitive: true,
    icon: '📄',
  },
  {
    format: 'share',
    label: '分享卡片',
    description: '精简分享卡片，默认隐藏敏感信息，适合分享给信任的人',
    includes_sensitive: false,
    icon: '📤',
  },
];

// 导出免责声明
export const EXPORT_DISCLAIMER = `
本报告基于你的自我报告生成，仅用于自我觉察和专业评估准备参考，不构成诊断。
请勿仅凭本报告做出医疗、教育或职业重大决定。
如需诊断或治疗建议，请咨询合格的心理师或精神科医生。 `;

// 生成导出文件名
export function generateExportFileName(
  format: ExportFormat,
  assessmentId: string = 'adult-adhd'
): string {
  const dateStr = new Date().toISOString().slice(0, 10);
  const formatMap: Record<ExportFormat, string> = {
    png: 'png',
    pdf: 'pdf',
    share: 'share.png',
  };
  return `QM_ADHD_${assessmentId}_${dateStr}.${formatMap[format]}`;
}

// 分享卡片内容（隐私版）
export function generateShareCardContent(profile: {
  core_inattention: number;
  core_hyperactivity: number;
  core_impulsivity: number;
  top_ef: string[];
  support_priority: string;
}): {
  title: string;
  summary: string;
  note: string;
} {
  return {
    title: '成人ADHD评估｜QM Context Profile',
    summary: `你完成了48题自我观察问卷。报告包含核心症状模式、执行功能画像和功能影响分析。`,
    note: '这是筛查与自我觉察工具，不是诊断。完整结果请在QM AI查看。',
  };
}

// 隐私保护规则
export const PRIVACY_RULES = {
  // PNG分享卡隐藏的信息
  share_hidden_fields: [
    'developmental_context.childhood_onset',
    'developmental_context.childhood_external_clues',
    'overlap_context',
    'functional_impact_detail',
    'opt_in_identity',
    '具体场景细节',
  ],
  // 哪些信息绝对不自动分享
  never_auto_share: [
    '童年史细节',
    '重叠因素回答',
    '身份信息',
    '功能影响具体评分',
  ],
};
