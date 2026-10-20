/**
 * LGBTQ+ Context & Identity Evidence Engine v1.0
 * 
 * Based on: QM_AI_Coze_LGBTQ数据库与RAG智能部署_v1.0
 * 
 * Core principles:
 * - Identity only from explicit self-identification, NEVER inference
 * - Negation/third-person/quoted speech ≠ user identity
 * - Wearing/voice/partner gender/interests ≠ identity evidence
 * - Microaggression detection for both 心理师 and 亲友 scenarios
 * - "No malice" and "user feels hurt" can coexist; one doesn't cancel the other
 * - Role governance (DECISION-ROLE-001) always overrides
 * - 小雪 only uses LGBTQ for admin friendliness, not counseling
 * 
 * The 84,000 CSV training rows are for knowledge base / fine-tuning,
 * not loaded into code. This module implements the runtime logic:
 * identity evidence parsing, microaggression detection, and prompt context.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type IdentityAxis =
  | 'sexual_orientation'
  | 'romantic_orientation'
  | 'gender_identity'
  | 'gender_expression'
  | 'sex_characteristics'
  | 'relationship_structure'
  | 'intersectional';

export interface IdentityEvidence {
  axis: IdentityAxis;
  term: string;
  /** The exact text span where identity was stated */
  sourceSpan: string;
  /** How confident we are this is explicit self-identification */
  confidence: 'high' | 'medium' | 'low';
  /** Whether this is negated (e.g. "我不是gay") */
  negated: boolean;
  /** Whether this is third-person (e.g. "我朋友是lesbian") */
  thirdPerson: boolean;
  /** Whether this is quoted (e.g. "别人说我是queer") */
  quoted: boolean;
}

export interface MicroaggressionMatch {
  category: string;
  pattern: string;
  matchedText: string;
  severity: 'P0' | 'P1';
  friendlyAlternative: string;
  explanation: string;
}

export interface LGBTQContextResult {
  /** Explicit identity evidence (only non-negated, first-person, non-quoted) */
  activeIdentities: IdentityEvidence[];
  /** All detected identity mentions including negated/third-person/quoted */
  allMentions: IdentityEvidence[];
  /** Detected microaggressions in the AI's planned output (for verification) */
  outputMicroaggressions: MicroaggressionMatch[];
  /** Whether the user is discussing coming out / disclosure */
  discussingComingOut: boolean;
  /** Whether minority stress / discrimination signals are present */
  minorityStressSignals: string[];
  /** Whether this is a crisis context (family violence, homelessness, self-harm) */
  crisisSignals: string[];
  /** User's preferred terms / corrections in this session */
  preferredTerms: string[];
  /** Scenario signals for RAG query building */
  scenarioSignals: string[];
}

// ─── Identity Term Registry ──────────────────────────────────────────────────
// These are terms users might use to self-identify.
// Detection requires first-person + non-negation context.

interface IdentityTerm {
  term: string;
  axis: IdentityAxis;
  /** Common variants / aliases */
  aliases?: string[];
}

const IDENTITY_TERMS: IdentityTerm[] = [
  // Sexual orientation
  { term: 'gay', axis: 'sexual_orientation', aliases: ['同性戀', '同性恋', '男同', '基'] },
  { term: 'lesbian', axis: 'sexual_orientation', aliases: ['女同', '拉子', '拉拉', '蕾絲邊', '蕾丝边'] },
  { term: 'bisexual', axis: 'sexual_orientation', aliases: ['雙性戀', '双性恋', 'bi'] },
  { term: 'pansexual', axis: 'sexual_orientation', aliases: ['泛性戀', '泛性恋'] },
  { term: 'polysexual', axis: 'sexual_orientation', aliases: ['多性戀', '多性恋'] },
  { term: 'asexual', axis: 'sexual_orientation', aliases: ['無性戀', '无性恋', 'ace'] },
  { term: 'graysexual', axis: 'sexual_orientation', aliases: ['灰性戀', '灰性恋'] },
  { term: 'demisexual', axis: 'sexual_orientation', aliases: ['半性戀', '半性恋'] },
  { term: 'queer', axis: 'sexual_orientation', aliases: ['酷兒', '酷儿'] },
  { term: 'questioning', axis: 'sexual_orientation', aliases: ['仍在探索', '還在探索', '还在探索', '不確定', '不确定'] },

  // Romantic orientation
  { term: 'aromantic', axis: 'romantic_orientation', aliases: ['無浪漫', '无浪漫', 'aro'] },
  { term: 'grayromantic', axis: 'romantic_orientation', aliases: ['灰浪漫'] },
  { term: 'demiromantic', axis: 'romantic_orientation', aliases: ['半浪漫'] },
  { term: 'homoromantic', axis: 'romantic_orientation', aliases: ['同浪漫'] },
  { term: 'biromantic', axis: 'romantic_orientation', aliases: ['雙浪漫', '双浪漫'] },
  { term: 'panromantic', axis: 'romantic_orientation', aliases: ['泛浪漫'] },

  // Gender identity
  { term: 'trans woman', axis: 'gender_identity', aliases: ['跨性別女性', '跨性别女性', 'mtf', '跨女'] },
  { term: 'trans man', axis: 'gender_identity', aliases: ['跨性別男性', '跨性别男性', 'ftm', '跨男'] },
  { term: 'transgender', axis: 'gender_identity', aliases: ['跨性別', '跨性别', 'trans'] },
  { term: 'non-binary', axis: 'gender_identity', aliases: ['非二元', 'nonbinary', 'enby'] },
  { term: 'genderqueer', axis: 'gender_identity', aliases: ['性別酷兒', '性别酷儿'] },
  { term: 'agender', axis: 'gender_identity', aliases: ['無性別', '无性别'] },
  { term: 'bigender', axis: 'gender_identity', aliases: ['雙性別', '双性别'] },
  { term: 'genderfluid', axis: 'gender_identity', aliases: ['性別流動', '性别流动', '性別fluid'] },
  { term: 'cisgender', axis: 'gender_identity', aliases: ['順性別', '顺性别', 'cis'] },

  // Gender expression
  { term: 'butch', axis: 'gender_expression', aliases: ['t', 't婆'] },
  { term: 'femme', axis: 'gender_expression', aliases: ['p', '婆'] },
  { term: 'androgynous', axis: 'gender_expression', aliases: ['中性', '無性別氣質', '无性别气质'] },

  // Sex characteristics
  { term: 'intersex', axis: 'sex_characteristics', aliases: ['雙性人', '双性人', '間性', '间性', '陰陽人', '阴阳人'] },

  // Relationship structure
  { term: 'polyamory', axis: 'relationship_structure', aliases: ['多邊戀', '多边恋', '開放式關係', '开放式关系', '非單偶', '非单偶'] },
  { term: 'chosen family', axis: 'relationship_structure', aliases: ['選擇性家庭', '选择性家庭', '彩虹家庭'] },
];

// ─── Contextual Detection Patterns ───────────────────────────────────────────

/** First-person identity declaration patterns */
const FIRST_PERSON_PATTERNS = [
  /我是(.{0,10})/,
  /我自己是(.{0,10})/,
  /我認同(.{0,10})/,
  /我认同(.{0,10})/,
  /我作為(.{0,10})/,
  /我作为(.{0,10})/,
  /我屬於(.{0,10})/,
  /我属于(.{0,10})/,
  /我喜歡(?:男生|女生|兩性|两性|所有人)/,
  /我喜歡(?:男|女)/,
  /我對(?:男生|女生|兩性|两性|所有人)有感覺/,
  /我对(?:男生|女生|两性|所有人)有感觉/,
];

/** Negation patterns that invalidate identity */
const NEGATION_PATTERNS = [
  /我不是/,
  /我又不是/,
  /我才不是/,
  /我並非/,
  /我并非/,
  /我不認同/,
  /我不认同/,
  /不要說我是/,
  /不要说我是/,
  /別說我是/,
  /别说我是/,
  /我不是.{0,5}只是/,
  /I'm not/,
  /I am not/,
];

/** Third-person patterns (not the user's own identity) */
const THIRD_PERSON_PATTERNS = [
  /我朋友/,
  /我同學/,
  /我同学/,
  /我同事/,
  /我家人/,
  /我爸/,
  /我媽/,
  /我妈/,
  /我弟/,
  /我哥/,
  /我姊/,
  /我姐/,
  /我妹/,
  /我室友/,
  /我伴侶/,
  /我伴侣/,
  /我對象/,
  /我对象/,
  /我另一半/,
  /別人/,
  /别人/,
  /有人/,
  /某人/,
  /他是/,
  /她是/,
  /他們是/,
  /他们是/,
  /my friend/,
  /my partner/,
  /my brother/,
  /my sister/,
];

/** Quoted/attributed patterns (someone else's label) */
const QUOTED_PATTERNS = [
  /別人說我是/,
  /别人说我是/,
  /有人說我是/,
  /有人说我是/,
  /他們說我是/,
  /他们说我是/,
  /大家都說我是/,
  /大家都说我是/,
  /被說是/,
  /被说是/,
  /被當成/,
  /被当成/,
  /你是不是.{0,10}[?？]/,
  /會不會你是/,
  /会不会你是/,
  /people say I am/,
  /they say I am/,
];

/** Coming out / disclosure signals */
const COMING_OUT_PATTERNS = [
  /出櫃|出柜/,
  /跟爸媽說|跟爸妈说|跟家人說|跟家人说/,
  /坦承|坦白|承認|承认/,
  /告訴.{0,4}我是|告诉.{0,4}我是/,
  /還不敢說|还不敢说/,
  /秘密/,
  /怕被發現|怕被发现/,
  /disclos/,
  /come out/,
  /coming out/,
];

/** Minority stress / discrimination signals */
const MINORITY_STRESS_PATTERNS = [
  { pattern: /歧視|歧视|偏見|偏见|刻板|污名|污名化/, label: 'discrimination' },
  { pattern: /被欺負|被欺负|被排擠|被排挤|被孤立|霸凌|bully/, label: 'bullying' },
  { pattern: /不敢說|不敢说|隱藏|隐藏|掩飾|掩饰|假扮|裝|装/, label: 'concealment' },
  { pattern: /異性戀為主|异性恋为主|預設異性戀|预设异性恋|順性別預設|顺性别预设/, label: 'heteronormativity' },
  { pattern: /微冒犯|不舒服.{0,6}說法|不舒服.{0,6}用詞|不被尊重/, label: 'microaggression' },
  { pattern: /被家裡趕出來|被家里赶出来|斷絕關係|断绝关系|躍出家門|赶出家门/, label: 'family_rejection' },
  { pattern: /家暴|家庭暴力|被打|被罵|被骂|被威脅|被威胁/, label: 'family_violence' },
  { pattern: /轉換治療|转换治疗|修正治療|修正治疗|電擊|电击/, label: 'conversion_therapy' },
];

/** Crisis signals specific to LGBTQ context */
const CRISIS_PATTERNS = [
  /被家裡趕出來|被家里赶出来/,
  /無家可歸|无家可归|沒地方住|没地方住|流落街頭|流落街头/,
  /不想活|活不下去|自殺|自杀|結束生命|结束生命/,
  /家暴.{0,6}(很嚴重|很严重|威脅|威胁|打|受傷|受伤)/,
  /被性侵|被強暴|被强暴|性暴力/,
  /非法|警察|被捕/,
];

// ─── Microaggression Detection ───────────────────────────────────────────────
// These patterns detect problematic language in AI OUTPUT.
// Used by the verifier to catch and rewrite microaggressions.

interface MicroaggressionRule {
  category: string;
  pattern: RegExp;
  severity: 'P0' | 'P1';
  friendlyAlternative: string;
  explanation: string;
}

const MICROAGGRESSION_RULES: MicroaggressionRule[] = [
  // P0: Pathologization
  {
    category: 'pathologization',
    pattern: /(同性戀|同性恋|gay|lesbian|跨性別|跨性别|trans).{0,10}(病|疾病|不正常|變態|变态|心理問題|心理问题|需要治[疗療]|可以矯正|可以矫正|治[疗癒]好)/i,
    severity: 'P0',
    friendlyAlternative: '性取向和性别认同不是疾病，不需要治疗或矫正',
    explanation: 'WHO和DSM-5均已去除同性恋诊断；性别认同亦非精神疾病',
  },
  {
    category: 'pathologization',
    pattern: /(無性戀|无性恋|asexual).{0,10}(性冷淡|性冷感|機能障礙|机能障碍|有病|賀爾蒙|荷尔蒙)/i,
    severity: 'P0',
    friendlyAlternative: '无性恋是一种性取向，不是性功能障碍',
    explanation: '无性恋指缺乏性吸引，与性功能障碍不同',
  },
  // P0: Identity denial / invalidation
  {
    category: 'identity_invalidation',
    pattern: /(真正|真實|真实|正常|生理).{0,4}(性別|性别|男人|女人|男生|女生|male|female)/i,
    severity: 'P0',
    friendlyAlternative: '使用用户自称的性别和称呼',
    explanation: '"真正性别/正常性别"否認跨性別者的性別認同',
  },
  {
    category: 'identity_invalidation',
    pattern: /你(?:其實|其实|本質上|本质上|只不過是|只不过是).{0,10}(?:異性戀|异性恋|同性戀|同性恋|男生|女生|男人|女人)/,
    severity: 'P0',
    friendlyAlternative: '尊重用户的自我认同，不重新定义',
    explanation: '否定用户明确表达的身份认同',
  },
  // P0: Stereotyping
  {
    category: 'stereotyping',
    pattern: /(?:你們|你们)這種人|(?:同性戀|同性恋|跨性別|跨性别|lgbt).{0,10}(都|通常|一般|本來就|本来就)/i,
    severity: 'P0',
    friendlyAlternative: '每个人的经历都是独特的，不以群体概括',
    explanation: '以群体刻板印象解释个人经历',
  },
  {
    category: 'stereotyping',
    pattern: /(雙性戀|双性恋|bisexual).{0,10}(?:花心|濫交|乱交|搖擺|摇摆|不確定|不确定|還沒決定|还没决定|過渡期|过渡期)/i,
    severity: 'P0',
    friendlyAlternative: '双性恋是一种稳定的性取向，不是过渡阶段',
    explanation: '双性恋 erasure / 刻板印象',
  },
  {
    category: 'stereotyping',
    pattern: /(非二元|non-binary|性別酷兒|性别酷儿).{0,10}(?:不知道|搞不清楚|分不清|還在想|还在想|不夠了解|不够了解)/i,
    severity: 'P0',
    friendlyAlternative: '非二元性别是一种有效的性别认同',
    explanation: '将非二元性别认同误解为困惑或未决定',
  },
  // P1: Over-curiosity / boundary violation
  {
    category: 'over_curiosity',
    pattern: /(?:你|您).{0,6}(?:下面|生殖器|動手術|动手术|變性手術|变性手术|賀爾蒙|荷尔蒙|吃藥|吃药|綁胸|束胸|月經|月经).{0,6}[?？]/,
    severity: 'P1',
    friendlyAlternative: '不主动追问身体/医疗细节，等用户自愿分享',
    explanation: '过度好奇跨性别者的身体和医疗状态',
  },
  {
    category: 'over_curiosity',
    pattern: /(?:你|您).{0,6}(?:做愛|做爱|性生活|床上|角色|1.?0|0.?1|攻受|top|bottom).{0,6}[?？]/i,
    severity: 'P1',
    friendlyAlternative: '不追问性行为细节',
    explanation: '过度好奇同性伴侣的性生活',
  },
  // P1: "No malice" defense
  {
    category: 'no_malice_defense',
    pattern: /(?:他|她|他們|他们|爸媽|爸妈|家人|朋友|心理師|心理师).{0,6}(?:沒有惡意|没有恶意|不是故意|只是關心|只是关心|為你好|为你好|出發點是好的|出发点是好的)/,
    severity: 'P1',
    friendlyAlternative: '承认话语的影响，同时理解对方可能的动机，但不否定感受',
    explanation: '用"没有恶意"否定用户感受到的伤害',
  },
  // P1: Inappropriate terms
  {
    category: 'offensive_terms',
    pattern: /變性人|变性人|人妖|娘娘腔|男人婆|假gay|假bi|不正常/,
    severity: 'P1',
    friendlyAlternative: '跨性别者 / 使用用户自称',
    explanation: '使用过时或冒犯性词汇',
  },
  // P1: Heteronormative assumption
  {
    category: 'heteronormative',
    pattern: /(?:你|您).{0,6}(?:男朋友|女朋友|老公|老婆|男朋友|女朋友|結婚|结婚|對象|对象).{0,6}(?:呢|吧|啊|哦|喔)[?？]?/,
    severity: 'P1',
    friendlyAlternative: '使用性别中立的"伴侣/对象"，除非用户明确了对方性别',
    explanation: '默认用户为异性恋，使用性别特定的关系称呼',
  },
  {
    category: 'heteronormative',
    pattern: /(?:以後|以后|將來|将来).{0,6}(?:嫁|娶|結婚|结婚|生孩子|生小孩|當媽|当妈|當爸|当爸)/,
    severity: 'P1',
    friendlyAlternative: '不预设用户的未来关系和家庭结构',
    explanation: '假设异性恋婚姻和生育路径',
  },
  // P1: Education burden
  {
    category: 'education_burden',
    pattern: /(?:你|您).{0,6}(?:可以|能不能|要不要).{0,6}(?:教|告訴|告诉|解釋|解释|科普).{0,6}(?:我|大家|我們|我们).{0,6}(?:lgbt|同志|跨性別|跨性别|性別|性别)/i,
    severity: 'P1',
    friendlyAlternative: '不让用户承担教育者的角色，自己查找可靠信息',
    explanation: '将LGBTQ教育的负担放在用户身上',
  },
  // P0: Conversion therapy mention
  {
    category: 'conversion_therapy',
    pattern: /(?:轉換|转换|修正|扭轉|扭转).{0,4}(?:治療|治疗|療法|疗法|諮商|咨询)/,
    severity: 'P0',
    friendlyAlternative: '转换治疗已被主流医学否定，不应推荐或暗示',
    explanation: '支持或推荐转换治疗（已被WHO/APA否定）',
  },
  // P1: Confusing distinct concepts
  {
    category: 'concept_confusion',
    pattern: /(?:跨性別|跨性别|trans).{0,10}(?:就是|等於|等于|相當於|相当于).{0,10}(?:同性戀|同性恋|gay|lesbian|intersex|雙性人|双性人)/i,
    severity: 'P1',
    friendlyAlternative: '性别认同、性取向、性征是三个不同维度',
    explanation: '混淆性别认同、性取向和间性状态',
  },
  {
    category: 'concept_confusion',
    pattern: /(?:無性戀|无性恋|asexual).{0,10}(?:就是|等於|等于).{0,10}(?:無浪漫|无浪漫|aromantic)/i,
    severity: 'P1',
    friendlyAlternative: '无性恋（性吸引维度）和无浪漫倾向（浪漫吸引维度）是不同概念',
    explanation: '混淆性取向和浪漫取向',
  },
];

// ─── Identity Evidence Parser ────────────────────────────────────────────────

/**
 * Parse user text for identity evidence.
 * Only first-person, non-negated, non-quoted statements become active identity.
 */
export function parseIdentityEvidence(text: string): {
  active: IdentityEvidence[];
  all: IdentityEvidence[];
} {
  const active: IdentityEvidence[] = [];
  const all: IdentityEvidence[] = [];
  const lower = text.toLowerCase();

  for (const identity of IDENTITY_TERMS) {
    const searchTerms = [identity.term.toLowerCase(), ...(identity.aliases || []).map(a => a.toLowerCase())];
    let found = false;

    for (const term of searchTerms) {
      const idx = lower.indexOf(term);
      if (idx === -1) continue;
      found = true;

      // Get surrounding context (20 chars before)
      const contextStart = Math.max(0, idx - 20);
      const context = text.substring(contextStart, idx + term.length + 10);

      // Check negation
      const negated = NEGATION_PATTERNS.some(p => p.test(context));
      // Check third person
      const thirdPerson = THIRD_PERSON_PATTERNS.some(p => p.test(context));
      // Check quoted/attributed
      const quoted = QUOTED_PATTERNS.some(p => p.test(context));

      const evidence: IdentityEvidence = {
        axis: identity.axis,
        term: identity.term,
        sourceSpan: text.substring(idx, idx + term.length),
        confidence: negated || quoted ? 'low' : thirdPerson ? 'low' : 'high',
        negated,
        thirdPerson,
        quoted,
      };

      all.push(evidence);

      if (!negated && !thirdPerson && !quoted) {
        active.push(evidence);
      }
      break; // Only record first match for this identity term
    }
  }

  return { active, all };
}

// ─── Scenario Detection ──────────────────────────────────────────────────────

function detectComingOut(text: string): boolean {
  return COMING_OUT_PATTERNS.some(p => p.test(text));
}

function detectMinorityStress(text: string): string[] {
  const signals: string[] = [];
  for (const { pattern, label } of MINORITY_STRESS_PATTERNS) {
    if (pattern.test(text)) signals.push(label);
  }
  return signals;
}

function detectCrisis(text: string): string[] {
  const signals: string[] = [];
  for (const pattern of CRISIS_PATTERNS) {
    if (pattern.test(text)) signals.push(pattern.source);
  }
  return signals;
}

function detectScenarioSignals(text: string): string[] {
  const signals: string[] = [];
  const scenarios = [
    { pattern: /家庭|爸媽|爸妈|父母|長輩|长辈|代際|代际/, label: 'family' },
    { pattern: /學校|学校|同學|同学|校園|校园|霸凌/, label: 'school' },
    { pattern: /工作|職場|职场|同事|主管|公司|上班/, label: 'workplace' },
    { pattern: /醫生|医生|醫院|医院|身心科|精神科|諮商|咨商|治療|治疗|心理師|心理师/, label: 'medical' },
    { pattern: /伴侶|伴侣|感情|交往|分手|親密|亲密|性[別的]?/, label: 'relationship' },
    { pattern: /身體|身体| dysphoria|不適|不适|轉換|转换|賀爾蒙|荷尔蒙|手術|手术/, label: 'body' },
    { pattern: /宗教|信仰|教會|教会/, label: 'religion' },
    { pattern: /法律|權利|权利|婚姻|登記|登记/, label: 'legal' },
  ];
  for (const { pattern, label } of scenarios) {
    if (pattern.test(text)) signals.push(label);
  }
  return signals;
}

// ─── Main Detection Entry Point ──────────────────────────────────────────────

export function detectLGBTQContext(
  text: string,
  sessionPreferredTerms?: string[],
): LGBTQContextResult {
  const { active, all } = parseIdentityEvidence(text);
  const discussingComingOut = detectComingOut(text);
  const minorityStressSignals = detectMinorityStress(text);
  const crisisSignals = detectCrisis(text);
  const scenarioSignals = detectScenarioSignals(text);

  // Merge preferred terms (avoid duplicates)
  const preferredTerms = [...(sessionPreferredTerms || [])];
  for (const ev of active) {
    if (!preferredTerms.includes(ev.term)) {
      preferredTerms.push(ev.term);
    }
  }

  return {
    activeIdentities: active,
    allMentions: all,
    outputMicroaggressions: [], // Populated by verifyLGBTQOutput()
    discussingComingOut,
    minorityStressSignals,
    crisisSignals,
    preferredTerms,
    scenarioSignals,
  };
}

// ─── Output Verification ─────────────────────────────────────────────────────

/**
 * Check AI output for LGBTQ-related microaggressions and hallucinations.
 * Returns list of matches with severity and friendly alternatives.
 */
export function verifyLGBTQOutput(output: string): {
  violations: MicroaggressionMatch[];
  hasP0: boolean;
  hasP1: boolean;
} {
  const violations: MicroaggressionMatch[] = [];

  for (const rule of MICROAGGRESSION_RULES) {
    const match = output.match(rule.pattern);
    if (match) {
      violations.push({
        category: rule.category,
        pattern: rule.pattern.source,
        matchedText: match[0],
        severity: rule.severity,
        friendlyAlternative: rule.friendlyAlternative,
        explanation: rule.explanation,
      });
    }
  }

  return {
    violations,
    hasP0: violations.some(v => v.severity === 'P0'),
    hasP1: violations.some(v => v.severity === 'P1'),
  };
}

// ─── Prompt Context Generation ───────────────────────────────────────────────

/**
 * Generate an LGBTQ context block for injection into system prompts.
 * This block instructs the LLM on identity-aware but not identity-obsessed behavior.
 * It NEVER overrides role governance.
 */
export function buildLGBTQPromptBlock(
  result: LGBTQContextResult,
  role: 'xiaoku' | 'xiaoxue',
): string {
  const lines: string[] = [];

  lines.push('【LGBTQ+ 语境适配层 v1.0】');

  // Active identities
  if (result.activeIdentities.length > 0) {
    const idStr = result.activeIdentities
      .map(i => `${i.term}(${i.axis})`)
      .join(', ');
    lines.push(`用户明确自称: ${idStr}`);
  } else {
    lines.push('用户未明确表达LGBTQ身份，不要假设或推断');
  }

  // Scenario
  if (result.scenarioSignals.length > 0) {
    lines.push(`场景信号: ${result.scenarioSignals.join(', ')}`);
  }

  // Coming out
  if (result.discussingComingOut) {
    lines.push('用户在讨论出柜/披露话题，注意隐私和节奏');
  }

  // Minority stress
  if (result.minorityStressSignals.length > 0) {
    lines.push(`少数压力信号: ${result.minorityStressSignals.join(', ')}`);
  }

  lines.push('');

  // Role-specific instructions
  if (role === 'xiaoku') {
    lines.push('小酷心理支持指引：');
    lines.push('- 区分：身份本身 / 外界对身份的反应 / 用户对自己身份的感受 / 制度压力');
    lines.push('- 不把一切问题都解释成"身份认同"，身份只是用户的一部分');
    lines.push('- 用户倾诉时优先共情，不急于推荐资源或科普');
    lines.push('- 用户指出用词不舒服时：承认影响→修正→把焦点还给用户，不辩解"没恶意"');
    lines.push('- "没有恶意"和"确实感到不舒服"可以同时成立，前者不取消后者');
  } else {
    lines.push('小雪行政友善指引：');
    lines.push('- 使用用户自称和友善词汇（如"伴侣"而非预设性别）');
    lines.push('- 收集"希望处理的主题大类"用于匹配心理师，不分析性别/性向');
    lines.push('- 不追问出柜、创伤、性行为、身体转换细节');
    lines.push('- 不声称某心理师一定擅长某群体，除非有verified facts');
    lines.push('- 行政需求收集不是心理咨询');
  }

  lines.push('');
  lines.push('【铁律】');
  lines.push('1. 身份只从用户明确自称获取，不从穿着/声音/伴侣/兴趣推断');
  lines.push('2. 否定句("我不是")、第三人称("我朋友是")、引用("别人说我是")不写成用户身份');
  lines.push('3. 不把LGBTQ身份描述成疾病/不正常/需要治疗');
  lines.push('4. 不编造法律/医疗/心理师友善度等事实');
  lines.push('5. 不因用户是LGBTQ就默认推荐出柜/科普资源');
  lines.push('6. 不堆叠社群黑话，使用用户自己的用词');
  lines.push('7. 四角色宪法（DECISION-ROLE-001）优先级高于本层');
  lines.push('8. 危机信号（被赶出家门/家暴/自伤）立即触发危机流程');

  return lines.join('\n');
}

/**
 * Quick check: does this text contain any LGBTQ-related terms?
 * Used to decide whether to run the full LGBTQ context pipeline.
 */
export function hasLGBTQContent(text: string): boolean {
  const lower = text.toLowerCase();
  return IDENTITY_TERMS.some(t => {
    if (lower.includes(t.term.toLowerCase())) return true;
    if (t.aliases?.some(a => lower.includes(a.toLowerCase()))) return true;
    return false;
  });
}
