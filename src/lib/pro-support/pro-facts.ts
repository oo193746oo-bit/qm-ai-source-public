// SP-ACAD-PRO-L2 专业事实校正（ITQ 正名 / DBT 版本）——确定性本地规则，零 LLM。
// 依据 assets/补充依据_REGION_LANGUAGE路由_20260913.md（VR-05）、ACAD-TRM-01 卷宗（ITQ 正名 + VR-04）。

export interface FactCorrection {
  active: boolean;
  blocks: string[];
}

const ITQ_BLOCK =
  "【专业事实校正·ITQ 正名（ACAD-TRM-01 / VR-04）】ITQ 全称 International Trauma Questionnaire（WHO/ICD-11 创伤评估工具），" +
  "绝非 Identity Trauma Questionnaire，也不得写成「性少数身份创伤问卷」。ITQ 无全球统一诊断 cutoff，" +
  "不给出「总分 ≥ 多少即确诊」，仅按 ICD-11 症状标准作定位提示；成人 ITQ 与儿童版 ITQ-CA 按年龄区分，不可混用。" +
  "凡涉受保护量表全文/诊断结论一律 HOLD，只给结构与来源。";

const DBT_BLOCK =
  "【专业事实校正·DBT 版本（VR-05）】被问及 DBT 版本时：当前默认 2025 修订第三版（ACAD-CBT-04），" +
  "不得回答「尚无第三版」「尚未发布修订」或把旧版当现行版；按 2025 第三版口径描述。" +
  "凡涉证据/母文档全文互不迁移，只给定位提示与来源。";

export function applyFactCorrections(text: string): FactCorrection {
  const blocks: string[] = [];
  // ITQ 正名：命中缩写或全称（创伤问卷语境）即强制正名，防模型幻觉成 Identity Trauma Questionnaire。
  if (/\bITQ\b/i.test(text) || /International Trauma Questionnaire/i.test(text)) {
    // ITQ 独立出现即校正；ITQ-CA 亦属 ITQ 族，同样校正。
    blocks.push(ITQ_BLOCK);
  }
  // DBT 版本：命中 DBT 且同时出现版本类词，才注入版本路由（避免普通 DBT 提及被过度唤醒）。
  const dbtVersion =
    /\bDBT\b/i.test(text) &&
    /版本|第[一二三四五12345]版|2015|2025|修订|manual|outline/i.test(text);
  if (dbtVersion) {
    blocks.push(DBT_BLOCK);
  }
  return { active: blocks.length > 0, blocks };
}