/**
 * 行政权限门 v13.3
 *
 * 小酷小雪共用同一套能力授权矩阵，禁止各写一套导致漂移。
 * Fact ≠ Action：AI可以说明事实，但不能代表QM采取现实行动。
 */

// ============================================================
// 能力类型定义（13个能力）
// ============================================================

export type Capability =
  | "READ_VERIFIED_INFO"      // 读取已验证的机构事实（时间/地址/流程/费用）
  | "COLLECT_PREFERENCE"      // 记录用户偏好（偏好时间/预算/形式）
  | "PREPARE_SUMMARY"         // 整理需求/摘要
  | "EXPLAIN_PROCESS"         // 说明一般流程
  | "INVITE_VISIT"            // 邀请直接到店
  | "RESERVE_TIME"            // 预留时间
  | "CONFIRM_BOOKING"         // 确认预约
  | "CONFIRM_VISIT"           // 确认到访
  | "CHECK_LIVE_AVAILABILITY" // 查询实时档期
  | "CHARGE_PAYMENT"          // 收费
  | "CONFIRM_PAYMENT"         // 确认付款
  | "CONTACT_STAFF_AS_DONE"   // 声称已通知人工/工作人员会等
  | "OPERATE_FRONTDESK";      // 代表前台安排

// ============================================================
// DENIED 集合（9个禁止能力，小酷小雪完全一致）
// ============================================================

export const DENIED_CAPABILITIES: ReadonlySet<Capability> = new Set<Capability>([
  "INVITE_VISIT",
  "RESERVE_TIME",
  "CONFIRM_BOOKING",
  "CONFIRM_VISIT",
  "CHECK_LIVE_AVAILABILITY",
  "CHARGE_PAYMENT",
  "CONFIRM_PAYMENT",
  "CONTACT_STAFF_AS_DONE",
  "OPERATE_FRONTDESK",
]);

export const ALLOWED_CAPABILITIES: ReadonlySet<Capability> = new Set<Capability>([
  "READ_VERIFIED_INFO",
  "COLLECT_PREFERENCE",
  "PREPARE_SUMMARY",
  "EXPLAIN_PROCESS",
]);

// ============================================================
// 能力授权
// ============================================================

export interface AuthorizationResult {
  allowed: boolean;
  reason?: string;
  capability: Capability;
}

/**
 * 检查角色是否被授权执行指定能力。
 * 小酷小雪共用同一套DENIED集合，不区分角色（role参数保留以兼容未来扩展）。
 */
export function authorizeCapability(
  _role: "xiaoku" | "xiaoxue",
  capability: Capability,
): AuthorizationResult {
  if (DENIED_CAPABILITIES.has(capability)) {
    return {
      allowed: false,
      reason: "当前POC未提供该现实执行能力，需要人工/确定性系统确认",
      capability,
    };
  }
  return { allowed: true, capability };
}

// ============================================================
// 行政意图检测
// ============================================================

export interface AdminIntentDetection {
  /** 检测到的能力请求，null表示无行政动作意图 */
  requestedCapability: Capability | null;
  /** 匹配到的关键词 */
  matchedKeywords: string[];
  /** 是否仅为事实查询（时间/地址），不应被过度拦截 */
  isFactOnly: boolean;
  /** 用户消息原文 */
  rawText: string;
}

interface IntentPattern {
  capability: Capability;
  patterns: RegExp[];
  /** 标记为纯事实查询，不应触发拒绝 */
  factOnly?: boolean;
}

// 按优先级排列：先匹配具体动作，再匹配事实
const INTENT_PATTERNS: IntentPattern[] = [
  // --- 禁止动作（DENIED）---
  {
    capability: "INVITE_VISIT",
    patterns: [
      /(我可以|能不能|可不可以|能不能).{0,8}(过来|来一趟|到店|到你们?那|过去|直接来)/,
      /(直接|随时).{0,4}(过来|来|到店)/,
      /(过来吧|来吧|直接来|过来一[趟次])/,
      /方便的话.{0,8}(过来|来一趟|到店|过去|先来)/,
      /自己先?过来/,
      /现在过去/,
      /今天.{0,4}(过去|过来|到店)/,
      /(过来|过去|来一趟).{0,4}(可以吗|行不行|方便吗)?/,
      /(能|可以).{0,4}(过来|过去|来一[趟次])/,
    ],
  },
  {
    capability: "RESERVE_TIME",
    patterns: [
      /帮(我|您|你).{0,4}预留/,
      /给(我|您|你).{0,4}留好?/,
      /预留(了|一下|五点|时间|位置|好)?/,
      /锁定(时间|时段|位置)?/,
      /帮(我|您|你).{0,4}(留|定|订).{0,4}(时间|时段|位置|点|好)/,
    ],
  },
  {
    capability: "CONFIRM_BOOKING",
    patterns: [
      /(帮|替|给)(我|您|你).{0,4}(约|订|预约|安排)/,
      /(约好了|已经约了|已经确认|帮你约了|预约成功|已预约)/,
      /(确认预约|确认提交|确认安排)/,
      /(我要预约|帮我预约|帮我约|帮我订)/,
      /约\s*(周[一二三四五六日天]|周三?|周四?|今天|明天|后天)/,
    ],
  },
  {
    capability: "CONFIRM_VISIT",
    patterns: [
      /(我|咱).{0,4}(五点|5点|4点|四点|3点|三点|6点|六点|7点|七点).{0,4}(到|来|过去)/,
      /(到了找|到了跟|到了说|到了问).{0,4}(前台|客服|工作人员|谁)/,
      /(\d{1,2}点).{0,4}(直接)?\s*(到|来|过去)/,
      /(我自己决定|我定了|我决定了).{0,4}(来|到|过去|五点|\d点)/,
      /到了找谁/,
    ],
  },
  {
    capability: "CHECK_LIVE_AVAILABILITY",
    patterns: [
      /(今天|明天|后天|周[一二三四五六日天]|这周|下周).{0,8}(有空|有位置|有档期|能约|可以约|有没有空|有时间吗|方便)/,
      /(实时|现在).{0,4}(档期|空位|时间)/,
      /(这个时间|那个时间|周三?|周四?).{0,4}(有空|可以|有位置|方便)/,
    ],
  },
  {
    capability: "CONTACT_STAFF_AS_DONE",
    patterns: [
      /(已经|已).{0,4}(通知|联系|告知).{0,4}(客服|工作人员|人工|心理师|前台)/,
      /(工作人员|客服|人工).{0,4}(会等|在等|会联系|会对接)/,
      /(通知|联系).{0,4}(好了|完了|过了)/,
      /你通知(客服|工作人员|人工)了吗/,
      /(有没有|是否).{0,4}(通知|联系).{0,4}(客服|人工|工作人员)/,
    ],
  },
  {
    capability: "CHARGE_PAYMENT",
    patterns: [
      /(付钱|付款|收费|交钱|支付|转账|扫码付)/,
      /(多少钱.*付|怎么付|可以付吗)/,
    ],
  },
  {
    capability: "CONFIRM_PAYMENT",
    patterns: [
      /(已经|已).{0,4}(付了|交了|支付了|付款了)/,
      /(付款成功|支付成功|已到账|收到款)/,
      /我付(钱|款)了吗/,
      /(有没有|是否).{0,4}(付|支付|付款|交)/,
    ],
  },
  {
    capability: "OPERATE_FRONTDESK",
    patterns: [
      /(代表|替|帮).{0,4}(前台|机构|QM).{0,4}(安排|确认|决定)/,
      /(前台|机构).{0,4}(已经|会).{0,4}(安排|确认|预留)/,
      /(你就|你能不能).{0,4}(答应|同意|确认)/,
      /客服说.{0,10}(可以来|五点|确认)/,
    ],
  },
  // --- 允许的事实查询（ALLOWED，但需要标记以便不过度拦截）---
  {
    capability: "READ_VERIFIED_INFO",
    patterns: [
      /(几点|营业时间|工作时间|什么时候|开门|下班|关门)/,
      /(地址|在哪里|在哪儿|哪个位置|怎么去|路线)/,
      /(流程|怎么预约|预约流程|步骤)/,
      /(费用|价格|多少钱|收费|价位)/,
      /(有什么服务|服务内容|提供什么)/,
    ],
    factOnly: true,
  },
  {
    capability: "COLLECT_PREFERENCE",
    patterns: [
      /(我想|我希望|我比较方便|我倾向|我偏好|方便的话).{0,10}(上午|下午|晚上|白天|工作日|周末|\d{1,2}点|线上|线下|视频)/,
      /(周三?|周四?|周五?|周末|工作日).{0,4}(下午|上午|晚上)?\s*(方便|有空|可以)?/,
    ],
    factOnly: false,
  },
  {
    capability: "EXPLAIN_PROCESS",
    patterns: [
      /(怎么|如何).{0,4}(开始|进行|预约|咨询)/,
      /(流程是|步骤是|怎么操作)/,
    ],
    factOnly: true,
  },
];

/**
 * 检测用户消息是否涉及行政动作。
 * 返回请求的能力及是否仅为事实查询。
 *
 * 优先级：禁止动作 > 偏好记录 > 事实查询
 * 当同时匹配禁止动作和事实查询时（如"你们几点下班，我过来一趟"），
 * 返回禁止动作能力，由调用方注入权限拒绝上下文。
 */
export function detectAdminIntent(text: string): AdminIntentDetection {
  const rawText = text || "";
  const matchedKeywords: string[] = [];
  let detectedCapability: Capability | null = null;
  let isFactOnly = false;

  // 第一轮：检测禁止动作（非factOnly的pattern）
  for (const intent of INTENT_PATTERNS) {
    if (intent.factOnly) continue;
    for (const pattern of intent.patterns) {
      if (pattern.test(rawText)) {
        if (!detectedCapability || DENIED_CAPABILITIES.has(intent.capability)) {
          detectedCapability = intent.capability;
        }
        matchedKeywords.push(pattern.source.slice(0, 30));
        break;
      }
    }
  }

  // 第二轮：如果没有禁止动作，检测事实查询
  if (!detectedCapability) {
    for (const intent of INTENT_PATTERNS) {
      if (!intent.factOnly) continue;
      for (const pattern of intent.patterns) {
        if (pattern.test(rawText)) {
          detectedCapability = intent.capability;
          isFactOnly = true;
          matchedKeywords.push(pattern.source.slice(0, 30));
          break;
        }
      }
      if (detectedCapability) break;
    }
  }

  // 第三轮：如果检测到禁止动作，也检查是否包含事实查询关键词
  // （用于判断是否需要同时回答事实）
  if (detectedCapability && DENIED_CAPABILITIES.has(detectedCapability)) {
    isFactOnly = false;
  }

  return {
    requestedCapability: detectedCapability,
    matchedKeywords,
    isFactOnly,
    rawText,
  };
}

// ============================================================
// ADM 输出审核规则（P0违规检测）
// ============================================================

export type AdmSeverity = "P0" | "P1";

export interface AdmViolation {
  ruleId: string;
  severity: AdmSeverity;
  description: string;
  matchedText: string;
}

interface AdmRule {
  ruleId: string;
  severity: AdmSeverity;
  description: string;
  patterns: RegExp[];
}

const ADM_RULES: AdmRule[] = [
  {
    ruleId: "ADM001",
    severity: "P0",
    description: "邀请到店：随时可以过来/直接来",
    patterns: [
      /随时可以过来/,
      /随时都可以来/,
      /随时过来/,
      /直接来/,
      /直接过来/,
      /过来吧/,
      /来吧(?![，。！？\s]*$)/,
      /欢迎.{0,4}(到店|过来|来)/,
    ],
  },
  {
    ruleId: "ADM002",
    severity: "P0",
    description: "预留承诺：帮你预留/给你留好",
    patterns: [
      /帮(你|您).{0,4}预留/,
      /给(你|您).{0,4}留好/,
      /预留了/,
      /预留好/,
      /帮(你|您).{0,4}留好?/,
      /已经.{0,4}预留/,
      /锁定了/,
      /帮(你|您).{0,4}锁定/,
      /\d{1,2}点.{0,4}帮(您|你).{0,4}预留/,
      /帮(您|你).{0,4}\d{1,2}点.{0,4}预留/,
    ],
  },
  {
    ruleId: "ADM003",
    severity: "P0",
    description: "预约确认：约好了/已经确认/帮你约了",
    patterns: [
      /约好了/,
      /已经确认/,
      /帮(你|您)约了/,
      /帮(你|您).{0,4}确认了?/,
      /预约成功/,
      /已预约/,
      /已经为(您|你).{0,4}预约/,
      /安排好了/,
      /帮(您|你)安排/,
      /帮(您|你)约(周|今天|明天|\d)/,
      /确认了$/,
      /没问题.{0,4}帮(您|你)/,
    ],
  },
  {
    ruleId: "ADM004",
    severity: "P0",
    description: "到访确认：五点直接来/到了找前台",
    patterns: [
      /\d{1,2}点.{0,4}直接.{0,4}(到|来|过去)/,
      /到了找(前台|客服|工作人员|谁)/,
      /到了跟(前台|客服|工作人员)/,
      /到了说.{0,4}(提前约|约了|预约)/,
      /\d{1,2}点到/,
      /\d{1,2}点.{0,4}帮(您|你).{0,4}(确认|预留|留)/,
      /帮(您|你).{0,4}\d{1,2}点.{0,4}(确认|预留)/,
    ],
  },
  {
    ruleId: "ADM005",
    severity: "P0",
    description: "虚构人工动作：已经通知客服/工作人员会等你",
    patterns: [
      /已经通知(客服|工作人员|人工|心理师|前台)/,
      /已通知(客服|工作人员|人工|心理师|前台)/,
      /通知(客服|工作人员|人工|心理师|前台)了/,
      /工作人员会等/,
      /客服会等/,
      /(客服|工作人员|人工).{0,4}会联系(你|您)/,
      /(已经|已).{0,4}告知(客服|工作人员)/,
      /(已经|已).{0,4}(联系|通知).{0,4}(客服|工作人员|人工)/,
    ],
  },
  {
    ruleId: "ADM006",
    severity: "P0",
    description: "实时档期幻觉：这个时间有空/有位置",
    patterns: [
      /这个时间有空/,
      /那个时间有空/,
      /有位置/,
      /有空档/,
      /有档期/,
      /这个时间可以/,
      /那个时间可以/,
      /(今天|明天|周[一二三四五六日天]?).{0,6}(有空|可以约|有位置|方便的)/,
      /(付款成功|支付成功|已到账|收到款|已经付了|已经支付了|付款了)/,
    ],
  },
  {
    ruleId: "ADM007",
    severity: "P1",
    description: "把user preference升级为confirmed",
    patterns: [
      /(你说的|您说的).{0,4}(时间|五点|5点).{0,4}(已确认|确认了|没问题)/,
      /(按你说的|按您说的).{0,4}(安排|确认)/,
    ],
  },
  {
    ruleId: "ADM008",
    severity: "P1",
    description: "现实动作未标pending human confirmation",
    patterns: [
      // 检测到预约类语境但没有"待确认/人工确认"的标记
      // 这个规则需要上下文判断，在 verifyAdminOutput 中做特殊处理
    ],
  },
];

/**
 * 对AI输出运行ADM审核检查。
 * P0违规触发重试，P1记录但不阻断。
 */
export function verifyAdminOutput(output: string): {
  pass: boolean;
  p0Violations: AdmViolation[];
  p1Violations: AdmViolation[];
  allViolations: AdmViolation[];
} {
  const p0Violations: AdmViolation[] = [];
  const p1Violations: AdmViolation[] = [];

  for (const rule of ADM_RULES) {
    if (rule.patterns.length === 0) continue; // ADM008需要上下文，暂跳过
    for (const pattern of rule.patterns) {
      const match = output.match(pattern);
      if (match) {
        const violation: AdmViolation = {
          ruleId: rule.ruleId,
          severity: rule.severity,
          description: rule.description,
          matchedText: match[0],
        };
        if (rule.severity === "P0") {
          p0Violations.push(violation);
        } else {
          p1Violations.push(violation);
        }
        break; // 每条规则只报一次
      }
    }
  }

  return {
    pass: p0Violations.length === 0,
    p0Violations,
    p1Violations,
    allViolations: [...p0Violations, ...p1Violations],
  };
}

/**
 * 当检测到越权输出时，生成安全替换模板。
 */
export function getAdminSafetyTemplate(detection: AdminIntentDetection | null): string {
  const cap = detection?.requestedCapability;
  const templates: Record<string, string> = {
    INVITE_VISIT:
      "我们的工作时间是周一至周日 12:00-24:00，地址在上海市静安区民立路150号。" +
      "具体到访安排需要人工客服确认后才算成立，我可以先帮您记录到访意向，" +
      "人工客服会在工作时间内联系您确认。",
    RESERVE_TIME:
      "我记下您提到的时间偏好了。不过这个时间目前还没有被确认，" +
      "具体时间安排需要人工客服确认后才算成立，我会把您的需求标记为优先。",
    CONFIRM_BOOKING:
      "我可以帮您整理预约需求，但预约的最终确认需要人工客服完成。" +
      "我会把您的需求整理好，人工客服会在工作时间（12:00-24:00）联系您确认具体安排。",
    CONFIRM_VISIT:
      "我记下您说的时间了。但需要说明的是，这只是您的时间偏好，" +
      "并不代表到访已被确认。具体到访安排需要人工客服确认后才算成立。",
    CHECK_LIVE_AVAILABILITY:
      "我无法查询实时档期。我可以帮您记录方便的时间偏好，" +
      "人工客服会在工作时间（12:00-24:00）联系您确认具体可用时段。",
    CONTACT_STAFF_AS_DONE:
      "我目前无法直接联系工作人员。我会帮您记录需求，" +
      "人工客服会在工作时间（12:00-24:00）联系您。您也可以添加微信客服  获取即时帮助。",
    CHARGE_PAYMENT:
      "费用按心理师资历分级，400-1500元/次。具体收费和支付流程由人工客服办理，" +
      "我可以先帮您整理需求。",
    CONFIRM_PAYMENT:
      "我无法确认支付状态。支付相关问题请联系人工客服（微信 ，工作时间 12:00-24:00）。",
    OPERATE_FRONTDESK:
      "前台安排需要由人工工作人员完成。我可以帮您记录需求，" +
      "人工客服会在工作时间联系您确认。",
  };

  if (cap && templates[cap]) {
    return templates[cap];
  }

  return (
    "我可以为您说明工作时间、地址和一般流程，也可以帮您记录需求偏好。" +
    "涉及具体时间确认、预约、到访安排等需要人工客服确认后才算成立。" +
    "人工客服工作时间为 12:00-24:00，微信客服 。"
  );
}

/**
 * 生成注入System Prompt的<admin_authorization>标签内容。
 * 当检测到行政动作意图且能力被DENIED时调用。
 */
export function buildAdminAuthorizationBlock(
  role: "xiaoku" | "xiaoxue",
  detection: AdminIntentDetection,
  currentAdminState?: string,
): string {
  const cap = detection.requestedCapability;
  if (!cap || !DENIED_CAPABILITIES.has(cap)) {
    return ""; // 不需要注入
  }

  const auth = authorizeCapability(role, cap);
  const lines: string[] = [
    "<admin_authorization>", `  <detected_capability>${cap}</detected_capability>`, `  <authorized>false</authorized>`, `  <reason>${auth.reason}</reason>`, `  <current_admin_state>${currentAdminState || "A0"}</current_admin_state>`,
    "  <allowed_actions>",
    "    - 说明verified工作时间、地址、流程",
    "    - 记录用户偏好时间（标记为preference，非confirmed）",
    "    - 整理需求和摘要",
    "    - 明确告知'待人工确认'",
    "  </allowed_actions>",
    "  <denied_actions>",
    "    - 不得说'随时可以过来/直接来/过来吧'",
    "    - 不得说'帮你预留/给你留好/预留了'",
    "    - 不得说'约好了/已经确认/帮你约了'",
    "    - 不得说'五点到/到了找前台/直接来'",
    "    - 不得说'已经通知客服/工作人员会等你'",
    "    - 不得说'这个时间有空/有位置'",
    "  </denied_actions>",
    "  <correct_approach>",
    "    1. 先回答能回答的事实（工作时间/地址）",
    "    2. 记录用户的时间偏好，明确标记为偏好而非确认",
    "    3. 明确说明具体安排需要人工客服确认",
    "    4. 不要从'知道时间'推导成'可以来'",
    "  </correct_approach>",
    "</admin_authorization>",
  ];

  return lines.join("\n");
}
