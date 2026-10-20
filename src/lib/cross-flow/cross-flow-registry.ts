/**
 * Cross-Flow Registry · 跨模块数据流契约登记（Wave 2）
 *
 * 统一登记各模块「带结果 / 问小酷 / 继续聊聊」进入主对话的数据流契约，
 * 登记各入口的真实跳转及摘要传递状态；wired=false 表示尚未完成接线。
 * 不把页面跳转、客户端请求字段或本地摘要冒称大脑已经确认读取。
 *
 * 实现落地于 src/lib/context/pending-context.ts；桌面消费端为
 * src/hooks/use-desktop-chat.ts，完整回复后才确认清除。真实脑线读取仍需联调。
 */

export type FlowSource = "assessment" | "knowledge" | "tool" | "treehole";

export interface CrossFlowContract {
  id: string;
  /** 派工线 */
  line: string;
  source: FlowSource;
  /** 跳转目标（必为真实存在的路由） */
  destination: string;
  /** 触发入口 */
  entries: string[];
  /** 是否真实将人话摘要注入小酷上下文 */
  wired: boolean;
  /** 上下文持久化：localStorage，桌面完整回复后清除 */
  persistence: "localStorage-consume-once" | "none";
  /** 是否避免在 URL 携带敏感数据 */
  noSensitiveUrl: boolean;
  /** 安全闸门（危机检测优先于任何上下文注入） */
  safetyGate: string;
  /** 失败回退：存储不可用/非法摘要时不阻塞跳转 */
  failureFallback: string;
}

export const CROSS_FLOW_REGISTRY: CrossFlowContract[] = [
  {
    id: "CF-A07-ASSESS",
    line: "A07",
    source: "assessment",
    destination: "/chat",
    entries: [
      "assessments 引擎结果页「带结果和小酷聊聊」",
      "MBTI 报告页「带结果和小酷聊聊」",
    ],
    wired: true,
    persistence: "localStorage-consume-once",
    noSensitiveUrl: true,
    safetyGate: "结果摘要只含测评维度/倾向，不含个人原始倾诉；注入为 system 上下文，不参与用户意图危机检测",
    failureFallback: "savePendingContext 吞异常；存储不可用时不阻塞跳转，小酷正常空上下文进入",
  },
  {
    id: "CF-A05-KB",
    line: "A05",
    source: "knowledge",
    destination: "/chat",
    entries: [
      "知识库文章正文「和小酷聊聊」CTA",
      "XiaokuDock 的 chat 动作按钮",
      "MarkdownRenderer 知识内链「聊」",
    ],
    wired: true,
    persistence: "localStorage-consume-once",
    noSensitiveUrl: true,
    safetyGate: "摘要只含文章标题/领域/目的与用户意图声明；知识域内安全规则由 kb-safety 于文章页先行展示",
    failureFallback: "文章页写桥后进入 /chat；存储失败仍能进入小酷，但不能声称摘要送达",
  },
  {
    id: "CF-A06-TOOL",
    line: "A06",
    source: "tool",
    destination: "/chat",
    entries: ["工具完成页「找小酷聊聊」（开启 share_with_xiaoku 时）"],
    wired: true,
    persistence: "localStorage-consume-once",
    noSensitiveUrl: true,
    safetyGate: "摘要只含工具名/完成状态/主观帮助感；练习为自助内容，注入澄清不替代专业支持",
    failureFallback: "仅当用户同意分享时写桥；onXiaoku() 始终执行，写桥失败不改变跳转",
  },
  {
    id: "CF-A04-TREEHOLE",
    line: "A04",
    source: "treehole",
    destination: "/chat",
    entries: ["树洞回信（view 阶段）「和小酷继续聊聊」"],
    wired: false,
    persistence: "none",
    noSensitiveUrl: true,
    safetyGate:
      "树洞与小酷各自使用既有危机处理；默认摘要桥待大脑合同，不能声称已有安全接线",
    failureFallback: "树洞目前只进入 /chat；旧原文自动注入已关闭，默认摘要脑线合同尚未核定",
  },
];
