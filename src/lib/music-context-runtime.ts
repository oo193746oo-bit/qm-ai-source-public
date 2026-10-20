import fs from "fs";
import path from "path";

export type MusicThemeCode =
  | "breakup" | "longing" | "romance" | "self" | "hope" | "lonely"
  | "grief" | "anxiety" | "family" | "friendship" | "nostalgia" | "anger";

export interface MusicOpportunityContext {
  explicitMusicRequest: boolean;
  userOptOut: boolean;
  crisisLike: boolean;
  professionalCaseLike: boolean;
  themeSignals: MusicThemeCode[];
  dominantTheme?: MusicThemeCode;
  generationSignals: string[];
  proactiveEligible: boolean;
  reason: string;
}

export interface MusicSong {
  id: string;
  artist: string;
  title: string;
  language: string;
  release_era: string;
  generation_fit: string[];
  primary_theme: string;
  theme_code: MusicThemeCode;
  emotional_valence: string;
  lyric_semantic_summary: string;
  semantic_confidence: "high" | "medium" | "low";
  proactive_recommendation_enabled: boolean;
  copyright_mode: string;
  full_lyrics_included: boolean;
}

export interface MusicCandidate {
  song: MusicSong;
  score: number;
  reasons: string[];
}

let _songs: MusicSong[] | null = null;

function loadSongs(): MusicSong[] {
  if (_songs) return _songs;
  try {
    const p = path.join(process.cwd(), "src", "lib", "knowledge", "pack_music.json");
    if (!fs.existsSync(p)) return [];
    const data = JSON.parse(fs.readFileSync(p, "utf-8"));
    _songs = data.cases || [];
    return _songs || [];
  } catch (e) {
    console.warn("[music] failed to load music catalog", e);
    return [];
  }
}

function unique<T>(xs: T[]): T[] { return [...new Set(xs)]; }

function detectGeneration(text: string): string[] {
  const out: string[] = [];
  if (/60后|196\d/.test(text)) out.push("60后");
  if (/70后|197\d/.test(text)) out.push("70后");
  if (/80后|198\d/.test(text)) out.push("80后");
  if (/90后|199\d/.test(text)) out.push("90后");
  if (/00后|200\d/.test(text)) out.push("00后");
  if (/10后|201\d/.test(text)) out.push("10后");
  return out;
}

function detectThemes(text: string): MusicThemeCode[] {
  const tests: Array<[MusicThemeCode, RegExp]> = [
    ["breakup", /分手|失恋|离婚|结束了|分开|被甩|前任|放不下|断联|复合|break.?up|ex\b/i],
    ["longing", /想他|想她|想念|怀念|舍不得|等他|等她|未完成|回不去|miss\b|longing/i],
    ["romance", /恋爱|喜欢上|爱上|暧昧|亲密|伴侣|告白|约会|crush|relationship|love\b/i],
    ["self", /自我价值|不喜欢自己|做自己|身份|我是谁|自卑|不够好|身体形象|self.?worth|identity/i],
    ["hope", /撑不住但|想振作|重新开始|坚持|希望|动力|没放弃|鼓励|勇气|start over|keep going/i],
    ["lonely", /孤独|寂寞|没人懂|没人陪|一个人|疏离|空空的|lonely|alone/i],
    ["grief", /去世|死亡|离世|失去.*人|哀伤|悼念|丧亲|告别|grief|bereav/i],
    ["anxiety", /焦虑|紧张|内耗|反复想|停不下来|失控|恐慌|睡不着|压力|anxious|overthink/i],
    ["family", /父母|妈妈|爸爸|家庭|原生家庭|家里|亲人|family|mother|father/i],
    ["friendship", /朋友|友情|闺蜜|兄弟|友谊|绝交|朋友疏远|friendship|best friend/i],
    ["nostalgia", /青春|以前|小时候|长大|毕业|学生时代|旧时光|回忆|怀旧|nostalgia|young/i],
    ["anger", /愤怒|生气|气死|恨|被背叛|被控制|不公平|边界|angry|rage|betray/i],
  ];
  return tests.filter(([,r]) => r.test(text)).map(([t]) => t);
}

export function analyzeMusicOpportunity(userText: string, history: string[], role: "xiaoku" | "xiaoxue"): MusicOpportunityContext {
  const all = `${history.slice(-10).join("\n")}\n${userText}`;
  const explicitMusicRequest = /歌|歌曲|音乐|歌单|听什么|推荐.*歌|哪首歌|music|song|playlist/i.test(userText);
  const userOptOut = /不要.*歌|不想听歌|别推荐歌|讨厌音乐|不要音乐|no music|don.?t recommend.*song/i.test(all);
  const crisisLike = /自杀|想死|不想活|结束生命|伤害自己|自残|跳楼|割腕|suicid|kill myself|self.?harm/i.test(userText);
  const professionalCaseLike = /我的来访者|我的个案|我手上的个案|来访者说|会谈中|督导|case discussion/i.test(userText);
  const themeSignals = unique(detectThemes(userText));
  const generationSignals = unique(detectGeneration(all));
  const recentMusicUsed = /我想到一首歌|推荐你一首|这首歌|歌曲里|听听.*歌|song recommendation/i.test(history.slice(-8).join("\n"));

  // 主动音乐只属于小酷；小雪行政角色不主动引导到音乐。
  const proactiveEligible = role === "xiaoku"
    && !explicitMusicRequest
    && !userOptOut
    && !crisisLike
    && !professionalCaseLike
    && !recentMusicUsed
    && history.length >= 1
    && themeSignals.length >= 1;

  const reason = crisisLike ? "危机优先，音乐不得抢占安全响应"
    : userOptOut ? "用户已拒绝音乐"
    : professionalCaseLike ? "专业个案讨论不主动插入歌曲"
    : explicitMusicRequest ? "用户明确提出音乐需求"
    : proactiveEligible ? "存在清晰情绪/关系主题，可轻量以歌曲建立共情桥梁"
    : "当前不需要主动音乐介入";

  return {
    explicitMusicRequest, userOptOut, crisisLike, professionalCaseLike,
    themeSignals,
    dominantTheme: themeSignals[0],
    generationSignals,
    proactiveEligible,
    reason,
  };
}

export function retrieveMusicCandidates(ctx: MusicOpportunityContext, role: "xiaoku" | "xiaoxue", limit = 5): MusicCandidate[] {
  if (ctx.userOptOut || ctx.crisisLike) return [];
  if (role === "xiaoxue" && !ctx.explicitMusicRequest) return [];
  const songs = loadSongs();
  const out: MusicCandidate[] = [];
  for (const song of songs) {
    let score = 0;
    const reasons: string[] = [];
    if (ctx.dominantTheme && song.theme_code === ctx.dominantTheme) { score += 0.50; reasons.push("主题贴合"); }
    else if (ctx.themeSignals.includes(song.theme_code)) { score += 0.36; reasons.push("次级主题贴合"); }
    if (ctx.generationSignals.length && ctx.generationSignals.some(g => song.generation_fit.includes(g))) { score += 0.12; reasons.push("成长年代可能熟悉"); }
    if (song.semantic_confidence === "high") { score += 0.22; reasons.push("语义标注高置信度"); }
    else if (song.semantic_confidence === "medium") score += 0.08;
    if (song.proactive_recommendation_enabled) score += 0.12;
    if (ctx.explicitMusicRequest) score += 0.08;
    if (!ctx.explicitMusicRequest && !song.proactive_recommendation_enabled) score -= 0.35;
    out.push({ song, score, reasons });
  }
  return out.sort((a,b) => b.score-a.score).slice(0, limit);
}

export function buildMusicPromptBlock(ctx: MusicOpportunityContext, candidates: MusicCandidate[], role: "xiaoku" | "xiaoxue"): string {
  if (ctx.userOptOut || ctx.crisisLike) return "";
  if (!ctx.explicitMusicRequest && !ctx.proactiveEligible) return "";
  if (role === "xiaoxue" && !ctx.explicitMusicRequest) return "";
  const lines: string[] = [];
  lines.push("【音乐共情运行层】");
  lines.push(`当前音乐模式：${ctx.explicitMusicRequest ? "用户主动询问" : "小酷可主动轻量连接"}。原因：${ctx.reason}`);
  lines.push("规则：先回应用户本人，再考虑歌曲；歌曲只能是共情桥梁/隐喻/陪伴，不是治疗，不用歌替代对话。");
  lines.push("默认只提1首；除非用户明确要歌单，最多3首。不得连续多轮主动推歌。用户拒绝后停止。");
  lines.push("不要按年龄硬推歌曲。年代只能作为弱信号；必须以当前情绪/议题贴合为主。");
  lines.push("版权规则：本包不含完整受版权保护歌词。不得输出整段歌词；默认只用歌词语义摘要。若确需逐字引用，单次受版权保护歌词不超过10个词。不要声称记得某句歌词，除非有授权歌词源且已核验。");
  if (candidates.length) {
    lines.push("候选歌曲（只从下面选，不要现场编歌曲/歌手）：");
    for (const c of candidates.slice(0,5)) {
      lines.push(`- ${c.song.artist}《${c.song.title}》｜${c.song.release_era}｜${c.song.primary_theme}｜语义：${c.song.lyric_semantic_summary}｜score=${c.score.toFixed(2)}`);
    }
  }
  lines.push("主动连接的推荐句式示例（不是固定模板）：‘你刚才说的___，让我想到___。不是因为故事完全一样，而是那种___很接近。如果你愿意，可以把它当成今晚的一首陪伴。’");
  if (role === "xiaoxue") lines.push("小雪角色边界：只在用户明确问歌时简短回答；预约/费用/心理师流程中不主动转成音乐推荐。必要时把情绪支持交回小酷。");
  return lines.join("\n");
}

export function verifyMusicOutput(output: string, ctx: MusicOpportunityContext | undefined, role: "xiaoku" | "xiaoxue") {
  const violations: Array<{id:string; level:"P0"|"P1"; description:string}> = [];
  if (!ctx) return violations;
  if (ctx.userOptOut && /推荐.*歌|想到一首歌|听听.*歌|这首歌/.test(output)) {
    violations.push({id:"MUS-H001",level:"P0",description:"用户拒绝音乐后仍继续推荐"});
  }
  if (ctx.crisisLike && /推荐.*歌|想到一首歌|歌单|听听.*歌/.test(output)) {
    violations.push({id:"MUS-H002",level:"P0",description:"危机场景让音乐抢占了安全响应"});
  }
  if (role === "xiaoxue" && !ctx.explicitMusicRequest && /推荐.*歌|想到一首歌|听听.*歌/.test(output)) {
    violations.push({id:"MUS-H003",level:"P1",description:"小雪在非音乐请求中主动推荐歌曲，偏离行政角色"});
  }
  // 粗略识别疑似长歌词引用：中文引号内 > 30 字或英文引号内 > 10词。
  const quoted = [...output.matchAll(/[“\"]([^”\"]+)[”\"]/g)].map(m => m[1]);
  for (const q of quoted) {
    const words = q.trim().split(/\s+/).filter(Boolean).length;
    const cjk = (q.match(/[\u4e00-\u9fff]/g)||[]).length;
    if (cjk > 30 || words > 10) {
      violations.push({id:"MUS-H004",level:"P0",description:"疑似输出过长受版权保护歌词逐字引用"});
      break;
    }
  }
  if (/这首歌一定会治愈你|听完就会好|最适合你|保证.*有效/.test(output)) {
    violations.push({id:"MUS-H005",level:"P1",description:"把音乐夸大成治疗或保证性效果"});
  }
  return violations;
}
