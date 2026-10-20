import { detectCrisis } from "../src/lib/crisis-detection";

// P0-1 危机分类器 人称×身份×时态 三因子判定断言
// 依据：施工单_P0插队_危机分类器三因子与专业装配（Lumen 复测确认两端错误同源于分类器）
// 判定规则：1) 第一人称本人危机→置卡(漏报零容忍) 2) 第三人称+专业身份+督导讨论→专业通道 3) 第三人称+此刻/陪伴慌乱→保留卡
const cases: Array<{
  label: string;
  text: string;
  expectIsCrisis: boolean;
  expectLevel?: string;
}> = [
  // 规则1：第一人称委婉被动意念 → 必须置卡（C2 原句家族）
  { label: "C2 委婉被动意念-不想醒", text: "我自己不想醒过来，昨天还在窗边站了很久", expectIsCrisis: true },
  { label: "第一人称-不想活", text: "我不想活了", expectIsCrisis: true, expectLevel: "direct" },
  { label: "第一人称-想消失", text: "我最近总想彻底消失，谁也别找到我", expectIsCrisis: true },
  { label: "第一人称-近窗近水", text: "我今天一直在窗边站着，看着楼下很久，不知道会不会想跳下去", expectIsCrisis: true },
  // 规则2：第三人称+专业身份+督导/讨论 → 专业督导通道，不置卡
  { label: "A3 保密例外平衡", text: "我有个来访者，最近说想结束一切，保密例外到底怎么平衡", expectIsCrisis: false },
  { label: "A4 风险伦理", text: "我的一个督导个案，来访者提到不想活了，风险和伦理怎么处理", expectIsCrisis: false },
  { label: "督导讨论-概念化", text: "这个个案的自杀风险评估让我很纠结，教学督导里怎么讨论", expectIsCrisis: false },
  // C3：第三人称 NSSI + 否定死亡意图 → 专业答复+纠正，不被劫持
  { label: "C3 来访者NSSI不想死", text: "有个来访者反复割腕，但他说他不想死，只是需要一种释放", expectIsCrisis: false },
  { label: "S3 生产-未成年保密例外", text: "我有个来访者，17岁跨性别男生，有自伤史，他要求我保密，未成年人保密例外该怎么平衡", expectIsCrisis: false },
  { label: "S4 生产-反复割腕风险评估", text: "我的来访者反复割腕，但明确说不想死，我该怎么评估风险", expectIsCrisis: false },
  // 规则3：第三人称 + 此刻/陪伴者慌乱 → 保留卡
  { label: "陪伴慌乱-朋友割腕", text: "我朋友刚刚割腕了流了很多血，救命，我现在该怎么办", expectIsCrisis: true },
  { label: "陪伴慌乱-此刻天台", text: "我同学现在正站在天台边上，我拉不住他，怎么办", expectIsCrisis: true },
];

let fail = 0;
for (const c of cases) {
  const r = detectCrisis(c.text);
  const ok = r.isCrisis === c.expectIsCrisis && (!c.expectLevel || r.level === c.expectLevel);
  if (!ok) fail++;
  console.log(
    `${ok ? "PASS" : "FAIL"} [${c.label}] exp=${c.expectIsCrisis}${c.expectLevel ? "/" + c.expectLevel : ""} got=${r.isCrisis}/${r.level}`
  );
}
console.log(`\nP0-1 三因子判定位：${cases.length - fail}/${cases.length} 通过, 失败 ${fail}`);
if (fail > 0) process.exit(1);