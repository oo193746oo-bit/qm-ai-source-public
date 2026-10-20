/**
 * QM AI 心理专业用户识别与个案讨论运行层 v1.0
 *
 * 目标：
 * 1) 识别心理学爱好者 / 不同学习阶段学习者 / 受训咨询师 / 成熟心理工作者；
 * 2) 区分“用户在谈自己”与“专业人士在讨论手上个案”；
 * 3) 在专业模式下提升术语密度、行业洞察与学习/督导语境；
 * 4) 个案讨论强制去身份化、多假设、证据分级与防幻觉；
 * 5) 不把 AI 伪装成正式督导、执照机构、伦理委员会或医疗决策者。
 */

export type PsychologyBackgroundLevel =
  | "ordinary"
  | "enthusiast"
  | "learner"
  | "trainee"
  | "practitioner"
  | "mature_practitioner"
  | "educator_supervisor"
  | "ambiguous";

export type ProfessionalConversationFrame =
  | "self_support"
  | "learning"
  | "career"
  | "professional_identity"
  | "supervision_prep"
  | "case_discussion"
  | "service_admin"
  | "ambiguous";

export interface ProfessionalEvidence {
  signal: string;
  weight: number;
  category: "identity" | "training" | "workflow" | "case" | "career" | "negative";
}

export interface ProfessionalContext {
  backgroundLevel: PsychologyBackgroundLevel;
  backgroundConfidence: number; // 0-1
  professionalScore: number;
  frame: ProfessionalConversationFrame;
  frameConfidence: number; // 0-1
  isProfessionalLike: boolean;
  isCaseDiscussion: boolean;
  requiresClarification: boolean;
  evidence: ProfessionalEvidence[];
  detectedTerms: string[];
  privacyRiskSignals: string[];
  unknowns: string[];
}

const STRONG_IDENTITY: Array<[RegExp, string, number, PsychologyBackgroundLevel]> = [
  [/(?:我是|我也是|我自己也是|我做|我目前是|我的工作是).{0,6}(?:心理咨询师|心理咨詢師|心理师|心理師|psychotherapist|therapist|counselor|counsellor)/i, "明确心理工作者身份", 5, "practitioner"],
  [/(?:执业|執業|从业|從業).{0,6}(?:心理咨询|心理咨詢|心理治疗|心理治療|psychotherapy|counselling)/i, "明确执业/从业", 5, "practitioner"],
  [/(?:我是|目前是).{0,8}(?:督导师|督導師|supervisor|临床教师|臨床教師)/i, "督导/教学身份", 6, "educator_supervisor"],
  [/(?:(?:做了|从业|從業|执业|執業).{0,5}(?:[5-9]|\d{2,})年.{0,10}(?:咨询|咨詢|心理|治疗|治療)|(?:做|从事|從事).{0,6}(?:咨询|咨詢|心理|治疗|治療).{0,6}(?:[五六七八九十]|[5-9]|\d{2,})年)/, "成熟从业年资", 6, "mature_practitioner"],
  [/(?:兼职|兼職).{0,8}(?:接咨询|接咨詢|做咨询|做咨詢|心理咨询|心理咨詢)/, "兼职心理工作", 4, "practitioner"],
];

const LEARNER_IDENTITY: Array<[RegExp, string, number, PsychologyBackgroundLevel]> = [
  [/(?:心理学|心理學).{0,6}(?:本科|硕士|碩士|博士|研究生|学生|學生|专业|專業|在读|在讀)/, "心理专业学习者", 4, "learner"],
  [/(?:临床心理|臨床心理|咨询心理|咨商心理|辅导心理|輔導心理|counselling psychology|clinical psychology).{0,10}(?:学生|學生|硕士|博士|在读|在讀|课程|課程)/i, "临床/咨询方向学习者", 5, "learner"],
  [/(?:实习|實習|见习|見習|practicum|internship).{0,10}(?:咨询|咨詢|心理|治疗|治療|临床|臨床)/i, "实习/见习阶段", 5, "trainee"],
  [/(?:正在学|正在學|自学|自學|学习|學習).{0,8}(?:心理学|心理學|咨询|咨詢|心理治疗|心理治療)/, "明确心理学习", 3, "learner"],
  [/(?:心理学爱好者|心理學愛好者|心理爱好者|心理愛好者)/, "心理学爱好者", 3, "enthusiast"],
  [/(?:读|讀|在读|在讀).{0,8}(?:counselling psychology|counseling psychology|clinical psychology|psychology)/i, "海外/英文心理专业在读", 4, "learner"],
  [/(?:实习机构|實習機構|实习点|實習點).{0,10}(?:接个案|接個案|做个案|做個案|来访|來訪)/, "实习机构接案", 5, "trainee"],
  [/(?:我的)?(?:督导老师|督導老師|督导师|督導師).{0,12}(?:建议|建議|反馈|回饋|说|說)/, "受督关系", 3, "trainee"],
];

const CASE_OWNERSHIP: Array<[RegExp, string, number]> = [
  [/(?:我的|我手上|我接的|我正在做的).{0,8}(?:来访者|來訪者|个案|個案|client|case)/i, "明确手上个案", 6],
  [/(?:我有一个|我有一個|最近有个|最近有個).{0,8}(?:来访者|來訪者|个案|個案)/, "明确来访者/个案", 5],
  [/(?:这个|這個|这个来访|這個來訪|该|該).{0,6}(?:个案|個案|来访者|來訪者).{0,20}(?:我|咨询|咨詢|会谈|會談|session)/, "当前个案讨论", 4],
  [/(?:督导|督導|supervision).{0,12}(?:个案|個案|来访|來訪|case)/i, "督导中的个案", 5],
];

const WORKFLOW_TERMS = [ `个案概念化","個案概念化","case formulation","case conceptualization","初始访谈","初始訪談","咨询设置","咨詢設置"`, `治疗联盟","治療聯盟","工作联盟","工作聯盟","移情","反移情","阻抗","阻抗性","共情失败","共情失敗","修复联盟","修復聯盟"`, `督导","督導","supervision","受督","伦理","倫理","双重关系","雙重關係","知情同意","保密例外","转介","轉介"`, `咨询记录","咨詢記錄","SOAP","进程记录","進程記錄","风险评估","風險評估","危机评估","危機評估"`, `CBT","ACT","DBT","MI","精神分析","心理动力","心理動力","客体关系","客體關係","依恋","依附","系统式","系統式","家庭治疗","家庭治療"`, `mentalization","attachment","schema","认知重构","認知重構","暴露","行为实验","行為實驗","创伤知情","創傷知情`
];

const RESEARCH_TERMS = [ `效应量","效應量","置信区间","信賴區間","信度","效度","RCT","随机对照","隨機對照","meta-analysis","元分析","系统综述","系統綜述"`, `质性研究","質性研究","量化研究","回归分析","迴歸分析","中介效应","中介效應","调节效应","調節效應","统计功效","統計功效","p值","贝叶斯","貝葉斯`
];

const CAREER_TERMS = [ `全职咨询师","全職咨詢師","兼职咨询师","兼職咨詢師","独立执业","獨立執業","自由执业","自由執業","平台咨询师","平台咨詢師"`, `个案量","個案量","空档期","空檔期","来访量","來訪量","收费","收費","定价","定價","获客","獲客","转化","轉化","复购","復購"`, `进修成本","進修成本","培训费","培訓費","督导费","督導費","个人体验","個人體驗","继续教育","繼續教育","CPD","CEU","credential","licensure","执照","執照`
];

const SELF_AS_CLIENT_NEGATIVE: Array<[RegExp, string, number]> = [
  [/(?:我的咨询师|我的咨詢師|我的心理师|我的心理師|我的治疗师|我的治療師)/, "用户在描述自己的心理师", -4],
  [/(?:我去咨询|我去咨詢|我在做咨询|我在做咨詢|我的咨询|我的咨詢).{0,8}(?:让我|跟我|建议我|建議我)/, "用户本人是来访者语境", -3],
  [/(?:咨询师|咨詢師|心理师|心理師).{0,6}(?:跟我说|跟我說|对我说|對我說|建议我|建議我)/, "心理师作为他人", -3],
];

const CASE_PRIVACY_PATTERNS: Array<[RegExp, string]> = [
  [/\b1[3-9]\d{9}\b/, "疑似手机号"],
  [/\b\d{15,18}[0-9Xx]\b/, "疑似身份证/证件号"],
  [/(?:微信|WeChat|手机号|電話|电话|邮箱|email)[:：]?\s*[A-Za-z0-9_@.\-]{5,}/i, "联系方式"],
  [/(?:住在|地址是|公司叫|学校叫|學校叫|医院叫|醫院叫).{0,20}/, "可识别地点/机构"],
  [/(?:姓名|名字)[:：]?\s*[\u4e00-\u9fff]{2,4}/, "真实姓名"],
];

function clamp01(n: number): number { return Math.max(0, Math.min(1, n)); }

function collectTerms(text: string): string[] {
  const found = new Set<string>();
  for (const term of [...WORKFLOW_TERMS, ...RESEARCH_TERMS, ...CAREER_TERMS]) {
    if (text.toLowerCase().includes(term.toLowerCase())) found.add(term);
  }
  return [...found].slice(0, 24);
}

function chooseLevel(candidates: Array<{ level: PsychologyBackgroundLevel; weight: number }>, score: number): PsychologyBackgroundLevel {
  if (candidates.length === 0) return score >= 3 ? "ambiguous" : "ordinary";
  const rank: Record<PsychologyBackgroundLevel, number> = {
    ordinary: 0, enthusiast: 1, learner: 2, trainee: 3, practitioner: 4, mature_practitioner: 5, educator_supervisor: 6, ambiguous: 0,
  };
  return candidates.sort((a,b) => b.weight - a.weight || rank[b.level] - rank[a.level])[0].level;
}

export function analyzeProfessionalContext(userText: string, history: string[] = []): ProfessionalContext {
  const current = userText || "";
  const recentHistory = history.slice(-8).join("\n");
  const combined = `${recentHistory}\n${current}`;
  const evidence: ProfessionalEvidence[] = [];
  const levelCandidates: Array<{ level: PsychologyBackgroundLevel; weight: number }> = [];

  for (const [p, signal, weight, level] of STRONG_IDENTITY) {
    if (p.test(combined)) { evidence.push({signal,weight,category:"identity"}); levelCandidates.push({level,weight}); }
  }
  for (const [p, signal, weight, level] of LEARNER_IDENTITY) {
    if (p.test(combined)) { evidence.push({signal,weight,category:"training"}); levelCandidates.push({level,weight}); }
  }
  for (const [p, signal, weight] of CASE_OWNERSHIP) {
    if (p.test(current)) evidence.push({signal,weight,category:"case"});
  }

  const detectedTerms = collectTerms(combined);
  if (detectedTerms.length >= 1) evidence.push({signal:`专业术语:${detectedTerms.slice(0,5).join("/")}`,weight:Math.min(3,1+detectedTerms.length*0.35),category:"workflow"});
  if (CAREER_TERMS.some(t => combined.toLowerCase().includes(t.toLowerCase()))) evidence.push({signal:"心理行业职业/商业语境",weight:2,category:"career"});

  for (const [p, signal, weight] of SELF_AS_CLIENT_NEGATIVE) {
    if (p.test(current)) evidence.push({signal,weight,category:"negative"});
  }

  const professionalScore = evidence.reduce((sum,e) => sum + e.weight, 0);
  const positiveScore = evidence.filter(e=>e.weight>0).reduce((s,e)=>s+e.weight,0);
  const negativeScore = Math.abs(evidence.filter(e=>e.weight<0).reduce((s,e)=>s+e.weight,0));
  const backgroundLevel = chooseLevel(levelCandidates, professionalScore);
  const isProfessionalLike = positiveScore >= 3 && professionalScore >= 2;
  const backgroundConfidence = clamp01((positiveScore - negativeScore + (levelCandidates.length?2:0))/10);

  const hasCaseOwnership = evidence.some(e=>e.category==="case" && e.weight>=4);
  const hasCaseTerms = /(?:来访者|來訪者|个案|個案|client|case|会谈|會談|session|咨询记录|咨詢記錄|概念化|督导|督導)/i.test(current);
  const hasSelfDistress = /(?:我最近|我自己|我很|我觉得|我覺得|我难受|我難受|我焦虑|我焦慮|我失眠|我崩溃|我崩潰|我想哭|我害怕|我的关系|我的關係)/.test(current);
  const hasLearning = /(?:学习|學習|想学|想學|在学|在學|学(?:CBT|ACT|DBT|心理|咨询|咨詢)|课程|課程|考试|考試|论文|論文|研究|读书|讀書|理论|理論|方法|统计|統計|怎么理解|如何理解|资格怎么|資格怎麼|注册|註冊|执照|執照|licensure|credential)/i.test(current) || RESEARCH_TERMS.some(t=>current.toLowerCase().includes(t.toLowerCase()));
  const hasCareer = CAREER_TERMS.some(t=>current.toLowerCase().includes(t.toLowerCase())) || /(?:就业|就業|毕业|畢業|工作|职业|職業|收入|赚钱|賺錢|回本|投入产出|投入產出|兼职|兼職|全职|全職)/.test(current);
  const hasSupervision = /(?:督导|督導|supervision|受督|反移情|卡住的个案|卡住的個案)/i.test(current);
  const hasAdmin = /(?:预约|預約|费用|費用|时间|時間|档期|檔期|心理师推荐|心理師推薦)/.test(current);

  let frame: ProfessionalConversationFrame = "ambiguous";
  let frameConfidence = 0.45;
  if (hasCaseOwnership && (isProfessionalLike || positiveScore >= 5)) { frame = "case_discussion"; frameConfidence = 0.95; }
  else if (hasSupervision && hasCaseTerms && isProfessionalLike) { frame = "supervision_prep"; frameConfidence = 0.9; }
  else if (hasLearning && isProfessionalLike) { frame = "learning"; frameConfidence = 0.86; }
  else if (hasCareer && isProfessionalLike) { frame = "career"; frameConfidence = 0.86; }
  else if (hasAdmin) { frame = "service_admin"; frameConfidence = 0.78; }
  else if (hasSelfDistress) { frame = "self_support"; frameConfidence = 0.82; }
  else if (isProfessionalLike) { frame = "professional_identity"; frameConfidence = 0.7; }

  // 如果同一条里既有强烈自我困扰又有个案词，但没有明确“我的来访者”，不要擅自切换个案模式
  const requiresClarification = frame === "ambiguous" || (hasSelfDistress && hasCaseTerms && !hasCaseOwnership && isProfessionalLike);
  const isCaseDiscussion = frame === "case_discussion" || frame === "supervision_prep";

  const privacyRiskSignals = CASE_PRIVACY_PATTERNS.filter(([p])=>p.test(current)).map(([,label])=>label);
  const unknowns: string[] = [];
  if (requiresClarification) unknowns.push("用户当前是在谈自己，还是在讨论工作中的来访者/个案");
  if (isCaseDiscussion && !/(?:已脱敏|匿名|化名|不含身份信息|去身份)/.test(current)) unknowns.push("个案材料是否已去身份化");
  if ((frame === "career" || frame === "learning") && /(?:执照|執照|注册|註冊|licensure|credential|资格|資格)/i.test(current) && !/(?:中国|大陆|台湾|香港|美国|英国|澳洲|澳大利亚|加拿大|新加坡|地区|法域)/.test(current)) unknowns.push("所在国家/地区与制度环境");

  return { backgroundLevel, backgroundConfidence, professionalScore, frame, frameConfidence, isProfessionalLike, isCaseDiscussion, requiresClarification, evidence, detectedTerms, privacyRiskSignals, unknowns };
}

export function buildProfessionalPromptBlock(ctx: ProfessionalContext, role: "xiaoku"|"xiaoxue"): string {
  if (!ctx.isProfessionalLike && !ctx.isCaseDiscussion) return "";
  const lines: string[] = [];
  lines.push("【心理专业用户模式 — 专业语境适配】");
  lines.push(`背景阶段：${ctx.backgroundLevel}（置信度${ctx.backgroundConfidence.toFixed(2)}）；当前框架：${ctx.frame}（置信度${ctx.frameConfidence.toFixed(2)}）`);
  if (ctx.detectedTerms.length) lines.push(`用户已使用术语：${ctx.detectedTerms.join("、")}`);
  lines.push("");
  lines.push("## 专业表达原则");
  lines.push("- 不把用户当心理学小白重复科普；允许使用专业术语，但术语必须服务当前问题，不炫技。若用户层级不明确，可先用术语+一句短释义。\n- 区分理论概念、经验假设、研究证据、机构/执照制度事实；后两者不能凭语境编造。\n- 看到行业矛盾时允许讨论：训练成本、督导/个人体验成本、个案量、收费、获客、全职/兼职、学术—实践落差、职业孤独、伦理压力、投入产出，但不替用户下职业结论。\n- 海内外教育/执业制度差异巨大。涉及注册、执照、学位认证、督导小时、收费标准时，先确认国家/地区与具体体系；没有verified事实时明确说不知道或建议核验官方来源。\n- 专业人士也可以是需要支持的人。不要因为其专业身份而跳过共情，也不要把其自我困扰自动变成‘专业能力问题’。 ");
  if (ctx.requiresClarification) {
    lines.push("");
    lines.push("## 模式歧义：只问一个澄清问题");
    lines.push("- 当前材料不足以确定用户是在谈自己还是讨论个案。先简短确认：‘你现在想讨论的是你自己的感受，还是你工作/学习中的一个来访者个案？’不要连续盘问。");
  }
  if (ctx.isCaseDiscussion) {
    lines.push("");
    lines.push("## 个案讨论模式（不是正式督导）");
    lines.push("- 先提醒并遵守去身份化：不索取姓名、手机号、精确生日、住址、工作单位、学校、医院、社媒账号或可组合识别身份的细节；用户已提供时不要复述。\n- 二手材料不能直接诊断来访者。所有个案概念化必须采用‘事实 / 用户观察 / 假设 / 反证 / 未知’五栏思维。\n- 至少保留2个竞争性假设；不得把依恋类型、防御机制、人格结构、创伤、神经多样性或诊断标签当成已证实事实。\n- 可以帮助：梳理会谈材料、形成概念化备选、识别治疗联盟/移情反移情线索、准备督导问题、讨论可能的下一步评估方向、比较干预选择及其前提。\n- 不可以声称：‘这就是正式督导结论’、‘来访者就是XX障碍’、‘你应该按这个治疗计划执行’。\n- 若涉及自杀/自伤/暴力/虐待/急性精神状态等高风险，优先建议用户依据其机构流程、当地法规和真实督导/医疗资源进行现实世界评估与处置；AI不能替代现场风险评估。\n- 若涉及伦理/法律/报告义务，先确认地区与机构规则，并区分一般伦理思考与具体法律义务。 ");
  }
  lines.push("");
  lines.push("## 小酷/小雪角色边界");
  if (role === "xiaoku") lines.push("- 小酷可做专业学习、职业困境、反思性个案讨论与督导准备，但不冒充正式督导师/伦理委员会/医疗决策者。行政预约仍转小雪。 ");
  else lines.push("- 小雪识别专业背景后可提高术语理解、整理需求与预约信息；不得因为用户是心理师就做个案分析或心理治疗。用户要讨论个案时，引导到小酷的专业讨论模式或真实督导资源（仅在产品真实存在时）。 ");
  return lines.join("\n");
}

export interface ProfessionalViolation { id:string; level:"P0"|"P1"; description:string; }

export function verifyProfessionalOutput(output: string, ctx: ProfessionalContext | undefined, role: "xiaoku"|"xiaoxue"): ProfessionalViolation[] {
  if (!ctx) return [];
  const out: ProfessionalViolation[] = [];
  if (ctx.isCaseDiscussion) {
    if (/(?:他就是|她就是|这个来访者就是|這個來訪者就是).{0,18}(?:抑郁症|抑鬱症|双相|雙相|边缘型|邊緣型|NPD|人格障碍|人格障礙|PTSD|ADHD)/i.test(output)) out.push({id:"PRO-H001",level:"P0",description:"二手个案材料被直接诊断/定性"});
    if (/(?:一定是|明显就是|顯然就是|可以确定|可以確定).{0,20}(?:移情|反移情|依恋|依附|防御|防禦|创伤|創傷|人格|机制|機制)/.test(output)) out.push({id:"PRO-H002",level:"P0",description:"把个案假设写成确定事实"});
    if (/(?:正式督导|正式督導|督导结论|督導結論).{0,10}(?:是|为|為)|我作为你的督导|我作為你的督導/.test(output)) out.push({id:"PRO-H003",level:"P0",description:"AI冒充正式督导"});
    if (/(?:姓名|手机号|電話|住址|身份证|身份證|微信|邮箱).{0,15}(?:告诉我|告訴我|发给我|發給我|提供)/.test(output)) out.push({id:"PRO-H004",level:"P0",description:"个案讨论索取可识别信息"});
  }
  const universalInstitutionClaim = /(?:所有地区|所有國家|所有国家|全球|任何地区|任何地區|统一要求|統一要求).{0,50}(?:注册|註冊|执照|執照|督导|督導|小时|小時|收费|收費)|(?:注册|註冊|执照|執照|督导|督導|收费|收費).{0,50}(?:所有地区|所有國家|所有国家|全球|任何地区|任何地區|统一要求|統一要求)/.test(output);
  const ungroundedInstitutionClaim = /(?:注册|註冊|执照|執照|督导|督導|收费|收費).{0,35}(?:必须|一定|统一|統一|都是|\d+\s*(?:小时|小時|元|美元|英镑|英鎊))/.test(output) && !/(?:具体地区|所在地区|所在國家|所在国家|具体体系|官方来源|官方來源|需要核验|需要核實|请确认地区|請確認地區)/.test(output);
  if (universalInstitutionClaim || ungroundedInstitutionClaim) out.push({id:"PRO-H005",level:"P0",description:"未确认地区/体系就生成专业制度事实"});
  if (ctx.isProfessionalLike && /(?:你既然是心理咨询师|你是心理师所以|你学心理的应该|你學心理的應該).{0,25}(?:自己解决|自己解決|不该焦虑|不該焦慮|应该懂|應該懂)/.test(output)) out.push({id:"PRO-H006",level:"P1",description:"用专业身份否定用户自身困扰"});
  if (role === "xiaoxue" && ctx.isCaseDiscussion && /(?:概念化|移情|反移情|防御|防禦|干预|干預|治疗|治療|动力学|動力學)/.test(output)) out.push({id:"PRO-H007",level:"P0",description:"小雪越权进行个案临床分析"});
  return out;
}
