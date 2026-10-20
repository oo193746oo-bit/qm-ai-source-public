/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// QM-GDI-48 v4.1 集成钩子
// 导出 gdiV41Assessment（兼容 AssessmentInfo 接口）
// 和 addGdiV41(existing: AssessmentInfo[]): AssessmentInfo[]
// 函数逻辑：替换已有 id='gender-diversity' 的条目；如果没有则追加
// 不新建id，保持 assessment_id = 'gender-diversity'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const gdiV41Assessment: any = {
  id: 'gender-diversity',
  title: '性别多元指数',
  subtitle: 'QM-GDI-48 v4.1',
  version: 'QM-GDI-48_v4.1',
  description:
    '一份研究知情的自我探索工具，从8个维度描绘你的性别多元画像。不诊断，不鉴定身份，高低都不是优劣。',
  route: '/assessments/gender-diversity',
  validated: false,
  normStatus: 'unapproved',
  rawReadOnly: true,
  questionCount: 48,
  dimensionCount: 8,
  estimatedMinutes: '8-12',
  likertScale: {
    min: 1,
    max: 7,
    labels: ['非常不符合', '比较不符合', '稍微不符合', '中立', '稍微符合', '比较符合', '非常符合'],
    naAllowed: true,
    naLabel: '不适用 / 不想回答',
  },
  qualityGate: {
    minCompletionFull: 0.9,
    minCompletionPartial: 0.75,
    veryFastSeconds: 120,
    fastSeconds: 240,
    longstringFlag: 18,
  },
  brandColor: '#6B4C9A',
  hotline: {
    primary: '15001930070',
    backup: '13601658763',
  },
  wechatSupport: '',
  referral: 'QM上海酷儿心理咨询中心',
};

/**
 * 将 GDI v4.1 测评集成到现有测评列表中
 * - 如果已有 id='gender-diversity' 的条目，替换为新版
 * - 如果没有，则追加到列表末尾
 * - 不新建id，保持 assessment_id 不变
 *
 * @param existing - 现有的测评信息数组
 * @returns 更新后的测评信息数组
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const addGdiV41 = (existing: any[]): any[] => {
  const index = existing.findIndex((a) => a.id === 'gender-diversity');

  if (index >= 0) {
    // 替换已有条目（覆盖更新）
    const updated = [...existing];
    updated[index] = gdiV41Assessment;
    return updated;
  }

  // 没有则追加
  return [...existing, gdiV41Assessment];
};

/**
 * 检查是否已经集成了 GDI v4.1
 * @param existing - 现有的测评信息数组
 * @returns 是否已存在且为v4.1版本
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const hasGdiV41 = (existing: any[]): boolean => {
  const found = existing.find((a) => a.id === 'gender-diversity');
  return found?.version === 'QM-GDI-48_v4.1';
};

export default {
  assessment: gdiV41Assessment,
  addGdiV41,
  hasGdiV41,
};
