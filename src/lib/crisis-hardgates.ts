// 危机分类器·第 1 层确定性硬闸（独立配置，无条件覆盖）
// 设计铁律：
//  1. 本层词表独立于第 2 层三因子语义判定，可单独维护、热更新、做字节级回归。
//  2. 命中任一类词 → 无条件 isCrisis=true（direct，第一人称危机卡），
//     不受第 2 层专业豁免/写作视角闸门压制，也不依赖关键词遍历顺序。
//  3. 只做"报警/不报警"的过闸判定，不产生文案；文案仍由 CRISIS_RESPONSE 模板统一出。

// 硬闸命中后返回的第一人称直白卡级别（与 detectCrisis 的 direct 对齐）
export type HardGateLevel = "direct";

// 命中类别，供断言/回执/字节级回归诊断用
export type HardGateCategory =
  | "plan"      // 明确计划：想好怎么/何时/何地走、已有方法
  | "means"     // 明确手段：药/刀/绳/河/楼/扣点等具体实施方式
  | "imminent"  // 正在/即将实施：站上/已经/刚吞/正在/现在
  | "self_ref"  // 人称归位：把前面第三人称叙事的"危"归位到"我"

export interface HardGateHit {
  gate: boolean;
  category: HardGateCategory | null;
  matched: string | null;
}

// ---- 计划族：想好/决定/通知时间地点等，明确指向"我即将实施" ----
const PLAN_PATTERNS: { re: RegExp; category: HardGateCategory }[] = [
  { re: /想好去(哪|哪|哪里)|已经想好|想好一个地方|地方(已经)?想好/i, category: "plan" },
  { re: /决定(今天|今晚|明天|这周|月末|周末|现在就|等.{0,6}就)?(?<!走)(?<!一)(?<!再)(?<!先)走(?!(一?走|出))|决定.{0,6}(结束|离开|了结)/i, category: "plan" },  // R3.7: walk-leisure guard
  { re: /(今晚|今天|明天|晚上|睡前|放学|下班|周末|月底|晚上睡觉时).{0,8}(就|会|准备|要)?((?<!走)(?<!一)(?<!再)(?<!先)走(?!(一?走|出))|走掉|动手|实施|结束|不在了)/i, category: "plan" },  // R3.7: walk-leisure guard
  { re: /不告诉(任何人|家人|爸妈|他们).{0,10}(时间|地点|哪里|怎么做)|别(告诉|跟).{0,8}(爸妈|家人).{0,6}(我要|我会)/i, category: "plan" },
];

// ---- 手段族：具体实施方式 ----
const MEANS_PATTERNS: { re: RegExp; category: HardGateCategory }[] = [
  { re: /(药|安眠药|一把药|整瓶药|药片).{0,6}(备好|攒够|都买好|准备好了|在手里|已经买了|囤了|攥着)/i, category: "means" },
  { re: /(刀|钥匙|绳|绳子|皮带|毛巾|丝巾).{0,6}(在(手|身边|床头|枕头下)|已经买了|拿出来了|准备好了|攥着|放.)/i, category: "means" },
  { re: /已(经)?(站在|走上|爬上|翻到|坐到|迈上).{0,6}(天台|楼顶|窗台|桥边|岸边|高处|栏杆|围栏|屋顶)/i, category: "means" },
  { re: /(跳|纵身|一头栽|往下跳).{0,6}(楼|桥|河|崖|下去)/i, category: "means" },
  { re: /(想要|想去|想)(买|囤|拿|找|搞到).{0,6}(药|安眠药)|(买|囤).{0,6}(了|好)?(药|安眠药)/i, category: "means" },
];

// ---- 进行中/立即实施族 ----
const IMMINENT_PATTERNS: { re: RegExp; category: HardGateCategory }[] = [
  { re: /(正在|已经|刚|马上就|现在就要|这就|此刻|正在计划).{0,8}(做|实施|动手|吞|割|跳|走|结束)/i, category: "imminent" },
  { re: /(已经|刚|正在).{0,6}(割|划|吞|跳|站|架|拴)/i, category: "imminent" },
  { re: /流(血|了很多血)|手腕.{0,4}(破了|在流血)|已经(破)|止不住血/i, category: "imminent" },
];

// ---- 人称归位族：第三人称"危"叙事 → 归位到"我" ----
// 若前文用第三人称（他/她/那个人/有人）讲了危机，本句明确"其实就是我/说的是我"，需硬闸覆盖。
// 仅认定"肯定归位"（就是我/其实是我/指的就是我）；"其实不是我/那个人不是我"属否定，不归位（X01 专业/否认场景）。
const SELF_REF_PATTERNS: { re: RegExp; category: HardGateCategory }[] = [
  { re: /(?:其实|就是|正是|指的就是|说的是)(?!不{1,2}|并非|不是)(?:\S{0,3}?)(?:我|我自己)/i, category: "self_ref" },
  { re: /(?:那个|刚才说的|案例里那个|说的那个|案例中的|故事里那)\S{0,4}(?:人|女生|男生|同学|朋友|当事人|来访者|案例)\S{0,4}(?:其实是|就是|只是|是我)|(?:那个|刚才说的|案例里那个|说的那个)\S{0,6}(?:人|女生|男生|同学|朋友|当事人|来访者)\S{0,6}(?:是|就是|其实就)(?!(?:不|不是|并非|并不|绝不是|肯定(?:不|不是)))(?:我|我自己)/i, category: "self_ref" },
  { re: /(?:我说|指的是|躲不掉的)\S{0,4}(?:我自己)|(?:讲|说|写)的\S{0,6}(?:就是|是|指)(?:我|我自己)(?!不)/i, category: "self_ref" },
];

export function detectHardGate(text: string): HardGateHit {
  // [RETEST-FIX-2-P04] first-person metaphor forced crisis (v2: drop person-prefix, covers pro-drop Chinese)
  {
    const _T = String(text ?? '');
    if (/(消失|解脱|一了百了|不存在了)/.test(_T)
        && !/(新闻|文献|量表|伦理|历史|曾经|以前|当年|他|她|ta|来访者|患者|个案|学生)/.test(_T)) {
      return { gate: true, category: null, matched: 'RETEST-FIX-P04' };
    }
    // [RETEST-FIX-2-T01T02] professional third-person active crisis (v2: wordform completion)
    if (/(来访者|个案|患者|当事人|案主)/.test(_T)
        && /(今晚|今夜|备好|备了|动手|了结|吞药|吞了药|服了药|服下|结束生命|想好怎么结束|查了[^。]{0,10}(方法|方式|途径)|准备[^。]{0,6}(手段|药物|离开))/.test(_T)) {
      return { gate: true, category: null, matched: 'RETEST-FIX-T01T02' };
    }
  }

  // T10 新闻/社会旁观豁免（安全侧定稿）：主语为"新闻/报道/有人/他们/大家"且全文无第一人称危险意图时，
  // 硬闸的 means/imminent 族不得因动作样态（跳楼/割腕等）误抓第三人称客观描述。
  // 一旦出现第一人称危险意图（我也/换我/我也会/我要/我想…），立即回退为正常硬闸判定（升级硬卡）。
  const bystander = /(?:新闻|报道|资讯|热搜|消息说|听(?:说|到)|看到|大家|有人|有个人|他们|那些人|别人|路人|网(?:友|上))/i;
  const firstPersonDangerIntent = /(?:我也|换我|我也会|我可能|我想.{0,4}(?:也|就)|我要(?:那)?样|如果是(?:我|我自己)|假设我)/i;
  if (bystander.test(text) && !firstPersonDangerIntent.test(text)) {
    // 新闻旁观：跳过 means/imminent（动作样态客观描述），仅保留 plan / self_ref（那类本身带第一人称意图）
    for (const group of [PLAN_PATTERNS, SELF_REF_PATTERNS]) {
      for (const p of group) {
        if (p.re.test(text)) {
          return { gate: true, category: p.category, matched: p.re.source };
        }
      }
    }
    return { gate: false, category: null, matched: null };
  }
  for (const group of [PLAN_PATTERNS, MEANS_PATTERNS, IMMINENT_PATTERNS]) {
    for (const p of group) {
      if (p.re.test(text)) {
        return { gate: true, category: p.category, matched: p.re.source };
      }
    }
  }
  // 人称归位族带文件级否定守卫：文本含"不是我/并非我/其实不是我/绝不是…我"等否定 → 不归位（X01 专业/否认场景）
  const selfRefNegationGuard = /(?:不是|并没有?是|并非|其实不|绝不是|反正不是|真不是|确实不).{0,5}(?:我|我自己|我本人)/i;
  if (!selfRefNegationGuard.test(text)) {
    for (const p of SELF_REF_PATTERNS) {
      if (p.re.test(text)) {
        return { gate: true, category: p.category, matched: p.re.source };
      }
    }
  }
  return { gate: false, category: null, matched: null };
}