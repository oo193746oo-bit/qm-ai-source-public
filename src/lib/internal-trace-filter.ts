// P0-3：出站内部痕迹剥离（人类感受质量）
// 模型偶发把"打草稿/自我修正/输出前自检"这类 AI 内部过程泄漏成回复正文，
// 表现为：markdown 粗体自指块、"不对，重新来：" "哦对，缩一下" 等自指指令、同一成稿重复输出多遍。
// 本函数在流式完成后对整段做剥离，命中则通过 replaceOutput 帧替换为唯一最终稿；
// 不影响首字节延迟（流式照常，仅收尾追加一次替换帧）。
// 依据：Lumen 合并工程工单 P0-3（2026-09-12）。
const SELF_TALK_STRONG = [
  "重新组织",
  "重新来",
  "重新写",
  "缩一下",
  "这样就好",
  "检查有没有违禁词",
  "检查下有没有",
  "检查有没有诊断",
  "检查一下有没有",
  "语气要稳",
  "不要太说教",
  "不要太热情",
  "堆太多问句",
  "不要堆太多",
  "刚才的内容太多了",
  "还要符合小酷",
  "还要符合自己的身份",
  "重新组织下",
  "继续写",
  "我重新写",
];
const SELF_TALK_WEAK = ["哦对，", "不对，", "等下，", "等等，", "还要检查"];

// BatchA P3 (20260917): 真内部标记硬特征——命中才允许整块/整行剥除，
// 防止正常短行（加粗称呼行、短问句）被误删（终稿 markdown/短行蒸发）。
const INTERNAL_HARD_MARK = /(内部|自检|重新生成|重新组织|系统提示词|不要输出|仅限内部|检查有没有|检查下有没有|internal\s*draft)/i;

// 行级剥除决策：仅真内部标记行剥除；加粗整行（**…**）与问句行豁免
//（仍受 INTERNAL_HARD_MARK 约束——硬标记行必剥）。禁止仅凭"短行"删。
function stripLineDecision(t: string): boolean {
  if (!t || t.length >= 80) return false;
  if (INTERNAL_HARD_MARK.test(t)) return true;
  const hasStrong = SELF_TALK_STRONG.some((k) => t.includes(k));
  let hit = hasStrong;
  if (!hit) {
    let weakCount = 0;
    for (const k of SELF_TALK_WEAK) if (t.includes(k)) weakCount++;
    hit = weakCount >= 2;
  }
  if (!hit) return false;
  const isBoldWholeLine = /^\*\*[^*]+\*\*[：:]?\s*$/.test(t);
  const isQuestionLine = /[？?]\s*$/.test(t);
  if (isBoldWholeLine || isQuestionLine) return false;
  return true;
}

function isSelfTalkLine(line: string): boolean {
  const hasStrong = SELF_TALK_STRONG.some((k) => line.includes(k));
  if (hasStrong) return true;
  let weakCount = 0;
  for (const k of SELF_TALK_WEAK) if (line.includes(k)) weakCount++;
  return weakCount >= 2;
}

function dedupeRepeatedLines(text: string): string {
  const lines = text.split("\n");
  const seen = new Set<string>();
  const kept: string[] = [];
  for (const line of lines) {
    const key = line.trim();
    if (!key) {
      kept.push(line);
      continue;
    }
    if (seen.has(key)) continue; // 重复成稿只保留第一份
    seen.add(key);
    kept.push(line);
  }
  return kept.join("\n");
}

function dedupeRepeatedParagraphs(text: string): string {
  // P0-3：整段重复去重（同一成稿段落被完整复制多遍，行级去重因段内有换行而失效）
  // 四处增量三（P0 · 2026-09-14）：放开 blocks<3 的过早返回——恰 2 个整段相同（N09 长回复整段 2 遍）
  // 也要去重；并新增"连续成对整段"检测（AABB / A-B-A-B 都收敛为一份）。
  const blocks = text.split(/\n{2,}/);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const block of blocks) {
    const key = block.replace(/\s+/g, "").trim();
    if (!key) {
      out.push(block);
      continue;
    }
    // 连续成对重复：当前块与上一个已保留块逐字一致 → 丢弃本份（覆盖 AABB 与 A-B-A-B）
    if (out.length > 0 && normalizeKey(key) === normalizeKey(stripInlineMarkup(out[out.length - 1]))) {
      continue;
    }
    if (seen.has(key)) continue; // 整段重复只保留第一份
    seen.add(key);
    out.push(block);
  }
  return out.join("\n\n");
}

function normalizeKey(s: string): string {
  return s.replace(/\s+/g, "").replace(/[，。！？、：；,.!?…\s]+/g, "").trim();
}
function stripInlineMarkup(s: string): string {
  return s.replace(/\*\*|\*|#|`|>|【|】|/g, "");
}

export function stripInternalTraces(text: string): string {
  if (!text || !text.trim()) return text;
  let out = text;
  // ① 剥离 markdown 粗体内含自检指令的块（粗体是模型标记内部过程的高频载体）
  out = out.replace(/\*\*[^*]*?\*\*/g, (block) => {
    const inner = block.slice(2, -2);
    // BatchA P3: 仅真内部标记（硬特征命中）才删整块；普通加粗内容（称呼行等）保真
    if (INTERNAL_HARD_MARK.test(inner)) return "";
    return block;
  });
  // ② 段级：过滤"自指指令"特征行（含强自指词 或 多个弱特征）
  const lines = out.split("\n");
  const cleaned: string[] = [];
  for (const line of lines) {
    // BatchA P3: 保真修正——只剥真内部标记行，加粗称呼行/短问句存活
    if (stripLineDecision(line.trim())) continue;
    cleaned.push(line);
  }
  out = cleaned.join("\n");
  // ③ 重复成稿去重（行级）
  const before = out.length;
  out = dedupeRepeatedLines(out);
  // ③b 整段重复去重（P0-3：长回复多整段复制）
  out = dedupeRepeatedParagraphs(out);
  // ④ 清理剥离后的残留空壳（空标点对、孤行尾冒号、多余空行）
  out = out
    .replace(/[:：]\s*$/gm, "")
    .replace(/(?:「」|『』|""|''|（）|\(\)|\[\]|【】)/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
  // ⑤ P5 出站机械尾句硬过滤（A/B/C/D，见 stripTemplateTailPhrases）
  out = stripTemplateTailPhrases(out);
  if (out.length === 0 && before > 0) return text; // 全被剥光则保守回退原文，避免空回复
  return out;
}

/**
 * P5：出站机械尾句硬过滤（归属 m 小酷/小雪两路出站，挂在 stripInternalTraces 同机制上）。
 * 依据：P5 规格补充单（2026-09-13），原工单 `工单P5_小雪尾句出站硬过滤_20260912.md`。
 * 规则：
 *   A 命中 → 替换帧（保持引导不编造）
 *   B 命中 → 同上替换帧
 *   C（重复转介段，仅逐字重复触发）→ 缩短替换
 *   D（机械情感探针尾句）→ 直接删除该尾句，不追加
 */
// D 机械情感探针尾句的「全形式」：覆盖完整式、粗体包裹式、裸"此刻它带给你的是什么感觉"变体。
// 生产实锤（P5 打回单 2026-09-14）：`**我听到了你说的{原句摘录}…。此刻它带给你的是什么感觉？**`
// → 拆成两段正则分别剥，末尾再跑一次兜底全扫描，确保替换帧之后的最终拼接文本也过 D。
const TAIL_D_FULL = /我听到了你说的[\s\S]*?此刻它带给你的是什么感觉[。！？!?…]?/g;
const TAIL_D_BARE = /此刻它带给你的是什么感觉[。！？!?…]?/g;
const REPLACE_FRAME_AB = "你可以点「切换到小雪」，她会帮你查咨询师信息。想聊心理的事，随时回来找我。";
const REPLACE_FRAME_C = "预约安排找小雪最稳，点「切换到小雪」就好。";
// E：P5 四处增量一（2026-09-14）——post-gate G2 承接句「我理解这件事对你来说不容易。你愿意再多跟我聊聊你刚才提到的这部分吗？」
// 在生产普通对话被高频复用（64%，阿花快测），同句 LLM 自产时视为机械尾句整句剥离。
// 注意：仅作用于主链路 strip（post-gate 之前），post-gate 独立兜底走自身链路，不受本规则影响。
const TAIL_E = /我理解这件事对你来说不容易。你愿意再多跟我聊聊你刚才提到的这部分吗？/g;
// P0-B (20260916): G2 fallback same-variant blocklist (strip LLM self-generated copy)
const TAIL_F = /听起来这些对你来说都不轻松。愿意多说说此刻的感受吗？/g;
// P0-B (20260916): partial-phrase variants - strip half-sentence copies
// even when the LLM rewrites the other half (blocklist double-insurance).
const TAIL_F2 = /(?:听起来这些对你来说都不轻松|愿意多说说此刻的感受吗)/g;

export function stripTemplateTailPhrases(text: string): string {
  if (!text || !text.trim()) return text;
  let out = text;
  // A/B：整段精确匹配则替换帧（保留引导，不编造）
  out = out.replace(
    /((?:关于心理师的具体信息请联系人工客服确认|我可以先帮您整理需求和偏好|我可以先帮你整理需求和偏好)[^\n。]*?[\n。]?)/g,
    REPLACE_FRAME_AB + "\n"
  );
  // C：重复转介段，仅当「我不替小雪做决定」转介句在同一回复中出现 ≥2 次（逐字重复）时
  // 缩短替换为单次引导帧（防单次正常转介与单句陈述误伤）。
  const cMatches = out.match(/我不替小雪做决定/g);
  if (cMatches && cMatches.length >= 2) {
    out = out.replace(/[^\n。]*?我不替小雪做决定[^\n。]*?[\n。]?/g, REPLACE_FRAME_C + "\n");
  }
  // D：机械情感探针尾句 → 直接删尾句（全形式：完整式 + 粗体包裹 + 裸变体）
  out = out.replace(TAIL_D_FULL, "");
  out = out.replace(TAIL_D_BARE, "");
  // E（四处增量一）：post-gate G2 承接句的 LLM 自产版本 → 整句剥离
  out = out.replace(TAIL_E, "");
  out = out.replace(TAIL_F, "").replace(TAIL_F2, "");
  // 清理剥离残留空壳
  out = out
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
  if (out.length === 0 && text.length > 0) return text;

  // ⚠ P5 打回单（2026-09-14）：探针句可能出现在 A/B 替换帧之后的最终拼接文本末尾，
  // 中间态 D 只删了替换前位置。末端再对完整出站文本做一次全形式 D 兜底扫描，尾删干净。
  const onceMore = out
    .replace(TAIL_D_FULL, "")
    .replace(TAIL_D_BARE, "")
    .replace(TAIL_E, "")
    .replace(TAIL_F, "")
    .replace(TAIL_F2, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
  return onceMore.length > 0 ? onceMore : out;
}
// P0-A (20260916): post-stream whole-segment repeat dedup (deterministic defense)
function charSim(a: string, b: string): number {
  const n = Math.min(a.length, b.length);
  if (n === 0) return 0;
  let same = 0;
  for (let i = 0; i < n; i++) if (a[i] === b[i]) same++;
  return same / n;
}

export function dedupeRepeats(text: string): string {
  const T = (text || "").trim();
  const L = T.length;
  if (L < 60) return text;
  for (let unit = Math.floor(L / 2); unit >= 30; unit--) {
    const a = T.slice(0, unit);
    const b = T.slice(unit, 2 * unit);
    if (b.length >= 30 && charSim(a, b) > 0.85) {
      let end = 2 * unit;
      while (end + unit <= L && charSim(a, T.slice(end, end + unit)) > 0.85) end += unit;
      const rest = T.slice(end).trim();
      let out = a.trimEnd();
      if (!/[。！？!?...」"]$/.test(out)) out += "。";
      return rest ? out + "\n\n" + rest : out;
    }
  }
  return text;
}