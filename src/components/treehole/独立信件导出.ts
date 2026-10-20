"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import {renderLetterPng,triggerLetterPngDownload,type LetterPngSnapshot} from "./letter-png";
import {letterExportFailureDetails} from "./信件导出失败说明";
/** 仅导出现有确定信件；不生成回信、不保存业务数据、不改变授权。 */
export function useDesktopLetterExport(snapshot:LetterPngSnapshot,onExport?:(signal?:AbortSignal)=>void|Promise<void>,operationKey?:string){
 // 以已登记字段的固定顺序取快照；普通通知的对象插入顺序不是信件变更。
 const snapshotIdentity=JSON.stringify({
  letterId:snapshot.letterId,revision:snapshot.revision,dateKey:snapshot.dateKey,
  dateDisplay:snapshot.dateDisplay,authorLabel:snapshot.authorLabel,title:snapshot.title,
  salutation:snapshot.salutation,paragraphs:snapshot.paragraphs,
  signature:snapshot.signature,signatureDescription:snapshot.signatureDescription,
  isCrisis:snapshot.isCrisis,
 });
 const identity=JSON.stringify([operationKey??null,snapshotIdentity]);
 const current=useRef(identity);current.current=identity;
 const operation=useRef<AbortController|null>(null);
 const alive=useRef(false);
 const [pending,setPending]=useState(false);
 const [failed,setFailed]=useState(false);
 const [failureDetails,setFailureDetails]=useState<{description?:string;retryBlocked:boolean;identity?:string}>({retryBlocked:false});
 useEffect(()=>{
  alive.current=true;setPending(false);setFailed(false);setFailureDetails({retryBlocked:false});
  return()=>{alive.current=false;operation.current?.abort();operation.current=null;};
 },[identity]);
 const start=useCallback(async()=>{
  if(operation.current)return;
  const controller=new AbortController();operation.current=controller;
  const selectedIdentity=identity;
  setPending(true);
  try{
   if(onExport)await onExport(controller.signal);
   else{
    const frozenInput:LetterPngSnapshot=JSON.parse(snapshotIdentity);
    const selected=Object.freeze({...frozenInput,paragraphs:Array.isArray(frozenInput.paragraphs)?Object.freeze([...frozenInput.paragraphs]):frozenInput.paragraphs});
    const result=await renderLetterPng(selected,undefined,controller.signal);
    controller.signal.throwIfAborted();
    if(alive.current&&current.current===selectedIdentity)triggerLetterPngDownload(result,controller.signal);
   }
   if(alive.current&&current.current===selectedIdentity)setFailed(false);
  }catch(error){
   if(alive.current&&current.current===selectedIdentity&&!controller.signal.aborted){setFailureDetails({...letterExportFailureDetails(error),identity:selectedIdentity});setFailed(true);}
  }finally{
   if(operation.current===controller){operation.current=null;if(alive.current)setPending(false);}
  }
 },[identity,snapshotIdentity,onExport]);
 const dismiss=useCallback(()=>{setFailed(false);setFailureDetails({retryBlocked:false});},[]);
 return {pending,failed:failed&&failureDetails.identity===identity,start,dismiss,description:failureDetails.description,retryBlocked:failureDetails.retryBlocked};
}
