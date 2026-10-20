/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/**
 * QM 成人ADHD评估 v4.0 - 接入钩子
 *
 * 用途：将成人ADHD评估注册到项目的测评列表中。
 * 设计原则：不修改原项目的 data.ts，而是通过此文件提供 addToAssessments 钩子，
 *         由项目方在合适的位置调用此函数来合并配置。
 *
 * 使用方式：
 *   import { addToAssessments } from '@/lib/adult-adhd-v4/merge';
 *   // 在项目初始化时调用
 *   const assessments = addToAssessments(originalAssessments);
 */

import { adhdQuestions48, QUESTION_COUNT } from './questions-48';
import { calculateADHDScore, buildAnswerMap } from './scoring';
import { ASSESSMENT_ID, ASSESSMENT_VERSION, ESTIMATED_MINUTES } from './types';
import type { ADHDQuestion } from './types';

// ============================================================
// 测评配置（v4.0）
// ============================================================

export const adultAdhdV4Config = {
  id: 'adult-adhd',
  key: 'adult_adhd_v4',
  title: '成人ADHD评估',
  shortTitle: '成人ADHD评估',
  version: ASSESSMENT_VERSION,
  licensed: false,
  description:
    '48道题，双层循证架构（Evidence Screener + QM Context Profile），结构化自我观察工具。',
  totalQuestions: QUESTION_COUNT,
  estimatedMinutes: ESTIMATED_MINUTES,
  categories: ['心理健康', '自我探索'],
  difficulty: '入门',
  tags: ['ADHD', '注意力', '执行功能', 'Story Mirror', '小酷耳语', '双层循证'],

  // 题库
  questions: adhdQuestions48 as ADHDQuestion[],

  // 评分函数
  scoring: {
    calculateScore: calculateADHDScore,
    buildAnswerMap: buildAnswerMap,
  },

  // 结果页路径（独立路由）
  resultPath: '/adult-adhd',

  // 独立页面标识
  standalonePage: true,

  // 品牌信息
  brand: {
    name: 'QM AI',
    aiName: '小酷',
    primaryColor: '#6B4C9A',
  },

  // 转介信息
  referral: {
    name: 'QM上海酷儿心理咨询中心',
    hotline: '15001930070',
    hotlineBackup: '13601658763',
    wechat: '',
  },
};

// ============================================================
// 合并钩子
// ============================================================

/**
 * 将成人ADHD评估 v4.0 配置添加到现有的测评列表中。
 * 不修改原数组，返回新数组。
 *
 * @param assessments 原有的测评配置数组
 * @param options 配置选项
 * @returns 合并后的测评配置数组
 */
export function addToAssessments<T extends Array<any>>(
  assessments: T,
  options: {
    replaceExisting?: boolean;
    prepend?: boolean;
  } = {}
): T {
  const { replaceExisting = true, prepend = false } = options;

  let result = [...assessments] as any[];

  if (replaceExisting) {
    result = result.filter(
      (item) =>
        item.id !== 'adult-adhd' &&
        item.key !== 'adult_adhd_v4' &&
        !(item.id === 'adhd' && item.version?.startsWith?.('3'))
    );
  }

  if (prepend) {
    result.unshift(adultAdhdV4Config);
  } else {
    result.push(adultAdhdV4Config);
  }

  return result as T;
}

// ============================================================
// 便捷导出
// ============================================================

export {
  adhdQuestions48 as questions,
  QUESTION_COUNT,
  calculateADHDScore,
  buildAnswerMap,
};

export type { ADHDQuestion } from './types';
