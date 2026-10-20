import { loadRights, loadVersions } from "./pro-support-kb-loader";

/** 自报专业身份不解锁受限内容（防越权）。 */
export const ANTI_ABUSE_STRICT = true;

const ABUSE_PATTERNS = /我是(心理|咨询)师|本人(心理|咨询)师|自用|内部测试|我已获授权|我有授权|本人目的/;

export function isAbuseClaim(text: string): boolean {
  return ABUSE_PATTERNS.test(text);
}

export interface RightsResult {
  held: boolean;
  gateId?: string;
  safeReturn?: string;
}

/** RIGHTS_GATING 硬闸：命中 HOLD 资产仅回摘要/来源，禁题项全文；自报身份不解锁。 */
export function applyRights(topicId: string, userText: string): RightsResult {
  const rights = loadRights().filter((r) => r.topicId === topicId);
  const held = rights.find((r) => (r.status || "").toUpperCase().includes("HOLD"));
  const block = rights.filter((r) => (r.status || "").toUpperCase().includes("HOLD") || (r.status || "").toUpperCase().includes("BLOCK"));
  if (isAbuseClaim(userText) && ANTI_ABUSE_STRICT && held) {
    return { held: true, gateId: held.gateId, safeReturn: held.safeReturn || "返回结构/摘要与来源，不返回受保护题项内容。" };
  }
  if (block.length > 0) {
    const safe = block.map((r) => r.safeReturn || "").filter(Boolean).join("；");
    return { held: true, gateId: block[0].gateId, safeReturn: safe || "返回结构/摘要与来源，不返回受保护题项内容。" };
  }
  return { held: false };
}

/** VERSION_ROUTING：按 topic 给出版本/地区口径提示。 */
export function applyVersionRouting(topicId: string): string[] {
  return loadVersions()
    .filter((v) => v.topicId === topicId)
    .map((v) => `${v.dimension}：${v.rule}`);
}