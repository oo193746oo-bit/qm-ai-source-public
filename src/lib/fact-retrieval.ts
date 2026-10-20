/**
 * 事实检索模块（fact-retrieval）
 * 批次 F1：法律/费用/机构/政策类问题的可溯源事实检索
 * 
 * 架构优先级：危机检测 > 行政路由 > 事实检索 > 知识库检索 > 自由对话
 */

import fs from "fs";
import path from "path";

// 事实包类型定义
interface FactPack {
  pack_meta: {
    pack_id: string;
    version: string;
    facts_total: number;
  };
  sources: Array<{
    source_id: string;
    level: string;
    name: string;
    url?: string;
  }>;
  facts: Array<{
    fact_id: string;
    topic: string;
    type: string;
    region: string;
    claim: string;
    key_points: string[];
    answer_hint?: string;
    source_ids: string[];
    retrieval_hooks: string[];
    verification_status?: string;
  }>;
  fallback_policy?: {
    domain_gate_terms?: string[];
    fallback_message?: string;
  };
}

// 检索结果
interface FactRetrievalResult {
  hit: boolean;
  facts: Array<{
    fact_id: string;
    claim: string;
    key_points: string[];
    source_names: string[];
    score: number;
  }>;
  fallback_message?: string;
  domain_blocked?: boolean;
}

// 领域闸门词（法律/费用/机构/政策）
const DOMAIN_GATE_TERMS = [
  "意定监护", "监护", "公证", "遗嘱", "继承", "医疗签字", "监护人",
  "离婚", "冷静期", "抚养", "赡养", "收养",
  "法律", "法条", "民法典", "刑法",
  "费用", "收费", "多少钱", "价格",
  "怎么办", "流程", "材料", "条件",
  "公证处", "民政局", "法院", "律师事务所",
];

// 加载事实包（fail-closed：加载失败返回空包）
let factPack: FactPack | null = null;
let factPackLoadError: string | null = null;

function loadFactPack(): FactPack | null {
  if (factPack) return factPack;
  
  try {
    const packPath = path.join(process.cwd(), "src/lib/fact-packs/fact_pack_ydh_shanghai_min_v1.0.json");
    const content = fs.readFileSync(packPath, "utf-8");
    factPack = JSON.parse(content) as FactPack;
    console.info("[fact-retrieval] Fact pack loaded", {
      pack_id: factPack.pack_meta.pack_id,
      facts_total: factPack.pack_meta.facts_total,
    });
    return factPack;
  } catch (error) {
    factPackLoadError = String(error);
    console.error("[fact-retrieval] Failed to load fact pack (fail-closed):", error);
    return null;
  }
}

// 领域闸门检测
function isDomainRelevant(userText: string): boolean {
  const lowerText = userText.toLowerCase();
  return DOMAIN_GATE_TERMS.some(term => lowerText.includes(term));
}

// BM25 简化打分（词项重叠）
function computeScore(userText: string, fact: { topic: string; retrieval_hooks: string[]; claim: string; key_points: string[] }): number {
  const lowerText = userText.toLowerCase();
  let score = 0;
  
  // Topic 匹配（最高优先级）- 如果 topic 包含用户查询的核心关键词，大幅加分
  const topicLower = fact.topic.toLowerCase();
  
  // 同义词映射：费用相关
  const feeSynonyms = ["收费", "费用", "多少钱", "价格", "公证费"];
  const hasFeeQuery = feeSynonyms.some(s => lowerText.includes(s));
  const hasFeeTopic = feeSynonyms.some(s => topicLower.includes(s));
  if (hasFeeQuery && hasFeeTopic) {
    score += 10; // 费用查询 + 费用主题 = 大幅加分
  }
  
  // 其他 topic 关键词
  const topicKeywords = ["办理", "流程", "材料", "条件", "生效", "风险", "定义", "效力"];
  for (const keyword of topicKeywords) {
    if (lowerText.includes(keyword) && topicLower.includes(keyword)) {
      score += 5;
    }
  }
  
  // 检索钩子匹配（高权重）- 改为分词匹配
  for (const hook of fact.retrieval_hooks) {
    const hookLower = hook.toLowerCase();
    // 完全匹配（最高优先级）
    if (lowerText.includes(hookLower) || hookLower.includes(lowerText)) {
      score += 5;
    } else {
      // 分词匹配：hook 中的关键词在用户查询中出现
      const hookWords = hookLower.split(/[\s,，、]+/).filter(w => w.length >= 2);
      let matchCount = 0;
      for (const word of hookWords) {
        if (lowerText.includes(word)) {
          matchCount++;
        }
      }
      if (hookWords.length > 0 && matchCount >= Math.ceil(hookWords.length * 0.6)) {
        score += 3;
      }
    }
  }
  
  // 事实陈述关键词匹配（中权重）- 改为按字符匹配
  const claimLower = fact.claim.toLowerCase();
  const claimKeywords = ["意定监护", "公证", "费用", "收费", "多少钱", "价格", "3000", "30000", "12348", "15个工作日", "15 个工作日"];
  for (const keyword of claimKeywords) {
    if (lowerText.includes(keyword.toLowerCase()) && claimLower.includes(keyword.toLowerCase())) {
      score += 2;
    }
  }
  
  // 要点关键词匹配（低权重）
  for (const point of fact.key_points) {
    const pointLower = point.toLowerCase();
    const pointKeywords = ["意定监护", "公证", "费用", "收费", "多少钱", "价格", "3000", "30000", "12348", "15个工作日", "15 个工作日", "材料", "流程", "条件"];
    for (const keyword of pointKeywords) {
      if (lowerText.includes(keyword.toLowerCase()) && pointLower.includes(keyword.toLowerCase())) {
        score += 1;
      }
    }
  }
  
  return score;
}

// 主检索函数
export function retrieveFacts(userText: string): FactRetrievalResult {
  const pack = loadFactPack();
  
  // fail-closed：包加载失败，返回兜底
  if (!pack) {
    return {
      hit: false,
      facts: [],
      fallback_message: "这部分我手头没有核实过的确定信息，不想凭印象说错（尤其涉及法律和费用）。你可以：①拨打 12348 公共法律服务热线免费咨询；②上海的意定监护公证可在'一网通办'查办事指南，或直接问就近公证处；③复杂情况（涉外、大额财产、监护争议）建议咨询执业律师或公证员。",
      domain_blocked: false,
    };
  }
  
  // 领域闸门：不相关直接阻断
  if (!isDomainRelevant(userText)) {
    return {
      hit: false,
      facts: [],
      domain_blocked: true,
    };
  }
  
  // 过滤掉 BLOCK 状态的条目
  const candidateFacts = pack.facts.filter(f => f.verification_status !== "BLOCK");
  
  // 打分并排序
  const scored = candidateFacts.map(fact => ({
    fact,
    score: computeScore(userText, fact),
  }));
  
  scored.sort((a, b) => b.score - a.score);
  
  // 取 top3
  const top3 = scored.slice(0, 3);
  
  // 调试日志：打印打分情况
  console.info("[fact-retrieval] Scoring result", {
    user_text: userText.slice(0, 50),
    top3_scores: top3.map(item => ({
      fact_id: item.fact.fact_id,
      topic: item.fact.topic,
      score: item.score,
    })),
  });
  
  // 命中阈值：top1 分数 >= 2 才 HIT（降低阈值，提高召回率）
  const HIT_THRESHOLD = 2;
  if (top3.length === 0 || top3[0].score < HIT_THRESHOLD) {
    console.info("[fact-retrieval] MISS - score below threshold", {
      user_text: userText.slice(0, 50),
      top_score: top3[0]?.score || 0,
      threshold: HIT_THRESHOLD,
    });
    return {
      hit: false,
      facts: [],
      fallback_message: "这部分我手头没有核实过的确定信息，不想凭印象说错（尤其涉及法律和费用）。你可以：①拨打 12348 公共法律服务热线免费咨询；②上海的意定监护公证可在'一网通办'查办事指南，或直接问就近公证处；③复杂情况（涉外、大额财产、监护争议）建议咨询执业律师或公证员。",
      domain_blocked: false,
    };
  }
  
  // HIT：构建结果
  const hitFacts = top3.filter(item => item.score >= HIT_THRESHOLD).map(item => {
    const sourceNames = item.fact.source_ids
      .map(sid => pack.sources.find(s => s.source_id === sid)?.name)
      .filter((name): name is string => Boolean(name));
    
    return {
      fact_id: item.fact.fact_id,
      claim: item.fact.claim,
      key_points: item.fact.key_points,
      source_names: sourceNames,
      score: item.score,
    };
  });
  
  console.info("[fact-retrieval] HIT", {
    user_text: userText.slice(0, 50),
    fact_ids: hitFacts.map(f => f.fact_id),
    scores: hitFacts.map(f => f.score),
  });
  
  return {
    hit: true,
    facts: hitFacts,
  };
}

// 格式化事实上下文（注入 system prompt）
export function formatFactsForPrompt(result: FactRetrievalResult): string {
  if (!result.hit || result.facts.length === 0) {
    return "";
  }
  
  const lines = [
    "<verified_legal_facts>",
    "以下是已核验的法律/政策/资源事实，回答相关问题时必须以这些事实为准，不得添加事实之外的数字/机构/政策断言；事实之外的内容明确说明需要核实。",
    "",
  ];
  
  for (const fact of result.facts) {
    lines.push(`【${fact.fact_id}】${fact.claim}`);
    if (fact.key_points.length > 0) {
      lines.push("要点：");
      for (const point of fact.key_points) {
        lines.push(`  - ${point}`);
      }
    }
    if (fact.source_names.length > 0) {
      lines.push(`来源：${fact.source_names.join("、")}`);
    }
    lines.push("");
  }
  
  lines.push("</verified_legal_facts>");
  
  return lines.join("\n");
}

// 获取兜底话术
export function getFactFallbackMessage(): string {
  return "这部分我手头没有核实过的确定信息，不想凭印象说错（尤其涉及法律和费用）。你可以：①拨打 12348 公共法律服务热线免费咨询；②上海的意定监护公证可在'一网通办'查办事指南，或直接问就近公证处；③复杂情况（涉外、大额财产、监护争议）建议咨询执业律师或公证员。";
}
