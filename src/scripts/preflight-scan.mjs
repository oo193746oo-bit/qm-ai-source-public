#!/usr/bin/env node
// ============================================================
// QM AI v11.5 部署前静态扫描脚本
// 纯 Node.js，不依赖 npm 包
// 运行: node scripts/preflight-scan.mjs
// ============================================================

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC_DIR = path.resolve(__dirname, "..");

// 颜色输出
const colors = {
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

const results = [];

function addResult(checkId, status, message, severity = "P1") {
  results.push({ checkId, status, message, severity });
}

// 递归读取目录下所有文件
function readDirRecursive(dir, extensions = [".ts", ".tsx", ".js", ".mjs", ".md", ".json"]) {
  const files = [];
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // 跳过 node_modules 和 .next
      if (entry.name === "node_modules" || entry.name === ".next" || entry.name === ".git") continue;
      files.push(...readDirRecursive(fullPath, extensions));
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  return files;
}

function readFileSafe(filePath) {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
}

// ============================================================
// PF001: Prompt 中 allow/deny 冲突检查
// ============================================================
function checkPF001() {
  const spFiles = [
    path.join(SRC_DIR, "lib", "qm-system-prompt-full.md"),
    path.join(SRC_DIR, "lib", "xiaoxue-system-prompt.md"),
  ];

  for (const spFile of spFiles) {
    const content = readFileSafe(spFile);
    if (!content) continue;

    const fileName = path.basename(spFile);
    const conflicts = [];

    // 检查"可以推荐"和"不推荐"在同一上下文
    const allowRecommend = /(?:可以|允许|应当).{0,10}(?:推荐|点名|介绍心理师)/g;
    const denyRecommend = /(?:禁止|不得|不可以|不能|绝对不).{0,10}(?:推荐|点名|介绍心理师)/g;

    const allows = content.match(allowRecommend) || [];
    const denys = content.match(denyRecommend) || [];

    // v11.0后应统一为"禁止点名推荐"，如果有allow则冲突
    if (allows.length > 0 && denys.length > 0) {
      // 检查allow是否在v11.5增强层之前的旧内容中（历史规则允许推荐文章是正常的）
      // 真正冲突是同时允许和禁止同一件事
      const hasAllowTherapist = allows.some((a) => a.includes("心理师"));
      const hasDenyTherapist = denys.some((d) => d.includes("心理师"));
      if (hasAllowTherapist && hasDenyTherapist) {
        conflicts.push(`同时存在允许和禁止心理师推荐的规则`);
      }
    }

    // 检查"可以做"和"不能做"中的矛盾
    if (conflicts.length > 0) {
      addResult("PF001", "FAIL", `${fileName}: ${conflicts.join("; ")}`, "P0");
    } else {
      addResult("PF001", "PASS", `${fileName}: 无allow/deny冲突`);
    }
  }
}

// ============================================================
// PF002: 角色边界一致性
// ============================================================
function checkPF002() {
  const xiaoxueSP = readFileSafe(path.join(SRC_DIR, "lib", "xiaoxue-system-prompt.md"));
  const issues = [];

  // 小雪不应包含临床分析指令
  const clinicalTerms = ["创伤分析", "人格诊断", "防御机制分析", "移情分析"];
  for (const term of clinicalTerms) {
    if (xiaoxueSP.includes(term)) {
      issues.push(`小雪SP包含临床术语: ${term}`);
    }
  }

  // 小雪不应有深度对话/自我探索指令
  if (/深度心理分析|心理治疗|自我探索.*带领/.test(xiaoxueSP)) {
    // 检查是否在禁止段落中
    const prohibitSection = xiaoxueSP.match(/禁止[：:][\s\S]{0,500}/);
    if (prohibitSection) {
      // 在禁止段落中出现是正常的
    } else {
      issues.push("小雪SP可能包含越权临床指令");
    }
  }

  // 检查route.ts中小雪是否有12维思考（不应该有）
  const xiaoxueRoute = readFileSafe(path.join(SRC_DIR, "app", "api", "xiaoxue", "route.ts"));
  if (xiaoxueRoute.includes("12维") || xiaoxueRoute.includes("多维思考") || xiaoxueRoute.includes("primary_lens")) {
    issues.push("小雪route.ts中包含12维思考逻辑（小雪不应有）");
  }

  if (issues.length > 0) {
    addResult("PF002", "FAIL", issues.join("; "), "P0");
  } else {
    addResult("PF002", "PASS", "小酷/小雪角色边界一致");
  }
}

// ============================================================
// PF003: Prompt 中硬编码资源名是否在 registry 中存在
// ============================================================
function checkPF003() {
  // 读取kb-registry提取所有标题
  const registryFile = readFileSafe(path.join(SRC_DIR, "lib", "kb", "kb-registry.ts"));
  const titleMatches = registryFile.match(/title:\s*"([^"]+)"/g) || [];
  const knownTitles = new Set(
    titleMatches.map((m) => m.replace(/title:\s*"/, "").replace(/"$/, "")),
  );

  // 读取测评数据
  const assessmentFile = readFileSafe(path.join(SRC_DIR, "lib", "assessments", "data.ts"));
  const assessmentTitleMatches = assessmentFile.match(/title:\s*["']([^"']+)["']/g) || [];
  for (const m of assessmentTitleMatches) {
    knownTitles.add(m.replace(/title:\s*["']/, "").replace(/["']$/, ""));
  }

  // 扫描SP文件中的文章/工具/测评引用
  const spFiles = [
    path.join(SRC_DIR, "lib", "qm-system-prompt-full.md"),
    path.join(SRC_DIR, "lib", "xiaoxue-system-prompt.md"),
  ];

  const issues = [];
  for (const spFile of spFiles) {
    const content = readFileSafe(spFile);
    if (!content) continue;
    const fileName = path.basename(spFile);

    // 查找"《...》"模式的文章引用
    const articleRefs = content.match(/《[^》]+》/g) || [];
    for (const ref of articleRefs) {
      const title = ref.slice(1, -1);
      // 跳过非文章引用（如书名号中的通用词）
      if (title.length < 4 || title.length > 50) continue;
      // 检查是否在已知标题中（模糊匹配）
      const found = [...knownTitles].some((t) => t.includes(title) || title.includes(t));
      if (!found) {
        // 这可能是误报，只记录不fail
        issues.push(`${fileName}: "${title}" 未在registry中找到（可能是描述性引用）`);
      }
    }
  }

  if (issues.length > 0) {
    addResult("PF003", "WARN", issues.join("; "), "P1");
  } else {
    addResult("PF003", "PASS", "SP中资源引用与registry一致");
  }
}

// ============================================================
// PF004: 硬编码价格/地址/电话扫描
// ============================================================
function checkPF004() {
  // 价格/地址/电话在以下文件中是合法的（公开页面、危机安全、SP等）
  // PF004只检查lib/业务逻辑中不应硬编码联系方式的文件
  const allowedFiles = [
    "therapist-facts.ts",      // 价格数据源
    "xiaoxue-system-prompt.md",
    "qm-system-prompt-full.md",
    "crisis-detection.ts",     // 危机响应包含热线
    "xiaoxue-crisis.ts",       // 小雪危机响应
    "kb-safety.ts",            // KB安全兜底
    "kb/article-bodies.ts",    // 文章正文含热线
    "treehole/merge.ts",       // 树洞合并含危机热线
    "treehole/th-ai-service.ts",
    "treehole/th-safety.ts",
    "booking",                 // 预约页面
    "about-qm", "contact", "faq", "privacy", "terms",
    "knowledge",               // 知识库页面含热线
    "chat-interface", "home-hub", "sidebar",
    "tools/tool-", "treehole/letter",
    "xiaoku-entry", "xiaoxue-ai-panel",
    "treehole/letter/route",
  ];

  const allCodeFiles = readDirRecursive(SRC_DIR, [".ts", ".tsx"]).filter(
    (f) => !f.includes("node_modules") && !f.includes(".next"),
  );

  const issues = [];
  const phonePattern = /1[3-9]\d{9}/g; // 手机号
  const pricePattern = /\d{3,4}[-–至到]\d{3,4}\s*元/g; // 价格区间

  for (const file of allCodeFiles) {
    const relPath = path.relative(SRC_DIR, file);
    // 允许的文件（公开页面、危机安全、数据源）
    if (allowedFiles.some((a) => relPath.includes(a))) continue;

    const content = readFileSafe(file);
    if (!content) continue;

    const phones = content.match(phonePattern) || [];
    const prices = content.match(pricePattern) || [];

    if (phones.length > 0) {
      issues.push(`${relPath}: 包含硬编码手机号 ${[...new Set(phones)].slice(0, 2).join(", ")}`);
    }
    if (prices.length > 0) {
      issues.push(`${relPath}: 包含硬编码价格 ${[...new Set(prices)].slice(0, 2).join(", ")}`);
    }
  }

  if (issues.length > 0) {
    addResult("PF004", "FAIL", issues.join("; "), "P1");
  } else {
    addResult("PF004", "PASS", "无非授权文件硬编码价格/电话");
  }
}

// ============================================================
// PF008: 危机路径检查
// ============================================================
function checkPF008() {
  const chatRoute = readFileSafe(path.join(SRC_DIR, "app", "api", "chat", "route.ts"));
  const xiaoxueRoute = readFileSafe(path.join(SRC_DIR, "app", "api", "xiaoxue", "route.ts"));
  const issues = [];

  // 危机检测必须在资源检索之前
  for (const [name, content] of [["chat/route.ts", chatRoute], ["xiaoxue/route.ts", xiaoxueRoute]]) {
    const crisisPos = content.indexOf("detectCrisis");
    const retrievalPos = content.indexOf("retrieveResources");

    if (crisisPos === -1) {
      issues.push(`${name}: 未找到危机检测`);
    } else if (retrievalPos !== -1 && crisisPos > retrievalPos) {
      issues.push(`${name}: 危机检测在资源检索之后（应在之前短路）`);
    }

    // 危机路径不应包含资源推荐
    if (content.includes("isCrisis") && content.includes("retrieveResources")) {
      // 检查是否有if保护
      const crisisBlock = content.match(/if\s*\([^)]*isCrisis[^)]*\)\s*\{[\s\S]{0,500}?\}/);
      if (crisisBlock) {
        const block = crisisBlock[0];
        if (block.includes("retrieveResources") || block.includes("recommend")) {
          issues.push(`${name}: 危机分支中可能调用了资源推荐`);
        }
      }
    }
  }

  if (issues.length > 0) {
    addResult("PF008", "FAIL", issues.join("; "), "P0");
  } else {
    addResult("PF008", "PASS", "危机路径完整，危机在检索前短路");
  }
}

// ============================================================
// PF012: 旧版本残留扫描
// ============================================================
function checkPF012() {
  // 只检查 API route 文件中的旧版本残留
  const routeFiles = readDirRecursive(path.join(SRC_DIR, "app", "api"), [".ts", ".tsx"]);
  const issues = [];

  const routePatterns = [
    { pattern: /preselectCandidates/g, description: "旧函数 preselectCandidates 在route中引用（v10.4已移除）" },
    { pattern: /intentHint/g, description: "旧 intentHint 分支逻辑在route中引用（v11.0已统一）" },
    { pattern: /v7\.\d+\.\d+/g, description: "旧版本号 v7.x" },
    { pattern: /v9\.\d+\.\d+/g, description: "旧版本号 v9.x" },
    { pattern: /v10\.\d+\.\d+/g, description: "旧版本号 v10.x" },
  ];

  for (const file of routeFiles) {
    const relPath = path.relative(SRC_DIR, file);
    const rawContent = readFileSafe(file);
    if (!rawContent) continue;
    // 排除注释行，避免注释中提到旧函数名导致误报
    const content = rawContent.split("\n").filter((l) => !l.trim().startsWith("//") && !l.trim().startsWith("*")).join("\n");

    for (const { pattern, description } of routePatterns) {
      pattern.lastIndex = 0;
      if (pattern.test(content)) {
        // 排除大写V的BUILD_ID
        if (description.includes("v7.") || description.includes("v9.") || description.includes("v10.")) {
          const lines = content.split("\n");
          for (const line of lines) {
            if (pattern.test(line) && !line.includes("V7.") && !line.includes("V9.") && !line.includes("V10.")) {
              pattern.lastIndex = 0;
              issues.push(`${relPath}: ${description} → ${line.trim().slice(0, 80)}`);
            }
            pattern.lastIndex = 0;
          }
        } else {
          issues.push(`${relPath}: ${description}`);
        }
      }
    }
  }

  // 检查全项目中的旧BUILD_ID格式（只检查版本号引用，不检查定义）
  const versionFile = readFileSafe(path.join(SRC_DIR, "lib", "qm-version.ts"));
  if (/V8\.0\.0/.test(versionFile)) {
    issues.push("qm-version.ts: 仍包含旧版本号 V8.0.0（应已升级为 V8.5.0）");
  }
  if (/V11\.0\.0/.test(versionFile)) {
    issues.push("qm-version.ts: 仍包含旧版本号 V11.0.0（应已升级为 V11.5.0）");
  }

  if (issues.length > 0) {
    addResult("PF012", "FAIL", issues.join("; "), "P1");
  } else {
    addResult("PF012", "PASS", "API routes中无旧版本残留");
  }
}

// ============================================================
// PF013: 内部信息泄漏探针（只检查非SP文件）
// ============================================================
function checkPF013() {
  const allFiles = readDirRecursive(SRC_DIR, [".ts", ".tsx", ".js", ".mjs"]);
  const issues = [];

  for (const file of allFiles) {
    const relPath = path.relative(SRC_DIR, file);
    // SP文件中出现是正常的
    if (relPath.includes("qm-system-prompt") || relPath.includes("xiaoxue-system-prompt")) continue;
    // internal-firewall.ts 中包含这些模式是正常的
    if (relPath.includes("internal-firewall.ts")) continue;
    // runtime-verifier.ts 引用BLOCK_PATTERNS是正常的
    if (relPath.includes("runtime-verifier.ts")) continue;
    // kb-retrieval.ts 中source_registry是字段定义
    if (relPath.includes("kb-retrieval.ts")) continue;
    // therapist-facts.ts 是服务端事实数据源
    if (relPath.includes("therapist-facts.ts")) continue;
    // qm-version.ts 包含SP路径引用是正常的
    if (relPath.includes("qm-version.ts")) continue;
    // 自身文件
    if (relPath.includes("preflight-scan") || relPath.includes("regression-test")) continue;
    if (relPath.includes("node_modules")) continue;

    const content = readFileSafe(file);
    if (!content) continue;

    // CASE编号检测（代码中不应硬编码CASE编号）
    const caseMatches = content.match(/CASE[_-]\d+/g);
    if (caseMatches && caseMatches.length > 0) {
      // 排除注释中的引用
      const nonCommentLines = content.split("\n").filter((l) => !l.trim().startsWith("//") && !l.trim().startsWith("*"));
      const codeContent = nonCommentLines.join("\n");
      if (/CASE[_-]\d+/g.test(codeContent)) {
        issues.push(`${relPath}: 检测到CASE编号引用`);
      }
    }

    // source_registry内部字段（不应在客户端组件中出现）
    if (relPath.includes("components") || relPath.includes("app/") && !relPath.includes("api/")) {
      if (/source_registry/.test(content)) {
        issues.push(`${relPath}: 客户端文件包含source_registry内部字段`);
      }
    }
  }

  if (issues.length > 0) {
    addResult("PF013", "FAIL", issues.join("; "), "P0");
  } else {
    addResult("PF013", "PASS", "非SP文件无内部信息泄漏");
  }
}

// ============================================================
// PF014: 非能力声称检查
// ============================================================
function checkPF014() {
  const spFiles = [
    path.join(SRC_DIR, "lib", "qm-system-prompt-full.md"),
    path.join(SRC_DIR, "lib", "xiaoxue-system-prompt.md"),
  ];

  const issues = [];
  const falseCapabilityPatterns = [
    /我可以读取你的跨设备/,
    /我已保存到云端/,
    /我能同步你的数据/,
    /我已为你预约成功/,
    /我已经帮你付款/,
    /我能看到你在其他设备/,
  ];

  for (const spFile of spFiles) {
    const content = readFileSafe(spFile);
    if (!content) continue;
    const fileName = path.basename(spFile);

    for (const pattern of falseCapabilityPatterns) {
      if (pattern.test(content)) {
        // 检查是否在禁止段落中
        const context = content.match(
          new RegExp(`.{0,50}${pattern.source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}.{0,50}`),
        );
        if (context && /禁止|不得|不能|不要/.test(context[0])) {
          // 在禁止语境中出现是正常的
          continue;
        }
        issues.push(`${fileName}: 可能存在非能力声称: ${pattern.source}`);
      }
    }
  }

  if (issues.length > 0) {
    addResult("PF014", "FAIL", issues.join("; "), "P0");
  } else {
    addResult("PF014", "PASS", "无非能力声称");
  }
}

// ============================================================
// 主流程
// ============================================================
function main() {
  console.log(colors.bold("\n" + "=".repeat(60)));
  console.log(colors.bold("  QM AI v11.5 部署前静态扫描 (Preflight Scan)"));
  console.log(colors.bold("=".repeat(60)) + "\n");

  checkPF001();
  checkPF002();
  checkPF003();
  checkPF004();
  checkPF008();
  checkPF012();
  checkPF013();
  checkPF014();

  // 输出结果
  let p0FailCount = 0;
  let p1FailCount = 0;
  let passCount = 0;
  let warnCount = 0;

  for (const r of results) {
    let icon, colorFn;
    if (r.status === "PASS") {
      icon = "[OK]";
      colorFn = colors.green;
      passCount++;
    } else if (r.status === "WARN") {
      icon = "!";
      colorFn = colors.yellow;
      warnCount++;
    } else {
      icon = "[FAIL]";
      colorFn = colors.red;
      if (r.severity === "P0") p0FailCount++;
      else p1FailCount++;
    }
    console.log(`  ${colorFn(icon)} [${r.checkId}] ${r.message}`);
  }

  console.log("\n" + "-".repeat(60));
  console.log(
    `  结果: ${colors.green(passCount + " PASS")}  ${colors.yellow(warnCount + " WARN")}  ${colors.red(p0FailCount + " P0-FAIL")}  ${colors.red(p1FailCount + " P1-FAIL")}`,
  );
  console.log("-".repeat(60));

  if (p0FailCount > 0) {
    console.log(colors.red("\n  [X] P0 检查失败，禁止发布！\n"));
    process.exit(1);
  } else if (p1FailCount > 0) {
    console.log(colors.yellow("\n  ! P1 检查失败，建议修复后发布。\n"));
    process.exit(0); // P1不阻断，但警告
  } else {
    console.log(colors.green("\n  [PASS] 所有P0/P1检查通过，可以发布。\n"));
    process.exit(0);
  }
}

main();
