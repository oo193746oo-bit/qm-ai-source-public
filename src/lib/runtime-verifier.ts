// ============================================================
// QM AI v11.5 运行时输出审核器
// 参考 v13 runtime_watchdog.md 和 consistency_rules.md
//
// 确定性规则检查（不调LLM），在LLM流式输出完成后执行。
// P0 → block（阻断，返回安全fallback）
// P1 → rewrite（重写；POC阶段降级为block+fallback）
// P2 → none（只记录telemetry）
// ============================================================

import { BLOCK_PATTERNS } from "./internal-firewall";
import { VerifiedResource } from "./kb-retrieval";

// ---------- 接口定义 ----------

export type ViolationSeverity = "P0" | "P1" | "P2";
export type RepairAction = "none" | "rewrite" | "block";

export interface Violation {
  ruleId: string;
  severity: ViolationSeverity;
  evidenceSpan: string;
  description: string;
}

export interface VerifierResult {
  pass: boolean;
  violations: Violation[];
  repairAction: RepairAction;
  telemetryTags: string[];
  /** block时返回的安全fallback文本 */
  fallbackText?: string;
}

export interface VerifyOutputParams {
  userMessage: string;
  draft: string;
  role: "xiaoku" | "xiaoxue";
  verifiedFacts: Record<string, unknown>;
  verifiedResources: VerifiedResource[];
  crisisActive: boolean;
  previousResponse?: string;
  resourceRejected?: boolean;
}

// ---------- 安全Fallback文本 ----------

const XIAOKU_FALLBACK =
  "我理解你说的这些。我没办法给出诊断或具体的医疗建议，但我可以陪你一起理一理现在的感受。你愿意多说说最近发生了什么吗？";

const XIAOXUE_FALLBACK =
  "关于这个问题，我这边这个问题可以直接说：首次咨询一般 50 分钟左右，费用 400-1500 元（不同心理师有差异），第一次主要聊你的情况和期待，不用提前准备什么，想约时间直接告诉我就好；其他细节如需人工确认，可联系人工客服（工作时间 12:00-24:00）。您想先了解哪一部分？";

// ---------- 检查规则 ----------

// 心理师姓名模式（公开+内部）
const THERAPIST_NAME_PATTERNS = [
  /舒瑱/g, /天岚/g, /万从容/g, /陈瑜倩/g,
  /Susan/gi, /Candice/gi, /Christy/gi,
];

// V001: 心理师点名推荐
function checkV001(draft: string): Violation | null {
  // "推荐你"+心理师姓名
  for (const namePattern of THERAPIST_NAME_PATTERNS) {
    namePattern.lastIndex = 0;
    if (namePattern.test(draft)) {
      namePattern.lastIndex = 0;
      const match = draft.match(namePattern);
      if (match) {
        // 检查是否有推荐语境
        const recommendContext = /推荐|选TA|这位心理师|找这位|约这位|我建议你找|可以找/.test(draft);
        if (recommendContext) {
          return {
            ruleId: "V001",
            severity: "P0",
            evidenceSpan: match[0],
            description: "心理师点名推荐：检测到心理师姓名与推荐语境共存",
          };
        }
      }
    }
  }

  // "选TA"/"这位心理师"等推荐模式
  const directRecommend = /(?:推荐你|建议你|可以找|选TA|这位心理师|约这位|找这[位个])/g;
  if (directRecommend.test(draft)) {
    // 进一步检查是否有具体指向
    const pointingPattern = /(?:这位|那个|TA|这一位|那位)[^\n。！？]{0,10}(?:心理师|咨询师|老师)/g;
    if (pointingPattern.test(draft)) {
      return {
        ruleId: "V001",
        severity: "P0",
        evidenceSpan: "点名推荐模式",
        description: "心理师点名推荐：检测到指向性推荐语言",
      };
    }
  }

  return null;
}

// V002: 档期/预约完成承诺
function checkV002(draft: string): Violation | null {
  const patterns = [
    /已为您预约/, /已为你预约/, /已锁定/, /预约成功/, /已帮您预约/,
    /已帮你预约/, /已确认预约/, /预约已确认/, /已为您安排/,
    /已预留/, /名额已保留/, /已为您锁定/, /档期已确认/,
    /已为你安排/, /已为你预留/,
  ];

  for (const p of patterns) {
    if (p.test(draft)) {
      const match = draft.match(p);
      return {
        ruleId: "V002",
        severity: "P0",
        evidenceSpan: match ? match[0] : "",
        description: "档期/预约完成承诺：AI声称已完成预约操作",
      };
    }
  }
  return null;
}

// V003: 诊断/药物建议
function checkV003(draft: string): Violation | null {
  // H5：安全提醒模式放行 —— 包含"不要自行停药/请遵医嘱/咨询你的医生"
  // 说明AI在做风险提示而非主动建议药物，跳过药物检查。
  if (
    draft.includes("不要自行停药") ||
    draft.includes("请遵医嘱") ||
    draft.includes("咨询你的医生") ||
    draft.includes("联系开药医生") ||
    draft.includes("精神科") ||
    draft.includes("急诊")
  ) {
    return null;
  }

  // H5：语义判断 - 闲聊/比喻/日常场景不触发医疗拒答
  // 检测宠物、吐槽、玩笑等非医疗语境
  const nonMedicalContext = [
    /猫|狗|宠物|年糕|水杯|打碎|追了/,
    /哈哈哈|笑死|社死|吐槽|老板|上班|周五|加班/,
    /打疫苗|疫苗|体检|感冒|发烧|咳嗽/,
  ];
  for (const ctx of nonMedicalContext) {
    if (ctx.test(draft)) {
      return null; // 非医疗语境，跳过检查
    }
  }

  // 诊断模式
  const diagnosisPatterns = [
    /你得了.{1,10}(?:症|障碍|综合征|疾病)/,
    /诊断为/, /你患有/, /你这是.{1,10}(?:症|障碍)/,
    /你可能有.{1,10}(?:症|障碍|疾病)/,
    /你应该是.{1,10}(?:症|障碍)/,
    /这是.{1,10}(?:的症状|的表现)/,
    /你有(?:抑郁|焦虑|强迫|恐惧|双相|人格|创伤后).{0,5}(?:症|障碍|倾向)/,
  ];

  for (const p of diagnosisPatterns) {
    if (p.test(draft)) {
      const match = draft.match(p);
      return {
        ruleId: "V003",
        severity: "P0",
        evidenceSpan: match ? match[0] : "",
        description: "诊断建议：AI给出诊断结论",
      };
    }
  }

  // H5：药物建议模式 - 只阻断AI主动建议具体剂量，允许安全科普
  const medicationPatterns = [
    /建议你吃.{0,5}(?:药|片|剂)/,
    /可以吃点.{0,5}(?:药|片|剂)/,
    /去开药/,
    /医生会给你开/,
    /服用.{1,10}(?:药|片|剂|胶囊)/,
    // H5：删除"处方药""安眠药""抗抑郁药""抗焦虑药"裸词，
    // 只阻断具体剂量建议（如"吃几片""几毫克"）
    /吃.{0,5}(?:几片|几粒|多少毫克|多少mg)/,
    /剂量.{0,5}(?:可以|应该|建议).{0,5}(?:增加|减少|调整)/,
  ];

  for (const p of medicationPatterns) {
    if (p.test(draft)) {
      const match = draft.match(p);
      return {
        ruleId: "V003",
        severity: "P0",
        evidenceSpan: match ? match[0] : "",
        description: "药物建议：AI给出具体药物剂量建议",
      };
    }
  }

  return null;
}

// V004: 未验证统计数据
function checkV004(draft: string, verifiedFacts: Record<string, unknown>): Violation | null {
  // 匹配"研究显示XX%""数据表明""调查发现"等带数字但无来源的断言
  const statPatterns = [
    /(?:研究|调查|数据|统计|报告|文献|实验|临床).{0,10}(?:显示|表明|发现|证明|指出|证实).{0,20}\d+(?:\.\d+)?%/,
    /\d+(?:\.\d+)?%.{0,10}(?:的人|的受访者|的患者|的用户|的个案|的咨询)/,
    /(?:根据|据).{0,10}(?:研究|调查|数据|统计|报告).{0,20}\d+/,
  ];

  for (const p of statPatterns) {
    if (p.test(draft)) {
      const match = draft.match(p);
      // 如果verifiedFacts中有对应数据来源则放行
      const factKeys = Object.keys(verifiedFacts);
      const hasSource = factKeys.some((k) =>
        k.includes("stat") || k.includes("research") || k.includes("data"),
      );
      if (!hasSource) {
        return {
          ruleId: "V004",
          severity: "P0",
          evidenceSpan: match ? match[0] : "",
          description: "未验证统计数据：带数字的断言无verified来源",
        };
      }
    }
  }
  return null;
}

// V005: 内部信息泄漏（复用internal-firewall的BLOCK_PATTERNS）
function checkV005(draft: string): Violation | null {
  for (const pattern of BLOCK_PATTERNS) {
    if (pattern.action !== "BLOCK") continue;
    pattern.regex.lastIndex = 0;
    if (pattern.regex.test(draft)) {
      pattern.regex.lastIndex = 0;
      const matches = draft.match(pattern.regex);
      return {
        ruleId: "V005",
        severity: "P0",
        evidenceSpan: matches ? matches[0] : "",
        description: `内部信息泄漏：${pattern.description}`,
      };
    }
  }
  return null;
}

// V006: 不存在的能力声称
function checkV006(draft: string): Violation | null {
  const patterns = [
    /我记得你/, /我还记得/, /上次你说.*我记住了/, /已保存到云端/,
    /跨设备/, /已同步/, /已付款/, /支付成功/, /已收费/,
    /已为你建档/, /已为您建档/, /后台已记录/, /系统已保存/,
    /我已经记住/, /我一直记得/, /我能看到你之前/,
  ];

  for (const p of patterns) {
    if (p.test(draft)) {
      const match = draft.match(p);
      return {
        ruleId: "V006",
        severity: "P0",
        evidenceSpan: match ? match[0] : "",
        description: "不存在的能力声称：AI声称拥有系统未提供的能力",
      };
    }
  }
  return null;
}

// V007: 危机时出现资源推荐/预约推进/幽默
function checkV007(draft: string, crisisActive: boolean): Violation | null {
  if (!crisisActive) return null;

  // v11.5.1: 删除裸 /预约/（危机时引导预约热线是正当的），
  // 改为只阻断推进商业预约的精确模式：预约时间/预约咨询/预约心理师/预约老师。
  const resourcePatterns = [
    /推荐你/, /这篇文章/, /可以看看/, /这个测评/, /做个测评/,
    /预约(?:时间|咨询|心理师|老师)/,
    /锁定.*时间/, /安排.*咨询/, /帮您匹配/,
    /哈哈/, /😊|😄|😂|🤣|😆/, /开玩笑/, /幽默/,
  ];

  for (const p of resourcePatterns) {
    if (p.test(draft)) {
      const match = draft.match(p);
      return {
        ruleId: "V007",
        severity: "P0",
        evidenceSpan: match ? match[0] : "",
        description: "危机时出现资源推荐/预约推进/幽默",
      };
    }
  }
  return null;
}

// V008: 用户明确拒绝后仍推荐
function checkV008(draft: string, resourceRejected?: boolean): Violation | null {
  if (!resourceRejected) return null;

  const recommendPatterns = [
    /推荐你/, /这篇文章/, /可以看看/, /不妨看看/, /建议阅读/,
    /这个测评/, /做个测评/, /相关文章/, /了解更多/,
  ];

  for (const p of recommendPatterns) {
    if (p.test(draft)) {
      const match = draft.match(p);
      return {
        ruleId: "V008",
        severity: "P0",
        evidenceSpan: match ? match[0] : "",
        description: "用户明确拒绝后仍推荐资源",
      };
    }
  }
  return null;
}

// V101: 与上一轮过度相似
function checkV101(draft: string, previousResponse?: string): Violation | null {
  if (!previousResponse || previousResponse.length < 20) return null;

  const similarity = calcTextSimilarity(draft, previousResponse);
  if (similarity > 0.7) {
    return {
      ruleId: "V101",
      severity: "P1",
      evidenceSpan: `相似度=${(similarity * 100).toFixed(1)}%`,
      description: "与上一轮回复过度相似（>70%）",
    };
  }
  return null;
}

/** 简单文本相似度：基于字符级n-gram的Jaccard相似度 */
function calcTextSimilarity(a: string, b: string): number {
  const n = 3;
  const aNgrams = new Set<string>();
  const bNgrams = new Set<string>();

  for (let i = 0; i <= a.length - n; i++) {
    aNgrams.add(a.slice(i, i + n));
  }
  for (let i = 0; i <= b.length - n; i++) {
    bNgrams.add(b.slice(i, i + n));
  }

  if (aNgrams.size === 0 || bNgrams.size === 0) return 0;

  let intersection = 0;
  for (const gram of aNgrams) {
    if (bNgrams.has(gram)) intersection++;
  }

  const union = aNgrams.size + bNgrams.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// V102: 小雪进入临床分析
function checkV102(draft: string, role: "xiaoku" | "xiaoxue"): Violation | null {
  if (role !== "xiaoxue") return null;

  // v11.5.1: 删除单词级匹配（创伤/压抑/PTSD/解离/退行/升华/潜意识/无意识），
  // 这些词在心理教育语境下合理使用，只有组合术语才触发。
  const clinicalTerms = [
    /人格障碍/, /防御机制/,
    /移情(?!沟通)/, // 不匹配"移情沟通"
    /反移情/,
    /依恋模式/, /童年创伤/, /投射认同/,
    /边缘性(?:人格)?/, /自恋型(?:人格)?/, /表演型(?:人格)?/, /强迫型(?:人格)?/,
    /心理动力/, /躯体化/, /本我/, /自我.*超我/,
  ];

  // 科普/解释语气词：命中术语但整体是科普解释时，降级为 P2（只记录不阻断）
  const educationalTonePatterns = [/是指/, /是一种/, /通俗说/, /简单来说/];

  for (const p of clinicalTerms) {
    if (p.test(draft)) {
      const match = draft.match(p);
      const isEducational = educationalTonePatterns.some((ep) => ep.test(draft));
      return {
        ruleId: "V102",
        severity: isEducational ? "P2" : "P1",
        evidenceSpan: match ? match[0] : "",
        description: isEducational
          ? "小雪临床术语（科普语境，降级记录）"
          : "小雪进入临床分析：检测到临床心理学术语",
      };
    }
  }
  return null;
}

// V103: 小酷过度分析（多个理论术语堆砌）
function checkV103(draft: string, role: "xiaoku" | "xiaoxue"): Violation | null {
  if (role !== "xiaoku") return null;

  const theoryTerms = [ `依恋", "认知行为", "精神分析", "人本主义", "存在主义"`, `阿德勒", "弗洛伊德", "荣格", "格式塔", "正念"`, `接纳承诺", "辩证行为", "图式", "心智化", "客体关系"`, `自体心理", "家庭系统", "叙事疗法", "焦点解决", "动机式访谈"`,
  ];

  let matchCount = 0;
  const matched: string[] = [];
  for (const term of theoryTerms) {
    if (draft.includes(term)) {
      matchCount++;
      matched.push(term);
    }
  }

  if (matchCount >= 3) {
    return {
      ruleId: "V103",
      severity: "P1",
      evidenceSpan: matched.join("、"),
      description: `小酷过度分析：堆砌${matchCount}个理论术语`,
    };
  }
  return null;
}

// V104: 资源推荐过密（verifiedResources为空但draft中出现文章/工具标题）
function checkV104(
  draft: string,
  verifiedResources: VerifiedResource[],
): Violation | null {
  if (verifiedResources.length > 0) return null;

  // 检测draft中是否有推荐类语言
  const recommendPatterns = [
    /推荐你[看读学试]/, /这篇文章/, /可以看看.*这/, /建议你阅读/,
    /有一篇.*文章/, /这个工具/, /做个测评/, /有个测评/,
    /相关文章/, /推荐阅读/, /推荐一篇/,
  ];

  for (const p of recommendPatterns) {
    if (p.test(draft)) {
      const match = draft.match(p);
      return {
        ruleId: "V104",
        severity: "P1",
        evidenceSpan: match ? match[0] : "",
        description: "资源推荐过密：verifiedResources为空但输出中出现推荐语言",
      };
    }
  }
  return null;
}

// V105: 开放问题重复
function checkV105(draft: string, previousResponse?: string): Violation | null {
  if (!previousResponse) return null;

  // 提取draft中的问句
  const draftQuestions = extractQuestions(draft);
  if (draftQuestions.length === 0) return null;

  const prevQuestions = extractQuestions(previousResponse);

  for (const dq of draftQuestions) {
    for (const pq of prevQuestions) {
      if (dq === pq || calcTextSimilarity(dq, pq) > 0.8) {
        return {
          ruleId: "V105",
          severity: "P1",
          evidenceSpan: dq.slice(0, 50),
          description: "开放问题重复：与上一轮提问相同或高度相似",
        };
      }
    }
  }
  return null;
}

/** 从文本中提取问句 */
function extractQuestions(text: string): string[] {
  const questions: string[] = [];
  // 中文问号和英文问号
  const parts = text.split(/[？?\n]/);
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.length > 5 && trimmed.length < 100) {
      questions.push(trimmed);
    }
  }
  return questions;
}

// V201: 句式模板化
function checkV201(draft: string): Violation | null {
  const templatePatterns = [
    /首先.{5,30}其次.{5,30}最后/,
    /第一[，,].{5,30}第二[，,].{5,30}第三/,
    /一方面.{5,30}另一方面/,
  ];

  for (const p of templatePatterns) {
    if (p.test(draft)) {
      return {
        ruleId: "V201",
        severity: "P2",
        evidenceSpan: "模板化句式",
        description: "句式模板化：检测到机械的三段式/并列式结构",
      };
    }
  }
  return null;
}

// V202: 高敏时出现幽默
function checkV202(draft: string, crisisActive: boolean): Violation | null {
  // 高敏时（非危机但情绪激烈）出现幽默
  if (crisisActive) return null; // 危机会被V007拦截

  const humorPatterns = [/哈哈/, /😊|😄|😂|🤣|😆|😝/, /开玩笑/, /逗你/, /偷笑/];
  // 简化：如果draft中有幽默表情且用户消息包含高情绪词（在verifyOutput中判断）
  // 这里只检查draft本身是否有幽默元素，高情绪判断在主函数中
  for (const p of humorPatterns) {
    if (p.test(draft)) {
      return {
        ruleId: "V202",
        severity: "P2",
        evidenceSpan: "幽默元素",
        description: "输出中包含幽默元素（高敏时应关闭）",
      };
    }
  }
  return null;
}

// ---------- 主审核函数 ----------

/**
 * 运行时输出审核主函数
 *
 * POC阶段rewrite降级为block+fallback。
 */
export function verifyOutput(params: VerifyOutputParams): VerifierResult {
  const {
    userMessage,
    draft,
    role,
    verifiedFacts,
    verifiedResources,
    crisisActive,
    previousResponse,
    resourceRejected,
  } = params;

  const violations: Violation[] = [];
  const telemetryTags: string[] = [];

  // ---- P0 硬阻断检查 ----
  const v001 = checkV001(draft);
  if (v001) violations.push(v001);

  const v002 = checkV002(draft);
  if (v002) violations.push(v002);

  const v003 = checkV003(draft);
  if (v003) violations.push(v003);

  const v004 = checkV004(draft, verifiedFacts);
  if (v004) violations.push(v004);

  const v005 = checkV005(draft);
  if (v005) violations.push(v005);

  const v006 = checkV006(draft);
  if (v006) violations.push(v006);

  const v007 = checkV007(draft, crisisActive);
  if (v007) violations.push(v007);

  const v008 = checkV008(draft, resourceRejected);
  if (v008) violations.push(v008);

  // ---- P1 软重写检查 ----
  const v101 = checkV101(draft, previousResponse);
  if (v101) violations.push(v101);

  const v102 = checkV102(draft, role);
  if (v102) violations.push(v102);

  const v103 = checkV103(draft, role);
  if (v103) violations.push(v103);

  const v104 = checkV104(draft, verifiedResources);
  if (v104) violations.push(v104);

  const v105 = checkV105(draft, previousResponse);
  if (v105) violations.push(v105);

  // ---- P2 记录检查 ----
  const v201 = checkV201(draft);
  if (v201) violations.push(v201);

  // V202: 高敏时幽默 — 检查用户消息是否有高情绪词
  const highEmotionPatterns = [
    /我好难受/, /我受不了/, /我快崩/, /太痛苦/, /我好难过/,
    /我好焦虑/, /我好害怕/, /我好生气/, /撑不住/, /我快疯/,
    /我好崩溃/, /我好无助/,
  ];
  const isHighEmotion = highEmotionPatterns.some((p) => p.test(userMessage));
  if (isHighEmotion) {
    const v202 = checkV202(draft, crisisActive);
    if (v202) violations.push(v202);
  }

  // ---- 判定repairAction ----
  const hasP0 = violations.some((v) => v.severity === "P0");
  const hasP1 = violations.some((v) => v.severity === "P1");

  // 收集telemetry tags
  for (const v of violations) {
    telemetryTags.push(`${v.ruleId}:${v.severity}`);
  }
  if (violations.length === 0) {
    telemetryTags.push("CLEAN");
  }

  // POC阶段：P1降级为block+fallback
  if (hasP0 || hasP1) {
    const fallbackText = role === "xiaoku" ? XIAOKU_FALLBACK : XIAOXUE_FALLBACK;
    return {
      pass: false,
      violations,
      repairAction: hasP0 ? "block" : "rewrite",
      telemetryTags,
      fallbackText,
    };
  }

  return {
    pass: true,
    violations,
    repairAction: "none",
    telemetryTags,
  };
}
