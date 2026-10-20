import { applyRights, applyVersionRouting } from "./pro-rights";
import { classifyRegion } from "./pro-region";
import { applyFactCorrections } from "./pro-facts";
import { dossierText, type ProSearchHit } from "./pro-retrieval";
import type { ProClassify } from "./pro-router";

export interface ProInjectInput {
  classify: ProClassify;
  hits: ProSearchHit[];
  query: string;
  crisisHotline?: boolean;
}

export function buildProBlock(input: ProInjectInput): string {
  const { classify, hits, query, crisisHotline } = input;
  const parts: string[] = [];
  const top = hits[0];

  const rights = applyRights(classify.topicId || "", query);
  const versionHints = applyVersionRouting(classify.topicId || "");

  parts.push("【专业层(SP-ACAD-PRO-L2)】用户问题命中专业层，回答须遵守本块纪律：");

  if (classify.source === "hardQA" && classify.matchedPhrase) {
    parts.push(`· 命中边界问法「${classify.matchedPhrase}」（${classify.routeLabel}）：严格按该边界处置，不得越界作答。`);
  }

  if (rights.held && rights.safeReturn) {
    parts.push(`· Rights 受限：${rights.safeReturn}`);
  }

  if (top && top.score > 0 && !top.suppressed) {
    const d = top.dossier;
    const boundary = d.sections["核心专业边界"];
    parts.push(`· 依据卷宗《${d.title}》：`);
    if (boundary) parts.push(boundary.trim());
    const assess = d.sections["评估与处置"];
    if (assess) parts.push(`· 评估与处置纪律：${assess.trim()}`);
    parts.push(`· 来源：${d.id}`);
  }

  if (versionHints.length > 0) {
    parts.push(`· 版本/地区口径：${versionHints.join("；")}`);
  }

  const region = classifyRegion(query);
  if (region.active) {
    parts.push(region.block);
  }

  const facts = applyFactCorrections(query);
  if (facts.active) {
    parts.push(...facts.blocks);
  }

  if (crisisHotline || classify.routeLabel.startsWith("SAFETY_")) {
    parts.push("· 若涉自伤/危机风险：须以即时求助与安全关照优先，给全国心理援助热线 12356（24小时）与 120/110，不提供异步渠道、不作陪伴式承诺。");
  }

  parts.push(
    "· 专业层装配纪律（P0）：① 禁止在答复末尾追加陪伴式情绪探针尾句（如复述用户原话后追问\"此刻它带给你的是什么感觉？\"）——专业问题按专业知识直接回应，不做情绪反射问句；② 禁止整段逐字重复答案或同一成稿输出多遍，只输出唯一连贯最终稿；③ 若本轮同时混有专业与个人倾诉内容，先向用户明确\"我先就其中专业部分回答，个人感受部分我们随后单独聊\"，再走单一专业通道作答，不混用两套语气。"
  );

  return parts.join("\n");
}

export function dossierGistForAssert(d: { id: string; title: string; sections: Record<string, string> }): string {
  return `${d.id} ${d.title}\n${dossierText(d as never).slice(0, 200)}`;
}