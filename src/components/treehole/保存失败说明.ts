const generic = "这次保存未成功 · 文字仍在当前页面";
/** 消费既有调用者的明确失败；不推断字数政策，不显示未知SDK或内部详情。 */
export function diarySaveFailureText(error: unknown): string {
    let message: unknown;
    try { message = error instanceof Error ? error.message : undefined; }
    catch { return generic; }
    if (message === "请先写下日记内容" || message === "字数超出当前提交限制，原文仍完整保留") return message;
    if (typeof message === "string" && message.startsWith("其他标签或日期的记录已变化"))
        return "其他标签或日期的记录已变化，请先复制当前文字再刷新核对。";
    return generic;
}
