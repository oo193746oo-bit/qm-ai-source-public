/**
 * QM AI 全站版本指纹
 * v11.5: 整合GPT v13.0规范，新增资源检索引擎+运行时输出审核器
 * v11.5.1: 热修复 — replaceOutput前端替换/V003药物规则收紧/V102临床术语分级/
 *          V007预约精确化/高情绪分级允许CT08急救卡/小雪CT08放行/测评关键词收紧
 * v11.6.0: 小雪对话大脑v13.1（状态机+规划器+完整性守卫+幻觉检测后置）+
 *          小酷树洞跨模块读取v13.2（客户端读取+服务端消毒注入）
 * v11.6.1: 行政权限边界修复v13.3（capability gate+行政状态机+ADM审核+SP追加）—
 *          修复小酷越权邀请到店/预留时间/确认预约
 * v12.0.0: 实施最高层级决策DECISION-ROLE-001四角色宪法v14.0——
 *          小酷行政需求强制转小雪/小雪强化行政大脑禁止心理分析/
 *          未确认预约婉拒walk-in前台只行政/全局角色治理唯一真相源/
 *          废止v13.3小酷可答行政事实的设计
 * v12.0.1: 角色治理审核器强化——
 *          意图检测regex大幅扩充（费用/预约/时间/到访/客服/投诉等）/
 *          新增繁简标准化+英语行政意图检测/
 *          情绪词库扩充精神疾病/神经症状/人格障碍/危机隐晦表达/
 *          G001-G006审核regex全面扩充+否定词感知/
 *          新增英语违规模式检测/
 *          1319个测试case全部通过
 * v13.0.0: 认知运行层上线——
 *          从"关键词检测耳朵"升级为"会思考的大脑"：
 *          8大资料库/111万条训练数据 → 5760条精选案例 + 248条思维透镜 /
 *          情境结构建模（事实/假设/未知分离）/
 *          多假设引擎（至少2假设，强制1个非群体解释）/
 *          关系多主体建模（双方各自在回应什么）/
 *          10大核心冲突轴（自主vs风险、归属vs个体化等）/
 *          临场案例检索（每次对话喂3-5个完整教材范例）/
 *          对话技能编译器（具体化共情/双面心智化/单深度开放问题）/
 *          认知审核器COG-H001~H012（群体事实化/P0阻断重写）/
 *          小酷小雪双端接入
 * v13.1.0: 婚姻关系与法律认知包接入——
 *          第9大资料库/27万条双轨数据（24万关系认知+2万法律思维+1万微冒犯）/
 *          1200条精选案例+37条思维透镜/
 *          24维度覆盖（关系阶段/沟通信任/姻亲边界/忠诚婚外/控制暴力/离婚分居/
 *          再婚重组/晚年婚姻/LGBTQ伴侣/意定监护/法律意识等）/
 *          法律认知双轨：先确认法域再谈法律，心理资料不生成法律事实/
 *          新增MAR-H001~H025婚姻法律防幻觉审核（意定监护≠婚姻/家暴不能只劝沟通/
 *          财产不自动平分/小酷不给法律意见/小雪不做婚姻咨询）/
 *          9大资料库/139万条训练数据 → 6960条精选案例 + 285条思维透镜
 * v13.2.0: 意定监护与预先照护规划包（v2.1家点整合版）接入——
 *          第10大资料库/约30万条（5.7万核心场景+22.9万扩充+3000 FAQ+1万微冒犯）/
 *          480条精选案例+37条思维透镜/
 *          覆盖中老年与子女/无子女独居/LGBTQ选择性家庭/残障失能/再婚重组/异地子女/
 *          财产医疗养老协同/海外比较法/照护信任与监督等场景/
 *          法律双轨+能力状态门：行为能力不由模型判断，法域/时效/来源先行/
 *          新增VG-H001~H021意定监护防幻觉审核（监护≠婚姻/不自动继承/不自动决定所有医疗/
 *          不自动处分全部财产/LGBTQ不是只能监护/不把老人当无能力/小酷不给个案法律结论/
 *          小雪不给公证流程结论）/
 *          10大资料库/169万条训练数据 → 7440条精选案例 + 322条思维透镜
 * v13.3.0: 中老年照护+华人学习者教育双包接入 + 审核器强化——
 *          第11大资料库教育包：15万条/960精选案例+26透镜/EDU-H防幻觉审核
 *          （学习差≠智力低/注意力≠ADHD/阅读慢≠阅读障碍/数学差≠数学障碍/
 *          小酷不做升学顾问/小雪不做学习心理分析/不编造考试签证政策）/
 *          第12大资料库中老年包：56.2万条全量读取（流式构建零抽样）/1200精选案例+28透镜/
 *          EC-H防幻觉审核（不编造福利金额/申请资格/办理材料/不把地方政策说成全国/
 *          残障≠无能力/记性差≠痴呆/小酷不变政策客服/小雪不做心理分析/
 *          机构存在≠有名额）/
 *          审核器大规模强化：COG-H001群体本质化regex扩充/角色边界regex大幅扩充/
 *          MAR-H019法律意见regex扩充/新增15条老资料库P0防幻觉规则
 *          (ACG/GENZ/LGBTQ/OVERSEAS/POST80S/POST70S/CROSSGEN/TAIWAN)/
 *          审核规则总数37→60条/
 *          12大资料库/237.5万条训练数据 → 9600条精选案例 + 376条思维透镜
 */
export const QM_BUILD_VERSION = "v13.17.0-RC1";
export const QM_BUILD_DATE = "2026-09-03";

import { QM_BUILD_COMMIT } from "./build-commit.generated";

export const QM_BUILD_LABEL = `QM AI ${QM_BUILD_VERSION} · ${QM_BUILD_DATE} · ${QM_BUILD_COMMIT}`;

export const XIAOKU_BUILD_ID = "QM-XIAOKU-20260903-V12.1.0-RC1";
export const XIAOKU_PROMPT_SHA = "cognitive-runtime-v1-003";
export const XIAOKU_PROMPT_PATH = "src/lib/qm-system-prompt-full.md";

export const XIAOXUE_BUILD_ID = "QM-XIAOXUE-20260903-V15.0.1-RC1";
export const XIAOXUE_PROMPT_SHA = "cognitive-runtime-v1-004";
export const XIAOXUE_PROMPT_PATH = "src/lib/xiaoxue-system-prompt.md";

export const TREEHOLE_LETTER_BUILD_ID = "QM-TH-LETTER-20260825-V2.0";
export const TREEHOLE_LETTER_SHA = "a6389e2ed2eb12edb0c8ff9ddea1b30b4c76601f912ac9057c85236e5e48ec6e";
export const TREEHOLE_SAFETY_SHA = "31690c882dbdd5bf63ced1d6f7a18a8e05adbaad7e92742d96ce61d7cf78302d";

export const COGNITIVE_RUNTIME_VERSION = "v1.3";
export const KNOWLEDGE_CASES_TOTAL = 19596;
export const KNOWLEDGE_LENSES_TOTAL = 404;
export const KNOWLEDGE_TRAINING_ROWS = 2586256;
export const KNOWLEDGE_PACKS = 19;
export const BOOKS_TOTAL = 520;
export const SONGS_TOTAL = 1000;
export const LITERATURE_WORKS_TOTAL = 140;
export const GAMES_TOTAL = 560;

/**
 * Changelog（最新在前）
 */
export const CHANGELOG: string[] = [ `* v13.6.0: 游戏文化共情与玩家心理接入——第19大资料库/560款游戏目录→5600情境案例+80透镜+480玩家术语+30心理主题(成就排名/挫败愤怒/社交归属/沉迷vs健康投入/怀旧/消费抽卡等)/游戏作为共情入口不病理化/GAME-H001~H008(危机用游戏替代安全响应/仅凭时长诊断成瘾/从游戏偏好推断年龄性别诊断/鼓励保证性抽卡消费/小雪越界/夸大疗效/个案当处方)；与ACG库按语境协同加载；19库合计${KNOWLEDGE_TRAINING_ROWS.toLocaleString()}条训练行→${KNOWLEDGE_CASES_TOTAL}案例`, `* v13.5.0: 诗词文学+宗教信仰双包接入——诗词文学(第17库/140部作品元数据/12情绪主题/只存元数据不捆绑全文/LIT-H001~H006)+宗教信仰(第18库/12万行全量读取零抽样→1000案例/基督宗教佛教民间信仰无神论/REL-H001~H020防幻觉/实现5条P0:夸大疗效/替代医疗/神学当心理事实/名字推宗教/替用户断定信仰)；18库合计${KNOWLEDGE_TRAINING_ROWS.toLocaleString()}条→${KNOWLEDGE_CASES_TOTAL}案例；认知运行层新增文学import/ContextSchema字段/信号检测/审核挂接`, `* v13.4.0: 四模块接入——心理学书籍推荐（520本/L0-L4分级/7安全门/9维动态排序/BOOK-H防误荐）+职业场景认知（9万行全量→1000案例+26透镜/JOB-H防幻觉）+音乐共情与歌曲推荐（1000首歌曲元数据/主动音乐桥梁/MUS-H危机角色版权）+心理专业用户识别（专业背景分级/自我vs个案讨论路由/PRO-H去身份化防冒充督导）；16库合计${KNOWLEDGE_TRAINING_ROWS.toLocaleString()}条→${KNOWLEDGE_CASES_TOTAL}案例+${KNOWLEDGE_LENSES_TOTAL}透镜；审核规则新增BOOK-H6+JOB-H6+MUS-H5+PRO-H7条`, `* v13.3.0: 中老年照护+教育双包接入+审核器强化——中老年包56.2万条全量读取(流式构建零抽样)/1200案例+28透镜/教育包15万条/960案例+26透镜/新增EDU-H+EC-H防幻觉审核+15条老资料库P0规则/审核规则37→60条/12库合计${KNOWLEDGE_TRAINING_ROWS.toLocaleString()}条→${KNOWLEDGE_CASES_TOTAL}案例+${KNOWLEDGE_LENSES_TOTAL}透镜`, `* v13.2.0: 意定监护与预先照护规划包接入——第10大资料库/约30万条/480精选案例+37透镜/VG-H防幻觉审核/10库合计${KNOWLEDGE_TRAINING_ROWS.toLocaleString()}条→${KNOWLEDGE_CASES_TOTAL}案例+${KNOWLEDGE_LENSES_TOTAL}透镜`, `* v13.1.0: 婚姻关系与法律认知包接入——第9大资料库/27万条双轨数据/1200精选案例+37透镜/24维度覆盖/MAR-H法律防幻觉审核/9库合计${KNOWLEDGE_TRAINING_ROWS.toLocaleString()}条→${KNOWLEDGE_CASES_TOTAL}案例+${KNOWLEDGE_LENSES_TOTAL}透镜`, `* v13.0.0: 认知运行层上线——8大资料库/${KNOWLEDGE_TRAINING_ROWS.toLocaleString()}条训练数据提炼为${KNOWLEDGE_CASES_TOTAL}条精选案例+${KNOWLEDGE_LENSES_TOTAL}条思维透镜/情境结构建模/多假设引擎/关系多主体建模/10大冲突轴/临场案例检索/对话技能编译器/认知审核器COG-H001~H012/小酷小雪双端接入`,
  "* v12.0.1: 角色治理审核器强化——意图检测regex大幅扩充/繁简标准化+英语意图检测/情绪词库扩充/G001-G006审核regex全面扩充+否定词感知/1319测试全部通过",
  "* v12.0.0: 实施最高层级决策DECISION-ROLE-001四角色宪法v14.0——小酷行政需求强制转小雪/小雪强化行政大脑禁止心理分析/未确认预约婉拒walk-in",
  "* v11.6.1: 行政权限边界修复v13.3",
  "* v11.6.0: 小雪对话大脑v13.1+小酷树洞跨模块读取v13.2",
  "* v11.5.1: 热修复多项规则",
  "* v11.5: 资源检索引擎+运行时输出审核器",
];
