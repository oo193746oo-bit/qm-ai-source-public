import type { RealtimeIntent, RealtimeMessage, SearchDecision } from "./types";

const CRISIS_RE = /(?:自杀|自殺|轻生|輕生|不想活|活不下去|结束生命|結束生命|自残|自殘|割腕|跳楼|跳樓|伤害自己|傷害自己|杀了他|殺了他|杀人|殺人)/i;
const GREETING_RE = /^(?:你好|嗨|hello|hi|在吗|在嗎|早上好|下午好|晚上好|谢谢|謝謝)[！!。,.，\s]*$/i;
const PURE_EMOTION_RE = /^(?:我)?(?:今天|最近|这几天|這幾天)?(?:真的|有点|有點|很|特别|特別|非常)?(?:难过|難過|伤心|傷心|焦虑|焦慮|害怕|紧张|緊張|生气|生氣|烦|煩|累|崩溃|崩潰|心情不好|不开心|不開心)[了啊呀吗嗎？?！!。\s]*$/i;
const PSY_SUPPORT_RE = /(?:出柜|出櫃|父母不接受|伴侣|伴侶|分手|失恋|失戀|吵架|关系里|關係裡|自我认同|自我認同|性取向|性別認同|情绪怎么办|情緒怎麼辦)/i;
const ADMIN_RE = /(?:预约|預約|费用|費用|地址|营业时间|營業時間|工作时间|工作時間|心理师|心理師|咨询师|諮詢師|怎么付|怎麼付|支付|到访|到訪)/i;

// v13.18.0 REV2：天气与交通是一等实时场景，只要问题明显依赖“当前状态”就优先联网。
const WEATHER_RE = /(?:天气|天氣|气温|氣溫|温度|溫度|体感|體感|降雨|下雨|雨势|雨勢|雷雨|雷暴|暴雨|大雨|阵雨|陣雨|台风|颱風|台风天|颱風天|风力|風力|大风|大風|高温|高溫|热浪|熱浪|寒潮|降温|降溫|冷空气|冷空氣|空气质量|空氣質量|AQI|湿度|濕度|紫外线|紫外線|天气预报|天氣預報|会不会下雨|會不會下雨|带伞|帶傘)/i;
const WEATHER_CHANGE_RE = /(?:变天|變天|天气变化|天氣變化|会变冷|會變冷|会变热|會變熱|突然降温|突然降溫|雨会停|雨會停|什么时候停雨|什麼時候停雨|几时停雨|幾時停雨|未来几小时|未來幾小時|今晚天气|今晚天氣|明天天气|明天天氣|这周天气|這週天氣)/i;
const TRAFFIC_RE = /(?:交通|路况|路況|堵车|堵車|拥堵|擁堵|塞车|塞車|堵不堵|事故|车祸|車禍|封路|封闭|封閉|施工|道路施工|绕行|繞行|限行|管制|交通管制|地铁|地鐵|捷运|捷運|港铁|港鐵|MTR|公交|公车|公車|巴士|轻轨|輕軌|列车|列車|火车|火車|高铁|高鐵|铁路|鐵路|航班|机场|機場|延误|延誤|晚点|晚點|停运|停運|停驶|停駛|换乘|換乘)/i;
const TRAFFIC_CURRENT_RE = /(?:现在堵|現在堵|实时路况|實時路況|即时路况|即時路況|路上怎么样|路上怎麼樣|通不通|还能走|還能走|有没有封|有沒有封|有没有事故|有沒有事故|地铁正常吗|地鐵正常嗎|港铁正常吗|港鐵正常嗎|航班正常吗|航班正常嗎|延误了吗|延誤了嗎|停运了吗|停運了嗎)/i;

const EXPLICIT_NEWS_RE = /(?:新闻|新聞|热搜|熱搜|热点|熱點|八卦|爆料|大瓜|吃瓜|那个瓜|那個瓜|怎么回事|怎麼回事|发生什么|發生什麼|出了什么事|出了什麼事|最新消息|最新进展|最新進展)/i;
const CURRENT_EVENT_RE = /(?:大家都在说|大家都在說|网上都在讨论|網上都在討論|全网都在|全網都在|是不是真的|真的假的|刚刚发生|剛剛發生|刚爆|剛爆|刚官宣|剛官宣|刚回应|剛回應)/i;
const TIME_RE = /(?:今天|昨日|昨天|昨晚|今晚|明天|后天|後天|刚刚|剛剛|刚才|剛才|最近|最新|现在|現在|此刻|目前|这几天|這幾天|本周|本週|这周|這週|这个月|這個月|本月|未来|未來|接下来|接下來|等下|待会|待會|刚|剛)/i;
const EVENT_NOUN_RE = /(?:事件|事情|消息|动态|動態|声明|聲明|回应|回應|争议|爭議|风波|風波|政策|法规|法規|比赛|比賽|赛况|賽況|结果|結果|发布|發布|官宣|曝光|被曝|爆料|传闻|傳聞|热搜|熱搜|新闻|新聞|瓜)/i;
const EVENT_QUESTION_RE = /(?:怎么了|怎麼了|怎么回事|怎麼回事|发生什么|發生什麼|为何|為何|为什么这样|為什麼這樣|是真的吗|是真的嗎|进展如何|進展如何)/i;
const FOLLOWUP_RE = /^(?:那|所以|可是|但是|然后|然後|那你觉得|那你覺得|你觉得|你覺得|为什么|為什麼|后来呢|後來呢|有后续吗|有後續嗎|现在呢|現在呢|然后呢|然後呢|那今晚呢|那明天呢|那现在呢|那現在呢|那路上呢|那地铁呢|那地鐵呢)/i;
const FIRST_PERSON_RE = /^(?:我|我们|我們|你|你们|你們|他|她|它)(?:怎么了|怎麼了|为什么|為什麼|怎么办|怎麼辦)/i;

function compact(text: string): string {
  return text.replace(/https?:\/\/\S+/g, " ").replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim();
}

function inferIntent(text: string): RealtimeIntent {
  if (WEATHER_RE.test(text) || WEATHER_CHANGE_RE.test(text)) return "weather";
  if (TRAFFIC_RE.test(text) || TRAFFIC_CURRENT_RE.test(text)) return "traffic";
  if (EXPLICIT_NEWS_RE.test(text) || CURRENT_EVENT_RE.test(text) || EVENT_NOUN_RE.test(text)) return "news";
  return "general_realtime";
}

function hasRealtimeContext(messages: RealtimeMessage[]): boolean {
  const recent = messages.filter((m) => m.role !== "system").slice(-4).map((m) => m.content).join(" ");
  return WEATHER_RE.test(recent) || WEATHER_CHANGE_RE.test(recent) || TRAFFIC_RE.test(recent) || TRAFFIC_CURRENT_RE.test(recent) ||
    EXPLICIT_NEWS_RE.test(recent) || CURRENT_EVENT_RE.test(recent) || (TIME_RE.test(recent) && EVENT_NOUN_RE.test(recent));
}

function priorRealtimeText(messages: RealtimeMessage[]): string {
  const prior = [...messages].reverse().find((m) => m.role === "user" && (
    WEATHER_RE.test(m.content) || WEATHER_CHANGE_RE.test(m.content) || TRAFFIC_RE.test(m.content) || TRAFFIC_CURRENT_RE.test(m.content) ||
    EXPLICIT_NEWS_RE.test(m.content) || CURRENT_EVENT_RE.test(m.content) || (TIME_RE.test(m.content) && EVENT_NOUN_RE.test(m.content))
  ));
  return prior?.content || "";
}

function extractQuery(userText: string, contextText = "", intent: RealtimeIntent = "general_realtime"): string {
  let raw = compact(`${contextText} ${userText}`);
  raw = raw
    .replace(/(?:你知道吗|你知道嗎|你怎么看|你怎麼看|怎么看|怎麼看|帮我看看|幫我看看|查一下|搜一下|分析一下|告诉我|告訴我|那个瓜|那個瓜|大瓜|吃瓜)/gi, " ")
    .replace(/[“”"'‘’()（）【】\[\]？?！!，,。；;：:]/g, " ")
    .replace(/\b(?:please|could you|can you)\b/gi, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  let query = raw.split(/\s+/).filter(Boolean).join(" ").slice(0, 140);
  const combined = `${contextText} ${userText}`;

  if (intent === "weather") {
    if (!/(?:天气|天氣|气象|氣象|降雨|台风|颱風|温度|溫度)/i.test(query)) query += " 天气";
    if (TIME_RE.test(combined) && !/(?:今天|今晚|明天|后天|後天|未来|未來|现在|現在|最新)/.test(query)) query += " 当前 最新";
    query += " 变化 预警";
  } else if (intent === "traffic") {
    if (!/(?:交通|路况|路況|地铁|地鐵|港铁|港鐵|公交|巴士|航班|铁路|鐵路)/i.test(query)) query += " 实时交通 路况";
    if (TIME_RE.test(combined) && !/(?:今天|今晚|明天|现在|現在|最新|实时|實時)/.test(query)) query += " 当前 最新";
    query += " 延误 停运 封路";
  } else if (TIME_RE.test(combined) && !/(?:最新|今天|昨日|昨天|本周|本週|本月|202\d)/.test(query)) {
    query += " 最新";
  }

  return query.trim().slice(0, 180) || compact(userText).slice(0, 120);
}

export function shouldSearch(userText: string, messages: RealtimeMessage[] = []): SearchDecision {
  const text = compact(userText);
  if (!text) return { shouldSearch: false, query: "", reason: "empty", freshnessRequired: false, intent: "general_realtime" };
  if (CRISIS_RE.test(text)) return { shouldSearch: false, query: "", reason: "crisis_defense", freshnessRequired: false, intent: "general_realtime" };
  if (GREETING_RE.test(text)) return { shouldSearch: false, query: "", reason: "greeting", freshnessRequired: false, intent: "general_realtime" };
  if (PURE_EMOTION_RE.test(text)) return { shouldSearch: false, query: "", reason: "pure_emotion", freshnessRequired: false, intent: "general_realtime" };

  const directIntent = inferIntent(text);
  const weather = directIntent === "weather";
  const traffic = directIntent === "traffic";

  // 天气/交通明确依赖现实状态：不受一般“保守不搜”策略抑制。
  if (weather || traffic) {
    const recentContext = hasRealtimeContext(messages);
    const context = (FOLLOWUP_RE.test(text) && recentContext) ? priorRealtimeText(messages) : "";
    const intent = weather ? "weather" : "traffic";
    return {
      shouldSearch: true,
      query: extractQuery(text, context, intent),
      reason: weather ? "weather_realtime_required" : "traffic_realtime_required",
      freshnessRequired: true,
      intent,
    };
  }

  if (ADMIN_RE.test(text) && !EXPLICIT_NEWS_RE.test(text)) return { shouldSearch: false, query: "", reason: "admin_intent", freshnessRequired: false, intent: "general_realtime" };
  if (PSY_SUPPORT_RE.test(text) && !EXPLICIT_NEWS_RE.test(text) && !CURRENT_EVENT_RE.test(text) && !(TIME_RE.test(text) && EVENT_NOUN_RE.test(text))) {
    return { shouldSearch: false, query: "", reason: "psychological_support", freshnessRequired: false, intent: "general_realtime" };
  }

  const recentRealtime = hasRealtimeContext(messages);
  const followup = FOLLOWUP_RE.test(text) && recentRealtime;
  const explicitNews = EXPLICIT_NEWS_RE.test(text);
  const currentEvent = CURRENT_EVENT_RE.test(text);
  const timedEvent = TIME_RE.test(text) && (EVENT_NOUN_RE.test(text) || EVENT_QUESTION_RE.test(text));
  const eventQuestion = EVENT_QUESTION_RE.test(text) && !FIRST_PERSON_RE.test(text) && text.length >= 4;

  if (!(explicitNews || currentEvent || timedEvent || followup || eventQuestion)) {
    return { shouldSearch: false, query: "", reason: "no_freshness_signal", freshnessRequired: false, intent: "general_realtime" };
  }

  const context = followup ? priorRealtimeText(messages) : "";
  const contextIntent = inferIntent(`${context} ${text}`);
  const intent: RealtimeIntent = contextIntent === "weather" || contextIntent === "traffic" ? contextIntent : (explicitNews || currentEvent ? "news" : "general_realtime");
  const reason = followup ? "developing_event_followup" : explicitNews ? "explicit_news_or_entertainment" : currentEvent ? "current_discussion_signal" : timedEvent ? "time_sensitive_event" : "event_question";

  return {
    shouldSearch: true,
    query: extractQuery(text, context, intent),
    reason,
    freshnessRequired: Boolean(TIME_RE.test(text) || currentEvent || followup || /最新/.test(text)),
    intent,
  };
}
