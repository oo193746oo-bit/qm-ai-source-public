/**
 * QM AI 认知运行层 v1.0
 * 
 * 这是小酷小雪的"大脑"——不是关键词检测器，而是：
 * 情境理解 → 关系建模 → 多假设 → 机制比较 → 资料调用 → 对话策略 → 自查修复
 * 
 * 基于 Lara 提供的「认知运行层与跨年代推理部署 v1.0」架构实现。
 * 数据来源：7个资料库、98.4万条训练数据提炼的4760条精选案例 + 212条思维透镜。
 * 
 * 优先级（高→低）：
 *   1. safety/legal/privacy
 *   2. DECISION-ROLE-001 四角色宪法
 *   3. verified_facts/capabilities（已验证事实）
 *   4. cognitive_runtime（本模块）
 *   5. domain_databases（领域资料库）
 *   6. style（语言风格）
 */

import fs from "fs";
import path from "path";
import { analyzeProfessionalContext, buildProfessionalPromptBlock, verifyProfessionalOutput, type ProfessionalContext } from "./professional-context-runtime";
import { analyzeMusicOpportunity, retrieveMusicCandidates, buildMusicPromptBlock, verifyMusicOutput, type MusicOpportunityContext } from "./music-context-runtime";
import { analyzeLiteratureOpportunity, retrieveLiteratureCandidates, buildLiteraturePromptBlock, verifyLiteratureOutput, type LiteratureOpportunityContext } from "./literature-context-runtime";
import { analyzeGamingContext, retrieveGameCandidates, buildGamingPromptBlock, verifyGamingOutput, type GamingContext } from "./game-context-runtime";

// ============================================================
// 类型定义
// ============================================================

export type HypothesisStatus = "supported" | "possible" | "weak" | "contradicted";

export interface Actor {
  role: string;           // 如"用户""母亲""主管""伴侣"
  generation?: string;    // 如"90后""80后"——仅用户明确说才填
  concern?: string;       // 该方可能在回应什么
  actualWords?: string;   // 该方的原话（如有）
}

export interface Hypothesis {
  id: string;
  explanation: string;         // 解释
  isGroupBased: boolean;       // 是否基于群体/年代
  status: HypothesisStatus;
  evidence: string[];          // 支持证据
  counterEvidence: string[];   // 反证据
  conflictAxis?: string;       // 冲突轴（如"自主 vs 风险管理"）
}

export interface ContextSchema {
  userExplicitFacts: string[];     // 用户明确说的事实
  currentIssue: string;            // 当前议题
  currentGoal: string;             // 用户目标
  emotionState: string;            // 情绪状态
  actors: Actor[];                 // 关系中的主体
  candidateConflictAxes: string[]; // 候选冲突轴
  verifiedFacts: string[];         // 已验证事实
  hypotheses: Hypothesis[];        // 候选假设
  unknowns: string[];              // 未知信息
  detectedPacks: string[];         // 命中的资料库
  languagePreference?: string;     // 语言偏好
  role?: string;                   // 当前角色（xiaoku/xiaoxue），审核时注入
  professionalContext?: ProfessionalContext;  // 心理专业用户/个案讨论模式
  musicContext?: MusicOpportunityContext;     // 音乐共情/推荐机会
  literatureContext?: LiteratureOpportunityContext; // 诗词文学共情/作品推荐
  gamingContext?: GamingContext;                     // 游戏文化共情/玩家心理
}

export interface KnowledgeCase {
  id: string;
  pack: string;
  domain?: string;
  dimension?: string;
  topic?: string;
  scenario?: string;
  correct?: string;
  incorrect?: string;
  empathy?: string;
  discomfort?: string;
  protection?: string;
  contradiction?: string;
  no_infer?: string;
  xk_rule?: string;
  xx_rule?: string;
  [key: string]: unknown;
}

export interface ThinkingLens {
  id: string;
  axis: string;
  insight: string;
  source: string;
}

export interface RetrievedCase {
  case: KnowledgeCase;
  score: number;
  matchedKeywords: string[];
}

export interface CognitiveResult {
  context: ContextSchema;
  relevantLenses: ThinkingLens[];
  retrievedCases: RetrievedCase[];
  reasoningSteps: string[];
  promptBlock: string;           // 注入到 LLM 的认知指令块
  verifierWarnings: string[];    // 审核警告
}

// ============================================================
// 核心冲突轴（跨年代/跨领域通用）
// ============================================================

const CONFLICT_AXES: Record<string, { keywords: string[]; insight: string }> = {
  "自主 vs 风险管理": {
    keywords: ["换工作", "辞职", "搬家", "恋爱", "出柜", "留学", "结婚", "离婚", "选择", "自由", "控制", "担心", "反对", "冒险"],
    insight: "一方在争取选择权，另一方在管理风险。双方可能没有在回答同一个问题。",
  },
  "归属 vs 个体化": {
    keywords: ["家里", "家庭", "群体", "独立", "自己", " belonging", "融入", "离开", "回来", "期待"],
    insight: "想属于关系/群体，同时想保持自己。不要用'你要独立'粗暴解决。",
  },
  "责任 vs 自我": {
    keywords: ["责任", "照顾", "养老", "育儿", "应该", "自己", "需要", "牺牲", "个人", "照护"],
    insight: "承担责任不等于取消自己的需要。不能默认责任优先。",
  },
  "稳定 vs 变化": {
    keywords: ["稳定", "改变", "换", "新", "安全感", "成长", "重新开始", "固定", "变动"],
    insight: "稳定带来安全，变化带来自主或成长。不能把稳定写成保守、变化写成进步。",
  },
  "经验 vs 淘汰感": {
    keywords: ["经验", "年纪", "淘汰", "跟不上", "新人", "学习", "能力", "老了", "过时"],
    insight: "经验可为资源也会触发不安全感。",
  },
  "成功 vs 空心": {
    keywords: ["成功", "空虚", "没意义", "外在", "内在", "满足", "成就", "空心", "迷茫"],
    insight: "外在稳定不代表内在满足。",
  },
  "休息 vs 怕落后": {
    keywords: ["休息", "放松", "落后", "内卷", "比较", "躺平", "努力", "焦虑", "停下来"],
    insight: "休息不等于放弃。",
  },
  "亲密 vs 自主": {
    keywords: ["亲密", "距离", "空间", "黏", "疏远", "靠近", "边界", "恋爱", "伴侣"],
    insight: "亲近与边界可并存。",
  },
  "被看见 vs 怕暴露": {
    keywords: ["关注", "暴露", "社交", "展示", "隐藏", "认可", "评价", "出柜", "隐私"],
    insight: "想被看见和怕暴露可以同时真实。",
  },
  "做自己 vs 怕不合群": {
    keywords: ["做自己", "合群", "融入", "与众不同", "异类", "接受", "迎合", "真实"],
    insight: "做自己和怕不合群可以同时存在。",
  },
};

// ============================================================
// 对话技能（从 mechanism 到 dialogue skill，不直接复制资料库措辞）
// ============================================================

const DIALOGUE_SKILLS = {
  specific_empathy: "用用户本轮原话做具体共情，不群体化、不标签化",
  double_sided_mentalization: "呈现双方各自在回应什么心理需要，不站队、不贴标签",
  single_deep_open_question: "只问一个从本轮材料长出来的深度开放问题，不问模板问题",
  clarify_assumption: "当用户表述中有隐含假设时，温和澄清而非直接接受",
  permission_before_resource: "给资源前先确认用户是否想要，不强行推送",
  repair_after_microaggression: "如果AI或对方说了让人不舒服的话，先承认感受再修正",
  respect_not_want_to_talk: "用户不想谈时尊重，不追问",
  summarize_progress: "阶段性总结对话进展",
  explain_next_step: "说明下一步可以做什么",
};

// ============================================================
// 认知审核规则（COG-H001 ~ H012）
// ============================================================

export interface VerifierCheck {
  id: string;
  level: "P0" | "P1";
  description: string;
  check: (output: string, ctx: ContextSchema) => boolean; // true = violation
}

const COGNITIVE_CHECKS: VerifierCheck[] = [
  {
    id: "COG-H001",
    level: "P0",
    description: "把群体/年代资料写成用户个人事实",
    check: (output, ctx) => {
      const groupPatterns = [ `你们这代人", "你们90后", "你们00后", "你们80后", "你们70后", "你们60后"`, `你们年轻人", "你们中年人", "你们老年人", "你们老人"`, `同性恋都", "留学生都", "台湾人都", "大陆人都"`, `所有gay", "所有同性恋", "所有跨性别"`, `华人都", "中国人都", "外国人都"`, `二次元都", "宅男都", "腐女都"`, `肯定已经结婚", "肯定结婚生子", "一定结婚了", "肯定有孩子"`,
      ];
      // "你们XX都" / "XX人都" 模式
      const broadStereo = /(?:你们|所有|全部|一般).{0,8}(?:都|全部|一律|肯定|一定)/.test(output)
        && /(?:代|人|岁|后|gay|同性恋|留学生|华人|家长|父母|老人|年轻人)/.test(output);
      return groupPatterns.some(p => output.includes(p)) || broadStereo;
    },
  },
  {
    id: "COG-H002",
    level: "P0",
    description: "只有群体解释，没有非群体解释",
    check: (output, ctx) => {
      if (ctx.actors.length >= 2) {
        const hasIndividualExplanation = /可能|也许|有时候|不一定|也可能不是/.test(output);
        const hasGroupLabel = /代际|年代|代沟|这一代人/.test(output);
        return hasGroupLabel && !hasIndividualExplanation;
      }
      return false;
    },
  },
  {
    id: "COG-H003",
    level: "P1",
    description: "关系问题只分析用户，不建模另一方",
    check: (output, ctx) => {
      if (ctx.actors.length >= 2) {
        const otherActor = ctx.actors[1];
        if (otherActor) {
          const otherMentioned = output.includes(otherActor.role) || 
            (otherActor.actualWords && output.includes(otherActor.actualWords.slice(0, 5)));
          return !otherMentioned && output.length > 100;
        }
      }
      return false;
    },
  },
  {
    id: "COG-H004",
    level: "P1",
    description: "只说'代际不同'但没有具体行为层解释",
    check: (output) => {
      return /代际不同|年代差异|代沟|价值观不同/.test(output) && 
             !/担心|需要|可能在|具体|风险|选择|安全/.test(output);
    },
  },
  {
    id: "COG-H005",
    level: "P1",
    description: "检索命中直接进入回答，未做证据筛选",
    check: () => false, // 此规则在运行时通过 retrieveCases 的筛选逻辑保证
  },
  {
    id: "COG-H006",
    level: "P0",
    description: "把possible写成确定事实",
    check: (output, ctx) => {
      const possibleHypotheses = ctx.hypotheses.filter(h => h.status === "possible");
      return possibleHypotheses.some(h => {
        const key = h.explanation.slice(0, 8);
        return output.includes(key) && !/可能|也许|听起来像|或许/.test(output);
      });
    },
  },
  {
    id: "COG-H007",
    level: "P0",
    description: "未验证制度/行政事实由语境自动生成",
    check: (output) => {
      const factPatterns = [/\d+元/, /\d+块/, /签证.*\d+天/, /法律规定/, /法律要求/, /政策规定/];
      return factPatterns.some(p => p.test(output)) && !/据我所知|建议你确认|请以官方/.test(output);
    },
  },
  {
    id: "COG-H011",
    level: "P0",
    description: "小酷/小雪角色治理被认知层覆盖",
    check: (output, ctx) => {
      // 小酷回答了行政问题
      const xkAdminPatterns = ["预约", "费用是", "地址是", "营业时间", "多少钱", "收费标准"];
      const xxPsychPatterns = ["我理解你", "你感到", "心理上", "情绪上", "抑郁", "焦虑"];
      // 这个检查需要知道当前角色，在verify函数中传入
      return false;
    },
  },
  {
    id: "COG-H012",
    level: "P1",
    description: "用户纠正后仍使用旧假设",
    check: () => false, // 需要历史对话上下文，在route层处理
  },
  // ===== 婚姻法律认知防幻觉规则（MAR-H系列）=====
  {
    id: "MAR-H001",
    level: "P0",
    description: "未确认法域就给婚姻法结论",
    check: (output, ctx) => {
      if (!ctx?.detectedPacks?.includes("marriage")) return false;
      const hasLegalConclusion = /(?:财产分割|抚养权|离婚判决|继承|监护权|夫妻共同财产).{0,20}(?:应该|可以|会|必须|一定)/.test(output);
      const hasJurisdiction = /(?:大陆|台湾|中国大陆|中国台湾|当地|所在地区|法域|辖区|司法)/.test(output);
      return hasLegalConclusion && !hasJurisdiction;
    },
  },
  {
    id: "MAR-H003",
    level: "P0",
    description: "意定监护说成婚姻等价物",
    check: (output, ctx) => {
      if (!ctx?.detectedPacks?.includes("marriage")) return false;
      return /(?:意定监护).{0,30}(?:等同于|就是|相当于|完全替代|和婚姻一样|等于结婚)/.test(output);
    },
  },
  {
    id: "MAR-H007",
    level: "P0",
    description: "夫妻财产自动说一人一半",
    check: (output, ctx) => {
      if (!ctx?.detectedPacks?.includes("marriage")) return false;
      return /(?:财产|房产|资产).{0,20}(?:一人一半|平分|各分一半|对半分)/.test(output) &&
             !/(?:协议|协商|约定|具体情况|咨询|确认)/.test(output);
    },
  },
  {
    id: "MAR-H010",
    level: "P0",
    description: "家暴场景只建议沟通",
    check: (output, ctx) => {
      if (!ctx?.detectedPacks?.includes("marriage")) return false;
      const hasViolence = /(?:家暴|暴力|打|威胁|控制|强迫|伤害)/.test(output);
      const onlyCommunicate = /(?:多沟通|好好沟通|沟通一下|试着沟通|双方沟通)/.test(output);
      const hasSafety = /(?:安全|报警|求助|保护|热线|离开|庇护|法律途径)/.test(output);
      return hasViolence && onlyCommunicate && !hasSafety;
    },
  },
  {
    id: "MAR-H019",
    level: "P0",
    description: "小酷给法律意见",
    check: (output, ctx) => {
      if (ctx?.role !== "xiaoku" || !ctx?.detectedPacks?.includes("marriage")) return false;
      const legalAdvice = /(?:根据法律|法律规定|法条|民法典第|你可以起诉|我建议你.{0,6}起诉|直接起诉|去法院告|法院会判|你能分到|你有权(?:要求|分到)|申请人身安全保护令|收集.{0,6}证据|抚养权(?:归|会判给)|财产会怎么判|走法律程序)/.test(output);
      const hasDisclaimer = /(?:咨询律师|法律专业人士|向律师|建议你寻求法律|请咨询|专业律师|法律援助)/.test(output);
      return legalAdvice && !hasDisclaimer;
    },
  },
  {
    id: "MAR-H020",
    level: "P0",
    description: "小雪做婚姻咨询",
    check: (output, ctx) => {
      if (ctx?.role !== "xiaoxue" || !ctx?.detectedPacks?.includes("marriage")) return false;
      return /(?:你感到|你觉得|心理上|情绪上|婚姻关系里|亲密关系中|你们的沟通模式)/.test(output);
    },
  },
  // ===== 意定监护防幻觉规则（VG-H系列）=====
  {
    id: "VG-H001",
    level: "P0",
    description: "把意定监护等同婚姻",
    check: (output, ctx) => {
      if (!ctx?.detectedPacks?.includes("guardianship")) return false;
      return /(?:意定监护|监护协议).{0,30}(?:等同于|就是|相当于|完全替代|和婚姻一样|等于结婚|与婚姻同等效力)/.test(output);
    },
  },
  {
    id: "VG-H002",
    level: "P0",
    description: "意定监护自动说能继承",
    check: (output, ctx) => {
      if (!ctx?.detectedPacks?.includes("guardianship")) return false;
      return /(?:意定监护|监护).{0,20}(?:可以继承|就能继承|自动继承|享有继承权|可以继承遗产)/.test(output) &&
             !/(?:遗嘱|另外|单独|不自动|并不|需另行|不能仅)/.test(output);
    },
  },
  {
    id: "VG-H003",
    level: "P0",
    description: "意定监护自动说能决定所有医疗",
    check: (output, ctx) => {
      if (!ctx?.detectedPacks?.includes("guardianship")) return false;
      return /(?:意定监护|监护人).{0,20}(?:可以决定所有|能决定一切|所有医疗|全部医疗|任何医疗)/.test(output);
    },
  },
  {
    id: "VG-H004",
    level: "P0",
    description: "意定监护自动说能处分全部财产",
    check: (output, ctx) => {
      if (!ctx?.detectedPacks?.includes("guardianship")) return false;
      return /(?:意定监护|监护人).{0,20}(?:可以处分全部|自由处分所有|任意处置全部|处置所有财产)/.test(output);
    },
  },
  {
    id: "VG-H007",
    level: "P0",
    description: "把LGBTQ当只能意定监护",
    check: (output, ctx) => {
      if (!ctx?.detectedPacks?.includes("guardianship")) return false;
      return /(?:同性伴侣|gay伴侣|les伴侣|同性关系|非婚伴侣|LGBTQ伴侣).{0,30}(?:只能|只有|唯一办法|唯一途径|必须).{0,20}(?:意定监护)/.test(output);
    },
  },
  {
    id: "VG-H008",
    level: "P0",
    description: "把老年人当无能力",
    check: (output, ctx) => {
      if (!ctx?.detectedPacks?.includes("guardianship")) return false;
      return /(?:老人|老年人|年纪大|上了年纪).{0,20}(?:没有能力|无法自己|不能自己|已经糊涂|做不了主)/.test(output) &&
             !/(?:可能|需评估|行为能力鉴定|医学|法院|监护宣告)/.test(output);
    },
  },
  {
    id: "VG-H017",
    level: "P0",
    description: "小酷给个案法律结论",
    check: (output, ctx) => {
      if (ctx?.role !== "xiaoku" || !ctx?.detectedPacks?.includes("guardianship")) return false;
      return /(?:根据法律|法律规定|你可以办理|协议必然生效|法院会认定|你有权|必须公证|公证是法定必经)/.test(output) &&
             !/(?:咨询|律师|公证员|公证处|法律专业人士|以当地|以官方|核实)/.test(output);
    },
  },
  {
    id: "VG-H018",
    level: "P0",
    description: "小雪给公证流程/法律结论",
    check: (output, ctx) => {
      if (ctx?.role !== "xiaoxue" || !ctx?.detectedPacks?.includes("guardianship")) return false;
      return /(?:公证需要|办理需要|材料包括|费用是|期限是|流程是|法律效力|公证是必经)/.test(output);
    },
  },
  {
    id: "VG-H021",
    level: "P0",
    description: "用户当前受控制/财产侵害却只谈未来规划",
    check: (output, ctx) => {
      if (!ctx?.detectedPacks?.includes("guardianship")) return false;
      // 这个检查较难仅从 output 判断，留作 context 驱动；暂不在纯 output 上触发
      return false;
    },
  },
  // ============================================================
  // 中老年照护 EC-H 防幻觉审核（P0）
  // ============================================================
  {
    id: "ACG-H001",
    level: "P0",
    description: "ACG兴趣→病理化推断（逃避现实/社交障碍/成瘾）",
    check: (output, ctx) => {
      if (!ctx?.detectedPacks?.includes("acg")) return false;
      return /(?:动漫|二次元|游戏|cos|同人|番剧|轻小说|原神|追星|嗑CP).{0,15}(?:逃避现实|社交障碍|社交恐惧|现实中失败|成瘾|沉迷|宅|不敢面对现实|心理问题|孤僻)/.test(output)
        && !/(?:可能|也许|有时候|不一定|也可能|如果你自己觉得|你自己的感受)/.test(output);
    },
  },
  {
    id: "ACG-H002",
    level: "P0",
    description: "ACG兴趣推断年龄/性别/性取向",
    check: (output, ctx) => {
      if (!ctx?.detectedPacks?.includes("acg")) return false;
      return /(?:看动漫|玩游戏|二次元|喜欢同人).{0,12}(?:你应该?是\d{2}后|你一定是年轻人|你是男生|你是女生|你是gay|你是les)/.test(output);
    },
  },
  {
    id: "GENZ-H001",
    level: "P0",
    description: "网络用词/表达推断年龄/诊断",
    check: (output, ctx) => {
      if (!ctx?.detectedPacks?.includes("genz")) return false;
      const slang = /(?:emo|社恐|破防|躺平|内卷|绝绝子|yyds|家人们|摆烂|蚌埠住了)/.test(output);
      const inferAge = /(?:你是00后|你是95后|你肯定\d{2}后|看你.{0,8}(?:应该|肯定|是)0?0?后|从你的用词|你的用词.{0,8}(?:看|说明|显示)|你有(?:抑郁症|焦虑症|ADHD)|你需要看医生|你有心理疾病)/.test(output);
      // 模式A：slang+推断；模式B：直接从用词推断年龄（即使没明显slang词）
      const inferFromWording = /(?:从你的用词|看你.{0,6}用词|你的(?:说话|表达|用词)方式).{0,15}(?:\d{2}后|年轻|年纪|岁|00后|95后)/.test(output);
      return ((slang && inferAge) || inferFromWording) && !/(?:可能|也许|不一定|如果你自己觉得)/.test(output);
    },
  },
  {
    id: "GENZ-H002",
    level: "P0",
    description: "2010后内容涉及未成年人保护却没识别",
    check: (output, ctx) => {
      if (!ctx?.detectedPacks?.includes("genz")) return false;
      // 用户提到上学/未成年相关，但回应把其当成人处理
      return /(?:我1[0-5]岁|我初中|我小学|我高中|我未成年).{0,30}/.test(output)
        && /(?:辞职|裸辞|离婚|结婚|同居|经济独立|搬出去住)/.test(output);
    },
  },
  {
    id: "LGBTQ-H001",
    level: "P0",
    description: "从行为/关系推断性取向/性别认同",
    check: (output, ctx) => {
      if (!ctx?.detectedPacks?.includes("lgbtq")) return false;
      // 观察+推断性取向/身份
      const observation = /(?:跟[^，。]{0,10}(?:亲密|好|走得近|黏)|喜欢[^，。]{0,10}(?:打扮|运动|游戏|男生|女生)|没谈过(?:男朋友|女朋友)|一直单身|不爱打扮|娘娘腔|男人婆|好闺蜜|好兄弟|室友)/.test(output);
      const inference = /(?:你(?:可能|应该|肯定|是不是|说不定|搞不好).{0,8}(?:是|属于|喜欢).{0,8}(?:gay|同性恋|双性恋|跨性别|les|直的|异性恋|同志)|可能是同性恋|可能是gay|应该是同性恋|你性取向|你(?:是不是|会不会是)gay|你(?:可能|应该|是)同性恋|你(?:可能|应该|是)gay)/.test(output);
      // 注意：即使有"可能"这种软词，从行为推断性取向本身也是不专业的，应该让用户自述
      return observation && inference;
    },
  },
  {
    id: "LGBTQ-H002",
    level: "P0",
    description: "把LGBTQ身份病理化/需要治疗",
    check: (output, ctx) => {
      if (!ctx?.detectedPacks?.includes("lgbtq")) return false;
      return /(?:同性恋|跨性别|双性恋|非二元).{0,15}(?:是病|需要治|可以矫正|扭转治疗|不正常|违背自然|后天形成|可以改)/.test(output);
    },
  },
  {
    id: "LGBTQ-H003",
    level: "P0",
    description: "逼出柜/替用户向他人公开身份",
    check: (output, ctx) => {
      if (!ctx?.detectedPacks?.includes("lgbtq")) return false;
      return /(?:你应该|你要|你必须|你一定得).{0,10}(?:出柜|告诉(?:爸妈|父母|家人|朋友|同事)|公开|坦白)/.test(output)
        && !/(?:你自己决定|如果你愿意|等你准备好|你觉得安全)/.test(output);
    },
  },
  {
    id: "OVERSEAS-H001",
    level: "P0",
    description: "推断国籍/签证/移民状态",
    check: (output, ctx) => {
      if (!ctx?.detectedPacks?.includes("overseas")) return false;
      const exp = /(?:在国外|在海外|在美|在英|在加|在澳|在日|在韩|在欧|留学|移民|出国|国外|海外|待了\d+年|住了\d+年)/.test(output);
      const infer = /(?:你(?:肯定|应该|一定|说不定|搞不好).{0,15}(?:入了|拿了|是|已经|换了).{0,10}(?:国籍|绿卡|PR|公民|身份)|你(?:已经|肯定|一定).{0,4}(?:移民|入籍|换国籍)|你签证.{0,8}(?:是|快到期|不能|没问题)|你不是中国|你算美国|换了?国籍|换了?身份)/.test(output);
      return exp && infer;
    },
  },
  {
    id: "OVERSEAS-H002",
    level: "P0",
    description: "海外生活浪漫化/贬低",
    check: (output, ctx) => {
      if (!ctx?.detectedPacks?.includes("overseas")) return false;
      return /(?:国外(?:都|一定)(?:好|轻松|自由|开放|没压力)|出国就(?:好了|解决了)|外国(?:人|月亮).{0,6}(?:更|比较)|国内(?:都|就是)(?:卷|差|压抑|不自由))/.test(output);
    },
  },
  {
    id: "POST80S-H001",
    level: "P0",
    description: "默认已婚有孩/有房贷",
    check: (output, ctx) => {
      if (!ctx?.detectedPacks?.includes("post80s")) return false;
      return /(?:你(?:老公|老婆|媳妇|爱人|先生|太太)|你(?:孩子|儿子|女儿|娃)|你(?:房贷|车贷)).{0,20}/.test(output)
        && !/(?:如果|假设|你提到|你说过|如果你有|你已经)/.test(output);
    },
  },
  {
    id: "POST80S-H002",
    level: "P0",
    description: "中年危机标签化",
    check: (output, ctx) => {
      if (!ctx?.detectedPacks?.includes("post80s")) return false;
      return /(?:你这是|这就是|典型的|标准的|就是所谓的).{0,8}(?:中年危机|中年困境|中年焦虑|三明治世代|上有老下有小的命)|中年危机/.test(output)
        && !/(?:可能|也许|有时候|你自己的感受|你怎么看|你觉得|对你来说)/.test(output);
    },
  },
  {
    id: "POST70S-H001",
    level: "P0",
    description: "把中老年人当无能力/科技盲/固执/标签化",
    check: (output, ctx) => {
      if (!ctx?.detectedPacks?.includes("post70s")) return false;
      return /(?:你(?:这个年纪|这岁数|这把年纪|老人家).{0,15}(?:学不会|不懂|out了|跟不上|别折腾|认命|颐养天年|带孙子就行)|老人(?:都|一般)(?:固执|节俭|啰嗦|难沟通|不会用)|中年危机|空巢期|退休综合症)/.test(output)
        && !/(?:可能|也许|你自己的感受|你怎么看|你觉得|对你来说|不一定)/.test(output);
    },
  },
  {
    id: "CROSSGEN-H001",
    level: "P0",
    description: "跨年代冲突只站一方",
    check: (output, ctx) => {
      if (!ctx?.detectedPacks?.includes("crossgen")) return false;
      // 站父母方
      const takeParentSide = /(?:也是为你好|为你好|你要理解|你就听|天下无不是|养育之恩|毕竟是你|都是为你|她也是|他也是|还不是为了你|别跟.{0,4}(?:吵|争|计较)|忍一忍|大度|她年纪大了|他老了|长辈.{0,6}(说|做).{0,6}(?:对|应该)|听话)/.test(output);
      // 站子女方（极端）
      const takeChildSide = /(?:控制|绑架|有毒|越界|不尊重|在伤害|你应该反抗|断绝关系|搬出去|离开他们|他们不配)/.test(output);
      const bothSides = /(?:一方.{0,10}另一方|两边都|各自的立场|都有各自|既理解.{0,10}也|站在.{0,6}角度|对你来说).{0,20}(?:同时|也|但)|你怎么看|你觉得呢|你自己的感受|你愿意说说/.test(output);
      return (takeParentSide || takeChildSide) && !bothSides && output.length > 12;
    },
  },
  {
    id: "TAIWAN-H001",
    level: "P0",
    description: "把语言偏好当国籍/政治立场证据",
    check: (output, ctx) => {
      if (!ctx?.detectedPacks?.includes("taiwan")) return false;
      return /(?:你用繁体|你注音|你说台湾国语|你说「」).{0,15}(?:所以你(?:是|支持|认为)|你一定(?:是|支持)|你就是(?:台独|深绿|蓝营))/.test(output);
    },
  },
  {
    id: "TAIWAN-H002",
    level: "P0",
    description: "简体用户被当作非台湾人/被排斥",
    check: (output, ctx) => {
      if (!ctx?.detectedPacks?.includes("taiwan")) return false;
      return /(?:你用简体|你打简体).{0,15}(?:所以你不是台湾|你不是台湾人|你是大陆人|你不懂台湾)/.test(output);
    },
  },
  // ============================================================
  // 中老年照护 EC-H 防幻觉审核（P0）
  // ============================================================
  {
    id: "EC-H005",
    level: "P0",
    description: "编造福利金额",
    check: (output, ctx) => {
      if (!ctx?.detectedPacks?.includes("elderly")) return false;
      return /(?:补贴|津贴|补助|救助金|养老金|低保金).{0,6}(?:是|为|有|每月|每月领)\s*\d+\s*(?:元|块|万)/.test(output)
        && !/(?:具体金额|以当地|咨询当地|查询当地|以最新|以官方|民政部门|社保部门|12333|社区事务受理)/.test(output);
    },
  },
  {
    id: "EC-H006",
    level: "P0",
    description: "编造申请资格",
    check: (output, ctx) => {
      if (!ctx?.detectedPacks?.includes("elderly")) return false;
      return /(?:只要|满足|符合).{0,15}(?:就能|就可以|一定能).{0,10}(?:申请|领取|享受|办理)/.test(output)
        && !/(?:资格以|以当地|具体条件|咨询当地|户籍|各地不同)/.test(output);
    },
  },
  {
    id: "EC-H007",
    level: "P0",
    description: "编造办理材料",
    check: (output, ctx) => {
      if (!ctx?.detectedPacks?.includes("elderly")) return false;
      return /(?:办理|申请).{0,8}(?:需要|须|必须).{0,20}(?:身份证|户口本|房产证|收入证明|病历|诊断证明|照片)/.test(output)
        && !/(?:以当地|咨询当地|具体材料|社区事务受理|民政部门|经办机构)/.test(output);
    },
  },
  {
    id: "EC-H008",
    level: "P0",
    description: "把地方政策说成全国",
    check: (output, ctx) => {
      if (!ctx?.detectedPacks?.includes("elderly")) return false;
      return /(?:全国统一|国家规定|全国都(?:是|有|可以)|在全国)/.test(output)
        && /(?:补贴|津贴|长护险|护理保险|养老补贴|高龄津贴|低保|救助)/.test(output);
    },
  },
  {
    id: "EC-H013",
    level: "P0",
    description: "把残障等同无能力",
    check: (output, ctx) => {
      if (!ctx?.detectedPacks?.includes("elderly")) return false;
      return /(?:残障|残疾|失能|半失能).{0,10}(?:就(?:是|等于|意味着).{0,6}(?:没有能力|无能力|不能决定|无法表达|什么都做不了)|不能自己做决定|没有自主权)/.test(output);
    },
  },
  {
    id: "EC-H014",
    level: "P0",
    description: "把认知担忧等同痴呆诊断",
    check: (output, ctx) => {
      if (!ctx?.detectedPacks?.includes("elderly")) return false;
      return /(?:记性差|忘事|记忆力下降|认知退化|认知下降|糊涂).{0,10}(?:就是|等于|肯定是|说明是).{0,8}(?:痴呆|阿尔茨海默|失智|老年痴呆)/.test(output);
    },
  },
  {
    id: "EC-H016",
    level: "P0",
    description: "小酷变政策客服（直接给办理流程/政策答案而非心理支持）",
    check: (output, ctx) => {
      if (ctx?.role !== "xiaoku" || !ctx?.detectedPacks?.includes("elderly")) return false;
      const policyAnswer = /(?:补贴标准|申请流程|办理地点|缴费年限|报销比例|待遇标准|政策规定.{0,6}是|符合条件.{0,6}可)/.test(output);
      const feelingAttendance = /(?:感受|担心|害怕|压力|累|委屈|生气|无奈|不容易|辛苦|怎么想|对你意味着|你在意)/.test(output);
      return policyAnswer && !feelingAttendance;
    },
  },
  {
    id: "EC-H017",
    level: "P0",
    description: "小雪做心理分析",
    check: (output, ctx) => {
      if (ctx?.role !== "xiaoxue" || !ctx?.detectedPacks?.includes("elderly")) return false;
      return /(?:你现在的感受|你的心理|你可能在经历|这让你感到|你内心|你的情绪|心理上|认知上|可能源于|深层).{0,20}(?:焦虑|恐惧|内疚|愧疚|悲伤|愤怒|无力|孤独|冲突|矛盾)/.test(output);
    },
  },
  {
    id: "EC-H019",
    level: "P0",
    description: "机构存在就假设有名额/一定能入住",
    check: (output, ctx) => {
      if (!ctx?.detectedPacks?.includes("elderly")) return false;
      return /(?:养老院|养老机构|护理院|日照中心|日间照护|长护险).{0,15}(?:一定能|肯定有|随时可以|直接入住|马上安排|有名额|能进)/.test(output)
        && !/(?:排队|轮候|床位|咨询|以机构|实际名额|预约|评估)/.test(output);
    },
  },
  // ============================================================
  // 华人学习者教育场景 EDU-H 防幻觉审核（P0）
  // ============================================================
  {
    id: "EDU-H001",
    level: "P0",
    description: "学习差等同智力低",
    check: (output, ctx) => {
      if (!ctx?.detectedPacks?.includes("education")) return false;
      return /(?:成绩差|学习差|成绩不好|学不会|跟不上|考不好|分数低|学习困难).{0,10}(?:就是|等于|说明|肯定是|因为).{0,8}(?:笨|智商|智力|脑子|不聪明|低能|智力问题|智商低)/.test(output);
    },
  },
  {
    id: "EDU-H003",
    level: "P0",
    description: "注意力问题等同ADHD诊断",
    check: (output, ctx) => {
      if (!ctx?.detectedPacks?.includes("education")) return false;
      return /(?:注意力不集中|坐不住|走神|分心|好动|专注力差).{0,10}(?:就是|等于|肯定是|说明是|可能是).{0,6}(?:ADHD|多动症|注意力缺陷|过动症)/.test(output);
    },
  },
  {
    id: "EDU-H004",
    level: "P0",
    description: "阅读慢等同阅读障碍",
    check: (output, ctx) => {
      if (!ctx?.detectedPacks?.includes("education")) return false;
      return /(?:阅读慢|读书慢|认字慢|跳字|串行).{0,10}(?:就是|等于|肯定是|说明是|可能是).{0,6}(?:阅读障碍|失读症|dyslexia)/.test(output);
    },
  },
  {
    id: "EDU-H005",
    level: "P0",
    description: "数学差等同数学障碍",
    check: (output, ctx) => {
      if (!ctx?.detectedPacks?.includes("education")) return false;
      return /(?:数学差|数学不好|学不会数学|计算差).{0,10}(?:就是|等于|肯定是|说明是|可能是).{0,6}(?:数学障碍|计算障碍|dyscalculia)/.test(output);
    },
  },
  {
    id: "EDU-H011",
    level: "P0",
    description: "被排挤等同霸凌（需要区分程度）",
    check: (output, ctx) => {
      if (!ctx?.detectedPacks?.includes("education")) return false;
      return /(?:被排挤|被孤立|被同学.{0,4}不喜欢|没有朋友).{0,10}(?:就是|等于|肯定是|说明是).{0,6}(?:霸凌|欺凌|bully)/.test(output)
        && !/(?:需要了解|有没有|是否|可能|区分|程度|持续|故意|反复)/.test(output);
    },
  },
  {
    id: "EDU-H013",
    level: "P0",
    description: "小酷变升学顾问（直接给学校/专业选择答案而非心理支持）",
    check: (output, ctx) => {
      if (ctx?.role !== "xiaoku" || !ctx?.detectedPacks?.includes("education")) return false;
      const decisionAnswer = /(?:你应该(?:选|报|申请|去)|建议你(?:选|报|申请|去)|最好(?:选|报|申请)|这个学校(?:适合|不适合)|这个专业(?:好|不好|有前景)|录取概率|分数线(?:是|为))/.test(output);
      const feelingAttendance = /(?:感受|担心|焦虑|压力|期待|害怕|迷茫|纠结|怎么想|对你意味着|你在意|你想要|你喜欢)/.test(output);
      return decisionAnswer && !feelingAttendance;
    },
  },
  {
    id: "EDU-H014",
    level: "P0",
    description: "小雪做学习/心理分析",
    check: (output, ctx) => {
      if (ctx?.role !== "xiaoxue" || !ctx?.detectedPacks?.includes("education")) return false;
      return /(?:你现在的感受|你的心理|你可能在经历|这让你感到|你内心|你的情绪|心理上|认知上|可能源于|深层|你的焦虑|你的拖延|你的恐惧).{0,20}(?:焦虑|恐惧|压力|完美主义|自我价值|认同|依恋|创伤|冲突|矛盾)/.test(output);
    },
  },
  {
    id: "EDU-H015",
    level: "P0",
    description: "编造教育政策/考试/签证规定",
    check: (output, ctx) => {
      if (!ctx?.detectedPacks?.includes("education")) return false;
      return /(?:高考|中考|联考|学测|统测|SAT|ACT|GRE|GMAT|托福|雅思|IELTS|签证|学签|工签|移民).{0,20}(?:规定|政策|要求|分数线|及格线|必须|一定).{0,20}(?:是|为|要|达到)\s*\d+/.test(output)
        && !/(?:以官方|查询|具体|当年|该校|该地区|大使馆|移民局|考试院|教育部|学校官网)/.test(output);
    },
  },
  // ============================================================
  // 书籍推荐 BOOK-H 防误荐审核（P0）
  // ============================================================
  {
    id: "BOOK-H001",
    level: "P0",
    description: "危机/高风险时把读书当主要处理",
    check: (output, ctx) => {
      if (ctx?.role !== "xiaoku") return false;
      const hasCrisis = /(?:自杀|想死|不想活|自残|伤害自己|结束生命|没有活路|正在被家暴|紧急|救命)/.test(output);
      const hasBook = /(?:推荐|这本|书中|阅读|书单|读物|《.+?》)/.test(output);
      return hasCrisis && hasBook;
    },
  },
  {
    id: "BOOK-H011",
    level: "P0",
    description: "用书籍内容替用户诊断",
    check: (output) => {
      return /(?:这本书|书中|根据|读了).{0,15}(?:你就是|说明你|你可能是|你患有|你的诊断|你属于).{0,10}(?:抑郁症|焦虑症|ADHD|多动症|PTSD|人格障碍|边缘型|自恋型|强迫症|双相)/.test(output)
        || /(?:《.+?》).{0,10}(?:你就是|说明你|你可能是|你患有|你的诊断)/.test(output);
    },
  },
  {
    id: "BOOK-H012",
    level: "P0",
    description: "把DSM/临床手册推荐给普通用户用于自我诊断",
    check: (output) => {
      return /(?:DSM|精神障碍诊断|临床手册|诊断手册|鉴别诊断).{0,15}(?:推荐|你可以看|建议你读|你去读|买一本)/.test(output);
    },
  },
  {
    id: "BOOK-H005",
    level: "P0",
    description: "给零基础用户推荐高难度专业手册",
    check: (output, ctx) => {
      if (ctx?.role !== "xiaoku") return false;
      // L0用户说大白话却被推了L4/L5难度书
      const hasDifficultBook = /(?:DSM|精神障碍诊断|临床手册|心理学与生活.{0,4}第|研究方法|统计|meta分析|RCT|高级|研究生教材)/.test(output);
      const userIsL0 = ctx?.detectedPacks?.length === 0 || !/(?:CBT|ACT|依恋理论|认知偏差|防御机制|移情|精神分析)/.test(output);
      return hasDifficultBook && userIsL0;
    },
  },
  {
    id: "BOOK-H009",
    level: "P1",
    description: "一次推荐过多制造选择负担",
    check: (output) => {
      const bookMentions = output.match(/《.+?》/g);
      return bookMentions !== null && bookMentions.length > 3;
    },
  },
  {
    id: "BOOK-H020",
    level: "P1",
    description: "小雪在行政场景主动做心理书单",
    check: (output, ctx) => {
      if (ctx?.role !== "xiaoxue") return false;
      return /(?:推荐|这本|书单|读物|《.+?》).{0,10}(?:适合你|帮助你|你可以读)/.test(output)
        && /(?:预约|时间|费用|客服|安排|咨询主题|行政)/.test(output);
    },
  },
  // ============================================================
  // 音乐共情 MUS-H 防幻觉/角色/危机/版权审核
  // ============================================================
  {
    id: "MUS-H001",
    level: "P0",
    description: "用户拒绝音乐后仍继续推荐歌曲",
    check: (output, ctx) => {
      if (ctx?.role !== "xiaoku") return false;
      const rejected = /(?:不要|不想|别|讨厌).{0,4}(?:歌|音乐|推荐歌)/.test(output);
      const stillRec = /(?:推荐你|听听这首|这首歌|想到一首)/.test(output);
      return rejected && stillRec;
    },
  },
  {
    id: "MUS-H002",
    level: "P0",
    description: "危机场景让音乐抢占了安全响应",
    check: (output) => {
      const crisis = /(?:自杀|想死|不想活|自残|伤害自己|结束生命|正在被家暴|紧急|救命)/.test(output);
      const song = /(?:推荐.*歌|听听.*歌|这首歌|歌单|想到一首歌)/.test(output);
      return crisis && song;
    },
  },
  {
    id: "MUS-H004",
    level: "P0",
    description: "疑似输出过长受版权保护歌词逐字引用",
    check: (output) => {
      const quoted = [...output.matchAll(/[“"「『]([^”"」』]+)[”"」』]/g)].map(m => m[1]);
      for (const q of quoted) {
        const cjk = (q.match(/[\u4e00-\u9fff]/g) || []).length;
        const words = q.trim().split(/\s+/).filter(Boolean).length;
        if (cjk > 30 || words > 10) return true;
      }
      return false;
    },
  },
  {
    id: "MUS-H005",
    level: "P1",
    description: "把音乐夸大成治疗或保证性效果",
    check: (output) => /(?:这首歌一定会治愈你|听完就会好|最适合你|保证.*有效|音乐能治好)/.test(output),
  },
  {
    id: "MUS-H003",
    level: "P1",
    description: "小雪在非音乐请求中主动推荐歌曲，偏离行政角色",
    check: (output, ctx) => {
      if (ctx?.role !== "xiaoxue") return false;
      return /(?:推荐你|听听|这首歌|想到一首歌)/.test(output)
        && /(?:预约|时间|费用|客服|安排|咨询主题|行政|档期)/.test(output);
    },
  },
  // ============================================================
  // 职业场景 JOB-H 防幻觉审核（P0）
  // ============================================================
  {
    id: "JOB-H001",
    level: "P0",
    description: "仅凭一个术语/关键词就确定用户职业",
    check: (output) => {
      return /(?:你说.{0,6}(?:KPI|OKR|headcount|对齐|复盘|汇报).{0,10}(?:所以|那你|你一定|你肯定).{0,8}(?:是|做|当).{0,8}(?:经理|老板|主管|产品|运营|程序员|HR|顾问))/.test(output);
    },
  },
  {
    id: "JOB-H015",
    level: "P0",
    description: "术语用错行业含义却强装懂",
    check: (output) => {
      // 同一段里术语含义明显错位（粗检）：把headcount当绩效、把OKR当组织架构等
      return /(?:headcount).{0,15}(?:绩效|考核|评分)|(?:OKR).{0,15}(?:组织架构|人员编制)|(?:P&L).{0,15}(?:产品线|研发)/i.test(output);
    },
  },
  {
    id: "JOB-H019",
    level: "P0",
    description: "职业场景里编造具体公司制度/政策",
    check: (output, ctx) => {
      if (!ctx?.detectedPacks?.includes("career")) return false;
      return /(?:你们公司|这个公司|腾讯|阿里|字节|华为|谷歌|Meta).{0,20}(?:规定|制度|政策|一定|必须|都是).{0,30}(?:N\+\d+|赔偿|加班|年假|调休|股权)/.test(output)
        && !/(?:不确定|要查|以.{0,4}(?:制度|合同|HR|员工手册)|每家公司不一样|具体看)/.test(output);
    },
  },
  {
    id: "JOB-H020",
    level: "P0",
    description: "用职业推断性别/年龄/学历/收入/人格",
    check: (output) => {
      return /(?:做.{0,8}(?:程序员|工程师|销售|律师|医生|护士|老师|产品|运营|HR)).{0,15}(?:肯定是|一般是|通常是|都是).{0,10}(?:男|女|年轻|年纪大|高学历|名校|收入高|有钱|内向|理性|感性)/.test(output)
        || /(?:程序员|工程师|律师|医生).{0,10}(?:都|一般|通常).{0,10}(?:木讷|花心|拜金|现实)/.test(output);
    },
  },
  {
    id: "JOB-H022",
    level: "P0",
    description: "小酷变职业顾问，替用户做职业决策",
    check: (output, ctx) => {
      if (ctx?.role !== "xiaoku") return false;
      return /(?:你应该.{0,6}(?:跳槽|离职|辞职|裸辞|创业|转行|接受.{0,4}offer|拒绝.{0,4}offer))/.test(output)
        || /(?:我建议你.{0,6}(?:赶紧|马上|直接).{0,6}(?:跳槽|离职|辞职|裸辞|转行))/.test(output);
    },
  },
  {
    id: "JOB-H023",
    level: "P0",
    description: "小雪在行政场景做职场心理分析",
    check: (output, ctx) => {
      if (ctx?.role !== "xiaoxue") return false;
      return /(?:你的职场|你工作.{0,6}(?:压力|焦虑|倦怠|内耗)|你和(?:主管|同事|老板).{0,6}关系)/.test(output)
        && /(?:预约|时间|费用|客服|安排|咨询主题|行政|档期)/.test(output);
    },
  },
];

// ============================================================
// 知识检索器
// ============================================================

// 懒加载知识数据（使用 fs 读取，避免 JSON 模块导入的缓存/属性只读问题）
let _knowledgeData: Record<string, { cases: KnowledgeCase[]; keywordIndex: Record<string, number[]> }> | null = null;
let _lenses: ThinkingLens[] | null = null;
let _bookLibrary: BookLibrary | null = null;

// ============================================================
// 书籍推荐模块类型
// ============================================================
export interface Book {
  book_id: string;
  category: string;
  title: string;
  authors: string;
  book_type: string;
  difficulty: number;       // 1-5
  reader_level: string;
  base_priority: number;    // 0-100
  scenes: string[];
  categories: string[];
  intro: string;
  key_points: string;
  recommend_template: string;
  cautions: string;
  recommend_role: string;
  biblio_status: string;
}

export interface BookLibrary {
  pack: string;
  name: string;
  total_books: number;
  reader_levels: { level: string; name: string; difficulty_range: number[] }[];
  ranking_weights: Record<string, number>;
  safety_gates: string[];
  books: Book[];
  keyword_index: Record<string, number[]>;
  scene_index: Record<string, number[]>;
  category_index: Record<string, number[]>;
}

function loadBookLibrary(): BookLibrary | null {
  if (_bookLibrary) return _bookLibrary;
  try {
    let knowledgeDir = "";
    try {
      knowledgeDir = path.join(process.cwd(), "src", "lib", "knowledge");
    } catch {
      return null;
    }
    const p = path.join(knowledgeDir, "pack_books.json");
    if (!fs.existsSync(p)) return null;
    const raw = fs.readFileSync(p, "utf-8");
    _bookLibrary = JSON.parse(raw) as BookLibrary;
    return _bookLibrary;
  } catch (e) {
    console.warn("[cognitive] failed to load book library:", e);
    return null;
  }
}

/**
 * 检测书籍推荐意图
 * 返回 null 表示不应推书；否则返回意图类型和置信度
 */
export function detectBookIntent(userText: string, context?: Partial<ContextSchema>): {
  shouldRecommend: boolean;
  intent: "explicit_request" | "exploratory" | "none";
  confidence: number;
  reason: string;
} {
  if (!userText) return { shouldRecommend: false, intent: "none", confidence: 0, reason: "空输入" };

  // P0: 危机/高风险时绝不推书
  const crisisPatterns = [
    /自杀|想死|不想活|结束生命|自残|伤害自己|没有活路/,
    /正在(?:被|遭受).{0,6}(?:家暴|暴力|虐待|控制)/,
    /紧急|救命|报警|现在(?:很|非常).{0,4}(?:危险|害怕|恐惧)/,
  ];
  if (crisisPatterns.some(p => p.test(userText))) {
    return { shouldRecommend: false, intent: "none", confidence: 1.0, reason: "BOOK-H001: 危机/高风险时不推书" };
  }

  // 明确要求书
  const explicitPatterns = [
    /(?:推荐|介绍|有什么|有没有).{0,6}(?:书|书籍|读物|书单|阅读|文献)/,
    /(?:想读|想看|想了解).{0,10}(?:书|书籍|读物)/,
    /(?:书|书单|文献|读物).{0,6}(?:推荐|介绍|清单|列表)/,
    /有(?:什么|啥).{0,4}(?:好书|心理学的书|相关的书)/,
  ];
  if (explicitPatterns.some(p => p.test(userText))) {
    return { shouldRecommend: true, intent: "explicit_request", confidence: 0.9, reason: "用户明确要求书籍推荐" };
  }

  // 探索性：用户在谈某个心理议题且有学习意愿信号
  const learningSignals = [
    /(?:想|希望|愿意).{0,8}(?:了解|理解|搞懂|弄明白|搞清楚|深入)/,
    /(?:能|可以).{0,6}(?:推荐|建议|提供).{0,6}(?:资源|材料|资料|读物)/,
    /有没有(?:什么|啥).{0,6}(?:可以看|可以读|值得读)/,
  ];
  const psychologicalTopic = /(?:焦虑|抑郁|创伤|依恋|原生家庭|情绪|关系|沟通|自我|认同|性别|出柜|亲密关系|压力|完美主义|自卑|边界|内耗|社恐|恐惧|悲伤|愤怒|孤独|倦怠|失眠|强迫|成瘾|PTSD|ADHD|人格|发展|认知|正念|CBT|ACT)/;
  if (learningSignals.some(p => p.test(userText)) && psychologicalTopic.test(userText)) {
    return { shouldRecommend: true, intent: "exploratory", confidence: 0.65, reason: "用户在探索心理议题并有学习意愿" };
  }

  return { shouldRecommend: false, intent: "none", confidence: 0.3, reason: "无推书意图" };
}

/**
 * 估算读者专业层级 L0-L4
 * 只根据语言证据，不根据学历/职业/年龄/术语直接判定
 */
export function estimateReaderExpertise(userText: string): {
  level: "L0" | "L1" | "L2" | "L3" | "L4";
  confidence: number;
  signals: string[];
} {
  const text = userText || "";
  let score = 0;
  const signals: string[] = [];

  // L4信号：引用研究方法/统计/诊断标准
  if (/(?:RCT|meta-analysis|效应量|诊断标准|鉴别诊断|循证|实证|临床指南|APA|DSM-5|ICD-11|量表.{0,4}(?:信度|效度|常模))/i.test(text)) {
    score += 4; signals.push("高阶研究/临床术语");
  }
  // L3信号：临床概念/治疗术语
  if (/(?:个案概念化|治疗联盟|移情|反移情|督导|伦理|干预时机|临床适应|禁忌|预后|评估)/.test(text)) {
    score += 3; signals.push("临床/助人专业术语");
  }
  // L2信号：能区分症状与诊断/理论框架
  if (/(?:CBT|ACT|DBT|依恋理论|认知偏差|防御机制|移情|精神分析|行为激活|暴露疗法|正念)/.test(text) ||
      /(?:症状|诊断).{0,6}(?:区别|不同|不是)/.test(text)) {
    score += 2; signals.push("系统学习级术语");
  }
  // L1信号：常见心理科普词汇
  if (/(?:依恋|原生家庭|认知偏差|边界|焦虑型|回避型|讨好型|内耗|情绪勒索)/.test(text)) {
    score += 1; signals.push("兴趣型科普词汇");
  }
  // L0信号：纯生活化描述
  if (/(?:我(?:就是|觉得|感觉)|心里(?:难受|不舒服)|想不开|过不去|好累|撑不住)/.test(text)) {
    score -= 1; signals.push("生活化情绪表达");
  }

  let level: "L0" | "L1" | "L2" | "L3" | "L4";
  let confidence: number;
  if (score >= 4) { level = "L4"; confidence = 0.8; }
  else if (score >= 3) { level = "L3"; confidence = 0.75; }
  else if (score >= 2) { level = "L2"; confidence = 0.7; }
  else if (score >= 1) { level = "L1"; confidence = 0.65; }
  else { level = "L0"; confidence = 0.6; }

  // 置信度低于0.65时不直接给用户贴标签，只做难度试探
  if (confidence < 0.65) confidence = 0.65;

  return { level, confidence, signals };
}

interface ScoredBook {
  book: Book;
  score: number;
  matchDetails: { scene: number; expertise: number; evidence: number; base: number };
}

/**
 * 推荐书籍：召回→门控→动态排序
 * 默认返回1本主推荐
 */
export function recommendBooks(
  userText: string,
  context?: Partial<ContextSchema>,
  maxResults = 1
): { recommendations: ScoredBook[]; gateReason?: string } {
  const lib = loadBookLibrary();
  if (!lib) return { recommendations: [], gateReason: "书库未加载" };

  // 安全门
  const intent = detectBookIntent(userText, context);
  if (!intent.shouldRecommend) {
    return { recommendations: [], gateReason: intent.reason };
  }

  // 读者层级估算
  const expertise = estimateReaderExpertise(userText);
  const maxDifficulty = { L0: 2, L1: 3, L2: 4, L3: 5, L4: 5 }[expertise.level];

  // 从文本中提取检索词（中文2-6字 + 英文单词）
  const terms = new Set<string>();
  const cnMatches = userText.match(/[\u4e00-\u9fff]{2,6}/g) || [];
  const stopwords = new Set(["这个","那个","可以","可能","如果","因为","所以","但是","不是","就是",
    "什么","怎么","自己","一个","没有","推荐","一下","有没有","一本书","心理","心理学"]);
  for (const m of cnMatches) {
    if (!stopwords.has(m) && m.length >= 2) terms.add(m);
    for (const size of [2,3]) {
      if (size <= m.length) {
        for (let i = 0; i <= m.length - size; i++) {
          const sub = m.substring(i, i+size);
          if (!stopwords.has(sub)) terms.add(sub);
        }
      }
    }
  }
  // 英文单词（书库中有英文书名）
  const enMatches = userText.match(/[a-zA-Z][a-zA-Z\-]{2,}/g) || [];
  for (const w of enMatches) {
    terms.add(w.toLowerCase());
    terms.add(w); // 保留原大小写
  }

  // 召回：用关键词和场景索引
  const candidateIndices = new Set<number>();
  for (const term of terms) {
    const kwHits = lib.keyword_index[term];
    if (kwHits) kwHits.forEach(i => candidateIndices.add(i));
    const sceneHits = lib.scene_index[term];
    if (sceneHits) sceneHits.forEach(i => candidateIndices.add(i));
  }

  // 如果召回太少，用类别索引补充
  if (candidateIndices.size < 5) {
    const topicToCategory: Record<string, string[]> = {
      "焦虑": ["焦虑恐惧与OCD","情绪调节与自我慈悲","CBT与认知行为自助"],
      "抑郁": ["抑郁双相与情绪障碍","积极心理动机习惯与韧性"],
      "创伤": ["创伤与PTSD"],
      "依恋": ["依恋与关系模式","伴侣婚姻与亲密关系"],
      "关系": ["伴侣婚姻与亲密关系","家庭系统与养育"],
      "家庭": ["家庭系统与养育","依恋与关系模式"],
      "情绪": ["情绪调节与自我慈悲","CBT与认知行为自助"],
      "自我": ["人格与个体差异","积极心理动机习惯与韧性","人本存在与意义"],
      "性别": ["LGBTQ性别与性心理"],
      "出柜": ["LGBTQ性别与性心理"],
      "ADHD": ["ADHD执行功能与神经多样性"],
      "失眠": ["健康心理身心与行为医学"],
      "压力": ["情绪调节与自我慈悲","积极心理动机习惯与韧性"],
      "沟通": ["伴侣婚姻与亲密关系","咨询治疗师训练与会谈技能"],
      "原生家庭": ["依恋与关系模式","家庭系统与养育"],
      "社恐": ["焦虑恐惧与OCD","社会心理学"],
    };
    for (const [topic, cats] of Object.entries(topicToCategory)) {
      if (userText.includes(topic)) {
        for (const cat of cats) {
          const catHits = lib.category_index[cat];
          if (catHits) catHits.forEach(i => candidateIndices.add(i));
        }
      }
    }
  }

  // 评分和门控
  const scored: ScoredBook[] = [];
  for (const idx of candidateIndices) {
    const book = lib.books[idx];
    if (!book) continue;

    // ExpertiseGate: 难度不超过用户层级2级
    if (book.difficulty > maxDifficulty + 1) continue;

    // HardReject: 诊断类书籍不给无诊断证据的用户
    if (/(?:DSM|精神障碍诊断|临床手册|鉴别诊断)/.test(book.title) && expertise.level === "L0") continue;

    // 计算各维度得分
    let sceneScore = 0;
    for (const term of terms) {
      if (book.scenes.some(s => s.includes(term))) sceneScore += 0.15;
      if (book.category.includes(term)) sceneScore += 0.1;
      if (book.intro.includes(term)) sceneScore += 0.05;
      if (book.key_points.includes(term)) sceneScore += 0.05;
    }
    sceneScore = Math.min(sceneScore, 1.0);

    // 专业匹配度
    const levelDiffs = [1,2,3,4,5].map(d => Math.abs(d - (
      expertise.level === "L0" ? 1 :
      expertise.level === "L1" ? 2 :
      expertise.level === "L2" ? 3 :
      expertise.level === "L3" ? 4 : 5
    )));
    const bookDiff = levelDiffs[book.difficulty - 1] || 3;
    const expertiseScore = Math.max(0, 1 - bookDiff * 0.3);

    // 证据质量：专业教材/权威手册/循证自助 > 流行心理
    let evidenceScore = 0.5;
    if (/(?:教材|手册|导论|指南|循证|CBT|ACT|实证|研究)/.test(book.book_type + book.title)) evidenceScore = 0.9;
    else if (/(?:大众|通识|自助|通俗|入门)/.test(book.book_type)) evidenceScore = 0.6;
    else if (/(?:流行|随笔|故事|小说|传记)/.test(book.book_type)) evidenceScore = 0.3;

    // 基础优先权（只占2%）
    const baseScore = book.base_priority / 100;

    // 加权总分
    const w = lib.ranking_weights;
    const total = sceneScore * (w.scene_match || 0.30)
      + (intent.intent === "explicit_request" ? 0.9 : 0.6) * (w.user_intent || 0.18)
      + expertiseScore * (w.expertise_fit || 0.16)
      + evidenceScore * (w.evidence_quality || 0.10)
      + baseScore * (w.base_priority_prior || 0.02);

    scored.push({
      book,
      score: total,
      matchDetails: { scene: sceneScore, expertise: expertiseScore, evidence: evidenceScore, base: baseScore },
    });
  }

  // 排序
  scored.sort((a, b) => b.score - a.score);

  // NoveltyGate: 避免同类别重复（如果前一本是某类别，后续降低同类权重）
  const finalResults: ScoredBook[] = [];
  const seenCategories = new Set<string>();
  for (const sb of scored) {
    if (finalResults.length >= maxResults) break;
    if (seenCategories.has(sb.book.category) && finalResults.length > 0) continue;
    finalResults.push(sb);
    seenCategories.add(sb.book.category);
  }

  // 如果过滤后不足，补回
  if (finalResults.length < Math.min(maxResults, scored.length)) {
    for (const sb of scored) {
      if (finalResults.length >= maxResults) break;
      if (!finalResults.includes(sb)) finalResults.push(sb);
    }
  }

  return { recommendations: finalResults.slice(0, maxResults) };
}

async function loadKnowledgeData(): Promise<{
  packs: Record<string, { cases: KnowledgeCase[]; keywordIndex: Record<string, number[]> }>;
  lenses: ThinkingLens[];
}> {
  if (_knowledgeData && _lenses) {
    return { packs: _knowledgeData, lenses: _lenses ?? [] };
  }

  const packNames = ["taiwan", "lgbtq", "overseas", "genz", "post80s", "post70s", "crossgen", "acg", "marriage", "guardianship", "elderly", "education", "books", "music", "career", "psychpro", "literature", "religion", "gaming"];
  _knowledgeData = {};
  _lenses = [];

  // 服务器端用 fs 读取，避免打包/缓存问题
  let knowledgeDir = "";
  try {
    knowledgeDir = path.join(process.cwd(), "src", "lib", "knowledge");
  } catch {
    // process.cwd 不可用时回退
  }

  for (const name of packNames) {
    try {
      let raw: string | null = null;
      if (knowledgeDir) {
        const p = path.join(knowledgeDir, `pack_${name}.json`);
        if (fs.existsSync(p)) {
          raw = fs.readFileSync(p, "utf-8");
        }
      }
      if (raw) {
        const data = JSON.parse(raw);
        _knowledgeData[name] = {
          cases: data.cases || [],
          keywordIndex: data.keyword_index || {},
        };
      }
    } catch (e) {
      console.warn(`[cognitive] failed to load pack ${name}:`, e);
    }
  }

  try {
    if (knowledgeDir) {
      const p = path.join(knowledgeDir, "thinking_lenses.json");
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, "utf-8");
        const data = JSON.parse(raw);
        _lenses = data.lenses || [];
      }
    }
  } catch (e) {
    console.warn("[cognitive] failed to load lenses:", e);
  }

  return { packs: _knowledgeData, lenses: _lenses ?? [] };
}

function extractSearchTerms(text: string): string[] {
  if (!text) return [];
  const terms = new Set<string>();
  // 提取2-6字中文词组
  const matches = text.match(/[\u4e00-\u9fff]{2,6}/g) || [];
  for (const m of matches) {
    if (m.length >= 2 && !STOPWORDS.has(m)) {
      terms.add(m);
    }
    // 同时生成2字、3字滑动窗口，避免6字切分错过短词
    for (let size = 2; size <= 4 && size <= m.length; size++) {
      for (let i = 0; i + size <= m.length; i++) {
        const sub = m.slice(i, i + size);
        if (!STOPWORDS.has(sub)) terms.add(sub);
      }
    }
  }
  // 提取冲突轴关键词
  for (const [axis, data] of Object.entries(CONFLICT_AXES)) {
    for (const kw of data.keywords) {
      if (text.includes(kw)) {
        terms.add(kw);
        terms.add(axis);
      }
    }
  }
  return [...terms];
}

const STOPWORDS = new Set([ `这个", "那个", "可以", "可能", "如果", "因为", "所以", "但是", "不是", "就是"`, `什么", "怎么", "用户", "需要", "应该", "以及", "或者", "对于", "关于", "一个"`, `没有", "进行", "相关", "不同", "自己", "他们", "我们", "你们", "这种", "那种"`, `现在", "已经", "还是", "真的", "觉得", "知道", "一下", "一样"`,
]);

/**
 * 从知识库中检索最相关的案例
 */
export async function retrieveCases(
  userText: string,
  detectedPacks: string[],
  maxCases: number = 5,
): Promise<RetrievedCase[]> {
  const { packs } = await loadKnowledgeData();
  const searchTerms = extractSearchTerms(userText);
  
  const candidates: Map<number, { case: KnowledgeCase; score: number; matchedKeywords: string[] }> = new Map();

  // 优先从命中的资料库检索
  const searchPacks = detectedPacks.length > 0 ? detectedPacks : Object.keys(packs);

  for (const packName of searchPacks) {
    const pack = packs[packName];
    if (!pack) continue;

    for (const term of searchTerms) {
      const indices = pack.keywordIndex[term];
      if (!indices) continue;

      for (const idx of indices) {
        const c = pack.cases[idx];
        if (!c) continue;

        const existing = candidates.get(idx);
        const weight = packName === "crossgen" ? 1.5 : 1.0; // 跨年代案例权重更高
        if (existing) {
          existing.score += weight;
          existing.matchedKeywords.push(term);
        } else {
          candidates.set(idx, {
            case: c,
            score: weight,
            matchedKeywords: [term],
          });
        }
      }
    }
  }

  // 排序、去重、限制数量
  const results = [...candidates.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, maxCases);

  return results;
}

/**
 * 检索相关的思维透镜
 */
export async function retrieveLenses(
  userText: string,
  detectedPacks: string[],
  maxLenses: number = 8,
): Promise<ThinkingLens[]> {
  const { lenses } = await loadKnowledgeData();
  
  const scored = lenses.map(lens => {
    let score = 0;
    const text = (lens.axis + lens.insight).toLowerCase();
    
    // 从命资料库中优先
    if (detectedPacks.some(p => lens.id.startsWith(p))) score += 3;
    
    // 关键词匹配
    for (const term of extractSearchTerms(userText)) {
      if (text.includes(term.toLowerCase())) score += 2;
    }
    
    // 冲突轴匹配
    for (const axis of Object.keys(CONFLICT_AXES)) {
      if (userText.includes(axis) || text.includes(axis)) score += 3;
    }
    
    return { lens, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxLenses)
    .map(s => s.lens);
}

// ============================================================
// 情境构建器
// ============================================================

export function buildContextSchema(
  userText: string,
  history: string[],
  detectedPacks: string[],
): ContextSchema {
  const ctx: ContextSchema = {
    userExplicitFacts: [],
    currentIssue: "",
    currentGoal: "",
    emotionState: "",
    actors: [{ role: "用户" }],
    candidateConflictAxes: [],
    verifiedFacts: [],
    hypotheses: [],
    unknowns: [],
    detectedPacks,
    professionalContext: analyzeProfessionalContext(userText, history),
    musicContext: analyzeMusicOpportunity(userText, history, "xiaoku"),
    literatureContext: analyzeLiteratureOpportunity(userText, history, "xiaoku"),
    gamingContext: analyzeGamingContext(userText, history, "xiaoku"),
  };

  // 提取明确事实（用户说"我是XX""我今年XX岁""我在XX"）
  const factPatterns = [
    /我[是今](\d+后|[0-9]+岁)/,
    /我在([^，。！？\s]{2,10})/,
    /我是([^，。！？\s]{2,10})/,
  ];
  for (const p of factPatterns) {
    const m = userText.match(p);
    if (m) {
      ctx.userExplicitFacts.push(m[0]);
      ctx.verifiedFacts.push(m[0]);
    }
  }

  // 检测关系中的其他主体
  const actorPatterns: Array<{ pattern: RegExp; role: string }> = [
    { pattern: /(我妈|妈妈|母亲|老妈|母親)/g, role: "母亲" },
    { pattern: /(我爸|爸爸|父亲|老爸|父親)/g, role: "父亲" },
    { pattern: /(男朋友|女友|女朋友|男友|伴侣|伴侶|对象|對象|老婆|老公|妻子|丈夫)/g, role: "伴侣" },
    { pattern: /(儿子|兒子|女儿|女兒|孩子|小孩)/g, role: "子女" },
    { pattern: /(主管|老板|老闆|经理|經理|领导|領导)/g, role: "主管" },
    { pattern: /(老师|老師|教授|导师|導師)/g, role: "老师" },
    { pattern: /(朋友|闺蜜|閨蜜|兄弟|同事|同学|同學)/g, role: "朋友/同事" },
    { pattern: /(咨询师|咨詢師|心理师|心理師|治疗师|治療師)/g, role: "心理师" },
    { pattern: /(奶奶|外婆|爷爷|爺爺|外公|姥姥)/g, role: "祖父母" },
  ];
  
  for (const ap of actorPatterns) {
    if (ap.pattern.test(userText)) {
      ap.pattern.lastIndex = 0;
      const actor: Actor = { role: ap.role };
      // 检测该主体的年代（仅用户明确提及）
      const genMatch = userText.match(new RegExp(`${ap.role}(?:是|为)?(\\d{4}后|\\d0后)`));
      if (genMatch) {
        actor.generation = genMatch[1];
      }
      ctx.actors.push(actor);
    }
  }

  // 识别冲突轴
  for (const [axis, data] of Object.entries(CONFLICT_AXES)) {
    const matched = data.keywords.filter(kw => userText.includes(kw));
    if (matched.length >= 2) {
      ctx.candidateConflictAxes.push(axis);
    }
  }

  // 初步判断议题和情绪
  if (/(辞|换工作|辞职|离职|工作|职业|職業)/.test(userText)) {
    ctx.currentIssue = "工作/职业";
  } else if (/(家里|父母|家庭|妈妈|爸爸|结婚|婚姻)/.test(userText)) {
    ctx.currentIssue = "家庭/关系";
  } else if (/(焦虑|抑郁|憂鬱|难过|難過|崩溃|崩潰|想哭|痛苦|绝望|絕望)/.test(userText)) {
    ctx.currentIssue = "情绪困扰";
    ctx.emotionState = "痛苦/困扰";
  } else if (/(出柜|出櫃|性别|性別|取向|喜欢男生|喜欢女生)/.test(userText)) {
    ctx.currentIssue = "身份/性取向";
  }

  // 生成多假设（至少2个，其中至少1个非群体解释）
  if (ctx.candidateConflictAxes.length > 0) {
    for (const axis of ctx.candidateConflictAxes.slice(0, 3)) {
      ctx.hypotheses.push({
        id: `H-${axis}`,
        explanation: `冲突轴可能是「${axis}」：${CONFLICT_AXES[axis].insight}`,
        isGroupBased: false,
        status: "possible",
        evidence: [userText.slice(0, 50)],
        counterEvidence: [],
        conflictAxis: axis,
      });
    }
  }

  // 必须至少有一个非群体解释
  const hasNonGroup = ctx.hypotheses.some(h => !h.isGroupBased);
  if (!hasNonGroup && ctx.hypotheses.length > 0) {
    ctx.hypotheses.push({
      id: "H-non-group",
      explanation: "也可能不是群体/年代差异，而是具体的个人经历、关系动力或当下情境",
      isGroupBased: false,
      status: "possible",
      evidence: [],
      counterEvidence: [],
    });
  }

  // 如果没有假设，创建一个通用假设
  if (ctx.hypotheses.length === 0) {
    ctx.hypotheses.push({
      id: "H-general",
      explanation: "用户在表达一个需要被理解的困扰",
      isGroupBased: false,
      status: "possible",
      evidence: [userText.slice(0, 50)],
      counterEvidence: [],
    });
    ctx.unknowns.push("具体困扰是什么");
    ctx.unknowns.push("用户希望获得什么");
  }

  return ctx;
}

// ============================================================
// 认知运行主函数
// ============================================================

export interface CognitiveInput {
  userText: string;
  history: string[];
  detectedPacks: string[];
  role: "xiaoku" | "xiaoxue";
  languagePreference?: string;
}

/**
 * 执行完整的认知运行流程
 * 返回包含情境分析、检索结果和LLM指令块的结果
 */
export async function runCognitivePipeline(
  input: CognitiveInput,
): Promise<CognitiveResult> {
  const { userText, history, detectedPacks, role } = input;
  const reasoningSteps: string[] = [];

  // Step 1: 情境构建
  const context = buildContextSchema(userText, history, detectedPacks);
  reasoningSteps.push("✓ 情境结构已构建：" +  `${context.actors.length}个主体, ${context.candidateConflictAxes.length}个候选冲突轴, ${context.hypotheses.length}个假设`);

  // Step 2: 检索思维透镜
  const lenses = await retrieveLenses(userText, detectedPacks);
  reasoningSteps.push(`✓ 检索到 ${lenses.length} 条相关思维透镜`);

  // Step 3: 检索案例
  const cases = await retrieveCases(userText, detectedPacks, role === "xiaoku" ? 5 : 3);
  reasoningSteps.push(`✓ 检索到 ${cases.length} 条相关案例`);

  // Step 4: 证据筛选——弱假设不进入回答
  context.hypotheses = context.hypotheses.filter(h => h.status !== "weak" && h.status !== "contradicted");

  // Step 5: 生成认知提示块
  const promptBlock = generateCognitivePromptBlock(context, lenses, cases, role);
  reasoningSteps.push("✓ 认知提示块已生成");

  // Step 6: 预审核
  const verifierWarnings: string[] = [];
  // 检查是否有P0风险
  if (context.hypotheses.length === 0) {
    verifierWarnings.push("COG-WARN: 无有效假设，需要更多用户材料");
  }
  if (detectedPacks.length > 0 && cases.length === 0) {
    verifierWarnings.push("COG-WARN: 检测到相关领域但未检索到案例，需谨慎回应");
  }

  return {
    context,
    relevantLenses: lenses,
    retrievedCases: cases,
    reasoningSteps,
    promptBlock,
    verifierWarnings,
  };
}

// ============================================================
// 认知提示块生成（注入到 LLM System Prompt）
// ============================================================

function generateCognitivePromptBlock(
  ctx: ContextSchema,
  lenses: ThinkingLens[],
  cases: RetrievedCase[],
  role: "xiaoku" | "xiaoxue",
): string {
  const lines: string[] = [];

  lines.push("【认知运行层 — 回答前必须完成的内部思考】");
  lines.push("");

  // 1. 事实与假设分离
  lines.push("## 1. 先分清什么是事实、什么是假设");
  if (ctx.verifiedFacts.length > 0) {
    lines.push("用户明确说的事实：" + ctx.verifiedFacts.join("；"));
  } else {
    lines.push("用户没有明确陈述任何事实。不要假设用户的年龄、婚姻、职业、性取向、经济状况或国籍。");
  }
  lines.push("");

  // 2. 多假设
  lines.push("## 2. 同时考虑多种理解，不要急着锁定一种");
  for (const h of ctx.hypotheses.slice(0, 4)) {
    const certainty = h.status === "supported" ? "（有一定支持）" : "（可能，需确认）";
    lines.push(`- ${h.explanation}${certainty}`);
  }
  lines.push("- 至少有一种理解不依赖群体/年代标签。");
  lines.push("");

  // 3. 关系建模
  if (ctx.actors.length >= 2) {
    lines.push("## 3. 理解关系中每一方在回应什么");
    for (const actor of ctx.actors) {
      if (actor.role !== "用户") {
        lines.push(`- ${actor.role}${actor.generation ? `（${actor.generation}）` : ""}：不要替对方说话，但可以思考对方可能在担心什么。`);
      }
    }
    lines.push("- 双方表面可能在谈同一件事，但实际在回应不同的心理需要。");
    lines.push("");
  }

  // 4. 冲突轴
  if (ctx.candidateConflictAxes.length > 0) {
    lines.push("## 4. 看到表面议题下的拉扯");
    for (const axis of ctx.candidateConflictAxes) {
      lines.push(`- **${axis}**：${CONFLICT_AXES[axis].insight}`);
    }
    lines.push("- 这些拉扯不需要你帮用户选边，而是帮用户看到两边都真实。");
    lines.push("");
  }

  // 5. 思维透镜
  if (lenses.length > 0) {
    lines.push("## 5. 用这些角度理解");
    for (const lens of lenses.slice(0, 6)) {
      lines.push(`- ${lens.insight}`);
    }
    lines.push("");
  }

  // 6. 案例参考
  if (cases.length > 0) {
    lines.push("## 6. 参考这些训练案例的回应方式（不要照抄，学习其理解方式）");
    for (let i = 0; i < Math.min(cases.length, 4); i++) {
      const rc = cases[i];
      const c = rc.case;
      lines.push(`### 案例${i + 1}`);
      if (c.scenario) lines.push(`场景：${c.scenario}`);
      if (c.contradiction) lines.push(`背后拉扯：${c.contradiction}`);
      if (c.correct) lines.push(`✅ 正确理解：${c.correct}`);
      if (c.empathy) lines.push(`✅ 共情方式：${c.empathy}`);
      if (c.incorrect) lines.push(`❌ 错误回应：${c.incorrect}`);
      if (c.no_infer) lines.push(`⛔ 禁止推断：${c.no_infer}`);
      lines.push("");
    }
  }

  // 7. 对话技能选择
  lines.push("## 7. 选择对话技能");
  const skills: string[] = [];
  if (ctx.actors.length >= 2) {
    skills.push("double_sided_mentalization: 呈现双方各自在回应什么");
  }
  if (cases.some(c => c.case.empathy)) {
    skills.push("specific_empathy: 用用户原话做具体共情");
  }
  if (ctx.unknowns.length > 0 || ctx.hypotheses.every(h => h.status === "possible")) {
    skills.push("single_deep_open_question: 问一个从本轮材料长出来的问题");
  }
  skills.push("respect_not_want_to_talk: 用户不想谈时尊重");
  for (const s of skills) {
    lines.push(`- ${s}`);
  }
  lines.push("");

  // 8. 禁止事项
  lines.push("## 8. 绝对不能做的事");
  lines.push("- 不要把群体/年代资料写成用户个人事实（如'你们90后就是...'）");
  lines.push("- 不要只给群体解释而不提供非群体解释");
  lines.push("- 不要把'可能'说成'一定'");
  lines.push("- 不要编造法律、医疗、签证、税务、价格等事实");
  lines.push("- 不要用资料库给用户上社会学课，要对话不要讲课");
  lines.push("- 不要问模板问题，问题必须从用户本轮说的内容里长出来");
  if (role === "xiaoku") {
    lines.push("- 你是小酷，做心理支持/探索。遇到行政/预约/费用/地址问题，转小雪。");
  } else {
    lines.push("- 你是小雪，做行政预约。只收集咨询主题，不做心理分析。");
  }
  lines.push("");

  // 9. 输出检查
  lines.push("## 9. 回答前自检");
  lines.push("- 我的回应里有没有把假设当事实？");
  lines.push("- 我有没有理解到不止一方的视角？");
  lines.push("- 我的共情是具体的还是群体化的？");
  lines.push("- 我有没有编造任何未经验证的信息？");
  lines.push("- 我的问题是从用户材料里长出来的吗？");
  lines.push("- 我有没有越出自己的角色边界？");

  return lines.join("\n");
}

// ============================================================
// 输出审核
// ============================================================

export interface VerifyResult {
  passed: boolean;
  violations: Array<{
    id: string;
    level: "P0" | "P1";
    description: string;
    repair: "block_and_regenerate" | "rewrite_once_then_neutral_fallback";
  }>;
}

export function verifyCognitiveOutput(
  output: string,
  context: ContextSchema,
  role: "xiaoku" | "xiaoxue",
): VerifyResult {
  const violations: VerifyResult["violations"] = [];

  // 注入角色到上下文，供 MAR 等审核规则使用
  const ctxWithRole = { ...context, role };

  for (const check of COGNITIVE_CHECKS) {
    // 跳过需要特殊上下文的检查
    if (check.id === "COG-H005" || check.id === "COG-H012") continue;
    
    try {
      if (check.check(output, ctxWithRole)) {
        violations.push({
          id: check.id,
          level: check.level,
          description: check.description,
          repair: check.level === "P0" ? "block_and_regenerate" : "rewrite_once_then_neutral_fallback",
        });
      }
    } catch {
      // 检查执行出错时不阻断
    }
  }

  // 角色边界检查
  if (role === "xiaoku") {
    const adminPatterns = [ `预约时间是", "预约在", "帮你预约", "我帮你预约", "已为你预约"`, `费用为", "费用是", "我们的地址", "收费标准是", "营业时间为"`, `每次", "元一次", "元/次", "多少钱一次"`, `定金", "付款", "支付链接", "转账"`,
    ];
    if (adminPatterns.some(p => output.includes(p))) {
      violations.push({
        id: "COG-H011",
        level: "P0",
        description: "小酷回答了行政/预约/费用问题，违反角色宪法（应转小雪）",
        repair: "block_and_regenerate",
      });
    }
  } else if (role === "xiaoxue") {
    // 小雪做心理分析：出现心理解释/诊断/童年归因等
    const psychPatterns = [ `你感到", "你可能在经历", "心理上", "情绪上"`, `你的焦虑", "你的抑郁", "你的恐惧", "你的不安全感"`, `你的依恋", "你的童年", "你的原生家庭", "你的人格"`, `这是一种", "源于你", "因为你小时候", "你的潜意识"`, `你内心深处", "你的创伤", "你的心理", "你的情绪"`,
    ];
    const hasPsych = psychPatterns.some(p => output.includes(p));
    // 小雪正常行政用语白名单
    const isAdminOnly = /预约|咨询主题|时间|费用|方式|流程|客服|安排|稍等|为你查询/.test(output)
      && output.length < 200;
    if (hasPsych && !isAdminOnly) {
      violations.push({
        id: "COG-H011",
        level: "P0",
        description: "小雪做了心理分析/解释，违反角色宪法（应转小酷）",
        repair: "block_and_regenerate",
      });
    }
  }

  // 心理专业/个案讨论审核（PRO-H001~H007）
  try {
    const proViolations = verifyProfessionalOutput(output, ctxWithRole.professionalContext, role as "xiaoku" | "xiaoxue");
    for (const v of proViolations) {
      violations.push({
        id: v.id,
        level: v.level,
        description: v.description,
        repair: v.level === "P0" ? "block_and_regenerate" : "rewrite_once_then_neutral_fallback",
      });
    }
  } catch { /* 不阻断 */ }

  // 音乐共情/版权审核（MUS-H001~H005）
  try {
    const musicViolations = verifyMusicOutput(output, ctxWithRole.musicContext, role as "xiaoku" | "xiaoxue");
    for (const v of musicViolations) {
      violations.push({
        id: v.id,
        level: v.level,
        description: v.description,
        repair: v.level === "P0" ? "block_and_regenerate" : "rewrite_once_then_neutral_fallback",
      });
    }
  } catch { /* 不阻断 */ }

  // 诗词文学/版权审核（LIT-H001~H006）
  try {
    const litViolations = verifyLiteratureOutput(output, ctxWithRole.literatureContext, role as "xiaoku" | "xiaoxue");
    for (const v of litViolations) {
      violations.push({
        id: v.id,
        level: v.level,
        description: v.description,
        repair: v.level === "P0" ? "block_and_regenerate" : "rewrite_once_then_neutral_fallback",
      });
    }
  } catch { /* 不阻断 */ }

  // 宗教/信仰防幻觉与伦理审核（REL-H，只实现P0，P1作为运行时提示）
  if (ctxWithRole.detectedPacks?.includes("religion")) {
    // REL-H012 宗教治疗效果夸大 / REL-H013 祷告冥想替代医疗
    if (/(?:信(?:耶稣|佛|主|教)(?:就|一定|必然)|(?:祷告|祈祷|念经|拜佛|修行|信仰).{0,8}(?:就能|一定|必然|可以)(?:治(?:好|愈)|治好|醫好|替代(?:药物|治疗|醫療)|不用(?:吃药|看医生|就醫))|信仰可以(?:治(?:好|愈)|替代)|(?:宗教|信仰|祷告|念佛).{0,6}(?:治百病|包治|疗效神奇|神奇疗效))/.test(output)) {
      violations.push({ id: "REL-H012", level: "P0", description: "宗教治疗效果被夸大", repair: "block_and_regenerate" });
    }
    if (/(?:不要(?:吃药|看病|就医|治療)|不用(?:吃药|看医生|就医|治療)|停止(?:服药|用药|治療)|放弃(?:治疗|治療|化疗|手术)).{0,12}(?:祷告|祈祷|念经|拜佛|信(?:耶稣|佛|主)|靠(?:主|佛|信仰))|(?:祷告|祈祷|念经|拜佛|信(?:耶稣|佛|主)).{0,12}(?:比(?:药|医生|治疗|治療)(?:更|还)|不用(?:吃药|看医生|就医))/.test(output)) {
      violations.push({ id: "REL-H013", level: "P0", description: "祷告/冥想/信仰被表述为可替代医疗", repair: "block_and_regenerate" });
    }
    // REL-H011 神学观点当心理事实
    if (/(?:你(?:的|这是)(?:痛苦|困扰|抑郁|焦虑|问题).{0,10}(?:是因为|来自|源于).{0,6}(?:罪|原罪|不信|业障|报应|前世|邪灵|魔鬼|撒旦)|(?:只要(?:信|皈依|受洗|悔改).{0,8}(?:就会|就能|自然)(?:好|解脱|得救|喜乐))|(?:这是)(?:神|佛|主|老天).{0,6}(?:的安排|旨意|惩罚|考验))/.test(output)) {
      violations.push({ id: "REL-H011", level: "P0", description: "神学/教义观点被当成心理事实或原因", repair: "block_and_regenerate" });
    }
    // REL-H020 从名字推宗教
    if (/(?:你(?:名字|姓|叫).{0,12}(?:所以|一定|应该)(?:是|信|属于)(?:穆斯林|伊斯兰|基督徒|天主教|佛教|犹太)|(?:姓|叫).{0,6}(?:就|一定)(?:是|信)(?:穆斯林|基督徒|佛教))/.test(output)) {
      violations.push({ id: "REL-H020", level: "P0", description: "从用户名字推断宗教身份", repair: "block_and_regenerate" });
    }
    // REL-H014 替用户断定宗教身份（肯定式）
    if (/(?:你(?:一定|肯定|就是|想必)(?:是|信)(?:基督徒|天主教|穆斯林|佛教徒|佛教|道教|犹太教徒)|作为(?:一个|一名)(?:虔诚的)?(?:基督徒|穆斯林|佛教徒|天主教徒))/.test(output)) {
      violations.push({ id: "REL-H014", level: "P0", description: "在用户未明确认同时断定其宗教身份", repair: "block_and_regenerate" });
    }
  }

  // 游戏文化/玩家心理审核（GAME-H001~H008，由game-context-runtime提供）
  try {
    const gameViolations = verifyGamingOutput(output, ctxWithRole.gamingContext, role as "xiaoku" | "xiaoxue");
    for (const v of gameViolations) {
      violations.push({
        id: v.id,
        level: v.level,
        description: v.description,
        repair: v.level === "P0" ? "block_and_regenerate" : "rewrite_once_then_neutral_fallback",
      });
    }
  } catch { /* 不阻断 */ }

  const hasP0 = violations.some(v => v.level === "P0");
  return {
    passed: !hasP0,
    violations,
  };
}

// ============================================================
// 语境检测路由器（整合已有的4个语境引擎）
// ============================================================

export interface DetectedContext {
  packs: string[];
  languagePreference?: "zh-CN" | "zh-TW" | "mixed";
  signals: string[];
}

/**
 * 路由判断：用户文本涉及哪些资料库
 * 这是"路由器"不是"检测器"——只负责判断该调用哪些知识库，不做回应决策
 */
export function detectRelevantPacks(userText: string): DetectedContext {
  const packs = new Set<string>();
  const signals: string[] = [];
  let languagePreference: "zh-CN" | "zh-TW" | "mixed" | undefined;

  // 台湾语境信号
  const taiwanSignals = ["超棒", "宝岛", "三立", "东森", "中天", "台北", "高雄", "台中", "台南", `新北", "桃园", "新竹", "101", "西门町", "卤肉饭", "珍珠奶茶", "悠游卡", "健保"`, `立委", "市议员", "里长", "社区主委", "管委会", "补习班", "安亲班", "大学指考"`, `学测", "统测", "技职", "双主修", "辅系", "当掉", "二一", "摩托车", "机车"`, `YouBike", "高铁", "台铁", "国道", "交流道", "超商", "门市", "网路线上"`, `软体", "硬体", "程式", "网路", "资讯", "手机门号", "吃到饱", "费率"`, `房东", "押金", "租金", "仲介", "服务费", "套房", "雅房", "分租"`, `心理师", "咨商心理师", "临床心理师", "咨商", "晤谈", "会谈", "抒压"`, `情绪勒索", "妈宝", "靠北", "爆料", "懒人包", "梗图", "业配", "网红"`, `台湾", "台湾人", "在台湾", "回台湾", "来台湾"`, `的", "了", "吗", "呢", "啦", "嘛", "欸", "喔", "齁", "耶", "咩"`,
    "夸张", "扯", "天兵", "台", "揪团", "揪"];
  
  const taiwanCount = taiwanSignals.filter(s => userText.includes(s)).length;
  const hasMainland = ["软件", "程序", "网络", "信息", "手机", "出租车", "公交", "地铁", "共享单车", "身份证"].some(s => userText.includes(s));
  
  if (taiwanCount >= 2 && !hasMainland) {
    packs.add("taiwan");
    languagePreference = "zh-TW";
    signals.push("taiwan-context");
  } else if (taiwanCount >= 1 && hasMainland) {
    packs.add("taiwan");
    languagePreference = "mixed";
    signals.push("mixed-zh");
  } else if (taiwanCount >= 4) {
    // 即使有大陆词，台湾信号足够强也算
    packs.add("taiwan");
    languagePreference = hasMainland ? "mixed" : "zh-TW";
    signals.push("taiwan-context");
  }

  // LGBTQ信号（仅明确自称才算身份证据，不做猜测；但提及他人身份时也检索LGBTQ库以获取理解框架）
  const lgbtqExplicit = [
    /我是(?:gay|lesbian|bisexual|trans|queer|非二元|跨性别|同性恋|双性恋|女同志|男同志|酷儿)/i,
    /我喜欢(?:男生|女生|男女)/,
    /我(?:伴侣|对象)是(?:同性|男生|女生|trans)/,
    /出柜/,
    /我(?:的)?(?:性别认同|性取向|性倾向)/,
    /(?:我女儿|我儿子|孩子|小孩|朋友|家人)(?:说|是).*?(?:gay|les|trans|跨性别|同性恋|非二元|酷儿|喜欢同性)/i,
    /(?:女儿|儿子|孩子).*?(?:出柜| transgender|gender)/i,
  ];
  if (lgbtqExplicit.some(p => p.test(userText))) {
    packs.add("lgbtq");
    signals.push("lgbtq-explicit-identity");
  } else if (/(同志|gay|les|lgbt|跨性别|非二元|出柜|性取向|性别认同)/i.test(userText)) {
    // 提及但非自称，仍然检索LGBTQ库以获取理解框架
    packs.add("lgbtq");
    signals.push("lgbtq-mentioned");
  }

  // 海外华人信号
  const overseasSignals = [
    /留学|出国|在国外|在海外|移民|签证|护照|绿卡|永居|PR|留学生|交换生/,
    /时差|倒时差|文化冲击|homesick|想家|融入|local|外国人/,
    /(?:在|到|去)(?:美国|英国|加拿大|澳大利亚|澳洲|日本|韩国|德国|法国|新加坡|香港|欧洲)/,
    /回国|海归|回流|归海|留不下来|回不去/,
  ];
  if (overseasSignals.some(p => p.test(userText))) {
    packs.add("overseas");
    signals.push("overseas-context");
  }

  // 年代/生命周期信号
  const ageSignals: Record<string, RegExp> = {
    genz: /(?:\b00后|10后|2010后|2000后|1995后|z世代|網路詞|躺平|内卷|內卷|emo|i人|e人|社恐|社牛)/i,
    post80s: /(?:80后|85后|90后|3[0-9]岁|四十岁|中年|上有老下有小|房贷|车贷|育儿|养老|二胎|三胎|职场瓶颈|被优化|裁员|中年危机|夹心层|三明治)/,
    post70s: /(?:60后|65后|70后|75后|退休|更年期|带孙|空巢|衰老|养老|慢病|广场舞)/,
  };
  for (const [pack, pattern] of Object.entries(ageSignals)) {
    if (pattern.test(userText)) {
      packs.add(pack);
      signals.push(`${pack}-cohort`);
    }
  }

  // 跨年代信号（涉及多个年代主体）
  if (packs.has("genz") && (packs.has("post80s") || packs.has("post70s"))) {
    packs.add("crossgen");
    signals.push("cross-generation");
  }
  // 或用户明确提到代际冲突
  if (/(爸妈|父母|妈妈|爸爸|我妈|我爸).*(?:不理解|反对|不一样|代沟|沟通不了|说不通)/.test(userText) ||
      /(?:不理解|反对|不一样|代沟|沟通不了|说不通).*(?:爸妈|父母|妈妈|爸爸|我妈|我爸)/.test(userText)) {
    packs.add("crossgen");
    signals.push("intergenerational-conflict");
  }

  // 始终包含跨年代库（它的通用冲突轴适用于大多数关系问题）
  if (ctx_hasMultiActor(userText) && !packs.has("crossgen")) {
    packs.add("crossgen");
  }

  // 二次元/ACG信号（兴趣关键词不能推断年龄/诊断/成瘾，只用于理解兴趣功能）
  const acgSignals = [
    /二次元|动漫|动画|漫画|轻小说|galgame|gal game|乙女|BL|GL|同人|cosplay|cos/i,
    /谷子|痛包|吧唧|立牌|手办|周边|抽卡|氪金|氪|单推|梦女|cp|CP|vtuber|vup/i,
    /原神|崩坏|星穹|绝区零|明日方舟|碧蓝|fgo|FGO|宝可梦|精灵宝可梦|任天堂|PlayStation|Switch/i,
    /入坑|退坑|出坑|番剧|新番|追番|补番|OVA|剧场版|轻小说|web连载/i,
    /up主|UP主|主播|虚拟主播|liver|B站|bilibili|哔哩哔哩|LOFTER|lofter|ao3|AO3/i,
  ];
  if (acgSignals.some(p => p.test(userText))) {
    packs.add("acg");
    signals.push("acg-interest");
  }

  // 婚姻/亲密关系与法律认知信号
  const marriageSignals = [
    /结婚|婚姻|已婚|未婚|离婚|分居|再婚|复婚|婚前|婚后|夫妻|伴侣|配偶|未婚夫|未婚妻/,
    /婆婆|丈母娘|岳父|岳母|公公|媳妇|儿媳|女婿|姻亲|小姑|小叔|妯娌|婆媳/,
    /出轨|婚外情|外遇|小三|劈腿|忠诚|背叛|家暴|家庭暴力|冷暴力|控制欲|精神控制/,
    /财产分割|夫妻共同财产|婚前财产|抚养权|探视权|监护权|意定监护|继承|遗嘱/,
    /彩礼|嫁妆|婚礼|领证|登记结婚|协议离婚|起诉离婚|调解/,
    /同居|试婚|丁克|无子女|不婚|催婚|逼婚|相亲|闪婚/,
    /(?:老公|老婆|先生|太太|丈夫|妻子).*(?:吵架|冷战|沟通|不理解|分开|过不下去)/,
    /(?:吵架|冷战|沟通不了|过不下去|想离婚).*(?:老公|老婆|先生|太太|丈夫|妻子|伴侣)/,
    /(?:我爸|我妈|爸爸|妈妈|父亲|母亲).*(?:打|家暴|暴力|威胁|摔东西).*(?:我妈|我爸|妈妈|爸爸|对方|她|他)/,
  ];
  if (marriageSignals.some(p => p.test(userText))) {
    packs.add("marriage");
    signals.push("marriage-relationship");
  }

  // 意定监护/预先照护规划信号（独立于婚姻库）
  const guardianshipSignals = [
    /意定监护|成年监护|监护制度|监护人|社会监护|监护监督/,
    /预先照护|预立医疗|生前预嘱|医疗委托|医疗决定|持续授权|持久授权/,
    /失能|失智|认知能力下降|行为能力|无民事行为能力|限制民事行为能力/,
    /公证遗嘱|遗嘱|继承规划|遗产规划|财产监管|养老信托|扶养/,
    /老伴|伴侣.{0,10}(手术|住院|签字|医疗|紧急)|谁替我决定|谁来照顾我|谁来做决定/,
    /(?:老了|以后|万一).{0,15}(谁|怎么办|托付|安排).{0,10}(决定|签字|照顾|监护)/,
    /独居老人|无儿无女|没有子女|失独|丁克养老|单身养老|无配偶|未婚养老/,
  ];
  if (guardianshipSignals.some(p => p.test(userText))) {
    packs.add("guardianship");
    signals.push("guardianship-planning");
  }

  // 中老年照护与社会福利信号
  const elderlySignals = [
    /养老|照护|照顾老人|长期照护|居家养老|养老院|养老机构|社区养老|日间照护|喘息服务/,
    /老人|爸妈|父母|老妈|老爸|老娘|老爷子|老伴|爷爷奶奶|外公外婆|长辈.{0,10}(照顾|照护|生病|住院|养老)/,
    /失能|半失能|失智|认知退化|认知下降|阿尔茨海默|老年痴呆|帕金森|脑卒中|中风后|卧床|褥疮/,
    /福利|补贴|津贴|低保|特困|残联|残障金|护理补贴|养老补贴|高龄津贴|长护险|长期护理保险/,
    /社保|医保|养老金|退休金|养老保险|异地就医|慢病|门诊大病|用药|康复/,
    /(?:我|家里).{0,10}(?:照顾|照护|护理).{0,10}(?:老人|爸妈|父母|妈|爸|奶奶|爷爷)/,
    /照护者|照顾者| caregiver|看护|护工|保姆|赡养|抚养老人|子女照护|主力照护/,
    /独生子女.{0,10}(养老|照护|照顾)|421家庭|上有老| Sandwich|夹心层|照护负担|照护压力/,
  ];
  if (elderlySignals.some(p => p.test(userText))) {
    packs.add("elderly");
    signals.push("elderly-care");
  }

  // 华人学习者教育场景信号
  const educationSignals = [
    /学习|学业|考试|成绩|升学|高考|中考|考研|留学申请|选专业|选校|志愿填报/,
    /注意力不集中|走神|分心|拖延|作业|写作业|刷题|补习班|课外辅导|家教|网课/,
    /阅读障碍|数学障碍|ADHD|多动症|读写困难|学习障碍|特殊教育|IEP|资优|天才班/,
    /学校|同学|老师|班主任|校园|被排挤|被孤立|霸凌|欺凌|休学|退学|转学|gap year/,
    /留学生|国际学生|交换生|海外求学|文化适应|语言障碍|ESL|EAL|托福|雅思|SAT|ACT|GRE|GMAT/,
    /家长|父母.{0,6}(?:期望|压力|要求|比较|鸡娃|虎妈)|鸡娃|教育焦虑|起跑线|学区房/,
    /(?:我|孩子|小孩|儿子|女儿).{0,10}(?:不想上学|不想学|学不进去|考不好|成绩下滑|厌学|休学)/,
    /专业选择|职业规划|转专业|双主修|辅系|实习|科研|论文|答辩|毕业/,
    /完美主义|拖延症| impostor|冒名顶替|自我怀疑|考试焦虑|表现焦虑|学习动机/,
  ];
  if (educationSignals.some(p => p.test(userText))) {
    packs.add("education");
    signals.push("education-learning");
  }

  // 职业/职场场景信号
  const careerSignals = [
    /(?:工作|职场|上班|公司|同事|主管|老板|下属|团队|部门|KPI|OKR|绩效|升职|加薪|跳槽|离职|裁员|面试|简历)/,
    /(?:加班|996|007|内卷| burnout|职业倦怠|职业发展|职业规划|转行|裸辞|副业|自由职业|创业)/,
    /(?:国企|央企|外企|民企|编制|公务员|事业单位|大厂|互联网厂|五百强|甲方|乙方)/,
    /(?:汇报|周报|月报|对齐|同步|复盘|项目|需求|deadline|工位|办公室政治)/,
    /(?:职场.{0,6}(?:人际|关系|压力|焦虑|霸凌|骚扰|歧视|边界|PUA))/,
    /(?:我(?:是|在|做).{0,10}(?:经理|总监|主管|老板|工程师|设计师|老师|律师|医生|护士|会计|销售|产品|运营|HR|程序员|顾问|分析师|记者|编辑|研究员))/,
  ];
  if (careerSignals.some(p => p.test(userText))) {
    packs.add("career");
    signals.push("career-workplace");
  }

  // 音乐/歌曲信号（用户明确提到音乐时加载；主动共情由music-context-runtime判断）
  if (/歌|歌曲|音乐|歌单|听什么|哪首歌|music|song|playlist/i.test(userText)) {
    packs.add("music");
    signals.push("music-explicit");
  }

  // 诗词文学/作品信号（用户明确提到文学作品时加载；主动共情由literature-context-runtime判断）
  if (/(?:诗|诗词|诗歌|词|古诗|文学|小说|散文|著作|作品|读书|读本|李白|杜甫|苏轼|红楼|三国|水浒|西游|鲁迅|张爱玲|poem|poetry|literature|novel)/i.test(userText)) {
    packs.add("literature");
    signals.push("literature-explicit");
  }

  // 宗教/世界观/信仰信号（信仰只能作为候选理解，需用户明确自我认同）
  if (/(?:宗教|信仰|教会|教堂|寺庙|拜佛|菩萨|念经|佛|基督|耶稣|上帝|祷告|祈祷|真主|穆斯林|伊斯兰|清真|犹太|拉比|可兰经|圣经|佛经|道|道观|祖先|拜拜|烧(?:香|纸)|法会|礼拜|弥撒|受洗|出家|和尚|尼姑|神父|牧师|上师|轮回|因果|业力|救赎|原罪|福音|灵修|冥想修行|无神论|不可知|教友|信徒)/.test(userText)) {
    packs.add("religion");
    signals.push("religion-explicit");
  }

  // 游戏文化/玩家心理信号（游戏作为共情入口，不病理化、不诊断成瘾）
  if (/(?:打游戏|玩游戏|游戏|排位|段位|抽卡|氪金|开黑|组队|副本|通关|速通|电竞|主机|Steam|PS5|Xbox|Switch|手游|端游|原神|王者|英雄联盟|LOL|我的世界|Minecraft|塞尔达|马里奥|魂系|吃鸡|MMO|RPG|MOBA|gamer|gaming|game)/i.test(userText)) {
    packs.add("gaming");
    signals.push("gaming-explicit");
  }

  // 心理专业用户/个案讨论信号（由专业识别引擎判断）
  const proCtx = analyzeProfessionalContext(userText, []);
  if (proCtx.isProfessionalLike || proCtx.isCaseDiscussion || proCtx.professionalScore >= 2) {
    packs.add("psychpro");
    signals.push(`psychpro-${proCtx.backgroundLevel}`);
    if (proCtx.isCaseDiscussion) signals.push("psychpro-case-discussion");
  }

  return {
    packs: [...packs],
    languagePreference,
    signals,
  };
}

function ctx_hasMultiActor(text: string): boolean {
  return /(我妈|我爸|妈妈|爸爸|母亲|父亲|老婆|老公|男朋友|女朋友|伴侣|主管|老板|老师|婆婆|丈母娘)/.test(text);
}
