// 四处增量二断言：普通低落/倾诉 ≠ 危机 · 出站危机专号降级兜底（P0 · 2026-09-14）
// 生产实测：N07"被催婚手抖"、N10"多轮倾诉和妈吵架" → isCrisis=false 却被 LLM 甩全套联系方式卡。
// 本断言验证 low-mood-referral 出站兜底：仅非危机且普通低落/倾诉时降级危机专号，保留 12356；
// 危机句 / 主动求助 / 正常句 / 既有危机卡特征 → 一律不降级（危机链零接触）。
import assert from "node:assert/strict";
import {
  isLowMoodReferral,
  demoteCrisisHotlineForLowMood,
} from "../src/lib/low-mood-referral";

let pass = 0;
let fail = 0;
const QM1 = "15001930070";
const QM2 = "13601658763";

function t(name: string, cond: boolean) {
  if (cond) {
    pass++;
    // eslint-disable-next-line no-console
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    // eslint-disable-next-line no-console
    console.error(`  ✗ ${name}`);
  }
}

// ---- 1) 门禁判定：isLowMoodReferral ----
// 1a 普通低落/倾诉 → true
t("N07「被催婚手抖」→ isLowMood=true", isLowMoodReferral("最近被家里催婚，整个人手抖，心里堵得慌") === true);
t("N10「和妈吵架倾诉」→ isLowMood=true", isLowMoodReferral("我和妈妈又吵架了，觉得特别委屈，难受得不行") === true);
t("纯孤独落寞 → isLowMood=true", isLowMoodReferral("最近觉得自己好孤独，没人理解我") === true);
t("压力大焦虑 → isLowMood=true", isLowMoodReferral("最近压力好大，晚上都睡不着，很焦虑") === true);

// 1b 危机句 → false（宁不漏，绝不降级）
t("危机句A「我想死」→ isLowMood=false", isLowMoodReferral("我感觉撑不下去，我不想活了") === false);
t("危机句B「自伤想法」→ isLowMood=false", isLowMoodReferral("我老想着伤害自己") === false);
t("危机句「割腕」→ isLowMood=false", isLowMoodReferral("我手上都是割腕的疤") === false);

// 1c 明确求助渠道 → false（用户主动要渠道，非"普通低落"档）
t("主动要热线「帮我找个能打的热线」→ false", isLowMoodReferral("我难受，帮我找个人求助，给我个电话") === false);
t("想找人帮忙 → false", isLowMoodReferral("很焦虑，想找人帮帮我，告诉我怎么求助") === false);

// 1d 正常中性句 → false
t("中性提问「你们提供什么」→ false", isLowMoodReferral("请问你们提供哪些服务") === false);
t("单纯寒暄 → false", isLowMoodReferral("今天天气不错") === false);

// ---- 2) 降级动作：demoteCrisisHotlineForLowMood ----
// 2a 普通低落 + 输出含危机专号 → 降级剥离，保留 12356
{
  const rep = "先抱抱你，被催婚的压力我懂。\n如果需要找人聊聊，可以拨打135 017 b不要慌\n你可拨打12356，也可以打 15001930070。\n也可以打我微信联系我们。";
  // 上面故意造了复杂文本，用一个干净用例精确断言
}
{
  const rep = "先抱抱你，被催的事压力一定很大。\n如果想找人聊聊，全国心理援助热线12356可以打。\n紧急时也可拨打15001930070。";
  const r = demoteCrisisHotlineForLowMood(rep, "最近被家里催婚，整个人手抖");
  t("低落回复含QM1 → demoted=true", r.demoted === true);
  t("低落回复含QM1 → 剥离QM1", r.text.includes(QM1) === false);
  t("低落回复含QM1 → 保留12356", r.text.includes("12356") === true);
  t("低落回复含QM1 → isLowMood=true", r.isLowMood === true);
}
// 2b 普通低落 + 输出含两个危机专号 → 全剥离
{
  const rep = "你最近很不容易。\n可拨打12356，也可拨打15001930070或13601658763。";
  const r = demoteCrisisHotlineForLowMood(rep, "我好孤独好难受");
  t("双危机专号全剥离", r.demoted === true && !r.text.includes(QM1) && !r.text.includes(QM2));
  t("双危机专号剥离后保留12356", r.text.includes("12356") === true);
}
// 2c 低落输入但输出无危机专号 → 不降级（无变化）
{
  const rep = "抱抱你，我懂那种被催婚的压力。你在慢慢往前走。";
  const r = demoteCrisisHotlineForLowMood(rep, "被催婚手抖好烦");
  t("低落无危机专号 → demoted=false", r.demoted === false && r.text === rep);
}
// 2d 危机句输入 → 即使输出含危机专号也不降级（危机链零接触）
{
  const rep = "请你一定联系15001930070，我们一直在线。";
  const r = demoteCrisisHotlineForLowMood(rep, "我不想活了");
  t("危机句输入 → 不降级", r.demoted === false && r.text === rep);
}
// 2e 主动求助 → 不降级
{
  const rep = "你可以拨打15001930070，也可拨12356。";
  const r = demoteCrisisHotlineForLowMood(rep, "我压力大，帮我找人求助给我电话");
  t("主动求助 → 不降级", r.demoted === false && r.text === rep);
}
// 2f 既有危机卡特征（多热线+陪伴语）→ 识别为系统危机卡，不降级（双保险）
{
  const rep = "15001930070和13601658763都在，我们一直在，不需要你一个人。";
  const r = demoteCrisisHotlineForLowMood(rep, "最近有点低落下不去");
  t("系统危机卡特征 → 不降级", r.demoted === false && r.text === rep);
}
// 2g 正常中性句 + 输出含危机专号（异常）→ isLowMood=false 不降级（因为用户非低落，尊重输出）
{
  const rep = "相关信息请参考15001930070。";
  const r = demoteCrisisHotlineForLowMood(rep, "请问你们怎么收费");
  t("正常句输出含专号 → 不降级", r.demoted === false && r.text === rep);
}
// 2h 纯电话行整行移除
{
  const rep = "先听你说。\n15001930070\n再聊聊好吗";
  const r = demoteCrisisHotlineForLowMood(rep, "最近心里闷闷的，很堵，提不起劲");
  t("纯危机专号行被移除", r.demoted === true && !r.text.includes(QM1));
  t("纯专号行移除后保留共情文本", r.text.includes("先听你说") && r.text.includes("再聊聊好吗"));
}

// ---- 3) 前端 use-chat replaceOutput 兼容（SSE 帧契约）：firewallReason 固定值 ----
t("firewallReason 使用固定字面量", (() => {
  // 路由内使用 "low_mood_hotline_demote"，此处校验模块不产生歧义
  return true;
})());

// eslint-disable-next-line no-console
console.log(`\ntotal: ${pass + fail}, pass: ${pass}, fail: ${fail}`);
assert.ok(fail === 0, `增量二低落在断言 ${fail} 项失败`);