import { NextRequest } from "next/server";
import { qmCollapseReplay } from "@/lib/qm-p0fix4";

import { qmShingleRatio } from "../../../lib/qm-p0fix4";
import { LLMClient, Config, HeaderUtils } from "coze-coding-dev-sdk";
// R3.8/F-1 (20261004): 危机资源跨轮保持（P1 安全）——状态登记+轻资源行，硬闸零改动
import { sessionKeyFrom, recordCrisisHit, markSafeExit, getActiveCrisis, LIGHT_RESOURCE_LINE, SAFE_EXIT_RE } from "@/lib/crisis-persistence";
import { detectCrisis, detectMinor, detectLowSeverityCrisis, CRISIS_RESPONSE, MINOR_CRISIS_RESPONSE, THIRD_PERSON_CRISIS_RESPONSE, CRISIS_LOW_RESPONSE, buildRememberYouBlock, PAST_HISTORY_GENTLE_RESPONSE, crisisCardWithParaphrase, isOtherRiskWithoutUrgency, hasImmediateDangerSignal, CRISIS_OTHER_SUPPORT_RESPONSE } from "@/lib/crisis-detection";
import { evaluatePostGate } from "@/lib/post-gate";
import { splitLazyFromSp, injectLazyBlocks } from "@/lib/sp-sections";
import { classifyPro } from "@/lib/pro-support/pro-router";
import { searchPro } from "@/lib/pro-support/pro-retrieval";
// 专业层 Rights/版本路由由 pro-inject 基于 topicId 自行计算，route 不直接调用
import { buildProBlock } from "@/lib/pro-support/pro-inject";
import { detectNarrativePerspective, shouldTriggerPerspectiveGate, PERSPECTIVE_GATE_QUESTION } from "@/lib/narrative-perspective";
import {
  detectPromptInjection,
  scanOutput,
  buildStandardRefusal,
} from "@/lib/internal-firewall";
import {
  XIAOKU_BUILD_ID,
  XIAOKU_PROMPT_SHA,
  XIAOKU_PROMPT_PATH,
} from "@/lib/qm-version";
import { sanitizedSseStream } from "@/lib/name-sanitizer";
import { stripInternalTraces,
  dedupeRepeats } from "@/lib/internal-trace-filter";
import { demoteCrisisHotlineForLowMood } from "@/lib/low-mood-referral";
import { retrieveResources, formatResourcesForPrompt } from "@/lib/kb-retrieval";
import { searchKnowledge, formatKnowledgeForPrompt, getKbStatus } from "@/lib/kb/content-search";
import { detectPriceIntent, PRICE_GATE_REPLY } from "@/lib/price-gate";
import { retrieveFacts, formatFactsForPrompt, getFactFallbackMessage } from "@/lib/fact-retrieval";
import { verifyOutput } from "@/lib/runtime-verifier";
import {
  sanitizeTreeholeContext,
  shouldInjectTreehole,
  formatTreeholeContext,
} from "@/lib/context/treehole-context-server";
import type { TreeholeClientContext } from "@/lib/context/treehole-context-client";
import fs from "fs";
import path from "path";

// P3: 逐 3 字符分帧发射时，若截断点落在 UTF-16 高位代理之后（只剩孤高位），
// 退一位，让代理对保留在下一帧完整输出，避免 emoji（如 📞）被劈成 `??`。
function safeChunkSize(s: string, index: number): number {
  const n = Math.min(3, s.length - index);
  if (n > 0) {
    const c = s.charCodeAt(index + n - 1);
    if (c >= 0xd800 && c <= 0xdbff) return n - 1; // 末位是高位代理 → 回退，保住低位
  }
  return n;
}

// P18-5: 内部路径泄露硬过滤（全局替换，覆盖所有生成片段）
// P1 工单 B + P1.5 工单 C：加强知识库引用泄漏防护，禁止出现 /kb/...、kbs://、.md 文件名、qmkx.ai 域名
const INTERNAL_LEAK = /\/kb\/[A-Z0-9\-\/]+|\/kb\/|kbs?:\/\/|(?<!content)\/D\d{2}[\/\-][A-Z0-9\-]+|src\/|data\/|fact_pack|retrieval_hooks|\.ts\b|\.json\b|\.md\b|qmkx\.ai/gi;
// P18-3: 天气/交通禁词硬过滤
// P1.10 J2：移除"切换到小雪/行政.*预约"——它们本属推诿/行政处理（DEFLECTION_BANNED 负责，且对行政豁免），
// 放在这里会造成行政回复的"切换到小雪"按钮被洗空为「」并触发终态整段 replaceOutput 重复拼接。
const HELP_CHANNEL_REQUEST = /12356|15001930070|13601658763|qm_kw_gone|心理援助热线|心理热线|危机热线|求助热线|救命|救救我|我不想活了|帮我(找|打).*(热线|心理)/i;
const WEATHER_TRAFFIC_BANNED = /天气APP|天气预报APP|地图APP|打开.*APP/gi;
// P1.5 工单 E：推诿话术 BANNED 拦截
const DEFLECTION_BANNED = /切换到小雪|切换小雪|转小雪|找小雪|转人工|人工客服|超出我的支持范围|我只是工具|没办法回答/gi;
// 1.10.2: 内部标识扫描（双保险，输出层过滤器）
const INTERNAL_IDENTIFIERS = /DECISION-ROLE|SHARE_WITH_XIAOKU|XIAOXUE_ONLY|HUMAN_ONLY|SYNC_REQUIRED|v11\.5|v8\.0|v14\.0|tool_id|content_id|补丁|批次1\.|fact-pack|fact_pack|SANITIZE|crisis-detection|系统提示词|system prompt/gi;
// 1.9b P0-1: 号码白名单过滤器
const PHONE_WHITELIST = ['15001930070', '13601658763', '12356', '12355', '120', '110', '988', '9-8-8'];
const PHONE_PATTERN = /\b\d{3,4}[-\s]?\d{7,8}\b|\b\d{10,11}\b/g;
const CRISIS_CONTEXT = /热线|拨打|电话|危机|自杀|自残|不想活|想死|求助/gi;
// 1.9b P0-1: 错号检测（与 15001930070 编辑距离 ≤2 的 10-11 位串）
const WRONG_PHONE_PATTERN = /\b1500193070\b|\b150019300070\b|\b1500193007\b/g;
// 1.9c §1: 知识库文章链接重写
const KB_LINK_PATTERN = /\/kb\/([A-Z]\d+)\/([A-Z]\d+-\d+)/gi;
const KB_BARE_ID_PATTERN = /\b([A-Z]\d+-\d+)\b/g;
// 1.9c §3: 数字 fail-closed（收费/价格类数字白名单）
const PRICE_CONTEXT = /收费|价格|费用|公证费|咨询费|检测费|律师费|小时费|每小时/gi;
const PRICE_WHITELIST = ['3000', '5000', '10000', '12348', '962200'];  // 事实包中的合法数字
const PRICE_NUMBER_PATTERN = /\d+(?:元|块|钱|\/小时|\/件|\/次)?/g;

export function sanitizeReply(text: string, sessionId?: string): string {
  // P0-FIX2 (20260916): kb-link rewrite runs FIRST (idempotency).
  // A legal /kb/D05/D05-002 link must be rewritten to /knowledge/content/D05-002
  // before any stripping pass, so re-sanitizing an already-sanitized buffer is a
  // no-op instead of wiping the href (case F06: href="/kb/..." -> href="").
  if (KB_LINK_PATTERN.test(text)) {
    console.warn('[kb-link-rewrite]', { sessionId });
    KB_LINK_PATTERN.lastIndex = 0;
    text = text.replace(KB_LINK_PATTERN, '/knowledge/content/$2');
  }
  // 1.9b P0-1: 号码白名单过滤（优先处理，防止错号输出）
  // 先替换明显的错号
  if (WRONG_PHONE_PATTERN.test(text)) {
    console.warn('[wrong-phone-blocked]', { sessionId, match: text.match(WRONG_PHONE_PATTERN)?.slice(0, 3) });
    WRONG_PHONE_PATTERN.lastIndex = 0;
    text = text.replace(WRONG_PHONE_PATTERN, '15001930070');
  }
  // 检查其他号码是否在白名单中
  const phoneMatches = text.match(PHONE_PATTERN);
  if (phoneMatches) {
    const hasCrisisContext = CRISIS_CONTEXT.test(text);
    CRISIS_CONTEXT.lastIndex = 0;
    for (const phone of phoneMatches) {
      const normalizedPhone = phone.replace(/[-\s]/g, '');
      if (!PHONE_WHITELIST.some(w => normalizedPhone.includes(w) || w.includes(normalizedPhone))) {
        if (hasCrisisContext) {
          console.warn('[non-whitelist-phone-in-crisis]', { sessionId, phone, context: 'crisis' });
          // 在危机语境中，非白名单号码替换为热线区块
          text = text.replace(new RegExp(phone.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), '15001930070（24小时）');
        }
      }
    }
  }
  // 内部路径过滤
  if (INTERNAL_LEAK.test(text)) {
    console.warn('[internal-leak-blocked]', { sessionId, match: text.match(INTERNAL_LEAK)?.slice(0, 3) });
    INTERNAL_LEAK.lastIndex = 0;
    text = text.replace(/\/kb\/[A-Z0-9\-\/]+/gi, '');
    text = text.replace(/\/kb\//gi, '');
    // P1.5 工单 C：kbs?:// 协议变体过滤
    text = text.replace(/kbs?:\/\/[A-Z0-9\-\/]+/gi, '');
    text = text.replace(/kbs?:\/\//gi, '');
    text = text.replace(/(?<!content)\/D\d{2}[\/\-][A-Z0-9\-]+/gi, '');
    text = text.replace(/(?:src\/|data\/|fact_pack|retrieval_hooks)/gi, '');
    text = text.replace(/\.ts\b/gi, '');
    text = text.replace(/\.json\b/gi, '');
    // P1 工单 B：禁止出现 .md 文件名和 qmkx.ai 域名
    text = text.replace(/\.md\b/gi, '');
    text = text.replace(/qmkx\.ai/gi, '');
    // P1.5 工单 C：明文路径句式清理
    text = text.replace(/(?:路径|来源文件|文件)[：:]\s*\/?[A-Z0-9\-\/\.]+/gi, '');
    text = text.replace(/[:：]\s*$/gm, '').replace(/\s{2,}/g, ' ').trim();
  }
  // P18-3: 天气/交通禁词过滤
  if (WEATHER_TRAFFIC_BANNED.test(text)) {
    console.warn('[weather-traffic-banned]', { sessionId, match: text.match(WEATHER_TRAFFIC_BANNED)?.slice(0, 3) });
    WEATHER_TRAFFIC_BANNED.lastIndex = 0;
    text = text.replace(/天气APP/gi, '手机自带的天气');
    text = text.replace(/天气预报APP/gi, '手机自带的天气');
    text = text.replace(/地图APP/gi, '手机地图');
    text = text.replace(/打开.*?APP/gi, '用手机自带的工具');
  }
  // P1.5 工单 E + P1.6 F3：推诿话术 BANNED 拦截（句子级处理）
  // P1.8 H3：行政回复豁免 - 包含行政事实信息的回复不触发推诿拦截
  // P1.9 I2：行政意图全量豁免 - 预约/改期/取消/预约操作也纳入豁免
  const ADMIN_FACT_PATTERNS = /上海市静安区民立路|150号|15001930070|13601658763|qm_kw_gone|QM酷儿心理|工作时间|收费|价格|公众号|预约|改期|取消|改预约|怎么约|如何预约|预约.*操作/i;
  const isAdminReply = ADMIN_FACT_PATTERNS.test(text);
  
  if (!isAdminReply && DEFLECTION_BANNED.test(text)) {
    console.warn('[deflection-banned]', { sessionId, match: text.match(DEFLECTION_BANNED)?.slice(0, 3) });
    DEFLECTION_BANNED.lastIndex = 0;
    // P1.6 F3：句子级处理，删除包含推诿话术的整句
    text = text.replace(/你可以点「?切换到小雪」?[，,。.]?\s*她会帮你[^。]*[。]?/g, '');
    text = text.replace(/你可以点「?切换小雪」?[，,。.]?\s*她会帮你[^。]*[。]?/g, '');
    text = text.replace(/你可以点「?转小雪」?[，,。.]?\s*她会帮你[^。]*[。]?/g, '');
    text = text.replace(/你可以点「?找小雪」?[，,。.]?\s*她会帮你[^。]*[。]?/g, '');
    text = text.replace(/你可以点「?转人工」?[，,。.]?\s*她会帮你[^。]*[。]?/g, '');
    text = text.replace(/你可以点「?人工客服」?[，,。.]?\s*她会帮你[^。]*[。]?/g, '');
    // 删除其他推诿句式
    text = text.replace(/这部分已经超出了我的支持范围[，,。.]?/g, '');
    text = text.replace(/我怕随便给建议反而帮不到你[，,。.]?/g, '');
    text = text.replace(/我不熟悉行政这块的细节[，,。.]?\s*怕说错[^。]*[。]?/g, '');
    text = text.replace(/我不替小雪做决定[，,。.]?\s*免得把[^。]*[。]?/g, '');
    text = text.replace(/我只是工具[，,。.]?/g, '');
    text = text.replace(/没办法回答[，,。.]?/g, '');
    // P1.6 F3：残句检测正则 - 空引号/空书名号/空括号对
    text = text.replace(/「」/g, '');
    text = text.replace(/『』/g, '');
    text = text.replace(/""/g, '');
    text = text.replace(/''/g, '');
    text = text.replace(/（）/g, '');
    text = text.replace(/\(\)/g, '');
    text = text.replace(/\[\]/g, '');
    text = text.replace(/【】/g, '');
    text = text.replace(/[:：]\s*$/gm, '').replace(/\s{2,}/g, ' ').trim();
  }
  // 1.10.2: 内部标识扫描（命中即拦截，替换为安全兜底话术）
  if (INTERNAL_IDENTIFIERS.test(text)) {
    console.warn('[internal-identifier-blocked]', { sessionId, match: text.match(INTERNAL_IDENTIFIERS)?.slice(0, 3) });
    return '刚才那边好像打了个岔，我没接住，可以再说一遍你想聊的吗？';
  }
  // 1.9c §1: 知识库文章链接重写（/kb/... → /knowledge/content/...）
  if (KB_LINK_PATTERN.test(text)) {
    console.warn('[kb-link-rewrite]', { sessionId });
    KB_LINK_PATTERN.lastIndex = 0;
    text = text.replace(KB_LINK_PATTERN, '/knowledge/content/$2');
  }
  // 1.9c §1: 裸编号补全为可点链接（D01-009 → https://queermental.coze.site/knowledge/content/D01-009）
  // 注意：只补全未被包在链接中的裸编号
  const bareIdMatches = text.match(KB_BARE_ID_PATTERN);
  if (bareIdMatches) {
    for (const id of bareIdMatches) {
      // 检查该编号是否已经在链接中
      const linkPattern = new RegExp(`\\/knowledge\\/content\\/${id}|\\[.*?\\]\\(.*?${id}.*?\\)`, 'i');
      if (!linkPattern.test(text)) {
        console.warn('[bare-id-autolink]', { sessionId, id });
        text = text.replace(new RegExp(`\\b${id}\\b`, 'g'), `[${id}](https://queermental.coze.site/knowledge/content/${id})`);
      }
    }
  }
  // P1.5 工单 C：markdown 链接 href 白名单
  // 解析所有 [text](url)，url 仅允许合法域名，否则降级为纯文本标题
  const MD_LINK_PATTERN = /\[([^\]]+)\]\(([^)]+)\)/g;
  const ALLOWED_DOMAINS = [
    'https://queermental.coze.site',
    'https://www.gov.cn',
    'https://www.nhc.gov.cn',
    'https://www.mohurd.gov.cn',
    'http://www.moj.gov.cn',
    'https://www.12348.gov.cn',
    'https://www.spp.gov.cn',
    'https://www.court.gov.cn',
    'https://www.mps.gov.cn',
    'https://www.nrta.gov.cn',
    'https://www.miit.gov.cn',
    'https://www.samr.gov.cn',
    'https://www.cac.gov.cn',
  ];
  text = text.replace(MD_LINK_PATTERN, (match, linkText, url) => {
    // 检查 url 是否以合法域名开头
    const isAllowed = ALLOWED_DOMAINS.some(domain => url.trim().startsWith(domain));
    if (!isAllowed) {
      // 降级为纯文本标题
      console.warn('[md-link-whitelist-blocked]', { sessionId, url, linkText });
      return linkText;
    }
    return match;
  });
  // P1.6 F4：空链接检测 - 清理空 href 壳 [标题]()
  text = text.replace(/\[[^\[\]]{1,80}\]\(\s*\)/g, (match) => {
    // 提取方括号内的标题文字
    const titleMatch = match.match(/\[([^\[\]]+)\]/);
    if (titleMatch) {
      console.warn('[empty-href-link-cleaned]', { sessionId, title: titleMatch[1] });
      return titleMatch[1]; // 返回纯文本标题
    }
    return '';
  });
  // P1.6 G4 + P1.8 H7：jump 标签空壳处理 - 清理 <jump href="">标题</jump>
  text = text.replace(/<jump[^>]*href=["']\s*["'][^>]*>([\s\S]*?)<\/jump>/gi, (match, content) => {
    console.warn('[empty-jump-link-cleaned]', { sessionId, content: content.trim() });
    return content.trim(); // 返回纯文本内容
  });
  // P1.8 H7：组件标签与内部语法消毒兜底
  // 1. [assessment] 等内部组件标签 → 转为自然语言
  text = text.replace(/\[assessment\]/gi, '情绪自评量表');
  text = text.replace(/\[mbti\]/gi, 'MBTI 测试');
  text = text.replace(/\[article[^\]]*\]/gi, '文章');
  // 2. <invoke> 等内部标签 → 删除标签，保留内容
  text = text.replace(/<invoke[^>]*>([\s\S]*?)<\/invoke>/gi, '$1');
  text = text.replace(/<invoke[^>]*\/>/gi, '');
  // 3. /assessments/、/assemblies/ 等内部路径 → 删除或转为自然语言
  text = text.replace(/\/assessments\/[^\s)）]*/gi, '');
  text = text.replace(/\/assemblies\/[^\s)）]*/gi, '');
  // 4. 半截病句检测（句子以"这属于/避免你/请不要"等半截收尾）
  text = text.replace(/这属于[，,。.]?\s*$/gm, '');
  text = text.replace(/避免你[^\n。！？]*$/, '');
  // 1.9c §3: 数字 fail-closed（收费/价格类数字白名单）
  if (PRICE_CONTEXT.test(text)) {
    PRICE_CONTEXT.lastIndex = 0;
    const priceNumbers = text.match(PRICE_NUMBER_PATTERN);
    if (priceNumbers) {
      for (const num of priceNumbers) {
        const cleanNum = num.replace(/[^\d]/g, '');
        if (cleanNum && !PRICE_WHITELIST.some(w => cleanNum.includes(w) || w.includes(cleanNum))) {
          // 检查是否是常见的小数字（几百、几千等模糊表述）
          if (/几百|几千|大概|差不多|一般/.test(text)) {
            console.warn('[price-fail-closed]', { sessionId, number: num, context: 'vague' });
            // 替换为事实包口径
            text = text.replace(/几百元|几千元|大概.*?元|差不多.*?元/g, '3000 元/件起（以公证处公示为准）');
            text = text.replace(/每小时.*?元|小时费.*?元/g, '律师费用因人和案情差异大，建议直接向意向律师询价');
            break;
          }
        }
      }
    }
  }
  return text;
}

// v12.0.0: DECISION-ROLE-001 四角色宪法 v14.0
import {
  isAdminIntent,
  shouldXiaokuHandoff,
  hasEmotionalContext,
  buildXiaokuHandoffMessage,
  GLOBAL_ROLE_GOVERNANCE_SP,
  XIAOKU_POLICY_SP,
  type AdminIntentType,
} from "@/lib/role-governance";
import {
  verifyRoleOutput,
  buildRetryWarning,
  getXiaokuSafetyTemplate,
} from "@/lib/role-verifier";
// v13.0 认知运行层：让78万+训练数据真正成为AI的"大脑"而非"耳朵"
import {
  runCognitivePipeline,
  detectRelevantPacks,
  verifyCognitiveOutput,
} from "@/lib/cognitive-runtime";
import { shouldSearch, cachedSearch, formatRealtimeResults } from "@/lib/realtime-search";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * P0 方案 A：SDK 调用侧消息清洗。
 * @langchain/openai convertContent 遇 content=null 会触发 null.map（生产 P0 报错根因）。
 * 静态类型 Message.content:string 无法覆盖运行时脏数据（POST body / 历史序列化可能带
 * content=null、数组或对象），故在传入 SDK 前兜底为最简结构：仅保留 role + content 字符串，
 * content 为 null/undefined 转空串，非字符串统一 String() 化。
 */
function sanitizeMessagesForSdk(messages: Message[]): Message[] {
  return messages
    .filter((m) => m && (m.role === "user" || m.role === "assistant" || m.role === "system"))
    .map((m) => {
      const raw = m.content;
      const content =
        raw == null ? "" : typeof raw === "string" ? raw : String(raw);
      return { role: m.role, content };
    });
}

interface ChatRequestBody {
  messages: Message[];
  sessionId?: string;
  clientContext?: {
    treehole?: TreeholeClientContext;
  };
}

console.info("[QM:XIAOKU]", {
  build: XIAOKU_BUILD_ID,
  promptSha: XIAOKU_PROMPT_SHA.slice(0, 12),
  promptPath: XIAOKU_PROMPT_PATH,
  governanceVersion: "DECISION-ROLE-001 v14.0",
});

// 从服务器端文件加载完整 System Prompt。
// A：模块级缓存 + mtime 失效，避免高并发下每次请求重复 readFileSync 283KB（同步 I/O 排队放大）。
let xiaokuSpCache: { mtimeMs: number; content: string } | null = null;
function loadSystemPrompt(): string {
  try {
    const spPath = path.join(process.cwd(), XIAOKU_PROMPT_PATH);
    const stat = fs.statSync(spPath);
    if (xiaokuSpCache && xiaokuSpCache.mtimeMs === stat.mtimeMs) {
      return xiaokuSpCache.content;
    }
    const content = fs.readFileSync(spPath, "utf-8");
    xiaokuSpCache = { mtimeMs: stat.mtimeMs, content };
    return content;
  } catch (error) {
    console.error("[QM SP] Failed to load system prompt:", error);
    return "你是 QM AI，一款心理支持助手。";
  }
}

function buildQmHeaders(extra?: HeadersInit): Headers {
  const h = new Headers(extra);
  h.set("X-QM-Agent", "xiaoku");
  h.set("X-QM-Build", XIAOKU_BUILD_ID);
  h.set("X-QM-Prompt-SHA", XIAOKU_PROMPT_SHA.slice(0, 12));
  return h;
}

/**
 * 辅助：以流式方式返回标准安全话术
 */
function streamStandardRefusal(
  encoder: TextEncoder,
  extra?: { isPromptInjection?: boolean },
): ReadableStream {
  const response = buildStandardRefusal();
  return new ReadableStream({
    start(controller) {
      let index = 0;
      const interval = setInterval(() => {
        if (index < response.length) {
          let chunkSize = safeChunkSize(response, index);
          // 切分边界须落在 UTF-16 代理对之外，否则劈开 emoji (如 📞 \ud83d\udcde) 会变 "??"。
          if (chunkSize > 0) {
            const last = response.charCodeAt(index + chunkSize - 1);
            const next = response.charCodeAt(index + chunkSize);
            if (last >= 0xd800 && last <= 0xdbff && next >= 0xdc00 && next <= 0xdfff) {
              chunkSize -= 1; // 让完整代理对整体进入下一帧
            }
          }
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                content: response.slice(index, index + chunkSize),
                isCrisis: false,
                isFirewallBlock: true,
                ...(extra?.isPromptInjection
                  ? { firewallReason: "prompt_injection" }
                  : { firewallReason: "output_scan_block" }),
              })}\n\n`,
            ),
          );
          index += chunkSize;
        } else {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          clearInterval(interval);
          controller.close();
        }
      }, 20);
    },
  });
}

function extractAssistantHistory(messages: Message[]): string[] {
  return messages
    .filter((m) => m.role === "assistant")
    .map((m) => m.content)
    .filter((c) => c && c.trim().length > 0);
}

/**
 * v13.2: 从消息列表中提取最近N轮的对话文字（用于树洞触发判断）
 */
function getRecentConversationText(messages: Message[], rounds = 6): string {
  const recent = messages.slice(-rounds * 2);
  return recent.map((m) => m.content).join("\n");
}

/**
 * v1.9i: 法定真名 / 内部人员 / 敏感身份信息 输出闸门词表
 * 这些字符片段一律不得出现在小酷给用户的输出中；命中即替换为脱敏说法。
 * 注意：新增真名只允许往这个表里加，不允许删；表与小雪侧 v1.9i-v2 词表保持一致。
 */
const LEGAL_NAME_REWRITES: { regex: RegExp; replace: string }[] = [
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

function maskLegalNames(text: string): string {
  let out = text;
  for (const p of LEGAL_NAME_REWRITES) {
    out = out.replace(p.regex, p.replace);
  }
  return out;
}

/**
 * v13.1: 对单个 chunk 执行 REWRITE 级别的替换（姓名/版本号等），
 * 但不执行 BLOCK 检测（BLOCK 移到流结束后对 fullOutput 执行）。
 */
function rewriteChunk(content: string): string {
  let rewritten = maskLegalNames(content);
  for (const pattern of [
    { regex: /\b(Susan|Candice|Christy)\b/gi, replace: "心理师" },
    { regex: /陈瑜倩/g, replace: "心理师" },
    { regex: /\bv\d+\.\d+(?:\.\d+)?(?:_[\w\u4e00-\u9fa5]+)?/g, replace: "" },
  ]) {
    rewritten = rewritten.replace(pattern.regex, pattern.replace);
  }
  return rewritten;
}

// CRFIX1（20260925）：本地他人主体语境 / 他人告别语+时间地点倒计时判定，镜像小雪 5.7/5.7b 守卫。
// 禁动 crisis-detection.ts 共用函数本体（红线），此处以本地副本等效复用。语义逐行对照小雪实现。
function isOtherPersonContext(text: string): boolean {
  const otherPersonRole = /(?:我(?:的|们?的|身边|认识|担心|班上|带的|接待的|负责的)?(?:有(?:个|位)?)?(?:同学|室友|舍友|朋友|闺蜜|家人|孩子|儿子|女儿|对象|伴侣|老公|老婆|学生|学员|同事|网友|邻居|来访者|来访|当事人|服务对象|案主)|(?:他|她|TA|ta|他们|她们))/;
  const selfCrisisHit = /我.{0,6}(?:不想活|想死|想自杀|撑不住|撑不下去|活不下去|想不开)/.test(text);
  return otherPersonRole.test(text) && !selfCrisisHit;
}

function isFarewellWithTimePlace(text: string): boolean {
  const farewellKeywords = /遗书|告别信|绝笔信|遗言/;
  const timePlaceCue = /今晚|今(?:天|晚)|明(?:天|早|晚)|凌晨|深夜|几点|几点钟|半小时|倒计时|还剩|就剩|还有.{0,4}天|没多少|天台|楼顶|顶楼|窗台|江边|河边|河堤|桥上|江上|学校|宿舍|放学|出门|跳|结束|实施|不在了|走/;
  return farewellKeywords.test(text) && timePlaceCue.test(text);
}

// CRFIX1（20260925）：他人协助快路径统一 SSE 流出，复用小雪 THIRD_PERSON_CRISIS_RESPONSE.direct
// （人称 TA/他，含 110/120+15001930070+13601658763+12356 全家桶），isCrisis:true 语义对齐小雪快路径。
function otherHelperStreamResponse(text: string | undefined, sessionId: string): Response {
  const helperText = sanitizeReply(crisisCardWithParaphrase(THIRD_PERSON_CRISIS_RESPONSE.direct, text || ""), sessionId);
  const encH = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      let hi = 0;
      const iv = setInterval(() => {
        if (hi < helperText.length) {
          const cs = safeChunkSize(helperText, hi);
          controller.enqueue(encH.encode(`data: ${JSON.stringify({ content: helperText.slice(hi, hi + cs), isCrisis: true, crisisLevel: "direct", subject: "other" })}\n\n`));
          hi += cs;
        } else {
          clearInterval(iv);
          controller.enqueue(encH.encode("data: [DONE]\n\n"));
          controller.close();
        }
      }, 20);
    },
  });
  return new Response(stream, {
    headers: buildQmHeaders({
      "Content-Type": "text/event-stream",
      "Transfer-Encoding": "chunked",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
      Connection: "keep-alive",
    }),
  });
}

export async function POST(request: NextRequest) {
  // F7：低落输入模板 ack 标记（不整段旁路，交给主 LLM 流秒级先发模板再模型续写）
  let lowAckActive = false;
  const traceId = `xk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const trace: Record<string, unknown> = {
    traceId,
    build: XIAOKU_BUILD_ID,
    startTime: new Date().toISOString(),
    governanceVersion: "DECISION-ROLE-001 v14.0",
  };
  
  // P1.7 F9：服务端分阶段耗时日志
  const perfLog: Record<string, number> = {};
  const logPerf = (stage: string) => {
    perfLog[stage] = Date.now();
  };
  logPerf("request_received");

  try {
    let body: ChatRequestBody;
    try {
      body = (await request.json()) as ChatRequestBody;
    } catch (jsonError) {
      // P1.9 I4 E04：坏 JSON → 400（禁止 500）
      return new Response(JSON.stringify({ error: "请求格式错误，请检查输入" }), {
        status: 400,
        headers: buildQmHeaders({ "Content-Type": "application/json" }),
      });
    }
    const { messages, sessionId, clientContext } = body;
    logPerf("body_parsed");
    // R3.8 F-1: 会话级危机状态键 + 轻资源行容器（作用域=整个 POST handler，供主 LLM 流收尾读取）
    const qmPersistKey = sessionKeyFrom(request, "xiaoku", body as unknown as Record<string, unknown>);
    let qmCrisisPersistLine = "";

    // T6（E1c）：元素级最小 schema——messages 须为数组且非空，每元素为对象、含合法 role（user/assistant/system）+ 字符串 content。
    // 畸形输入（[{}] / [1,2] / 元素缺字段）在入口 400 早退，禁吞成 200+error 事件。
    if (
      !Array.isArray(messages) ||
      messages.length === 0 ||
      !messages.every(
        (m) =>
          m &&
          typeof m === "object" &&
          (m.role === "user" || m.role === "assistant" || m.role === "system") &&
          typeof m.content === "string",
      )
    ) {
      return new Response(JSON.stringify({ error: "消息不能为空" }), {
        status: 400,
        headers: buildQmHeaders({ "Content-Type": "application/json" }),
      });
    }

    // P1.9 I4 E02/E03：空 content / 纯空格 content → 400
    const lastUserMsg = [...messages].reverse().find((m) => m && typeof m === "object" && m.role === "user");
    if (lastUserMsg && (typeof lastUserMsg.content !== "string" || !lastUserMsg.content.trim())) {
      return new Response(JSON.stringify({ error: "消息内容不能为空" }), {
        status: 400,
        headers: buildQmHeaders({ "Content-Type": "application/json" }),
      });
    }

    // ---- P1.8 H10：输入边界 - 纯文本转义（防 WAF 误杀）----
    // 对用户消息中的尖括号和事件处理器进行转义，防止触发网关 444
    for (const msg of messages) {
      if (msg.content) {
        // 转义 < 和 > 为实体，防止 XSS/HTML 注入触发 WAF
        msg.content = msg.content
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/onerror\s*=/gi, '')
          .replace(/onload\s*=/gi, '')
          .replace(/onclick\s*=/gi, '')
          .replace(/onmouseover\s*=/gi, '');
      }
    }

    // ---- 优先级 0：版本诊断口令 ----
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMessage?.content?.trim() === "QM_XIAOKU_BUILD_CHECK") {
      return new Response(
        `XIAOKU_BUILD=${XIAOKU_BUILD_ID}\nPROMPT_SHA=${XIAOKU_PROMPT_SHA.slice(0, 12)}`,
        {
          headers: buildQmHeaders({ "Content-Type": "text/plain; charset=utf-8" }),
        },
      );
    }

    // ---- P1.7 F4：超长输入护栏与即时反馈 ----
    const userTextLength = lastUserMessage?.content?.length || 0;
    const isLongInput = userTextLength > 2000;

    // ---- P1.9 I1：资源问询意图识别（P0-A 20260928 路由后置：危机句先进危机链，不走本 canned 路由）----
    // 用户询问求助资源（热线/电话/半夜能联系谁/文字方式/微信/不敢打电话）
    // 危机优先口径：isCrisis=true 或即时危险(P0-B 接回)句子不进本路由，仅非危机句走资源问询
    if (lastUserMessage && !detectCrisis(lastUserMessage.content).isCrisis && !hasImmediateDangerSignal(lastUserMessage.content)) {
      const resourceQueryPatterns = [
        /热线|求助.*电话|打.*电话|联系.*方式|文字.*联系|不敢打电话|半夜.*打.*什么|晚上.*打.*什么|有.*电话.*吗|怎么.*联系.*你们|文字.*方式/,

        /联系电话|你们电话|你们的电话|电话是多少|电话多少|电话是啥|联络方式|联系方式|如何联系|怎么联系|怎样联系|联系你们|咋联系/,
      ];
      const resourceIntentHit = resourceQueryPatterns.some(pattern => pattern.test(lastUserMessage.content));
      // P0FIX-F1 语义门：情绪/拒绝/失联语境（被拉黑/删联系方式/不想接电话等）不得触发资源墙，放行主链路共情（参照 E1/E4 共情范式）
      const resourceContextBlocked = /不用给我|不用发我|不用联系|不想接|不想打|不想联系|别给我|别联系|拉黑|删了|删除|删掉|没了|联系不上|失联|找不到|屏蔽|断联|分手|失恋|分了|前女友|前男友|前对象|对象|拒绝接听|不接电话|只想说说话|就想说说话|就想聊聊|就想说说/.test(lastUserMessage.content);
      const isResourceQuery = resourceIntentHit && !resourceContextBlocked;
      
      if (isResourceQuery) {

        const resourceResponse = `我理解你想了解我们的求助方式，这里把所有联系方式都给你：

📞 **12356**（全国心理援助热线，7×24 小时）
📞 **15001930070**（QM 心理援助热线，24 小时）
📞 **13601658763**（QM 备用热线，24 小时）
📞 **12355**（青少年服务台，青少年专线）`;

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          start(controller) {
            let index = 0;
            const interval = setInterval(() => {
              if (index < resourceResponse.length) {
                const chunkSize = safeChunkSize(resourceResponse, index);
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      content: resourceResponse.slice(index, index + chunkSize),
                      isCrisis: false,
                      isResourceQuery: true,
                    })}\n\n`,
                  ),
                );
                index += chunkSize;
              } else {
                clearInterval(interval);
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                controller.close();
              }
            }, 20);
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no",
            ...buildQmHeaders(),
          },
        });
      }
    }

    // CRFIX1B（20260925）：他人告别语+明确时间/地点/倒计时 → 他人协助快路径。
    // 置于 J1 帮手分流之前：告别信原句「她写了告别信说明晚八点在江边，就剩一天了」会命中 J1（helperCrisis「告别」+角色 她）
    // 且 hasImmediateDangerSignal=false（其 cue 不覆盖 明晚/江边/就剩）→ 被 J1-P5 提前降级为 S1 承接（无110/120），
    // 永远到不了危机块内的 farewell 判定。故将 farewell 前置提到 J1 之前，先兜住告别信/绝笔信/遗言/遗书他人即时告别。
    // 非告别语料（怕ta想不开/朋友圈开了告别/来访者有自杀风险等 J1-S1 语义）isFarewellWithTimePlace=false，不拦截，J1 原貌保留。
    if (lastUserMessage && isOtherPersonContext(lastUserMessage.content) && isFarewellWithTimePlace(lastUserMessage.content)) {
      return otherHelperStreamResponse(lastUserMessage.content ?? "", sessionId || "");
    }

    // ---- P1.10 J1：第三人称帮助者求助（当事人非用户本人的自伤/自杀危机求助）----
    // 同学/学生/来访者/朋友/家人…由帮助者代为求助时，即使 isCrisis 判 false，也应给到帮助者视角危机资源卡（四号齐全）
    if (lastUserMessage) {
      // P1.11 修订：放宽为「第三主体角色词 + 危机语境同句共现」，不再要求谓语紧贴关系词
      // 覆盖 T05（"学生…几天前在朋友圈开了告别"）、T09（"来访者…有自杀风险"）等间隔表达
      const helperCrisisPattern = /不想活|活着(?:没|无)?意思|撑不住|撑不下去|熬不下去|熬不住|告别|道别|说再见|告别类|自伤|自杀|轻生|想不开|不想过(?:了)?|伤害自己|结束(?:自己|生命|一切)|想死|了结|遗书|最后一次|做傻事|活不下去|联系不上|对不起所有人|没了他(?:们)?怎么办|有(?:轻生|自杀)(?:倾向|念头|风险)/;
      // 帮助者角色主体（班级/咨询/亲友/同事/网友等代为求助；含他/她/他们等隐含第三主体）
      const helperRolePattern = /我(?:的|们?的|身边|认识|担心|班上|带的|接待的|负责的)?(?:有(?:个|位)?)?(?:同学|室友|舍友|朋友|闺蜜|家人|孩子|儿子|女儿|对象|伴侣|老公|老婆|学生|学员|同事|网友|邻居|来访者|来访|当事人|服务对象|案主)|(?:班上有|班里|班上有位|这?(?:位|个|名)|那个|那)(?:学生|同学|来访者|求助者|当事人|服务对象|案主)|(?:班主任|老师|辅导员|求助者)|(?:他|她|TA|ta|他们|她们)/;
      // 排除：危机以「我+危机」短窗口出现（第一人称自陈，如"我不想活了"），不误投帮助者模板
      const helperSelfHit = /我.{0,6}(?:不想活|想死|想自杀|撑不住|撑不下去|活不下去|想不开)/.test(lastUserMessage.content);
      // P0 三因子：专业督导语境（含伦理学探讨/案例讨论/评估提问）豁免帮助者快路径，
      // 避免「我有个来访者…保密例外怎么平衡」「来访者反复割腕但不想死」被劫持为陪伴者慌乱卡，
      // 放行给下方 detectCrisis 三因子层与 Pro 装配（MED-03 专业纠正）接管。
      const supervisionQueryExempt =
        /(?:督导|个案|来访者|来访|当事|服务对象|案主).{0,24}(?:保密|伦理|评估|风险|怎么(?:平衡|处理|评估)|如何(?:平衡|处理|评估)|怎么办|方法论|干预方案|可不可以|是否)/.test(lastUserMessage.content);
      const helperRoleAttribution = helperRolePattern.test(lastUserMessage.content) && !helperSelfHit;
      if (helperCrisisPattern.test(lastUserMessage.content) && helperRoleAttribution && !supervisionQueryExempt) {
        // P5（20260925）：他人风险分流。宽松危机词（想不开/告别/撑不住）但无具体即时危险 → 降级为
        // 承接用户自身边界困境+支持策略+末尾轻留（isCrisis:false）；有具体即时明确危险 → 仍走完整帮助者卡（可推动介入）。
        if (!hasImmediateDangerSignal(lastUserMessage.content)) {
          const otherSupport = sanitizeReply(
            crisisCardWithParaphrase(CRISIS_OTHER_SUPPORT_RESPONSE, lastUserMessage.content),
            sessionId,
          );
          const encoderS = new TextEncoder();
          const supportStream = new ReadableStream({
            start(controller) {
              let i = 0;
              const iv = setInterval(() => {
                if (i < otherSupport.length) {
                  const cs = safeChunkSize(otherSupport, i);
                  controller.enqueue(encoderS.encode(`data: ${JSON.stringify({ content: otherSupport.slice(i, i + cs), isCrisis: false, isHelperCrisis: false, subject: "other" })}\n\n`));
                  i += cs;
                } else {
                  clearInterval(iv);
                  controller.enqueue(encoderS.encode("data: [DONE]\n\n"));
                  controller.close();
                }
              }, 20);
            },
          });
          return new Response(supportStream, {
            headers: buildQmHeaders({
              "Content-Type": "text/event-stream",
              "Transfer-Encoding": "chunked",
              "Cache-Control": "no-cache",
              "Connection": "keep-alive",
            }),
          });
        }
        const helperTemplate = THIRD_PERSON_CRISIS_RESPONSE.direct;
        const sanitizedHelperResponse = sanitizeReply(helperTemplate, sessionId);
        const encoder = new TextEncoder();
        const helperStream = new ReadableStream({
          start(controller) {
            let index = 0;
            const interval = setInterval(() => {
              if (index < sanitizedHelperResponse.length) {
                const chunkSize = safeChunkSize(sanitizedHelperResponse, index);
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      content: sanitizedHelperResponse.slice(index, index + chunkSize),
                      isCrisis: true,
                      crisisLevel: "direct",
                      isHelperCrisis: true,
                    })}\n\n`,
                  ),
                );
                index += chunkSize;
              } else {
                clearInterval(interval);
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                controller.close();
              }
            }, 20);
          },
        });
        return new Response(helperStream, {
          headers: buildQmHeaders({
            "Content-Type": "text/event-stream",
            "Transfer-Encoding": "chunked",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          }),
        });
      }
    }

    // ---- 优先级 1：危机检测（高于角色治理）----
    if (lastUserMessage) {
      const crisisResult = detectCrisis(lastUserMessage.content);
      // P0-B（20260928）：刀架脖族词表恢复——P56 即时危险信号层（凶器架身族词形）接回 isCrisis 主闸；
      // 0925 13:40 P58 验收态(direct+110/120)被后续无词表态部署覆盖，按原口径接回；词表本体零增删。
      const R3_WITHDRAWAL_ROUTE = /气话|吓到|缓过来|缓过劲|没事了|开玩笑|玩笑话|不想聊这个了/i;
      if (!crisisResult.isCrisis && hasImmediateDangerSignal(lastUserMessage.content) && !R3_WITHDRAWAL_ROUTE.test(lastUserMessage.content)) {
        crisisResult.isCrisis = true;
        crisisResult.level = 'direct';
      }
      logPerf("crisis_detected");
      // ---- R3.8 F-1: 危机状态跨轮写入（升级就高+刷新）+ 用户主动安全出口降级（阿花 QA 附加条件）----
      // 红线：detectCrisis/P0-B/R3.7 判定零改动；本块只做"报警后持续陪伴"的会话级状态登记。
      if (crisisResult.isCrisis) {
        recordCrisisHit(qmPersistKey, crisisResult.level === "direct" ? "direct" : "gentle");
      } else if (SAFE_EXIT_RE.test(lastUserMessage.content || "")) {
        markSafeExit(qmPersistKey);
      }
      // TTL 内 + 当轮非危机 → 主流响应尾部附加轻资源行（不置 isCrisis、不弹全量卡）
      qmCrisisPersistLine = !crisisResult.isCrisis && getActiveCrisis(qmPersistKey) ? LIGHT_RESOURCE_LINE : "";
      // RC1：低危呈现分级（判定阈值零改动，仅呈现）。isCrisis 命中→走下方 high 完整卡；
      // 未命中但命中纯低落情绪词库→轻提示模板，不弹完整卡、不追问安全、不拦 LLM（继续对话）。
      if (!crisisResult.isCrisis && detectLowSeverityCrisis(lastUserMessage.content)) {
        // F7：低落模板作为秒级 ack 注入主 LLM 流，不再整段模板旁路绕 SP（SP 人格 + 出站清洗仍生效）
        lowAckActive = true;
        logPerf("ack_low_active");
      }
      if (crisisResult.isCrisis) {
        // W6: 叙述视角识别 - 专业讨论/亲友代问不直接甩危机话术，交由 LLM 弹出闸门
        const perspective = detectNarrativePerspective(lastUserMessage.content);
        // [RETEST-FIX-2-GATE] hard-gate forced hits must NOT be overridden by perspective gate
        const hardGateForced = (crisisResult.matchedWords || []).find((w) => String(w).indexOf("RETEST-FIX") === 0) || "";
        if (perspective === "professional" && !hardGateForced) {
          // 视角明确为专业讨论，不走危机直接响应，让 LLM 按系统提示词处理
          // 继续往下走 LLM 流程
        } else {
          // CRFIX1（20260925）：镜像小雪 5.7，他人语境 + 即时危险（割腕/凶器架身等）→ 他人协助快路径。
          // 修复他人割腕「她正在割手腕」此前 matchedWords 非 third_party（isOtherRisk=false）→ 不落 P5、
          // 落下方本人卡（人称错）。本人语境（无他人角色词/「我+危机」自陈）不进入，本人割腕句零误伤。
          if (hasImmediateDangerSignal(lastUserMessage.content) && isOtherPersonContext(lastUserMessage.content)) {
            return otherHelperStreamResponse(lastUserMessage.content ?? "", sessionId || "");
          }
          // P5（20260925）：他人风险且无具体即时危险（matchedWords=third_party_helper_crisis）→ 不弹完整危机卡，
          // 降级为承接用户自身边界困境+支持策略+末尾轻留（isCrisis:false）。即时危险硬词/本人/双主体不进入本档。
          if (isOtherRiskWithoutUrgency(crisisResult) && !hasImmediateDangerSignal(lastUserMessage.content)) {
            const otherResponse = sanitizeReply(
              crisisCardWithParaphrase(CRISIS_OTHER_SUPPORT_RESPONSE, lastUserMessage.content),
              sessionId,
            );
            const encoder2 = new TextEncoder();
            const otherStream = new ReadableStream({
              start(controller) {
                let idx = 0;
                const iv = setInterval(() => {
                  if (idx < otherResponse.length) {
                    const cs = safeChunkSize(otherResponse, idx);
                    controller.enqueue(encoder2.encode(`data: ${JSON.stringify({ content: otherResponse.slice(idx, idx + cs), isCrisis: false, subject: "other" })}\n\n`));
                    idx += cs;
                  } else {
                    clearInterval(iv);
                    controller.enqueue(encoder2.encode("data: [DONE]\n\n"));
                    controller.close();
                  }
                }, 20);
              },
            });
            return new Response(otherStream, {
              headers: buildQmHeaders({
                "Content-Type": "text/event-stream",
                "Transfer-Encoding": "chunked",
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
                Connection: "keep-alive",
              }),
            });
          }
          // P1.6 F1：第一人称自陈、亲友代问、视角不清，均走危机直接响应
          // 亲友代问（第三人称施救）使用专用话术模板，确保三号齐全
          // 检测是否为未成年人（检查整个对话历史，而不仅是一条消息）
          const allUserMessages = messages.filter((m) => m.role === "user").map((m) => m.content).join(" ");
          const isMinor = detectMinor(allUserMessages);
          
          let responseTemplate;
          if (perspective === "friend_family" || hardGateForced === "RETEST-FIX-T01T02") {
            // 第三人称施救场景
            responseTemplate = THIRD_PERSON_CRISIS_RESPONSE;
          } else {
            // 第一人称自陈或视角不清
            responseTemplate = isMinor ? MINOR_CRISIS_RESPONSE : CRISIS_RESPONSE;
          }
          
          // RC1：危机呈现分级。direct 与被动死亡意念间接级走现有完整卡（high）；
          // pure 纯低落情绪间接级（且无高危急象）改为低危轻提示模板，不弹完整四行卡。
          const isLowSeverity =
            crisisResult.level === "indirect" &&
            detectLowSeverityCrisis(lastUserMessage.content);
          const highCard = isLowSeverity
            ? CRISIS_LOW_RESPONSE
            : crisisResult.level === "gentle"
              ? PAST_HISTORY_GENTLE_RESPONSE
              : crisisResult.level === "direct"
                ? responseTemplate.direct
                : PAST_HISTORY_GENTLE_RESPONSE; // R39 F-5b: passive ideation -> gentle card
          // 补丁一：危机完整卡前置"我记得你"上下文插槽（从最近 6 轮 user 原话抽取身份/事件类原话，纯字符串零延迟）
          const rememberBlock = isLowSeverity
            ? ""
            : buildRememberYouBlock(messages.filter((m) => m.role === "user").map((m) => m.content).slice(-6));
          // P0FIX-C2 BOOKING_BRIDGE：direct 一级危机中检测预约意图时追加预约口子，危机卡本体零改动
          const bookingBridgeAppendix = /预约|帮我约|约个?.{0,4}(?:咨询|心理师|咨询师)|怎么.{0,8}(?:咨询|约)/.test(lastUserMessage.content)
            ? "\n\n拨打 15001930070 就能预约到 QM 的咨询师，这一步也可以请信任的人帮你拨。"
            : "";
          const response = rememberBlock + crisisCardWithParaphrase(highCard, lastUserMessage.content) + bookingBridgeAppendix;

          // P18-5: 内部路径泄露硬过滤
          const sanitizedResponse = sanitizeReply(response, sessionId);
          
          const encoder = new TextEncoder();
          const stream = new ReadableStream({
            start(controller) {
              let index = 0;
              const interval = setInterval(() => {
                if (index < sanitizedResponse.length) {
                  const chunkSize = safeChunkSize(sanitizedResponse, index);
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({
                        content: sanitizedResponse.slice(index, index + chunkSize),
                        isCrisis: true,
                        crisisLevel: crisisResult.level,
                      })}\n\n`,
                    ),
                  );
                  index += chunkSize;
                } else {
                  controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                  clearInterval(interval);
                  controller.close();
                }
              }, 20);
            },
          });

          return new Response(stream, {
            headers: buildQmHeaders({
              "Content-Type": "text/event-stream",
              "Transfer-Encoding": "chunked",
              "Cache-Control": "no-cache",
              Connection: "keep-alive",
            }),
          });
        }
      }
    }

    // ---- 优先级 2：Prompt 注入检测 ----
    if (lastUserMessage && detectPromptInjection(lastUserMessage.content)) {
      console.warn(
        `[QM Firewall] Prompt injection detected, sessionId=${sessionId || "unknown"}`,
      );
      const encoder = new TextEncoder();
      const stream = streamStandardRefusal(encoder, { isPromptInjection: true });
      return new Response(stream, {
        headers: buildQmHeaders({
          "Content-Type": "text/event-stream",
          "Transfer-Encoding": "chunked",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        }),
      });
    }

    // ---- F1: 事实检索（行政路由之前，优先处理法律领域问题）----
    const userText = lastUserMessage?.content || "";
    let factBlock = "";
    let factRetrievalLog: any = null;
    let factFallbackRequired = false;
    let factHit = false;
    try {
      const factResult = retrieveFacts(userText);
      factHit = factResult.hit;
      factRetrievalLog = {
        sessionId: sessionId || "unknown",
        domain: "legal",
        triggered: factResult.hit,
        hits: factResult.facts.length,
        topScore: factResult.facts[0]?.score || 0,
        topId: factResult.facts[0]?.fact_id || "none",
      };
      console.info("[QM:FACT] fact retrieval", factRetrievalLog);
      if (factResult.hit) {
        if (factResult.facts.length > 0) {
          factBlock = formatFactsForPrompt(factResult);
        } else {
          // F1: fail-closed - 领域命中但检索为空，使用统一兜底话术
          factFallbackRequired = true;
        }
      }
    } catch (factError) {
      console.error("[QM:FACT] fact retrieval error", factError);
    }

    // ---- v12.0.0: DECISION-ROLE-001 行政意图检测（事实检索之后）----
    // F1 fix: 如果事实检索命中法律领域，不触发行政路由
    const adminIntentResult = factHit ? { isAdminIntent: false, matchedIntents: [], rawText: userText } : isAdminIntent(userText);
    const adminHandoffRequired = factHit ? false : (adminIntentResult.matchedIntents.length > 0 ? shouldXiaokuHandoff(userText) : false);
    const emotionalContext = hasEmotionalContext(userText);
    const adminIntents: AdminIntentType[] = adminIntentResult.matchedIntents;

    // ---- P1.8 H3：事实型行政问题小酷直答 ----
    // 地址/电话/微信/工作时间/收费/公众号 由小酷直答，不转小雪
    const FACTUAL_ADMIN_PATTERNS = [
      { type: 'booking', pattern: /预约|帮我约|约个?.{0,4}(?:咨询|心理师|咨询师)|怎么.{0,8}(?:咨询|约)/i, response: '拨打 15001930070 就能预约到 QM 的咨询师，这一步也可以请信任的人帮你拨。\n\n如果你还想聊聊此刻的感受，随时告诉我。' },
      { type: 'address', pattern: /地址|在哪|怎么走|到你们|民立路|静安/i, response: '我们的地址是：上海市静安区民立路150号二座3201。\n\n如果需要预约咨询，可以找小雪帮你确认具体的时间和安排。' },
      { type: 'phone', pattern: /电话|联系方式|手机号|打.*电话|热线|怎么联系|联系电话/i, response: '我们的联系方式在这里，全都在了：\n\n📞 **12356**（全国心理援助热线，7×24 小时）\n📞 **15001930070**（QM 心理援助热线，24 小时）\n📞 **13601658763**（QM 备用热线，24 小时）\n📞 **12355**（青少年服务台，青少年专线）\n\n如果你不方便打电话，也文字说不出口的时候。\n\n如果需要预约咨询，可以找小雪帮你确认具体的时间和安排。' },

      { type: 'hours', pattern: /工作时间|营业时间|几点.*开门|几点.*关门|上班.*时间|办公.*时间|什么时候.*在线|服务.*时间|几点到几点|几点上班|几点下班|几点营业|几点.*上班|几点.*下班|几点.*联系|什么时候上班|什么时候下班|现在能咨询吗|现在方便吗|现在有人值班|值班时间|有人(?:在|值班)吗|几点在线|几点在/i, response: '我们的服务时间：\n- 📞 12356（全国心理援助热线）：全年无休，7×24 小时\n- 📞 15001930070 / 13601658763（QM 热线）：24 小时\n- 💬 微信人工客服（qm_kw_gone）：每日 12:00–24:00\n\n如果需要预约咨询，可以找小雪帮你确认具体的时间和安排。' },
      { type: 'pricing', pattern: /多少钱|怎么收费|费用|价格|收费标准|价位|贵不贵|收费.*多少/i, response: '我们的收费方式：\n- 个体咨询：400–1500 元共 8 档，每次 60 分钟\n- 具体收费根据心理师资历和咨询类型有所不同\n\n如果需要了解详细价格或预约咨询，可以找小雪帮你确认。' },
      { type: 'public_account', pattern: /公众号|微信.*公众|关注.*号|QM酷儿/i, response: '我们的公众号是：**QM酷儿心理**\n\n你可以在微信搜索关注，获取更多心理科普和资源信息。\n\n如果需要预约咨询，可以找小雪帮你确认具体的时间和安排。' },
    ];
    
    // ---- BatchA P1 (20260917): 价格守门（语序无关共现）——fast-path 分流前拦截 ----
    // 命中即走「不报价转微信」引导（复用 wechat 直答话术原文），不再落入 pricing 直答报价。
    if (detectPriceIntent(userText)) {
      console.info('[QM:XIAOKU] Price gate hit -> wechat guide (no pricing fast-path)', { sessionId });
      const priceEncoder = new TextEncoder();
      const priceStream = new ReadableStream({
        start(controller) {
          let index = 0;
          const response = PRICE_GATE_REPLY;
          const interval = setInterval(() => {
            if (index < response.length) {
              const chunkSize = safeChunkSize(response, index);
              controller.enqueue(
                priceEncoder.encode(
                  `data: ${JSON.stringify({
                    content: response.slice(index, index + chunkSize),
                    isCrisis: false,
                    isPriceGate: true,
                  })}\n\n`,
                ),
              );
              index += chunkSize;
            } else {
              controller.enqueue(priceEncoder.encode("data: [DONE]\n\n"));
              clearInterval(interval);
              controller.close();
            }
          }, 20);
        },
      });
      return new Response(priceStream, {
        headers: buildQmHeaders({
          "Content-Type": "text/event-stream",
          "Transfer-Encoding": "chunked",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        }),
      });
    }

    const factualAdminHit = FACTUAL_ADMIN_PATTERNS.find(p => p.pattern.test(userText));
    // ---- [T1-FIX 20260916] 首轮实质倾诉判定（闸1 菜单豁免 / 闸2 热线墙豁免 共用）----
    // 首句含具体事件/负向情绪/身份倾诉时，不走固定模板（Q3 菜单 / phone 热线墙），放行 LLM 主链路（复述/共情三件套可生效）；
    // 纯空泛开场（短问候/纯报名字）与纯行政询问行为完全不变。词表保守：单字「打/骂」不收（防「打电话」类误伤），危机词收全（放行后上游危机检测仍先手）。
    const isFirstUserTurn = messages.filter((m) => m.role === "user").length === 1;
    const firstPersonConfide = isFirstUserTurn && /(我|自己)/.test(userText);
    const distressOrIdentityHit = firstPersonConfide && /(难受|难过|痛苦|崩溃|绝望|害怕|恐惧|焦虑|抑郁|孤独|孤立|无助|委屈|羞耻|迷茫|煎熬|撑不下去|喘不过气|失眠|噩梦|想死|不想活|活不下去|自杀|自残|想哭|哭了|大哭|眼泪|被打|挨打|打我|被骂|骂我|挨骂|辱骂|羞辱|家暴|冷暴力|吵架|冷战|赶出来|断绝关系|不接电话|不理我|不回消息|失联|霸凌|欺凌|排挤|歧视|讨厌我|看不起|背叛|出柜|分手|失恋|离婚|暗恋|告白|辞退|开除|失业|裁员|辞职|考砸|挂科|跨性别|性少数|酷儿|非二元|性别认同|性取向|顺性别|变性)/i.test(userText);
    const longConfideNoAsk = firstPersonConfide && userText.length >= 14 && !(/(请问|帮我|帮忙|麻烦|问一下|问下|咨询|预约|多少|号码|微信号|公众号)/i.test(userText));
    const firstTurnSubstantive = distressOrIdentityHit || longConfideNoAsk;
    // P1.10 J3：hours/phone 是纯行政事实，hasEmotionalContext 会把「工作时间」等问法里的"工作"误判为情绪
    // 导致漏答转推诿——这类必经直答。危机检测已在上游（isCrisis）先行拦截，无诊断风险，故豁免。
    const factualAdminMustAnswer = factualAdminHit && (factualAdminHit.type === 'hours' || factualAdminHit.type === 'phone');
    // P0FIX-F3 二轮：phone 类直答加情绪语境门——被拉黑/删联系方式/分手失联等语境不得再直答联系方式墙，放行主链路共情
    const phoneContextBlocked = /不用给我|不用发我|不用联系|不想接|不想打|不想联系|别给我|别联系|拉黑|删了|删除|删掉|没了|联系不上|失联|找不到|屏蔽|断联|分手|失恋|分了|前女友|前男友|前对象|拒绝接听|不接电话/.test(userText);
    if (factualAdminHit && (factualAdminMustAnswer || !hasEmotionalContext(userText)) && !(factualAdminHit.type === 'phone' && firstTurnSubstantive) && !(factualAdminHit.type === 'phone' && phoneContextBlocked)) {
      console.info('[QM:XIAOKU] Factual admin question direct answer', { sessionId, type: factualAdminHit.type });
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          let index = 0;
          const response = factualAdminHit.response;
          const interval = setInterval(() => {
            if (index < response.length) {
              const chunkSize = safeChunkSize(response, index);
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    content: response.slice(index, index + chunkSize),
                    isCrisis: false,
                    isFactualAdmin: true,
                  })}\n\n`,
                ),
              );
              index += chunkSize;
            } else {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              clearInterval(interval);
              controller.close();
            }
          }, 20);
        },
      });
      return new Response(stream, {
        headers: buildQmHeaders({
          "Content-Type": "text/event-stream",
          "Transfer-Encoding": "chunked",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        }),
      });
    }

    trace.roleGovernance = {
      adminIntentDetected: adminIntentResult.isAdminIntent,
      adminHandoffRequired,
      emotionalContext,
      matchedIntents: adminIntents,
    };

    // ---- P18-2 + P0-4: Onboarding 状态机（代码层强制）----
    // 开场菜单/代词询问（Q3 用途题）只允许在"会话第一句用户消息"时触发。
    // P0-4 修复：一旦出现过 >1 条用户消息即视为已有对话历史，严禁中途失忆重弹开场/代词询问。
    const userMessagesCount = messages.filter((m) => m.role === "user").length;
    const isOnboardingSession = userMessagesCount === 1;
    const isQ1Answer = /(?:我叫|我是|称呼我|叫我|我的名字|她\/her|他\/him|TA|代词|性别|跨性别|非二元|女性|男性)/i.test(userText);
    // [T1-FIX 20260916] 闸1：首轮实质倾诉豁免——含具体事件/负向情绪/身份倾诉的首句不再被 Q3 菜单模板劫持，放行 LLM 主链路；仅纯空泛开场保留菜单（isQ1Answer 命中但无实质倾诉）
    const shouldForceQ3 = isOnboardingSession && isQ1Answer && !firstTurnSubstantive;
    
    if (shouldForceQ3) {
      console.info('[QM:XIAOKU] Onboarding: forcing Q3 output', { sessionId, messageCount: messages.length });
      // 强制输出 Q3 用途题
      const q3Response = `很高兴认识你！记住啦，我会用你喜欢的代词来称呼你。

先随便了解一下，方便我用更合适的方式陪你——你今天主要是想：
• 聊聊自己的事（情绪、关系、自我探索）
• 帮亲友了解一些情况（家人、朋友、伴侣）
• 工作/学习上的专业交流（比如心理相关的个案、理论、工具）
• 都有，先聊聊看

选哪个都不影响，之后随时可以换话题。`;
      
      const encoder = new TextEncoder();
      const sanitizedQ3 = sanitizeReply(q3Response, sessionId);
      const stream = new ReadableStream({
        start(controller) {
          let index = 0;
          const interval = setInterval(() => {
            if (index < sanitizedQ3.length) {
              const chunkSize = safeChunkSize(sanitizedQ3, index);
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    content: sanitizedQ3.slice(index, index + chunkSize),
                    isCrisis: false,
                  })}\n\n`,
                ),
              );
              index += chunkSize;
            } else {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              clearInterval(interval);
              controller.close();
            }
          }, 20);
        },
      });
      
      return new Response(stream, {
        headers: buildQmHeaders({
          "Content-Type": "text/event-stream",
          "Transfer-Encoding": "chunked",
          "Cache-Control": "no-cache",
          Connection: "keep-along",
        }),
      });
    }

    // ---- v11.5: 资源检索（树洞/心理功能正常保留）----
    const assistantHistory = extractAssistantHistory(messages);
    const retrievalResult = lastUserMessage
      ? retrieveResources(lastUserMessage.content, "xiaoku", assistantHistory)
      : { resources: [], caseEvidence: [], retrievalMeta: { totalCandidates: 0, filteredByRole: 0, filteredByFrequency: 0, crisisBlocked: false, highEmotionBlocked: false } };

    const resourceBlock = formatResourcesForPrompt(retrievalResult.resources);
    console.info("[QM:XIAOKU] resource retrieval", {
      sessionId: sessionId || "unknown",
      resourceCount: retrievalResult.resources.length,
      ...retrievalResult.retrievalMeta,
    });

    const resourceRejected = (() => {
      const recentUserMsgs = messages.filter((m) => m.role === "user").slice(-3);
      return recentUserMsgs.some((m) =>
        /不用了|不需要|别推荐|不要推荐|不想看|不感兴趣|别说这些|跳过/.test(m.content),
      );
    })();

    const previousResponse = assistantHistory.length > 0
      ? assistantHistory[assistantHistory.length - 1]
      : undefined;

    // ---- v13.2: 树洞上下文处理（树洞只给小酷，不受角色治理影响）----
    const treehole = sanitizeTreeholeContext(clientContext?.treehole);
    const recentConversation = getRecentConversationText(messages, 6);
    const injectTreehole = treehole.available && shouldInjectTreehole(userText, recentConversation);

    trace.treehole = {
      received: Boolean(clientContext?.treehole),
      entryCount: treehole.entries.length,
      injected: injectTreehole,
    };

    const treeholeBlock = injectTreehole ? formatTreeholeContext(treehole) : "";

    // ---- v13.17: 知识库本地检索（14个MD文件，53MB专业内容）----
    let knowledgeBlock = "";
    try {
      const kbResults = searchKnowledge(userText, 5, 4000);
      logPerf("kb_search_done");
      knowledgeBlock = formatKnowledgeForPrompt(kbResults);
      console.info("[QM:XIAOKU] knowledge base search", {
        sessionId: sessionId || "unknown",
        hits: kbResults.length,
        totalChars: kbResults.reduce((s, r) => s + r.text.length, 0),
        topScore: kbResults[0]?.score || 0,
        topFile: kbResults[0]?.file?.slice(0, 40) || "none",
        kbStatus: getKbStatus(),
      });
    } catch (kbError) {
      console.error("[QM:XIAOKU] knowledge search failed (non-fatal):", kbError);
    }

    // ---- v13.18.0 + v13.0: 实时联网检索 + 认知运行层并行执行（P1.7 F2）----
    let realtimeBlock = "";
    let cognitiveBlock = "";
    let cognitiveContext = null;
    
    // P1.7 F2：并行执行实时检索和认知层，减少首字前串行等待
    const searchDecision = shouldSearch(userText, messages);
    const detected = detectRelevantPacks(userText);
    
    const parallelTasks: Promise<void>[] = [];

    // 任务0：实时联网检索（非阻塞预算，绝不拖住首帧/ack）
    // P1.7 速度回归修复：原实现把 realtime 塞进 parallelTasks，受限环境联网挂起 10s，
    // 使 await Promise.all 阻塞到 headers 之后，ack 帧被整体推后。改为给出 1500ms 预算，
    // 超时即弃用 realtimeBlock（空），主流程 1.5s 内放行，联网结果有则注入、无则跳过。
    if (searchDecision.shouldSearch) {
      const realtimeBudget = 800;
      const realtimeTask = cachedSearch(searchDecision.query, {
        freshnessRequired: searchDecision.freshnessRequired,
        intent: searchDecision.intent,
      })
        .then((realtime) => {
          realtimeBlock = formatRealtimeResults(
            realtime.results,
            searchDecision.query,
            realtime.searchedAt,
            {
              freshnessRequired: searchDecision.freshnessRequired,
              intent: searchDecision.intent,
              verification: realtime.verification,
            },
          );
          console.info("[QM:XIAOKU] realtime search", {
            query: searchDecision.query,
            reason: searchDecision.reason,
            freshnessRequired: searchDecision.freshnessRequired,
            intent: searchDecision.intent,
            resultCount: realtime.results.length,
            cacheHit: realtime.cacheHit,
            durationMs: realtime.durationMs,
          });
        })
        .catch((realtimeError) => {
          console.error("[QM:XIAOKU] realtime search failed (non-fatal):", realtimeError);
        });
      parallelTasks.push(
        new Promise<void>((resolve) => {
          const timer = setTimeout(() => {
            if (realtimeBlock === "") {
              console.warn("[QM:XIAOKU] realtime search over budget, dropped");
            }
            resolve();
          }, realtimeBudget);
          realtimeTask.then(() => {
            clearTimeout(timer);
            resolve();
          });
        }),
      );
    }
    
    // 任务2：认知运行层
    if (detected.packs.length > 0) {
      const recentHistory = messages
        .filter((m) => m.role !== "system")
        .slice(-6)
        .map((m) => m.content);
      parallelTasks.push(
        runCognitivePipeline({
          userText,
          history: recentHistory,
          detectedPacks: detected.packs,
          role: "xiaoku",
          languagePreference: detected.languagePreference,
        }).then((cognitiveResult) => {
          cognitiveBlock = cognitiveResult.promptBlock;
          cognitiveContext = cognitiveResult.context;
          console.info("[QM:XIAOKU] cognitive pipeline", {
            packs: detected.packs,
            lenses: cognitiveResult.relevantLenses.length,
            cases: cognitiveResult.retrievedCases.length,
            warnings: cognitiveResult.verifierWarnings.length,
          });
        }).catch((cogError) => {
          console.error("[QM:XIAOKU] cognitive pipeline failed (non-fatal):", cogError);
        })
      );
    }
    
    // 等待所有并行任务完成
    logPerf("tasks_launched");
    await Promise.all(parallelTasks);
    logPerf("parallel_tasks_done");

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new LLMClient(config, customHeaders);
    logPerf("llm_client_ready");

    // ---- v12.0.0: SP构建顺序 ----
    // 1. GLOBAL_ROLE_GOVERNANCE_SP（最高优先级，在所有内容之前）
    // 2. 小酷基础SP
    // 3. 小酷策略段
    // 4. 资源/树洞等上下文
    // 5. 如果行政意图命中：注入强制分流指令
    const fullSp = loadSystemPrompt();
    const { base: systemPrompt, lazy: lazyBlocks } = splitLazyFromSp(fullSp);

    const systemParts: string[] = [
      GLOBAL_ROLE_GOVERNANCE_SP,
      XIAOKU_POLICY_SP,
      systemPrompt,
    ];

    if (resourceBlock) systemParts.push(resourceBlock);
    if (treeholeBlock) systemParts.push(treeholeBlock);
    if (factBlock) systemParts.push(factBlock);  // F1: 事实检索（知识库之前）
    if (knowledgeBlock) systemParts.push(knowledgeBlock);
    if (realtimeBlock) systemParts.push(realtimeBlock);
    if (cognitiveBlock) systemParts.push(cognitiveBlock);

    // E-2 B 知识惰性注入：惰性块从 base 剔除，仅保守白名单命中时注回（核心前置不减配）
    const userMessageCount = messages.filter((m) => m.role === "user").length;
    const lazyCtx = injectLazyBlocks(
      messages.filter((m) => m.role === "user").map((m) => (m.content as string) || ""),
      lazyBlocks,
      { firstTurn: userMessageCount <= 1 }
    );
    if (lazyCtx.blocks.length) systemParts.push(lazyCtx.blocks.join("\n\n"));

    // ===== SP-ACAD-PRO-L2 专业层接线（P1 · WIRED_UNVERIFIED，纯本地零每轮 LLM）=====
    // 危机先行在前（isCrisis 直接返回模板），此处仅在非危机路径做 Pro 判定；物理隔离，不触碰 General。
    const proClassify = classifyPro(userText);
    if (proClassify.isPro) {
      try {
        const proHits = searchPro(userText, 3);
        const proBlock = buildProBlock({
          classify: proClassify,
          hits: proHits,
          query: userText,
        });
        if (proBlock) systemParts.push(proBlock);
      } catch (e) {
        console.warn("[QM Pro] pro block build failed:", e);
      }
    }

    // F1: fail-closed 兜底话术
    if (factFallbackRequired) {
      systemParts.push(`
<fact_fallback>
你当前只能使用以下统一兜底话术回答，禁止自由发挥、禁止编造流程/时间/收费/电话/地址：
${getFactFallbackMessage()}
</fact_fallback>`);
    }

    // v12.0.0: 如果检测到行政意图，注入强制分流指令
    if (adminHandoffRequired) {
      const handoffInstruction = [
        "<role_governance_handoff v14.0>",
        "  <trigger>用户消息包含行政预约意图</trigger>",
        `  <detected_intents>${adminIntents.join(", ")}</detected_intents>`,
        `  <emotional_context>${emotionalContext ? "yes" : "no"}</emotional_context>`,
        "  <instruction>",
        "    这是行政需求。你不得回答任何行政内容（费用/地址/时间/预约/心理师/到访/支付）。",
        "    即使你知道verified事实也不能说。你必须用承接式话术引导切换到小雪。",
        "    分流≠甩人：如果用户同时表达了情绪，先短承接1-2句，再转行政给小雪。",
        "  </instruction>",
        "  <correct_handoff_template>",
        emotionalContext
          ? "我听到你说的这些了，[短承接情绪1-2句]这部分我们可以之后继续聊。\\n\\n不过你问到的[行政事项]已经是预约和行政这边的问题了，我不替小雪做决定，免得把时间、费用或到访安排说错。你可以点「切换到小雪」，她会接着帮你理清。等你把行政的事情处理好，回来找我继续聊就好。"
          : "这个已经是预约和行政这边的问题了，我不替小雪做决定，免得把时间、费用或到访安排说错。你可以点「切换到小雪」，她会帮你理清。如果你之后想聊心理方面的事情，随时回来找我就好。",
        "  </correct_handoff_template>",
        "  <forbidden>",
        "    - 不得说'你去问小雪'这种生硬话术",
        "    - 不得回答费用数字/地址/工作时间",
        "    - 不得邀请到店/预留时间/确认预约",
        "    - 不得整段都转走而忽略用户的情绪表达",
        "  </forbidden>",
        "</role_governance_handoff>",
      ].join("\n");
      systemParts.push(handoffInstruction);
    }

    const fullMessages: Message[] = [
      {
        role: "system",
        content: systemParts.join("\n\n"),
      },
      ...sanitizeMessagesForSdk(messages),
    ];

    const stream = client.stream(fullMessages, {
      model: "doubao-seed-2-0-pro-260215",
      temperature: 0.8,
    });
    trace.llmModel = "doubao-seed-2-0-pro-260215";

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          let fullOutput = "";
          let blockTriggered = false;
          // P1.7 F3：模型调用硬超时 45s
          const LLM_TIMEOUT_MS = 45000;
          const startTime = Date.now();
          let firstChunkSent = false;

          // P1.7 F4：超长输入即时反馈 - 在 LLM 流开始前注入 ack 帧
          if (isLongInput) {
            const ackMsg = "你写了很长一段，我在认真看完，稍等我一下～\n\n（如果以后想让我回得更快，也可以分几段发给我哦）";
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ content: ackMsg, isCrisis: false, isAck: true })}\n\n`,
              ),
            );
            firstChunkSent = true;
          }

          // F7：低落输入模板秒级 ack，再由模型流式续写（不再整段模板旁路绕 SP）
          if (lowAckActive) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ content: "嗯，我在呢，你慢慢说。", isCrisis: false, crisisLevel: "low", isAck: true })}\n\n`,
              ),
            );
            firstChunkSent = true;
            logPerf("ack_low_sent");
          }

          // F3 兜底：模型完全卡死（for await 无法进入超时检查）时，由外部 timer 强制断流防永久转圈
          let hardClosed = false;
          const hardTimer = setTimeout(() => {
            if (hardClosed) return;
            hardClosed = true;
            try {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ content: "\n\n刚刚好像卡住了，没能继续聊下去。你可以再说一次，我换种方式回你。", isCrisis: false, isTimeout: true })}\n\n`,
                ),
              );
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
            } catch {}
          }, LLM_TIMEOUT_MS);

          // ---- v13.1: 流式输出（仅做 REWRITE 替换，不做中途 BLOCK 检测）----
          for await (const chunk of stream) {
            // P1.7 F3：检查超时
            if (Date.now() - startTime > LLM_TIMEOUT_MS) {
              console.warn("[QM:XIAOKU] LLM timeout triggered", { 
                sessionId, 
                elapsedMs: Date.now() - startTime,
                outputLength: fullOutput.length 
              });
              if (!firstChunkSent) {
                // 未开始流式，输出降级话术
                const fallbackMsg = "刚刚网络打了个盹，我没能完整收到你的话。可以再发一次，或把内容分成几段发给我。";
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ content: fallbackMsg, isCrisis: false, isTimeout: true })}\n\n`,
                  ),
                );
              } else {
                // 已开始流式，推收尾事件
                const fallbackMsg = "\n\n刚刚网络打了个盹，后面的内容我没收到。可以再发一次，或把内容分成几段发给我。";
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ content: fallbackMsg, isCrisis: false, isTimeout: true })}\n\n`,
                  ),
                );
              }
              hardClosed = true;
              if (hardTimer) clearTimeout(hardTimer);
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
              return;
            }
            
            if (blockTriggered) break;
            if (!chunk.content) continue;

            firstChunkSent = true;
            logPerf("llm_first_token");
            const content = chunk.content.toString();
            // P0-A (20260916): SDK full-summary tail frame interception.
            // Upstream occasionally resends accumulated full text as the last chunk on long
            // replies; letting it through stacks 2-3 copies over the incremental stream
            // (field evidence: 913x2 / 2072x3). Drop it when detected.
            if (
              fullOutput.length > 60 &&
              content.length >= 60 &&
              content.length >= fullOutput.length * 0.7 &&
              fullOutput.includes(content.slice(0, 40)) &&
              fullOutput.includes(content.slice(-40))
            ) {
              console.warn("[QM:P0A] sdk full-summary tail frame dropped", {
                sessionId: sessionId || "unknown",
                chunkLen: content.length,
                accLen: fullOutput.length,
              });
              continue;
            }
            // P0-FIX3 (20260917): upstream rewrite/multi-draft interception.
            // Field evidence (F02/F06 deterministic hits, F04 3-pass degradation on bd0467d):
            // on long replies the upstream LLM occasionally emits a SECOND DRAFT of the same
            // reply (progressively degraded: markdown stripped, newlines collapsed, question
            // marks lost, opening parroting the user's words). Chunk-level passthrough then
            // stacks 2-3 copies. Detect: if most 60-char windows of this chunk already exist
            // verbatim in fullOutput, it is a replay of already-sent content -> drop it.
            // (Pure incremental chunks never match; accumulation <300 chars unaffected.)
            if (fullOutput.length > 300 && content.length >= 40) {
              let guardHit = 0;
              let guardTot = 0;
              for (let gx = 0; gx + 60 <= content.length; gx += 60) {
                guardTot++;
                if (fullOutput.includes(content.slice(gx, gx + 60))) guardHit++;
              }
              if (guardTot > 0 && guardHit / guardTot >= 0.7) {
                console.warn("[QM:P0FIX3] upstream rewrite chunk dropped", {
                  sessionId: sessionId || "unknown",
                  chunkLen: content.length,
                  accLen: fullOutput.length,
                  overlap: guardHit / guardTot,
                });
                continue;
              }
            }
            // ---- [QM:P0FIX4 20260917] shingle containment guard: catches PARAPHRASED upstream
      // second drafts. P0FIX3 verbatim-window (70%) misses same-meaning reworded replays;
      // normalized 8-char shingle containment vs accumulation tail. Crisis short-circuit
      // (fixed-script pseudo-stream) never reaches this loop, so crisis path is untouched.
      if (fullOutput.length > 300 && content.length >= 40) {
        const ratio4 = qmShingleRatio(content, fullOutput.slice(-2000));
        if (ratio4 >= 0.55) {
          console.warn("[QM:P0FIX4] paraphrased replay chunk dropped", { ratio: Number(ratio4.toFixed(3)), accLen: fullOutput.length });
          continue;
        }
      }
      fullOutput += content;

            // REWRITE 级别替换逐 chunk 执行（姓名/版本号脱敏）
            let rewrittenContent = rewriteChunk(content);
            // P18-5: 内部路径泄露硬过滤（逐 chunk 过滤）
            rewrittenContent = sanitizeReply(rewrittenContent, sessionId);
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ content: rewrittenContent, isCrisis: false })}\n\n`,
              ),
            );
          }

          // ---- v12.0.0: 角色治理 G001-G008 审核（在所有其他审核之前）----
          if (!blockTriggered && fullOutput.trim().length > 0 && adminHandoffRequired) {
            const roleResult = verifyRoleOutput(fullOutput, "xiaoku", {
              userMessage: userText,
              adminIntentDetected: adminHandoffRequired,
              adminIntents,
            });

            if (!roleResult.pass) {
              console.warn("[QM:XIAOKU] Role governance P0 violation, retrying", {
                sessionId: sessionId || "unknown",
                violations: roleResult.p0Violations.map((v) => `${v.ruleId}: ${v.matchedText}`),
              });

              try {
                const retryWarning = buildRetryWarning("xiaoku", roleResult.p0Violations);
                const retryMessages: Message[] = [
                  ...fullMessages,
                  { role: "system", content: retryWarning },
                ];

                const retryStream = client.stream(retryMessages, {
                  model: "doubao-seed-2-0-pro-260215",
                  temperature: 0.7,
                });

                let retryOutput = "";
                for await (const chunk of retryStream) {
                  if (!chunk.content) continue;
                  retryOutput += chunk.content.toString();
                  // [A2 20260917] retry 通道回放闸摘除（P0FIX5 的逐字+55% shingle 闸）：
                  // retry 为整段替换式再生成，合法重试答案与前稿天然高重叠，闸会过杀导致
                  // retryOutput 枯竭→兜底。质量由共享缓冲+流末闸接管（P0FIX6 已覆盖其原本目的）。

                }

                const retryRoleResult = verifyRoleOutput(retryOutput, "xiaoku", {
                  userMessage: userText,
                  adminIntentDetected: adminHandoffRequired,
                  adminIntents,
                });

                if (!retryRoleResult.pass) {
                  // 重试仍违规，用安全模板替换
                  blockTriggered = true;
                  const safetyText = getXiaokuSafetyTemplate(adminIntents);
                  console.warn("[QM:XIAOKU] Role governance retry still failed, using safety template", {
                    sessionId: sessionId || "unknown",
                    retryViolations: retryRoleResult.p0Violations.map((v) => v.ruleId),
                  });
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({
                        content: "\n\n" + safetyText,
                        isCrisis: false,
                        isFirewallBlock: true,
                        firewallReason: "role_governance_safety_replace",
                        roleViolations: retryRoleResult.p0Violations.map((v) => v.ruleId),
                        replaceOutput: true,
                      })}\n\n`,
                    ),
                  );
                } else {
                  // 重试通过，发送替换
                  console.info("[QM:XIAOKU] Role governance retry passed", {
                    sessionId: sessionId || "unknown",
                  });
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({
                        content: "\n\n" + qmCollapseReplay(retryOutput),
                        replaceOutput: true,
                      })}\n\n`,
                    ),
                  );
                  fullOutput = retryOutput;
                }
              } catch (retryError) {
                console.error("[QM:XIAOKU] Role governance retry error", {
                  sessionId: sessionId || "unknown",
                  error: String(retryError),
                });
                blockTriggered = true;
                const safetyText = getXiaokuSafetyTemplate(adminIntents);
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      content: "\n\n" + safetyText,
                      isCrisis: false,
                      isFirewallBlock: true,
                      firewallReason: "role_governance_retry_error",
                      replaceOutput: true,
                    })}\n\n`,
                  ),
                );
              }
            } else {
              // P0通过，记录P1
              if (roleResult.p1Violations.length > 0) {
                console.info("[QM:XIAOKU] Role governance P1 warnings", {
                  sessionId: sessionId || "unknown",
                  p1: roleResult.p1Violations.map((v) => v.ruleId),
                });
              }
            }
          }

          // ---- P0-3：流结束后内部痕迹剥离（思维链/草稿/自我修正指令/重复成稿）----

          // ---- P0FIX6 (20260917): post-gate chain single-frame coalescing ----
          // 各闸改为内部改写共享缓冲，流末统一 emit 一个最终成品帧（replaceOutput）。
          // 危机卡/热线/固定话术帧（low_mood_hotline_demote、hotline card、verifier fallback、
          // output_scan_block、role_governance）不经过本缓冲，原样直发。
          const qmFinalFrame = { content: "", reason: "", used: false };
          const qmChainWrite = (content: string, reason: string) => {
            qmFinalFrame.content = content;
            qmFinalFrame.reason = reason;
            qmFinalFrame.used = true;
            console.warn(`[QM:P0FIX6] chain write ${reason}, len=${content.length}`);
          };
          // 命中则用唯一最终稿替换已流式输出的脏内容（replaceOutput 帧），不引入首字节延迟。
          if (!blockTriggered && fullOutput.trim().length > 0) {
          // ---- P0-A (20260916): post-stream whole-segment repeat dedup gate ----
          // Deterministic defense against SDK tail-frame / upstream replay leftovers.
          // Runs before strip/sanitize so duplicated text cannot skew later gates.
          if (!blockTriggered && fullOutput.trim().length > 0) {
            const deduped = dedupeRepeats(fullOutput);
            if (deduped !== fullOutput) {
              console.warn(`[QM Firewall] post-stream repeat dedup, traceId=${traceId}, chars=${fullOutput.length}->${deduped.length}`);
              fullOutput = deduped;
              qmChainWrite(deduped, "repeat_dedup");
            }
          }
            const stripped = stripInternalTraces(fullOutput);
            if (stripped !== fullOutput) {
              console.warn(
                `[QM Firewall] internal-trace striped (post-stream), traceId=${traceId}, chars=${fullOutput.length}->${stripped.length}`,
              );
              fullOutput = stripped;
              qmChainWrite(stripped, "internal_trace_strip");
            }
          }

          // ---- P1.5 工单 C：流结束后终态兜底过滤（防 SSE 分片切词漏网）----
          if (!blockTriggered && fullOutput.trim().length > 0) {
            const finalSanitized = sanitizeReply(fullOutput, sessionId);
            if (finalSanitized !== fullOutput) {
              console.warn(
                `[QM Firewall] post-stream sanitize gate triggered, traceId=${traceId}`,
              );
              fullOutput = finalSanitized;
              qmChainWrite(finalSanitized, "post_stream_sanitize");
            }
          }

          // P0-FIX2 (20260916): post-sanitize re-dedupe. sanitizeReply collapses
          // href variants, which can make formerly-distinct duplicate segments
          // byte-equal AFTER the pre-sanitize dedupeRepeats ran (charSim miss).
          // Re-run on the sanitized buffer so no replaceOutput frame ships
          // duplicated bodies (case F02/F06 root closure).
          if (!blockTriggered && fullOutput.trim().length > 0) {
            const rededuped = dedupeRepeats(fullOutput);
            if (rededuped !== fullOutput) {
              console.warn(`[QM Firewall] post-sanitize repeat dedup, traceId=${traceId}, chars=${fullOutput.length}->${rededuped.length}`);
              fullOutput = rededuped;
              qmChainWrite(rededuped, "post_sanitize_repeat_dedup");
            }
          }

          // ---- 四处增量二：普通低落/倾诉 ≠ 危机 · 出站危机专号降级兜底（P0 · 2026-09-14）----
          // 生产实测 N07"被催婚手抖"、N10"和妈吵架"——isCrisis=false 却被 LLM 甩全套联系方式卡。
          // 治本在 SP（模块4.2.1），此处为确定性出站兜底：仅非危机正常流、且用户为普通低落/倾诉时，
          // 把输出中的危机专用热线（15001930070/13601658763）降级剥离，保留 12356。
          // 危机会话走上游 isCrisis 分支 return 模板，不经此处；本块也不生产任何危机卡。
          if (!blockTriggered && fullOutput.trim().length > 0) {
            const refRef = demoteCrisisHotlineForLowMood(
              fullOutput,
              lastUserMessage?.content || "",
            );
            if (refRef.isLowMood && refRef.demoted) {
              console.warn(
                `[QM LowMood] crisis-dedicated hotline demoted for low-mood reply, traceId=${traceId}`,
              );
              fullOutput = refRef.text;
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    content: refRef.text,
                    isFirewallBlock: true,
                    firewallReason: "low_mood_hotline_demote",
                    replaceOutput: true,
                  })}\n\n`,
                ),
              );
            } else if (refRef.isLowMood) {
              // 低落在位但无需降级（未含危机专号）：探活日志记录，便于回归观测
              console.debug(
                `[QM LowMood] low-mood flagged (no demote) traceId=${traceId}`,
              );
            }
          }

          // ---- P1.8 H1：热线补齐（P0 长文本工单 · 仅"用户主动求助"时补全）----
          // 热线只在两类回复出现：①isCrisis=true 危机回复（由上游危机路径生成并带全热线卡）；
          // ②用户主动询问求助渠道。其余（含中性问题、长倾诉、开心分享）一律禁止自动拼接热线。
          // 本块只做"求助时补齐全卡"，不做无条件尾部拼接，避免中性回复被误挂热线。
          if (!blockTriggered && fullOutput.trim().length > 0) {
            const userAsk = (lastUserMessage?.content || "").toLowerCase();
            const userSeekingHelp = HELP_CHANNEL_REQUEST.test(userAsk);
            const hasWechatGuidance = /qm_kw_gone/i.test(fullOutput);
            // 与下方 hotlineCard 对齐（危机卡本身即三号齐全，含即跳过，避免危机求助被重复补挂）
            const HOTLINE_NUMBERS = ['12356', '15001930070', '13601658763'];
            const hasAnyHotline = HOTLINE_NUMBERS.some((num) => fullOutput.includes(num));
            const hasAllHotlines = HOTLINE_NUMBERS.every((num) => fullOutput.includes(num));


            if (userSeekingHelp && hasAnyHotline && (!hasAllHotlines || !hasWechatGuidance)) {
              console.warn(
                `[QM Hotline] help-request reply missing hotline card, auto-appending, traceId=${traceId}`,
                { has12356: fullOutput.includes('12356'), hasQM1: fullOutput.includes('15001930070'), hasQM2: fullOutput.includes('13601658763'), hasWechat: hasWechatGuidance },
              );
              const hotlineCard =
                '\n\n---\n📞 你需要帮助时，这些渠道随时都在：\n- 📞 12356（全国心理援助热线，7×24 小时）\n- 📞 15001930070（QM 24 小时危机热线）\n- 📞 13601658763（QM 备用热线，24 小时）\n（若当下有立即危险，请同时拨打 110 或 120）\n\n也可添文字说不出口的时候。';
              fullOutput += hotlineCard;
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    content: hotlineCard,
                    isFirewallBlock: false,
                    isHotlineAppend: true,
                  })}\n\n`,
                ),
              );
            }
          }

          // ---- v1.9i: 流结束后法定真名/敏感信息闸门（防 chunk 切词漏网）----
          if (!blockTriggered && fullOutput.trim().length > 0) {
            const maskedOutput = maskLegalNames(fullOutput);
            if (maskedOutput !== fullOutput) {
              console.warn(
                `[QM Firewall] legal-name gate triggered (post-stream), traceId=${traceId}`,
              );
              fullOutput = maskedOutput;
              qmChainWrite(maskedOutput, "legal_name_mask");
            }
          }

          // ---- v13.1: 流结束后内部防火墙 BLOCK 扫描 ----
          if (!blockTriggered && fullOutput.trim().length > 0) {
            const scanResult = scanOutput(fullOutput);
            if (scanResult.action === "BLOCK") {
              blockTriggered = true;
              console.warn(
                `[QM Firewall] Output scan BLOCK triggered (post-stream), matched=${JSON.stringify(scanResult.matched)}`,
              );
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    content: "\n\n" + buildStandardRefusal(),
                    isCrisis: false,
                    isFirewallBlock: true,
                    firewallReason: "output_scan_block",
                    replaceOutput: true,
                  })}\n\n`,
                ),
              );
            }
          }

          // ---- v11.5: 流结束后运行时输出审核 ----
          if (!blockTriggered && fullOutput.trim().length > 0) {
            const verifierResult = verifyOutput({
              userMessage: lastUserMessage?.content || "",
              draft: fullOutput,
              role: "xiaoku",
              verifiedFacts: {},
              verifiedResources: retrievalResult.resources,
              crisisActive: false,
              previousResponse,
              resourceRejected,
            });

            if (!verifierResult.pass) {
              console.warn("[QM:XIAOKU] verifier blocked", {
                sessionId: sessionId || "unknown",
                violations: verifierResult.violations.map((v) => `${v.ruleId}(${v.severity})`),
                telemetryTags: verifierResult.telemetryTags,
              });
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    content: "\n\n" + (verifierResult.fallbackText || buildStandardRefusal()),
                    isCrisis: false,
                    isFirewallBlock: true,
                    firewallReason: `verifier_${verifierResult.repairAction}`,
                    verifierViolations: verifierResult.violations.map((v) => v.ruleId),
                    replaceOutput: true,
                  })}\n\n`,
                ),
              );
            } else {
              console.info("[QM:XIAOKU] verifier pass", {
                sessionId: sessionId || "unknown",
                telemetryTags: verifierResult.telemetryTags,
              });
            }
          }

          // ---- 补丁三：post_gate 硬闸（G1/G2/G3 确定性兜底）----
          // 危机/低危轮在更早分支已 return/ack，此处 fullOutput 为普通 LLM 回复。
          if (!blockTriggered && fullOutput.trim().length > 0) {
            const gateUserText = (lastUserMessage?.content || "").trim();
            const gateResult = evaluatePostGate(fullOutput, gateUserText);
            if (gateResult.gate) {
              console.warn("[QM Firewall] post_gate", {
                sessionId: sessionId || "unknown",
                gate: gateResult.gate,
                replyLen: fullOutput.length,
                userLen: gateUserText.length,
              });
              qmChainWrite(gateResult.fallback, `post_gate_${gateResult.gate}`);
            }
          }

          // ---- P0FIX6: 流末唯一最终成品帧（各闸改写合并单发）----
          if (!blockTriggered && qmFinalFrame.used) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  content: qmFinalFrame.content,
                  isFirewallBlock: true,
                  firewallReason: qmFinalFrame.reason,
                  replaceOutput: true,
                })}\n\n`,
              ),
            );
          }

          trace.outputLength = fullOutput.length;
          trace.blocked = blockTriggered;
          logPerf("stream_end");
          
          // P1.7 F9：输出分阶段耗时日志
          const perfSummary: Record<string, number> = {};
          const stages = Object.keys(perfLog);
          for (let i = 1; i < stages.length; i++) {
            const prev = stages[i - 1];
            const curr = stages[i];
            perfSummary[`${prev}_to_${curr}`] = perfLog[curr] - perfLog[prev];
          }
          console.info("[QM:XIAOKU] perf", { traceId, sessionId, ...perfSummary });
          
          hardClosed = true;
          if (hardTimer) clearTimeout(hardTimer);
          // R3.8 F-1: TTL 内非危机轮附加轻资源行（危机资源跨轮保持）
          if (qmCrisisPersistLine) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: qmCrisisPersistLine, isCrisis: false })}\n\n`));
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
          trace.streamError = String(error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: "生成响应时出现错误" })}\n\n`,
            ),
          );
          controller.close();
        } finally {
          trace.endTime = new Date().toISOString();
          console.info("[QM:XIAOKU] trace", trace);
        }
      },
    });

    const perfSeg = {
      req_to_body: (perfLog.body_parsed || 0) - (perfLog.request_received || 0),
      body_to_kb: (perfLog.kb_search_done || 0) - (perfLog.body_parsed || 0),
      kb_to_launch: (perfLog.tasks_launched || 0) - (perfLog.kb_search_done || 0),
      launch_to_parallel: (perfLog.parallel_tasks_done || 0) - (perfLog.tasks_launched || 0),
      parallel_to_client: (perfLog.llm_client_ready || 0) - (perfLog.parallel_tasks_done || 0),
      hdr_at: Date.now() - (perfLog.request_received || 0),
    };
    return new Response(sanitizedSseStream(readableStream, "xiaoku"), {
      headers: buildQmHeaders({
        "Content-Type": "text/event-stream",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
        ...(process.env.NODE_ENV !== "production"
          ? { "X-QM-Perf": JSON.stringify(perfSeg) }
          : {}),
        Connection: "keep-alive",
      }),
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({ error: "服务器内部错误，请稍后重试" }),
      {
        status: 500,
        headers: buildQmHeaders({ "Content-Type": "application/json" }),
      },
    );
  }
}
