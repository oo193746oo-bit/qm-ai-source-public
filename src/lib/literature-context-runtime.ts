import fs from "fs";
import path from "path";

export type LiteratureThemeCode = "longing"|"intimacy"|"lonely"|"grief"|"self_identity"|"hope"|"family"|"friendship"|"nostalgia"|"anger_boundary"|"existential"|"exile_culture";
export interface LiteratureOpportunityContext { explicitLiteratureRequest:boolean; userOptOut:boolean; crisisLike:boolean; professionalCaseLike:boolean; themeSignals:LiteratureThemeCode[]; dominantTheme?:LiteratureThemeCode; proactiveEligible:boolean; reason:string; }
export interface LiteratureWork { id:string; author:string; title:string; era:string; genre:string; theme_code:LiteratureThemeCode; semantic_summary:string; semantic_confidence:"high"|"medium"|"low"; proactive_recommendation_enabled:boolean; copyright_mode:string; full_text_included:boolean; }
export interface LiteratureCandidate { work:LiteratureWork; score:number; reasons:string[]; }
let _works: LiteratureWork[]|null=null;
function loadWorks():LiteratureWork[]{ if(_works)return _works; try{ const p=path.join(process.cwd(),"src","lib","knowledge","literature_work_registry.json"); if(!fs.existsSync(p))return []; const d=JSON.parse(fs.readFileSync(p,"utf-8")); _works=d.works||[]; return _works||[];}catch(e){console.warn("[literature] load failed",e);return [];} }
function uniq<T>(x:T[]):T[]{return [...new Set(x)]}
function detectThemes(text:string):LiteratureThemeCode[]{ const tests:Array<[LiteratureThemeCode,RegExp]>=[
["longing",/想念|怀念|舍不得|回不去|远距离|异地|故乡|miss|longing/i],["intimacy",/恋爱|亲密|伴侣|暧昧|分手|前任|爱上|relationship|love/i],["lonely",/孤独|寂寞|没人懂|一个人|疏离|lonely|alone/i],["grief",/去世|死亡|离世|失去.*人|哀伤|丧亲|告别|grief/i],["self_identity",/我是谁|身份|自我价值|做自己|自卑|不够好|identity|self.?worth/i],["hope",/重新开始|坚持|希望|勇气|撑下去|振作|start over|hope/i],["family",/父母|妈妈|爸爸|家庭|原生家庭|亲人|family/i],["friendship",/朋友|友情|闺蜜|兄弟|友谊|绝交|friendship/i],["nostalgia",/青春|小时候|毕业|旧时光|怀旧|过去|nostalgia/i],["anger_boundary",/愤怒|生气|不公平|被控制|边界|背叛|angry|boundary/i],["existential",/意义|活着.*为了什么|人生|荒诞|死亡焦虑|存在|existential|meaning/i],["exile_culture",/海外|留学|移民|异乡|故乡|文化差异|回国|漂泊|diaspora|immigrant/i]]; return tests.filter(([,r])=>r.test(text)).map(([t])=>t); }
export function analyzeLiteratureOpportunity(userText:string,history:string[],role:"xiaoku"|"xiaoxue"):LiteratureOpportunityContext{
 const all=`${history.slice(-10).join("\n")}\n${userText}`;
 const explicitLiteratureRequest=/诗|诗词|文学|小说|散文|作品|书|阅读|作家|诗人|哪本书|推荐.*书|literature|poem|novel|book/i.test(userText);
 const userOptOut=/不要.*诗|不想看书|别推荐.*书|别引用|不要文学|no literature|no book/i.test(all);
 const crisisLike=/自杀|想死|不想活|结束生命|伤害自己|自残|suicid|self.?harm/i.test(userText);
 const professionalCaseLike=/我的来访者|我的个案|我手上的个案|会谈中|督导|case discussion/i.test(userText);
 const themeSignals=uniq(detectThemes(userText)); const recentUsed=/让我想到.*(?:诗|作品|小说|书)|推荐你.*(?:诗|书|作品)|这部作品|这首诗/.test(history.slice(-8).join("\n"));
 const proactiveEligible=role==="xiaoku"&&!explicitLiteratureRequest&&!userOptOut&&!crisisLike&&!professionalCaseLike&&!recentUsed&&history.length>=1&&themeSignals.length>=1;
 const reason=crisisLike?"危机优先，文学不得抢占安全响应":userOptOut?"用户拒绝文学连接":professionalCaseLike?"专业个案讨论不主动插入文学":explicitLiteratureRequest?"用户明确提出诗词/文学需求":proactiveEligible?"存在高贴合情绪/关系主题，可低频用作品建立共情桥梁":"当前无需主动文学介入";
 return {explicitLiteratureRequest,userOptOut,crisisLike,professionalCaseLike,themeSignals,dominantTheme:themeSignals[0],proactiveEligible,reason}; }
export function retrieveLiteratureCandidates(ctx:LiteratureOpportunityContext,role:"xiaoku"|"xiaoxue",limit=5):LiteratureCandidate[]{ if(ctx.userOptOut||ctx.crisisLike)return []; if(role==="xiaoxue"&&!ctx.explicitLiteratureRequest)return []; const out:LiteratureCandidate[]=[]; for(const work of loadWorks()){let score=0;const reasons:string[]=[]; if(ctx.dominantTheme&&work.theme_code===ctx.dominantTheme){score+=.58;reasons.push("主题贴合")} else if(ctx.themeSignals.includes(work.theme_code)){score+=.38;reasons.push("次级主题贴合")} if(work.semantic_confidence==="high"){score+=.22;reasons.push("语义高置信度")} if(work.proactive_recommendation_enabled)score+=.10; if(ctx.explicitLiteratureRequest)score+=.10; out.push({work,score,reasons}); } return out.sort((a,b)=>b.score-a.score).slice(0,limit); }
export function buildLiteraturePromptBlock(ctx:LiteratureOpportunityContext,candidates:LiteratureCandidate[],role:"xiaoku"|"xiaoxue"):string{
 if(ctx.userOptOut||ctx.crisisLike)return ""; if(!ctx.explicitLiteratureRequest&&!ctx.proactiveEligible)return ""; if(role==="xiaoxue"&&!ctx.explicitLiteratureRequest)return "";
 const lines=["【诗词文学共情运行层】",`当前模式：${ctx.explicitLiteratureRequest?"用户主动询问":"小酷可主动轻量连接"}。原因：${ctx.reason}`,
 "先回应用户本人，再考虑作品。文学只能是共情桥梁、隐喻、视角或阅读建议，不是治疗，不是诊断证据。",
 "默认只提1部/1首；用户明确要书单/诗单时最多3部。最近8轮已经使用过文学连接时不要再次主动使用。",
 "不要因为用户喜欢某位作家或作品就推断人格、阶层、性取向、依恋类型、创伤或诊断。",
 "版权规则：现代/仍受版权保护作品不得输出整篇、整首或长段逐字文本；默认只用语义摘要。古典公版作品即使可以引用，也优先短引1-2句，不用背诵取代对话。若作品文本未核验，不要声称‘原文是’。"];
 if(candidates.length){lines.push("候选作品（只从下列候选中选择，不要现场编作者/书名）："); for(const c of candidates.slice(0,5)) lines.push(`- ${c.work.author}《${c.work.title}》｜${c.work.era}｜${c.work.genre}｜语义：${c.work.semantic_summary}｜score=${c.score.toFixed(2)}`)}
 lines.push("主动连接示例（不是固定模板）：‘你刚才说的___，让我想到一部/一首作品。不是因为你的故事和它一样，而是其中那种___很接近。如果你愿意，我可以只借它的一点点意象陪你看看。’");
 if(role==="xiaoxue")lines.push("小雪边界：只在用户明确问诗词/文学/阅读时简短回应；预约、费用、心理师流程中不主动转为文学推荐。情绪支持必要时交回小酷。"); return lines.join("\n"); }
export function verifyLiteratureOutput(output:string,ctx:LiteratureOpportunityContext|undefined,role:"xiaoku"|"xiaoxue"){
 const v:Array<{id:string;level:"P0"|"P1";description:string}>=[]; if(!ctx)return v;
 if(ctx.userOptOut&&/想到.*(?:诗|作品|小说|书)|推荐.*(?:诗|书|作品)|读读/.test(output))v.push({id:"LIT-H001",level:"P0",description:"用户拒绝文学后仍继续推荐"});
 if(ctx.crisisLike&&/推荐.*(?:诗|书|作品)|想到.*(?:诗|作品)|读读/.test(output))v.push({id:"LIT-H002",level:"P0",description:"危机场景文学抢占安全响应"});
 if(role==="xiaoxue"&&!ctx.explicitLiteratureRequest&&/推荐.*(?:诗|书|作品)|想到.*(?:诗|作品)/.test(output))v.push({id:"LIT-H003",level:"P1",description:"小雪在非文学请求中主动引用文学，偏离行政角色"});
 if(/这(?:本书|首诗|部作品)一定会治愈你|读完就会好|最适合你|保证.*有效/.test(output))v.push({id:"LIT-H004",level:"P1",description:"夸大文学为治疗或保证性效果"});
 if(/因为你喜欢.*所以你(?:一定|就是)|这说明你(?:是|有)/.test(output))v.push({id:"LIT-H005",level:"P1",description:"从文学偏好过度推断用户身份/人格"});
 const quoted=[...output.matchAll(/[“\"]([^”\"]+)[”\"]/g)].map(m=>m[1]); for(const q of quoted){const words=q.trim().split(/\s+/).filter(Boolean).length;const cjk=(q.match(/[\u4e00-\u9fff]/g)||[]).length;if(cjk>80||words>25){v.push({id:"LIT-H006",level:"P0",description:"疑似输出过长版权文本或未经核验长引文"});break;}}
 return v;
}
