// ============================================================
// QM AI v13.17.4 知识库本地检索引擎（内存优化）
//
// 数据来源：扣子知识库（dataset 7678739598122336265 + 7677912997117493302）
// 共 19 个 MD 文件，约 53MB / 2100 万字。
//
// v13.17.4 变更：
// - 删除 KbChunk.tokens 数组（与 tokenFreq 重复存储），内存降低约 50%
// - length 改为 tokenFreq 的总词频，BM25 评分结果不变
// - 修复 v13.17.1 起连续请求时容器 OOM 崩溃（function_proxy_error）
//
// 安全：
// 1. 服务端 only，不暴露给前端
// 2. 检索结果作为 system prompt context 注入，不直接输出
// 3. 危机/高情绪时减少注入量，避免干扰
// ============================================================

import fs from "fs";
import path from "path";

// ---------- 类型 ----------

interface KbChunk {
  file: string;
  heading: string;
  text: string;
  tokenFreq: Map<string, number>;
  length: number;
}

export interface KbSearchResult {
  file: string;
  heading: string;
  text: string;
  score: number;
}

// ---------- 中文分词（简易双字gram + 英文单词）----------

function tokenize(text: string): string[] {
  const tokens: string[] = [];
  const lower = text.toLowerCase();

  // 英文单词（2+字母）
  const enWords = lower.match(/[a-z]{2,}/g) || [];
  tokens.push(...enWords);

  // 数字、小数、百分比、编号（v13.17.2 P0修复）
  const numericMatches = text.match(/\d+(?:\.\d+)?%?/g) || [];
  for (const raw of numericMatches) {
    const normalized = raw.replace(/%$/, "");
    tokens.push(normalized);
    if (raw.endsWith("%")) tokens.push(raw);
  }

  // 英数编号（如 SUSAN_CASE_001）
  const alnumIds = lower.match(/[a-z]+(?:_[a-z]+)*_\d+/g) || [];
  tokens.push(...alnumIds);

  // 单个英文字母（紧跟在中文字符后面，如"心理师D"）
  const singleLetterAfterCn = text.match(/[\u4e00-\u9fa5]([a-z])(?![a-z])/gi) || [];
  for (const m of singleLetterAfterCn) {
    const letter = m[m.length - 1].toLowerCase();
    tokens.push(letter);
  }

  // "心理师X"作为整体token
  const therapistMatches = text.match(/心理师[A-Z0-9]/g) || [];
  for (const m of therapistMatches) {
    tokens.push(m.toLowerCase());
  }

  // part1/part2 等
  const partNums = lower.match(/part\d+/g) || [];
  tokens.push(...partNums);

  // 中文连续段（双字+四字滑窗）
  const chinese = text.replace(/[^\u4e00-\u9fa5]/g, " ");
  const segments = chinese.split(/\s+/).filter((s) => s.length >= 2);
  for (const seg of segments) {
    for (let i = 0; i < seg.length - 1; i++) {
      tokens.push(seg.slice(i, i + 2));
    }
    if (seg.length >= 4) {
      for (let i = 0; i < seg.length - 3; i++) {
        tokens.push(seg.slice(i, i + 4));
      }
    }
  }

  return tokens;
}

// ---------- 加载知识库 ----------

let chunks: KbChunk[] = [];
let avgDl = 0;
let dfMap = new Map<string, number>();
let initialized = false;
let initError: string | null = null;

const KB_DIR = path.join(process.cwd(), "src", "lib", "kb", "content");

const STOP_BIGRAMS = new Set([
  "我们", "他们", "她们", "自己", "这个", "那个", "这些", "那些",
  "可以", "不是", "没有", "什么", "怎么", "为什么", "因为", "所以",
  "但是", "如果", "虽然", "然后", "就是", "还是", "或者", "以及",
  "进行", "通过", "对于", "关于", "根据", "按照", "由于", "为了",
  "一种", "这些", "那些", "每个", "所有", "其他", "同时", "目前",
  "问题", "情况", "方式", "方面", "时候", "地方", "东西",
]);

function initialize(): void {
  if (initialized) return;
  initialized = true;

  try {
    if (!fs.existsSync(KB_DIR)) {
      initError = `KB dir not found: ${KB_DIR}`;
      console.warn("[KB-SEARCH]", initError);
      return;
    }

    const files = fs.readdirSync(KB_DIR).filter((f) => f.endsWith(".md"));

    for (const file of files) {
      const filePath = path.join(KB_DIR, file);
      const raw = fs.readFileSync(filePath, "utf-8");

      const fileBaseName = file
        .replace(/\.md$/, "")
        .replace(/QM_AI_/g, "");
      const fileBoost = `\n${Array(10).fill(`[文件：${fileBaseName}] [来源：${fileBaseName}]`).join(" ")}\n`;

      const parts = raw.split(/\n(?=#{1,3} )/);

      for (const part of parts) {
        const trimmed = (fileBoost + part).trim();
        if (trimmed.length < 100) continue;

        const firstLine = part.trim().split("\n")[0].replace(/^#+\s*/, "").trim();
        const text = part.trim().slice(0, 3000);

        // v13.17.4：只构建 tokenFreq，不再保留 tokens 数组
        const tokens = tokenize(fileBoost + text).filter((t) => !STOP_BIGRAMS.has(t));
        const tokenFreq = new Map<string, number>();
        for (const t of tokens) {
          tokenFreq.set(t, (tokenFreq.get(t) || 0) + 1);
        }

        // length = 总词频（含重复），与原 tokens.length 等价
        let length = 0;
        for (const freq of tokenFreq.values()) {
          length += freq;
        }

        chunks.push({
          file,
          heading: firstLine.slice(0, 120),
          text,
          tokenFreq,
          length,
        });

        // dfMap：每个不同的词算一次
        for (const t of tokenFreq.keys()) {
          dfMap.set(t, (dfMap.get(t) || 0) + 1);
        }
      }
    }

    avgDl = chunks.reduce((sum, c) => sum + c.length, 0) / Math.max(chunks.length, 1);

    console.info("[KB-SEARCH]", {
      files: files.length,
      chunks: chunks.length,
      avgChunkLen: Math.round(avgDl),
      totalChars: chunks.reduce((s, c) => s + c.text.length, 0),
      memNote: "v13.17.4 tokens array removed",
    });
  } catch (err) {
    initError = String(err);
    console.error("[KB-SEARCH] init failed:", err);
  }
}

// ---------- BM25 检索 ----------

const K1 = 1.5;
const B = 0.75;

function bm25Score(queryTokens: string[], chunk: KbChunk): number {
  let score = 0;
  const N = chunks.length;

  for (const qt of queryTokens) {
    const df = dfMap.get(qt) || 0;
    if (df === 0) continue;

    const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
    const tf = chunk.tokenFreq.get(qt) || 0;
    if (tf === 0) continue;

    const norm = 1 - B + B * (chunk.length / Math.max(avgDl, 1));
    let tokenScore = idf * ((tf * (K1 + 1)) / (tf + K1 * norm));

    if (qt.length === 3) tokenScore *= 1.5;
    if (qt.length >= 4) tokenScore *= 2.0;

    score += tokenScore;
  }

  return score;
}

// ---------- 查询扩展 ----------

const SYNONYMS: Record<string, string[]> = {
  "出柜": ["coming", "out", "坦白", "告诉", "公开"],
  "家里": ["家庭", "父母", "爸妈", "家长", "家人"],
  "反对": ["不接受", "不理解", "拒绝", "排斥"],
  "焦虑": ["紧张", "担心", "不安", "害怕", "恐慌"],
  "抑郁": ["低落", "没意义", "不想活", "绝望", "空虚"],
  "分手": ["失恋", "分开", "离开", "结束关系"],
  "自卑": ["不够好", "不配", "没价值", "羞耻"],
  "伴侣": ["对象", "男朋友", "女朋友", "另一伴", "恋人"],
  "身份": ["认同", "角色", "标签", "自我"],
  "性别": ["生理", "心理", "跨性别", "顺性别", "肯定", "肯认", "多元性别", "性少数"],
  "肯定": ["肯认", "确认", "支持", "接纳"],
  "跨性别": ["跨性別", "trans", "transgender", "性别焦虑", "性别不安"],
  "咨询": ["治疗", "辅导", "谈话", "心理师"],
  "情绪": ["感受", "心情", "感觉"],
  "关系": ["亲密", "伴侣", "家庭", "人际"],
  "压力": ["压迫", "负担", "受不了", "崩溃"],
  "孤独": ["一个人", "没人", "寂寞", "孤立"],
  "愤怒": ["生气", "火大", "暴怒", "委屈"],
  "悲伤": ["难过", "哭", "心痛", "失落"],
  "恐惧": ["害怕", "不敢", "担心", "逃避"],
  "自我": ["认同", "价值", "接纳", "真实"],
  "接纳": ["接受", "认可", "包容", "理解"],
  "创伤": ["伤害", "阴影", "过去", "PTSD"],
  "双性恋": ["双性", "bisexual", "双", "两性"],
  "破裂": ["修复", "裂痕", "关系破裂", "断裂", "冲突"],
  "修复": ["修复关系", "关系修复", "和好", "重建"],
};

function expandQuery(query: string): string[] {
  const baseTokens = tokenize(query).filter((t) => !STOP_BIGRAMS.has(t));
  const expanded = new Set(baseTokens);

  for (const [key, syns] of Object.entries(SYNONYMS)) {
    if (query.includes(key)) {
      for (const s of syns) {
        if (s.length >= 2) expanded.add(s.toLowerCase());
      }
    }
  }

  return Array.from(expanded);
}

// ---------- 城市档案召回（P1 工单 A：日常倾诉场景）----------

// 城市名映射：全称/简称/别称 → 档案文件名
const CITY_NAME_MAP: Record<string, string> = {
  // 上海
  "上海": "QM_AI_城市上海_心理知识档案_v1.md",
  "魔都": "QM_AI_城市上海_心理知识档案_v1.md",
  // 北京
  "北京": "QM_AI_城市北京_心理知识档案_v1.md",
  "帝都": "QM_AI_城市北京_心理知识档案_v1.md",
  // 广州
  "广州": "QM_AI_城市广州_心理知识档案_v1.md",
  "羊城": "QM_AI_城市广州_心理知识档案_v1.md",
  "花城": "QM_AI_城市广州_心理知识档案_v1.md",
  // 深圳
  "深圳": "QM_AI_城市深圳_心理知识档案_v1.md",
  "鹏城": "QM_AI_城市深圳_心理知识档案_v1.md",
  // 成都
  "成都": "QM_AI_城市成都_心理知识档案_v1.md",
  "蓉城": "QM_AI_城市成都_心理知识档案_v1.md",
  // 三亚
  "三亚": "QM_AI_城市三亚_心理知识档案_v1.md",
};

// 情绪/压力/关系词列表（日常倾诉场景）
const EMOTION_PRESSURE_WORDS = [
  // 情绪词
  "累", "焦虑", "睡不着", "失眠", "撑不住", "压力", "委屈", "孤独", "倦怠",
  "不想活", "崩溃", "绝望", "空虚", "迷茫", "烦躁", "郁闷", "难过", "伤心",
  "害怕", "恐惧", "紧张", "不安", "恐慌",
  // 关系词
  "催婚", "吵架", "分手", "离婚", "孤独", "寂寞", "没人理解", "融不进去",
  "见外", "客气", "疏远", "隔阂",
  // 职场词
  "加班", "996", "工作", "老板", "同事", "升职", "降薪", "裁员", "失业",
  // 家庭词
  "回家", "父母", "爸妈", "家人", "亲戚", "催", "逼", "唠叨",
  // 生活适应词
  "适应", "融入", "异乡", "漂泊", "流浪", "想家", "思乡",
  // P1.6 F5：隐式表达词（上海/成都等城市的隐式倾诉场景）
  "不好意思", "开口", "帮忙", "绕路", "怕麻烦", "怕打扰", "分寸", "独立",
  "打拼", "矫情", "躺着", "舒服", "安逸",
  // P1.8 H11：外来者视角语料（外地人在城市的体感）
  "外地人", "本地人", "方言", "听不懂", "口音", "归属感", "归属感", "融入",
  "融不进", "圈子", "朋友少", "没朋友", "孤单", "想家", "回家", "漂泊",
  "漂泊感", "无根", "扎根", "落户", "买房", "租房", "合租",
];

/**
 * 检测用户消息是否触发城市档案召回（日常倾诉场景）
 * @param query 用户消息
 * @returns 匹配的城市档案文件名，或 null
 */
function detectCityArchiveTrigger(query: string): string | null {
  const lowerQuery = query.toLowerCase();
  
  // 检测城市名
  let matchedCity = "";
  for (const cityName of Object.keys(CITY_NAME_MAP)) {
    if (lowerQuery.includes(cityName)) {
      matchedCity = cityName;
      break;
    }
  }
  
  if (!matchedCity) return null;
  
  // 检测情绪/压力/关系词
  let hasEmotionWord = false;
  for (const word of EMOTION_PRESSURE_WORDS) {
    if (lowerQuery.includes(word)) {
      hasEmotionWord = true;
      break;
    }
  }
  
  if (!hasEmotionWord) return null;
  
  // 同时包含城市名和情绪/压力/关系词，触发城市档案召回
  return CITY_NAME_MAP[matchedCity];
}

// ---------- 海外场景过滤（P1.5 工单 D：境内场景过滤）----------

// 用户侧海外信号词
const OVERSEAS_SIGNAL_WORDS = [
  "海外", "时差", "留学", "留学生", "出国", "移民", "旅居", "境外",
  "foreign", "abroad", "国外", "外国",
];

// 文章侧海外标记（标题或文件名含以下关键词者标记为 overseas）
const OVERSEAS_MARKERS = ["海外", "时差", "留学", "出国", "移民", "旅居", "境外"];

/**
 * 检测用户消息是否包含海外信号
 * @param query 用户消息
 * @returns 是否包含海外信号
 */
function hasOverseasSignal(query: string): boolean {
  const lowerQuery = query.toLowerCase();
  return OVERSEAS_SIGNAL_WORDS.some(word => lowerQuery.includes(word));
}

/**
 * 检测文章是否为海外相关文章
 * @param filename 文件名
 * @param heading 标题
 * @returns 是否为海外相关文章
 */
function isOverseasArticle(filename: string, heading: string): boolean {
  const combined = `${filename} ${heading}`.toLowerCase();
  return OVERSEAS_MARKERS.some(marker => combined.includes(marker));
}

// ---------- 公开接口 ----------

export function searchKnowledge(
  query: string,
  topK = 5,
  maxChars = 4000,
): KbSearchResult[] {
  initialize();

  if (chunks.length === 0 || !query.trim()) {
    return [];
  }

  const queryTokens = expandQuery(query);
  if (queryTokens.length === 0) return [];

  // P1 工单 A：检测城市档案召回触发（循环不变式，仅算一次）
  const cityArchiveFile = detectCityArchiveTrigger(query);
  // P1.6 F2：海外信号同样为 query 纯函数，循环内提升避免 9512 次重复计算
  const userHasOverseasSignal = hasOverseasSignal(query);

  // 文件名→token 集合缓存，避免循环内对每个 chunk 重复 tokenize(chunk.file)
  const fileTokenCache = new Map<string, Set<string>>();
  const getFileTokens = (file: string): Set<string> => {
    let t = fileTokenCache.get(file);
    if (!t) {
      t = new Set(tokenize(file).map((x) => x.toLowerCase()));
      fileTokenCache.set(file, t);
    }
    return t;
  };

  const scored: { chunk: KbChunk; score: number }[] = [];
  for (const chunk of chunks) {
    let score = bm25Score(queryTokens, chunk);

    const fileTokens = getFileTokens(chunk.file);
    let filenameBoost = 0;
    let strongMatches = 0;
    let weakMatches = 0;
    for (const qt of queryTokens) {
      if (qt.length < 2) continue;
      if (fileTokens.has(qt)) {
        if (qt.length >= 3) strongMatches++;
        else weakMatches++;
      }
    }
    if (strongMatches >= 2) filenameBoost = 100;
    else if (strongMatches === 1 && weakMatches >= 1) filenameBoost = 60;
    else if (strongMatches === 1) filenameBoost = 40;
    else if (weakMatches >= 2) filenameBoost = 25;
    score += filenameBoost;

    // P1 工单 A：城市档案加权
    if (cityArchiveFile && chunk.file === cityArchiveFile) {
      score += 200; // 城市档案加权，确保高优先级召回
    }

    // P1.6 F2：海外文章硬排除（境内场景）
    // 用户消息无海外信号时，overseas 标记文章不得进入传给模型的参考片段集
    if (!userHasOverseasSignal && isOverseasArticle(chunk.file, chunk.heading)) {
      continue; // 硬排除，不参与评分竞争
    }

    if (score > 0) {
      scored.push({ chunk, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, topK * 2);

  const fileCount = new Map<string, number>();
  const results: KbSearchResult[] = [];
  let totalChars = 0;

  for (const { chunk, score } of top) {
    const fc = fileCount.get(chunk.file) || 0;
    if (fc >= 2) continue;
    if (totalChars + chunk.text.length > maxChars) continue;

    results.push({
      file: chunk.file,
      heading: chunk.heading,
      text: chunk.text,
      score: Math.round(score * 100) / 100,
    });

    fileCount.set(chunk.file, fc + 1);
    totalChars += chunk.text.length;

    if (results.length >= topK) break;
  }

  return results;
}

export function formatKnowledgeForPrompt(results: KbSearchResult[]): string {
  if (results.length === 0) return "";

  const blocks = results.map((r, i) => {
    const sourceLabel = r.file
      .replace(/\.md$/, "")
      .replace(/QM_AI_/, "")
      .replace(/_/g, " ")
      .slice(0, 60);
    return [
      `[参考片段 ${i + 1}｜来源：${sourceLabel}]`,
      r.text,
    ].join("\n");
  });

  return [
    "<knowledge_base_context>",
    "以下是从QM专业知识库中检索到的相关内容。这些内容是你训练资料的补充参考，",
    "不是要你逐字复述。请基于这些专业内容，结合你的角色判断来回应，",
    "但不要提及'检索'、'知识库'、'片段'等技术词汇，自然融入即可。",
    "",
    ...blocks,
    "</knowledge_base_context>",
  ].join("\n");
}

export function getKbStatus() {
  initialize();
  return {
    initialized: chunks.length > 0,
    chunkCount: chunks.length,
    fileCount: new Set(chunks.map((c) => c.file)).size,
    error: initError,
  };
}
