// ============================================================
// QM AI — Canonical Assessment Registry v3.0
// 用途：心理测评专区唯一卡片清单、固定排序、路由去重
//       + 双向跳转 Handoff / 推荐节流 / 导出契约 / 危机优先
// 规则：同一测评只显示一张卡；旧 id 统一 redirect 到 canonical 路由
// ============================================================

export interface CanonicalAssessment {
  key: string;
  order: number;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  color: string;
  href: string;
  questionLabel: string;
  duration: string;
  version: string;
  /** 推荐引擎使用的场景信号（中文） */
  signals: string;
}

/**
 * 最终前台唯一清单（固定顺序，桌面每行3张）
 * 第1行：SCL-90 / MBTI 93题 / 阿德勒
 * 第2行：霍兰德 / 大五人格 / 职业价值观
 * 第3行：多元智能 / 成人ADHD / 性别多元
 */
export const CANONICAL_ASSESSMENTS: CanonicalAssessment[] = [
  {
    key: 'scl90',
    order: 1,
    title: 'SCL-90 情绪自评',
    subtitle: '90题 · 10项心理因子',
    description:
      '从躯体化、焦虑、抑郁等10个维度，帮你了解最近一周的整体心理状态。',
    icon: '🧠',
    color: 'from-violet-500 to-purple-600',
    href: '/assessments/scl90',
    questionLabel: '90 题',
    duration: '约 10 分钟',
    version: 'v2.0',
    signals: '持续情绪困扰、焦虑、低落、躯体不适、睡眠与情绪状态',
  },
  {
    key: 'mbti',
    order: 2,
    title: 'QM 93题 MBTI 人格偏好测试',
    subtitle: '93题 · 四维连续偏好 + 清晰度',
    description:
      '不只给你四个字母，更展示你在每个维度上的偏好强度，以及个性化的成长观察。',
    icon: '🎭',
    color: 'from-purple-500 to-fuchsia-500',
    href: '/mbti',
    questionLabel: '93 题',
    duration: '约 10-15 分钟',
    version: 'v3.0',
    signals: '性格理解、沟通偏好、决策偏好、自我探索',
  },
  {
    key: 'adler',
    order: 3,
    title: '阿德勒指数',
    subtitle: '24题 · 4维 · 7 Lens',
    description:
      '基于阿德勒个体心理学，看见你的选择感、课题边界、勇气与共同体连接。',
    icon: '🌱',
    color: 'from-emerald-500 to-teal-500',
    href: '/assessments/adler-index',
    questionLabel: '24 题',
    duration: '约 5-8 分钟',
    version: 'v4.0',
    signals: '归属感、关系位置、勇气、自我接纳、生活方向',
  },
  {
    key: 'holland',
    order: 4,
    title: '霍兰德职业兴趣',
    subtitle: 'RIASEC 六型',
    description:
      '通过现实型、研究型、艺术型、社会型、企业型、常规型六个方向，发现你天然感兴趣的职业领域。',
    icon: '🧭',
    color: 'from-blue-500 to-indigo-500',
    href: '/assessments/holland',
    questionLabel: '30 题',
    duration: '约 5 分钟',
    version: 'v1.9',
    signals: '职业兴趣、专业选择、工作类型、转行方向',
  },
  {
    key: 'bigfive',
    order: 5,
    title: '大五人格特质测评',
    subtitle: '60题 · OCEAN 五维',
    description:
      '从开放性、尽责性、外向性、宜人性、神经质五个维度，描绘你稳定的人格特质轮廓。',
    icon: '⭐',
    color: 'from-amber-500 to-orange-500',
    href: '/assessments/bigfive',
    questionLabel: '60 题',
    duration: '约 8 分钟',
    version: 'v3.0',
    signals: '人格特质、行为倾向、关系与工作模式',
  },
  {
    key: 'workvalues',
    order: 6,
    title: '职业价值观测评',
    subtitle: 'v4.0 · 8项核心价值 + 28组组合',
    description:
      '发现在工作中对你真正重要的东西，了解价值之间的协同与张力，在求职、转行、倦怠中获得方向。',
    icon: '🎯',
    color: 'from-rose-500 to-pink-500',
    href: '/assessments/work-values',
    questionLabel: '24 题',
    duration: '约 5-8 分钟',
    version: 'v4.0',
    signals: 'Offer比较、工作意义、薪资与稳定、职业倦怠、工作环境取舍',
  },
  {
    key: 'multipleintel',
    order: 7,
    title: '多元智能测评',
    subtitle: 'v4.0 · 8种智能通道',
    description:
      '加德纳多元智能理论的QM实践，发现你更常调用的学习、表达与连接方式。',
    icon: '💡',
    color: 'from-cyan-500 to-sky-500',
    href: '/assessments/multiple-intelligence',
    questionLabel: '24 题',
    duration: '约 5 分钟',
    version: 'v4.0',
    signals: '学习方式、表达方式、项目角色、学习路径',
  },
  {
    key: 'adultadhd',
    order: 8,
    title: '成人ADHD评估',
    subtitle: '48题 · 双层循证架构',
    description:
      '从注意力、多动冲动、执行功能、情绪调节、功能影响等模块，帮助你看见自己的注意模式与支持需求。非诊断工具。',
    icon: '⚡',
    color: 'from-indigo-500 to-violet-500',
    href: '/adult-adhd',
    questionLabel: '48 题',
    duration: '约 10 分钟',
    version: 'v4.0',
    signals: '长期分心、启动困难、时间管理、丢三落四、冲动、执行功能',
  },
  {
    key: 'genderdiversity',
    order: 9,
    title: '性别多元指数',
    subtitle: 'QM-GDI-48 · 8维 · 非身份鉴定',
    description:
      '从内在性别感、表达真实感、情境流动、归属与被看见等8个维度，温柔地看见你的性别体验。非诊断、非身份鉴定。',
    icon: '🌈',
    color: 'from-pink-400 via-purple-400 to-indigo-400',
    href: '/assessments/gender-diversity',
    questionLabel: '48 题',
    duration: '约 8-10 分钟',
    version: 'v4.1',
    signals: '性别体验、性别表达、被正确称呼、性别流动、性别归属、性别愉悦',
  },
];

/**
 * Legacy / duplicate id → canonical 路由
 * 同时收录部署工程文档中给出的别名路由，保证所有旧链接都可达
 */
export const LEGACY_REDIRECTS: Record<string, string> = {
  // 旧 MBTI 20题 / mbti-v3 初版 → 93题完整页
  mbti: '/mbti',
  'mbti-v3': '/mbti',
  // 职业价值观别名
  'work-values-v4': '/assessments/work-values',
  // 成人ADHD 别名（文档使用 /assessments/adhd 与 /adult-adhd 两种）
  'adult-adhd': '/adult-adhd',
  adhd: '/adult-adhd',
  // 性别多元别名 → v4.1 canonical 页
  // 注意：'gender-diversity' 本身不在此映射，GDI v4.1 包自带独立 page.tsx
  gender: '/assessments/gender-diversity',
  gdi: '/assessments/gender-diversity',
  // 情绪自评由 SCL-90 替代
  mood: '/assessments/scl90',
};

/**
 * 走旧版 AssessmentEngine 渲染的 id 白名单
 * 其他 id 要么有独立 page.tsx（Next.js 直接匹配），要么走 redirect
 */
export const ENGINE_ASSESSMENT_IDS = new Set([
  'holland',
  'multiple-intelligence',
]);

export function getLegacyRedirect(id: string): string | null {
  return LEGACY_REDIRECTS[id] ?? null;
}

export function getCanonicalAssessments(): CanonicalAssessment[] {
  return [...CANONICAL_ASSESSMENTS].sort((a, b) => a.order - b.order);
}

/** 根据 key 找 canonical 测评定义 */
export function findAssessmentByKey(
  key: string,
): CanonicalAssessment | undefined {
  return CANONICAL_ASSESSMENTS.find((a) => a.key === key);
}

// ============================================================
// 推荐节流（A08）：会话内已拒绝 / 30天内已完成不重复推
// ============================================================

const DISMISS_KEY = 'qm_assessment_dismissed';
const COMPLETED_KEY = 'qm_assessment_completed';
const THROTTLE_KEY = 'qm_assessment_throttle';
const MAX_ACTIVE_RECS = 2;
const COMPLETED_TTL_DAYS = 30;

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.sessionStorage.getItem(key) ?? window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown, persistent = false) {
  if (typeof window === 'undefined') return;
  try {
    const raw = JSON.stringify(value);
    if (persistent) window.localStorage.setItem(key, raw);
    else window.sessionStorage.setItem(key, raw);
  } catch {
    /* noop */
  }
}

export function shouldSuppressRecommendation(key: string): boolean {
  const dismissed = readJSON<string[]>(DISMISS_KEY, []);
  if (dismissed.includes(key)) return true;

  const completed = readJSON<Record<string, number>>(COMPLETED_KEY, {});
  const ts = completed[key];
  if (ts) {
    const days = (Date.now() - ts) / (1000 * 60 * 60 * 24);
    if (days < COMPLETED_TTL_DAYS) return true;
  }

  const activeCount = readJSON<number>(THROTTLE_KEY, 0);
  if (activeCount >= MAX_ACTIVE_RECS) return true;

  return false;
}

export function markRecommendationDismissed(key: string) {
  const list = readJSON<string[]>(DISMISS_KEY, []);
  if (!list.includes(key)) list.push(key);
  writeJSON(DISMISS_KEY, list);
}

export function markRecommendationShown() {
  const n = readJSON<number>(THROTTLE_KEY, 0);
  writeJSON(THROTTLE_KEY, n + 1);
}

export function markAssessmentCompleted(key: string) {
  const completed = readJSON<Record<string, number>>(COMPLETED_KEY, {});
  completed[key] = Date.now();
  writeJSON(COMPLETED_KEY, completed, true);
  // 完成后清掉会话内已展示计数（允许用户主动重测时再次提示）
  writeJSON(THROTTLE_KEY, 0);
}

// ============================================================
// Assessment Handoff（A04 / A05）：短时 token + 同源 sessionStorage
// URL 只携带 token，绝不放原始分或敏感结果
// ============================================================

const HANDOFF_PREFIX = 'qm_handoff_';
const HANDOFF_TTL_MS = 15 * 60 * 1000;

export interface HandoffDimension {
  name: string;
  value: string;
}

export interface HandoffContext {
  valid: boolean;
  assessment_key: string;
  assessment_name: string;
  assessment_version: string;
  completed_at: string;
  public_summary: string;
  key_dimensions: HandoffDimension[];
  themes: string[];
  focus_suggestions: string[];
  boundary_note: string;
}

interface HandoffEnvelope {
  token: string;
  expires_at: number;
  context: HandoffContext;
}

function generateToken(): string {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return `h_${rand}`;
}

/**
 * 测评结果页调用：把公开摘要存入 sessionStorage，返回用于跳转的 token
 * URL 最终形如：/?assessment_token=h_xxx
 */
export function createHandoff(context: Omit<HandoffContext, 'valid'>): string {
  if (typeof window === 'undefined') return '';
  const token = generateToken();
  const envelope: HandoffEnvelope = {
    token,
    expires_at: Date.now() + HANDOFF_TTL_MS,
    context: { ...context, valid: true },
  };
  try {
    window.sessionStorage.setItem(HANDOFF_PREFIX + token, JSON.stringify(envelope));
  } catch {
    /* storage full — ignore */
  }
  return token;
}

/**
 * 聊天页调用：根据 URL 中的 token 读取 handoff；过期 / 缺失返回 valid=false
 */
export function consumeHandoff(token: string | null): HandoffContext {
  const empty: HandoffContext = {
    valid: false,
    assessment_key: '',
    assessment_name: '',
    assessment_version: '',
    completed_at: '',
    public_summary: '',
    key_dimensions: [],
    themes: [],
    focus_suggestions: [],
    boundary_note: '',
  };
  if (!token || typeof window === 'undefined') return empty;
  try {
    const raw = window.sessionStorage.getItem(HANDOFF_PREFIX + token);
    if (!raw) return empty;
    const envelope = JSON.parse(raw) as HandoffEnvelope;
    if (envelope.expires_at < Date.now()) {
      window.sessionStorage.removeItem(HANDOFF_PREFIX + token);
      return empty;
    }
    // 只读一次后删除，避免同 token 反复触发开场白
    window.sessionStorage.removeItem(HANDOFF_PREFIX + token);
    return envelope.context;
  } catch {
    return empty;
  }
}

/**
 * 构造"和小酷聊聊"按钮跳转 URL
 * 结果页使用：<a href={buildHandoffUrl(ctx)}>
 */
export function buildHandoffUrl(context: Omit<HandoffContext, 'valid'>): string {
  const token = createHandoff(context);
  return `/?assessment_token=${encodeURIComponent(token)}`;
}
