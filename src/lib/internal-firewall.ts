/**
 * QM AI 内部信息防火墙（仅服务端使用，禁止进入客户端 bundle）
 *
 * ⚠️ 安全提示：本模块包含内部姓名映射字典与敏感模式正则，
 * 绝对禁止在 'use client' 组件或前端页面中直接 import。
 * 所有引用必须发生在服务端 API Route 或 server component 中。
 *
 * 版本：v4.0 (2026-08-25 小雪反幻觉联动修复)
 * - 移除 Susan/Christy/Candice 英文姓名脱敏（现为公开心理师：舒瑱/天岚/万从容）
 * - 保留 陈瑜倩 为内部人员脱敏
 * - scanOutput 支持可选 allowedNames 参数跳过公开姓名
 */

// ============================================================
// 一、内部姓名映射字典（仅服务端可读）
// ============================================================
export const INTERNAL_NAME_DICT: Record<string, string> = {
  陈瑜倩: "心理师B",
};

// ============================================================
// 二、BLOCK_PATTERNS：需要扫描阻断或改写的正则模式
// ============================================================
export interface BlockPattern {
  regex: RegExp;
  action: "BLOCK" | "REWRITE";
  description: string;
  rewrite?: (match: string) => string;
}

export const BLOCK_PATTERNS: BlockPattern[] = [
  // ------ BLOCK 级（直接阻断，绝不放行）------

  // CASE 编号：CASE_001 / CASE_123 / CASE_001–164 等
  {
    regex: /CASE[_-]\d+(?:[–\-~至到]\d+)?/gi,
    action: "BLOCK",
    description: "CASE编号（个案编号）",
  },
  // SUSAN_CASE_XXX 特殊格式（历史遗留，仍需阻断）
  {
    regex: /SUSAN_CASE[_-]\w+/gi,
    action: "BLOCK",
    description: "SUSAN_CASE编号",
  },
  // System Prompt / 提示词 / 权重 / 路由 / 部署包 / 知识库ID 等内部工程术语
  {
    regex: /(system\s*prompt|系统提示词?|提示词工程|模型权重|模型路由|部署包|知识库ID|知识切片|prompt\s*engineering)/gi,
    action: "BLOCK",
    description: "内部工程术语（System Prompt/提示词/权重/路由等）",
  },
  // internal_only / confidential / training_only 标记
  {
    regex: /\b(internal_only|confidential|training_only|仅供内部|内部使用)\b/gi,
    action: "BLOCK",
    description: "保密标记（internal_only/confidential/training_only）",
  },
  // 具体数量 + 个案/案例/咨询记录/會談/会谈（如"164份个案""2010+次咨询"等）
  {
    regex: /\d{2,}[+\-~]?\s*(?:份|个|条|次)\s*(?:个案|案例|咨询记录|會談|会谈|咨询)/g,
    action: "BLOCK",
    description: "具体数量+个案/案例/咨询记录",
  },
  // 内部文件名模式（如 11_xxx / 12_陈瑜倩... 等）
  {
    regex: /(?:\d{2}_[^\s，。；]{3,}|[A-Za-z]+_最终版_[^\s，。；]+?\.(?:md|json|txt))/g,
    action: "BLOCK",
    description: "内部文件名/工程文件名",
  },

  // ------ REWRITE 级（可改写后放行，需替换为代号）------

  // 内部版本号（v1.0 / v2.3.4 等内部训练版本标识）
  // 注意：不影响 BUILD_ID 格式如 QM-XIAOXUE-20260825-V10.0（大写V+数字）
  {
    regex: /\b[a-z]?v\d+\.\d+(?:\.\d+)?(?:_[\w\u4e00-\u9fa5]+)?\b/g,
    action: "REWRITE",
    description: "内部版本号",
    rewrite: () => "（脱敏版本）",
  },
  // 内部人员中文姓名（陈瑜倩为真实内部人员，非公开心理师）
  {
    regex: /陈瑜倩/g,
    action: "REWRITE",
    description: "内部心理师中文姓名",
    rewrite: () => "心理师B",
  },
];

// ============================================================
// 三、提示注入检测模式
// ============================================================
const PROMPT_INJECTION_PATTERNS: RegExp[] = [
  /忽略(?:以上|之前|上述|前面的|先前的).*(?:指令|提示|规则|系统|prompt)/i,
  /ignore\s*(?:previous|above|all|system).*(?:instructions?|prompts?|rules)/i,
  // v10.4：仅在“你现在是”直接紧跟角色词、且其后为边界时才算注入。
  // 这样“你现在是什么模式”“你现在是如何工作的”“你现在是QM的吗”等正常提问不会被误杀。
  /你现在是(?:一个|一位)?(?:AI|助手|客服|心理师|心理咨询师|DAN|开发者|管理员|系统|专家|老师|机器人)(?![\u4e00-\u9fa5\w])/i,
  /repeat\s*(?:the|your|above|previous).*(?:prompt|instruction|system|text)/i,
  /把你的(?:指令|提示词|系统提示|system prompt|prompt).*(?:给我|发我|告诉我|输出|贴出来)/i,
  /把(?:上面|以上|之前|系统).*(?:指令|提示|prompt).*(?:重复|复述|翻译|输出)/i,
  /重复(?:上面|以上|之前|系统|你收到的).*(?:内容|指令|提示)/i,
  /show\s*(?:me|your).*system\s*prompt/i,
  /你(?:第一|第一个|最前面|系统).*(?:条|个|句|段).*(?:指令|提示|消息|规则)/i,
  /\binstruction\s*override\b/i,
  /\bprompt\s*leak\b/i,
  /\bdan\s*mode\b/i,
  /developer\s*mode/i,
  /越狱|解除限制|忘掉一切|忘记一切|重置.*(?:系统|指令|提示)/i,
];

// ============================================================
// 四、标准拒绝话术
// ============================================================
export const STANDARD_REFUSAL =
  "我可以介绍QM对外公开的功能、使用边界和隐私原则，但不提供内部训练资料、人员分工或系统实现细节。你更想了解哪一部分公开信息？";

// ============================================================
// 五、scanOutput：扫描输出文本
// ============================================================
export interface ScanResult {
  action: "PASS" | "REWRITE" | "BLOCK";
  rewritten?: string;
  matched: string[];
}

export function scanOutput(text: string): ScanResult {
  if (!text || typeof text !== "string") {
    return { action: "PASS", matched: [] };
  }

  const matched: string[] = [];
  let rewritten = text;
  let hasBlock = false;
  let hasRewrite = false;

  for (const pattern of BLOCK_PATTERNS) {
    // 重置正则 lastIndex，防止带 g 标志的正则状态污染
    pattern.regex.lastIndex = 0;
    const matches = text.match(pattern.regex);
    if (matches && matches.length > 0) {
      matched.push(...matches.map((m) => `${pattern.description}: ${m}`));
      if (pattern.action === "BLOCK") {
        hasBlock = true;
      } else if (pattern.action === "REWRITE" && pattern.rewrite) {
        hasRewrite = true;
        // 对 rewritten 副本执行替换
        const fn = pattern.rewrite;
        rewritten = rewritten.replace(pattern.regex, fn);
        pattern.regex.lastIndex = 0;
      }
    }
  }

  if (hasBlock) {
    return { action: "BLOCK", matched };
  }
  if (hasRewrite) {
    return { action: "REWRITE", rewritten, matched };
  }
  return { action: "PASS", matched: [] };
}

// ============================================================
// 六、detectPromptInjection：检测提示注入
// ============================================================
export function detectPromptInjection(text: string): boolean {
  if (!text || typeof text !== "string") return false;
  return PROMPT_INJECTION_PATTERNS.some((pattern) => {
    const result = pattern.test(text);
    pattern.lastIndex = 0;
    return result;
  });
}

// ============================================================
// 七、buildStandardRefusal：构建标准拒绝话术
// ============================================================
export function buildStandardRefusal(): string {
  return STANDARD_REFUSAL;
}

// ============================================================
// 八、轻量客户端扫描（供 client 组件使用，不含完整词典）
// 只挡内部姓名和 CASE 编号，避免内部映射字典泄露到前端 bundle
// ============================================================
const CLIENT_SIDE_PATTERNS: { regex: RegExp; mask: string }[] = [
  { regex: /陈瑜倩/g, mask: "***" },
  { regex: /CASE[_-]\d+(?:[–\-~至到]\d+)?/gi, mask: "[内部编号已隐藏]" },
  { regex: /SUSAN_CASE[_-]\w+/gi, mask: "[内部编号已隐藏]" },
];

export function lightweightClientScan(text: string): {
  safe: boolean;
  sanitized: string;
} {
  if (!text || typeof text !== "string") {
    return { safe: true, sanitized: text || "" };
  }
  let sanitized = text;
  let safe = true;
  for (const p of CLIENT_SIDE_PATTERNS) {
    if (p.regex.test(sanitized)) {
      safe = false;
      sanitized = sanitized.replace(p.regex, p.mask);
      p.regex.lastIndex = 0;
    }
  }
  return { safe, sanitized };
}
