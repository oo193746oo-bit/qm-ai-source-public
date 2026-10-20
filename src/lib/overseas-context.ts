/**
 * Overseas Chinese / International Student Context Engine v1.0
 * 
 * Based on: QM_AI_Coze_海外华人海外生活留学数据库与RAG智能部署_v1.0
 * 
 * Core principles:
 * - Does NOT treat "overseas Chinese" as a monolithic group
 * - Detects migration stage, life tasks, language patterns, psychological themes
 * - NEVER infers nationality, visa status, class, politics, family values, or language ability
 * - Country/city only used as context if user explicitly states it
 * - Dual-constraint lens: staying/returning, independence/filial piety,
 *   integration/cultural retention, success/admitting difficulty
 * - Language pattern ≠ nationality or ability
 * - Role governance (DECISION-ROLE-001) always overrides
 * - 小雪 understands overseas admin terms but is NOT an immigration/tax/legal expert
 * 
 * 130,000 CSV training rows are for knowledge base, not code.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type MigrationStage =
  | 'preparing'      // 准备出国
  | 'newly_arrived'  // 刚到
  | 'adapting'       // 适应中
  | 'long_term'      // 长期居住
  | 'returning'      // 回流
  | 'second_gen'     // 第二代
  | 'unknown';

export type IdentitySituation =
  | 'international_student'  // 留学生
  | 'exchange_student'       // 交换生
  | 'phd_candidate'          // 博士
  | 'visiting_scholar'       // 访问学者
  | 'overseas_worker'        // 海外工作者
  | 'new_immigrant'          // 新移民
  | 'long_term_resident'     // 长期居民
  | 'dependent_family'       // 陪读家属
  | 'overseas_born'          // 海外出生华人
  | 'third_culture'          // 第三文化
  | 'unknown';

export type DualConstraintAxis =
  | 'stay_vs_return'       // 留下/回去
  | 'independence_vs_filial' // 独立/孝顺
  | 'integration_vs_retention' // 融入/保留文化
  | 'success_vs_difficulty'   // 成功/承认困难
  | 'freedom_vs_anxiety'      // 自由/失控
  | 'chinese_circle_vs_local' // 华人圈/当地圈
  | 'chinese_vs_english'      // 中文/英文
  | 'parental_support_vs_pressure' // 父母支持/压力
  | 'return_familiar_vs_strange'   // 回国亲近/陌生
  | 'strength_vs_burden';         // 优势/负担

export interface OverseasContextResult {
  /** Detected migration stage (only from explicit signals) */
  migrationStage: MigrationStage;
  /** Detected identity situation (only from explicit signals) */
  identitySituation: IdentitySituation;
  /** Country/city if explicitly mentioned, never inferred */
  explicitLocation: string | null;
  /** Dual-constraint axes detected in the text */
  dualConstraints: DualConstraintAxis[];
  /** Psychological themes present */
  psychologicalThemes: string[];
  /** Microaggression signals in user's reported experience */
  reportedMicroaggressions: string[];
  /** Crisis signals specific to overseas context */
  crisisSignals: string[];
  /** Whether user mentions language switching for emotional safety */
  languageEmotionSignal: boolean;
  /** Protective factors mentioned */
  protectiveFactors: string[];
  /** Life scenario signals for RAG */
  lifeScenarios: string[];
}

// ─── Signal Detection ────────────────────────────────────────────────────────

const STAGE_SIGNALS: { pattern: RegExp; stage: MigrationStage }[] = [
  { pattern: /(?:準備|准备|打算|計劃|计划|申請|申请|錄取|录取).{0,6}(?:出國|出国|留學|留学|簽證|签证)/, stage: 'preparing' },
  { pattern: /(?:剛到|刚到|才來|才来|剛來|刚来|到.{0,4}(?:一週|一周|一個月|一个月|幾天|几天))/, stage: 'newly_arrived' },
  { pattern: /(?:在.{0,6}(?:適應|适应)|還在適應|还在适应|不習慣|不习惯|慢慢.{0,4}習慣|习惯)/, stage: 'adapting' },
  { pattern: /(?:住了?\s*\d+\s*(?:年|年了)|長期居住|长期居住|定居|拿到.{0,4}(?:身分|身份|綠卡|绿卡|PR|居留))/, stage: 'long_term' },
  { pattern: /(?:回國|回国|回去|回流|返國|返国|畢業後回|毕业后回|打算回)/, stage: 'returning' },
  { pattern: /(?:在.{0,4}(?:出生|長大|长大)|第二代|ABC|BBC|CBC|華裔|华裔|當地出生|当地出生)/, stage: 'second_gen' },
];

const IDENTITY_SIGNALS: { pattern: RegExp; identity: IdentitySituation }[] = [
  { pattern: /(?:留學生|留学生|讀書|读书|在學|在学|undergrad|graduate|碩士|硕士|學士|学士)/, identity: 'international_student' },
  { pattern: /(?:交換生|交换生|exchange|交換計畫|交换计划)/, identity: 'exchange_student' },
  { pattern: /(?:博士|PhD|phd|博士班|doctoral)/, identity: 'phd_candidate' },
  { pattern: /(?:訪問學者|访问学者|visiting scholar|訪問|访问)/, identity: 'visiting_scholar' },
  { pattern: /(?:在.{0,4}工作|外派|工作簽|工作签|overseas.{0,4}work|work abroad)/, identity: 'overseas_worker' },
  { pattern: /(?:新移民|移民|immigrant|拿到.{0,4}(?:身分|身份))/, identity: 'new_immigrant' },
  { pattern: /(?:長期居民|长期居民|永久居民|PR|綠卡|绿卡|resident)/, identity: 'long_term_resident' },
  { pattern: /(?:陪讀|陪读|家屬|家属|dependent|伴讀|伴读)/, identity: 'dependent_family' },
  { pattern: /(?:在.{0,4}出生|海外出生|ABC|BBC|CBC|華裔|华裔|second.generation)/, identity: 'overseas_born' },
  { pattern: /(?:第三文化|third culture|TCK|多國長大|多国长大|跨文化長大)/, identity: 'third_culture' },
];

// Explicit country/city detection (only if user says it)
const COUNTRY_SIGNALS = [
  '美國','美国','USA','U.S.','英国','英國','UK','Canada','加拿大','澳洲','澳大利亚',
  '日本','韓國','韩国','新加坡','新加坡','德国','德國','法国','法國','荷兰','荷蘭',
  '紐西蘭','新西兰','New Zealand','香港','澳门','澳門','歐洲','欧洲',
  '纽约','紐約','洛杉磯','洛杉矶','旧金山','舊金山','倫敦','伦敦','多倫多','多伦多',
  '溫哥華','温哥华','悉尼','墨爾本','墨尔本','東京','东京','首爾','首尔',
  '柏林','巴黎','阿姆斯特丹','波士顿','波士頓','芝加哥','西雅圖','西雅图',
];

// Dual-constraint detection
const DUAL_CONSTRAINT_SIGNALS: { pattern: RegExp; axis: DualConstraintAxis }[] = [
  { pattern: /(?:留下|待在|留在).{0,8}(?:回去|回國|回国)|(?:回去|回國|回国).{0,8}(?:留下|待在|留在)|想留.{0,4}但.{0,4}想回|想回.{0,4}但.{0,4}想留/, axis: 'stay_vs_return' },
  { pattern: /(?:獨立|独立|自己).{0,8}(?:孝順|孝顺|父母|家人|爸媽|爸妈)|(?:孝順|孝顺|父母|家人).{0,8}(?:獨立|独立|自己)|邊界.{0,4}(?:關心|关心|家人)|對不起.{0,4}父母/, axis: 'independence_vs_filial' },
  { pattern: /(?:融入|當地|当地|適應|适应).{0,8}(?:保留|華人|华人|文化|自己)|(?:保留|華人|华人|文化).{0,8}(?:融入|當地|当地|適應|适应)|不想.{0,4}(?:被同化|失去)|不適應.{0,4}但不想放棄/, axis: 'integration_vs_retention' },
  { pattern: /(?:成功|不錯|不错|過得好|过得好|表面).{0,8}(?:難|難受|难受|痛苦|孤單|孤单|孤獨|孤独|不好|崩潰|崩溃)|(?:不敢.{0,4}(?:說|说|承認|承认)).{0,8}(?:不好|難|難受|难受)|別人.{0,4}以為.{0,4}我.{0,4}(?:好|不錯|不错).{0,4}但/, axis: 'success_vs_difficulty' },
  { pattern: /(?:自由|選擇|选择|機會|机会).{0,8}(?:焦慮|焦虑|失控|不安|迷茫|迷失|不确定)|(?:選擇|选择).{0,4}變多.{0,4}(?:焦慮|焦虑|不安)/, axis: 'freedom_vs_anxiety' },
  { pattern: /(?:華人圈|华人圈|中國人|中国人|同鄉|同乡).{0,8}(?:當地人|当地人|外國人|外国人|local)|(?:當地人|当地人|外國人|外国人).{0,8}(?:華人圈|华人圈|同鄉|同乡)|不想.{0,4}只跟.{0,4}(?:華人|中国人|當地人)/, axis: 'chinese_circle_vs_local' },
  { pattern: /(?:中文|華語|华语|母語|母语).{0,8}(?:英文|英語|英语|當地語言|当地语言)|(?:英文|英語|英语).{0,8}(?:中文|華語|华语|母語|母语)|用英文.{0,4}(?:說|说|表達|表达).{0,4}(?:情緒|情绪|感受|安全)|中文.{0,4}說不出|英文.{0,4}更.{0,4}(?:安全|自在|真實|真实)/, axis: 'chinese_vs_english' },
  { pattern: /(?:爸媽|爸妈|父母|家人).{0,8}(?:支持|幫忙|帮忙|付出|花錢|花钱|供).{0,8}(?:壓力|压力|內疚|内疚|對不起|愧疚|不敢說)|(?:支持|關心|关心).{0,4}但.{0,4}(?:壓力|压力|期待|控制|干涉)/, axis: 'parental_support_vs_pressure' },
  { pattern: /(?:回國|回国|回去|到家).{0,8}(?:陌生|不習慣|不习惯|疏離|疏离|格格不入|不一樣|不一样|反向.{0,2}文化衝擊|冲击)|(?:熟悉).{0,8}(?:陌生|不認得|不认得)/, axis: 'return_familiar_vs_strange' },
  { pattern: /(?:雙語|双语|雙文化|双文化|跨文化).{0,8}(?:優勢|优势|資源|资源|能力).{0,8}(?:疲憊|疲惫|累|負擔|负担|切換|切换)|(?:切換|切换).{0,4}(?:累|疲憊|疲惫|成本)/, axis: 'strength_vs_burden' },
];

const PSYCHO_THEMES: { pattern: RegExp; theme: string }[] = [
  { pattern: /(?:孤單|孤单|孤獨|孤独|一個人|一个人|沒人|没人|沒朋友|没朋友|孤立)/, theme: 'loneliness' },
  { pattern: /(?:想家|想爸媽|想爸妈|思念|家鄉|家乡|錯過|错过|家的味道)/, theme: 'homesickness' },
  { pattern: /(?:無根|无根|沒有歸屬|没有归属|不屬於|不属于|哪裡都不是|哪里都不是|邊緣|边缘|夾縫|夹缝)/, theme: 'rootlessness' },
  { pattern: /(?:口音|accent|發音|发音|說錯|说错|被笑|被嘲笑|聽不懂|听不懂|表達不出|詞不達意|词不达意)/, theme: 'accent_anxiety' },
  { pattern: /(?:冒名頂替|冒名顶替|imposter|不配|不夠好|不够好|不配擁有|不配拥有|假的|欺騙|欺骗|騙子|骗子)/, theme: 'imposter_syndrome' },
  { pattern: /(?:內疚|内疚|愧疚|對不起|对不起|花了|花那麼多|花那么多|不敢.{0,4}(?:說|说|告訴|告诉))/, theme: 'guilt' },
  { pattern: /(?:歧視|歧视|偏見|偏见|種族|种族|仇恨|被排擠|被排挤|microaggression|微冒犯|被針對|被针对)/, theme: 'minority_stress' },
  { pattern: /(?:成長|成长|進步|进步|改變|改变|視野|视野|獨立|独立|韌性|韧性|學到|学到)/, theme: 'growth' },
];

const CRISIS_SIGNALS = [
  /被(?:房東|房东|室友|住處|住处).{0,6}(?:趕|赶|踢|逐出)/,
  /(?:沒地方住|没地方住|無家可歸|无家可归|流落街頭|流落街头|睡車上|睡车上|機場過夜|机场过夜)/,
  /(?:簽證|签证).{0,6}(?:到期|失效|過期|过期|取消|吊銷|吊销|被拒)/,
  /(?:不想活|活不下去|自殺|自杀|結束生命|结束生命|想死)/,
  /(?:被搶|被抢|被打|被攻擊|被攻击|仇恨犯罪|hate crime)/,
  /(?:非法|被捕|警察|驅逐|驱逐|遣返)/,
];

const PROTECTIVE_FACTORS = [
  { pattern: /(?:雙文化|双文化|跨文化|双语|雙語|双语).{0,4}(?:能力|優勢|优势|視野|视野)/, factor: 'bicultural_competence' },
  { pattern: /(?:朋友|社群|社区|支持系統|支持系统|社區|社区|教會|教会|社團|社团|同溫層|同温层)/, factor: 'community' },
  { pattern: /(?:獨立|独立|自己.{0,4}(?:解決|解决|處理|处理)|照顧自己|照顾自己)/, factor: 'independence' },
  { pattern: /(?:家人.{0,4}(?:支持|理解|關心|关心)|爸媽.{0,4}(?:支持|理解))/, factor: 'family_support' },
  { pattern: /(?:心理師|心理师|諮商|咨商|治療|治疗|counseling|therapy)/, factor: 'professional_support' },
];

const LIFE_SCENARIOS: { pattern: RegExp; scenario: string }[] = [
  { pattern: /(?:課業|课业|學業|学业|考試|考试|論文|论文|professor|教授|課程|课程|學分|学分|GPA|deadline|due)/, scenario: 'academic' },
  { pattern: /(?:工作|職場|职场|同事|主管|boss|manager|實習|实习|interview|面試|面试|加班|升職|升职)/, scenario: 'workplace' },
  { pattern: /(?:房租|房東|房东|室友|lease|租約|租约|水電|水电|押金|deposit)/, scenario: 'housing' },
  { pattern: /(?:醫生|医生|醫院|医院|看病|保險|保险|insurance|牙科|dental|急診|急诊|mental.health)/, scenario: 'medical' },
  { pattern: /(?:感情|伴侶|伴侣|分手|交往|約會|约会|crush|dating|結婚|结婚)/, scenario: 'relationship' },
  { pattern: /(?:朋友|社交|聚會|聚会|party|孤單|孤单|融入|local|外國人|外国人)/, scenario: 'social' },
  { pattern: /(?:家庭|爸媽|爸妈|父母|長輩|长辈|代溝|代沟|視訊|视频|電話|电话|回家)/, scenario: 'family' },
  { pattern: /(?:歧視|歧视|種族|种族|簽證|签证|immigration|legal|法律|身份)/, scenario: 'systemic' },
];

// ─── Main Detection ──────────────────────────────────────────────────────────

export function detectOverseasContext(text: string): OverseasContextResult {
  let migrationStage: MigrationStage = 'unknown';
  let identitySituation: IdentitySituation = 'unknown';
  let explicitLocation: string | null = null;
  const dualConstraints: DualConstraintAxis[] = [];
  const psychologicalThemes: string[] = [];
  const crisisSignals: string[] = [];
  const protectiveFactors: string[] = [];
  const lifeScenarios: string[] = [];
  let languageEmotionSignal = false;

  // Migration stage (first match wins, but more specific = better)
  for (const { pattern, stage } of STAGE_SIGNALS) {
    if (pattern.test(text)) {
      migrationStage = stage;
      break;
    }
  }

  // Identity situation
  for (const { pattern, identity } of IDENTITY_SIGNALS) {
    if (pattern.test(text)) {
      identitySituation = identity;
      break;
    }
  }

  // Explicit location only
  for (const loc of COUNTRY_SIGNALS) {
    if (text.includes(loc) || text.toLowerCase().includes(loc.toLowerCase())) {
      explicitLocation = loc;
      break;
    }
  }

  // Dual constraints
  for (const { pattern, axis } of DUAL_CONSTRAINT_SIGNALS) {
    if (pattern.test(text)) {
      dualConstraints.push(axis);
    }
  }

  // Psychological themes
  for (const { pattern, theme } of PSYCHO_THEMES) {
    if (pattern.test(text)) {
      psychologicalThemes.push(theme);
    }
  }

  // Crisis signals
  for (const pattern of CRISIS_SIGNALS) {
    if (pattern.test(text)) {
      crisisSignals.push(pattern.source);
    }
  }

  // Language-emotion signal
  if (/(?:用英文|用英語|用英语|用中文|說英文|说英文|講英文|讲英文).{0,10}(?:情緒|情绪|感受|安全|自在|真實|真实|舒服|說不出|说不出|表達|表達)/.test(text) ||
      /(?:英文|中文|語言|语言).{0,6}(?:承載|承载|距離|距离|安全|情緒|情绪)/.test(text)) {
    languageEmotionSignal = true;
  }

  // Protective factors
  for (const { pattern, factor } of PROTECTIVE_FACTORS) {
    if (pattern.test(text)) {
      protectiveFactors.push(factor);
    }
  }

  // Life scenarios
  for (const { pattern, scenario } of LIFE_SCENARIOS) {
    if (pattern.test(text)) {
      lifeScenarios.push(scenario);
    }
  }

  return {
    migrationStage,
    identitySituation,
    explicitLocation,
    dualConstraints,
    psychologicalThemes,
    reportedMicroaggressions: psychologicalThemes.filter(t => t === 'minority_stress'),
    crisisSignals,
    languageEmotionSignal,
    protectiveFactors,
    lifeScenarios,
  };
}

// ─── Output Verification ─────────────────────────────────────────────────────

interface OverseasViolation {
  id: string;
  severity: 'P0' | 'P1';
  matchedText: string;
  description: string;
}

const VERIFIER_RULES: { id: string; severity: 'P0' | 'P1'; pattern: RegExp; description: string }[] = [
  { id: 'OS-H001', severity: 'P0', pattern: /(?:你|您).{0,6}(?:一定是|肯定是|應該是|应该是|一看就是).{0,6}(?:中國人|中国人|台灣人|台湾人|華人|华人|華裔|华裔|外國人|外国人|移民|留學生|留学生)/, description: '推断国籍/身份' },
  { id: 'OS-H002', severity: 'P0', pattern: /(?:你|您).{0,6}(?:簽證|签证).{0,6}(?:一定|肯定|應該|应该|F1|J1|H1B|學生簽|学生签|工作簽|工作签)/, description: '推断签证身份' },
  { id: 'OS-H003', severity: 'P0', pattern: /(?:你們|你们|華人|华人|中國人|中国人|留學生|留学生).{0,10}(?:都|全部|一律|本來就|本来就|一定)/, description: '把海外华人当统一文化' },
  { id: 'OS-H004', severity: 'P0', pattern: /(?:文化衝擊|文化冲击|culture.shock).{0,6}(?:造成|導致|导致|引起|解釋|解释|就是).{0,10}(?:焦慮|焦虑|抑鬱|抑郁|問題|问题|生病)/, description: '把所有焦虑解释成文化冲击' },
  { id: 'OS-H005', severity: 'P0', pattern: /(?:根據|根据).{0,4}(?:美國|美国|英國|英国|加拿大|澳洲|日本).{0,6}(?:法律|移民法|簽證|签证|稅務|税务|保險|保险|醫療|医疗)/, description: '编造法律签证税务保险医疗制度' },
  { id: 'OS-H007', severity: 'P0', pattern: /(?:常設|常设|設立|设立).{0,4}(?:美國|美国|英國|英国|加拿大|澳洲).{0,4}(?:熱線|热线|危機.{0,2}專線|危机.{0,2}专线|911|000)/, description: '编造当地危机资源' },
  { id: 'OS-H008', severity: 'P1', pattern: /(?:想家|思鄉|思乡).{0,8}(?:就是|可能是|大概是|等於|等于).{0,6}(?:抑鬱|抑郁|憂鬱|忧郁|depress)/, description: '把想家自动当抑郁' },
  { id: 'OS-H009', severity: 'P1', pattern: /(?:語言|语言|英文|中文|口音).{0,8}(?:不好|差|能力低|不行|不夠|不够|問題|问题)/, description: '把语言困难当能力低' },
  { id: 'OS-H010', severity: 'P1', pattern: /(?:華人|华人|中國|中国|亞洲|亚洲).{0,4}(?:家庭|父母|爸媽|爸妈).{0,8}(?:傳統|传统|控制|權威|权威|壓抑|压抑|權威|权威)/, description: '把华人家庭都说成传统控制' },
  { id: 'OS-H019', severity: 'P1', pattern: /(?:中英混雜|中英夹杂|中英混用|code.switch).{0,8}(?:不好|不對|不对|奇怪|能力|不足|缺點|缺点)/, description: '中英混用当语言不足' },
  { id: 'OS-H020', severity: 'P1', pattern: /(?:既然|都已經|都已经).{0,4}(?:出國|出国|出去|留學|留学|移民).{0,8}(?:還|还|怎麼|为什么|為什麼).{0,8}(?:難受|难受|痛苦|不開心|不开心|抱怨|不滿|不满)/, description: '用既然出国弱化痛苦' },
  { id: 'OS-H021', severity: 'P1', pattern: /(?:回國|回国|回去).{0,8}(?:解決|解决|比較好|比较好|就.{0,4}(?:好|沒事|没事)|一切.{0,4}(?:好|解決|解决))/, description: '把回国当默认解决' },
  { id: 'OS-H022', severity: 'P1', pattern: /(?:留下|待在|留在).{0,8}(?:成功|勇敢|正確|正确|好|對|对|厲害|厉害)|(?:回國|回国).{0,8}(?:失敗|失败|退縮|退缩|放棄|放弃)/, description: '把留下当成功/回国当失败' },
  { id: 'OS-H023', severity: 'P1', pattern: /(?:他|她|他們|他们|同學|同学|朋友|房東|房东|教授|同事).{0,6}(?:沒有惡意|没有恶意|不是故意|只是.{0,4}(?:關心|好奇|習慣|习惯)|沒什麼|没什么)/, description: '微冒犯后辩解没恶意' },
];

export function verifyOverseasOutput(output: string): {
  violations: OverseasViolation[];
  hasP0: boolean;
  hasP1: boolean;
} {
  const violations: OverseasViolation[] = [];
  for (const rule of VERIFIER_RULES) {
    const match = output.match(rule.pattern);
    if (match) {
      violations.push({
        id: rule.id,
        severity: rule.severity,
        matchedText: match[0],
        description: rule.description,
      });
    }
  }
  return {
    violations,
    hasP0: violations.some(v => v.severity === 'P0'),
    hasP1: violations.some(v => v.severity === 'P1'),
  };
}

// ─── Quick Check ─────────────────────────────────────────────────────────────

export function hasOverseasContent(text: string): boolean {
  const lower = text.toLowerCase();
  const quickPatterns = [
    /出國|出国|留學|留学|國外|国外|海外|境外/,
    /簽證|签证|護照|护照|immigrant|visa|passport/,
    /回國|回国|回去|返國|返国/,
    /華人|华人|華裔|华裔|ABC|BBC|CBC/,
    /英文|英語|英语|bilingual|雙語|双语/,
    /culture.shock|文化衝擊|文化冲击|跨文化/,
    /想家|思鄉|思乡|無根|无根|歸屬感|归属感/,
    /留學生|留学生|交換生|交换生|博士班/,
    /國外|国外.{0,4}(?:讀書|读书|工作|生活|居住)/,
    /在.{0,4}(?:美國|美国|英國|英国|加拿大|澳洲|日本|韓國|韩国|新加坡|歐洲|欧洲)/,
  ];
  return quickPatterns.some(p => p.test(text));
}

// ─── Prompt Context ──────────────────────────────────────────────────────────

export function buildOverseasPromptBlock(
  result: OverseasContextResult,
  role: 'xiaoku' | 'xiaoxue',
): string {
  const lines: string[] = [];
  lines.push('【海外华人/留学语境适配层 v1.0】');

  if (result.migrationStage !== 'unknown') {
    lines.push(`迁移阶段: ${result.migrationStage}`);
  }
  if (result.identitySituation !== 'unknown') {
    lines.push(`身份情境: ${result.identitySituation}`);
  }
  if (result.explicitLocation) {
    lines.push(`用户明确提到的地区: ${result.explicitLocation}`);
  }
  if (result.dualConstraints.length > 0) {
    lines.push(`双重约束: ${result.dualConstraints.join(', ')}`);
  }
  if (result.psychologicalThemes.length > 0) {
    lines.push(`心理主题: ${result.psychologicalThemes.join(', ')}`);
  }
  if (result.lifeScenarios.length > 0) {
    lines.push(`生活场景: ${result.lifeScenarios.join(', ')}`);
  }
  if (result.languageEmotionSignal) {
    lines.push('语言-情绪信号: 用户提到不同语言承载不同情绪安全感');
  }

  lines.push('');

  if (role === 'xiaoku') {
    lines.push('小酷心理支持指引：');
    lines.push('- 不把所有问题文化化；先看用户真实的心理议题，文化只是背景之一');
    lines.push('- 理解双重约束：留下/回去、独立/孝顺、融入/保留、成功/困难可以同时存在');
    lines.push('- 不用"既然出国了就..."弱化痛苦；不把回国当失败、留下当成功');
    lines.push('- 理解语言与情绪的关系：用英文说情绪可能更安全，不代表中文能力不足');
    lines.push('- 想家、孤独、无根感是真实的体验，不自动等同抑郁或疾病');
    lines.push('- 不同华人地区（大陆/台湾/香港/东南亚等）经验不同，不混为一谈');
    lines.push('- 第二代和留学生经验不同，不混为一谈');
    lines.push('- 用户倾诉时优先共情，不急着推荐资源');
  } else {
    lines.push('小雪行政友善指引：');
    lines.push('- 理解留学/海外行政用词、时区和语言偏好');
    lines.push('- 可收集国家/城市/时区/语言偏好（用户自愿提供）');
    lines.push('- 不是移民、法律、税务、保险、学校政策专家；这些事实必须verified');
    lines.push('- 不编造签证、法律、税务、保险、医疗制度信息');
    lines.push('- 行政需求收集不是心理咨询，不分析文化适应问题');
  }

  lines.push('');
  lines.push('【铁律】');
  lines.push('1. 不推断国籍、签证身份、移民代际、阶层、政治立场');
  lines.push('2. 国家/城市只有用户明确提到时才可作上下文，不假设');
  lines.push('3. 不把海外华人当统一文化群体');
  lines.push('4. 不把所有焦虑解释成文化冲击');
  lines.push('5. 不编造签证/法律/税务/保险/医疗/学校政策/当地危机资源');
  lines.push('6. 不把想家自动当抑郁、语言困难当能力低、中英混用当不足');
  lines.push('7. 不用"既然出国了"弱化痛苦，不把回国当默认解决或失败');
  lines.push('8. 四角色宪法（DECISION-ROLE-001）优先级高于本层');
  lines.push('9. 危机信号（被赶出住处/签证危机/自伤）立即触发危机流程');

  return lines.join('\n');
}
