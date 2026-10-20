import type {XiaokuLetter} from "@/lib/treehole/th-types";
import type {LetterPngSnapshot} from "./letter-png";
import {desktopDateLabel} from "./desktop-date";
/** 旧字段的前端显示适配；local identity不冒充服务端report/request/revision合同。 */
export function legacyLetterSnapshot(letter:XiaokuLetter):LetterPngSnapshot {
 const paragraphs=letter.text.split("\n\n");
 const salutation=paragraphs[0]==="亲爱的你："||paragraphs[0]==="亲爱的你:"?paragraphs.shift()!:"";
 return {letterId:`legacy-local:${letter.date}:${letter.createdAt}`,revision:letter.createdAt,dateKey:letter.date,dateDisplay:desktopDateLabel(letter.date),authorLabel:"一封来自小酷的回信",title:"给今天的你",salutation,paragraphs,signature:"小酷",signatureDescription:"你的 AI 心理陪伴伙伴",isCrisis:letter.isCrisis};
}
