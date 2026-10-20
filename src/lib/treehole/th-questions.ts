// QM 情绪树洞 v2.0 - 11 维关心地图 + 20 题按钮题库
// 数据来源：QM_AI_情绪树洞_v2.0 规格文档
import type { DimensionMeta, DailyQuestion, DimensionCode } from "./th-types";

/** 11 个关心维度的元数据 */
export const DIMENSIONS: DimensionMeta[] = [
  { code: "VAL", name: "情绪色调", definition: "整体情绪底色、波动、触发" },
  { code: "ENE", name: "睡眠与身体能量", definition: "睡眠恢复、疲惫、饮食、身体负荷" },
  { code: "COG", name: "认知负荷", definition: "注意力、反刍、担忧、决策负担" },
  { code: "MOT", name: "动力与行动", definition: "启动、持续、完成、行动意愿" },
  { code: "SELF", name: "自我关系", definition: "自我批评、自我允许、自我照顾" },
  { code: "INT", name: "亲密关系", definition: "伴侣/重要关系中的连接、摩擦、边界" },
  { code: "FAM", name: "家庭关系", definition: "原生家庭/选择的家/照护关系" },
  { code: "WORK", name: "工作学习", definition: "任务、反馈、倦怠、边界、不公平" },
  { code: "SOC", name: "人际连接", definition: "朋友、同事、社群、孤独、被理解" },
  { code: "MEA", name: "意义与方向", definition: "价值感、方向感、未来感" },
  { code: "RES", name: "恢复资源", definition: "休息、兴趣、运动、自然、创作、支持" },
];

/** 维度中文名称映射 */
export const DIMENSION_NAMES: Record<DimensionCode, string> = {
  VAL: "情绪色调",
  ENE: "睡眠与身体能量",
  COG: "认知负荷",
  MOT: "动力与行动",
  SELF: "自我关系",
  INT: "亲密关系",
  FAM: "家庭关系",
  WORK: "工作学习",
  SOC: "人际连接",
  MEA: "意义与方向",
  RES: "恢复资源",
};

/**
 * 20 题按钮题库
 * 每个 question 有唯一 id，用于 14 天去重
 */
export const QUESTION_BANK: DailyQuestion[] = [
  // VAL - 情绪色调（2题）
  {
    id: "val_01",
    dimension: "VAL",
    question: "今天的情绪底色更接近哪一种？",
    options: ["明亮", "平静", "有点灰", "很沉", "说不清"],
  },
  {
    id: "val_02",
    dimension: "VAL",
    question: "今天最占位置的感受是什么？",
    options: ["开心/轻松", "平静", "焦虑/紧张", "难过/失落", "生气/烦躁", "麻木/空", "其他"],
  },
  // ENE - 睡眠与身体能量（3题）
  {
    id: "ene_01",
    dimension: "ENE",
    question: "昨晚的睡眠给你补回了多少电？",
    options: ["充得很满", "还可以", "只充一点", "几乎没充到", "没怎么睡"],
  },
  {
    id: "ene_02",
    dimension: "ENE",
    question: "今天身体的电量在哪里？",
    options: ["很有精神", "够用", "有点低", "很低", "忽高忽低"],
  },
  {
    id: "ene_03",
    dimension: "ENE",
    question: "今天吃饭这件事怎么样？",
    options: ["规律舒服", "基本有吃", "有点随便", "明显吃不下/忘了吃", "不想回答"],
  },
  // COG - 认知负荷（2题）
  {
    id: "cog_01",
    dimension: "COG",
    question: `今天脑子里的"窗口"开了多少个？`,
    options: ["很少很清楚", "有几个能处理", "有点多", "多到很乱"],
  },
  {
    id: "cog_02",
    dimension: "COG",
    question: "有没有一个念头今天反复回来？",
    options: ["没有", "有但不影响", "挺占位置", "一直绕不出去"],
  },
  // MOT - 动力与行动（2题）
  {
    id: "mot_01",
    dimension: "MOT",
    question: "今天开始做事的第一步难吗？",
    options: ["很容易", "还好", "有点难", "非常难"],
  },
  {
    id: "mot_02",
    dimension: "MOT",
    question: "今天的动力更像什么？",
    options: ["自己在往前走", "需要推动", "一直拖着走", "几乎停住"],
  },
  // SELF - 自我关系（2题）
  {
    id: "self_01",
    dimension: "SELF",
    question: "今天你对自己说话的语气更像谁？",
    options: ["温柔的朋友", "普通同事", "严格老师", "苛刻评审", "说不清"],
  },
  {
    id: "self_02",
    dimension: "SELF",
    question: "今天你和自己的距离有多远？",
    options: ["很靠近", "还算靠近", "有点远", "很陌生"],
  },
  // INT - 亲密关系（1题）
  {
    id: "int_01",
    dimension: "INT",
    question: "今天和伴侣/重要的人之间，距离感怎么样？",
    options: ["很靠近", "舒服的距离", "有点远", "有摩擦", "不适用"],
  },
  // FAM - 家庭关系（1题）
  {
    id: "fam_01",
    dimension: "FAM",
    question: "今天家庭/你选择的家给你的感觉更像什么？",
    options: ["支持", "平静", "有点压力", "很消耗", "不适用"],
  },
  // WORK - 工作学习（2题）
  {
    id: "work_01",
    dimension: "WORK",
    question: "今天工作/学习把你推到了什么程度？",
    options: ["很从容", "有点忙", "比较吃力", "快超载", "不适用"],
  },
  {
    id: "work_02",
    dimension: "WORK",
    question: "今天结束工作/学习后，你能把它放下吗？",
    options: ["能", "大部分能", "还挂着", "完全放不下", "不适用"],
  },
  // SOC - 人际连接（2题）
  {
    id: "soc_01",
    dimension: "SOC",
    question: `今天有没有一个人让你觉得"我不用解释太多"？`,
    options: ["有", "好像有", "没有", "今天没怎么和人接触"],
  },
  {
    id: "soc_02",
    dimension: "SOC",
    question: "今天有没有感到孤单？",
    options: ["几乎没有", "有一点", "比较明显", "很强烈", "说不清"],
  },
  // MEA - 意义与方向（1题）
  {
    id: "mea_01",
    dimension: "MEA",
    question: "今天你对未来的视线有多远？",
    options: ["看得挺远", "看到下一步", "只想先过今天", "完全看不清"],
  },
  // RES - 恢复资源（2题）
  {
    id: "res_01",
    dimension: "RES",
    question: "今天有没有真正休息到，而不只是停止工作？",
    options: ["有", "有一点", "没有", "不知道怎样才算休息"],
  },
  {
    id: "res_02",
    dimension: "RES",
    question: "今天有什么让你恢复了一点？",
    options: ["睡眠", "吃东西", "运动", "音乐/影视", "创作", "自然/散步", "有人陪", "什么都没有"],
  },
];

/**
 * 维度分组 - 用于每日选题
 * 每组每天最多选 1 题（除 VAL 固定 1 题外）
 */
export const DIMENSION_GROUPS = {
  /** 情绪入口 - 每天固定 1 题 */
  mood: ["VAL"] as DimensionCode[],
  /** 身体与状态组 - 三选一 */
  bodyState: ["ENE", "COG", "MOT"] as DimensionCode[],
  /** 关系与场景组 - 四选一 */
  relational: ["INT", "FAM", "WORK", "SOC"] as DimensionCode[],
  /** 自我与意义组 - 三选一 */
  selfMeaning: ["SELF", "MEA", "RES"] as DimensionCode[],
};

/**
 * 周一到周日各维度基础权重（相对值，非概率）
 * 周一偏启动与身体；周二偏睡眠/能量；周三偏连接；
 * 周四偏任务负荷；周五偏自我关系；周六偏恢复与生活；周日偏回顾
 */
export const WEEKDAY_WEIGHTS: Record<number, Partial<Record<DimensionCode, number>>> = {
  0: { SELF: 1.3, MEA: 1.2, RES: 1.2 }, // 周日 - 回顾、自我、意义
  1: { ENE: 1.4, MOT: 1.3, WORK: 1.1 }, // 周一 - 启动、身体、工作
  2: { ENE: 1.4, COG: 1.2, MOT: 1.1 }, // 周二 - 睡眠/能量
  3: { INT: 1.3, SOC: 1.3, FAM: 1.1 }, // 周三 - 连接
  4: { WORK: 1.4, COG: 1.3, MOT: 1.1 }, // 周四 - 任务负荷
  5: { SELF: 1.4, RES: 1.2, MEA: 1.1 }, // 周五 - 自我关系
  6: { RES: 1.4, SOC: 1.3, ENE: 1.2 }, // 周六 - 恢复与生活
};

/**
 * 按维度获取题目
 */
export function getQuestionsByDimension(dim: DimensionCode): DailyQuestion[] {
  return QUESTION_BANK.filter((q) => q.dimension === dim);
}

/**
 * 统计每个维度的题目数量
 */
export function getQuestionCountByDimension(): Record<DimensionCode, number> {
  const counts = {} as Record<DimensionCode, number>;
  for (const dim of DIMENSIONS) {
    counts[dim.code] = QUESTION_BANK.filter((q) => q.dimension === dim.code).length;
  }
  return counts;
}
