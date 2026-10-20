"use client";

import {Fragment, createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode, type PointerEvent} from "react";
import type {LetterPngSnapshot} from "./letter-png";
import {useDesktopLetterExport} from "./独立信件导出";
import {DesktopDialog} from "./desktop-dialog";
import {diarySaveFailureText} from "./保存失败说明";
import "./desktop.css";
import { HomeHeader } from "@/components/qm-site-shell/home-header";

export type DesktopTab = "today" | "archive" | "trends";
interface RuntimeDesktopOverlay {owner:symbol;operationKey?:string;visualState:string;node:ReactNode}
const DesktopOverlayContext=createContext<{operationKey?:string;show:(owner:symbol,visualState:string,node:ReactNode)=>void;clear:(owner:symbol)=>void}|null>(null);
export function useDesktopOverlay(){return useContext(DesktopOverlayContext);}
export function DesktopFrame({dateLabel, operationKey, tab, children, storageNotice, sharedShell, visualState, overlay}: {dateLabel:string;operationKey?:string;tab:DesktopTab;children:ReactNode;storageNotice:string;sharedShell:ReactNode;visualState:string;overlay?:ReactNode}) {
  const [runtimeOverlay,setRuntimeOverlay]=useState<RuntimeDesktopOverlay|null>(null);
  const show=useCallback((owner:symbol,visualState:string,node:ReactNode)=>setRuntimeOverlay(current=>current&&current.operationKey===operationKey&&current.owner!==owner?current:{owner,operationKey,visualState,node}),[operationKey]);
  const clear=useCallback((owner:symbol)=>setRuntimeOverlay(current=>current?.owner===owner&&current.operationKey===operationKey?null:current),[operationKey]);
  const currentOverlay=runtimeOverlay?.operationKey===operationKey?runtimeOverlay:null;
  // 视图身份由调用方提供，不从页头日期推定账户、记录或业务日。
  return <DesktopOverlayContext.Provider value={{operationKey,show,clear}}><div className="th-desktop" lang="zh-CN" data-treehole-visual={overlay?visualState:currentOverlay?.visualState||visualState}><HomeHeader /><main><div className="page-head"><div><p className="eyebrow">{dateLabel}</p><h1>情绪树洞</h1><p>生活没有标准答案。</p></div><div className="page-tabs">{[["today","今日记录","/treehole"],["archive","历史归档","/treehole/archive"],["trends","趋势观察","/treehole/trends"]].map(([key,label,href])=><a key={key} className={tab===key?"current":""} href={href} aria-current={tab===key?"page":undefined}>{label}</a>)}</div></div>{children}<div className="footer"><span>{storageNotice}</span><div><a href="/privacy">隐私政策</a><a href="/terms">用户协议</a><a href="/disclaimer">免责声明</a><a href="/data-deletion">数据留存与删除</a></div></div></main><Fragment key={operationKey}>{overlay||currentOverlay?.node}</Fragment></div></DesktopOverlayContext.Provider>;
}
export function DesktopSteps({stage}:{stage:"checkin"|"diary"|"letter"}) {
  const current=stage==="checkin"?0:stage==="diary"?1:2;
  return <div className="steps">{["情绪收集","写日记","小酷回信"].map((label,index)=><div key={label} className={`step ${index<current?"done":index===current?"on":""}`} aria-current={index===current?"step":undefined}><span>{String(index+1).padStart(2,"0")}</span>{label}</div>)}</div>;
}
export interface DesktopDiaryProps {dateDisplay:string;dateKey?:string;operationKey?:string;text:string;count:number;limit:number;saveStatus:string;pending:boolean;recoverDraft?:boolean;onRecoverLater?:()=>void;onRecoverContinue?:()=>void;onChange:(text:string)=>void;onBack:()=>void;onSave:(kind:"draft"|"diary"|"letter")=>Promise<void>}
export function DesktopDiary(p:DesktopDiaryProps) {
  const textarea=useRef<HTMLTextAreaElement>(null);const track=useRef<HTMLDivElement>(null);const composing=useRef(false);const busy=useRef<symbol|null>(null);const alive=useRef(false);const dragCleanup=useRef<(()=>void)|null>(null);
  const failureOwner=useRef(Symbol("日记保存失败弹层"));
  const recoverOwner=useRef(Symbol("同日草稿恢复弹层"));
  const recoverActions=useRef({later:p.onRecoverLater,continue:p.onRecoverContinue});recoverActions.current={later:p.onRecoverLater,continue:p.onRecoverContinue};
  useEffect(()=>()=>dragCleanup.current?.(),[]);
  const [scroll,setScroll]=useState({top:0,height:50,overflow:false});const [failure,setFailure]=useState("");const [working,setWorking]=useState(false);const pending=p.pending||working;
  // 调用方传稳定编辑视图代次，切换账户/记录时改变；不是请求号或自动保存修订。
  const frame=useContext(DesktopOverlayContext);
  const showOverlay=frame?.show,clearOverlay=frame?.clear;
  useEffect(()=>{if(!p.recoverDraft||!showOverlay)return;const owner=recoverOwner.current;showOverlay(owner,"05",<DesktopDialog kind="recover" onSecondary={async()=>{recoverActions.current.later?.();clearOverlay?.(owner);}} onPrimary={async()=>{recoverActions.current.continue?.();clearOverlay?.(owner);}}/>);return()=>clearOverlay?.(owner);},[p.recoverDraft,showOverlay,clearOverlay]);
  // 所属日由调用方提供；不从展示文案推断时区或记录日期。旧静态调用保留展示值作为兼容边界。
  const viewIdentity=JSON.stringify([frame?.operationKey??null,p.operationKey??null,p.dateKey??p.dateDisplay]);const currentView=useRef(viewIdentity);currentView.current=viewIdentity;
  useEffect(()=>{alive.current=true;busy.current=null;composing.current=false;setWorking(false);setFailure("");return()=>{alive.current=false;busy.current=null;dragCleanup.current?.();};},[viewIdentity]);
  const measure=()=>{const el=textarea.current;const tr=track.current;if(!el||!tr)return;const overflow=el.scrollHeight>el.clientHeight;if(!overflow)dragCleanup.current?.();const height=Math.max(32,tr.clientHeight*el.clientHeight/Math.max(el.clientHeight,el.scrollHeight));setScroll({height,overflow,top:el.scrollTop/Math.max(1,el.scrollHeight-el.clientHeight)*Math.max(0,tr.clientHeight-height)});};
  // 首次绘制前确定滚动条几何，避免先绘制临时高度再在遮罩下重画圆角。
  useLayoutEffect(()=>{let active=true;measure();const observer=new ResizeObserver(measure);if(textarea.current)observer.observe(textarea.current);document.fonts.addEventListener("loadingdone",measure);void document.fonts.ready.then(()=>{if(active)measure();});return()=>{active=false;observer.disconnect();document.fonts.removeEventListener("loadingdone",measure);};},[p.text,viewIdentity]);
  const drag=(event:PointerEvent<HTMLDivElement>)=>{if(event.button!==0||!event.isPrimary)return;const el=textarea.current,tr=track.current;if(!el||!tr)return;dragCleanup.current?.();const start=event.clientY,top=el.scrollTop;event.currentTarget.setPointerCapture(event.pointerId);const node=event.currentTarget;const move=(ev:globalThis.PointerEvent)=>{el.scrollTop=top+(ev.clientY-start)*(el.scrollHeight-el.clientHeight)/Math.max(1,tr.clientHeight-scroll.height);};const end=()=>{node.removeEventListener("pointermove",move);node.removeEventListener("pointerup",end);node.removeEventListener("pointercancel",end);node.removeEventListener("lostpointercapture",end);if(node.hasPointerCapture(event.pointerId))node.releasePointerCapture(event.pointerId);dragCleanup.current=null;};dragCleanup.current=end;node.addEventListener("pointermove",move);node.addEventListener("pointerup",end);node.addEventListener("pointercancel",end);node.addEventListener("lostpointercapture",end);};
  const save=async(kind:"draft"|"diary"|"letter")=>{if(busy.current||p.pending||composing.current)return;const token=Symbol("日记保存操作");const selectedView=viewIdentity;busy.current=token;setWorking(true);setFailure("");try{await p.onSave(kind);frame?.clear(failureOwner.current);}catch(error){if(alive.current&&currentView.current===selectedView){setFailure(diarySaveFailureText(error));frame?.show(failureOwner.current,"07",<DesktopDialog kind="save-failed" returnFocusSelector={`[data-treehole-save-kind="${kind}"]`} onSecondary={async()=>{frame?.clear(failureOwner.current);}} onPrimary={async()=>{await p.onSave(kind);setFailure("");frame?.clear(failureOwner.current);}}/>);}}finally{if(busy.current===token){busy.current=null;if(alive.current&&currentView.current===selectedView)setWorking(false);}}};
  return <section key={viewIdentity} className="paper"><div className="meta"><button type="button" className="back" onClick={p.onBack}>← 返回情绪收集</button><span>{p.dateDisplay}</span></div><p className="prompt">接下来这里是你的。可以写发生了什么，也可以只写一句没头没尾的话。你不需要把它整理好。</p><div className="scroll-wrap"><textarea key={viewIdentity} ref={textarea} className={`writing ${p.text?"filled":""} long-content`} aria-label="日记正文" value={p.text} onChange={e=>p.onChange(e.target.value)} onScroll={measure} onCompositionStart={()=>{composing.current=true;}} onCompositionEnd={()=>{composing.current=false;}} /><div className="scroll-control" aria-hidden="true" style={{visibility:scroll.overflow?"visible":"hidden"}}><div className="scroll-track" ref={track}><div className="scroll-thumb" onPointerDown={drag} style={{height:scroll.height,top:scroll.top}} /></div></div></div><div className="meta save-line"><span role="status">{failure||p.saveStatus}</span><span>{p.count} / {p.limit}</span></div><div className="actions"><button type="button" className="action" data-treehole-save-kind="draft" disabled={pending} onClick={()=>void save("draft")}>保存草稿</button><div><button type="button" className="action" data-treehole-save-kind="diary" disabled={pending} onClick={()=>void save("diary")}>只保存日记</button><button type="button" className="action primary" data-treehole-save-kind="letter" disabled={pending} onClick={()=>void save("letter")}>保存并请小酷回信</button></div></div></section>;
}
export function DesktopLetter({snapshot,onBack,onExport,onChat,pending}:{snapshot:LetterPngSnapshot;onBack:()=>void;onExport?:(signal?:AbortSignal)=>void|Promise<void>;onChat:()=>void;pending:boolean}) {
  const frame=useContext(DesktopOverlayContext);
  const {pending:exportPending,failed:exportFailed,start:exportStart,dismiss:exportDismiss,description:exportFailureDescription,retryBlocked:exportRetryBlocked}=useDesktopLetterExport(snapshot,onExport,frame?.operationKey);
  const owner=useRef(Symbol("信件导出弹层"));
  const show=frame?.show,clear=frame?.clear;
  useEffect(()=>{
    if(!exportFailed||!show){clear?.(owner.current);return;}
    const token=owner.current;
    show(token,"10",<DesktopDialog kind="export-failed" exportFailureDescription={exportFailureDescription} primaryDisabled={exportRetryBlocked} primaryLabel={exportRetryBlocked?"当前无法重试":undefined} onSecondary={async()=>exportDismiss()} onPrimary={exportStart}/>);
    return()=>clear?.(token);
  },[exportFailed,exportFailureDescription,exportRetryBlocked,exportStart,exportDismiss,show,clear]);
  // 危机卡消费独立安全合同，禁止在此套普通信件样式。
  if(snapshot.isCrisis!==false)throw new Error("BLOCKED：回信安全状态缺失或需要独立危机合同，不能作为普通信件呈现");
  return <><section className="paper correspondence"><div className="meta"><span>{snapshot.authorLabel}</span><span>{snapshot.dateDisplay}</span></div><h2 className="letter-title">{snapshot.title}</h2><article className="received-letter" aria-label="小酷回信，只读内容"><p className="salutation">{snapshot.salutation}</p>{snapshot.paragraphs.map((text,index)=><p className="letter-paragraph" key={index}>{text}</p>)}<div className="signature"><span>{snapshot.signature}</span><small>{snapshot.signatureDescription}</small></div></article><div className="actions"><button type="button" className="action" onClick={onBack}>返回日记</button><div><button type="button" className="action" disabled={pending||exportPending} onClick={()=>void exportStart()}>保存 / 导出</button><button type="button" className="action primary" onClick={onChat}>和小酷聊聊</button></div></div><p className="local-note">AI回信不替代专业心理支持。</p></section>{exportFailed&&!frame&&<DesktopDialog kind="export-failed" exportFailureDescription={exportFailureDescription} primaryDisabled={exportRetryBlocked} primaryLabel={exportRetryBlocked?"当前无法重试":undefined} onSecondary={async()=>exportDismiss()} onPrimary={async()=>{await exportStart();}}/>}</>;
}
export interface ArchiveSummary {date:string;dateLabel:string;title:string;excerpt:string;hasDiary:boolean;hasLetter:boolean}
/** 公历计算不确定业务日期；所选年月、记录和当天由调用方权威合同提供。 */
export function calendarDays(year:number,month:number):readonly (number|null)[] {
  if(!Number.isInteger(year)||!Number.isInteger(month)||month<1||month>12||year<100||year>9999)throw new Error("日历年月无效");
  const first=new Date(Date.UTC(year,month-1,1));const count=new Date(Date.UTC(year,month,0)).getUTCDate();return [...Array<null>((first.getUTCDay()+6)%7).fill(null),...Array.from({length:count},(_,i)=>i+1)];
}
export function DesktopArchive({year,month,selectedDate,records,onMonth,onSelect,onOpen}:{year:number;month:number;selectedDate:string;records:readonly ArchiveSummary[];onMonth:(delta:number)=>void;onSelect:(date:string)=>void;onOpen:(date:string)=>void}) {
 const selected=records.find(r=>r.date===selectedDate);
 return <section className="paper"><div className="meta"><h2>历史归档</h2><span>{new Set(records.map(r=>r.date)).size} 天记录</span></div><div className="archive-grid"><div className="calendar"><div className="month"><button type="button" aria-label="上个月" onClick={()=>onMonth(-1)}>‹</button><strong>{year}年{month}月</strong><button type="button" aria-label="下个月" onClick={()=>onMonth(1)}>›</button></div><div className="days">{["一","二","三","四","五","六","日"].map(label=><span key={label}>{label}</span>)}{calendarDays(year,month).map((day,index)=>{const date=`${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;const marked=records.some(r=>r.date===date);return day===null?<span className="blank" key={`blank${index}`}>　</span>:<button type="button" key={date} className={`${marked?"marked":""} ${selectedDate===date?"selected":""}`} aria-label={`${month}月${day}日${marked?"，有记录":""}`} aria-pressed={selectedDate===date} onClick={()=>onSelect(date)}>{day}</button>;})}</div><p className="local-note">圆点表示当天有记录</p></div><div className={`record ${selected?"":"empty-record"}`}>{selected?<><p className="eyebrow">{selected.dateLabel}</p><h3>{selected.title}</h3><p className="record-diary">{selected.excerpt}</p><div className="tags">{selected.hasDiary&&<span>日记</span>}{selected.hasLetter&&<span>小酷回信</span>}</div><button type="button" className="action" onClick={()=>onOpen(selected.date)}>查看这一天 →</button></>:<><h3>这一天还没有记录</h3><p>可以选择有圆点的日期，回看留下的日记。</p></>}</div></div></section>;
}
export function DesktopTrends({range,onRange,diaryDays,letterCount,insufficient,chart}:{range:7|30;onRange:(range:7|30)=>void;diaryDays:number;letterCount:number;insufficient:boolean;chart:ReactNode}) {
 return <section className="paper"><div className="meta"><h2>趋势观察</h2><div className="range">{([7,30] as const).map(days=><button type="button" key={days} className={range===days?"picked":""} aria-pressed={range===days} onClick={()=>onRange(days)}>{days} 天</button>)}</div></div><p>看看这段时间的变化。仅供自我观察，不是诊断结论。</p><div className="trend-box"><h3>情绪与能量趋势</h3>{insufficient?<div className="insufficient"><span className="rings">○ ○ ○</span><p>数据还不够多，多记录几天再来看看吧。</p></div>:chart}</div><div className="metrics"><div><strong>{diaryDays}</strong>日记天数</div><div><strong>{letterCount}</strong>小酷回信</div></div></section>;
}
