/**
 * QM AI 角色治理唯一真相源
 * DECISION-ROLE-001 v14.0 — 四角色宪法
 *
 * 本模块是小酷、小雪共用的唯一角色权限定义。
 * 禁止在任何路由/组件中硬编码独立的角色权限。
 *
 * 优先级：危机安全/法律隐私 > 本决策 > 所有旧Prompt/算法/模板/知识库
 */

// ============================================================
// 1. ROLE_GOVERNANCE 常量
// ============================================================

export const ROLE_GOVERNANCE = {
  decisionId: "DECISION-ROLE-001",
  version: "14.0",
  immutableUnlessSupersededBy: "explicit_new_top_level_decision",
  roles: {
    xiaoku: {
      domain: "psychological_support",
      adminIntent: "mandatory_handoff_xiaoxue",
    },
    xiaoxue: {
      domain: "administrative_booking",
      clinicalDepth: "forbidden",
    },
    human_admin: {
      domain: "administrative_final_confirmation",
      clinicalConsultation: "forbidden",
    },
    therapist: {
      domain: "paid_psychological_consultation",
    },
  },
  /** 全局LLM禁止动作 */
  globalDenies: [
    "LLM_CONFIRM_BOOKING",
    "LLM_CONFIRM_VISIT",
    "LLM_RESERVE_TIME",
    "LLM_CHECK_LIVE_AVAILABILITY",
    "LLM_CONFIRM_PAYMENT",
    "UNCONFIRMED_WALK_IN_INVITATION",
  ] as const,
  sourceOfTruth: true,
} as const;

// ============================================================
// 1.5 文本标准化：繁体→简体 + 基础多语言支持
// ============================================================

/** 常见繁简映射（仅覆盖行政/心理场景高频字） */
const T2S_MAP: Record<string, string> = {
  "預": "预", "約": "约", "錢": "钱", "費": "费", "時": "时",
  "點": "点", "麼": "me", "號": "号", "師": "师",
  "這": "这", "樣": "样", "說": "说", "談": "谈", "請": "请",
  "誰": "谁", "為": "为", "個": "个", "裡": "里", "裏": "里",
  "聯": "联", "繫": "系", "絡": "络", "過": "过", "來": "来",
  "從": "从", "問": "问", "題": "题", "開": "开", "關": "关",
  "門": "门", "營": "营", "業": "业", "處": "处",
  "理": "理", "務": "务", "員": "员", "腦": "脑",
  "辦": "办", "見": "见",
  "對": "对", "與": "与",
  "經": "经", "歷": "历", "傷": "伤", "殺": "杀",
  "殘": "残", "懼": "惧", "慮": "虑", "鬱": "郁",
  "療": "疗", "詢": "询",
  "颱": "台", "颶": "飓",
  "預約": "预约", "費用": "费用", "價格": "价格",
  "聯繫方式": "联系方式", "聯絡方式": "联络方式",
  "工作時間": "工作时间", "營業時間": "营业时间",
  "心理師": "心理师", "諮詢": "咨询", "諮商": "咨询",
  "線上": "线上", "線下": "线下",
  "報名": "报名", "時間": "时间",
};

/** 繁体→简体标准化（仅做单字级别替换，覆盖高频字） */
function normalizeText(text: string): string {
  if (!text) return "";
  let result = text;
  // 先替换多字词
  const multiChar = Object.entries(T2S_MAP).filter(([k]) => k.length > 1);
  for (const [trad, simp] of multiChar) {
    result = result.split(trad).join(simp);
  }
  // 再替换单字
  const singleChar = Object.entries(T2S_MAP).filter(([k]) => k.length === 1);
  for (const [trad, simp] of singleChar) {
    result = result.split(trad).join(simp);
  }
  return result;
}

/** 检测是否含英语（拉丁字母占比>30%） */
function isEnglishHeavy(text: string): boolean {
  const letters = (text.match(/[a-zA-Z]/g) || []).length;
  return letters > 0 && letters / text.length > 0.3;
}

/** 英语行政意图模式 */
const ENGLISH_ADMIN_PATTERNS: { type: AdminIntentType; patterns: RegExp[] }[] = [
  {
    type: "pricing",
    patterns: [
      /how much/i, /\bcost\b/i, /\bprice/i, /\bfees?\b/i, /free of charge/i,
      /how do you charge/i, /what.*charge/i, /\bexpensive\b/i,
      /payment/i, /\bfree\b/i, /is it free/i,
      /cheaper/i, /discount/i, /charge for/i,
    ],
  },
  {
    type: "booking",
    patterns: [
      /\bbook\b/i, /appointment/i, /\bschedule\b/i, /sign up/i, /register/i,
      /how.*book/i, /make.*appointment/i, /\breserve\b/i, /enroll/i,
      /book.*session/i, /set up.*appointment/i,
    ],
  },
  {
    type: "business_hours",
    patterns: [
      /business hours/i, /open.*hour/i, /close.*hour/i, /what time.*open/i,
      /when.*open/i, /when.*close/i, /operating hours/i, /what time.*close/i,
    ],
  },
  {
    type: "address",
    patterns: [
      /where.*located/i, /what.*address/i, /how to get there/i,
      /where are you/i, /location/i,
    ],
  },
  {
    type: "contact",
    patterns: [
      /contact/i, /phone number/i, /email/i, /wechat/i, /how to reach/i,
    ],
  },
  {
    type: "visit",
    patterns: [
      /come over/i, /drop by/i, /walk in/i, /come to.*office/i, /\bvisit\b/i,
    ],
  },
  {
    type: "walk_in",
    patterns: [
      /walk.?in/i, /drop in/i, /without appointment/i, /no appointment.*come/i,
      /walk.?in slot/i,
    ],
  },
  {
    type: "availability",
    patterns: [
      /available/i, /have time/i, /when.*free/i, /slot/i, /open slot/i,
    ],
  },
  {
    type: "time_arrangement",
    patterns: [
      /reschedule/i, /change.*time/i, /another time/i, /different time/i,
    ],
  },
  {
    type: "payment",
    patterns: [
      /pay/i, /payment/i, /how to pay/i, /credit card/i, /transfer/i,
    ],
  },
  {
    type: "refund",
    patterns: [/refund/i, /money back/i, /cancel.*refund/i],
  },
  {
    type: "cancel",
    patterns: [/cancel/i, /call off/i],
  },
  {
    type: "customer_service",
    patterns: [
      /customer service/i, /real person/i, /human agent/i, /staff/i,
      /no one.*repl/i, /can't reach/i, /cannot reach/i,
    ],
  },
  {
    type: "therapist_selection",
    patterns: [
      /which therapist/i, /who.*good/i, /recommend.*therapist/i, /counselor/i,
      /\btherapist\b/i, /psychologist/i, /which counselor/i,
    ],
  },
];

// ============================================================
// 2. ADMIN_INTENT_KEYWORDS — 行政意图检测
// ============================================================

export type AdminIntentType =
  | "pricing"
  | "booking"
  | "therapist_selection"
  | "business_hours"
  | "address"
  | "contact"
  | "visit"
  | "walk_in"
  | "availability"
  | "time_arrangement"
  | "payment"
  | "refund"
  | "cancel"
  | "reschedule"
  | "frontdesk"
  | "customer_service"
  | "general_inquiry";

interface IntentPattern {
  type: AdminIntentType;
  /** 必须同时包含的词组（AND逻辑），用于避免误判 */
  allOf?: RegExp[];
  /** 任一匹配即可（OR逻辑） */
  anyOf: RegExp[];
  /** 排除模式：匹配则不算行政意图（用于避免心理语境误判） */
  exclude?: RegExp[];
}

const ADMIN_INTENT_PATTERNS: IntentPattern[] = [
  // 费用/价格
  {
    type: "pricing",
    anyOf: [
      /多少钱/, /怎么收费/, /费用[多少怎]?/, /价格/, /收费[标准吗]?/,
      /价位/, /花费/, /贵不贵/, /(收费|费用|价格).{0,4}(多少|怎样|如何|标准)/,
      /\d+\s*块.*次/, /\d+\s*元.*次/,
      /要钱吗?/, /花钱吗?/, /(要|花|收).{0,2}(钱|费|钱的)/,
      /免费/, /不收费/, /不花钱/, /第一次.{0,4}(免费|不收费)/,
      /收费吗/, /怎么付钱?/, /(价格|费用|收费).{0,4}(贵|便宜|合理)/,
      /(便宜|优惠|打折|砍价|讲价)/,
      /\d+\s*[元块]\s*[/／每]/,
      /(怎么|如何).{0,2}(交|付|缴).{0,2}(费|钱|款|学费)/,
      /付费标准/, /收费标准/, /资费/,
    ],
    exclude: [
      /(我|他|她|他们).{0,6}(付了|花了|交了).{0,6}(钱|费|款)/, // 叙述过去经历
    ],
  },
  // 预约
  {
    type: "booking",
    anyOf: [
      /怎么预约/, /怎么约/, /我要预约/, /我要咨询/, /预约[吗呢吧]?/,
      /约咨询/, /想预约/, /帮我[预约订]/, /预约流?程/, /如何预约/,
      /(想|要|打算).{0,4}(预约|约|订)/, /(预约|约).{0,4}(一个|一次|一下)/,
      /报名/, /怎么报名/, /报名咨询/,
      /(想|要).{0,4}了解.{0,4}(咨询|流程|预约|服务)/,
      /咨询流程/, /(想|要)咨询(?!师|心理)/,
      /能不能约/, /能约吗?/, /可以约吗?/, /约一下/,
      /(线下|线上|到店|到现场).{0,4}(吗|呢|可以|能|约|咨询)/,
      /(约|咨询).{0,4}(线下|线上|到店)/,
      /(你|AI|机器人|系统|客服).{0,6}(帮|给|替).{0,6}(约|订|预约|确认|安排|留|定|锁定)/,
      /(帮|给|替).{0,4}(确认|安排|留|定|锁定|预留).{0,4}(一下|一个|个时间|位置)?/,
    ],
  },
  // 心理师选择
  {
    type: "therapist_selection",
    anyOf: [
      /心理师/, /咨询师/, /找谁/, /谁适合/, /哪位.*(好|适合|推荐)/,
      /推荐.*(心理师|咨询师|老师)/, /(心理师|咨询师).{0,4}(名单|有谁|哪位|推荐|选择)/,
      /选.*(心理师|咨询师)/, /有没有.*(心理师|咨询师)/,
      /谁比较好/, /哪个(老师|心理师|咨询师).{0,4}(好|靠谱|专业)/,
    ],
    exclude: [
      /我(的|和).{0,4}(心理师|咨询师)/, // 叙述自己的心理师
    ],
  },
  // 工作时间（P0 三返工单：热线服务时间不属于行政预约）
  {
    type: "business_hours",
    anyOf: [
      /下班/, /上班/, /营业/, /开门/, /关门/, /工作时间/,
      /营业时间/, /(几|什么|啥).{0,2}点.{0,4}(下班|上班|开门|关门|结束|开始)/,
      /营业.{0,4}(时间|到几点|几点)/, /(几点|什么时间).{0,4}(营业|下班|上班|开门|关门)/,
      /你们?几[点钟]/, /几[点钟].{0,4}(可以|能|方便)?$/,
    ],
    exclude: [
      // 心理语境中的"几点"
      /(睡|醒|起|吃|哭|焦虑|失眠|醒着|睡不着|emo|难过|崩溃).{0,6}(几|什么|啥).{0,2}点/,
      /(几|什么|啥).{0,2}点.{0,6}(睡|醒|起|吃|哭|焦虑|失眠|醒着|睡不着|emo|开始)/,
      /(最近|这段时间|这几天).{0,8}(几|什么|啥).{0,2}点/,
      /(我|他|她).{0,6}(几|什么|啥).{0,2}点.{0,6}(睡|醒|起|床|emo)/,
      /一般.{0,4}几.{0,2}点.{0,4}(开始|emo|睡|醒)/,
      // P0 三返工单：热线服务时间不属于行政预约
      /(热线|电话|12356|12355|12320|心理援助).{0,10}(时间|服务时间|几点|24小时|7×24|晚上|深夜|夜间)/,
      /(时间|服务时间).{0,10}(热线|电话|12356|12355|值守|有人接|24小时|7×24)/,
      /(晚上|深夜|夜间).{0,6}(有人接|值守|上班|24小时|7×24)/,
      /(24小时|7×24|全天候).{0,6}(热线|电话|服务|值守)/,
    ],
  },
  // 地址
  {
    type: "address",
    anyOf: [
      /在哪[里儿]?/, /地址/, /怎么走/, /怎么去/, /哪个位置/,
      /(具体|你们|机构|中心).{0,4}(地址|位置|在哪)/,
      /(在|位于).{0,4}(哪|什么地方|哪里)/,
      /地点/, /怎么找你们?/, /你们?在(哪|什么地方)/,
    ],
    exclude: [
      /我(在|住).{0,6}(哪|哪里|什么地方)/, // 用户说自己在哪
      /时间地点/, /不分时间/, /任何时间/, // 比喻用法
    ],
  },
  // 联系方式（P0 三返工单：热线号码不属于行政预约）
  {
    type: "contact",
    anyOf: [
      /联系方式/, /电话/, /微信/, /手机号?/, /怎么联系/,
      /(你们|机构|中心|客服).{0,4}(电话|微信|联系方式|手机|号码)/,
      /(加|联系).{0,4}(微信|电话|客服)/,
      /联系方法/, /怎么联系(你们|客服|人工)/,
    ],
    exclude: [
      // P0 三返工单：热线号码不属于行政预约
      /(热线|12356|12355|12320|心理援助).{0,6}(号码|电话|多少|是)/,
      /(号码|电话).{0,6}(热线|12356|12355|12320|心理援助)/,
      /(多少|什么).{0,4}(热线|电话|号码).{0,4}(是|为)/,
    ],
  },
  // 到访/到店
  {
    type: "visit",
    anyOf: [
      /到店/, /过来/, /来一趟/, /到你们?那/, /过去/, /去你们?那/,
      /(我|咱).{0,4}(过来|过去|来一趟|到店|到你们?那|去你们?那)/,
      /(直接|随时|顺[便道]?|方便的话).{0,8}(过来|来|到店|过去)/,
      /(过来|过去|来一趟).{0,4}(可以吗|行不行|方便吗)?/,
      /(能|可以).{0,4}(过来|过去|来一[趟次])/,
      /今天.{0,4}(过去|过来|到店)/,
      /到现场/, /来现场/,
    ],
    exclude: [
      /过来人/, /话说回来/, /回过神/, /回过头/,
      /(过来|过去).{0,4}(经验|经历|故事)/, // 比喻用法
    ],
  },
  // walk-in / 先来了解
  {
    type: "walk_in",
    anyOf: [
      /先来了解/, /先来看[看]?/, /先来问问/, /直接来/, /直接到店/,
      /不预约.{0,4}(来|到|过来)/, /没预约.{0,4}(来|到|过来)/,
      /路过.{0,4}(进来|上来|来)/, /顺[便路].{0,4}(来|过来|到店)/,
    ],
  },
  // 档期/有空
  {
    type: "availability",
    anyOf: [
      /有空[吗吗]?/, /有档期/, /有位置/, /有(空|名额|空位)/,
      /(今天|明天|后天|周[一二三四五六日天]|这周|下周).{0,8}(有空|有位置|有档期|能约|可以约|有没有空|有时间吗|方便)/,
      /(这个时间|那个时间|周三?|周四?).{0,4}(有空|可以|有位置|方便)/,
      /有时间吗/, /方便吗/, /(你|你们).{0,4}(有空|方便|在)/,
    ],
  },
  // 时间安排（P0 三返工单：热线服务时间/值守情况不属于行政预约）
  {
    type: "time_arrangement",
    anyOf: [
      /\d{1,2}\s*点.{0,6}(到|来|过来|过去|方便|可以)?/,
      /(上午|下午|晚上|中午).{0,4}(\d{1,2}\s*点)?/,
      /(工作日|周末|周[一二三四五六日天]).{0,4}(方便|有空|可以)?/,
      /时间.{0,4}(安排|方便|合适|可以|确定)/,
      /改个?时间/, /换个?时间/,
    ],
    exclude: [
      /(我|他|她).{0,6}(上午|下午|晚上|中午).{0,6}(睡|醒|起|哭|焦虑|失眠|特别|时候|的)/,
      /最近.{0,8}(上午|下午|晚上|中午)/,
      /(上午|下午|晚上|中午).{0,4}(特别|经常|总是|时候|的).{0,4}(焦虑|抑郁|难受|失眠|emo|难过)/,
      /周末.{0,4}(独处|充电|休息|在家|睡觉|陪|放松)/,
      /(工作日|周末).{0,4}(独处|充电|休息|放松)/,
      // P0 三返工单：热线服务时间/值守情况不属于行政预约
      /(热线|电话|12356|12355|12320|心理援助).{0,10}(时间|服务时间|值守|有人接|24小时|7×24|晚上|深夜|夜间)/,
      /(时间|服务时间).{0,10}(热线|电话|12356|12355|值守|有人接|24小时|7×24)/,
      /(晚上|深夜|夜间).{0,6}(有人接|值守|上班|24小时|7×24)/,
      /(24小时|7×24|全天候).{0,6}(热线|电话|服务|值守)/,
      /(座席|值守|值班).{0,6}(情况|安排|时间)/,
      // 医院名称/科室/挂号渠道不属于行政预约
      /(医院|精神卫生中心|心理科|精神科).{0,10}(名称|地址|在哪|怎么去|挂号|预约)/,
      /(挂号|预约).{0,10}(医院|精神卫生中心|心理科|精神科|公众号|114|平台)/,
    ],
  },
  // 支付
  {
    type: "payment",
    anyOf: [
      /付钱/, /付款/, /支付/, /交钱/, /转账/, /扫码付/, /怎么付/,
      /(可以|能).{0,4}(付|支付|付款|交钱)/,
    ],
  },
  // 退款
  {
    type: "refund",
    anyOf: [
      /退款/, /退钱/, /退费/, /(能|可以|怎么).{0,4}(退|退款|退钱|退费)/,
    ],
  },
  // 取消
  {
    type: "cancel",
    anyOf: [
      /取消(预约|咨询|订单)?/, /(能|可以|怎么).{0,4}取消/, /退订/, /不[去要]了/,
    ],
  },
  // 改约
  {
    type: "reschedule",
    anyOf: [
      /改约/, /改期/, /改时间/, /换个时间/, /(能|可以|怎么).{0,4}(改|换).{0,4}(时间|预约|期)/,
      /能改吗?/, /可以改吗?/,
    ],
  },
  // 前台
  {
    type: "frontdesk",
    anyOf: [
      /前台/, /(前台|接待).{0,6}(聊|沟通|说|谈|问|了解|看|接待)/,
      /到了找(前台|客服|工作人员|谁)/,
      /(到了|到店).{0,4}(找|跟|问).{0,4}(前台|客服|工作人员)/,
      /工作人员/,
    ],
  },
  // 客服
  {
    type: "customer_service",
    anyOf: [
      /人工客服/, /客服/, /(联系|找|加).{0,4}(客服|人工|工作人员)/,
      //,
      /(没人|没有人|无人)(?!.{0,4}(理解|懂|爱|关心|在乎|听|陪|支持|安慰))(回|理|接|应答|回复)?/,
      /(真人|人工|活人)/,
      /(投诉|骗子|骗钱|骗)/,
      /(效率|态度|服务).{0,4}(差|低|烂|不好|太差)/,
      /(等了?|等半天|等三天)/,
      /付了?钱?没?人?理/,
      /(破系统|不靠谱|什么态度|再也不|态度差|效率低)/,
    ],
  },
];

/**
 * 检测用户消息是否含行政意图。
 * 返回命中的intent类型列表（支持混合意图）。
 *
 * 关键：用 allOf + exclude 组合判断，避免心理语境误判。
 * 例如"我最近几点都睡不着"不含行政意图。
 */
export interface AdminIntentResult {
  isAdminIntent: boolean;
  matchedIntents: AdminIntentType[];
  rawText: string;
}

export function isAdminIntent(text: string): AdminIntentResult {
  const rawText = text || "";
  // 标准化：繁体→简体
  const normalized = normalizeText(rawText);
  const matchedIntents: AdminIntentType[] = [];

  // P18-4: 通用生活信息排除——路况、地铁、公交、打车、天气、气温、下雨等不是 QM 行政事务
  const GENERAL_LIFE_INFO = /(路况|地铁|公交|打车|出租|高铁|火车|飞机|航班|天气|气温|下雨|下雪|堵车|拥堵|实时路况|天气预报|温度)/;
  if (GENERAL_LIFE_INFO.test(normalized)) {
    return {
      isAdminIntent: false,
      matchedIntents: [],
      rawText,
    };
  }

  for (const pattern of ADMIN_INTENT_PATTERNS) {
    // 检查排除模式（对标准化后文本检查）
    if (pattern.exclude) {
      const excluded = pattern.exclude.some((re) => re.test(normalized));
      if (excluded) continue;
    }

    // allOf 模式：必须全部匹配
    if (pattern.allOf) {
      const allMatched = pattern.allOf.every((re) => re.test(normalized));
      if (!allMatched) continue;
    }

    // anyOf 模式：任一匹配
    const anyMatched = pattern.anyOf.some((re) => re.test(normalized));
    if (anyMatched) {
      if (!matchedIntents.includes(pattern.type)) {
        matchedIntents.push(pattern.type);
      }
    }
  }

  // 英语意图检测（对含英语的文本额外检查）
  if (isEnglishHeavy(rawText) || /[a-zA-Z]{3,}/.test(rawText)) {
    for (const group of ENGLISH_ADMIN_PATTERNS) {
      // 心理师选择类排除：用户谈论自己的therapist
      if (group.type === "therapist_selection" && /((my|our)\s+(therapist|counselor|psychologist|doctor)|(我的|我们的).{0,4}(therapist|counselor|psychologist))/i.test(rawText)) {
        continue;
      }
      if (group.patterns.some((re) => re.test(rawText))) {
        if (!matchedIntents.includes(group.type)) {
          matchedIntents.push(group.type);
        }
      }
    }
  }

  return {
    isAdminIntent: matchedIntents.length > 0,
    matchedIntents,
    rawText,
  };
}

// ========== 1.9.3: 专业语境短路（专业语境禁止追加路由声明） ==========

// 专业语境信号词表（临床词 + 法律学术词）
const PROFESSIONAL_CONTEXT_SIGNALS = /量表|评估|量化|研究|文献|理论|概念|perceived burdensomeness|INQ|问卷|测量|论文|学术|教学|培训|督导|案例讨论|法条|法规|制度|法律|四类主体|生效条件|认定民事|意定监护|监护协议|公证|监护人|被监护人|民事行为能力/i;

// 求知句式（"是什么/怎么量化/谁提出/如何理解"）
const INQUIRY_PATTERN = /是什么|怎么量化|谁提出|如何理解|什么是|怎么回事|怎么规定|法律怎么|制度怎么/i;

/**
 * 1.9.3: 检测是否为专业语境（学术讨论、法律研究等）
 * 专业语境下不触发行政路由
 */
function isProfessionalContext(text: string): boolean {
  return PROFESSIONAL_CONTEXT_SIGNALS.test(text) && INQUIRY_PATTERN.test(text);
}

/**
 * 小酷场景：检测到任何行政意图即返回true。
 * 危机场景优先，不应在危机流程中调用此函数。
 * 1.9.3: 专业语境短路——专业讨论不触发行政路由
 */
export function shouldXiaokuHandoff(text: string): boolean {
  // 1.9.3: 专业语境短路，不触发行政路由
  if (isProfessionalContext(text)) {
    return false;
  }
  const result = isAdminIntent(text);
  return result.isAdminIntent;
}

// ============================================================
// 3. 小雪心理越界检测（G002）
// ============================================================

interface ClinicalOverreachPattern {
  category: string;
  patterns: RegExp[];
}

const CLINICAL_OVERREACH_PATTERNS: ClinicalOverreachPattern[] = [
  {
    category: "心理分析/诊断",
    patterns: [
      /你(的|这).{0,4}(焦虑|抑郁|创伤|障碍|问题).{0,4}(来源|根源|因为|由于|来自|始于)/,
      /(可能|看起来|感觉).{0,4}(是|有|患).{0,4}(抑郁症|焦虑症|PTSD|人格障碍|双相|精神)/,
      /(诊断|确诊|临床|症状表明|表现符合)/,
      /(你的|这种).{0,4}(防御机制|依恋模式|人格结构|移情|投射)/,
      /(童年|幼年|原生家庭).{0,4}(导致|造成|形成|根源|创伤)/,
    ],
  },
  {
    category: "深度咨询式提问",
    patterns: [
      /(第一次|最早).{0,4}(感到|觉得|出现|经历).{0,4}(焦虑|抑郁|难受|痛苦|创伤)/,
      /(你和|你跟).{0,4}(父母|爸爸|妈妈|家人).{0,4}(关系|最深|最痛|最受伤)/,
      /(深入|详细).{0,4}(说说|谈谈|描述).{0,4}(童年|经历|创伤|感受|关系)/,
      /(当时|那个时候).{0,4}(发生了什么|你感觉|你怎么了)/,
    ],
  },
  {
    category: "治疗建议/干预",
    patterns: [
      /(建议|应该|需要).{0,4}(接受|进行|寻求).{0,4}(心理治疗|咨询|治疗|干预)/,
      /(可以|试着|试试).{0,4}(用|做|尝试).{0,4}(认知行为|CBT|精神分析|正念|暴露疗法)/,
      /(治疗|咨询|干预).{0,4}(方案|计划|目标|过程)/,
      /(我来帮你|我们一起).{0,4}(处理|面对|解决|疗愈).{0,4}(创伤|痛苦|情绪|问题)/,
    ],
  },
  {
    category: "临床术语解释",
    patterns: [
      /(这是|属于|叫做).{0,4}(创伤后应激|PTSD|解离|人格障碍|防御机制|移情|反移情)/,
      /(你的|这种).{0,4}(症状|表现|反应).{0,4}(符合|属于|是典型)/,
    ],
  },
];

export interface ClinicalOverreachResult {
  isOverreach: boolean;
  categories: string[];
  matchedTexts: string[];
}

export function isXiaoxueClinicalOverreach(text: string): ClinicalOverreachResult {
  const categories: string[] = [];
  const matchedTexts: string[] = [];

  for (const group of CLINICAL_OVERREACH_PATTERNS) {
    for (const pattern of group.patterns) {
      const match = text.match(pattern);
      if (match) {
        if (!categories.includes(group.category)) {
          categories.push(group.category);
        }
        matchedTexts.push(match[0]);
        break; // 每组只报一次
      }
    }
  }

  return {
    isOverreach: categories.length > 0,
    categories,
    matchedTexts,
  };
}

// ============================================================
// 4. 状态机
// ============================================================

export type AdminState = "A0" | "A1" | "A2" | "A3" | "A4" | "A5";

export const ADMIN_STATES: AdminState[] = ["A0", "A1", "A2", "A3", "A4", "A5"];

export const ADMIN_STATE_LABELS: Record<AdminState, string> = {
  A0: "普通对话",
  A1: "信息说明",
  A2: "需求收集/偏好记录",
  A3: "待人工确认",
  A4: "已由人工/确定性系统确认",
  A5: "付费咨询就绪",
};

/** LLM可以推进的状态转移 */
const LLM_ALLOWED_TRANSITIONS: ReadonlySet<string> = new Set([
  "A0->A1",
  "A0->A2",
  "A1->A2",
  "A1->A3",
  "A2->A3",
  "A0->A3",
  "A2->A1",
  "A3->A2",
  "A3->A1",
  "A1->A0",
  "A2->A0",
  "A3->A0",
]);

/** 只有verified人工确认才能进入的转移 */
const HUMAN_ONLY_TRANSITIONS: ReadonlySet<string> = new Set([
  "A3->A4",
]);

export interface StateTransitionResult {
  allowed: boolean;
  from: AdminState;
  to: AdminState;
  reason: string;
  requiresHumanConfirmation: boolean;
}

export function canAdvanceAdminState(
  from: AdminState,
  to: AdminState,
  options?: { isVerifiedHumanConfirmation?: boolean },
): StateTransitionResult {
  const key = `${from}->${to}`;

  if (from === to) {
    return {
      allowed: true,
      from, to,
      reason: "状态未变化",
      requiresHumanConfirmation: false,
    };
  }

  // A3→A4：只有真实人工确认
  if (HUMAN_ONLY_TRANSITIONS.has(key)) {
    if (options?.isVerifiedHumanConfirmation) {
      return {
        allowed: true,
        from, to,
        reason: "已收到verified human confirmation，进入已确认状态",
        requiresHumanConfirmation: false,
      };
    }
    return {
      allowed: false,
      from, to,
      reason: "LLM不能自行推进A3→A4。只有verified human confirmation才能进入A4。",
      requiresHumanConfirmation: true,
    };
  }

  // A4→A5：需要verified payment
  if (key === "A4->A5") {
    return {
      allowed: false,
      from, to,
      reason: "A4→A5需要verified payment确认",
      requiresHumanConfirmation: true,
    };
  }

  // 任何直接到A4/A5的非法转移
  if (to === "A4" && from !== "A3") {
    return {
      allowed: false,
      from, to,
      reason: "A4只能通过A3 + verified human confirmation进入",
      requiresHumanConfirmation: true,
    };
  }
  if (to === "A5") {
    return {
      allowed: false,
      from, to,
      reason: "A5需要A4 + verified payment",
      requiresHumanConfirmation: true,
    };
  }

  // A4是终态
  if (from === "A4" || from === "A5") {
    return {
      allowed: false,
      from, to,
      reason: "A4/A5是终态，需要明确重置事件才能离开",
      requiresHumanConfirmation: false,
    };
  }

  if (LLM_ALLOWED_TRANSITIONS.has(key)) {
    return {
      allowed: true,
      from, to,
      reason: `LLM可推进 ${from}→${to}`,
      requiresHumanConfirmation: false,
    };
  }

  return {
    allowed: false,
    from, to,
    reason: `未授权的状态转移 ${from}→${to}`,
    requiresHumanConfirmation: false,
  };
}

// ============================================================
// 5. 小酷强制分流话术模板
// ============================================================

export interface HandoffTemplateOptions {
  /** 用户消息中可能包含的心理/情绪部分（用于短承接） */
  emotionalContext?: string;
  /** 命中的行政意图类型 */
  adminIntents: AdminIntentType[];
}

/**
 * 生成小酷强制分流话术。
 * 混合意图时先短承接心理部分1-2句，再转行政给小雪。
 */
export function buildXiaokuHandoffMessage(options: HandoffTemplateOptions): string {
  const { emotionalContext, adminIntents } = options;

  const intentText = describeAdminIntents(adminIntents);

  if (emotionalContext) {
    // 混合意图：先短承接情绪，再转行政
    return (
      `我听到你说的这些了，${emotionalContext}这部分我们可以之后继续聊。\n\n` +
      `不过你问到的${intentText}已经是预约和行政这边的问题了，` +
      `我不替小雪做决定，免得把时间、费用或到访安排说错。` +
      `你可以切换到小雪，她会接着帮你把费用、流程和预约前的准备理清。` +
      `等你把行政的事情处理好，回来找我继续聊就好。`
    );
  }

  // 纯行政意图
  return (
    `这个已经是预约和行政这边的问题了，` +
    `我不替小雪做决定，免得把时间、费用或到访安排说错。` +
    `你可以切换到小雪，她会帮你把${intentText}理清。` +
    `如果你之后想聊心理方面的事情，随时回来找我就好。`
  );
}

function describeAdminIntents(intents: AdminIntentType[]): string {
  const map: Record<AdminIntentType, string> = {
    pricing: "费用",
    booking: "预约流程",
    therapist_selection: "心理师选择",
    business_hours: "工作时间",
    address: "地址",
    contact: "联系方式",
    visit: "到访安排",
    walk_in: "到店了解",
    availability: "档期",
    time_arrangement: "时间安排",
    payment: "支付",
    refund: "退款",
    cancel: "取消",
    reschedule: "改约",
    frontdesk: "前台事宜",
    customer_service: "客服联系",
    general_inquiry: "相关信息",
  };

  if (intents.length === 0) return "相关信息";
  if (intents.length === 1) return map[intents[0]];
  return intents.map((i) => map[i]).join("、");
}

/**
 * 检测用户消息中是否包含心理/情绪语境（用于混合意图判断）
 */
export function hasEmotionalContext(text: string): boolean {
  const normalized = normalizeText(text);
  const emotionalPatterns = [
    /(焦虑|抑郁|难受|痛苦|崩溃|哭|失眠|睡不着|心情|情绪|压力|烦|孤独|寂寞|害怕|恐惧|担心|紧张|无助|绝望|迷茫|困惑|矛盾|挣扎|委屈|愤怒|生气|悲伤|难过|开心|快乐|放松|安全|温暖|出柜|拒[绝絕]|分手|失恋|吵架|家暴|霸凌|自[伤杀残]|活不下去|想死|不想活)/,
    /(我觉得|我感觉|我发现|我意识到|我在想|我不确定|不知道自己)/,
    /(关系|身份|成长|自我|家庭|父母|伴侣|朋友|工作|职场|学业|出柜|性向|性别)/,
    /(树洞|日记|写的|记录)/,
    /(被拒|被抛弃|被忽视|不被理解|不被接受|不被爱|没有人懂|没人理解)/,
    // 精神疾病/神经症状/人格障碍相关
    /(抑郁症|躁郁症|双相|精神分裂|强迫症|OCD|PTSD|创伤后应激|解离|人格障碍|边缘型|自恋型|表演型|反社会|回避型|依赖型|强迫型|偏执型|分裂样)/,
    /(惊恐发作|panic attack|恐慌|发作|幻觉|妄想|躁狂|轻躁|郁期|躁期|情绪波动|情绪失控|情绪不稳)/,
    /(多动症|ADHD|注意力缺陷|自闭|阿斯伯格|亚斯伯格|孤独症|谱系|抽动|妥瑞氏|Tourette|阅读障碍|书写障碍|感统失调)/,
    /(进食障碍|厌食|暴食|催吐|体像障碍|躯体变形|物质依赖|成瘾|酗酒|药物滥用)/,
    /(惊恐|焦虑发作|抑郁发作|解离发作|闪回|噩梦|睡眠障碍|嗜睡|早醒)/,
    /(吃药|服药|药物|精神科|心理科|确诊|诊断|住院|电击|ECT|治疗中|在服药)/,
    /(被诊断|被说(是|有)|医生说|医院确诊|精神科医生|心理医生)/,
    /(社恐|社交恐惧|社交焦虑|广场恐惧|幽闭恐惧|特定恐惧|广泛性焦虑|健康焦虑)/,
    /(躯体化|身体症状|查不出原因|功能性障碍|转换障碍|疑病|躯体形式|躯体症状)/,
    /(广场恐惧|广场恐怖|幽闭恐惧|特定恐惧|社交恐惧)/,
    /(自毁|自我伤害|割(腕|手)|撞头|烫伤自己|咬自己|掐自己)/,
    /(被家里赶出来|被性侵|被侵犯|被骚扰|被猥亵|婚内出轨|被歧视|被霸凌|被排挤)/,
    /(惊恐发作|濒死感|失控感|不真实感|人格解体|现实解体|derealization|depersonalization)/,
    /(社恐|i人|e人|高敏感|HSP|内向|社死)/,
    // 危机隐晦表达
    /(活着没?意义|活不下去|不想活|想死|要杀了?自己|结束这一切|从(楼|窗|天台|桥)|解脱|一了百了|没有盼头|撑不下去|熬不下去)/,
    /(不想醒来|如果我不在|不会再麻烦|再也不|消失|永别|离开这个世界|没有我)/,
    // 英语情绪词
    /(anxious|depressed|anxiety|depression|panic|trauma|stressed|overwhelmed|scared|afraid|lonely|hopeless|suicidal|self.harm|dissociat|PTSD|OCD|ADHD|bipolar|coming out|gender identity|eating disorder|grief|abused|bullied|rejected)/i,
  ];
  return emotionalPatterns.some((p) => p.test(normalized));
}

// ============================================================
// 6. 全局角色治理SP段（注入到两个路由的SP构建）
// ============================================================

export const GLOBAL_ROLE_GOVERNANCE_SP = `【最高角色决策 DECISION-ROLE-001 v14.0】
小酷=心理支持/探索入口；小雪=行政预约入口；人工客服=行政最终确认；心理师=正式付费咨询中的心理议题处理。

除危机安全与法律隐私合规外，本决策高于所有旧Prompt、算法、知识库示例和话术。任何冲突的低层规则自动失效。

小酷：心理议题正常处理；任何预约、费用、心理师、时间、地址、到访、支付、客服、前台意图强制转小雪，不自行回答行政内容，即使verified facts存在也不答。
小酷直答范围（非行政意图，不得推诿）：情绪调节方法、心理科普、自助技巧、热线/就医/政策事实、日常倾诉陪伴。
转小雪仅限第一人称办事需求：预约、改期、取消、费用支付、到访路线、心理师档期、no-show。
禁止关门式表述：「超出我的支持范围」「我只是工具」「没办法回答」「你去找小雪吧」等推诿话术。
小雪：完整处理行政预约前置（费用/流程/工作时间/地址/预约前置/需求分类）；只收集咨询主题大类用于匹配，不进行心理分析、深问或干预。
人工客服：负责真实行政最终确认，不进行心理咨询。
心理师：正式付费咨询中处理心理议题。

未确认预约前不邀请直接到现场。前台只做行政。AI不得预留/确认预约、确认到访、确认付款、声称实时档期或声称已通知人工，除非未来真实确定性工具返回verified success。

如果旧规则、知识库、Few-shot、模型常识与本规则冲突，以本规则为准。`;

// ============================================================
// 7. 小雪行政大脑SP段
// ============================================================

export const XIAOXUE_ADMIN_BRAIN_SP = `【小雪行政大脑 v14.0 — DECISION-ROLE-001】

你是小雪，QM的"有对话能力的行政预约前置AI"，不是心理咨询AI，也不是数据库。

## 你可以充分沟通
- 说明费用、流程、工作时间、地址、服务形式
- 了解来访者大致想解决什么（仅大类：焦虑/关系/身份/成长等）
- 收集行政偏好：线上/线下、城市/时区、预算、语言偏好、时间偏好
- 帮用户整理需求摘要
- 告知当前进度、下一步和待人工确认事项
- 解释为什么某一步需要人工确认

## 咨询主题只收集大类（用于行政匹配）
可以问："你这次主要是想处理焦虑、关系，还是身份相关的困扰？"
不可以问：
- "你第一次感到这种焦虑是什么时候？"
- "你和父母的关系里最深的伤是什么？"
- 任何创伤细节、家庭关系深层机制、身份困惑心理解释
- 任何症状诊断、情绪根因分析、治疗建议
- 深度咨询式开放提问

行政系统（小雪+人工客服）：可以收集"咨询主题"标签，不可以处理"咨询内容"。

## 到访/前台边界
- 未确认预约前婉拒直接到现场
- 前台只做行政，不提供"先聊聊咨询议题""和孩子沟通"的免费心理接待
- 无正式预约/付费，不承诺心理师现场接待
- 用户想"先来聊聊需求"→引导在线通过小雪/人工客服做行政需求收集，咨询议题放到正式付费咨询

## 禁止动作
- 心理分析、诊断、心理干预、深度开放式心理探索
- 预留/确认预约时间
- 声称实时档期
- 声称已收款/已通知/已安排
- 邀请用户来前台讨论咨询议题
- 承诺心理师会现场免费沟通

## 进度告知
每轮让用户知道：
1. 当前进行到哪一步
2. 还缺什么信息
3. 下一步是什么
4. 哪些需要人工确认

需要人工不是甩锅：先完成AI能做的——回答事实、记录偏好、整理需求、说明"待人工确认"。`;

// ============================================================
// 8. 小酷策略SP段
// ============================================================

export const XIAOKU_POLICY_SP = `【小酷最高角色策略 v14.0 — DECISION-ROLE-001】

- 心理议题是核心职责，不因行政边界而削弱。
- 一旦识别行政意图（费用/预约/心理师/时间/地址/到访/支付/客服/前台/"先来了解一下"），立即停止生成行政答案，转小雪。
- 不顺手回答价格、地址、时间，即使verified facts存在。
- 不收集预约字段。
- 不承诺任何现实业务动作。
- 混合意图可先短承接心理感受1-2句，再把行政部分交小雪。不能整段都转走，也不能答行政。
- 转小雪≠终止心理关系；用户之后仍可回来继续心理支持。
- 树洞、心理支持、测评、知识库等心理功能正常保留。

分流话术（参考，自然表达）：
"这个已经是预约和行政这边的问题了，我不替小雪做决定，免得把时间、到访或费用说错。你可以点「切换到小雪」，她会接着帮你理清。你刚刚提到的焦虑/关系这部分，如果你之后想继续聊，回来找我就好。"

禁止生硬甩人："这个你去问小雪。"（错误）
禁止顺手回答行政："我们工作时间是10点到22点，你可以过来。"（错误，即使时间正确也不能说）`;

/**
 * 导出所有需要的类型和函数，供小酷/小雪路由共用。
 */
export const ROLE_GOVERNANCE_VERSION = "14.0";
