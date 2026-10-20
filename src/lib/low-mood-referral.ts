// 四处增量二：普通低落/倾诉 ≠ 危机，资源按需给（P0 · 2026-09-14）
// 背景：生产实测 N07"被催婚手抖"、N10"多轮倾诉和妈吵架"——isCrisis=false 却被甩全套联系方式卡
// （4 热线 + 微信 + 预约入口），零共情。根因=LLM 正常流被 SP 引导机械罗列资源（与 P0-5 同族）。
//
// 本模块是**出站兜底**（确定性、可测）：
//   - 仅在**非危机路径**调用（route 里 detectCrisis false 之后的 LLM 正常流）。
//   - 仅当用户为普通低落/倾诉（无危机信号、无明确求助渠道意图）时生效。
//   - 命中则把输出中的**危机专用热线**（15001930070 / 13601658763）降级剥离，保留 12356。
//   - 不触碰危机链——危机回复由上游危机路径生成并已 return，不经此处；本函数也不生产任何危机卡。
//
// 铁律提升：危机降档只能"宁漏勿专"的场景才剥离——即用户既非危机又非主动求助，仅情绪倾诉。

// 普通低落/倾诉特征（与危机词库物理隔离开，禁止复用危机词，避免互相污染判定）
const LOW_MOOD_INPUT = /(低落|孤独|难受|烦|烦躁|压力大|好累|委屈|吵架|争吵|争执|催婚|被催|逼婚|心累|没劲|提不起劲|emo|不开心|郁闷|丧|崩不住|绷不住|想找人说说|没人理解|憋着|堵得慌|最近不顺|焦虑|失眠|睡不着)/;

// 明确求助渠道意图（有这句话的倾诉，危机专号可作为参考半保留——但仍以先共情为主）
const SEEKING_CHANNEL = /(有.?什么.?热线|找.?人.?帮|帮我.?找|求助方式|联系方式|怎么.?求助|想找人.?(聊|说|帮)|给我.?电话|半小时内|现在就.?需要|帮帮我)/;

// 危机信号（若命中说明其实是危机，不应降级——但本函数只被非危机路径调用，此为准入保险）
const CRISIS_SIGNAL = /不想活|想死|自杀|自伤|自残|轻生|了结|结束生命|遗书|割腕|跳楼|跳河|安眠药|撑不住|撑不下去|活不下去|想不开|伤害自己/;

// 危机专用热线（QM 24h 危机通道）——普通低落不该推
const QM_CRISIS_HOTLINES = ["15001930070", "13601658763"];
// 全国心理援助热线（普通低落可保留的唯一热线）
const NATIONAL_HOTLINE = "12356";

export interface LowMoodReferralResult {
  /** 用户是否落在"普通低落/倾诉"档（非危机、非主动求助） */
  isLowMood: boolean;
  /** 出站文本是否需要降级 */
  demoted: boolean;
  /** 降级后的文本（未降级时为原文） */
  text: string;
}

/**
 * 判断用户输入是否为"普通低落/倾诉"（非危机）。准入门禁：命中危机信号 → 强制不算低落，
 * 保证本函数的降级动作绝不作用于潜在危机请求。
 */
export function isLowMoodReferral(text: string): boolean {
  if (!text || !text.trim()) return false;
  if (CRISIS_SIGNAL.test(text)) return false; // 危机信号优先，宁不漏
  if (SEEKING_CHANNEL.test(text)) return false; // 明确求助渠道 → 非"普通低落"档，不降级
  return LOW_MOOD_INPUT.test(text);
}

/**
 * 出站降级：把 LLM 回复中出现的危机专用热线降级剥离，保留 12356。
 * 仅应在 isLowMoodReferral(userText) 为 true 且非危机路径时调用。
 * 逐行/逐段处理危机专号：整行含危机专号 → 尝试剥号（若该行同时含 12356 或其他有效内容则仅剥号）；
 * 纯危机专号信息行 → 整行移除。最后清理空壳。
 */
export function demoteCrisisHotlineForLowMood(
  reply: string,
  userText: string,
): LowMoodReferralResult {
  if (!reply || !reply.trim()) {
    return { isLowMood: isLowMoodReferral(userText), demoted: false, text: reply };
  }
  const isLowMood = isLowMoodReferral(userText);
  if (!isLowMood) {
    return { isLowMood, demoted: false, text: reply };
  }
  // 准入门禁：回复本身出现危机卡特征（多热线+微信+预约/安慰卡），说明是系统生成的危机兜底，不降级
  // （本函数只服务 LLM 正常流；危机模板已在更上游 return，此处仅是双保险）。
  const looksLikeCrisisCard =
    /15001930070.{0,200}13601658763/.test(reply) && /(我们一[直]在|不需要你一个人|请一定)/.test(reply);
  if (looksLikeCrisisCard) {
    return { isLowMood, demoted: false, text: reply };
  }

  const qmAlt = new RegExp(QM_CRISIS_HOTLINES.map(escape).join("|"), "g");
  const hadCrisisHotline = QM_CRISIS_HOTLINES.some((n) => reply.includes(n));
  if (!hadCrisisHotline) {
    return { isLowMood, demoted: false, text: reply };
  }

  // 逐行处理：含危机专号的行，若能剥离号码后仍有实质内容则保留（如"可打15001930070聊聊"→"可打聊聊"不保留，
  // 改为把整行视为无意义电话行移除；若行内含 12356 或其他文字则仅剥号）。
  const lines = reply.split("\n");
  const kept: string[] = [];
  for (const raw of lines) {
    const line = raw;
    const hasQM = QM_CRISIS_HOTLINES.some((n) => line.includes(n));
    if (!hasQM) {
      kept.push(line);
      continue;
    }
    // 该行含危机专号：先剥号，评估剩余内容
    const stripped = line.replace(qmAlt, "");
    const remainder = stripped.replace(/[📞☎️✆\s-]+/g, "").trim();
    const keepsNational = stripped.includes(NATIONAL_HOTLINE);
    if (keepsNational || /[0-9a-zA-Z\u4e00-\u9fa5]/.test(remainder)) {
      // 行内仍有实质内容或保住了 12356 → 仅剥危机专号，保留该行
      const cleaned = stripped.replace(/(?:（[^）]*?）\(?[^)]*?\)?[^（]*)/g, "").trim();
      kept.push(cleaned);
    }
    // 纯危机电话行 → 整行丢弃
  }

  let out = kept.join("\n");
  // 兜底补一句 12356（普通低落可安全给到的唯一热线）——仅当原回复本就含热线语境时才补，避免无中生有
  if (/(热线|拨打|打给|求助|号码|电话|渠道|联系)/.test(reply) && !out.includes(NATIONAL_HOTLINE)) {
    out = `${out}\n\n如果需要找人聊聊，可以拨打全国心理援助热线 12356（7×24 小时）。`;
  }
  out = out.replace(/\n{3,}/g, "\n\n").replace(/[ \t]{2,}/g, " ").trim();
  const demoted = out !== reply;
  return { isLowMood, demoted, text: demoted ? out : reply };
}

function escape(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}