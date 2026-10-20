// REGION_LANGUAGE 路由（L2 补充，VR-01/VR-07，来源：补充依据_20260913.md）
// 只接规则 1+2，不展开全地区矩阵；判定发生在回答生成前；不影响安全链。

const VR01_TRIGGERS = [
  /(中国大陆|大陆|内地|香港|台湾|HK|TW|Taiwan|China|Chinese)\s*(版本|量表|评估|工具|问卷)/i,
  /版本\s*(中国大陆|大陆|香港|台湾|香港版|台湾版|内地版)/i,
  /(香港版|台湾版|大陆版|内地版|华语版本)/i,
];

const VR07_TRIGGERS = [
  /(SOC8|WPATH)/i,
  /(英文原文|英文版|Mandarin|翻译|译文|中文版|中文译本)/i,
];

export interface RegionClassify {
  active: boolean;
  ruleId: "VR-01" | "VR-07" | null;
  block: string;
}

function fallback(s: string): boolean {
  return typeof s === "string" && s.trim().length > 0;
}

export function classifyRegion(query: string): RegionClassify {
  if (!fallback(query)) return { active: false, ruleId: null, block: "" };

  const hasVr1 = VR01_TRIGGERS.some((re) => re.test(query));
  const hasVr7 = VR07_TRIGGERS.some((re) => re.test(query));

  if (hasVr1) {
    return {
      active: true,
      ruleId: "VR-01",
      block:
        "【地区/语言路由·VR-01】同一量表/工具的" +
        "中国大陆、香港、台湾中文版本互不相同，不得视为 same_as；" +
        "请按用户所指地区路由到对应版本的描述。",
    };
  }
  if (hasVr7) {
    return {
      active: true,
      ruleId: "VR-07",
      block:
        "【地区/语言路由·VR-07】官方页面可存在 Mandarin 翻译，但中文译文 ≠ 英文 version-of-record；" +
        "精确 statement、争议措辞、版本冲突必须回到英文原文；中文译本也不等同中国大陆临床规范。",
    };
  }
  return { active: false, ruleId: null, block: "" };
}