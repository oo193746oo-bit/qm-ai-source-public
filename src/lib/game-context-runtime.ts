import fs from "fs";
import path from "path";

export type GamingThemeCode = "achievement_rank"|"tilt_frustration"|"social_belonging"|"teammate_conflict"|"toxicity_harassment"|"identity_avatar"|"gender_expression"|"escapism"|"flow_mastery"|"grind_burnout"|"fomo_live_service"|"gacha_spending"|"sunk_cost"|"completionism"|"comparison"|"nostalgia"|"grief_ending"|"parasocial_fandom"|"relationship_coop"|"family_conflict"|"time_guilt"|"sleep_routine"|"career_esports"|"performance_anxiety"|"leadership"|"raid_progression"|"online_friendship"|"cross_culture"|"accessibility"|"neurodiversity";
export interface GamingContext { explicitGameRequest:boolean; userOptOut:boolean; crisisLike:boolean; professionalCaseLike:boolean; gameMentionLike:boolean; gamingProfessionalLike:boolean; themes:GamingThemeCode[]; dominantTheme?:GamingThemeCode; proactiveEligible:boolean; reason:string; }
export interface GameRecord { id:string; title:string; era_band:string; genre_family:string; likely_formative_cohorts:string[]; psych_theme_codes:GamingThemeCode[]; usage_summary:string; proactive_reference_enabled:boolean; current_relevance:string; no_infer:string; }
export interface GameCandidate { game:GameRecord; score:number; reasons:string[]; }
let _games:GameRecord[]|null=null;
function loadGames():GameRecord[]{ if(_games)return _games; try{const p=path.join(process.cwd(),"src","lib","knowledge","game_registry_560.json"); if(!fs.existsSync(p))return []; const d=JSON.parse(fs.readFileSync(p,"utf-8")); _games=d.games||[];return _games||[];}catch(e){console.warn("[gaming] load failed",e);return [];} }
function uniq<T>(x:T[]):T[]{return [...new Set(x)]}
const THEME_TESTS:Array<[GamingThemeCode,RegExp]>=[
["achievement_rank",/排位|段位|胜率|掉分|上分|rank|mmr|elo|天梯/i],["tilt_frustration",/连败|破防|红温|tilt|气死|手感差|一直输|rage quit/i],["social_belonging",/公会|战队|固定队|一起玩|开黑|guild|clan|static/i],["teammate_conflict",/队友|甩锅|指挥|配合|队内|teammate|shotcall/i],["toxicity_harassment",/辱骂|喷人|歧视|骚扰|toxic|flame|被骂/i],["identity_avatar",/捏脸|角色扮演|avatar|化身|我的角色|OC/i],["gender_expression",/性别选项|男体|女体|body type|pronoun|代词|中性角色/i],["escapism",/逃避|不想面对|只想玩游戏|躲进游戏|escape/i],["flow_mastery",/心流|沉浸|练技术|变强|练习|掌握|flow/i],["grind_burnout",/肝|刷材料|重复任务|累死|日常像上班|grind|burnout/i],["fomo_live_service",/限时|赛季|通行证|错过|复刻|FOMO|battle pass|daily/i],["gacha_spending",/抽卡|保底|氪金|卡池|歪了|出货|gacha|pity|whale/i],["sunk_cost",/沉没成本|退坑|舍不得退|账号投入|花了很多钱|玩了好多年/i],["completionism",/白金|全成就|全收集|百分百|completionist|100%/i],["comparison",/战力|面板|排行榜|别人都|装备评分|parse|比较/i],["nostalgia",/小时候玩的|童年游戏|怀旧|以前一起玩|老游戏|nostalgia/i],["grief_ending",/通关后空虚|结局|角色死了|舍不得通关|游戏结束|post-game/i],["relationship_coop",/和对象玩|情侣游戏|合作游戏|双人成行|co-op|一起开黑/i],["family_conflict",/爸妈不让我玩|家里觉得游戏|对象嫌我玩|孩子打游戏|family/i],["time_guilt",/浪费时间|玩完内疚|本来该学习|耽误工作|backlog guilt/i],["sleep_routine",/熬夜开黑|睡不够|凌晨还在玩|日常没清|睡眠/i],["career_esports",/电竞|职业选手|主播|直播|做游戏|游戏行业|esports|streamer/i],["performance_anxiety",/不敢排位|怕坑队友|手抖|比赛紧张|rank anxiety|raid anxiety/i],["leadership",/团长|指挥|队长|带队|IGL|shotcaller/i],["raid_progression",/开荒|团灭|进度|首通|raid|wipe|world first/i],["online_friendship",/网友|游戏好友|固定队解散|不再上线|online friend/i],["cross_culture",/外服|国服|亚服|美服|欧服|语言不通|跨服|时区/i],["accessibility",/色盲模式|晕3D|辅助难度|无障碍|aim assist|accessibility/i],["neurodiversity",/ADHD.*游戏|自闭.*游戏|注意力.*游戏|超专注|hyperfocus/i]];
export function analyzeGamingContext(userText:string,history:string[],role:"xiaoku"|"xiaoxue"):GamingContext{
 const all=`${history.slice(-10).join("\n")}\n${userText}`;
 const explicitGameRequest=/游戏|打游戏|电子游戏|手游|主机|steam|switch|playstation|xbox|电竞|game|gaming|video game/i.test(userText);
 const gameMentionLike=explicitGameRequest||/(排位|段位|抽卡|卡池|副本|开荒|公会|战队|队友|上分|氪金|保底|raid|ranked|gacha|guild|MMR|DPS|PvP|PvE)/i.test(userText);
 const userOptOut=/不想聊游戏|别提游戏|不要游戏推荐|跟游戏无关|no game/i.test(all);
 const crisisLike=/自杀|想死|不想活|结束生命|伤害自己|自残|suicid|self.?harm/i.test(userText);
 const professionalCaseLike=/我的来访者|我的个案|我手上的个案|会谈中|督导|case discussion/i.test(userText);
 const gamingProfessionalLike=/职业选手|电竞选手|教练|主播|游戏策划|游戏开发|游戏行业|赛事运营|电竞从业|streamer|esports coach|game developer/i.test(userText);
 const themes=uniq(THEME_TESTS.filter(([,r])=>r.test(userText)).map(([t])=>t));
 const recentUsed=/让我想到.*游戏|像.*游戏里|如果用游戏来比喻|推荐.*游戏/.test(history.slice(-8).join("\n"));
 const proactiveEligible=role==="xiaoku"&&!explicitGameRequest&&!userOptOut&&!crisisLike&&!professionalCaseLike&&!recentUsed&&history.length>=1&&themes.length>=1;
 const reason=crisisLike?"危机优先，游戏隐喻不得抢占安全响应":userOptOut?"用户拒绝游戏连接":professionalCaseLike?"心理专业个案讨论不主动插入游戏":explicitGameRequest?"用户明确进入游戏语境":proactiveEligible?"存在高度贴合玩家心理主题，可低频使用游戏文化桥梁":"当前无需主动游戏介入";
 return {explicitGameRequest,userOptOut,crisisLike,professionalCaseLike,gameMentionLike,gamingProfessionalLike,themes,dominantTheme:themes[0],proactiveEligible,reason};
}
export function retrieveGameCandidates(ctx:GamingContext,role:"xiaoku"|"xiaoxue",limit=5):GameCandidate[]{
 if(ctx.userOptOut||ctx.crisisLike)return []; if(role==="xiaoxue"&&!ctx.explicitGameRequest)return [];
 const out:GameCandidate[]=[]; for(const game of loadGames()){let score=0;const reasons:string[]=[];
  if(ctx.dominantTheme&&game.psych_theme_codes.includes(ctx.dominantTheme)){score+=.55;reasons.push("心理主题贴合");}
  else if(ctx.themes.some(t=>game.psych_theme_codes.includes(t))){score+=.34;reasons.push("次级主题贴合");}
  if(game.current_relevance.includes("current")){score+=.08;reasons.push("当代共同语境");}
  if(game.proactive_reference_enabled)score+=.07; if(ctx.explicitGameRequest)score+=.15;
  out.push({game,score,reasons}); }
 return out.sort((a,b)=>b.score-a.score).slice(0,limit);
}
export function buildGamingPromptBlock(ctx:GamingContext,candidates:GameCandidate[],role:"xiaoku"|"xiaoxue"):string{
 if(ctx.userOptOut||ctx.crisisLike)return ""; if(!ctx.explicitGameRequest&&!ctx.proactiveEligible)return ""; if(role==="xiaoxue"&&!ctx.explicitGameRequest)return "";
 const lines=["【游戏文化与玩家心理运行层】",`当前：${ctx.explicitGameRequest?"用户主动游戏语境":"小酷可低频主动游戏桥梁"}。原因：${ctx.reason}`,
 "先理解用户本人，再使用游戏知识。游戏可以是社交、竞争、身份、怀旧、掌握感、恢复、消费或压力场景，不是默认成瘾。",
 "年代/代际只作为弱熟悉度信号；不能因为某人玩某款游戏就断定年龄、性别、收入、性取向、人格或诊断。",
 "专业术语要按玩家真实语境理解：例如tilt、MMR、开荒、保底、FOMO、Meta、固定队、Raid anxiety等。若不确定术语在具体作品中的含义，先澄清，不编。",
 "高时长/氪金/熬夜不是单点诊断。优先看：控制感、现实功能影响、预算、睡眠、关系冲突、主观后悔、能否停下、是否仍有其他生活来源。",
 "主动连接默认最多1个游戏例子或1个游戏隐喻，最近8轮已主动游戏化则停止。用户未显示玩家语境时不要强行把所有心理问题游戏化。",
 "版权：不长篇复制游戏对白、剧情文本、攻略、Wiki或未授权脚本；用事实级元数据、机制概念与简短语义概括。"];
 if(candidates.length){lines.push("候选游戏（如需举例只从候选中选，不现场编作品/机制）："); for(const c of candidates.slice(0,5)) lines.push(`- 《${c.game.title}》｜${c.game.era_band}｜${c.game.genre_family}｜${c.game.usage_summary}｜score=${c.score.toFixed(2)}`);}
 lines.push("小酷示例（非模板）：‘你说的这种“明明是娱乐，却开始像第二份工作”的感觉，在长期运营游戏里很常见。比起问你玩得多不多，我更想知道：现在是你在选择玩，还是活动和进度在推着你玩？’");
 if(role==="xiaoxue")lines.push("小雪边界：可以听懂游戏作息、电竞职业、外服时区等信息并用于预约整理；普通预约流程不主动讨论游戏心理，不做成瘾判断，情绪支持交回小酷。");
 return lines.join("\n");
}
export function verifyGamingOutput(output:string,ctx:GamingContext|undefined,role:"xiaoku"|"xiaoxue"){
 const v:Array<{id:string;level:"P0"|"P1";description:string}>=[]; if(!ctx)return v;
 if(ctx.userOptOut&&/游戏|打游戏|推荐.*游戏|像.*游戏/.test(output))v.push({id:"GAME-H001",level:"P0",description:"用户拒绝游戏连接后仍继续游戏化"});
 if(ctx.crisisLike&&/推荐.*游戏|去打.*游戏|玩会儿.*游戏/.test(output))v.push({id:"GAME-H002",level:"P0",description:"危机场景用游戏替代安全响应"});
 if(/你(?:就是|已经|一定).*游戏成瘾|因为你玩.*所以你.*成瘾|玩.*小时.*就是成瘾/.test(output))v.push({id:"GAME-H003",level:"P0",description:"仅凭游戏行为/时长直接诊断游戏成瘾"});
 if(/因为你玩.*所以你(?:是男|是女|是00后|是90后|有ADHD|有自闭|性格)/.test(output))v.push({id:"GAME-H004",level:"P1",description:"从游戏偏好过度推断年龄/性别/诊断/人格"});
 if(role==="xiaoxue"&&!ctx.explicitGameRequest&&/排位|段位|抽卡|游戏心理|推荐.*游戏/.test(output))v.push({id:"GAME-H005",level:"P1",description:"小雪在普通预约流程主动转为游戏心理讨论"});
 if(/这款游戏一定会治愈你|玩这个就会好|保证.*缓解/.test(output))v.push({id:"GAME-H006",level:"P1",description:"夸大游戏为治疗或保证效果"});
 if(/充钱.*一定能|下一抽.*一定出|保底.*保证.*现实收益/.test(output))v.push({id:"GAME-H007",level:"P0",description:"鼓励/保证性消费或抽卡结果"});
 if(ctx.professionalCaseLike&&/推荐.*游戏给.*来访者|让你的来访者玩/.test(output))v.push({id:"GAME-H008",level:"P1",description:"心理专业个案讨论中直接把游戏当干预处方"});
 return v;
}
