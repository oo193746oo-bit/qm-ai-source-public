// E-2 B 知识惰性注入（SP 减负）
// 将「可惰性」章节从恒注入 base 中剥离，仅当保守关键词白名单命中（或会话已激活）时才注回，
// 从而让未命中轮次的首字预填更短；核心前置（危机/伦理/内容防火墙/P0 安全/输出纪律）恒注入不减配。
// 纯函数、无 next 依赖，可直接单测：npx tsx scripts/_e2b_lazy_assert.ts

export interface LazyBlockDef {
  key: string;
  titlePrefix: string; // '## ' 级标题前缀，用于剥离与注入定位
}

// 候选惰性块（按工作区实物 qm-system-prompt-full.md 章节标题前缀定位）
export const LAZY_BLOCKS: LazyBlockDef[] = [
  { key: "xiaohongshu", titlePrefix: "## 八之四" },
  { key: "therapist", titlePrefix: "## 模块 9.5" },
  { key: "onboarding", titlePrefix: "## 模块 14" },
  { key: "assessment", titlePrefix: "## 模块 15" },
  { key: "group_kb", titlePrefix: "## 模块 7" },
  { key: "gender_terms", titlePrefix: "## 附录 D" },
  { key: "kb_index", titlePrefix: "## 附录 E" },
  { key: "v11_enhance", titlePrefix: "## v11.5 增强层" },
  { key: "scene_lib", titlePrefix: "## 模块 11" },
  { key: "memory", titlePrefix: "## 模块 12" },
];

// 命中 L2 关键词白名单（保守，宁少勿多，不命中 = 维持现状）
const TRIGGERS: Record<string, string[]> = {
  xiaohongshu: ["小红书", "发笔记", "被看见", "种草", "文案"],
  therapist: ["预约", "心理师", "咨询师", "收费标准", "首次费用", "次卡", "麦兜", "费用"],
  onboarding: ['开始使用', '第一次用', '新手', '教程', '怎么用', '操作说明'],
  assessment: ["测评", "量表", "MBTI", "自查", "测一下", "评测", "心理健康测"],
  group_kb: ["伴侣", "双泛", "泛性恋", "HIV", "跨性别伴侣", "少数群体", "交叉性"],
  gender_terms: ["代词", "性别认同", "出柜", "非二元", "跨男", "跨女", "性别焦虑"],
  kb_index: ["知识库", "问小酷", "资料库"],
  v11_enhance: [],
  scene_lib: [],
  memory: [],
};

export function splitLazyFromSp(
  sp: string
): { base: string; lazy: Record<string, string> } {
  const h2 = (ln: string) => ln.startsWith("## ");
  const lines = sp.split("\n");
  const baseParts: string[] = [];
  const lazy: Record<string, string> = {};
  let curTitle = "";
  let curKey: string | null = null;
  let curLines: string[] = [];
  const flush = () => {
    if (!curTitle) return;
    const text = curLines.join("\n");
    if (curKey) lazy[curKey] = text;
    else baseParts.push(text);
  };
  for (const ln of lines) {
    if (h2(ln)) {
      flush();
      const title = ln.trim();
      curTitle = title;
      curKey = LAZY_BLOCKS.find((d) => title.startsWith(d.titlePrefix))?.key ?? null;
      curLines = [ln];
    } else {
      curLines.push(ln);
    }
  }
  flush();
  return { base: baseParts.join("\n\n"), lazy };
}

// 判定某缺省关键词命中 → 激活主题
function detectTopic(userText: string): string | null {
  for (const def of LAZY_BLOCKS) {
    const trg = TRIGGERS[def.key];
    if (!trg || trg.length === 0) continue;
    if (trg.some((w) => userText.includes(w))) return def.key;
  }
  return null;
}

export interface LazyOpts {
  firstTurn?: boolean; // 是否真正首轮（用于 onboarding 等一次性块）
}

export function injectLazyBlocks(
  userTexts: string[],
  lazy: Record<string, string>,
  _opts?: LazyOpts
): { blocks: string[]; activated: string[] } {
  const activated: string[] = [];
  for (const t of userTexts) {
    const k = detectTopic(t);
    if (k && !activated.includes(k)) activated.push(k);
  }
  // onboarding 等仅首轮才注入
  const first = _opts?.firstTurn ?? true;
  const blocks: string[] = [];
  for (const k of activated) {
    if (!first && k === "onboarding") continue;
    const text = lazy[k];
    if (text) blocks.push(text);
  }
  return { blocks, activated };
}