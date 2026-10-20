// QM AI v13.10.0 — 苏州文化 / 苏州话 / 城市心理 Context Runtime
import fs from "fs";
import path from "path";
export type SuzhouConversationMode="self_support"|"culture_language"|"belonging_identity"|"family_relationship"|"work_city_life"|"housing_finance"|"professional_case"|"service_admin"|"none";
export interface SuzhouContext{mode:SuzhouConversationMode;relevance:number;dialectFollowAllowed:boolean;crisis:boolean;caseLike:boolean;likelyThemes:string[];}
export interface SuzhouKnowledgeUnit{id:string;theme:string;core_tension:string;angle:string;identity_frame:string;context:string;user_scene:string;xiaoku_understanding:string;xiaoku_possible_response:string;xiaoxue_rule:string;anti_stereotype:string[];confidence:string;}
const CASE=["我的来访者","我手上的个案","督导","case formulation"];
const ADMIN=["预约","费用","心理师","咨询师","档期","付款","退款","改期"];
const CRISIS=["想死","自杀","不想活","伤害自己"];
const SZ=/(?:苏州|姑苏|苏州工业园区|园区|SIP|高新区|虎丘|吴中|相城|吴江|昆山|常熟|张家港|太仓|花桥|盛泽|金鸡湖|太湖|新苏州人|苏州话|吴语|沪苏通勤)/g;
const RULES:Array<[string,RegExp]>=[
["方言与语言归属",/苏州话|吴语|方言|吴侬软语|口音|听得懂|不会说/],
["本地成长与新苏州人",/苏州人|新苏州人|本地人|祖籍|融入|归属|留下/],
["园区国际化与职业身份",/园区|SIP|金鸡湖|外企|研发|中新/],
["吴江与跨城流动",/吴江|盛泽|松陵|同里/],
["昆山与沪苏通勤",/昆山|花桥|沪苏|上海通勤/],
["常熟地方认同",/常熟|虞山/],
["张家港地方认同",/张家港|杨舍|港口/],
["太仓与沪苏连接",/太仓|沪太|上海/],
["制造业与开发区工作",/制造业|工厂|开发区|供应链|倒班/],
["外企与跨文化职场",/外企|跨国公司|英文|组织调整|裁员/],
["民营经济与家业责任",/民营|家族企业|接班|创业|做生意/],
["住房与留下来的确定感",/买房|租房|房价|婚房|置业/],
["教育与家庭期待",/教育|学校|升学|孩子|家长/],
["婚恋与家庭边界",/结婚|相亲|伴侣|父母|家庭|婚恋/],
["通勤与时间压力",/通勤|跨区|跨城|地铁|高铁|班车/],
["精致慢生活想象与高压现实",/慢生活|精致|园林|松弛|压力|加班/],
["文化符号与被误解经验",/园林|评弹|苏绣|水乡|温柔|说话软/],
["专业个案与行政服务",/来访者|个案|督导|预约|线上|线下|心理师/]
];
function themes(t:string){const a=RULES.filter(([,r])=>r.test(t)).map(([x])=>x);return a.length?[...new Set(a)].slice(0,3):(SZ.test(t)?["本地成长与新苏州人","通勤与时间压力"]:[]);}
export function detectSuzhouContext(message:string,history:string[]=[]):SuzhouContext{
 const text=[...history.slice(-8),message].join("\n"); const refs=(text.match(SZ)||[]).length; const caseLike=CASE.some(x=>text.includes(x)),crisis=CRISIS.some(x=>message.includes(x)),admin=ADMIN.some(x=>message.includes(x));
 let mode:SuzhouConversationMode="none"; if(caseLike)mode="professional_case"; else if(admin)mode="service_admin"; else if(/苏州话|吴语|方言|吴侬软语/.test(message))mode="culture_language"; else if(/归属|苏州人|新苏州人|本地人|祖籍|融入/.test(message))mode="belonging_identity"; else if(/父母|家庭|结婚|相亲|伴侣|教育/.test(message))mode="family_relationship"; else if(/工作|制造|外企|园区|开发区|创业|接班/.test(message))mode="work_city_life"; else if(/房租|买房|房价|婚房/.test(message))mode="housing_finance"; else if(refs)mode="self_support";
 const relevance=Math.min(1,refs*.16+(/苏州人|新苏州人|在苏州|苏州话|园区|昆山|太仓/.test(text)?.35:0)); return{mode,relevance,dialectFollowAllowed:!crisis&&/苏州话|吴语/.test(text),crisis,caseLike,likelyThemes:themes(text)};
}
export function suzhouStyleInstruction(ctx:SuzhouContext){const a=["苏州文化只能作为第二层上下文，不得覆盖用户个人经历。","不得使用‘苏州人都…’‘真正苏州人应该…’等群体定性。","不得凭方言、祖籍、区县、园区/外企/制造业职业推断身份、阶层、人格或诊断。","懂苏州优先体现为懂主城与县级市差异、沪苏双城、园区/开发区工作、制造外企、迁移通勤和被误解点，而不是堆园林评弹符号。","园林、评弹、苏绣、吴侬软语、‘温柔精致慢生活’都不能代表整个苏州或具体用户。","昆山、常熟、张家港、太仓有自身地方认同，不能被主城区经验吞掉。"];if(ctx.crisis)a.push("危机场景使用清晰标准中文，禁止方言或城市文化表演。");if(ctx.mode==="professional_case")a.push("专业个案优先专业模式；苏州线索只能作为竞争性文化假设并保留非地域解释。");if(ctx.mode==="service_admin")a.push("小雪只把苏州语境用于通勤、工作班次、线上线下和语言偏好；事实信息仍以QM verified数据为准。");return a;}
let mf:any=null;const cache=new Map<string,SuzhouKnowledgeUnit[]>();function kd(){return path.join(process.cwd(),"src","lib","knowledge");}function manifest(){if(mf)return mf;mf=JSON.parse(fs.readFileSync(path.join(kd(),"suzhou_shards","manifest.json"),"utf-8"));return mf;}function load(t:string){if(cache.has(t))return cache.get(t)!;const m=manifest().themes?.[t];if(!m)return[];const d=JSON.parse(fs.readFileSync(path.join(kd(),"suzhou_shards",m.file),"utf-8"));const a=(d.units||[]) as SuzhouKnowledgeUnit[];cache.set(t,a);return a;}
export function retrieveSuzhouCandidates(message:string,ctx:SuzhouContext,max=6){if(ctx.relevance<.16&&!ctx.likelyThemes.length)return[];const pool=(ctx.likelyThemes.length?ctx.likelyThemes:["本地成长与新苏州人"]).slice(0,2).flatMap(load);if(!pool.length)return[];const tokens=[...message.matchAll(/[\u4e00-\u9fffA-Za-z0-9]{2,}/g)].map(x=>x[0]);const scored=pool.map((u,i)=>({u,s:tokens.reduce((n,t)=>n+(u.user_scene.includes(t)||u.context.includes(t)||u.core_tension.includes(t)?1:0),0)-i/100000})).sort((a,b)=>b.s-a.s);return scored.slice(0,max).map(x=>x.u);}
export function buildSuzhouPromptBlock(ctx:SuzhouContext,cands:SuzhouKnowledgeUnit[],role:"xiaoku"|"xiaoxue"){if(ctx.relevance<.16&&!cands.length)return"";const l=["【苏州城市文化认知层】",...suzhouStyleInstruction(ctx).map(x=>"- "+x)];for(const c of cands.slice(0,4))l.push(`- ${c.theme}/${c.context}：${role==="xiaoku"?c.xiaoku_understanding:c.xiaoxue_rule}`);return l.join("\n");}
export function verifySuzhouOutput(output:string,ctx:SuzhouContext){const w:string[]=[];if(/真正(的)?苏州人|不算苏州人/.test(output))w.push("SZ-H001");if(/苏州人(都|就是|普遍)/.test(output))w.push("SZ-H002");if(!ctx.dialectFollowAllowed&&/吴侬软语|苏州话来讲/.test(output))w.push("SZ-H003");if(/因为.{0,12}(苏州|园区|昆山|常熟|张家港|太仓).{0,20}(所以|说明).{0,20}(人格|阶层|诊断|有钱)/.test(output))w.push("SZ-H004");if(/园林|评弹|苏绣/.test(output)&&/代表.{0,8}(苏州人|苏州文化全部)/.test(output))w.push("SZ-H005");if(ctx.crisis&&/吴侬软语|方言/.test(output))w.push("SZ-H007");if(ctx.mode==="professional_case"&&/就是因为.{0,8}(苏州人|苏州文化)/.test(output))w.push("SZ-H008");if(ctx.mode==="service_admin"&&/苏州人(比较|通常|一般)/.test(output))w.push("SZ-H009");if(/新苏州人.{0,10}(不如|比不上)|本地人.{0,10}(更高级|更正宗)/.test(output))w.push("SZ-H010");if(/苏州人.{0,12}(必须|应该).{0,12}(温柔|精致|含蓄|会过日子)/.test(output))w.push("SZ-H011");if(/住在.{0,12}(园区|金鸡湖|昆山|太仓).{0,16}(所以|说明).{0,16}(有钱|阶层|价值观)/.test(output))w.push("SZ-H012");return[...new Set(w)];}
export const SUZHOU_GUARDS=[
{id:"SZ-H001",level:"P0",description:"用方言/祖籍认证是不是苏州人"},{id:"SZ-H002",level:"P0",description:"苏州人群体定性"},{id:"SZ-H003",level:"P1",description:"用户未使用苏州话却强塞方言"},{id:"SZ-H004",level:"P0",description:"区域职业推断人格阶层诊断"},{id:"SZ-H005",level:"P1",description:"园林/评弹/苏绣等单一符号代表整个苏州"},{id:"SZ-H006",level:"P1",description:"苏州与上海或其他城市做地域优越/贬低"},{id:"SZ-H007",level:"P0",description:"危机回应被方言文化抢占"},{id:"SZ-H008",level:"P0",description:"专业个案把苏州身份当病因"},{id:"SZ-H009",level:"P1",description:"小雪行政场景以城市性格分析替代事实流程"},{id:"SZ-H010",level:"P1",description:"新苏州人与本地成长者价值排序"},{id:"SZ-H011",level:"P1",description:"要求用户符合温柔精致慢生活等苏州刻板人设"},{id:"SZ-H012",level:"P1",description:"居住区/园区/县级市/职业圈层推断收入价值观"}];
