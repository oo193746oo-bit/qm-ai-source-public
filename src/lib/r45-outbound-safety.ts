import { stripInternalTraces } from "@/lib/internal-trace-filter";

// R45 意定监护专线出站确定性安全（RC1-R2，P0/P1/P2）。
// 仅处理纯字符串判定，无 next 依赖，可直接单测。

// 标准高危卡（四行齐，工程确定性写死，出站完整性检查用于替换）
export const R45_CRISIS_FULL_CARD =
  "小酷听到你说这些，非常担心你的安全。请你现在立刻拨打心理援助热线：\n📞 12356（全国心理援助热线，7×24 小时）\n📞 15001930070（QM 24 小时危机热线）\n📞 12355（青少年心理服务热线）\n📞 13601658763（QM 备用热线，24 小时）\n如当下有立即危险，请同时拨打 110/120。";

// 低危轻提示统一号（QM 线），用于非 high 响应号码纠正
export const R45_LOW_LINE = "如果想说说话，QM 24小时支持热线 15001930070 随时在。";

// RC1 低危呈现：共情 + 一句轻提示（15001930070）+ 继续对话，不弹完整四行卡、不追问安全
export const R45_CRISIS_LOW =
  "最近这些日子听起来确实不容易，辛苦了。\n\n如果想说说话，QM 24 小时支持热线 15001930070 随时都在。\n\n想聊聊的话，我一直在这里陪着你，你愿意多说说最近怎么样吗？";

// 出站清洗：剥离内部痕迹 + 号码白名单收紧（防禁号/未知渠道泄漏）
// RC1-R2 出站确定性：inWindow（会话窗口内）/ 业务混合 → 替换标准高危卡；低危号码统一为 QM 线
export function sanitizeR45Reply(
  text: string,
  opts?: { inWindow: boolean },
): { cleaned: string; changed: boolean } {
  const inWindow = opts?.inWindow === true;
  let output = stripInternalTraces(text);
  // 连接符号码（400-161-9995 等带 - / — 的杂热线）非 QMS 四行，一律清除
  output = output.replace(/\d{3,4}[-—−]\d{3,4}([-—−]\d{3,4})?/g, "");
  // 连续数字 5-11 位：仅白名单（QMS/主站热线）保留，其余（962525 等 6 位、以及任何非白名单 11 位）剔除
  output = output.replace(/(\d{5,11})/g, (m) => {
    const digits = m.replace(/\D/g, "");
    if (
      digits.startsWith("12356") ||
      digits.startsWith("15001930070") ||
      digits.startsWith("12355") ||
      digits.startsWith("13601658763")
    ) {
      return m;
    }
    return "";
  });
  // RC1-R2 修点2：危机+业务混合——响应同时含批准热线与办理业务特征（办理|流程|公证|费用|材料|手续 × 监护|遗产 共现）
  const hasAnyApprovedPhone = /12356|15001930070|12355|13601658763|110/.test(output);
  const bizFeature = /(办理|流程|公证|费用|材料|手续)/.test(output);
  const bizDomain = /(监护|遗[嘱产])/.test(output);
  const isBizMixed = hasAnyApprovedPhone && bizFeature && bizDomain;
  // RC1-R2 修点1：会话窗口内（已判 high 后 5 轮/30 分钟内）出站响应必须含批准热线，否则整段提级为标准高危卡
  const windowMissingPhone = inWindow && !hasAnyApprovedPhone;
  if (isBizMixed || windowMissingPhone) {
    output = R45_CRISIS_FULL_CARD;
  } else {
    // RC1 确定性兜底：放行的低危回复被模型自判弹了完整四行卡（12356+12355+110 同现）→ 整段替换为低危轻提示
    if (
      output.includes("12356") &&
      output.includes("12355") &&
      output.includes("110")
    ) {
      output = R45_CRISIS_LOW;
    } else if (
      // RC1-R2 修点3：低危号码统一——含 12356 但不含 QM 15001930070 且非完整卡 → 12256 归一为 QM 线
      output.includes("12356") &&
      !output.includes("15001930070")
    ) {
      output = output.replace(/12356/g, "15001930070");
      if (!output.includes(R45_LOW_LINE)) {
        output = `${output}\n${R45_LOW_LINE}`;
      }
    }
  }
  const changed = output !== text;
  return { cleaned: output.replace(/\n{3,}/g, "\n\n").trim(), changed };
}