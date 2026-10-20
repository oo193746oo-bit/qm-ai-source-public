/** 同源、仅内存的批准版 PNG 渲染；此文件只在服务端导入。 */
import "server-only";
import {createApprovedPngDiagnostic,recordApprovedPngVersion,reportApprovedPngFailure,setApprovedPngExecutable,type ApprovedPngDiagnostic} from "./approved-png-diagnostics";
import {spawn,type ChildProcess} from "node:child_process";
import {createHash} from "node:crypto";
import {access,readFile,mkdtemp,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import type {LetterPngSnapshot} from "@/components/treehole/letter-png";
import {letterPngMarkup} from "@/components/treehole/letter-png";

export const APPROVED_PNG_VERSION="qm-treehole-approved-chromium-151-v1";
const templatePath=join(process.cwd(),"assets/treehole-export-approved.html");
const coveragePath=join(process.cwd(),"assets/treehole-export-font-coverage.json");
const fontDir=join(process.cwd(),"public/treehole/fonts");
const expectedTemplateSha="1053b70b031a7bf1530548c7dbeea7f039e8aac7303bb5530e22d8b87cd2fe65";
const fonts={sans:["QM Export Full Sans","NotoSansSC-VF.woff2"],cjk:["QM Export CJK","NotoSansCJKSC-Regular.woff2"],emoji:["QM Export Emoji","NotoColorEmoji.woff2"]} as const;
let activeCaptures=0;
type FontKey=keyof typeof fonts;
type Coverage=Record<"letter"|"diary"|FontKey,{codepoints:number[]}>;
function codepoints(value:string):number[]{return [...value].map(c=>c.codePointAt(0)!);}
function chooseFallback(snapshot:LetterPngSnapshot,coverage:Coverage):FontKey[]{
  const original=new Set([...coverage.letter.codepoints,...coverage.diary.codepoints]);
  const remaining=new Set(codepoints([snapshot.authorLabel,snapshot.dateDisplay,snapshot.title,snapshot.salutation,...snapshot.paragraphs,snapshot.signature,snapshot.signatureDescription].join("")) .filter(cp=>!original.has(cp)&&cp!==10&&cp!==13&&cp!==9&&cp!==0xfe0f&&cp!==0x200d));
  const available=Object.fromEntries((Object.keys(fonts) as FontKey[]).map(key=>[key,new Set(coverage[key].codepoints)])) as Record<FontKey,Set<number>>;
  const selected=new Set<FontKey>();
  for(const cp of remaining){
    const key=(Object.keys(fonts) as FontKey[]).find(name=>available[name].has(cp));
    if(!key)throw new Error("批准字库及完整字库均缺少字符");
    selected.add(key);
  }
  return [...selected];
}
function renderHtml(template:string,snapshot:LetterPngSnapshot,coverage:Coverage,fontBytes:Partial<Record<FontKey,Buffer>>):string{
  const markup=letterPngMarkup(snapshot);
  if(!template.includes('<main class="export-sheet">'))throw new Error("批准模板结构不匹配");
  let html=template.replace(/<main class="export-sheet">[\s\S]*?<\/main>/,markup);
  const fallbacks=chooseFallback(snapshot,coverage);
  if(fallbacks.length){
    const css=fallbacks.map(key=>{const [family]=fonts[key];const bytes=fontBytes[key];if(!bytes)throw new Error("字库缺失");return `@font-face{font-family:"${family}";src:url(data:font/woff2;base64,${bytes.toString("base64")}) format("woff2");font-style:normal;font-weight:100 900}`;}).join("\n");
    const families=fallbacks.map(key=>`"${fonts[key][0]}"`).join(",");
    const rule=`.received-letter,.letter-title,.meta,.signature{font-family:LetterText,DiarySans,${families},sans-serif!important}`;
    html=html.replace("</style>",`${css}\n${rule}</style>`);
  }
  return html;
}
function waitExit(child:ChildProcess):Promise<void>{return new Promise(resolve=>{if(child.exitCode!==null||child.signalCode!==null)return resolve();child.once("exit",()=>resolve());});}
async function chromiumScreenshot(html:string,timeoutMs:number,diagnostic:ApprovedPngDiagnostic):Promise<{png:Buffer;heightCSS:number}>{
  diagnostic.phase="profile";
  const profile=await mkdtemp(join(tmpdir(),"qm-treehole-export-"));
  const executable=process.env.QM_CHROMIUM_PATH||"/usr/bin/chromium";
  setApprovedPngExecutable(diagnostic,executable,Boolean(process.env.QM_CHROMIUM_PATH));
  const args=["--headless=new","--disable-gpu","--no-first-run","--no-default-browser-check","--disable-background-networking","--remote-debugging-port=0",`--user-data-dir=${profile}`,"about:blank"];
  if(process.env.QM_CHROMIUM_NO_SANDBOX==="1")args.splice(1,0,"--no-sandbox");
  diagnostic.phase="launch";
  const child:ChildProcess=spawn(executable,args,{stdio:["ignore","ignore","pipe"],detached:true,env:{PATH:process.env.PATH||"/usr/bin:/bin",HOME:profile,LANG:"C.UTF-8",NODE_ENV:"production"}});
  let ws:WebSocket|undefined;
  const abort=new AbortController();const timer=setTimeout(()=>abort.abort(),timeoutMs);
  const signalGroup=(signal:NodeJS.Signals)=>{if(child.pid){try{process.kill(-child.pid,signal);}catch{try{child.kill(signal);}catch{}}}};
  const closeBrowser=()=>{if(ws?.readyState===WebSocket.OPEN){try{ws.send(JSON.stringify({id:2147483647,method:"Browser.close"}));return;}catch{}}signalGroup("SIGTERM");};
  abort.signal.addEventListener("abort",closeBrowser,{once:true});
  try{
    const url=await new Promise<string>((resolve,reject)=>{let output="";const fail=(cause?:unknown)=>{if(cause instanceof Error)reportApprovedPngFailure(cause,diagnostic);reject(new Error("批准渲染浏览器不可用"));};child.once("error",fail);child.once("exit",fail);child.stderr?.on("data",(chunk:Buffer)=>{output+=String(chunk).slice(-2048);const found=output.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(found){child.off("error",fail);child.off("exit",fail);resolve(found[1]);}});abort.signal.addEventListener("abort",fail,{once:true});});
    diagnostic.phase="connect";
    ws=new WebSocket(url);
    await new Promise<void>((resolve,reject)=>{ws!.onopen=()=>resolve();ws!.onerror=()=>reject(new Error("批准渲染连接失败"));abort.signal.addEventListener("abort",()=>reject(new Error("批准渲染超时")),{once:true});});
    const socket=ws;let id=0;const pending=new Map<number,{resolve:(value:unknown)=>void;reject:(reason:Error)=>void}>();
    const rejectPending=(error:Error)=>{for(const entry of pending.values())entry.reject(error);pending.clear();};
    socket.onmessage=event=>{const message=JSON.parse(String(event.data));if(!message.id)return;const entry=pending.get(message.id);if(!entry)return;pending.delete(message.id);message.error?entry.reject(new Error("浏览器绘制失败")):entry.resolve(message.result);};
    socket.onclose=()=>rejectPending(new Error("批准渲染浏览器已关闭"));
    abort.signal.addEventListener("abort",()=>rejectPending(new Error("批准渲染超时")),{once:true});
    const call=<T>(method:string,params:Record<string,unknown>={},sessionId?:string):Promise<T>=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve:resolve as (value:unknown)=>void,reject});socket.send(JSON.stringify({id:n,method,params,...(sessionId?{sessionId}:{})}));});
    diagnostic.phase="version-check";diagnostic.versionCheck="pending";
    const version=await call<{product:string}>("Browser.getVersion");recordApprovedPngVersion(diagnostic,version.product);if(!String(version.product).startsWith("Chrome/151.0.7922.173"))throw new Error("批准浏览器版本不匹配");
    diagnostic.phase="document";
    const target=await call<{targetId:string}>("Target.createTarget",{url:"about:blank"});const attached=await call<{sessionId:string}>("Target.attachToTarget",{targetId:target.targetId,flatten:true});const sid=attached.sessionId;
    await call("Page.enable",{},sid);await call("Runtime.enable",{},sid);await call("Network.enable",{},sid);
    await call("Network.setBlockedURLs",{urls:["http://*","https://*","file://*"]},sid);
    await call("Emulation.setDeviceMetricsOverride",{width:1200,height:900,deviceScaleFactor:2,mobile:false},sid);
    const tree=await call<{frameTree:{frame:{id:string}}}>("Page.getFrameTree",{},sid);await call("Page.setDocumentContent",{frameId:tree.frameTree.frame.id,html},sid);
    diagnostic.phase="fonts";
    const ready=await call<{result:{value:{height:number;width:number;fontStatus:string;failed:number}}}>("Runtime.evaluate",{expression:"document.fonts.ready.then(()=>({height:document.documentElement.scrollHeight,width:document.documentElement.scrollWidth,fontStatus:document.fonts.status,failed:[...document.fonts].filter(f=>f.status==='error').length}))",awaitPromise:true,returnByValue:true},sid);
    const metrics=ready.result.value as {height:number;width:number;fontStatus:string;failed:number};
    if(metrics.width>1200||metrics.height<1||metrics.height>10000||metrics.fontStatus!=="loaded"||metrics.failed)throw new Error("批准字体或整页尺寸不完整");
    diagnostic.phase="screenshot";
    const shot=await call<{data:string}>("Page.captureScreenshot",{format:"png",captureBeyondViewport:true,fromSurface:true},sid);const png=Buffer.from(shot.data,"base64");
    diagnostic.phase="png-validation";
    if(png.length<24||png.readUInt32BE(0)!==0x89504e47||png.readUInt32BE(16)!==2400||png.readUInt32BE(20)!==metrics.height*2)throw new Error("批准PNG文件尺寸不完整");
    return {png,heightCSS:metrics.height};
  }catch(error){
    reportApprovedPngFailure(error,diagnostic);throw error;
  }finally{
    diagnostic.phase="cleanup";
    clearTimeout(timer);closeBrowser();
    await Promise.race([waitExit(child),new Promise<void>(resolve=>setTimeout(resolve,1500))]);
    if(child.exitCode===null&&child.signalCode===null){signalGroup("SIGTERM");await Promise.race([waitExit(child),new Promise<void>(resolve=>setTimeout(resolve,1500))]);}
    if(child.exitCode===null&&child.signalCode===null){signalGroup("SIGKILL");await Promise.race([waitExit(child),new Promise<void>(resolve=>setTimeout(resolve,1500))]);}
    try{ws?.close();}catch{}
    for(let attempt=0;attempt<3;attempt++){
      await rm(profile,{recursive:true,force:true,maxRetries:3,retryDelay:100});
      await new Promise(resolve=>setTimeout(resolve,250));
      try{await access(profile);}catch{break;}
    }
    try{await access(profile);throw new Error("临时渲染目录未清理，未交付图片");}catch(error){if(error instanceof Error&&error.message==="临时渲染目录未清理，未交付图片")throw error;}
  }
}
export async function captureApprovedPng(snapshot:LetterPngSnapshot){
  const diagnostic=createApprovedPngDiagnostic("admission");
  if(activeCaptures>=2){const error=new Error("图片生成队列已满");reportApprovedPngFailure(error,diagnostic);throw error;}
  activeCaptures++;
  try{
  diagnostic.phase="template-read";
  const template=await readFile(templatePath,"utf8");diagnostic.phase="template-verify";if(createHash("sha256").update(template).digest("hex")!==expectedTemplateSha)throw new Error("批准模板SHA不匹配");
  diagnostic.phase="coverage-read";
  const coverage=JSON.parse(await readFile(coveragePath,"utf8")) as Coverage;
  diagnostic.phase="font-selection";
  const selected=chooseFallback(snapshot,coverage);
  diagnostic.phase="font-read";
  const bytes:Partial<Record<FontKey,Buffer>>={};for(const key of selected)bytes[key]=await readFile(join(fontDir,fonts[key][1]));
  diagnostic.phase="markup";
  const html=renderHtml(template,snapshot,coverage,bytes);
  const result=await chromiumScreenshot(html,40000,diagnostic);diagnostic.phase="complete";return result;
  }catch(error){reportApprovedPngFailure(error,diagnostic);throw error;}finally{activeCaptures--;}
}
