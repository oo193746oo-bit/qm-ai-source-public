/**
 * QM 93题MBTI风格人格偏好测试 - 叙事生成器 v3.0
 *
 * 职责：
 * - 模块选择：从 26 个模块池动态选 ≥12 个
 * - 耳语组合：根据类型、clarity、边界维度等选 3-5 条耳语
 * - Story Mirror 抽取：名人 + 影视各若干条
 * - 场景化叙事：根据评分结果生成个性化叙事
 */

import type {
  MBTIScoreResult,
  MBTIFullReport,
  TypeInfo,
  ResultModule,
  WhisperModule,
  CelebrityStory,
  MediaStory,
  PersonalizationContext,
} from './mbti-types';

import { getTypeInfo } from './mbti-type-dictionary';
import { getModulePoolForType, selectModules } from './mbti-module-pool';
import { selectWhispers } from './mbti-whispers';
import { getRandomCelebrities } from './mbti-story-mirror-celebrities';
import { getRandomMediaStories } from './mbti-story-mirror-media';

// ============================================================
// 整体人格叙事生成
// ============================================================

function generateOverallNarrative(
  scoreResult: MBTIScoreResult,
  typeInfo: TypeInfo
): string {
  const { typeCode, clarityLevel, borderlineDimensions } = {
    typeCode: scoreResult.typeCode,
    clarityLevel: 'moderate' as const,
    borderlineDimensions: scoreResult.borderlineDimensions,
  };

  let narrative = `你是一位 ${typeInfo.nameCn}（${typeInfo.nameEn}，${typeCode}）。${typeInfo.briefDescription}`;

  if (borderlineDimensions.length > 0) {
    const dimLabels: Record<string, string> = {
      EI: '内外向',
      SN: '感觉直觉',
      TF: '思考情感',
      JP: '判断感知',
    };
    const dimNames = borderlineDimensions.map(d => dimLabels[d]).join('、');
    narrative += `\n\n值得注意的是，你在${dimNames}维度上的偏好比较接近（边界维度），这意味着你在这些方面可能表现出更大的灵活性，也可能在不同情境下展现出不同的面向。这很正常——人格是光谱，不是非黑即白的标签。`;
  }

  return narrative;
}

// ============================================================
// 生成完整报告
// ============================================================

export interface GenerateReportOptions {
  moduleCount?: number;
  whisperCount?: number;
  celebrityCount?: number;
  mediaCount?: number;
  personalization?: PersonalizationContext;
}

const DEFAULT_OPTIONS: Required<Omit<GenerateReportOptions, 'personalization'>> & {
  personalization: PersonalizationContext;
} = {
  moduleCount: 14,
  whisperCount: 4,
  celebrityCount: 3,
  mediaCount: 3,
  personalization: {
    optInExamplePersonalization: false,
    shownWhisperIds: [],
  },
};

export function generateMBTIReport(
  scoreResult: MBTIScoreResult,
  options: GenerateReportOptions = {}
): MBTIFullReport {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const personalization = opts.personalization || DEFAULT_OPTIONS.personalization;

  const typeInfo = getTypeInfo(scoreResult.typeCode);

  // 1. 选择结果模块
  const modulePool = getModulePoolForType(scoreResult.typeCode);
  const selectedModules = selectModules(modulePool, opts.moduleCount);

  // 2. 选择耳语
  const whispers = selectWhispers(
    scoreResult.typeCode,
    personalization,
    opts.whisperCount
  );

  // 3. 选择名人 Story Mirror
  const celebrityStories = getRandomCelebrities(
    scoreResult.typeCode,
    opts.celebrityCount
  );

  // 4. 选择影视 Story Mirror
  const mediaStories = getRandomMediaStories(
    scoreResult.typeCode,
    opts.mediaCount
  );

  // 5. 组装完整报告
  const report: MBTIFullReport = {
    scoreResult,
    typeInfo,
    selectedModules,
    whispers,
    celebrityStories,
    mediaStories,
    generatedAt: new Date().toISOString(),
    version: '3.0.0',
    licensed: false,
    productName: 'QM 93题MBTI风格人格偏好测试',
  };

  return report;
}

// ============================================================
// 个性化叙事调整工具
// ============================================================

/**
 * 根据边界维度和邻近类型补充叙事
 */
export function generateBorderlineNarrative(scoreResult: MBTIScoreResult): string {
  if (scoreResult.borderlineDimensions.length === 0) {
    return '';
  }

  const { borderlineDimensions, adjacentTypes, typeCode } = scoreResult;

  const dimLabels: Record<string, string> = {
    EI: '能量方向（外向/内向）',
    SN: '信息获取（感觉/直觉）',
    TF: '决策方式（思考/情感）',
    JP: '生活态度（判断/感知）',
  };

  const dimNames = borderlineDimensions.map(d => dimLabels[d]).join('、');

  let text = `你在${dimNames}维度上的得分比较接近（clarity < 20），我们称之为「边界维度」。`;
  text += `这意味着你在这些方面展现出了更大的弹性和灵活性——你可能会根据不同的情境、心情或人生阶段，表现出不同的偏好。\n\n`;

  if (adjacentTypes.length > 0) {
    text += `和你相邻的类型包括：${adjacentTypes.join('、')}。`;
    text += `你可以把它们理解为你的「可能性版本」——在某些时刻，你可能会发现自己更像它们中的某一个。`;
    text += `这不是说你的测试结果不准，而是说你的人格比单一标签更丰富。`;
  }

  return text;
}

/**
 * 生成场景化的人格描述（用于结果页Hero区副标题）
 */
export function generateHeroTagline(
  scoreResult: MBTIScoreResult,
  typeInfo: TypeInfo
): string {
  return typeInfo.tagline;
}
