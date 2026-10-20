const longBody = (() => {
  const seg =
    "今天上班真的很累，我一直在想人生的事情，感觉没什么意义，觉得每天重复一样的生活好疲惫。" +
    "感觉自己像在一个齿轮里循环，找不到落点，想躺平又不敢躺平，压力很大，也没什么人可以说。" +
    "最近老是失眠，白天没精神，晚上又睡不着，反复想这些事，越想越乱。";
  return seg.repeat(40); // 2580 字
})();

async function run(tag: string) {
  const t0 = Date.now();
  const res = await fetch("http://localhost:5000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [{ role: "user", content: longBody }], sessionId: `perf_${tag}_${Date.now()}` }),
  });
  const hdrMs = Date.now() - t0;
  const perf = res.headers.get("x-qm-perf");
  console.log(`[${tag}] headers=${hdrMs}ms  X-QM-PERF=${perf}`);
  // 读 ack 首帧
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let ackSeen = false;
  for (let i = 0; i < 20; i++) {
    const { value, done } = await reader.read();
    if (done) break;
    const s = decoder.decode(value, { stream: true });
    if (s.includes('"isAck":true')) { ackSeen = true; console.log(`[${tag}] ack frame seen after ${Date.now()-t0}ms`); }
    if (s.includes("[DONE]") || s.includes("ERROR")) break;
  }
  if (!ackSeen) console.log(`[${tag}] NO ACK FRAME in first 20 reads`);
}

(async () => {
  // 第一次：触发冷加载（可能有 5.9s KB 初始化）
  await run("cold");
  await new Promise((r) => setTimeout(r, 300));
  // 第二次：热
  await run("hot");
  await new Promise((r) => setTimeout(r, 300));
  await run("hot2");
})().catch(console.error);