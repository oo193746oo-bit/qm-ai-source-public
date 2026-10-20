// 补丁三：生成后置硬闸 post_gate（纯函数，无 next 依赖，可 npx tsx 单测）
// G1 危机轮四行齐全：由危机链 hotlineCard/记得你模板保证（危机分支不走此闸）。
// G2 非危机轮回复必须以问号结尾；G3 长输入（>200字）回复须含原话 4 字连续子串（原话复述存在性）。
// fail→确定性保底句（不二次调 LLM，快且必然过关；危机轮本就用固定模板保底）。

export function containsFourCharSubstring(haystack: string, needle: string): boolean {
  for (let i = 0; i + 4 <= needle.length; i++) {
    const sub = needle.slice(i, i + 4);
    if (/\s/.test(sub)) continue;
    if (haystack.includes(sub)) return true;
  }
  return false;
}

export function evaluatePostGate(
  reply: string,
  userText: string,
): { gate: "G2_question_ending" | "G3_long_input_echo" | "G5_collapse" | null; fallback: string } {
  // G5 (P0C): duplicate-tail collapse - 先于 G2/G3 判定执行
  let g5Trimmed = false;
  {
    const g5r = collapseDuplicateTail(reply);
    if (g5r.trimmed) {
      reply = g5r.text;
      g5Trimmed = true;
      console.log("[QM:GATE] G5_duplicate_tail", { cutSize: g5r.cutSize });
    }
  }

  // G2：普通回复补一个开放承接问句（仍以“?”收尾满足合规，但不机械复述用户原话，
  // 避免“我听到了你说的…此刻感觉”探针形态）。
  const g2Fallback = `听起来这些对你来说都不轻松。愿意多说说此刻的感受吗？`;
  // G3：长输入（>200），本轮合规要求回复含原话 4 字连续子串，故需带一小段原话（slice 保留 4 字以上）。
  const g3Fallback = `我们再来看看你刚才提到的「${userText.slice(0, 12)}」，这部分对你来说意味着什么？`;
  if (userText.length > 200 && !containsFourCharSubstring(reply, userText)) {
    return { gate: "G3_long_input_echo", fallback: reply + "\n\n" + g3Fallback };
  }
  const trimmed = reply.trimEnd();
  // P0-B (20260916): fallback conditionalization - if the reply already ends
  // with a closing question / empathetic closing, do NOT append the signature
  // fallback (hard-concat bypassed the TAIL_E/TAIL_F cleaning chain;
  // Ahua field-check 20260916).
  // BatchA P2 (20260917): G2 问尾判定扩展——判定前先剥尾部 <resource> 块与行首 /kb、/knowledge
  // 路径行再取末段（防 resource 块把真问尾挤出窗口）；新增括号软问尾、~ 结尾、「随时问/随时说/随时聊」。
  // 真陈述句结尾仍挂签名档（判定未放松到永不挂）。
  const g2TailText = (() => {
    let t = trimmed;
    t = t.replace(/<resource>[\s\S]*?<\/resource>\s*$/i, "");
    t = t.replace(/(?:^|\n)\s*\/(?:kb|knowledge)\S*\s*$/i, "");
    return t.trimEnd();
  })();
  const hasClosingNear = /[？?]|吗|呢|愿意|要不要|聊聊|说说|随时问|随时说|随时聊|[～~]|\([^（）()]*?[？?～~]\)|（[^（）()]*?[？?～~]）/.test(g2TailText.slice(-100));
  if (!hasClosingNear) {
    return { gate: "G2_question_ending", fallback: reply + "\n\n" + g2Fallback };
  }
  if (g5Trimmed) {
    // P0-A (20260916): G5 folded but no G2/G3 needed -> still send folded full text,
    // otherwise fold result is dropped and duplicated body reaches client (09-15 T3 root cause).
    return { gate: "G5_collapse", fallback: reply };
  }
  return { gate: null, fallback: reply };
}

// G5 (P0C 20260915): duplicate-tail collapse - 回复尾部整段重复折叠（S7/T3 同族通用解）
export function collapseDuplicateTail(text: string): { text: string; trimmed: boolean; cutSize?: number } {
  const T = text || "";
  const L = T.length;
  if (L <= 50) return { text, trimmed: false };
  for (let size = Math.floor(L / 2); size >= 24; size--) {
    const tail = T.slice(L - size);
    const prev = T.slice(L - 2 * size, L - size);
    if (prev === tail) {
      let cut = T.slice(0, L - size).trimEnd();
      if (!/[。！？!?…"]$/.test(cut)) cut += "。";
      return { text: cut, trimmed: true, cutSize: size };
    }
  }
  return { text, trimmed: false };
}
