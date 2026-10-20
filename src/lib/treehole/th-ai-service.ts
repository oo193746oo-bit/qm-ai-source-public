// QM 情绪树洞 v2.0 - AI 回信服务
// 调用 /api/treehole/letter 路由生成小酷回信
// 传入 checkin + diary + selected_memories + trend + safety_state
import type {
  DailyCheckin,
  DiaryEntry,
  TreeholeMemory,
  TrendDataPoint,
  XiaokuLetter,
} from "./th-types";
import { detectCrisis, getCrisisResponse, sanitizeLetterContent } from "./th-safety";

export interface GenerateLetterRequest {
  diaryText: string;
  checkin?: DailyCheckin;
  memories?: TreeholeMemory[];
  trend?: TrendDataPoint[];
  date: string;
}

export interface GenerateLetterResponse {
  letter: XiaokuLetter;
  isCrisis: boolean;
  crisisLevel?: string;
}

/**
 * 根据日记长度计算目标回信用字数
 * - 日记<500字：回信500-750字且不低于500
 * - 日记500-2000字：回信1.0-1.5倍，最高3000字
 */
export function calculateTargetLength(diaryLength: number): { min: number; max: number } {
  if (diaryLength < 500) {
    return { min: 500, max: 750 };
  }
  if (diaryLength < 2000) {
    const min = Math.floor(diaryLength * 1.0);
    const max = Math.min(3000, Math.floor(diaryLength * 1.5));
    return { min, max };
  }
  return { min: 2000, max: 3000 };
}

/**
 * 生成小酷回信
 * POC 版本：调用 /api/treehole/letter 接口
 * 如果接口失败，使用本地安全降级
 */
export async function generateLetter(
  request: GenerateLetterRequest,
): Promise<GenerateLetterResponse> {
  const { diaryText, checkin, memories, trend, date } = request;

  // 第一步：危机检测（客户端先行检测，服务端也会再检测一次）
  const crisisResult = detectCrisis(diaryText);

  if (crisisResult.isCrisis) {
    // 危机时直接走安全流程，不等待 AI 长回信
    const crisisText = getCrisisResponse(crisisResult.level as "direct" | "indirect" | "harm_others");
    return {
      letter: {
        date,
        text: crisisText,
        charCount: crisisText.length,
        dailySentence: "请记得：你不是一个人。随时可以拨打 QM 热线 15001930070。",
        createdAt: new Date().toISOString(),
        isCrisis: true,
        crisisLevel: crisisResult.level === "harm_others" ? "direct" : crisisResult.level === "none" ? "indirect" : crisisResult.level,
      },
      isCrisis: true,
      crisisLevel: crisisResult.level,
    };
  }

  try {
    // 调用 API 路由
    const response = await fetch("/api/treehole/letter", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        diary_text: diaryText,
        checkin: checkin || null,
        memories: memories || [],
        trend: trend || [],
        date,
      }),
    });

    if (!response.ok) {
      throw new Error(`API 响应错误: ${response.status}`);
    }

    const data = await response.json();

    // 透传服务端危机判定字段（is_crisis → isCrisis、crisis_level → crisisLevel）
    const isCrisis = Boolean(data.is_crisis);
    const crisisLevel = data.crisis_level || (isCrisis ? "direct" : undefined);
    const rawText = data.letter_text || data.letterText || "";
    // 危机信保留服务端统一热线卡（不叠加 110/120 归一化）；非危机信做外部机构/诈骗号清理
    const text = isCrisis ? rawText : sanitizeLetterContent(rawText);

    return {
      letter: {
        date,
        text,
        charCount: text.length,
        dailySentence: data.daily_sentence || data.dailySentence || "今天也辛苦了。",
        createdAt: new Date().toISOString(),
        isCrisis,
        crisisLevel,
      },
      isCrisis,
      crisisLevel,
    };
  } catch (error) {
    console.error("[treehole] 生成回信失败:", error);
    // 危机安全严禁 fail-open：失败时保守按危机处理，展示统一热线卡，绝不做静默温情回复
    const crisisText = getCrisisResponse("direct");
    return {
      letter: {
        date,
        text: crisisText,
        charCount: crisisText.length,
        dailySentence: "请记得：你不是一个人。24 小时都有人愿意接住你——15001930070。",
        createdAt: new Date().toISOString(),
        isCrisis: true,
        crisisLevel: "direct",
      },
      isCrisis: true,
      crisisLevel: "direct",
    };
  }
}

/**
 * 验证回信质量（字数检查等）
 */
export function validateLetterQuality(
  letterText: string,
  diaryLength: number,
): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  const target = calculateTargetLength(diaryLength);
  const letterLength = letterText.length;

  if (letterLength < target.min) {
    issues.push(`回信字数不足：${letterLength}字，最低要求 ${target.min} 字`);
  }

  if (letterLength > target.max + 100) {
    issues.push(`回信字数偏多：${letterLength}字，上限约 ${target.max} 字`);
  }

  // 检查是否有今日一句话
  if (!letterText.includes("今天的一句话")) {
    issues.push("缺少「今天的一句话」收尾");
  }

  // 检查是否有落款
  if (!letterText.includes("小酷")) {
    issues.push("缺少小酷落款");
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}
