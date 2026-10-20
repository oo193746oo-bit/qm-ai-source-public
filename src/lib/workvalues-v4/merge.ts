/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// QM 职业价值观测评 v4.0 — 集成钩子
// 将 v4.0 职业价值观模块注册到现有测评系统中
// 使用方式：在主应用的 assessments 注册处调用 addWorkValuesV4()

import type { AssessmentInfo } from '../assessments/data';
import { wvQuestions24, QUESTIONNAIRE_VERSION } from './wv-questions-24';
import { wvDimensions as wvDimContent } from './wv-dimensions';
import { DIMENSION_ORDER } from './wv-types';

/**
 * v4.0 职业价值观测评定义
 * 兼容现有 AssessmentInfo 接口，同时包含 v4.0 专用扩展
 */
export const workValuesV4Assessment = {
  id: 'work-values-v4',
  title: '职业价值观测评',
  subtitle: 'v4.0 · 8 项核心价值 + 28 组组合 + 12 职业场景',
  description:
    '发现对你最重要的职业价值，了解价值之间的协同与张力，' +
    '在求职、选offer、转行、倦怠等12种职业场景中获得具体的行动指引。',
  duration: '约 5-8 分钟',
  questionCount: 24,
  icon: '🎯',
  color: 'from-purple-500 to-purple-600',
  questionnaireVersion: QUESTIONNAIRE_VERSION,
  rawReadOnly: true,
  version: 'v4.0',
  dimensions: DIMENSION_ORDER.map((code) => ({
    code,
    name: wvDimContent[code].name,
    description: wvDimContent[code].description,
    color: wvDimContent[code].color,
  })),
  questions: wvQuestions24.map((q) => ({
    id: q.id,
    text: q.text,
    dimension: q.dimension,
    reverse: q.reverse,
  })),
  scoring: {
    min: 0,
    max: 100,
    labels: ['低优先', '中等重视', '高优先'],
  },
  resultNote:
    '职业价值观没有对错。它只是帮你看见：在工作中，你希望什么被满足？' +
    '本工具仅为自我探索参考，不作诊断用途。',
  // v4.0 专用扩展
  v4Features: {
    pairMatrix: true, // 28 组价值组合
    envFit: true, // Work Environment Fit
    tradeoff: true, // Trade-off 第二层（可选）
    scenes: 12, // 12 类职业场景
    whispers: true, // 小酷心理耳语
    storyMirror: true, // Story Mirror
    decisionTools: true, // 决策工具
    modulePool: 32, // 32 个结果模块
    modulesPerResult: 16, // 每次至少 16 个
  },
} as const;

/**
 * 将 v4.0 职业价值观添加到测评列表
 * @param existingAssessments 现有测评列表
 * @returns 添加了 v4.0 后的测评列表
 *
 * 注意：v4.0 是独立版本，与原有 work-values 共存，不会替换旧版
 */
export function addWorkValuesV4(
  existingAssessments: AssessmentInfo[],
): AssessmentInfo[] {
  // 检查是否已注册
  const exists = existingAssessments.some((a) => a.id === 'work-values-v4');
  if (exists) return existingAssessments;

  return [...existingAssessments, workValuesV4Assessment as unknown as AssessmentInfo];
}

/**
 * 单独获取 v4.0 测评定义
 */
export function getWorkValuesV4() {
  return workValuesV4Assessment;
}

/**
 * 验证 v4.0 模块完整性
 */
export function validateWorkValuesV4(): {
  questions: number;
  dimensions: number;
  version: string;
  features: Record<string, boolean | number>;
  ready: boolean;
} {
  const features: Record<string, boolean | number> = {};
  const v4 = workValuesV4Assessment as any;

  if (v4.v4Features) {
    Object.assign(features, v4.v4Features);
  }

  return {
    questions: workValuesV4Assessment.questions.length,
    dimensions: workValuesV4Assessment.dimensions.length,
    version: v4.questionnaireVersion || 'unknown',
    features,
    ready:
      workValuesV4Assessment.questions.length === 24 &&
      workValuesV4Assessment.dimensions.length === 8,
  };
}
