/** Internal, content-free PNG diagnostics. Never serialize a snapshot, argv, env or raw error. */
import {createHash, randomUUID} from 'node:crypto';

const phases = ['route','admission','template-read','template-verify','coverage-read','font-selection','font-read','markup','profile','launch','connect','version-check','document','fonts','screenshot','png-validation','cleanup','complete'] as const;
export type ApprovedPngPhase = typeof phases[number];
export interface ApprovedPngDiagnostic {
  readonly trace: string;
  phase: ApprovedPngPhase;
  executable: {selection:'configured'|'default'; path:string|null; sha256:string}|null;
  browserProduct: string|null;
  versionCheck: 'not-reached'|'pending'|'matched'|'mismatched';
}
const expectedProductPrefix = 'Chrome/151.0.7922.173';
const knownExecutables = new Set(['/usr/bin/chromium','/usr/bin/chromium-browser','/usr/bin/google-chrome','/usr/bin/google-chrome-stable']);
const knownMessages = new Set([
  '批准渲染浏览器不可用','批准渲染连接失败','批准渲染超时','浏览器绘制失败','批准渲染浏览器已关闭',
  '批准浏览器版本不匹配','批准字体或整页尺寸不完整','批准PNG文件尺寸不完整','临时渲染目录未清理，未交付图片',
  '批准模板结构不匹配','批准字库及完整字库均缺少字符','字库缺失','批准模板SHA不匹配','图片生成队列已满',
  '图片输入超限','图片输入无效',
]);
const knownCodes = new Set(['ENOENT','EACCES','EPERM','EMFILE','ENFILE','ENOMEM','ETIMEDOUT','ECONNREFUSED','ECONNRESET','EPIPE','ENOTDIR','EISDIR','ENOSPC']);
const reported = new WeakSet<object>();
function read(value:unknown,key:string):unknown {try{return value!==null&&(typeof value==='object'||typeof value==='function')?Reflect.get(value,key):undefined;}catch{return undefined;}}
function errorType(error:unknown):string {
  try {
    if(error instanceof TypeError)return 'TypeError';
    if(error instanceof RangeError)return 'RangeError';
    if(error instanceof SyntaxError)return 'SyntaxError';
    if(error instanceof Error)return 'Error';
  }catch{/* hostile throw value: no diagnostic exception escapes */}
  return 'NonErrorThrow';
}
function stackFrames(error:unknown):Array<{file:string;line:number;column:number;chunkNameSHA256?:string}> {
  const stack=read(error,'stack');if(typeof stack!=='string')return [];
  const frames:Array<{file:string;line:number;column:number;chunkNameSHA256?:string}>=[];
  // Drop the message line, function names, directories and unknown/URL frames entirely.
  for(const line of stack.slice(0,16384).split('\n').slice(1)) {
    const m=line.match(/(?:^|[/(])((?:th-approved-png|approved-png-diagnostics)\.ts|route\.ts|[a-f0-9]{8,64}\.js):(\d{1,6}):(\d{1,6})\)?$/);
    if(!m){
      const compiled=line.match(/\/\.next\/server\/chunks\/([^/\r\n)]+\.js):(\d{1,6}):(\d{1,6})\)?$/);
      if(compiled)frames.push({file:'compiled-server-chunk',line:Number(compiled[2]),column:Number(compiled[3]),chunkNameSHA256:createHash('sha256').update(compiled[1]).digest('hex')});
      if(frames.length===8)break;
      continue;
    }
    // Generic route.ts is accepted only from this fixed route suffix, never arbitrary user paths.
    if(m[1]==='route.ts'&&!line.includes('/app/api/treehole/export-png/route.ts:'))continue;
    frames.push({file:m[1]==='route.ts'?'treehole/export-png/route.ts':m[1],line:Number(m[2]),column:Number(m[3])});
    if(frames.length===8)break;
  }
  return frames;
}
export function createApprovedPngDiagnostic(phase:ApprovedPngPhase='route'):ApprovedPngDiagnostic {
  return {trace:randomUUID(),phase,executable:null,browserProduct:null,versionCheck:'not-reached'};
}
export function setApprovedPngExecutable(d:ApprovedPngDiagnostic,path:string,configured:boolean):void {
  d.executable={selection:configured?'configured':'default',path:knownExecutables.has(path)?path:null,sha256:createHash('sha256').update(path).digest('hex')};
}
export function describeApprovedPngFailure(error:unknown,d:ApprovedPngDiagnostic) {
  const message=read(error,'message'),code=read(error,'code');const frames=stackFrames(error);
  return {
    trace:d.trace,phase:phases.includes(d.phase)?d.phase:'route',
    type:errorType(error),message:typeof message==='string'&&knownMessages.has(message)?message:'UNRECOGNIZED_DETAIL_OMITTED',
    code:typeof code==='string'&&knownCodes.has(code)?code:null,
    stackFrames:frames,stackUnavailableOrFiltered:frames.length===0,
    executable:d.executable,browserProduct:d.browserProduct,versionCheck:d.versionCheck,
  };
}
export function recordApprovedPngVersion(d:ApprovedPngDiagnostic,product:unknown):void {
  d.browserProduct=typeof product==='string'&&/^Chrome\/\d{1,4}\.\d{1,4}\.\d{1,5}\.\d{1,5}$/.test(product)?product:'UNRECOGNIZED_PRODUCT_OMITTED';
  d.versionCheck=typeof product==='string'&&product.startsWith(expectedProductPrefix)?'matched':'mismatched';
  // Best effort diagnostics must never change renderer behavior or expose arbitrary strings.
  try{console.info('[Treehole PNG diagnostic] version',JSON.stringify({timeUTC:new Date().toISOString(),trace:d.trace,phase:'version-check',executable:d.executable,browserProduct:d.browserProduct,versionCheck:d.versionCheck}));}catch{}
}
export function reportApprovedPngFailure(error:unknown,d:ApprovedPngDiagnostic):void {
  try {
    const object=error!==null&&(typeof error==='object'||typeof error==='function')?error as object:null;
    if(object&&reported.has(object))return;
    const safe=describeApprovedPngFailure(error,d);
    console.error('[Treehole PNG diagnostic] failure',JSON.stringify({timeUTC:new Date().toISOString(),...safe}));
    if(object)reported.add(object);
  }catch{/* logging is non-authoritative; retain the original error and external response */}
}
