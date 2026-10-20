// ============================================================
// QM AI v13.17.2 安全修复：公开知识库调试接口已关闭。
// 如需调试，请在服务端日志中查看 [QM:XIAOKU] knowledge base search，
// 或在受控环境中临时加鉴权后重新打开。
// ============================================================

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { error: "not_found" },
    { status: 404 },
  );
}
