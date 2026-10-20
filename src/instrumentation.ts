// 启动级预热：将 kb searchKnowledge 冷初始化（~5.9s 读盘分词）从"部署后首请求"提前到进程启动，
// 避免首帧/首用户请求被阻塞拖慢。注册失败不影响启动（防御性，见 AGENTS.md QM_ERR 雷区）。
// 仅 Node.js runtime 预热；Edge runtime 无 node fs、且静态分析会尝试打包 node 模块，
// 故用 NEXT_RUNTIME 守卫在 register 内部动态 import，edge 侧直接跳过。
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }
  try {
    const { searchKnowledge } = await import("@/lib/kb/content-search");
    searchKnowledge("我最近有点焦虑，想找人聊聊", 1, 60);
  } catch {
    // 预热失败不回退为错误：冷路径 initialize 幂等，首请求可自行初始化
  }
}