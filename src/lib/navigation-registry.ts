/**
 * QM AI Navigation Registry v3.0
 * 全局导航单一事实源（Single Source of Truth）
 *
 * 所有侧栏、抽屉、首页卡片、顶部导航均从此文件读取菜单数据。
 * 修改菜单只需改此文件，无需在多处维护。
 *
 * 分组：
 * - 核心体验：首页 / 自由对话 / 情绪树洞 / 心理测评 / 安排预约
 * - 探索与支持：知识库 / 自助工具 / 常见问题
 * - QM：关于QM / 联系我们
 */

export type NavGroup = "核心体验" | "探索与支持" | "QM";

export interface NavItem {
  /** 唯一标识 */
  id: string;
  /** 菜单显示名（简体中文） */
  label: string;
  /** 路由路径。特殊路由使用常量名，由调用方解析为实际 URL */
  route: string;
  /** 所属分组 */
  group: NavGroup;
  /** 用途描述（1行，用于 tooltip 或副标题） */
  purpose: string;
  /** 图标（emoji 或 SVG 组件名） */
  icon: string;
  /** 动作类型：
   * - route：普通页面跳转
   * - xiaoku_chat：触发小酷对话（在当前页切换到小酷）
   * - xiaoxue_booking：触发小雪预约（跳转 /booking）
   */
  action?: "route" | "xiaoku_chat" | "xiaoxue_booking";
}

/**
 * 10 项导航注册表
 *
 * 注意：route 字段为路由路径字符串。
 * 对于非页面路由的特殊动作（如自由对话触发小酷），
 * 调用方需根据 id 或 action 字段做特殊处理。
 */
export const NAV_REGISTRY: NavItem[] = [
  // ===== 核心体验 =====
  {
    id: "home",
    label: "首页",
    route: "/",
    group: "核心体验",
    purpose: "回到QM产品首页与品牌引导",
    icon: "🏠",
    action: "route",
  },
  {
    id: "chat",
    label: "自由对话",
    route: "/chat",
    group: "核心体验",
    purpose: "进入小酷自由对话",
    icon: "💬",
    action: "xiaoku_chat",
  },
  {
    id: "treehole",
    label: "情绪树洞",
    route: "/treehole",
    group: "核心体验",
    purpose: "每日情绪收集、日记树洞、小酷每日陪伴",
    icon: "🌳",
    action: "route",
  },
  {
    id: "assessments",
    label: "心理测评",
    route: "/assessments",
    group: "核心体验",
    purpose: "进入心理测评专区",
    icon: "📊",
    action: "route",
  },
  {
    id: "booking",
    label: "安排预约",
    route: "/booking",
    group: "核心体验",
    purpose: "进入小雪预约与咨询前准备",
    icon: "❄️",
    action: "xiaoxue_booking",
  },

  // ===== 虚拟心理师服务（Wave 3）=====
  {
    id: "therapists",
    label: "心理师团队",
    route: "/therapists",
    group: "核心体验",
    purpose: "浏览真人心理师团队资料，选择后通过 AI 顾问与人工客服预约",
    icon: "🧭",
    action: "route",
  },

  // ===== 探索与支持 =====
//   {
//     id: "preplanning",
//     label: "意定监护",
//     route: "/preplanning",
//     group: "探索与支持",
//     purpose: "了解意定监护与预先照护规划",
//     icon: "📝",
//     action: "route",
//   },
  {
    id: "knowledge",
    label: "知识库",
    route: "/knowledge",
    group: "探索与支持",
    purpose: "进入QM心理知识与互动学习",
    icon: "📚",
    action: "route",
  },
  {
    id: "tools",
    label: "自助工具",
    route: "/tools",
    group: "探索与支持",
    purpose: "进入结构化自助练习",
    icon: "🌿",
    action: "route",
  },
  {
    id: "faq",
    label: "常见问题",
    route: "/faq",
    group: "探索与支持",
    purpose: "查看咨询、AI、隐私、费用、使用FAQ",
    icon: "❓",
    action: "route",
  },

  // ===== QM =====
  {
    id: "about",
    label: "关于QM",
    route: "/about-qm",
    group: "QM",
    purpose: "查看完整版品牌介绍",
    icon: "💎",
    action: "route",
  },
  {
    id: "contact",
    label: "联系我们",
    route: "/contact",
    group: "QM",
    purpose: "进入联系与人工支持入口",
    icon: "📞",
    action: "route",
  },
  {
    id: "privacy",
    label: "隐私政策",
    route: "/privacy",
    group: "QM",
    purpose: "查看数据存储、对话处理与隐私保护说明",
    icon: "🔒",
    action: "route",
  },
  {
    id: "terms",
    label: "服务条款",
    route: "/terms",
    group: "QM",
    purpose: "查看服务说明、使用规则与免责声明",
    icon: "📄",
    action: "route",
  },
];

/** 分组定义与排序 */
export const NAV_GROUPS: NavGroup[] = ["核心体验", "探索与支持", "QM"];

/**
 * 按分组获取菜单项
 * @param group 分组名
 * @returns 该分组下的所有菜单项（保持原顺序）
 */
export function getNavByGroup(group: NavGroup): NavItem[] {
  return NAV_REGISTRY.filter((item) => item.group === group && item.action !== "xiaoxue_booking");
}

/**
 * 根据路由路径获取当前激活的菜单项
 * 支持精确匹配和前缀匹配（子页面也会高亮父菜单）
 *
 * @param pathname 当前页面路径
 * @returns 匹配到的菜单项，未匹配到返回 null
 */
export function getActiveItem(pathname: string): NavItem | null {
  // 精确匹配优先
  const exact = NAV_REGISTRY.find((item) => item.route === pathname);
  if (exact) return exact;

  // 前缀匹配（子页面高亮父菜单）
  // 忽略根路径 "/" 的前缀匹配，避免所有页面都匹配到首页
  const prefixMatch = NAV_REGISTRY.find(
    (item) =>
      item.route !== "/" &&
      pathname.startsWith(item.route + "/"),
  );
  if (prefixMatch) return prefixMatch;

  return null;
}

/**
 * 根据 id 获取菜单项
 */
export function getNavById(id: string): NavItem | undefined {
  return NAV_REGISTRY.find((item) => item.id === id);
}

/**
 * 获取分组对应的菜单项（按分组组织的二维结构）
 * 用于 Sidebar / Drawer 的分组渲染
 */
export function getGroupedNav(): { group: NavGroup; items: NavItem[] }[] {
  return NAV_GROUPS.map((group) => ({
    group,
    items: getNavByGroup(group),
  }));
}
