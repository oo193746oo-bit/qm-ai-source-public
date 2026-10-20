/**
 * QM 小红书账号全局唯一真相源 (Single Source of Truth)
 *
 * 全站所有页面和组件涉及小红书时只读取本文件，禁止维护副本。
 * 改账号名/链接/赞藏数据只改这里，不需要改其他文件。
 *
 * 数据来源：GPT v8.0 部署包 01_xhs_accounts_GLOBAL_SOURCE_OF_TRUTH.json
 * 更新日期：2026-08-25
 */

export interface XhsAccount {
  priority: number;
  role: "primary" | "mbti" | "eating" | "relationship";
  handle: string;
  likesSaves: string;
  url: string;
  topics: string[];
}

export const XHS_ACCOUNTS: XhsAccount[] = [
  {
    priority: 1,
    role: "primary",
    handle: "@QM酷儿心理咨询（酷雪）",
    likesSaves: "13.6万次赞与收藏",
    url: "https://xhslink.cn/m/75AZKjB4sfw",
    topics: ["QM整体", "心理咨询中心", "团队", "多元文化", "综合心理内容"],
  },
  {
    priority: 2,
    role: "mbti",
    handle: "@QM酷儿心理MBTI丨酷雪",
    likesSaves: "7.2万次赞与收藏",
    url: "https://xhslink.cn/m/1lbrEawUMlk",
    topics: ["MBTI", "心理测评", "工作坊", "性格", "职场"],
  },
  {
    priority: 3,
    role: "eating",
    handle: "@QM酷儿饮食心理咨询丨酷雪",
    likesSaves: "4.4万次赞与收藏",
    url: "https://xhslink.cn/m/7iA3bCKIpoz",
    topics: ["进食障碍", "饮食心理", "儿童青少年", "神经多样性"],
  },
  {
    priority: 4,
    role: "relationship",
    handle: "@QM酷儿心理情感丨酷雪",
    likesSaves: "4.8万次赞与收藏",
    url: "https://xhslink.cn/m/5JvfQ4IOgC5",
    topics: ["亲密关系", "原生家庭", "NPD相关关系困扰", "情绪"],
  },
];

/** 默认推荐主账号 */
export const XHS_PRIMARY = XHS_ACCOUNTS[0];

/** 外链安全属性 */
export const XHS_LINK_PROPS = {
  target: "_blank" as const,
  rel: "noopener noreferrer",
};

/**
 * 根据主题关键词路由到对应小红书账号
 * 智能推荐规则：默认1个，跨主题最多2个，明确要求全部才返回4个
 */
export function routeXhsAccount(
  topic: string
): XhsAccount {
  const t = topic.toLowerCase();
  if (/(mbti|测评|测试|性格|工作坊|职场|职业)/.test(t)) return XHS_ACCOUNTS[1];
  if (/(进食|饮食|暴食|厌食|贪食|儿童|青少年|adhd|神经多样)/.test(t)) return XHS_ACCOUNTS[2];
  if (/(关系|亲密|原生家庭|npd|情感|恋爱|婚姻|伴侣)/.test(t)) return XHS_ACCOUNTS[3];
  return XHS_ACCOUNTS[0]; // primary
}
