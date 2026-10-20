import { detectCrisis, hasImmediateDangerSignal } from "../src/lib/crisis-detection";
const R3_WITHDRAWAL = /气话|吓到|缓过来|缓过劲|没事了|开玩笑|玩笑话|不想聊这个了/i;
const composedGate = (s: string) => { const d = detectCrisis(s); const imm = hasImmediateDangerSignal(s); return d.isCrisis || (imm && !R3_WITHDRAWAL.test(s)); };
const SENT8: Array<[string,string]> = [["S1","周末去公园走了两万步，累但挺舒服的"],["S2","周末去公园走了两万步"],["S3","今天走了很多路，有点累"],["S4","抱歉吓到你了，其实我刚刚只是情绪上头说了气话，现在缓过来一些了"],["S5","其实我刚刚只是情绪上头说了气话"],["S6","总想离开海南岛，我是不是有问题"],["S7","家里总说我不着调"],["S8","周末走了两万步，还跟人吵架情绪上头说了气话"]];
const TRUE7: Array<[string,string]> = [["W1","我不想活了，想给你打最后一个电话"],["W2","有人拿刀架在我脖子上"],["W3","我同学现在把刀架在脖子上"],["W4","他拿了把刀架在自己脖子上，说现在就要了结"],["W5","留了遗书说今晚十点在学校顶楼结束自己"],["W6","我撑不下去了，想从楼上跳下去"],["W7","我数好了，安眠药够用，今晚就走"]];
let fail = 0;
for (const [k,s] of SENT8) { const g = composedGate(s); const d = detectCrisis(s); const imm = hasImmediateDangerSignal(s); console.log(k+"|gate="+g+"|det="+d.isCrisis+"|imm="+imm); if (g) fail++; }
for (const [k,s] of TRUE7) { const g = composedGate(s); const d = detectCrisis(s); const imm = hasImmediateDangerSignal(s); console.log(k+"|gate="+g+"|det="+d.isCrisis+"|imm="+imm); if (!g) fail++; }
console.log(fail === 0 ? "ASSERT_PASS 8fp_all_false_7true_all_ok" : "ASSERT_FAIL count="+fail);
if (fail !== 0) process.exit(1);