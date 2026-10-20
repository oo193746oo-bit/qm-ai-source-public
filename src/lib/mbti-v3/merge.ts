/**
 * QM 93题MBTI风格人格偏好测试 v3.0 - 接入钩子
 *
 * 用途：将 MBTI v3.0 测试注册到项目的测评列表中。
 * 设计原则：不修改原项目的 data.ts，而是通过此文件提供 addToAssessments 钩子，
 *         由项目方在合适的位置调用此函数来合并配置。
 *
 * 使用方式：
 *   import { addToAssessments } from '@/lib/mbti-v3/merge';
 *   // 在项目初始化时调用
 *   const assessments = addToAssessments(originalAssessments);
 */

import type { MBTIQuestion } from './mbti-types';
import { mbtiQuestions93, QUESTION_COUNTS } from './mbti-questions-93';
import { calculateMBTIScore, buildAnswerMap } from './mbti-scoring';
import { getTypeInfo, ALL_TYPE_CODES } from './mbti-type-dictionary';

// ============================================================
// 测评配置（v3.0 升级版）
// ============================================================

export const mbtiV3AssessmentConfig = {
  id: 'mbti-v3',
  key: 'mbti_93',
  title: 'QM 93题MBTI风格人格偏好测试',
  shortTitle: 'MBTI人格偏好',
  version: '3.0.0',
  licensed: false,
  description: '93道题，探索你的四维人格偏好、clarity清晰度和个性化成长方向。',
  totalQuestions: QUESTION_COUNTS.total,
  estimatedMinutes: 10,
  categories: ['人格', '自我探索'],
  difficulty: '入门',
  tags: ['MBTI', '人格偏好', '93题', 'Story Mirror', '小酷耳语'],

  // 题库
  questions: mbtiQuestions93 as MBTIQuestion[],

  // 评分函数
  scoring: {
    calculateScore: calculateMBTIScore,
    buildAnswerMap: buildAnswerMap,
  },

  // 结果页路径
  resultPath: '/mbti',

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
    wechat: '',
  },
};

// ============================================================
// 合并钩子
// ============================================================

/**
 * 将 MBTI v3.0 测评配置添加到现有的测评列表中。
 * 不修改原数组，返回新数组。
 *
 * @param assessments 原有的测评配置数组
 * @param options 配置选项
 * @returns 合并后的测评配置数组
 */
export function addToAssessments<T extends Array<any>>(
  assessments: T,
  options: {
    replaceExisting?: boolean; // 如果存在旧版 MBTI，是否替换
    prepend?: boolean;        // 是否放到列表开头
  } = {}
): T {
  const { replaceExisting = true, prepend = false } = options;

  // 深拷贝原数组（浅拷贝即可，因为我们不修改内部对象）
  let result = [...assessments] as any[];

  // 如果需要替换旧版
  if (replaceExisting) {
    result = result.filter(
      (item) =>
        item.id !== 'mbti-v3' &&
        item.key !== 'mbti_93' &&
        !(item.id === 'mbti' && item.version?.startsWith?.('2'))
    );
  }

  // 添加 v3.0 配置
  if (prepend) {
    result.unshift(mbtiV3AssessmentConfig);
  } else {
    result.push(mbtiV3AssessmentConfig);
  }

  return result as T;
}

// ============================================================
// 便捷导出（供页面直接使用）
// ============================================================

export {
  mbtiQuestions93 as questions,
  QUESTION_COUNTS,
  calculateMBTIScore,
  buildAnswerMap,
  getTypeInfo,
  ALL_TYPE_CODES,
};

export type {
  MBTIQuestion,
  TypeCode,
  MBTIScoreResult,
  DimensionScore,
  ClarityLevel,
} from './mbti-types';
