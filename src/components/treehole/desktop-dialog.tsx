"use client";
import {useEffect,useId,useRef,useState} from "react";
import {lockDialogScroll} from "./弹层滚动保护";
import "./desktop.css";
export type TreeholeDialogKind="recover"|"leave"|"save-failed"|"generate-failed"|"letter-save-failed"|"export-failed"|"cross-day";
const copy={
 recover:["接着上次的记录","找到今天尚未写完的草稿。你可以接着写，内容不会自动替你提交。","稍后再写","继续写"],
 leave:["还有内容没有保存","离开前可以先保存草稿。若不保存，这次新增的文字可能丢失。","留在这里","保存草稿后离开"],
 "save-failed":["这次没有保存成功","你写的文字仍留在当前页面。请先不要关闭，可以重试保存。","继续编辑","重试保存"],
 "generate-failed":["日记已保存，回信暂未生成","你的日记已经保留。这次没有收到完整回信，可以稍后再试。","返回日记","重试生成回信"],
 "letter-save-failed":["回信已经写好，但尚未保存","完整回信仍在当前页面。你可以重试保存，也可以先导出图片；关闭页面前请留一份。","先导出图片","重试保存回信"],
 "export-failed":["图片暂时没有生成","原回信没有改变。请重试导出，不会重新生成回信。","返回回信","重试导出图片"],
 "cross-day":["已经过了午夜","","继续写这份","保存并返回今日"],
} as const;
/** 跨日正文由已核业务日期提供；所有动作等待真实调用者Promise，失败保留弹层。 */
interface DesktopDialogProps {kind:TreeholeDialogKind;crossDayDescription?:string;exportFailureDescription?:string;letterSaveDescription?:string;secondaryDisabled?:boolean;secondaryLabel?:string;primaryDisabled?:boolean;primaryLabel?:string;returnFocusSelector?:string;onSecondary:()=>Promise<void>;onPrimary:()=>Promise<void>}
export function DesktopDialog(props:DesktopDialogProps) {
 return <DialogContent key={props.kind} {...props}/>;
}
function DialogContent({kind,crossDayDescription,exportFailureDescription,letterSaveDescription,secondaryDisabled=false,secondaryLabel,primaryDisabled=false,primaryLabel,returnFocusSelector,onSecondary,onPrimary}:DesktopDialogProps) {
 const id=useId(),panel=useRef<HTMLElement>(null),busy=useRef(false),alive=useRef(true),afterAction=useRef<HTMLElement|null>(null);const [pending,setPending]=useState(false);const [error,setError]=useState("");const [title,body,secondary,primary]=copy[kind];
 useEffect(()=>{alive.current=true;const doc=panel.current?.ownerDocument??document;const previous=doc.activeElement as HTMLElement|null;let explicitTarget:HTMLElement|null=null;try{if(returnFocusSelector)explicitTarget=(panel.current?.closest(".th-desktop")??doc).querySelector<HTMLElement>(returnFocusSelector);}catch{/* 无效选择器不使页面失败，仍可恢复原焦点。 */}const releaseScroll=lockDialogScroll(doc);panel.current?.focus({preventScroll:true});const root=panel.current?.closest(".th-desktop");const nodes=root?[...root.children].filter(n=>!n.classList.contains("review-overlay")):[];const prior=nodes.map(n=>({node:n as HTMLElement,inert:(n as HTMLElement).inert}));prior.forEach(v=>{v.node.inert=true;});return()=>{alive.current=false;prior.forEach(v=>{v.node.inert=v.inert;});releaseScroll();queueMicrotask(()=>{if(doc.querySelector('[role="dialog"][aria-modal="true"]'))return;const target=explicitTarget?.isConnected?explicitTarget:previous?.isConnected?previous:null;if(target&&!target.closest("[inert]"))target.focus({preventScroll:true});});};},[kind]);
 // 只有内容确实超过可用窗口时启用内部滚动，正常批准画面不因裁切方式改变。
 useEffect(()=>{const node=panel.current;if(!node)return;const doc=node.ownerDocument;const measure=()=>{node.dataset.scrollable=String(node.scrollHeight>node.clientHeight);};measure();const observer=new ResizeObserver(measure);observer.observe(node);const contentObserver=new MutationObserver(measure);contentObserver.observe(node,{childList:true,subtree:true,characterData:true});doc.fonts.addEventListener("loadingdone",measure);return()=>{observer.disconnect();contentObserver.disconnect();doc.fonts.removeEventListener("loadingdone",measure);};},[]);
 useEffect(()=>{if(pending)panel.current?.focus();else if(afterAction.current?.isConnected)afterAction.current.focus();},[pending]);
 const run=async(action:()=>Promise<void>)=>{if(busy.current)return;busy.current=true;afterAction.current=document.activeElement as HTMLElement;setPending(true);setError("");try{await action();}catch{if(alive.current)setError("操作没有完成，当前内容仍保留。请重试。");}finally{busy.current=false;if(alive.current)setPending(false);}};
 if(kind==="cross-day"&&!crossDayDescription)throw new Error("跨日提示缺少核定所属日期");
 return <div className="review-overlay"><section className="review-dialog" ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-busy={pending} aria-labelledby={`${id}-title`} aria-describedby={`${id}-body`} onKeyDown={event=>{if(event.key!=="Tab")return;const buttons=panel.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)");if(!buttons?.length){event.preventDefault();return;}const first=buttons[0],last=buttons[buttons.length-1];if(event.shiftKey&&(document.activeElement===first||document.activeElement===panel.current)){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}}><h2 id={`${id}-title`}>{title}</h2><p id={`${id}-body`}>{kind==="cross-day"?crossDayDescription:kind==="export-failed"&&exportFailureDescription?exportFailureDescription:kind==="letter-save-failed"&&letterSaveDescription?letterSaveDescription:body}</p>{error&&<p role="alert">{error}</p>}<div className="review-buttons"><button type="button" className="action" disabled={pending||secondaryDisabled} onClick={()=>void run(onSecondary)}>{secondaryLabel??secondary}</button><button type="button" className="action primary" disabled={pending||primaryDisabled} onClick={()=>void run(onPrimary)}>{primaryLabel??primary}</button></div></section></div>;
}
