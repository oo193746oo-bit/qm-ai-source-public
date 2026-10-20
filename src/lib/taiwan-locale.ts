/**
 * Taiwan Locale Context Engine v3.0 (Fixed Implementation)
 * 
 * Based on: QM_AI_Coze_台湾语境智能算法检索推荐与自查部署_v3.0
 * 
 * Key principles:
 * - Detects language/cultural context preference, NEVER nationality
 * - Traditional script alone is NOT sufficient for Taiwan mode
 * - Simplified script is NEVER negative evidence against Taiwan
 * - Explicit user preference is highest priority and sticky
 * - Role governance (DECISION-ROLE-001) always overrides locale
 * - Language layer ≠ fact layer (no institutional facts from locale)
 * 
 * Bugs fixed from v3.0 spec code:
 * - mixed_zh mode now actually returned
 * - hysteresis (3-round low-confidence exit) implemented
 * - script detection includes 'mixed'
 * - sticky mode can be overridden by new explicit preference
 * - turnScore validated (was unused)
 * - initial state handling for first turn
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type LocaleMode =
  | 'neutral_zh'
  | 'taiwan_soft'
  | 'taiwan_context'
  | 'taiwan_context_simplified_output'
  | 'mixed_zh'
  | 'mainland_soft'
  | 'mainland_context';

export type ScriptType = 'simplified' | 'traditional' | 'mixed';
export type Confidence = 'low' | 'medium' | 'high';

export interface LocaleState {
  mode: LocaleMode;
  sessionScore: number;
  confidence: Confidence;
  sticky: 'taiwan' | 'mainland' | null;
  signalFamilies: string[];
  /** Consecutive low-confidence turns for hysteresis exit */
  lowConfidenceCount: number;
  /** Last turn score for hysteresis */
  lastTurnScore: number;
}

export interface LocaleDetectionResult {
  state: LocaleState;
  /** Detected script type */
  script: ScriptType;
  /** Signals found in current turn */
  signals: {
    taiwanInstitutions: string[];
    taiwanLifeContext: string[];
    taiwanLexicon: string[];
    taiwanPragmatics: string[];
    mainlandContext: string[];
    explicitPreference: 'taiwan' | 'mainland' | null;
  };
  /** Turn score before session blending */
  turnScore: number;
  /** Whether this turn has mixed strong signals */
  hasMixedSignals: boolean;
}

// ─── Initial State ───────────────────────────────────────────────────────────

export function createInitialLocaleState(): LocaleState {
  return {
    mode: 'neutral_zh',
    sessionScore: 0,
    confidence: 'low',
    sticky: null,
    signalFamilies: [],
    lowConfidenceCount: 0,
    lastTurnScore: 0,
  };
}

// ─── Script Detection ────────────────────────────────────────────────────────

/** Characters that differ between simplified and traditional Chinese */
const T2S_SINGLE: Record<string, string> = {
'預':'预','約':'约','費':'费','價':'价','錢':'钱','時':'时','間':'间',
  '聯':'联','繫':'系','諮':'咨','詢':'询','線':'线','報':'报','導':'导',
  '構':'构','機':'机','療':'疗','診':'诊','藥':'药','醫':'医','師':'师',
  '臨':'临','床':'床','關':'关','係':'系','電':'电','腦':'脑','軟':'软',
  '體':'体','網':'网','路':'路','貼':'贴','文':'文','按':'按','讚':'赞',
  '賣':'卖','場':'场','儲':'储','值':'值','宅':'宅','配':'配','貨':'货',
  '學':'学','測':'测','分':'分','科':'科','專':'专','題':'题','主':'主',
  '管':'管','特':'特','休':'休','終':'终','年':'年','租':'租','屋':'屋',
  '通':'通','勤':'勤','數':'数','位':'位','內':'内','容':'容','個':'个',
  '麼':'么','這':'这','嗎':'吗','對':'对','說':'说','會':'会','能':'能',
  '還':'还','過':'过','給':'给','裡':'里','後':'后','從':'从','來':'来',
  '沒':'没','壞':'坏','好':'好','樣':'样','請':'请','問':'问','謝':'谢',
  '記':'记','錄':'录','號':'号','碼':'码','帳':'账','務':'务','處':'处',
  '理':'理','變':'变','當':'当','應該':'应该','確':'确','實':'实','認':'认',
  '識':'识','經':'经','驗':'验','議':'议','論':'论','習':'习','慣':'惯',
  '態':'态','壓':'压','力':'力','懷':'怀','繼':'继','續':'续','於':'于',
  '優':'优','點':'点','質':'质','與':'与','其':'其','將':'将','產':'产',
  '達':'达','標':'标','準':'准','條':'条','頁':'页','類':'类','種':'种',
  '稱':'称','謂':'谓','術':'术','語':'语','詞':'词','匯':'汇','繁':'繁',
  '簡':'简','轉':'转','換':'换','檢':'检','查':'查','試':'试','維':'维',
  '護':'护','設':'设','備':'备','環':'环','境':'境','權':'权','限':'限',
  '規':'规','則':'则','決':'决','策':'策','層':'层','級':'级','結':'结',
  '邏':'逻','輯':'辑','算':'算','法':'法','錯':'错','誤':'误','回':'回',
  '歸':'归','進':'进','度':'度','告':'告','總':'总','監':'监','控':'控',
  '視':'视','覺':'觉','節':'节','奏':'奏','風':'风','險':'险','製':'制',
  '身':'身','局':'局','掛':'挂','健':'健','保':'保','自':'自','所':'所',
  '院':'院','人':'人','員':'员','家':'家','庭':'庭','輩':'辈','共':'共',
  '居':'居','催':'催','婚':'婚','孝':'孝','道':'道','面':'面','子':'子',
  '另':'另','一':'一','半':'半','照':'照','顧':'顾','責':'责','任':'任',
  '程':'程','式':'式','動':'动','拍':'拍','取':'取','班':'班','勞':'劳',
  '青':'青','絡':'络','車':'车','超':'超','商':'商','發':'发','票':'票',
  '戶':'户','政':'政','鄰':'邻','垃':'垃','圾':'圾','證':'证','教':'教',
  '育':'育','考':'考','職':'职','制':'制','心':'心','精':'精','神':'神',
  '晤':'晤','談':'谈','督':'督','介':'介','求':'求','助':'助','污':'污',
  '名':'名','第':'第','次':'次','出':'出','櫃':'柜','伴':'伴','侶':'侣',
  '友':'友','善':'善','呼':'呼','舊':'旧','接':'接','受':'受','校':'校',
  '園':'园','緩':'缓','和':'和','客':'客','氣':'气','協':'协','拒':'拒',
  '絕':'绝','不':'不','同':'同','意':'意','歉':'歉','距':'距','離':'离',
  '積':'极','化':'化','判':'判','糾':'纠','正':'正','更':'更','新':'新',
  '立':'立','即':'即','停':'停','止':'止','刻':'刻','模':'模','仿':'仿',
  '偏':'偏','見':'见','印':'印','象':'象','捷':'捷','運':'运','蠻':'蛮',
  '的':'的','耶':'耶','齁':'齁','欸':'欸','啦':'啦','喔':'喔','嘛':'嘛',
  '唷':'唷','喲':'哟','吖':'吖','嘞':'嘞','著':'着','區':'区','應':'应',
  '該':'该','業':'业',
};

// Simplified-only characters (if present, indicates simplified input)
const SIMPLIFIED_MARKERS = new Set([
  '预','约','费','价','钱','时','间','联','系','咨','询','线','报','导',
  '构','机','疗','诊','药','医','师','临','关','电','脑','软','体','网',
  '贴','赞','卖','场','储','学','测','专','题','务','处','变','当','应',
  '该','确','实','认','识','经','验','议','论','习','惯','态','压','怀',
  '继','续','于','优','点','质','与','将','产','达','标','准','条','类',
  '种','称','谓','术','语','汇','转','换','检','维','设','备','环','权',
  '规','则','决','策','层','级','结','逻','辑','错','误','归','进','总',
  '监','视','觉','风','险','制','庭','辈','区','内','员','责','顾','络',
  '车','业','户','证','职','柜','侣','气','绝','蛮','着','么','这','还',
  '里','后','从','对','说','请','谢','历','惯','压','怀','续','处','于',
]);

// Traditional-only characters (if present, indicates traditional input)
const TRADITIONAL_MARKERS = new Set([
  '預','約','費','價','錢','時','間','聯','繫','諮','詢','線','報','導',
  '構','機','療','診','藥','醫','師','臨','關','電','腦','軟','體','網',
  '貼','讚','賣','場','儲','學','測','專','題','務','處','變','當','應',
  '該','確','實','認','識','經','驗','議','論','習','慣','態','壓','懷',
  '繼','續','於','優','點','質','與','將','產','達','標','準','條','類',
  '種','稱','謂','術','語','匯','轉','換','檢','維','設','備','環','權',
  '規','則','決','策','層','級','結','邏','輯','錯','誤','歸','進','總',
  '監','視','覺','風','險','製','療','體','藥','關','庭','輩','區','內',
  '員','責','顧','絡','車','業','戶','證','職','櫃','侶','氣','絕','蠻',
  '著','麼','這','還','裡','後','從','對','說','請','謝','歷','慣','壓',
  '懷','續','處','於','優','點','質','將','產','達','標','準','條','類',
  '種','稱','謂','術','語','匯','轉','換','檢','維','設','備','環','權',
  '規','則','決','策','層','級','構','邏','輯','錯','誤','歸','進','總',
  '監','控','視','覺','風','險','製','療','體','藥','關','庭','輩','務',
  '實','確','當','內','員','責','顧','絡','車','業','戶','證','職','詢',
  '櫃','侶','氣','絕','蠻','著','麼','還','裡','從','對','請','謝','認',
  '經','議','慣','壓','懷','繼','續','處','於','優','點','質','將','產',
  '達','標','準','條','類','種','稱','術','語','轉','換','檢','維','護',
  '設','備','環','境','權','限','規','則','決','策','層','級','結','構',
  '邏','輯','錯','誤','歸','進','度','總','結','監','控','視','覺','風',
  '險','機','製','度','醫','療','身','體','藥','局','掛','號','回','診',
  '健','保','自','費','診','所','醫','院','護','理','人','員','關','懷',
  '係','家','庭','長','輩','共','居','催','婚','孝','道','面','子','另',
  '一','半','照','顧','責','任','網','路','軟','體','程','式','貼','文',
  '限','時','動','態','按','讚','網','拍','賣','場','儲','值','宅','配',
  '取','貨','學','測','分','科','學','分','專','題','班','導','主','管',
  '特','休','勞','健','保','年','終','租','屋','通','勤','青','年','網',
  '絡','詞','語','機','車','超','商','發','票','勞','戶','政','裡','鄰',
  '垃','圾','車','電','子','票','證','教','育','考','試','職','場','制',
  '度','心','理','諮','商','臨','床','心','理','師','身','心','科','精',
  '神','科','晤','談','督','導','轉','介','求','助','污','名','第','一',
  '次','諮','詢','出','櫃','伴','侶','友','善','稱','呼','舊','名','家',
  '庭','接','受','校','園','職','場','醫','療','求','助','緩','和','客',
  '氣','協','商','拒','絕','不','同','意','道','歉','請','求','關','係',
  '距','離','積','極','體','化','誤','判','糾','正','更','新','立','即',
  '停','止','刻','意','模','仿','偏','見','印','象','糾','正','機','車',
  '超','商','身','心','科','學','測','勞','健','保','捷','運','發','票',
  '戶','政','電','子','票','證','網','路','軟','體','程','式','貼','文',
  '限','時','動','態','按','讚','網','拍','賣','場','儲','值','宅','配',
  '取','貨','心','理','諮','商','臨','床','身','心','科','精','神','科',
  '掛','號','回','診','晤','談','督','導','轉','介','出','櫃','伴','侶',
  '舊','名','緩','和','客','氣','協','商','拒','絕','道','歉','距','離',
  '蠻','的','耶','齁','欸','啦','喔','嘛','唷','喲','著','沒','錯','問',
  '題','麼','這','個','還','會','過','給','裡','後','從','來','對','說',
  '請','謝','認','識','經','驗','議','論','習','慣','態','壓','懷','繼',
  '續','處','於','優','點','質','與','將','產','達','標','準','條','頁',
  '類','種','稱','謂','術','語','匯','繁','簡','轉','換','檢','查','測',
  '試','維','護','設','備','環','境','權','限','規','則','約','條','決',
  '策','層','級','結','構','邏','輯','算','法','錯','誤','檢','測','試',
  '回','歸','記','錄','進','度','報','告','總','結','監','控','視','覺',
  '節','奏','風','險','機','製','度','醫','療','身','體','藥','局','關',
  '懷','係','家','庭','長','輩','區','務','實','確','當','應','該','內',
  '員','責','顧','絡','車','業','戶','證','職','詢','櫃','侶','氣','絕',
]);

export function detectScript(text: string): ScriptType {
  let tradCount = 0;
  let simpCount = 0;
  for (const ch of text) {
    if (TRADITIONAL_MARKERS.has(ch) && !SIMPLIFIED_MARKERS.has(ch)) tradCount++;
    if (SIMPLIFIED_MARKERS.has(ch) && !TRADITIONAL_MARKERS.has(ch)) simpCount++;
  }
  if (tradCount > 0 && simpCount > 0) return 'mixed';
  if (tradCount > simpCount) return 'traditional';
  if (simpCount > tradCount) return 'simplified';
  // No distinctive markers found - default based on common characters
  return 'simplified';
}

// ─── Signal Detection ────────────────────────────────────────────────────────

/** Taiwan institutional/life words (strong signal) */
const TAIWAN_INSTITUTIONS = [
  // 交通
  '捷運','機車','悠遊卡','一卡通','icash','高鐵','台鐵','國道',
  // 生活
  '超商','7-11','7-eleven','全家','萊爾富','ok超商','便利商店',
  '發票','樂透','彩券','家樂福','全聯','頂好','松青',
  // 醫療制度
  '健保','勞健保','健保卡','部分負擔','轉診','家醫科',
  '身心科','精神科','諮商心理師','臨床心理師','心理諮商',
  '掛號','回診','複診','藥局','藥局','慢籤','處方籤',
  // 行政
  '戶政','戶政事務所','里長','里辦','健保署','國稅局',
  '監理站','區公所','1999',
  // 教育
  '學測','分科測驗','指考','學測','國中','國小','高中職',
  '五專','二技','四技','學分','班導','導師','學務處',
  // 职场
  '勞工','特休','資遣','資遣費','勞退','勞保','投保薪資',
  // 数字网络
  '網路','軟體','程式','貼文','限時動態','動態時報','按讚',
  '網拍','賣場','儲值','宅配','超取','店到店','冷氣房',
  // 其他
  '垃圾車','資源回收','廚餘','電子發票','載具','歸戶',
  '第三公職','里鄰','社區管理','管委會',
];

/** Taiwan life context words (medium signal) */
const TAIWAN_LIFE_CONTEXT = [
  '夜市','菜市场','黃昏市場','菜市場','豆漿','蛋餅','飯糰',
  '珍珠奶茶','手搖飲','鹹酥雞','滷味','牛肉麵','小籠包',
  '便當','自助餐','熱炒','冰店','手搖','珍奶','搖搖飲',
  '寄車','停車格','紅線','黃線','拖吊','測速照相',
  '跨年','101煙火','燈會','鹽水蜂炮','炸寒單','媽祖繞境',
  '過年','清明','端午','中秋','初九','拜天公','普渡',
  '便當店','影印店','文具店','五金行','西藥房',
  '夾娃娃','娃娃機','選物販賣機','大同電鍋','聲寶',
  '第四台','有線電視','MOD','數位機上盒',
  '簽約','綁約','違約金','預繳','試用期',
];

/** Taiwan lexicon / vocabulary differences (weaker signal) */
const TAIWAN_LEXICON = [
  // Pronouns/particles
  '蠻','蠻的','耶','齁','欸','啦','喔','嘛','唷','喲',
  '著','沒錯','這個','那個','哪顆','幾樓',
  // Words
  '專案','軟體','程式','資訊','數位','類比','視窗','檔案',
  '資料夾','滑鼠','鍵盤','螢幕','印表機','數據','數據機',
  '網頁','網址','瀏覽器','搜尋','引擎','伺服器','網域',
  '資安','隱私','個資','資訊安全',
  // Common word differences
  '品質','水準','優質','平價','高價','划算','超值',
  '親切','熱心','隨和','客氣','低調','務實',
  '頗','挺','蠻','超','真的','整個','完全',
  '打錯','搞錯','弄錯','看錯','聽錯',
  '考慮','思考','想想','評估','規劃','計畫',
  '了解','理解','明白','懂','知道','清楚',
  '連絡','聯絡','聯繫','溝通','協調',
  '處理','解決','應對','面對','負責',
  '關心','在意','在乎','擔心','緊張',
  '輕鬆','自在','舒服','自然','踏實',
  // Admin/business
  '報名','繳費','繳款','付款','匯款','轉帳',
  '預約','預定','登記','排定','安排',
  '服務','協助','幫忙','處理','回覆',
  '問題','狀況','情形','狀態','進度',
  '方案','選擇','選項','方式','辦法',
  '時段','區間','時間','日期','場次',
  '地點','地址','位置','會場','現場',
  '費用','價格','金額','預算','負擔',
  '確認','核對','驗證','查詢',
];

/** Taiwan pragmatics / interaction style (weakest signal) */
const TAIWAN_PRAGMATICS = [
  '不好意思','請問一下','請教','麻煩','打擾',
  '沒關係','不要緊','沒事','不會',
  '這樣子','是不是','對不對','好不好',
  '可以嗎','方便嗎','OK嗎','ok嗎',
  '真的假的','好大膽','好扯','誇張',
  '是喔','對啊','沒錯','就是說',
  '還好','普通','還行','可以接受',
  '再看看','再說','考慮一下','想想',
  '辛苦了','謝謝','感恩','多謝',
  '拍謝','失禮','歹勢',
  '呷飽','顧身體','早點睡',
];

/** Mainland China specific context (negative signal) */
const MAINLAND_CONTEXT = [
  // 交通
  '地铁','公交','共享单车','滴滴','高铁','和谐号','复兴号',
  // 生活
  '快递','外卖','美团','饿了么','大众点评','拼多多','淘宝',
  '京东','支付宝','微信支付','扫码','二维码','健康码',
  '居委会','社区','街道办','派出所','公安局',
  // 医疗
  '医保','社保','新农合','三甲医院','挂号费','主任医师',
  '心理咨询师','心理医生','精神科医生','卫生服务中心',
  // 教育/职场
  '高考','考研','考公','公务员','事业编','辅导员','班主任',
  '985','211','双一流','本科','专科','高职',
  '五险一金','公积金','养老金','年假','三薪',
  // 数字网络
  '软件','程序','贴子','朋友圈','视频号','点赞',
  '网店','店铺','充值','快递','送货上门','包邮',
  // 行政
  '身份证','户口本','暂住证','居住证','驾驶证',
  '车管所','社保局','税务局','政务中心',
];

/**
 * Detect Taiwan-specific signals in text.
 * Returns found terms grouped by signal family.
 */
export function detectTaiwanSignals(text: string): {
  taiwanInstitutions: string[];
  taiwanLifeContext: string[];
  taiwanLexicon: string[];
  taiwanPragmatics: string[];
  mainlandContext: string[];
} {
  const lower = text.toLowerCase();
  const findMatches = (words: string[]): string[] => {
    const found: string[] = [];
    for (const w of words) {
      if (lower.includes(w.toLowerCase())) found.push(w);
    }
    return found;
  };

  return {
    taiwanInstitutions: findMatches(TAIWAN_INSTITUTIONS),
    taiwanLifeContext: findMatches(TAIWAN_LIFE_CONTEXT),
    taiwanLexicon: findMatches(TAIWAN_LEXICON),
    taiwanPragmatics: findMatches(TAIWAN_PRAGMATICS),
    mainlandContext: findMatches(MAINLAND_CONTEXT),
  };
}

/** Explicit preference patterns */
const TAIWAN_EXPLICIT = [
  '請用台灣','用台灣','台灣用語','台灣說法','台灣用詞',
  '請用台湾','用台湾','台湾用语','台湾说法','台湾用词',
  '不要用大陸','不要用大陆','別用大陸','别用大陆',
  '台灣腔','台湾腔','請講繁體','请讲繁体',
  '我習慣台灣','我习惯台湾',
];

const MAINLAND_EXPLICIT = [
  '請用大陸','用大陸','大陸用語','大陸說法','大陸用詞',
  '请用大陆','大陆用语','大陆说法','大陆用词',
  '不要用台灣','不要用台湾','別用台灣','别用台湾',
  '大陸腔','大陆腔','請用簡體','请用简体',
  '我習慣大陸','我习惯大陆',
];

const STOP_TAIWAN = [
  '不要用台灣','不要用台湾','別用台灣','别用台湾',
  '不要再用台灣','不要再用台湾',
  '不要台灣腔','不要台湾腔',
  '不用台灣','不用台湾',
];

export function detectExplicitPreference(text: string): 'taiwan' | 'mainland' | null {
  for (const p of STOP_TAIWAN) {
    if (text.includes(p)) return 'mainland';
  }
  for (const p of TAIWAN_EXPLICIT) {
    if (text.includes(p)) return 'taiwan';
  }
  for (const p of MAINLAND_EXPLICIT) {
    if (text.includes(p)) return 'mainland';
  }
  return null;
}

// ─── Scoring Engine ──────────────────────────────────────────────────────────

const WEIGHTS = {
  taiwanInstitutionEach: 18,
  taiwanInstitutionCap: 54,
  taiwanLifeEach: 12,
  taiwanLifeCap: 36,
  taiwanLexiconEach: 8,
  taiwanLexiconCap: 32,
  taiwanPragmaticsEach: 4,
  taiwanPragmaticsCap: 16,
  traditionalScript: 3,
  simplifiedScript: 0,
  mainlandEach: -10,
  mainlandCap: -40,
};

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function sumCapped(count: number, each: number, cap: number): number {
  return Math.min(count * each, cap);
}

/**
 * Calculate turn score from detected signals.
 * Returns score clamped to [-100, 100].
 */
export function calculateTurnScore(
  signals: ReturnType<typeof detectTaiwanSignals>,
  script: ScriptType,
): number {
  let score = 0;

  // Taiwan signals (positive)
  score += sumCapped(signals.taiwanInstitutions.length, WEIGHTS.taiwanInstitutionEach, WEIGHTS.taiwanInstitutionCap);
  score += sumCapped(signals.taiwanLifeContext.length, WEIGHTS.taiwanLifeEach, WEIGHTS.taiwanLifeCap);
  score += sumCapped(signals.taiwanLexicon.length, WEIGHTS.taiwanLexiconEach, WEIGHTS.taiwanLexiconCap);
  score += sumCapped(signals.taiwanPragmatics.length, WEIGHTS.taiwanPragmaticsEach, WEIGHTS.taiwanPragmaticsCap);

  // Script signal (very weak)
  if (script === 'traditional') score += WEIGHTS.traditionalScript;
  // simplified: 0, NEVER negative

  // Mainland signals (negative)
  score += Math.max(signals.mainlandContext.length * WEIGHTS.mainlandEach, WEIGHTS.mainlandCap);

  return clamp(score, -100, 100);
}

// ─── State Update (Fixed v3.0) ───────────────────────────────────────────────

/**
 * Update locale state based on new turn.
 * 
 * Fixes from spec code:
 * 1. mixed_zh mode now actually returned (was declared but never used)
 * 2. Hysteresis: strong mode requires 3 consecutive low-confidence turns to exit
 * 3. Sticky mode can be overridden by NEW explicit preference in opposite direction
 * 4. First-turn handling (prev neutral with score 0)
 * 5. Script 'mixed' properly handled
 */
export function updateLocaleState(
  prev: LocaleState,
  turnScore: number,
  families: string[],
  script: ScriptType,
  explicit?: 'taiwan' | 'mainland' | null,
): LocaleState {
  // ── Explicit preference: highest priority ──
  if (explicit === 'taiwan') {
    return {
      mode: script === 'simplified' ? 'taiwan_context_simplified_output' : 'taiwan_context',
      sessionScore: 100,
      confidence: 'high',
      sticky: 'taiwan',
      signalFamilies: ['explicit'],
      lowConfidenceCount: 0,
      lastTurnScore: turnScore,
    };
  }
  if (explicit === 'mainland') {
    return {
      mode: 'mainland_context',
      sessionScore: -100,
      confidence: 'high',
      sticky: 'mainland',
      signalFamilies: ['explicit'],
      lowConfidenceCount: 0,
      lastTurnScore: turnScore,
    };
  }

  // ── Sticky preference: persists unless new explicit overrides ──
  if (prev.sticky) {
    // User had a sticky preference and no new explicit signal
    // Keep sticky state, but update signal families for visibility
    return {
      ...prev,
      signalFamilies: families.length > 0 ? families : prev.signalFamilies,
      lastTurnScore: turnScore,
    };
  }

  // ── Normal scoring ──
  // First turn: prev score is 0 (neutral), give turn score more weight
  const isFirstTurn = prev.sessionScore === 0 && prev.signalFamilies.length === 0;
  const blend = isFirstTurn ? turnScore : 0.60 * prev.sessionScore + 0.40 * turnScore;
  const score = clamp(blend, -100, 100);

  const n = new Set(families).size;
  const hasTaiwan = families.some(f => f.startsWith('taiwan_'));
  const hasMainland = families.includes('mainland_context');

  // ── Mixed mode: both strong signals present ──
  if (hasTaiwan && hasMainland) {
    return {
      mode: 'mixed_zh',
      sessionScore: score,
      confidence: n >= 3 ? 'high' : 'medium',
      sticky: null,
      signalFamilies: families,
      lowConfidenceCount: 0,
      lastTurnScore: turnScore,
    };
  }

  // ── Determine mode from score ──
  let mode: LocaleMode = 'neutral_zh';

  if (score >= 45 && n >= 2) {
    mode = script === 'simplified' ? 'taiwan_context_simplified_output' : 'taiwan_context';
  } else if (score >= 25) {
    mode = 'taiwan_soft';
  } else if (score <= -45 && n >= 2) {
    mode = 'mainland_context';
  } else if (score <= -25) {
    mode = 'mainland_soft';
  }

  // ── Hysteresis: prevent rapid mode switching ──
  // If we're in a strong mode but current turn is low confidence,
  // require 3 consecutive low-confidence turns before exiting
  const wasStrongTaiwan = prev.mode === 'taiwan_context' || prev.mode === 'taiwan_context_simplified_output';
  const wasStrongMainland = prev.mode === 'mainland_context';
  const isLowConfidence = n < 2;

  if ((wasStrongTaiwan || wasStrongMainland) && isLowConfidence) {
    const newCount = prev.lowConfidenceCount + 1;
    if (newCount < 3) {
      // Stay in previous strong mode
      return {
        ...prev,
        lowConfidenceCount: newCount,
        lastTurnScore: turnScore,
        signalFamilies: families,
      };
    }
    // 3 consecutive low-confidence turns: exit to soft/neutral
    if (wasStrongTaiwan) {
      mode = score >= 25 ? 'taiwan_soft' : 'neutral_zh';
    } else {
      mode = score <= -25 ? 'mainland_soft' : 'neutral_zh';
    }
  }

  const confidence: Confidence = n >= 3 ? 'high' : n >= 2 ? 'medium' : 'low';

  return {
    mode,
    sessionScore: score,
    confidence,
    sticky: null,
    signalFamilies: families,
    lowConfidenceCount: isLowConfidence ? prev.lowConfidenceCount + 1 : 0,
    lastTurnScore: turnScore,
  };
}

// ─── Main Detection Entry Point ──────────────────────────────────────────────

/**
 * Detect locale context from user text and previous state.
 * This is the main function to call from API routes.
 */
export function detectLocaleContext(
  text: string,
  prevState?: LocaleState | null,
): LocaleDetectionResult {
  const prev = prevState ?? createInitialLocaleState();
  const script = detectScript(text);
  const signals = detectTaiwanSignals(text);
  const explicit = detectExplicitPreference(text);
  const turnScore = calculateTurnScore(signals, script);

  // Build signal family list
  const families: string[] = [];
  if (signals.taiwanInstitutions.length > 0) families.push('taiwan_institution');
  if (signals.taiwanLifeContext.length > 0) families.push('taiwan_life');
  if (signals.taiwanLexicon.length > 0) families.push('taiwan_lexicon');
  if (signals.taiwanPragmatics.length > 0) families.push('taiwan_pragmatics');
  if (signals.mainlandContext.length > 0) families.push('mainland_context');

  const hasMixedSignals = families.some(f => f.startsWith('taiwan_')) && families.includes('mainland_context');

  const state = updateLocaleState(prev, turnScore, families, script, explicit);

  return {
    state,
    script,
    signals: {
      ...signals,
      explicitPreference: explicit,
    },
    turnScore,
    hasMixedSignals,
  };
}

// ─── Prompt Context Generation ───────────────────────────────────────────────

/**
 * Generate a locale context block for injection into system prompts.
 * This block instructs the LLM on how to handle the detected locale.
 * It NEVER overrides role governance.
 */
export function buildLocalePromptBlock(result: LocaleDetectionResult): string {
  const { state, script, hasMixedSignals } = result;
  const lines: string[] = [];

  lines.push('【台湾语境适配层 v3.0】');
  lines.push(`语境模式: ${state.mode}`);
  lines.push(`字形: ${script}`);
  lines.push(`置信度: ${state.confidence}`);
  lines.push('');

  // Mode-specific instructions
  switch (state.mode) {
    case 'taiwan_context':
    case 'taiwan_context_simplified_output':
      lines.push('用户当前对话呈现台湾中文语境。请：');
      lines.push('- 自然理解并使用台湾常用词汇（如：諮商、身心科、捷運、超商、網路、軟體等）');
      lines.push('- 用户使用简体时，你可以保持简体输出，但用词和理解应贴合台湾语境');
      lines.push('- 调整沟通节奏：较缓和、客气、协商式，避免命令式语气');
      lines.push('- 理解台湾心理健康体系用词：諮商心理師、臨床心理師、身心科、掛號、回診等');
      if (state.mode === 'taiwan_context_simplified_output') {
        lines.push('- 用户偏好简体输出：请保持简体字，但使用台湾语境用词');
      }
      break;

    case 'taiwan_soft':
      lines.push('用户对话中出现部分台湾用语。请：');
      lines.push('- 自然理解台湾词汇，不需要刻意切换用词');
      lines.push('- 镜像用户用词，不主动强化地区化');
      lines.push('- 保持中性中文，跟随用户自己的表达方式');
      break;

    case 'mixed_zh':
      lines.push('用户对话中混合了台湾和大陆用语。请：');
      lines.push('- 允许两岸用词并存，不强制单一标签');
      lines.push('- 按当前话题动态选择用词，跟随用户当下的表达');
      lines.push('- 不纠正用户用词，不假设地区身份');
      break;

    case 'mainland_context':
    case 'mainland_soft':
      lines.push('用户当前对话呈现大陆中文语境。请：');
      lines.push('- 使用大陆常用词汇');
      lines.push('- 自然沟通，不刻意加入台湾用语');
      break;

    case 'neutral_zh':
    default:
      lines.push('用户未呈现明显地区语境偏好。请：');
      lines.push('- 使用中性中文');
      lines.push('- 跟随用户自己的用词和表达节奏');
      break;
  }

  lines.push('');
  lines.push('【铁律】');
  lines.push('1. 本层只影响语言理解和表达风格，不影响QM业务事实（费用/地址/时间/预约/到访规则）');
  lines.push('2. 不推断用户国籍、族群、政治身份、户籍');
  lines.push('3. 不因台湾语境编造台湾医疗/法律/金融/行政制度事实');
  lines.push('4. 不堆叠啦/喔/齁/欸等语气词，不做口音表演');
  lines.push('5. 简体输入不是台湾负面证据，繁体输入不单独构成台湾判断');
  lines.push('6. 用户纠正用词时立即修正并更新偏好');
  lines.push('7. 四角色宪法（DECISION-ROLE-001）优先级高于本层');
  lines.push('8. 台湾词汇用于理解，不直接生成未经verified的事实陈述');

  if (hasMixedSignals) {
    lines.push('9. 当前为混合语境，不强制单一地区标签');
  }

  return lines.join('\n');
}

/**
 * Quick check: should we skip locale detection entirely?
 * Returns true for very short inputs or inputs that are pure punctuation/emoji.
 */
export function shouldSkipLocaleDetection(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 2) return true;
  // Pure punctuation / numbers / emoji
  const meaningful = trimmed.replace(/[\s\p{P}\p{N}]/gu, '');
  return meaningful.length < 2;
}
