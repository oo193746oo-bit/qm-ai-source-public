import type {NativePngRenderer} from "./letter-png";
import {drawLocalSerifFallback} from "./后备字形本地绘制";
import {PUBLIC_PNG_STYLE_VERSION, PUBLIC_PNG_STYLE_URL, publicPaperGeometry} from "@/lib/treehole/public-png-style";
/** 私人信件只在浏览器本地绘制。资源端仅收到纸张高度，不收到正文、标题或信件身份。 */
export const browserLetterPngRenderer:NativePngRenderer={
 version:"TREEHOLE_BROWSER_LOCAL_PUBLIC_STYLE_v3",
 async capture(request,signal){
  if(!request.document)throw new Error("图片渲染文档不存在");
  const doc=request.document;
  const check=()=>signal?.throwIfAborted();
  const wait=<T>(pending:Promise<T>):Promise<T>=>{
   check();if(!signal)return pending;
   return new Promise((resolve,reject)=>{
    const abort=()=>reject(signal.reason);signal.addEventListener("abort",abort,{once:true});
    pending.then(resolve,reject).finally(()=>signal.removeEventListener("abort",abort));
   });
  };
  check();
  if(request.heightCSS*2>32767||2400*request.heightCSS*2>64000000)throw new Error("当前浏览器不能安全绘制这封长信，未裁切或缩字");
  const paper=doc.querySelector<HTMLElement>(".correspondence")?.getBoundingClientRect();
  const brand=doc.querySelector<HTMLElement>(".export-brand")?.getBoundingClientRect();
  if(!paper||!brand||paper.x!==44||paper.y!==134||paper.width!==1112||brand.x!==44||brand.y!==44||brand.width!==1112||brand.height!==66)
   throw new Error("图片模板几何不一致，未生成不同样式的图片");
  const height64=Math.round(paper.height*64);
  if(publicPaperGeometry(height64).height!==request.heightCSS)throw new Error("图片模板全文高度不一致");
  const response=await wait(fetch(`${PUBLIC_PNG_STYLE_URL}?version=${encodeURIComponent(PUBLIC_PNG_STYLE_VERSION)}&height64=${height64}`,{signal,cache:"no-store",credentials:"omit"}));
  if(!response.ok||response.headers.get("X-QM-PNG-Style-Version")!==PUBLIC_PNG_STYLE_VERSION||!response.headers.get("Content-Type")?.startsWith("image/png"))
   throw new Error("图片样式资源暂时不可用，请稍后重试");
  const backgroundBlob=await wait(response.blob());
  const backgroundHeader=new DataView(await wait(backgroundBlob.slice(0,24).arrayBuffer()));
  if(backgroundHeader.byteLength!==24||backgroundHeader.getUint32(0)!==0x89504e47||backgroundHeader.getUint32(4)!==0x0d0a1a0a||backgroundHeader.getUint32(16)!==2400||backgroundHeader.getUint32(20)!==request.heightCSS*2)
   throw new Error("图片样式资源不完整，未生成截断图片");
  const source=new DOMParser().parseFromString(request.html,"text/html");
  // 图像中的 HTML 同样保留完整文档和简体语言，不能只复制 body 后依赖 SVG 的语言继承。
  source.documentElement.lang="zh-Hans";
  const localLayer=source.createElement("style");
  // 签名的 .signature span 有 !important 颜色；提高选择器优先级，避免后备字形在 SVG 和本地画布中绘制两次。
  localLayer.textContent="html,body{background:transparent!important}.correspondence{background:transparent!important;border-color:transparent!important;box-shadow:none!important}.correspondence:before{display:none!important}.export-brand{border-bottom-color:transparent!important}footer{opacity:0!important}.export-sheet [data-serif-fallback]{color:transparent!important}";
  source.head.appendChild(localLayer);
  const css=[...source.querySelectorAll("style")].map(style=>style.textContent).join("\n");
  if(!css||!source.querySelector(".export-sheet"))throw new Error("完整信件模板或字库没有进入渲染请求");
  const namespace="http://www.w3.org/2000/svg";
  const svg=document.implementation.createDocument(namespace,"svg",null);
  const root=svg.documentElement;
  root.setAttribute("width",String(request.widthCSS*request.scale));root.setAttribute("height",String(request.heightCSS*request.scale));
  root.setAttribute("viewBox",`0 0 ${request.widthCSS} ${request.heightCSS}`);
  root.setAttributeNS("http://www.w3.org/XML/1998/namespace","xml:lang","zh-CN");
  const style=svg.createElementNS(namespace,"style");style.textContent=css;root.appendChild(style);
  const foreign=svg.createElementNS(namespace,"foreignObject");foreign.setAttribute("width",String(request.widthCSS));foreign.setAttribute("height",String(request.heightCSS));
  foreign.appendChild(svg.importNode(source.documentElement,true));root.appendChild(foreign);
  // XMLSerializer处理用户文本中的不换行空格、&与尖括号，不使用HTML命名实体拼XML。
  const markup=new XMLSerializer().serializeToString(svg);
  const image=new Image();
  const background=new Image();
  const backgroundUrl=URL.createObjectURL(backgroundBlob);
  const canvas=doc.createElement("canvas");
  canvas.setAttribute("lang",doc.documentElement.lang||"zh-CN");
  try{
   canvas.width=2400;canvas.height=request.heightCSS*2;
   const context=canvas.getContext("2d",{alpha:false});
   if(!context)throw new Error("浏览器不能创建图片画布");
   if(!("letterSpacing" in context)||!("textRendering" in context)||!("fontKerning" in context))
    throw new Error("当前浏览器不支持完整字体排版，请使用支持这些能力的桌面浏览器重试");
   image.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(markup);background.src=backgroundUrl;
   await wait(Promise.all([image.decode(),background.decode()]));check();
   if(background.naturalWidth!==2400||background.naturalHeight!==request.heightCSS*2)throw new Error("图片样式解码后的尺寸不完整");
   const view=doc.defaultView;if(!view)throw new Error("图片渲染窗口不存在");
   context.drawImage(background,0,0);context.drawImage(image,0,0);
   drawLocalSerifFallback(context,doc,request.scale);check();
   const blob=await wait(new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error("PNG编码失败")),"image/png")));
   check();return {blob,letterId:request.letterId,revision:request.revision,rendererVersion:request.rendererVersion};
  }finally{
   image.src="";background.src="";URL.revokeObjectURL(backgroundUrl);image.onload=null;image.onerror=null;canvas.width=0;canvas.height=0;
  }
 }
};
