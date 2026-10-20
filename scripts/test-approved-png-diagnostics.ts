import {strict as assert} from 'node:assert';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createApprovedPngDiagnostic,describeApprovedPngFailure,recordApprovedPngVersion,reportApprovedPngFailure,setApprovedPngExecutable} from '../src/lib/treehole/approved-png-diagnostics';

let count=0;
function test(name:string,fn:()=>void){fn();count++;console.log('PASS',name);}
const secret='PRIVATE_DIARY_AND_CREDENTIAL_VALUE';
const originalInfo=console.info, originalError=console.error;
const emitted:unknown[][]=[];
console.info=(...args:unknown[])=>{emitted.push(args)};
console.error=(...args:unknown[])=>{emitted.push(args)};
try {
  test('actual fixed executable/version mismatch is recorded, no gate execution',()=>{
    const d=createApprovedPngDiagnostic('version-check');setApprovedPngExecutable(d,'/usr/bin/chromium',true);recordApprovedPngVersion(d,'Chrome/154.0.8037.57');
    const v=describeApprovedPngFailure(new Error('批准浏览器版本不匹配'),d);
    assert.equal(v.phase,'version-check');assert.equal(v.message,'批准浏览器版本不匹配');assert.equal(v.browserProduct,'Chrome/154.0.8037.57');assert.equal(v.versionCheck,'mismatched');assert.equal(v.executable?.path,'/usr/bin/chromium');
  });
  test('original151 prefix match and unmatched version remain distinct',()=>{
    const d=createApprovedPngDiagnostic();recordApprovedPngVersion(d,'Chrome/151.0.7922.173');assert.equal(d.versionCheck,'matched');recordApprovedPngVersion(d,'Chrome/150.0.1.2');assert.equal(d.versionCheck,'mismatched');
  });
  test('private text/name/path/URL in error are never copied to log payload',()=>{
    const d=createApprovedPngDiagnostic('fonts');const e=new TypeError(secret+' https://user:password@example.test/?token='+secret);e.name=secret;e.stack=secret+'\n    at '+secret+' (/workspace/'+secret+'/src/lib/treehole/th-approved-png.ts:73:14)\n    at secret (https://user:password@example.test/'+secret+':2:3)';
    const v=describeApprovedPngFailure(e,d),json=JSON.stringify(v);assert.equal(v.type,'TypeError');assert.equal(v.message,'UNRECOGNIZED_DETAIL_OMITTED');assert.deepEqual(v.stackFrames,[{file:'th-approved-png.ts',line:73,column:14}]);assert(!json.includes(secret));assert(!json.includes('password'));assert(!json.includes('https:'));
  });
  test('filesystem error code survives while private message details are omitted',()=>{
    const e=Object.assign(new Error('ENOENT open /private/'+secret),{code:'ENOENT'});const v=describeApprovedPngFailure(e,createApprovedPngDiagnostic('template-read'));assert.equal(v.code,'ENOENT');assert.equal(v.message,'UNRECOGNIZED_DETAIL_OMITTED');
  });
  test('original Node launch cause and generic wrapper can both be retained safely',()=>{
    const d=createApprovedPngDiagnostic('launch');const cause=Object.assign(new Error('spawn /private/'+secret+' ENOENT'),{code:'ENOENT'});reportApprovedPngFailure(cause,d);reportApprovedPngFailure(new Error('批准渲染浏览器不可用'),d);const a=JSON.parse(emitted.at(-2)![1] as string),b=JSON.parse(emitted.at(-1)![1] as string);assert.equal(a.code,'ENOENT');assert.equal(a.message,'UNRECOGNIZED_DETAIL_OMITTED');assert.equal(b.message,'批准渲染浏览器不可用');assert.equal(a.trace,b.trace);
  });
  test('unknown executable only has fingerprint, not its secret directory',()=>{
    const d=createApprovedPngDiagnostic();const path='/private/'+secret+'/chromium';setApprovedPngExecutable(d,path,true);assert.equal(d.executable?.path,null);assert.equal(d.executable?.sha256,createHash('sha256').update(path).digest('hex'));assert(!JSON.stringify(d).includes(secret));
  });
  test('unknown product never logs arbitrary browser response',()=>{
    const d=createApprovedPngDiagnostic();recordApprovedPngVersion(d,'Chrome/'+secret);assert.equal(d.browserProduct,'UNRECOGNIZED_PRODUCT_OMITTED');assert(!JSON.stringify(d).includes(secret));
  });
  test('non-string product cannot execute toString in logger',()=>{
    const d=createApprovedPngDiagnostic();assert.doesNotThrow(()=>recordApprovedPngVersion(d,{toString(){throw new Error(secret)}}));assert.equal(d.versionCheck,'mismatched');
  });
  test('hostile error property getters cannot break reporting',()=>{
    const e={get message(){throw new Error(secret)},get stack(){throw new Error(secret)}};assert.doesNotThrow(()=>reportApprovedPngFailure(e,createApprovedPngDiagnostic()));const v=describeApprovedPngFailure(e,createApprovedPngDiagnostic());assert.equal(v.stackUnavailableOrFiltered,true);
  });
  test('non-Error throw does not publish thrown private string',()=>{
    const v=describeApprovedPngFailure(secret,createApprovedPngDiagnostic());assert.equal(v.type,'NonErrorThrow');assert(!JSON.stringify(v).includes(secret));
  });
  test('stack frames are bounded and arbitrary paths removed',()=>{
    const e=new Error(secret);e.stack=secret+'\n'+Array.from({length:40},(_,i)=>'    at hidden (/workspace/src/lib/treehole/th-approved-png.ts:'+(i+1)+':2)').join('\n');assert.equal(describeApprovedPngFailure(e,createApprovedPngDiagnostic()).stackFrames.length,8);
    e.stack=secret+'\n    at hidden (/private/'+secret+'/unknown.ts:1:2)';assert.equal(describeApprovedPngFailure(e,createApprovedPngDiagnostic()).stackUnavailableOrFiltered,true);
  });
  test('production compiled frame is fingerprinted for manifest mapping, no path disclosure',()=>{
    const e=new Error(secret);e.stack=secret+'\n    at hidden (/workspace/'+secret+'/.next/server/chunks/'+secret+'.js:1:47)';const v=describeApprovedPngFailure(e,createApprovedPngDiagnostic());assert.equal(v.stackFrames[0].file,'compiled-server-chunk');assert.equal(v.stackFrames[0].line,1);assert.equal(v.stackFrames[0].column,47);assert.equal(v.stackFrames[0].chunkNameSHA256,createHash('sha256').update(secret+'.js').digest('hex'));assert(!JSON.stringify(v).includes(secret));
  });
  test('renderer failure keeps first stage when outer route reports same error',()=>{
    const e=new Error('批准浏览器版本不匹配');const d=createApprovedPngDiagnostic('version-check');const before=emitted.length;reportApprovedPngFailure(e,d);d.phase='cleanup';reportApprovedPngFailure(e,d);reportApprovedPngFailure(e,createApprovedPngDiagnostic('route'));assert.equal(emitted.length,before+1);const v=JSON.parse(emitted.at(-1)![1] as string);assert.equal(v.phase,'version-check');
  });
  test('distinct cleanup error is recorded with same trace without masking first origin',()=>{
    const d=createApprovedPngDiagnostic('version-check');reportApprovedPngFailure(new Error('批准浏览器版本不匹配'),d);d.phase='cleanup';reportApprovedPngFailure(new Error('临时渲染目录未清理，未交付图片'),d);const a=JSON.parse(emitted.at(-2)![1] as string),b=JSON.parse(emitted.at(-1)![1] as string);assert.equal(a.trace,b.trace);assert.equal(a.phase,'version-check');assert.equal(b.phase,'cleanup');
  });
  test('logger failure cannot replace original failure',()=>{
    const sink=console.error;try{console.error=()=>{throw new Error('logger unavailable')};assert.doesNotThrow(()=>reportApprovedPngFailure(new Error(secret),createApprovedPngDiagnostic()));}finally{console.error=sink;}
  });
  test('all captured log payloads omit the private test value',()=>{assert(!JSON.stringify(emitted).includes(secret));});
  test('route external guard/error responses unchanged; no request invoked',()=>{
    const path='src/app/api/treehole/export-png/route.ts';const parent=execFileSync('git',['show','c140ea37ed38dea0d7d69712f77afd993907e82b:'+path],{encoding:'utf8'});const now=readFileSync(path,'utf8');assert.equal(now,parent.replace('import {createHash}', 'import {createApprovedPngDiagnostic,reportApprovedPngFailure} from "@/lib/treehole/approved-png-diagnostics";\nimport {createHash}').replace('    console.error("[Treehole PNG] 图片生成失败");','    reportApprovedPngFailure(error,createApprovedPngDiagnostic("route"));'));
  });
  test('151 guard, screenshot scale, network denylist and timeout remain original',()=>{
    const path='src/lib/treehole/th-approved-png.ts',parent=execFileSync('git',['show','c140ea37ed38dea0d7d69712f77afd993907e82b:'+path],{encoding:'utf8'}),now=readFileSync(path,'utf8');
    for(const literal of ['startsWith("Chrome/151.0.7922.173")','{width:1200,height:900,deviceScaleFactor:2,mobile:false}','{urls:["http://*","https://*","file://*"]}']){assert(parent.includes(literal));assert(now.includes(literal));}assert(now.includes('chromiumScreenshot(html,40000,diagnostic)'));
  });
} finally {console.info=originalInfo;console.error=originalError;}
console.log(JSON.stringify({passed:count,failed:0,mode:'pure diagnostic logic/static invariants; no browser/POST/service',capturedDiagnosticEvents:emitted.length}));
