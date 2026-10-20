import {createApprovedPngDiagnostic,reportApprovedPngFailure} from "@/lib/treehole/approved-png-diagnostics";
import {createHash} from "node:crypto";
import {NextRequest} from "next/server";
import {APPROVED_PNG_VERSION,captureApprovedPng} from "@/lib/treehole/th-approved-png";
import type {LetterPngSnapshot} from "@/components/treehole/letter-png";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const noStore={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer"};
const invalid=()=>new Response("图片输入无效",{status:400,headers:noStore});
const maxBodyBytes=400000;
async function readBoundedBody(request:NextRequest):Promise<string>{
  if(!request.body)throw new Error("图片输入无效");
  const reader=request.body.getReader();
  const bytes=new Uint8Array(maxBodyBytes);
  let size=0;
  try{
    for(;;){
      const {done,value}=await reader.read();
      if(done)break;
      if(value.byteLength>maxBodyBytes-size)throw new Error("图片输入超限");
      bytes.set(value,size);
      size+=value.byteLength;
    }
  }finally{reader.releaseLock();}
  try{return new TextDecoder("utf-8",{fatal:true}).decode(bytes.subarray(0,size));}
  catch{throw new Error("图片输入无效");}
}
function valid(value:unknown):value is LetterPngSnapshot{
  if(!value||typeof value!=="object")return false;
  const v=value as Record<string,unknown>;
  for(const field of ["letterId","revision","dateKey","dateDisplay","authorLabel","title","salutation","signature","signatureDescription"]){if(typeof v[field]!=="string"||(v[field] as string).length>300)return false;}
  if(typeof v.isCrisis!=="boolean"||v.isCrisis||!Array.isArray(v.paragraphs)||v.paragraphs.length<1||v.paragraphs.length>80||!v.paragraphs.every(p=>typeof p==="string"&&p.length<=4000))return false;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(v.dateKey as string)||!(v.paragraphs as string[]).some(p=>p.trim()))return false;
  const [year,month,day]=(v.dateKey as string).split("-").map(Number);
  const date=new Date(Date.UTC(year,month-1,day));
  if(year<100||date.getUTCFullYear()!==year||date.getUTCMonth()!==month-1||date.getUTCDate()!==day)return false;
  return true;
}
export async function POST(request:NextRequest){
  const origin=request.headers.get("origin");
  const host=request.headers.get("host");
  let sameOrigin=false;
  try{
    const parsed=new URL(origin||"");
    sameOrigin=Boolean(host&&parsed.host===host&&(parsed.protocol==="https:"||((parsed.hostname==="localhost"||parsed.hostname==="127.0.0.1")&&parsed.protocol==="http:")));
  }catch{}
  if(!sameOrigin)return new Response("同源请求必需",{status:403,headers:noStore});
  if(!request.headers.get("content-type")?.startsWith("application/json"))return invalid();
  if(Number(request.headers.get("content-length")||0)>maxBodyBytes)return invalid();
  try{
    const raw=await readBoundedBody(request);
    let input:Record<string,unknown>;
    try{input=JSON.parse(raw) as Record<string,unknown>;}
    catch{return invalid();}
    if(input.rendererVersion!==APPROVED_PNG_VERSION||!valid(input.snapshot))return invalid();
    const snapshot=input.snapshot;
    const rendered=await captureApprovedPng(snapshot);
    const key=createHash("sha256").update(JSON.stringify([snapshot.letterId,snapshot.revision])).digest("hex");
    return new Response(new Uint8Array(rendered.png),{headers:{...noStore,"Content-Type":"image/png","Content-Length":String(rendered.png.length),"X-QM-Renderer-Version":APPROVED_PNG_VERSION,"X-QM-Letter-Key":key,"X-QM-Image-Height-CSS":String(rendered.heightCSS)}});
  }catch(error){
    if(error instanceof Error&&(error.message==="图片输入超限"||error.message==="图片输入无效"))return invalid();
    reportApprovedPngFailure(error,createApprovedPngDiagnostic("route"));
    return new Response("图片生成失败",{status:503,headers:noStore});
  }
}
