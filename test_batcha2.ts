/**
 * A2 回归测试（20260917）— 批A2服务端修复
 * ①xiaoxue 单帧归一（源码结构断言：replaceOutput 唯一成品帧 + 链式缓冲 + 空 reason emit 归一）
 * ②chat retry 通道 qmGuardDrop 摘除
 * ③既有闸与 lib 工具不回退（qmCollapseReplay / qmGuardDrop 导出完好、completion retry 主流程保留）
 */
import { readFileSync } from "fs";
import { qmCollapseReplay, qmGuardDrop } from "./src/lib/qm-p0fix4";

let pass = 0;
let total = 0;
function T(name: string, cond: boolean) {
  total++;
  if (cond) {
    pass++;
    console.log(`  PASS ${name}`);
  } else {
    console.log(`  FAIL ${name}`);
  }
}

const xue = readFileSync("src/app/api/xiaoxue/route.ts", "utf-8");
const chat = readFileSync("src/app/api/chat/route.ts", "utf-8");

// ---- 1. xiaoxue 单帧归一：结构断言 ----
const roCount = (xue.match(/replaceOutput: true/g) || []).length;
T("A2-01 xiaoxue 主链路 replaceOutput 收敛为唯一成品帧(1处)", roCount === 1);

T("A2-02 链式共享缓冲声明存在", xue.includes("const qmChainWrite = (content: string, reason: string)") && xue.includes("let qmChainContent: string | null = null"));

T("A2-03 流末唯一成品帧挂 qmChainReason（无空 reason）", xue.includes("firewallReason: qmChainReason"));

T("A2-04 原 空 reason emit 点#1（role retry passed）已归一", xue.includes('qmChainWrite(maskedRetryOutput, "role_governance_retry")'));

T("A2-05 原 空 reason emit 点#2（completion retry success）已归一", xue.includes('qmChainWrite(maskedRetryOutput, "completion_retry")'));

const chainHits = (xue.match(/qmChainWrite\(/g) || []).length;
T("A2-06 12 个闸 emit 点全部收编 qmChainWrite", chainHits === 12);

T("A2-07 hallucination_guard 并入链式缓冲且免责声明保留", xue.includes('"hallucination_guard"') && xue.includes("以上内容由 AI 生成，仅供参考。心理师信息及预约请以人工客服确认为准。") && !xue.includes('"\n\n" +\n                      "\n\n" + fullOutput'));

T("A2-08 xiaoxue 危机快路径未动（crisis fast-path 保留）", xue.includes("XIAOXUE_CRISIS_RESPONSE.direct") && xue.includes("crisisHandled: true"));

// ---- 2. chat retry 通道 qmGuardDrop 摘除 ----
const retryStart = chat.indexOf("Role governance P0 violation, retrying");
const retryEnd = chat.indexOf("Role governance retry still failed");
const retryRegion = retryStart >= 0 && retryEnd > retryStart ? chat.slice(retryStart, retryEnd) : "";

T("A2-09 chat retry 区无 qmGuardDrop", retryRegion.length > 0 && !retryRegion.includes("qmGuardDrop"));

T("A2-10 chat 全文 qmGuardDrop 清零（含 import）", !chat.includes("qmGuardDrop"));

T("A2-11 chat retry 主流程保留（retryStream + 累积）", retryRegion.includes("retryStream") && retryRegion.includes("retryOutput += chunk.content.toString()"));

// ---- 3. 既有闸与兜底不回退 ----
T("A2-12 xiaoxue completion retry 主流程与兜底保留", xue.includes("completion_retry_safety") && xue.includes("completion_retry_failed") && xue.includes("completion_retry_error") && xue.includes("getSafetyTemplate(plan)"));

T("A2-13 xiaoxue verifier 与模板尾句闸保留", xue.includes("verifierResult.repairAction") && xue.includes('"template_tail_strip"'));

T("A2-14 xiaoxue price gate（批A）未破坏", xue.includes('detectPriceIntent(userText)') && xue.includes("isPriceGate"));

T("A2-15 chat role_governance 兜底保留", chat.includes('"role_governance_safety_replace"') && chat.includes('"role_governance_retry_error"'));

T("A2-16 qmCollapseReplay 功能正常（P0FIX6 折叠工具完好）", typeof qmCollapseReplay("测试输入内容，用于验证导出与调用。") === "string");

T("A2-17 qmGuardDrop lib 导出完好（lib 未删，仅调用点摘除）", typeof qmGuardDrop("新内容片段", "累积上下文内容") === "boolean");

console.log(`RESULT ${pass}/${total}`);
if (pass !== total) process.exit(1);
