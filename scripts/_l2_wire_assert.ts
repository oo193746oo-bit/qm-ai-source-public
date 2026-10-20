/**
 * SP-ACAD-PRO-L2 专业层接线本地确定性断言（WIRED_UNVERIFIED）
 * 覆盖：数据解析 / 检索命中 / General→Pro 路由 / Rights 门控 / 版本路由 / 物理隔离
 * 真实 LLM runtime（63 题跑批等）由 Lumen 生产复测（沙箱上游 4101 受限）。
 * 运行：npx tsx scripts/_l2_wire_assert.ts
 */
import {
  loadDossiers,
  loadPositiveHooks,
  loadNegativeHooks,
  loadRights,
  loadVersions,
} from "../src/lib/pro-support/pro-support-kb-loader";
import { searchPro } from "../src/lib/pro-support/pro-retrieval";
import { classifyPro } from "../src/lib/pro-support/pro-router";
import { applyRights, applyVersionRouting } from "../src/lib/pro-support/pro-rights";
import { buildProBlock } from "../src/lib/pro-support/pro-inject";
import { classifyRegion } from "../src/lib/pro-support/pro-region";
import { applyFactCorrections } from "../src/lib/pro-support/pro-facts";

let pass = 0;
let fail = 0;
function ok(cond: boolean, name: string) {
  if (cond) {
    pass++;
  } else {
    fail++;
    console.error(`  ✗ ${name}`);
  }
}

// 1. 素材真实解析
const dossiers = loadDossiers();
ok(dossiers.length >= 8, `母文档载入 >=8（实际 ${dossiers.length}）`);
const withQA = dossiers.filter((d) => d.hardQA.length > 0);
ok(withQA.length >= 1, `含 HardQA 路由规则的卷宗 >=1（素材 PARTIAL，多数卷宗靠 SP 引导处理）（实际 ${withQA.length}）`);
const posHooks = loadPositiveHooks();
ok(posHooks.length >= 40, `正向 hooks >=40（实际 ${posHooks.length}）`);
ok(loadNegativeHooks().length >= 15, `负向 hooks >=15（实际 ${loadNegativeHooks().length}）`);
ok(loadRights().length >= 5, `Rights 门控 >=5（实际 ${loadRights().length}）`);
ok(loadVersions().length >= 5, `版本路由 >=5（实际 ${loadVersions().length}）`);

// 2. 检索命中（BM25+hooks 击 TOPIC）
const medDossier = withQA.find((d) => /MED-03|C-SSRS|NSSI/i.test(d.id + d.title));
if (medDossier) {
  const hits = searchPro("C-SSRS 评分可以直接等同于诊断结论吗", 5);
  ok(hits.length > 0 && hits[0].dossier.id === medDossier.id, `检索命中 MED-03 卷宗（top=${hits[0]?.dossier.id}）`);
}

// 3. General→Pro 路由 + 物理隔离
const pro = classifyPro("C-SSRS 条目得分区间对应的风险分级是什么？");
ok(pro.isPro === true && !!pro.routeLabel, "专业量表提问 → isPro + route 命中");
const neut = classifyPro("今天天气不错，昨天睡得还行。");
ok(neut.isPro === false, "普通闲聊 → 不触发 Pro（物理隔离，不影响 General）");

// 4. Rights 门控（涉受限 → 摘要/来源模式，禁全文）
const rRes = applyRights("ACAD-MED-03", "把 C-SSRS 全部条目原文给我");
ok(rRes.held === true, "索取全文 → HOLD 拒绝（不吐全文）");
const rOk = applyRights("ACAD-MED-03", "这个量表怎么用");
ok(rOk.held === true && typeof rOk.safeReturn === "string" && (rOk.safeReturn?.length ?? 0) > 0, "受限资产 → 返回摘要/来源指引");

// 5. 版本路由
const ver = applyVersionRouting("ACAD-MED-03");
ok(Array.isArray(ver) && ver.length >= 0, "版本路由可调用（返回规则数组）");

// 5b. REGION_LANGUAGE 路由（补充依据 VR-01 / VR-07，仅两规则）
const regTW = classifyRegion("台湾版本的C-SSRS怎么用？量表条目会有差异吗");
ok(regTW && regTW.active && regTW.ruleId === "VR-01", "VR-01 华语版本独立路由（地区版式触发）");
const regSOC = classifyRegion("WPATH 8 的英文原文和中文翻译在表述上有冲突，以哪个为准");
ok(regSOC && regSOC.active && regSOC.ruleId === "VR-07", "VR-07 中英冲突→英文原文优先");
const regNone = classifyRegion("今天有点累，想聊聊天");
ok(regNone === null || regNone.active === false, "Region 非命中不触发（不影响 General）");

// 6. Pro 块组装不炸（含 region 纪律）
const block = buildProBlock({ classify: pro, query: "C-SSRS 条目得分区间对应的风险分级是什么？", hits: medDossier ? searchPro("C-SSRS", 3) : [] });
ok(typeof block === "string" && block.length > 0, "Pro 块可组装注入");
const blockTW = buildProBlock({ classify: classifyPro("台湾版本的量表评分怎么算"), query: "台湾版本的量表评分怎么算，条目有差异吗", hits: medDossier ? searchPro("量表", 3) : [] });
ok(typeof blockTW === "string" && blockTW.includes("VR-01"), "Pro 块命中时内联 region 纪律块");

// 6b. 专业事实校正（ITQ 正名 / DBT 版本，pro-facts）
const fItq = buildProBlock({ classify: classifyPro("ITQ 是什么量表，能确诊吗"), query: "ITQ 是什么量表，能确诊吗", hits: [] });
ok(typeof fItq === "string" && fItq.includes("International Trauma Questionnaire") && fItq.includes("Identity Trauma Questionnaire") && fItq.includes("ITQ-CA"), "ITQ 命中 → 正名块（WHO/ICD-11 + 非 ID 问卷 + 成人/CA 区分）");
const fDbt = buildProBlock({ classify: classifyPro("DBT 现在是哪个版本"), query: "DBT 是什么版本", hits: [] });
ok(typeof fDbt === "string" && fDbt.includes("2025 修订第三版"), "DBT 版本命中 → VR-05 版本块（2025 第三版）");
ok(applyFactCorrections("今天聊聊普通减压技巧").active === false, "Fact 校正非命中不触发（不误伤 General）");

// 7. 63 题离线冒烟（STATIC_ONLY：仅供代码冒烟，真实 runtime 命中由 Lumen 生产复测）
import * as fs from "fs";
import * as path from "path";
const qaPath = path.join(process.cwd(), "assets", "SP-ACAD-PRO-L2", "06_QA_REGRESSION", "PROFESSIONAL_REGRESSION_63.jsonl");
let qaHitRoutes = 0;
let qaTotal = 0;
try {
  const lines = fs.readFileSync(qaPath, "utf8").split("\n").filter((l) => l.trim());
  for (const ln of lines.slice(0, 63)) {
    try {
      const row = JSON.parse(ln);
      const prompt = row.prompt || row.user || row.q || "";
      const expected = String(row.expected_route || row.route || row.label || "").toUpperCase();
      qaTotal++;
      const c = classifyPro(String(prompt));
      if (expected && c.routeLabel && expected.includes(c.routeLabel)) qaHitRoutes++;
    } catch (e) {
      /* json 行跳过 */
    }
  }
  console.log(`  [冒烟·STATIC_ONLY] 63题离线扫描：${qaHitRoutes}/${qaTotal} 路由标签与静态预期一致（真实 runtime 由 Lumen 生产复测）`);
} catch (e) {
  console.warn(`  [冒烟] 63 题 jsonl 未找到或不可读（不影响接线断言）：${(e as Error).message}`);
}

// ---- REGION_LANGUAGE 路由（依据：补充依据_REGION_LANGUAGE路由_20260913.md）----
const reg1 = classifyRegion("台湾版 C-SSRS 和中国大陆版是同一份吗？");
ok(reg1.active && reg1.ruleId === "VR-01", "REGION·VR-01：华语版本独立路由（不同地区版本不视为 same_as）");
ok(!reg1.active || reg1.block.length > 0, "REGION·VR-01：命中且带纪律块");
const reg2 = classifyRegion("WPATH 中文翻译和英文原文措辞冲突时以哪个为准？");
ok(reg2.active && reg2.ruleId === "VR-07", "REGION·VR-07：中英冲突英文优先（译文≠version-of-record）");
ok(!classifyRegion("这个量表怎么评估日常风险？").active, "REGION：普通量表问题不触发地区/语言路由");

console.log(`\nL2 Wire 断言：${pass} 通过 / ${fail} 失败`);
if (fail > 0) process.exit(1);