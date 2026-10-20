/** 仅解释已知的本地失败，不把未知异常或私密正文显示到页面。 */
export function letterExportFailureDetails(error: unknown): {description?:string;retryBlocked:boolean} {
    let message: unknown;
    try { message=error instanceof Error ? error.message : undefined; }
    catch { return {retryBlocked:false}; }
    if(message==="当前字体不能完整呈现这封回信，未生成缺字图片")
        return {description:"回信里有当前图片暂不支持的字符。原文没有改变，可以返回回信复制文字；重复导出不能解决这次问题。",retryBlocked:true};
    if(message==="当前浏览器不能安全绘制这封长信，未裁切或缩字")
        return {description:"这封回信超出当前图片可完整导出的范围。原文没有改变，可以返回回信复制文字；不会裁切内容或缩小文字。",retryBlocked:true};
    if(message==="当前浏览器不支持完整字体排版，请使用支持这些能力的桌面浏览器重试")
        return {description:"当前浏览器暂时无法完整生成这张图片。回信内容没有改变，可以返回回信复制文字，或换一个支持导出的桌面浏览器。",retryBlocked:true};
    if(message==="信件身份、所属日期或正文不完整")
        return {description:"当前回信的信息不完整，暂时无法导出。已有内容没有改变，可以返回回信查看；信息完整后才能生成图片。",retryBlocked:true};
    return {retryBlocked:false};
}
