/**
 * QM 93题MBTI风格人格偏好测试 - 题库 v3.0
 * 题量分布：EI 23题 + SN 25题 + TF 22题 + JP 23题 = 93题
 * 每题二选一，对应一个维度的两极方向
 */

import type { MBTIQuestion } from './mbti-types';

export const mbtiQuestions93: MBTIQuestion[] = [
  {
    id: "q001",
    dimension: "EI",
    question: "在社交聚会中，你通常会感到：",
    options: [
      { text: "充满能量，越聊越起劲", direction: "E" },
      { text: "有些消耗，需要独处时间恢复", direction: "I" },
    ],
  },
  {
    id: "q002",
    dimension: "EI",
    question: "周末你更倾向于：",
    options: [
      { text: "和朋友出去聚会、参加活动", direction: "E" },
      { text: "一个人在家看书、追剧或做自己的事", direction: "I" },
    ],
  },
  {
    id: "q003",
    dimension: "EI",
    question: "面对陌生人，你通常：",
    options: [
      { text: "比较容易主动搭话", direction: "E" },
      { text: "更习惯等对方先开口", direction: "I" },
    ],
  },
  {
    id: "q004",
    dimension: "EI",
    question: "工作了一整天后，你更想：",
    options: [
      { text: "约朋友吃饭聊天放松一下", direction: "E" },
      { text: "一个人安安静静地待着", direction: "I" },
    ],
  },
  {
    id: "q005",
    dimension: "EI",
    question: "在团队项目中，你更喜欢：",
    options: [
      { text: "大家一起头脑风暴讨论", direction: "E" },
      { text: "先各自思考再汇总意见", direction: "I" },
    ],
  },
  {
    id: "q006",
    dimension: "EI",
    question: "你觉得自己的朋友圈：",
    options: [
      { text: "很广，各行各业都有认识的人", direction: "E" },
      { text: "不大，但个个都是深交", direction: "I" },
    ],
  },
  {
    id: "q007",
    dimension: "EI",
    question: "遇到想不通的问题时，你更习惯：",
    options: [
      { text: "找人聊聊，说着说着就想通了", direction: "E" },
      { text: "自己琢磨，想明白了再说", direction: "I" },
    ],
  },
  {
    id: "q008",
    dimension: "EI",
    question: "在新环境中，你通常：",
    options: [
      { text: "很快就能融入新圈子", direction: "E" },
      { text: "需要一段时间慢慢适应", direction: "I" },
    ],
  },
  {
    id: "q009",
    dimension: "EI",
    question: "你更享受哪种活动：",
    options: [
      { text: "热闹的派对或团建", direction: "E" },
      { text: "一对一的深度交流", direction: "I" },
    ],
  },
  {
    id: "q010",
    dimension: "EI",
    question: "长时间独处后，你会：",
    options: [
      { text: "感到有些无聊，想找人说说话", direction: "E" },
      { text: "觉得很舒服，还想继续待着", direction: "I" },
    ],
  },
  {
    id: "q011",
    dimension: "EI",
    question: "开会时你更倾向于：",
    options: [
      { text: "边想边说，在讨论中梳理思路", direction: "E" },
      { text: "先听别人说完，再整理自己的想法", direction: "I" },
    ],
  },
  {
    id: "q012",
    dimension: "EI",
    question: "你更容易因为什么感到疲惫：",
    options: [
      { text: "一个人待太久没人说话", direction: "E" },
      { text: "社交活动太多需要应付", direction: "I" },
    ],
  },
  {
    id: "q013",
    dimension: "EI",
    question: "认识新朋友时，你通常：",
    options: [
      { text: "主动介绍自己，问对方问题", direction: "E" },
      { text: "等对方开启话题再接话", direction: "I" },
    ],
  },
  {
    id: "q014",
    dimension: "EI",
    question: "度假时你更喜欢：",
    options: [
      { text: "去热门景点凑热闹", direction: "E" },
      { text: "找个安静的地方发呆", direction: "I" },
    ],
  },
  {
    id: "q015",
    dimension: "EI",
    question: "你处理情绪的方式更偏向：",
    options: [
      { text: "找人倾诉，把情绪说出来", direction: "E" },
      { text: "自己消化，慢慢想清楚", direction: "I" },
    ],
  },
  {
    id: "q016",
    dimension: "EI",
    question: "在群体活动中，你往往是：",
    options: [
      { text: "带动气氛的那个人", direction: "E" },
      { text: "安静参与的那个人", direction: "I" },
    ],
  },
  {
    id: "q017",
    dimension: "EI",
    question: "你更认同哪句话：",
    options: [
      { text: "越分享越快乐", direction: "E" },
      { text: "独处是一种能力", direction: "I" },
    ],
  },
  {
    id: "q018",
    dimension: "EI",
    question: "工作中遇到困难，你第一反应是：",
    options: [
      { text: "问问同事有没有遇到过类似情况", direction: "E" },
      { text: "先自己查资料找解决方案", direction: "I" },
    ],
  },
  {
    id: "q019",
    dimension: "EI",
    question: "你觉得自己的能量来源是：",
    options: [
      { text: "和人互动、外部刺激", direction: "E" },
      { text: "内心世界、深度思考", direction: "I" },
    ],
  },
  {
    id: "q020",
    dimension: "EI",
    question: "刚参加完一场大型活动，你会：",
    options: [
      { text: "兴奋很久，还想续摊", direction: "E" },
      { text: "累坏了，需要好好休息", direction: "I" },
    ],
  },
  {
    id: "q021",
    dimension: "EI",
    question: "你更擅长：",
    options: [
      { text: "快速建立人脉连接", direction: "E" },
      { text: "深度经营少数关系", direction: "I" },
    ],
  },
  {
    id: "q022",
    dimension: "EI",
    question: "做重要决定前，你更喜欢：",
    options: [
      { text: "多问几个人的意见再决定", direction: "E" },
      { text: "自己想清楚就好", direction: "I" },
    ],
  },
  {
    id: "q023",
    dimension: "EI",
    question: "你理想的生活节奏是：",
    options: [
      { text: "日程满满、经常有新鲜事", direction: "E" },
      { text: "节奏平稳、有大量独处时间", direction: "I" },
    ],
  },
  {
    id: "q024",
    dimension: "SN",
    question: "你更关注：",
    options: [
      { text: "眼前的事实和具体细节", direction: "S" },
      { text: "未来的可能性和隐藏含义", direction: "N" },
    ],
  },
  {
    id: "q025",
    dimension: "SN",
    question: "学习新事物时，你更喜欢：",
    options: [
      { text: "从实际案例和具体经验入手", direction: "S" },
      { text: "先理解整体框架和理论模型", direction: "N" },
    ],
  },
  {
    id: "q026",
    dimension: "SN",
    question: "你更常被称赞：",
    options: [
      { text: "务实、靠谱、注意细节", direction: "S" },
      { text: "有创意、想法多、脑洞大", direction: "N" },
    ],
  },
  {
    id: "q027",
    dimension: "SN",
    question: "做计划时你更倾向于：",
    options: [
      { text: "关注具体步骤和可执行性", direction: "S" },
      { text: "先勾勒大方向和愿景", direction: "N" },
    ],
  },
  {
    id: "q028",
    dimension: "SN",
    question: "你更容易被什么吸引：",
    options: [
      { text: "实用的、经过验证的方法", direction: "S" },
      { text: "新奇的、有想象力的点子", direction: "N" },
    ],
  },
  {
    id: "q029",
    dimension: "SN",
    question: "描述一件事时，你通常：",
    options: [
      { text: "按时间顺序讲清楚来龙去脉", direction: "S" },
      { text: "跳跃式分享联想到的各种点", direction: "N" },
    ],
  },
  {
    id: "q030",
    dimension: "SN",
    question: "你更相信：",
    options: [
      { text: "亲身经历和可观察的事实", direction: "S" },
      { text: "直觉和第六感", direction: "N" },
    ],
  },
  {
    id: "q031",
    dimension: "SN",
    question: "面对一个问题，你首先想到的是：",
    options: [
      { text: "过去类似的经验和解决方法", direction: "S" },
      { text: "有没有全新的、不一样的思路", direction: "N" },
    ],
  },
  {
    id: "q032",
    dimension: "SN",
    question: "你更喜欢什么样的工作内容：",
    options: [
      { text: "具体明确、能看到实际成果", direction: "S" },
      { text: "有探索空间、充满创意挑战", direction: "N" },
    ],
  },
  {
    id: "q033",
    dimension: "SN",
    question: "你阅读时更关注：",
    options: [
      { text: "故事情节和具体细节", direction: "S" },
      { text: "深层含义和象征隐喻", direction: "N" },
    ],
  },
  {
    id: "q034",
    dimension: "SN",
    question: "别人给你反馈时，你更希望听到：",
    options: [
      { text: "具体的例子和改进建议", direction: "S" },
      { text: "整体的评价和发展方向", direction: "N" },
    ],
  },
  {
    id: "q035",
    dimension: "SN",
    question: "你更擅长：",
    options: [
      { text: "把复杂事情拆分成具体步骤", direction: "S" },
      { text: "把零散信息整合成整体图景", direction: "N" },
    ],
  },
  {
    id: "q036",
    dimension: "SN",
    question: "你更容易觉得无聊的是：",
    options: [
      { text: "重复做已经熟悉的事", direction: "S" },
      { text: "过于抽象、没有实际应用的理论", direction: "N" },
    ],
  },
  {
    id: "q037",
    dimension: "SN",
    question: "你更认同：",
    options: [
      { text: "眼见为实", direction: "S" },
      { text: "心有灵犀", direction: "N" },
    ],
  },
  {
    id: "q038",
    dimension: "SN",
    question: "遇到不确定的情况时，你更倾向于：",
    options: [
      { text: "收集足够的事实数据再判断", direction: "S" },
      { text: "凭直觉先有个大概方向", direction: "N" },
    ],
  },
  {
    id: "q039",
    dimension: "SN",
    question: "你更喜欢的表达方式是：",
    options: [
      { text: "清晰具体、一步一步讲明白", direction: "S" },
      { text: "用比喻和联想让人自己领悟", direction: "N" },
    ],
  },
  {
    id: "q040",
    dimension: "SN",
    question: "你对「创新」的看法更接近：",
    options: [
      { text: "在现有基础上改进优化", direction: "S" },
      { text: "颠覆传统、开拓全新可能", direction: "N" },
    ],
  },
  {
    id: "q041",
    dimension: "SN",
    question: "回忆过去时，你更容易想起：",
    options: [
      { text: "当时的具体场景和细节", direction: "S" },
      { text: "当时的感受和整体氛围", direction: "N" },
    ],
  },
  {
    id: "q042",
    dimension: "SN",
    question: "你更享受哪种思维活动：",
    options: [
      { text: "整理和归纳已知信息", direction: "S" },
      { text: "探索和设想未知可能", direction: "N" },
    ],
  },
  {
    id: "q043",
    dimension: "SN",
    question: "选择餐厅时你更看重：",
    options: [
      { text: "菜量实在、味道稳定", direction: "S" },
      { text: "环境有特色、菜品有创意", direction: "N" },
    ],
  },
  {
    id: "q044",
    dimension: "SN",
    question: "你更擅长记住：",
    options: [
      { text: "人名、地名、具体数据", direction: "S" },
      { text: "感觉、印象、整体调性", direction: "N" },
    ],
  },
  {
    id: "q045",
    dimension: "SN",
    question: "你更喜欢的游戏类型是：",
    options: [
      { text: "规则明确、有明确目标", direction: "S" },
      { text: "开放式、自由度高", direction: "N" },
    ],
  },
  {
    id: "q046",
    dimension: "SN",
    question: "别人问你意见时，你通常会：",
    options: [
      { text: "基于实际情况给出具体建议", direction: "S" },
      { text: "分享一个思路或可能性", direction: "N" },
    ],
  },
  {
    id: "q047",
    dimension: "SN",
    question: "你更容易被什么打动：",
    options: [
      { text: "真实发生的故事", direction: "S" },
      { text: "富有想象力的表达", direction: "N" },
    ],
  },
  {
    id: "q048",
    dimension: "SN",
    question: "你看待事物的方式更偏向：",
    options: [
      { text: "就事论事，看它是什么", direction: "S" },
      { text: "联想丰富，看它像什么", direction: "N" },
    ],
  },
  {
    id: "q049",
    dimension: "TF",
    question: "做决定时，你更依赖：",
    options: [
      { text: "逻辑分析和客观标准", direction: "T" },
      { text: "内心感受和对他人的影响", direction: "F" },
    ],
  },
  {
    id: "q050",
    dimension: "TF",
    question: "朋友遇到困难向你倾诉时，你的第一反应是：",
    options: [
      { text: "帮ta分析问题、想解决方案", direction: "T" },
      { text: "先共情ta的情绪，让ta觉得被理解", direction: "F" },
    ],
  },
  {
    id: "q051",
    dimension: "TF",
    question: "你更看重：",
    options: [
      { text: "公平和公正", direction: "T" },
      { text: "和谐和体谅", direction: "F" },
    ],
  },
  {
    id: "q052",
    dimension: "TF",
    question: "被别人批评时，你通常：",
    options: [
      { text: "先看批评有没有道理", direction: "T" },
      { text: "先在意对方的态度和语气", direction: "F" },
    ],
  },
  {
    id: "q053",
    dimension: "TF",
    question: "你更擅长：",
    options: [
      { text: "理性分析复杂问题", direction: "T" },
      { text: "体察他人情绪变化", direction: "F" },
    ],
  },
  {
    id: "q054",
    dimension: "TF",
    question: "你认为好的领导者应该更：",
    options: [
      { text: "果断有原则", direction: "T" },
      { text: "温暖有同理心", direction: "F" },
    ],
  },
  {
    id: "q055",
    dimension: "TF",
    question: "面对冲突时你更倾向于：",
    options: [
      { text: "坚持正确的原则和立场", direction: "T" },
      { text: "顾及双方感受寻求和解", direction: "F" },
    ],
  },
  {
    id: "q056",
    dimension: "TF",
    question: "你更容易因为什么感到自豪：",
    options: [
      { text: "取得了出色的成就", direction: "T" },
      { text: "帮助了需要帮助的人", direction: "F" },
    ],
  },
  {
    id: "q057",
    dimension: "TF",
    question: "你更认同哪句话：",
    options: [
      { text: "真理越辩越明", direction: "T" },
      { text: "家和万事兴", direction: "F" },
    ],
  },
  {
    id: "q058",
    dimension: "TF",
    question: "你表达不同意见时通常会：",
    options: [
      { text: "直接说出自己的想法和理由", direction: "T" },
      { text: "先照顾对方感受再委婉表达", direction: "F" },
    ],
  },
  {
    id: "q059",
    dimension: "TF",
    question: "你更容易被什么说服：",
    options: [
      { text: "逻辑严密的论证", direction: "T" },
      { text: "真诚动人的故事", direction: "F" },
    ],
  },
  {
    id: "q060",
    dimension: "TF",
    question: "工作中你更看重：",
    options: [
      { text: "效率和结果", direction: "T" },
      { text: "团队氛围和关系", direction: "F" },
    ],
  },
  {
    id: "q061",
    dimension: "TF",
    question: "你更擅长处理：",
    options: [
      { text: "需要客观分析的复杂问题", direction: "T" },
      { text: "需要情感支持的人际问题", direction: "F" },
    ],
  },
  {
    id: "q062",
    dimension: "TF",
    question: "别人向你求助时，你更可能：",
    options: [
      { text: "帮ta找到最优解决方案", direction: "T" },
      { text: "先让ta感受到支持和理解", direction: "F" },
    ],
  },
  {
    id: "q063",
    dimension: "TF",
    question: "你认为「对事不对人」：",
    options: [
      { text: "是应该坚持的原则", direction: "T" },
      { text: "有时候会伤害到别人", direction: "F" },
    ],
  },
  {
    id: "q064",
    dimension: "TF",
    question: "你更容易注意到：",
    options: [
      { text: "别人话语中的逻辑漏洞", direction: "T" },
      { text: "别人话语中的情绪变化", direction: "F" },
    ],
  },
  {
    id: "q065",
    dimension: "TF",
    question: "做选择时你更倾向于：",
    options: [
      { text: "综合利弊、理性权衡", direction: "T" },
      { text: "听从内心、感受为先", direction: "F" },
    ],
  },
  {
    id: "q066",
    dimension: "TF",
    question: "你觉得自己更容易：",
    options: [
      { text: "因为考虑不周而伤害到别人", direction: "T" },
      { text: "因为顾及太多而委屈自己", direction: "F" },
    ],
  },
  {
    id: "q067",
    dimension: "TF",
    question: "你更欣赏的品质是：",
    options: [
      { text: "独立和坚强", direction: "T" },
      { text: "温柔和包容", direction: "F" },
    ],
  },
  {
    id: "q068",
    dimension: "TF",
    question: "面对他人的眼泪，你通常：",
    options: [
      { text: "有点不知所措，想赶紧解决问题", direction: "T" },
      { text: "感同身受，想给个拥抱", direction: "F" },
    ],
  },
  {
    id: "q069",
    dimension: "TF",
    question: "你更擅长写：",
    options: [
      { text: "分析报告和方案", direction: "T" },
      { text: "感谢信和祝福语", direction: "F" },
    ],
  },
  {
    id: "q070",
    dimension: "TF",
    question: "你更认同：",
    options: [
      { text: "规则是为了公平而存在", direction: "T" },
      { text: "规则之外应有人情考量", direction: "F" },
    ],
  },
  {
    id: "q071",
    dimension: "JP",
    question: "做事情时你更倾向于：",
    options: [
      { text: "提前规划好，按计划执行", direction: "J" },
      { text: "灵活应变，看情况调整", direction: "P" },
    ],
  },
  {
    id: "q072",
    dimension: "JP",
    question: "你更喜欢的生活方式是：",
    options: [
      { text: "日程安排得井井有条", direction: "J" },
      { text: "随性自在，想到什么做什么", direction: "P" },
    ],
  },
  {
    id: "q073",
    dimension: "JP",
    question: "面对截止日期，你通常：",
    options: [
      { text: "提前完成，心里才踏实", direction: "J" },
      { text: "最后关头反而效率更高", direction: "P" },
    ],
  },
  {
    id: "q074",
    dimension: "JP",
    question: "你更容易因为什么感到焦虑：",
    options: [
      { text: "计划被打乱、事情不确定", direction: "J" },
      { text: "被约束、没有自由空间", direction: "P" },
    ],
  },
  {
    id: "q075",
    dimension: "JP",
    question: "旅行前你会：",
    options: [
      { text: "做好详细攻略和行程表", direction: "J" },
      { text: "只订机票酒店，到了再说", direction: "P" },
    ],
  },
  {
    id: "q076",
    dimension: "JP",
    question: "你更擅长：",
    options: [
      { text: "组织和规划事务", direction: "J" },
      { text: "适应和应对变化", direction: "P" },
    ],
  },
  {
    id: "q077",
    dimension: "JP",
    question: "你的桌面/房间通常是：",
    options: [
      { text: "整洁有序，东西都有固定位置", direction: "J" },
      { text: "有点乱，但我知道东西在哪", direction: "P" },
    ],
  },
  {
    id: "q078",
    dimension: "JP",
    question: "做决定时你更倾向于：",
    options: [
      { text: "尽快定下来，不要悬着", direction: "J" },
      { text: "多看看选项，不着急决定", direction: "P" },
    ],
  },
  {
    id: "q079",
    dimension: "JP",
    question: "你更喜欢的工作节奏是：",
    options: [
      { text: "有明确的deadline和阶段性目标", direction: "J" },
      { text: "弹性工作制，自己安排进度", direction: "P" },
    ],
  },
  {
    id: "q080",
    dimension: "JP",
    question: "面对多种选择，你通常：",
    options: [
      { text: "选一个就定了，不纠结", direction: "J" },
      { text: "想多比较一下，怕错过更好的", direction: "P" },
    ],
  },
  {
    id: "q081",
    dimension: "JP",
    question: "你更认同：",
    options: [
      { text: "未雨绸缪", direction: "J" },
      { text: "车到山前必有路", direction: "P" },
    ],
  },
  {
    id: "q082",
    dimension: "JP",
    question: "你更擅长处理：",
    options: [
      { text: "有明确流程的常规事务", direction: "J" },
      { text: "突发的、需要临场应变的事", direction: "P" },
    ],
  },
  {
    id: "q083",
    dimension: "JP",
    question: "你更容易：",
    options: [
      { text: "因为没准备好而感到不安", direction: "J" },
      { text: "因为太有规律而感到无聊", direction: "P" },
    ],
  },
  {
    id: "q084",
    dimension: "JP",
    question: "你更喜欢什么样的领导：",
    options: [
      { text: "目标明确、指令清晰", direction: "J" },
      { text: "给自由度、信任下属", direction: "P" },
    ],
  },
  {
    id: "q085",
    dimension: "JP",
    question: "你的衣柜更可能是：",
    options: [
      { text: "按季节和类型分类整理", direction: "J" },
      { text: "堆叠在一起，翻着找", direction: "P" },
    ],
  },
  {
    id: "q086",
    dimension: "JP",
    question: "你处理信息的方式更偏向：",
    options: [
      { text: "先分类归档，形成体系", direction: "J" },
      { text: "先广泛收集，再慢慢整理", direction: "P" },
    ],
  },
  {
    id: "q087",
    dimension: "JP",
    question: "你更容易感到满足的是：",
    options: [
      { text: "完成了计划清单上的任务", direction: "J" },
      { text: "尝试了新鲜有趣的事物", direction: "P" },
    ],
  },
  {
    id: "q088",
    dimension: "JP",
    question: "面对变化，你通常：",
    options: [
      { text: "需要一些时间来适应调整", direction: "J" },
      { text: "很兴奋，觉得又有新可能", direction: "P" },
    ],
  },
  {
    id: "q089",
    dimension: "JP",
    question: "你更擅长：",
    options: [
      { text: "坚持和执行", direction: "J" },
      { text: "发现和创造", direction: "P" },
    ],
  },
  {
    id: "q090",
    dimension: "JP",
    question: "你理想中的一天：",
    options: [
      { text: "按计划有序进行", direction: "J" },
      { text: "充满意外惊喜", direction: "P" },
    ],
  },
  {
    id: "q091",
    dimension: "JP",
    question: "你做笔记的习惯更接近：",
    options: [
      { text: "条理清晰、有编号有层级", direction: "J" },
      { text: "随意涂鸦、想到什么写什么", direction: "P" },
    ],
  },
  {
    id: "q092",
    dimension: "JP",
    question: "你更容易拖延的是：",
    options: [
      { text: "没有明确方向的开放性任务", direction: "J" },
      { text: "有严格截止日期的任务", direction: "P" },
    ],
  },
  {
    id: "q093",
    dimension: "JP",
    question: "你更看重：",
    options: [
      { text: "确定性和可预测性", direction: "J" },
      { text: "可能性和自由度", direction: "P" },
    ],
  },
];

// 题量统计
export const QUESTION_COUNTS = {
  EI: 23,
  SN: 25,
  TF: 22,
  JP: 23,
  total: 93,
};
