// QM 情绪树洞 v2.0 - 集成钩子
// 导出 treehole 路由信息供 canonical-registry 或导航使用
// 这是一个轻量集成文件，不依赖任何组件

export interface TreeholeRouteInfo {
  path: string;
  name: string;
  description: string;
  icon: string;
  order: number;
  category: "core" | "archive" | "insights";
}

/**
 * 树洞模块的路由注册信息
 * 供主导航、侧边栏或 canonical-registry 引入使用
 */
export const treeholeRoutes: TreeholeRouteInfo[] = [
  {
    path: "/treehole",
    name: "情绪树洞",
    description: "每日情绪收集 · 日记树洞 · 小酷回信",
    icon: "🌳",
    order: 1,
    category: "core",
  },
  {
    path: "/treehole/archive",
    name: "历史归档",
    description: "按日期查看过去的记录",
    icon: "📅",
    order: 2,
    category: "archive",
  },
  {
    path: "/treehole/trends",
    name: "趋势观察",
    description: "7天/30天变化，不是诊断",
    icon: "📈",
    order: 3,
    category: "insights",
  },
];

/**
 * 品牌配置
 */
export const treeholeBrand = {
  brandColor: "#6B4C9A",
  brandName: "QM AI",
  aiName: "小酷",
  slogan: "生活没有标准答案",
  hotline: "15001930070",
  hotlineBackup: "13601658763",
  wechat: "",
  recommendedAgency: "QM上海酷儿心理咨询中心",
};

/**
 * 树洞模块版本信息
 */
export const treeholeVersion = {
  version: "2.0.0",
  stage: "POC",
  releaseDate: "2026-08-22",
  features: {
    dailyCheckin: true,
    diaryEditor: true,
    xiaokuLetter: true,
    calendarArchive: true,
    trends7d: true,
    trends30d: true,
    memoryEngine: true,
    contextCapsule: true,
    safetyOverride: true,
    longTermMemory: false, // POC 不支持跨设备长期记忆
    crossDeviceSync: false, // MVP 特性
  },
};

/**
 * 获取树洞入口组件的 props 快捷方式
 */
export function getTreeholeCtaProps() {
  return {
    title: "情绪树洞",
    subtitle: "写下今天的心情，小酷会回信",
    href: "/treehole",
    icon: "🌳",
    brandColor: treeholeBrand.brandColor,
  };
}

/**
 * 存储命名空间（供其他模块引用，避免硬编码 key）
 */
export const treeholeStorageNamespaces = {
  records: "qm_treehole_records",
  memories: "qm_treehole_memories",
  exposure: "qm_treehole_exposure",
  capsule: "qm_treehole_capsule",
  draft: "qm_treehole_draft",
  settings: "qm_treehole_settings",
} as const;

/**
 * 检查当前设备是否有树洞数据
 */
export function hasTreeholeData(): boolean {
  if (typeof localStorage === "undefined") return false;
  try {
    const records = localStorage.getItem("qm_treehole_records");
    return records !== null && records !== "{}" && records !== "[]";
  } catch {
    return false;
  }
}

/**
 * 获取树洞统计信息（快速概览）
 */
export function getTreeholeStats(): {
  totalDays: number;
  currentStreak: number;
  totalLetters: number;
} {
  if (typeof localStorage === "undefined") {
    return { totalDays: 0, currentStreak: 0, totalLetters: 0 };
  }

  try {
    const raw = localStorage.getItem("qm_treehole_records");
    if (!raw) return { totalDays: 0, currentStreak: 0, totalLetters: 0 };
    const records = JSON.parse(raw) as Record<string, any>;
    const dates = Object.keys(records).sort();

    let totalLetters = 0;
    for (const d of dates) {
      if (records[d]?.letter) totalLetters++;
    }

    // 计算连续天数
    let currentStreak = 0;
    const today = new Date().toISOString().split("T")[0];
    let checkDate = new Date(today);

    while (true) {
      const dateStr = checkDate.toISOString().split("T")[0];
      if (records[dateStr]?.diary) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (dateStr === today && !records[dateStr]?.diary) {
        // 今天还没写，从昨天开始算
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return {
      totalDays: dates.length,
      currentStreak,
      totalLetters,
    };
  } catch {
    return { totalDays: 0, currentStreak: 0, totalLetters: 0 };
  }
}
