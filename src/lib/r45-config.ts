/**
 * R45 意定监护与预先照护规划专线 · 站点轻入口配置
 *
 * R45W1 接线（2026-09-12，P0）：站点 UI 轻入口从占位态切到真实调用。
 * 平台 Bot 已三环验收全绿（WIRED_VERIFIED，52/52 + 120/120 + RUNTIME_VERIFIED_CANDIDATE）。
 * 服务端经 `/api/r45/chat` 转发 POST https://api.coze.cn/v3/chat（Bearer SAT），SSE 流式透传。
 * SAT 令牌只存在于服务端环境变量 R45_SAT_TOKEN（.env.local，gitignored），严禁进前端 bundle。
 */

/** 平台 Bot ID（「意定监护与预先照护规划」，space 7676743482207404086） */
export const R45_BOT_ID = "7684583604739588111";

/** 运行时间戳标识（当前版本 1789211458453 v2，含 QMS 危机口径四行） */
export const R45_BOT_VERSION = "1789211458453";

/** 站点对话入口（前端相对路径，走本服务转发，不直连外部域名） */
export const R45_CONVERSATION_ENDPOINT = "/api/r45/chat";

export const R45_ROUTE = "/preplanning";

export const R45_ENTRY_ENABLED = true;

/** 服务端从环境变量读取 SAT；前端 bundle 不得 import 此函数（仅服务端 route 使用） */
export function getR45SatToken(): string {
  return process.env.R45_SAT_TOKEN || "";
}