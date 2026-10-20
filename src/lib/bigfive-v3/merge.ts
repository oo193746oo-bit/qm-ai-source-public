// QM Big Five 60 | 大五人格特质测评 v3.0 — 集成钩子
// 用途：将大五人格 v3.0 测评注册到 QM AI POC 项目的测评体系中
// 通过 addToAssessments 钩子提供统一接入点

import { BF_QUESTION_BANK } from './bf-questions-60';
import type { AssessmentInfo } from '@/lib/assessments/data';
import type { BFAnswer, BFFullResult } from './bf-types';
import { computeFullResult } from './bf-scoring';

// ===== 测评元信息（用于测评列表展示）=====
export const bigFiveV3AssessmentMeta = {
  id: 'bigfive',
  title: '大五人格特质测评',
  subtitle: 'QM Big Five 60 · v3.0',
  description:
    '基于大五人格模型（OCEAN）的60题连续特质测评。了解你在开放性、尽责性、外向性、宜人性、负性情绪倾向上的位置，获得个性化叙事解读与成长视角。',
  duration: '约 5-10 分钟',
  questionCount: 60,
  icon: '🧠',
  color: 'from-purple-500 to-indigo-500',
  type: 'growth-profile' as const,
  version: 'v3.0',
  license_status: 'unlicensed' as const,
  path: '/assessments/bigfive',
};

// ===== 转换为 AssessmentInfo 格式（兼容现有测评体系）=====
export function toAssessmentInfo(): AssessmentInfo {
  return {
    id: bigFiveV3AssessmentMeta.id,
    title: bigFiveV3AssessmentMeta.title,
    subtitle: bigFiveV3AssessmentMeta.subtitle,
    description: bigFiveV3AssessmentMeta.description,
    duration: bigFiveV3AssessmentMeta.duration,
    questionCount: bigFiveV3AssessmentMeta.questionCount,
    icon: bigFiveV3AssessmentMeta.icon,
    color: bigFiveV3AssessmentMeta.color,
    type: bigFiveV3AssessmentMeta.type,
    dimensions: [
      { code: 'O', name: '开放性', description: 'Openness to Experience', color: 'bg-purple-400' },
      { code: 'C', name: '尽责性', description: 'Conscientiousness', color: 'bg-blue-400' },
      { code: 'E', name: '外向性', description: 'Extraversion', color: 'bg-orange-400' },
      { code: 'A', name: '宜人性', description: 'Agreeableness', color: 'bg-green-400' },
      { code: 'N', name: '情绪倾向', description: 'Neuroticism', color: 'bg-red-400' },
    ],
    questions: BF_QUESTION_BANK.questions.map(q => ({
      id: q.id,
      text: q.text,
      dimension: q.dimension,
      reverse: q.reverse,
    })),
    scoring: {
      min: 0,
      max: 100,
      labels: ['低区间', '中低区间', '中高区间', '高区间'],
      scale: '1-5',
    },
    resultNote:
      '大五人格是连续特质模型，不是类型诊断。结果仅供自我探索参考，不构成心理诊断。',
    disclaimer:
      '本测评为QM原创大五人格风格量表，未宣称或暗示任何官方量表授权。',
  };
}

// ===== 钩子：注册到测评列表 =====
// 使用方式：在项目入口处调用 addToAssessments(allAssessments)
export function addToAssessments(
  existingAssessments: AssessmentInfo[]
): AssessmentInfo[] {
  // 检查是否已存在
  const exists = existingAssessments.some(a => a.id === 'bigfive');
  if (exists) {
    // 替换旧版
    return existingAssessments.map(a =>
      a.id === 'bigfive' ? toAssessmentInfo() : a
    );
  }
  // 追加
  return [...existingAssessments, toAssessmentInfo()];
}

// ===== 快速计算结果（纯函数，用于API/后端）=====
export function calculateBigFiveResult(answers: BFAnswer[]): BFFullResult {
  return computeFullResult(answers);
}

// ===== 版本信息 =====
export const BIGFIVE_V3_INFO = {
  version: 'v3.0',
  name: 'QM Big Five 60',
  fullName: 'QM Big Five 60｜大五人格特质测评',
  questions: 60,
  dimensions: 5,
  modules: 30,
  whisper_units: '300+',
  story_mirror_people: '400+',
  story_mirror_media: '160+',
  license_status: 'unlicensed',
  norm_status: 'unapproved',
  release_date: '2026-08-22',
};

export default {
  bigFiveV3AssessmentMeta,
  toAssessmentInfo,
  addToAssessments,
  calculateBigFiveResult,
  BIGFIVE_V3_INFO,
};
