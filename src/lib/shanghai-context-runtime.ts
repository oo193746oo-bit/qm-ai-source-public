// QM AI v13.6.1 — 上海文化 / 上海话 / 城市心理 Context Runtime（分片检索修复版）
// 关键修复：不再依赖单个74MB pack_shanghai.json；按主题懒加载分片。

import fs from "fs";
import path from "path";

export type ShanghaiIdentityMode =
  | "explicit_local_identity" | "explicit_new_shanghainese" | "resident" | "past_resident"
  | "ancestry_only" | "dialect_user" | "visitor_or_interest" | "unknown";
export type ShanghaiConversationMode =
  | "self_support" | "culture_language" | "belonging_identity" | "family_relationship"
  | "work_city_life" | "housing_finance" | "professional_case" | "service_admin" | "none";

export interface ShanghaiContext {
  identityMode: ShanghaiIdentityMode;
  mode: ShanghaiConversationMode;
  relevance: number;
  dialectFollowAllowed: boolean;
  proactiveShanghaiAllowed: boolean;
  crisis: boolean;
  caseLike: boolean;
  adminLike: boolean;
  likelyThemes: string[];
}

export interface ShanghaiKnowledgeUnit {
  id:string; theme:string; core_tension:string; angle:string; identity_frame:string; context:string;
  user_scene:string; xiaoku_understanding:string; xiaoku_possible_response:string; xiaoxue_rule:string;
  anti_stereotype:string[]; confidence:string;
}

const EXPLICIT_IDENTITY=["我是上海人","我是老上海人","我是本地人","我祖籍上海","我是新上海人","我在上海长大","上海是我家"];
const RESIDENT=["住在上海","在上海工作","搬来上海","来上海很多年","沪漂","回上海","回沪","上海生活"];
const DIALECT=["阿拉","侬","伊拉","哪能","好伐","勿要","白相","拎得清","拎勿清","结棍","嗲","清清爽爽","事体","辰光","今朝"];
const CASE_MARKERS=["我的来访者","我手上的个案","来访者说","咨询个案","督导","case formulation"];
const ADMIN=["预约","费用","心理师","咨询师","档期","付款","退款","改期","线下地址"];
const CRISIS=["想死","自杀","不想活","伤害自己","割腕","跳楼"];
const SH_RE=/上海|浦东|浦西|黄浦|静安|徐汇|长宁|虹口|杨浦|普陀|闵行|宝山|嘉定|松江|青浦|奉贤|金山|崇明|临港|陆家嘴|张江|五角场|徐家汇|古北|虹桥|苏州河|黄浦江|弄堂|石库门/g;

const THEME_RULES: Array<[string,RegExp]> = [
  ["方言",/上海话|方言|沪语|口音|阿拉|侬|勿要|好伐|会听不会说/],
  ["归属感",/归属|是不是上海人|新上海人|老上海人|本地人|祖籍|沪漂|融入|外地人/],
  ["身份门槛",/户口|身份|门槛|正宗|真正上海人|排外|地域/],
  ["家庭",/父母|姆妈|爷娘|原生家庭|家里人|长辈|养老/],
  ["婚恋",/结婚|婚房|伴侣|对象|相亲|离婚|婆媳|岳父母/],
  ["住房",/房租|买房|房价|老破小|学区|拆迁|产权|租房/],
  ["职场",/工作|职场|加班|跳槽|外企|金融|互联网|同事|老板/],
  ["效率",/效率|时间|排队|通勤|准时|节奏|快/],
  ["金钱",/钱|收费|消费|性价比|精打细算|预算|贵|便宜/],
  ["体面",/体面|腔调|讲究|失态|难堪|面子/],
  ["品质",/品质|服务|细节|干净|清爽|标准|体验/],
  ["边界",/边界|分寸|麻烦别人|拎得清|客气|隐私/],
  ["迁移",/搬来|离开上海|回沪|回乡|海归|留学|移民|沪漂/],
  ["城市变化",/城市更新|拆迁|老城|变化|小时候|以前的上海|消失/],
  ["孤独",/孤独|一个人|没人懂|城市很大|没有朋友/],
  ["邻里",/邻居|社区|弄堂|小区|居委|菜场/],
  ["国际化",/外企|外国人|国际|海归|海外|跨文化|语言/],
  ["LGBTQ",/LGBTQ|同性|出柜|酷儿|性取向|跨性别/],
  ["性别角色",/男人|女人|女性|男性|性别|贤惠|养家/],
  ["代际",/70后|80后|90后|00后|长辈|年轻人|老一辈|代际/],
  ["刻板印象",/上海人都|抠门|精明|势利|排外|娇气|优越感|刻板印象/],
  ["规则",/规则|规矩|秩序|流程|排队|守时|契约/],
];

function countHits(text:string, arr:string[]){ return arr.filter(x=>text.includes(x)).length; }
function inferThemes(text:string):string[]{
  const hit=THEME_RULES.filter(([,re])=>re.test(text)).map(([t])=>t);
  if(hit.length===0 && SH_RE.test(text)) return ["归属感","边界"];
  return [...new Set(hit)].slice(0,3);
}

export function detectShanghaiContext(message:string, history:string[]=[]):ShanghaiContext {
  const text=[...history.slice(-8),message].join("\n");
  const explicit=countHits(text,EXPLICIT_IDENTITY), resident=countHits(text,RESIDENT), dialect=countHits(text,DIALECT);
  const shanghaiRefs=(text.match(SH_RE)||[]).length;
  const caseLike=CASE_MARKERS.some(x=>text.includes(x)), adminLike=ADMIN.some(x=>message.includes(x)), crisis=CRISIS.some(x=>message.includes(x));
  let identityMode:ShanghaiIdentityMode="unknown";
  if(/我是新上海人|新上海人/.test(text)) identityMode="explicit_new_shanghainese";
  else if(/我是上海人|我是老上海人|我是本地人|上海是我家|我在上海长大/.test(text)) identityMode="explicit_local_identity";
  else if(/祖籍上海/.test(text)) identityMode="ancestry_only";
  else if(resident>=1) identityMode="resident";
  else if(dialect>=2) identityMode="dialect_user";
  else if(shanghaiRefs>=1) identityMode="visitor_or_interest";
  let mode:ShanghaiConversationMode="none";
  if(caseLike) mode="professional_case";
  else if(adminLike) mode="service_admin";
  else if(/上海话|方言|沪语|口音|阿拉|侬|勿要|好伐/.test(message)) mode="culture_language";
  else if(/归属|是不是上海人|新上海人|老上海人|本地人|祖籍|户口|排外|外地人|沪漂/.test(message)) mode="belonging_identity";
  else if(/父母|姆妈|爷娘|婚姻|结婚|婚房|伴侣|婆媳|家庭/.test(message)) mode="family_relationship";
  else if(/工作|职场|加班|通勤|跳槽|外企|金融|互联网/.test(message)) mode="work_city_life";
  else if(/房租|买房|房价|学区|产权|拆迁|老破小/.test(message)) mode="housing_finance";
  else if(shanghaiRefs+resident+explicit+dialect>=2) mode="self_support";
  const relevance=Math.min(1,explicit*.35+resident*.18+dialect*.12+shanghaiRefs*.08);
  return { identityMode, mode, relevance, dialectFollowAllowed:!crisis&&dialect>=1&&relevance>=.35, proactiveShanghaiAllowed:!crisis&&!caseLike&&relevance>=.55, crisis, caseLike, adminLike, likelyThemes:inferThemes(text) };
}

export function shanghaiStyleInstruction(ctx:ShanghaiContext):string[]{
  const base=[
    "上海文化只能作为第二层上下文，不得覆盖用户个人经历。",
    "不得用‘上海人都…’、‘真正上海人应该…’等群体定性。",
    "不得凭口音、上海话、户口、祖籍、消费习惯推断用户身份、阶层、人格或诊断。",
    "懂上海优先体现为懂分寸、懂城市生活脚本、懂被误解点，而不是堆上海话。",
    "城市比较只比较具体生活脚本，不做城市优越排名。",
  ];
  if(ctx.crisis) base.push("当前危机场景：使用清晰标准中文，禁止方言炫技或文化隐喻抢占安全回应。");
  if(ctx.dialectFollowAllowed) base.push("用户已主动使用上海话，可每次最多轻量跟随1-2个高置信度词；生僻词必要时附普通话解释。");
  else base.push("用户未主动使用上海话时，默认标准中文；不要为了显得懂上海强行说方言。");
  if(ctx.mode==="professional_case") base.push("专业个案讨论优先专业模式与去身份化；上海线索只能作为文化假设，不能替来访者下地域结论。");
  if(ctx.mode==="service_admin") base.push("小雪/预约场景优先事实准确；上海语境可用于理解通勤、线上线下、语言偏好，不做文化心理分析。");
  return base;
}

let shardManifest:any|null=null;
const shardCache=new Map<string,ShanghaiKnowledgeUnit[]>();
function knowledgeDir(){ return path.join(process.cwd(),"src","lib","knowledge"); }
function getManifest(){
  if(shardManifest) return shardManifest;
  const p=path.join(knowledgeDir(),"shanghai_shards","manifest.json");
  shardManifest=JSON.parse(fs.readFileSync(p,"utf-8")); return shardManifest;
}
function loadTheme(theme:string):ShanghaiKnowledgeUnit[]{
  if(shardCache.has(theme)) return shardCache.get(theme)!;
  const meta=getManifest().themes?.[theme]; if(!meta) return [];
  const p=path.join(knowledgeDir(),"shanghai_shards",meta.file);
  const data=JSON.parse(fs.readFileSync(p,"utf-8")); const arr=(data.units||[]) as ShanghaiKnowledgeUnit[];
  shardCache.set(theme,arr); return arr;
}
function scoreUnit(u:ShanghaiKnowledgeUnit,message:string,ctx:ShanghaiContext):number{
  let s=0;
  if(ctx.likelyThemes.includes(u.theme)) s+=8;
  const fields=[u.core_tension,u.angle,u.identity_frame,u.context,u.user_scene].join(" ");
  for(const token of message.match(/[\u4e00-\u9fff]{2,6}/g)||[]) if(fields.includes(token)) s+=2;
  if(ctx.mode==="family_relationship" && /家庭|亲密关系|原生家庭|婚恋/.test(u.context+u.theme)) s+=3;
  if(ctx.mode==="work_city_life" && /职场|通勤|工作/.test(u.context+u.theme)) s+=3;
  if(ctx.mode==="housing_finance" && /住房|买房|租赁|金钱/.test(u.context+u.theme)) s+=3;
  if(ctx.mode==="culture_language" && u.theme==="方言") s+=5;
  if(ctx.mode==="belonging_identity" && /归属感|身份门槛|迁移/.test(u.theme)) s+=4;
  return s;
}
export function retrieveShanghaiCandidates(message:string,ctx:ShanghaiContext,max=6):ShanghaiKnowledgeUnit[]{
  if(ctx.relevance<.16 && ctx.likelyThemes.length===0) return [];
  const themes=ctx.likelyThemes.length?ctx.likelyThemes:["归属感","边界"];
  const pool=themes.slice(0,2).flatMap(loadTheme);
  return pool.map(u=>({u,s:scoreUnit(u,message,ctx)})).filter(x=>x.s>0).sort((a,b)=>b.s-a.s).slice(0,max).map(x=>x.u);
}
export function buildShanghaiPromptBlock(ctx:ShanghaiContext,cands:ShanghaiKnowledgeUnit[],role:"xiaoku"|"xiaoxue"):string{
  if(ctx.relevance<.16 && cands.length===0) return "";
  const lines=["【上海城市文化认知层】",...shanghaiStyleInstruction(ctx).map(x=>"- "+x)];
  if(cands.length){ lines.push("可参考的上海语境单元（只作为假设，不得当用户事实）："); for(const c of cands.slice(0,4)){ lines.push(`- ${c.theme} / ${c.context}：${role==="xiaoku"?c.xiaoku_understanding:c.xiaoxue_rule}`); } }
  return lines.join("\n");
}
export function verifyShanghaiOutput(output:string,ctx:ShanghaiContext):string[]{
  const w:string[]=[];
  const rules:[string,RegExp][]=[
    ["SH-H001",/真正(的)?上海人|你才算上海人|不算上海人/],
    ["SH-H002",/上海人(都|就是|一向|普遍).{0,12}(精明|抠门|排外|势利|优越)/],
    ["SH-H004",/(因为|既然)你.{0,8}(上海|浦东|浦西|祖籍).{0,20}(所以|说明).{0,20}(人格|阶层|抑郁|焦虑|诊断)/],
    ["SH-H006",/(上海|北京|深圳|广州).{0,10}(更高级|比.{0,8}强|不如上海|低一等)/],
  ];
  for(const [id,re] of rules) if(re.test(output)) w.push(id);
  if(ctx.crisis && /阿拉|侬|好伐|勿要|白相/.test(output)) w.push("SH-H007");
  if(ctx.mode==="professional_case" && /就是因为(他|她|来访者)是上海人/.test(output)) w.push("SH-H008");
  return [...new Set(w)];
}

export const SHANGHAI_GUARDS=[
  {id:"SH-H001",level:"P0",description:"用方言/口音认证用户是不是上海人"},{id:"SH-H002",level:"P0",description:"上海人群体定性"},
  {id:"SH-H003",level:"P1",description:"用户未使用上海话却强塞方言"},{id:"SH-H004",level:"P0",description:"户口祖籍区域推断人格阶层诊断"},
  {id:"SH-H005",level:"P1",description:"中心城区经验当整个上海唯一标准"},{id:"SH-H006",level:"P1",description:"地域优越/贬低"},
  {id:"SH-H007",level:"P0",description:"危机回应被方言文化抢占"},{id:"SH-H008",level:"P0",description:"专业个案把上海身份当病因"},
  {id:"SH-H009",level:"P1",description:"小雪行政场景以文化分析替代事实流程"},{id:"SH-H010",level:"P0",description:"主动使用贬损方言称呼用户"},
  {id:"SH-H011",level:"P1",description:"老上海/新上海/本地人固定单一定义"},{id:"SH-H012",level:"P1",description:"消费偏好推断上海身份或阶层"},
];
