import { NextRequest } from "next/server";
import { LLMClient, Config, HeaderUtils } from "coze-coding-dev-sdk";
import { detectCrisis, isOtherRiskWithoutUrgency, detectT1LowMood, hasImmediateDangerSignal, crisisCardWithParaphrase, THIRD_PERSON_CRISIS_RESPONSE } from "@/lib/crisis-detection";
// R3.8/F-1 (20261004): 危机资源跨轮保持（P1 安全）——状态登记+轻资源行，硬闸零改动
import { sessionKeyFrom, recordCrisisHit, markSafeExit, getActiveCrisis, LIGHT_RESOURCE_LINE, SAFE_EXIT_RE } from "@/lib/crisis-persistence";
import { detectPriceIntent, PRICE_GATE_REPLY } from "@/lib/price-gate";
import { XIAOXUE_PAST_HISTORY_GENTLE_RESPONSE, XIAOXUE_LOW_MOOD_RESPONSE, XIAOXUE_OTHER_SUPPORT_RESPONSE } from "@/lib/xiaoxue-crisis";
import { detectPromptInjection, buildStandardRefusal, scanOutput } from "@/lib/internal-firewall";
import { XIAOXUE_BUILD_ID, XIAOXUE_PROMPT_SHA, XIAOXUE_PROMPT_PATH } from "@/lib/qm-version";
import { sanitizedSseStream } from "@/lib/name-sanitizer";
import { stripTemplateTailPhrases } from "@/lib/internal-trace-filter";
import {
  buildPricingFactBlock,
  buildPricingRulesBlock,
  detectFabricatedNames,
  normalizeTerminology,
} from "@/lib/therapist-facts";
import { XIAOXUE_CRISIS_RESPONSE } from "@/lib/xiaoxue-crisis";
import { retrieveResources, formatResourcesForPrompt } from "@/lib/kb-retrieval";
import { verifyOutput } from "@/lib/runtime-verifier";
import {
  createInitialState,
  updateSessionState,
  type XiaoxueSessionState,
} from "@/lib/xiaoxue-state";
import {
  planXiaoxueResponse,
  formatPlanForPrompt,
} from "@/lib/xiaoxue-planner";
import {
  checkCompletion,
  getSafetyTemplate,
} from "@/lib/xiaoxue-completion-guard";
import fs from "fs";
import path from "path";

// v12.0.0: DECISION-ROLE-001 四角色宪法 v14.0
import {
  GLOBAL_ROLE_GOVERNANCE_SP,
  XIAOXUE_ADMIN_BRAIN_SP,
  isAdminIntent,
  isXiaoxueClinicalOverreach,
} from "@/lib/role-governance";
import {
  verifyRoleOutput,
  buildRetryWarning,
  getXiaoxueSafetyTemplate,
} from "@/lib/role-verifier";
// v13.0 认知运行层：小雪也能理解用户语境，但不做心理分析
import {
  runCognitivePipeline,
  detectRelevantPacks,
} from "@/lib/cognitive-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}
interface XiaoxueRequest {
  messages: Message[];
  sessionId?: string;
  handoffPayload?: Record<string, unknown> | null;
  shareAllowed?: boolean;
  clientContext?: {
    xiaoxueState?: XiaoxueSessionState;
  };
}

console.info("[QM:XIAOXUE] startup", {
  build: XIAOXUE_BUILD_ID,
  promptSha: XIAOXUE_PROMPT_SHA.slice(0, 12),
  promptPath: XIAOXUE_PROMPT_PATH,
  governanceVersion: "DECISION-ROLE-001 v14.0",
});

function loadSystemPrompt(): string {
  try {
    return fs.readFileSync(path.join(process.cwd(), XIAOXUE_PROMPT_PATH), "utf-8");
  } catch (error) {
    console.error("[QM:XIAOXUE] prompt load failed", error);
    return "你是小雪，QM 的行政预约前置AI。负责费用/流程/工作时间/地址/预约前置，不做心理分析。";
  }
}

function buildHeaders(extra?: HeadersInit): Headers {
  const h = new Headers(extra);
  h.set("X-QM-Agent", "xiaoxue");
  h.set("X-Content-Type-Options", "nosniff");
  h.set("X-Frame-Options", "DENY");
  h.set("Content-Security-Policy", "default-src 'none'");
  return h;
}

function sseChunk(content: string, extra?: Record<string, unknown>): Uint8Array {
  return new TextEncoder().encode( `data: ${JSON.stringify({ content, ...extra })}\n\n`,
  );
}

function streamTextResponse(text: string, extra?: Record<string, unknown>): ReadableStream {
  const encoder = new TextEncoder();
  text = text.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, "");
  return new ReadableStream({
    start(controller) {
      let index = 0;
      const chars = Array.from(text);
      const step = () => {
        if (index < chars.length) {
          const chunkSize = Math.min(3, chars.length - index);
          controller.enqueue(
            encoder.encode( `data: ${JSON.stringify({ content: chars.slice(index, index + chunkSize).join(""), ...extra })}\n\n`,
            ),
          );
          index += chunkSize;
          setTimeout(step, 20);
        } else {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        }
      };
      step();
    },
  });
}

const SSE_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
  "Transfer-Encoding": "chunked",
};

/**
 * v1.9i-v2: 小雪侧法定真名 / 内部人员 / 敏感身份信息 输出闸门词表
 * 词表与小酷侧 LEGAL_NAME_REWRITES 完全一致，只许加不许删。
 * 这是叠加在 detectFabricatedNames（白名单幻觉检测）之上的黑名单层：
 * 白名单负责防"编造白名单外姓名"，本表负责防"复述真实法定姓名"，两道闸门并存。
 */
const LEGAL_NAME_REWRITES_XX: { regex: RegExp; replace: string }[] = [
  // 心理师法定真名（公开渠道只用化名/姓氏+"老师"，全名永不出现在输出）
  { regex: /丁怡/g, replace: "你提到的那位老师" },
  { regex: /潘新瑞/g, replace: "你提到的那位老师" },
  { regex: /舒瑱/g, replace: "你提到的那位老师" },
  // 创始人 / 内部人员
  { regex: /孙贝/g, replace: "我们工作人员" },
  { regex: /陈瑜倩/g, replace: "我们工作人员" },
  // 内部代号（产品对用户只出现"小酷/小雪/QM 酷儿心理"）
  { regex: /\bLara\b/gi, replace: "我们工作人员" },
  { regex: /\bPiggy\b/gi, replace: "我们工作人员" },
  { regex: /\bLumen\b/gi, replace: "我们工作人员" },
  // 身份证片段（命中即整段打码）
  { regex: /3101151989\d*/g, replace: "***" },
  { regex: /3205231974\d*/g, replace: "***" },
  { regex: /3101101979\d*/g, replace: "***" },
];

/**
 * 小雪侧脱敏：先照词表替换（与小酷同款），再清理替换在小雪"记录指定偏好"
 * 话术中产生的叠词/重复，保证脱敏后句子仍然通顺。
 */
function maskLegalNamesXx(text: string): string {
  let out = text;
  for (const p of LEGAL_NAME_REWRITES_XX) {
    out = out.replace(p.regex, p.replace);
  }
  // 清理替换产生的叠词/重复
  out = out
    .replace(/你提到的那位老师、你提到的那位老师/g, "你提到的那位老师")
    .replace(/你提到的那位老师你提到的那位老师/g, "你提到的那位老师")
    .replace(/我们工作人员、我们工作人员/g, "我们工作人员")
    .replace(/我们工作人员我们工作人员/g, "我们工作人员")
    .replace(/你提到的那位老师老师/g, "你提到的那位老师")
    .replace(/我们工作人员老师/g, "我们工作人员");
  return out;
}

// P57（20260925）：他人主体语境判定（非本人自陈）。复用危机分类器第三方角色主体语义——
// 命中他人角色词（我同学/我朋友/他/她/TA/班上…）且非「我+危机自陈动词」短窗口（我不想活了/想死等本人主动危机表达）。
function isOtherPersonContext(text: string): boolean {
  const otherPersonRole = /(?:我(?:的|们?的|身边|认识|担心|班上|带的|接待的|负责的)?(?:有(?:个|位)?)?(?:同学|室友|舍友|朋友|闺蜜|家人|孩子|儿子|女儿|对象|伴侣|老公|老婆|学生|学员|同事|网友|邻居|来访者|来访|当事人|服务对象|案主)|(?:他|她|TA|ta|他们|她们))/;
  const selfCrisisHit = /我.{0,6}(?:不想活|想死|想自杀|撑不住|撑不下去|活不下去|想不开)/.test(text);
  return otherPersonRole.test(text) && !selfCrisisHit;
}

// P57B（20260925）：他人告别语 + 明确时间/地点/倒计时信号。确定性本地判定，扩 5.7 hasImmediateDangerSignal 的时间地点词组
// （补 明晚/江边/就剩/还有X天/倒计时…），覆盖其未命中的告别信/绝笔信变体（阿花"告别信说明晚八点在江边，就剩一天了"）。
function isFarewellWithTimePlace(text: string): boolean {
  const farewellKeywords = /遗书|告别信|绝笔信|遗言/;
  const timePlaceCue = /今晚|今(?:天|晚)|明(?:天|早|晚)|凌晨|深夜|几点|几点钟|半小时|倒计时|还剩|就剩|还有.{0,4}天|没多少|天台|楼顶|顶楼|窗台|江边|河边|河堤|桥上|江上|学校|宿舍|放学|出门|跳|结束|实施|不在了|走/;
  return farewellKeywords.test(text) && timePlaceCue.test(text);
}

export async function GET() {
  return new Response("Method Not Allowed", {
    status: 405,
    headers: buildHeaders({ "Content-Type": "text/plain; charset=utf-8", Allow: "POST" }),
  });
}

export async function POST(req: NextRequest) {
  const traceId = `xx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const trace: Record<string, unknown> = {
    traceId,
    build: XIAOXUE_BUILD_ID,
    startTime: new Date().toISOString(),
    governanceVersion: "DECISION-ROLE-001 v14.0",
  };

  try {
    let rawBody = "";
    try {
      const bodyBuf = await req.arrayBuffer();
      rawBody = new TextDecoder("utf-8", { fatal: true }).decode(bodyBuf);
    } catch (decodeError) {
      return new Response(JSON.stringify({ error: "请求体格式错误或非法编码" }), {
        status: 400,
        headers: buildHeaders({ "Content-Type": "application/json; charset=utf-8" }),
      });
    }
    let body: XiaoxueRequest;
    try {
      body = JSON.parse(rawBody) as XiaoxueRequest;
    } catch (jsonError) {
      return new Response(JSON.stringify({ error: "请求体格式错误或非法编码" }), {
        status: 400,
        headers: buildHeaders({ "Content-Type": "application/json; charset=utf-8" }),
      });
    }
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const lastUserMessage = [...messages].reverse().find((m) => m && typeof m === "object" && m.role === "user");

    if (!lastUserMessage || typeof lastUserMessage.content !== "string" || !lastUserMessage.content.trim()) {
      return new Response(JSON.stringify({ error: "缺少用户消息" }), {
        status: 400,
        headers: buildHeaders({ "Content-Type": "application/json; charset=utf-8" }),
      });
    }

    const userText = lastUserMessage.content.trim();
    trace.userMsgLength = userText.length;

    // 诊断口令
    if (userText === "QM_XIAOXUE_BUILD_CHECK") {
      return new Response(`XIAOXUE_BUILD=${XIAOXUE_BUILD_ID}`, {
        headers: buildHeaders({ "Content-Type": "text/plain; charset=utf-8" }),
      });
    }

    // 危机检测 — 使用小雪专属文案
    const crisisResult = detectCrisis(userText);
// R3.2（20260930）：与小酷 R3.1 词面接线同步——P56 即时危险信号层（刀架脖族词形）接回 isCrisis 主闸；词表本体零增删。撤回豁免口径与小酷一致。
const R3_WITHDRAWAL_ROUTE = /气话|吓到|缓过来|缓过劲|没事了|开玩笑|玩笑话|不想聊这个了/i;
if (!crisisResult.isCrisis && hasImmediateDangerSignal(userText) && !R3_WITHDRAWAL_ROUTE.test(userText)) {
  crisisResult.isCrisis = true;
  crisisResult.level = 'direct';
}
    trace.crisis = crisisResult.level;
    // ---- R3.8 F-1: 危机状态跨轮写入（升级就高+刷新）+ 用户主动安全出口降级（阿花 QA 附加条件）----
    // 红线：detectCrisis/P0-B/R3.2 判定零改动；本块只做"报警后持续陪伴"的会话级状态登记。
    const qmPersistKey = sessionKeyFrom(req, "xiaoxue", body as unknown as Record<string, unknown>);
    if (crisisResult.isCrisis) {
      recordCrisisHit(qmPersistKey, crisisResult.level === "direct" ? "direct" : "gentle");
    } else if (SAFE_EXIT_RE.test(userText)) {
      markSafeExit(qmPersistKey);
    }
    // TTL 内 + 当轮非危机 → 主流响应尾部附加轻资源行（不置 isCrisis、不弹全量卡）
    const qmPersistLine = !crisisResult.isCrisis && getActiveCrisis(qmPersistKey) ? LIGHT_RESOURCE_LINE : "";
    // P57B（20260925）：他人语境 + 告别信/绝笔信/遗书/遗言 + 明确时间/地点/倒计时 → 他人协助快路径
    // （与遗书同类他人即时危险）。置于 detectCrisis 之前：即使用户句 crisis=False（绝笔信变体），
    // 或 hasImmediateDangerSignal 未命中（告别信明晚/江边/就剩），也一律送入既有协助卡，绝不误落 S1 降级轻留。
    if (isOtherPersonContext(userText) && isFarewellWithTimePlace(userText)) {
      const helperText = crisisCardWithParaphrase(THIRD_PERSON_CRISIS_RESPONSE.direct, userText);
      console.info("[QM:XIAOXUE] trace", { ...trace, otherPersonFarewellImmediate: true });
      return new Response(
        streamTextResponse(helperText, { isCrisis: true, crisisLevel: "direct", isHelperCrisis: true, subject: "other" }),
        { headers: buildHeaders(SSE_HEADERS) },
      );
    }
    if (crisisResult.isCrisis) {
      // P57（20260925）：他人语境 + 具体即时危险（遗书+明确时间/地点/倒计时、凶器架身等）→ 送入既有
      // 他人协助快路径卡（人称 TA/对方，110/120+15001930070+13601658763+12356 全家桶），不对本人卡错配。
      // 他人主体判定复用危机分类器第三方角色语义（我同学/我朋友/他/她/TA 等），且排除「我+危机」本人自陈短窗口。
      if (hasImmediateDangerSignal(userText) && isOtherPersonContext(userText)) {
        const helperText = crisisCardWithParaphrase(THIRD_PERSON_CRISIS_RESPONSE.direct, userText);
        console.info("[QM:XIAOXUE] trace", { ...trace, otherPersonImmediate: true });
        return new Response(
          streamTextResponse(helperText, { isCrisis: true, crisisLevel: "direct", isHelperCrisis: true, subject: "other" }),
          { headers: buildHeaders(SSE_HEADERS) },
        );
      }
      // P5（20260925）：他人风险且无具体即时危险（matchedWords=third_party_helper_crisis）→ 不弹完整危机卡，
      // 降级为承接用户自身边界困境+支持策略+末尾轻留（isCrisis:false）。具体即时危险硬词不影响本档、本人/双主体不进入。
      if (isOtherRiskWithoutUrgency(crisisResult) && !hasImmediateDangerSignal(userText)) {
        const supportText = crisisCardWithParaphrase(XIAOXUE_OTHER_SUPPORT_RESPONSE, userText);
        console.info("[QM:XIAOXUE] trace", { ...trace, otherRiskSupport: true });
        return new Response(
          streamTextResponse(supportText, { isCrisis: false, subject: "other" }),
          { headers: buildHeaders(SSE_HEADERS) },
        );
      }
      const crisisText = crisisCardWithParaphrase(
        crisisResult.level === "gentle"
          ? XIAOXUE_PAST_HISTORY_GENTLE_RESPONSE
          : crisisResult.level === "direct"
            ? XIAOXUE_CRISIS_RESPONSE.direct
            : XIAOXUE_CRISIS_RESPONSE.indirect,
        userText
      );
      console.info("[QM:XIAOXUE] trace", { ...trace, crisisHandled: true });
      return new Response(
        streamTextResponse(crisisText, { isCrisis: true, crisisLevel: crisisResult.level }),
        { headers: buildHeaders(SSE_HEADERS) },
      );
    }

    // T1（20260924）：低危模糊档——detectCrisis 未命中任何明确危机信号时，命中低危模糊表达则先在本地
    // 共情接住+末尾轻留一个热线，拦截在走 LLM 之前，避免模型把「状态很不好」等秒切完整危机卡。
    if (detectT1LowMood(userText)) {
      const t1Text = crisisCardWithParaphrase(XIAOXUE_LOW_MOOD_RESPONSE, userText);
      console.info("[QM:XIAOXUE] trace", { ...trace, t1LowMoodHandled: true });
      return new Response(
        streamTextResponse(t1Text, { isCrisis: false, lowSeverity: true }),
        { headers: buildHeaders(SSE_HEADERS) },
      );
    }

    // Prompt 注入检测
    if (detectPromptInjection(userText)) {
      console.info("[QM:XIAOXUE] trace", { ...trace, firewall: "prompt_injection" });
      return new Response(
        streamTextResponse(buildStandardRefusal(), {
          isFirewallBlock: true,
          firewallReason: "prompt_injection",
        }),
        { headers: buildHeaders(SSE_HEADERS) },
      );
    }

    // ---- BatchA P1 (20260917): 价格守门——小雪 LLM 链路前拦截（不报价，转微信引导）----
    if (detectPriceIntent(userText)) {
      console.info("[QM:XIAOXUE] Price gate hit -> wechat guide (no LLM)", { trace });
      return new Response(
        streamTextResponse(PRICE_GATE_REPLY, { isCrisis: false, isPriceGate: true }),
        { headers: buildHeaders(SSE_HEADERS) },
      );
    }

    // ---- v12.0.0: DECISION-ROLE-001 行政意图检测 ----
    const adminIntentResult = isAdminIntent(userText);
    const clinicalOverreach = isXiaoxueClinicalOverreach(userText);
    trace.roleGovernance = {
      adminIntentDetected: adminIntentResult.isAdminIntent,
      matchedIntents: adminIntentResult.matchedIntents,
      userClinicalOverreach: clinicalOverreach.isOverreach,
    };

    // ---- v13.1: 读取/初始化小雪对话状态 ----
    const sessionState: XiaoxueSessionState =
      body.clientContext?.xiaoxueState || createInitialState();

    // ---- v11.5: 资源检索（小雪只返回流程/费用/服务类文章）----
    const assistantHistory = messages
      .filter((m) => m.role === "assistant")
      .map((m) => m.content)
      .filter((c) => c && c.trim().length > 0);

    const retrievalResult = retrieveResources(userText, "xiaoxue", assistantHistory);
    const resourceBlock = formatResourcesForPrompt(retrievalResult.resources);
    console.info("[QM:XIAOXUE] resource retrieval", {
      traceId,
      resourceCount: retrievalResult.resources.length,
      ...retrievalResult.retrievalMeta,
    });

    // 检测用户是否拒绝资源
    const resourceRejected = (() => {
      const recentUserMsgs = messages.filter((m) => m.role === "user").slice(-3);
      return recentUserMsgs.some((m) =>
        /不用了|不需要|别推荐|不要推荐|不想看|不感兴趣|别说这些|跳过/.test(m.content),
      );
    })();

    // 上一轮助手回复
    const previousResponse = assistantHistory.length > 0
      ? assistantHistory[assistantHistory.length - 1]
      : undefined;

    const handoffAvailable = Boolean(body.handoffPayload);
    const shareAllowed = Boolean(body.shareAllowed);

    // ---- v13.1: 回复规划（v12.0.0: 集成角色治理）----
    const plan = planXiaoxueResponse({
      userMessage: userText,
      state: sessionState,
      previousResponse,
      assistantHistory,
    });

    // v12.0.0: 如果用户消息含心理咨询式深问，planner goal需要修正
    if (clinicalOverreach.isOverreach) {
      plan.primaryGoal = "轻度承接情绪，回到行政需求收集（只收集大类），不做心理分析";
    }

    trace.plan = {
      state: plan.state,
      userNeed: plan.userNeed,
      primaryGoal: plan.primaryGoal,
      handoff: plan.handoff,
      factQuery: plan.factQuery,
    };

    // v11.0 去推荐化：统一事实指令
    const factDirective = [
      "<fact_directive>",
      "你是QM的行政预约前置AI。你的工作是收集用户需求，不是推荐具体心理师。",
      "",
      "绝对规则：",
      "- 不主动输出任何心理师姓名（包括公开名单中的任何人）",
      "- 用户主动提到心理师名字时，记录为偏好（designated_therapist），不确认/否认/补充其背景",
      "- 预算只说区间和档位（400-500/600-900/1500），不说是谁", `- 收集完成后明确告知用户转人工终点：\"我把你的情况整理好了，请添加人工客服微信 （每日 12:00-24:00），团队会根据你的需求跟进匹配合适的心理师\"\n- 不做任何行政代办（不排档期/不收款/不锁定时间/不改期），一律引导添加人工客服微信 `,
      "- 如果用户坚持要知道具体心理师名单，引导联系人工客服或在官网查看",
      "",
      "可以做的：",
      "- 介绍咨询流程、形式（线上/线下/视频）、费用区间",
      "- 收集用户的困扰方向（大类即可）、时间偏好、预算范围、形式偏好",
      "- 回答一般性的QM机构问题",
      "</fact_directive>",
    ].join("\n");

    const runtimeContext = [
      "<runtime_context>", `handoffAvailable: ${handoffAvailable}`, `shareAllowed: ${shareAllowed}`, `handoffPayload: ${
        handoffAvailable && shareAllowed ? JSON.stringify(body.handoffPayload) : "null"
      }`, `currentTime: ${new Date().toISOString()}`,
      "</runtime_context>",
    ].join("\n");

    // ---- v13.0: 认知运行层（小雪轻量版：理解语境但不做心理分析）----
    let cognitiveBlock = "";
    try {
      const detected = detectRelevantPacks(userText);
      if (detected.packs.length > 0) {
        const recentHistory = messages
          .filter((m) => m.role !== "system")
          .slice(-6)
          .map((m) => m.content);
        const cognitiveResult = await runCognitivePipeline({
          userText,
          history: recentHistory,
          detectedPacks: detected.packs,
          role: "xiaoxue",
          languagePreference: detected.languagePreference,
        });
        // 小雪只取透镜和禁止推断部分，案例数量已限制为3
        cognitiveBlock = cognitiveResult.promptBlock;
        console.info("[QM:XIAOXUE] cognitive pipeline", {
          packs: detected.packs,
          lenses: cognitiveResult.relevantLenses.length,
          cases: cognitiveResult.retrievedCases.length,
        });
      }
    } catch (cogError) {
      console.error("[QM:XIAOXUE] cognitive pipeline failed (non-fatal):", cogError);
    }

    // v12.0.0: SP构建顺序 — GLOBAL_ROLE_GOVERNANCE在最高优先级
    const systemPrompt = [
      GLOBAL_ROLE_GOVERNANCE_SP,
      "",
      XIAOXUE_ADMIN_BRAIN_SP,
      "",
      loadSystemPrompt(),
      "",
      buildPricingFactBlock(),
      "",
      buildPricingRulesBlock(),  // v0.6.1 新增：价格计算规则+边界+Q&A示例
      "",
      factDirective,
      "",
      runtimeContext,
      "",
      formatPlanForPrompt(plan),
      resourceBlock ? `\n${resourceBlock}` : "",
      cognitiveBlock ? `\n${cognitiveBlock}` : "",
    ].join("\n");

    // 历史消息只保留最近 20 轮
    const MAX_HISTORY = 20;
    const recentMessages = messages.length > MAX_HISTORY
      ? messages.slice(-MAX_HISTORY)
      : messages;

    const fullMessages: Message[] = [
      { role: "system", content: systemPrompt },
      ...recentMessages.map((m) => ({
        role: (m.role === "assistant" ? "assistant" : "user") as Message["role"],
        content: m.content,
      })),
    ];

    const customHeaders = HeaderUtils.extractForwardHeaders(req.headers);
    const client = new LLMClient(new Config(), customHeaders);
    const stream = client.stream(fullMessages, {
      model: "doubao-seed-2-0-pro-260215",
      temperature: 0.4,
    });
    trace.llmModel = "doubao-seed-2-0-pro-260215";

    const encoder = new TextEncoder();

    async function collectStream(
      s: AsyncIterable<{ content?: unknown }>,
    ): Promise<string> {
      let text = "";
      for await (const chunk of s) {
        if (!chunk.content) continue;
        let content = chunk.content.toString();
        content = normalizeTerminology(content);
        text += content;
      }
      return text;
    }

    const readable = new ReadableStream({
      async start(controller) {
        let blockTriggered = false;
        let fullOutput = "";
        // ---- A2 (20260917): P0FIX6 对齐——xiaoxue 单帧归一共享缓冲 ----
        // 各闸不再各自 emit replaceOutput 帧，统一 qmChainWrite 写入共享缓冲，流末唯一成品帧。
        let qmChainContent: string | null = null;
        let qmChainReason = "";
        const qmChainWrite = (content: string, reason: string) => {
          qmChainContent = content;
          qmChainReason = reason || "xiaoxue_chain_rewrite";
          fullOutput = content;
          console.warn(`[QM:P0FIX6] xiaoxue chain write ${qmChainReason}, len=${content.length}`);
        };
        try {
          // ---- v13.1: 流式输出（仅做术语 normalize，不做中途检测）----
          for await (const chunk of stream) {
            if (blockTriggered) break;
            if (!chunk.content) continue;
            let content = chunk.content.toString();

            content = normalizeTerminology(content);
            // v1.9i-v2: chunk 层法定真名脱敏
            content = maskLegalNamesXx(content);
            fullOutput += content;

            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ content })}\n\n`),
            );
          }

          trace.outputLength = fullOutput.length;

          // ---- v1.9i-v2: 流结束后法定真名/敏感信息闸门（防 chunk 切词漏网）----
          if (!blockTriggered && fullOutput.trim().length > 0) {
            const maskedOutput = maskLegalNamesXx(fullOutput);
            if (maskedOutput !== fullOutput) {
              console.warn(
                `[QM:XIAOXUE Firewall] legal-name gate triggered (post-stream), traceId=${traceId}`,
              );
              qmChainWrite(maskedOutput, "legal_name_mask");
            }
          }

          // ---- v12.0.0: 角色治理 G002-G010 审核（最先执行）----
          if (!blockTriggered && fullOutput.trim().length > 0) {
            const roleResult = verifyRoleOutput(fullOutput, "xiaoxue", {
              userMessage: userText,
            });

            if (!roleResult.pass) {
              console.warn("[QM:XIAOXUE] Role governance P0 violation, retrying", {
                traceId,
                violations: roleResult.p0Violations.map((v) => `${v.ruleId}: ${v.matchedText}`),
              });

              try {
                const retryWarning = buildRetryWarning("xiaoxue", roleResult.p0Violations);
                const retryMessages: Message[] = [
                  ...fullMessages,
                  { role: "system", content: retryWarning },
                ];

                const retryStream = client.stream(retryMessages, {
                  model: "doubao-seed-2-0-pro-260215",
                  temperature: 0.4,
                });

                const retryOutput = await collectStream(retryStream);
                const retryRoleResult = verifyRoleOutput(retryOutput, "xiaoxue", {
                  userMessage: userText,
                });

                if (!retryRoleResult.pass) {
                  blockTriggered = true;
                  const safetyText = getXiaoxueSafetyTemplate();
                  console.warn("[QM:XIAOXUE] Role governance retry failed, using safety template", {
                    traceId,
                    retryViolations: retryRoleResult.p0Violations.map((v) => v.ruleId),
                  });
                  qmChainWrite(safetyText, "role_governance_safety_replace");
                } else {
                  console.info("[QM:XIAOXUE] Role governance retry passed", { traceId });
                  // v1.9i-v3: 重试输出也必须过法定真名脱敏
                  const maskedRetryOutput = maskLegalNamesXx(retryOutput);
                  qmChainWrite(maskedRetryOutput, "role_governance_retry");
                }
              } catch (retryError) {
                console.error("[QM:XIAOXUE] Role governance retry error", { traceId, retryError });
                blockTriggered = true;
                const safetyText = getXiaoxueSafetyTemplate();
                qmChainWrite(safetyText, "role_governance_retry_error");
              }
            } else {
              if (roleResult.p1Violations.length > 0) {
                console.info("[QM:XIAOXUE] Role governance P1 warnings", {
                  traceId,
                  p1: roleResult.p1Violations.map((v) => v.ruleId),
                });
              }
            }
          }

          // ---- v13.1: 流结束后统一检测 ----

          // 1. 幻觉检测
          if (!blockTriggered && fullOutput.trim().length > 0) {
            const fabricated = detectFabricatedNames(fullOutput);
            if (fabricated.length > 0) {
              blockTriggered = true;
              console.warn("[QM:XIAOXUE] hallucination detected (post-stream)", {
                traceId,
                fabricated,
              });
              qmChainWrite(
                fullOutput + "\n\n—\n以上内容由 AI 生成，仅供参考。心理师信息及预约请以人工客服确认为准。",
                "hallucination_guard",
              );
            }
          }

          // 2. 内部防火墙扫描
          if (!blockTriggered && fullOutput.trim().length > 0) {
            const scanResult = scanOutput(fullOutput);
            if (scanResult.action === "BLOCK") {
              blockTriggered = true;
              console.warn("[QM:XIAOXUE] internal firewall BLOCK (post-stream)", {
                traceId,
                matched: scanResult.matched,
              });
              qmChainWrite("\n\n" + buildStandardRefusal(), "output_scan_block");
            }
          }

          // 3. 完整性守卫
          if (!blockTriggered && fullOutput.trim().length > 0) {
            let completionResult = checkCompletion(
              fullOutput,
              userText,
              plan,
              previousResponse,
            );
            trace.completion = {
              pass: completionResult.pass,
              failures: completionResult.failures,
              p0Failures: completionResult.p0Failures,
            };

            if (completionResult.p0Failures.length > 0) {
              console.warn("[QM:XIAOXUE] completion guard P0 fail, retrying", {
                traceId,
                p0Failures: completionResult.p0Failures,
              });

              try {
                const retryMessages: Message[] = [
                  ...fullMessages,
                  {
                    role: "system",
                    content: `上一轮回复未通过完整性检查：${completionResult.failures.join(", ")}。请重新生成，确保句子完整、回答了用户问题、不推卸给人工/小酷。`,
                  },
                ];

                const retryStream = client.stream(retryMessages, {
                  model: "doubao-seed-2-0-pro-260215",
                  temperature: 0.4,
                });

                let retryOutput = await collectStream(retryStream);

                const retryFabricated = detectFabricatedNames(retryOutput);
                const retryScan = scanOutput(retryOutput);

                if (retryFabricated.length > 0 || retryScan.action === "BLOCK") {
                  const safetyText = getSafetyTemplate(plan);
                  qmChainWrite(safetyText, "completion_retry_safety");
                  blockTriggered = true;
                } else {
                  const retryCompletion = checkCompletion(
                    retryOutput,
                    userText,
                    plan,
                    previousResponse,
                  );
                  trace.completionRetry = {
                    pass: retryCompletion.pass,
                    failures: retryCompletion.failures,
                  };

                  if (retryCompletion.p0Failures.length > 0) {
                    const safetyText = getSafetyTemplate(plan);
                    qmChainWrite(safetyText, "completion_retry_failed");
                    blockTriggered = true;
                  } else {
                    // v1.9i-v3: completion retry 输出也必须过法定真名脱敏
                    const maskedRetryOutput = maskLegalNamesXx(retryOutput);
                    qmChainWrite(maskedRetryOutput, "completion_retry");
                  }
                }
              } catch (retryError) {
                console.error("[QM:XIAOXUE] retry stream error", { traceId, retryError });
                const safetyText = getSafetyTemplate(plan);
                qmChainWrite(safetyText, "completion_retry_error");
                blockTriggered = true;
              }
            }
          }

          // ---- v11.5: 运行时输出审核（后置verifier）----
          if (!blockTriggered && fullOutput.trim().length > 0) {
            const verifierResult = verifyOutput({
              userMessage: userText,
              draft: fullOutput,
              role: "xiaoxue",
              verifiedFacts: {},
              verifiedResources: retrievalResult.resources,
              crisisActive: false,
              previousResponse,
              resourceRejected,
            });

            if (!verifierResult.pass) {
              console.warn("[QM:XIAOXUE] verifier blocked", {
                traceId,
                violations: verifierResult.violations.map((v) => `${v.ruleId}(${v.severity})`),
                telemetryTags: verifierResult.telemetryTags,
              });
              // v1.9i-v3: verifier fallback 也必须过法定真名脱敏
              const fallbackContent = verifierResult.fallbackText || "关于这个问题，建议您联系人工客服确认。";
              const maskedFallback = maskLegalNamesXx(fallbackContent);
              qmChainWrite("\n\n" + maskedFallback, `verifier_${verifierResult.repairAction}`);
            } else {
              console.info("[QM:XIAOXUE] verifier pass", {
                traceId,
                telemetryTags: verifierResult.telemetryTags,
              });
            }
          }

          // ---- P5: 出站机械尾句硬过滤（A/B/C/D，非危机态，防概率性复发）----
          if (!blockTriggered && fullOutput.trim().length > 0) {
            const tailFiltered = stripTemplateTailPhrases(fullOutput);
            if (tailFiltered !== fullOutput) {
              const enrichedTail = tailFiltered || fullOutput;
              qmChainWrite("\n\n" + enrichedTail, "template_tail_strip");
              trace.p5TailStripped = true;
            }
          }

          // ---- A2 (20260917): xiaoxue 单帧归一——流末唯一成品帧 ----
          if (qmChainContent !== null) {
            controller.enqueue(
              encoder.encode( `data: ${JSON.stringify({
                  content: qmChainContent,
                  isFirewallBlock: true,
                  firewallReason: qmChainReason,
                  replaceOutput: true,
                })}\n\n`,
              ),
            );
          }

          // ---- v13.1: 更新状态并发送 state_update ----
          const newSessionState = updateSessionState(sessionState, userText);
          trace.stateUpdate = {
            from: sessionState.state,
            to: newSessionState.state,
            collectedFields: Object.keys(newSessionState.collectedFields),
          };
          controller.enqueue(
            encoder.encode( `data: ${JSON.stringify({
                type: "state_update",
                state: newSessionState,
              })}\n\n`,
            ),
          );

          trace.blocked = blockTriggered;
          // R3.8 F-1: TTL 内非危机轮附加轻资源行（危机资源跨轮保持）
          if (qmPersistLine) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: qmPersistLine, isCrisis: false })}\n\n`));
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("[QM:XIAOXUE] stream error", { traceId, error });
          trace.streamError = String(error);
          controller.enqueue(
            encoder.encode( `data: ${JSON.stringify({
                content:
                  "抱歉，小雪这边刚刚连接不太稳定。您可以稍后再试，或切换到下方的「结构化填写」继续。",
              })}\n\n`,
            ),
          );
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } finally {
          trace.endTime = new Date().toISOString();
          console.info("[QM:XIAOXUE] trace", trace);
        }
      },
    });

    return new Response(sanitizedSseStream(readable, "xiaoxue"), {
      headers: buildHeaders(SSE_HEADERS),
    });
  } catch (error) {
    console.error("[QM:XIAOXUE] POST error", { traceId: "unknown", error });
    return new Response(JSON.stringify({ error: "小雪服务暂时不可用" }), {
      status: 500,
      headers: buildHeaders({ "Content-Type": "application/json; charset=utf-8" }),
    });
  }
}
