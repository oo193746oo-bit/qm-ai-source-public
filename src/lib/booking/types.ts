// QM 预约系统类型定义 v4.0 - 任务状态机

// 心理师信息
export interface Therapist {
  name: string;          // 中文名
  name_en: string;       // 英文名
  role: string;          // 角色：心理师 / 心理教练（非心理师）
  level: string;         // 等级：专家等级 / 资深等级 / 成熟等级 / 心理教练
  years: string;         // 从业年限
  price: number;         // 60分钟常规价格
  background: string;    // 专业背景
  areas: string[];       // 擅长领域
  style: string;         // 风格/名言
  languages: string[];   // 语言能力
  billing_note?: string; // 特殊计费说明
  photo?: string;        // 照片文件（public/therapists/ 下小写 slug 文件名）
  about?: string;        // 「关于我」500 字定稿（v2 唯一事实源）
  pricing?: TherapistPricing; // 费用档位（4.2 表逐字；雪花仅 regular60/90）
}

// 心理师费用档位（F0910 文案单 4.2 逐字）
export interface TherapistPricing {
  regular60: number;   // 常规 60 分钟
  regular90: number;   // 常规 90 分钟
  first60?: number;    // 首次优惠 60 分钟
  first90?: number;    // 首次优惠 90 分钟
  card5?: number;      // 会员次卡 5 小时
  card10?: number;     // 会员次卡 10 小时
  overtime15?: number; // 超时补费 / 15 分钟
}

// 价格档位
export interface PriceTier {
  level: string;          // 等级名称
  regular_60: number;     // 常规60分钟
  regular_90: number;     // 常规90分钟
  first_60: number;       // 首次60分钟
  first_90: number;       // 首次90分钟
  pack5: number;          // 5小时卡
  pack10: number;         // 10小时卡
  note?: string;          // 备注
}

// 问题选项
export interface QuestionOption {
  label: string;
  value: string;
}

// 问题定义
export interface Question {
  id: string;
  text: string;
  type: 'single' | 'multi' | 'open' | 'number';
  options?: QuestionOption[];
  required: boolean;
  skipable: boolean;
  placeholder?: string;
  sensitive?: boolean;   // 是否敏感字段，非必要不主动追问
}

// ==================== v4.0 任务状态机 ====================

// 任务ID：6个核心任务
export type TaskId = 'INFO' | 'INTAKE' | 'MATCHING' | 'BUDGET' | 'SUMMARY' | 'HANDOFF';

// 任务状态
export type TaskStatus = 'pending' | 'active' | 'done' | 'skipped';

// 任务定义
export interface Task {
  id: TaskId;
  name: string;           // 任务名称（简短显示用）
  title: string;          // 任务标题（完整描述）
  description: string;    // 任务目标描述
  order: number;          // 建议顺序（0-5）
  questions: Question[];  // 该任务下的问题
  required_fields: string[];   // 该任务下的必填字段ID
  recommended_fields: string[]; // 该任务下的推荐（非必填）字段ID
  sensitive_fields: string[];  // 该任务下的敏感字段ID（非必要不主动追问）
  can_skip: boolean;      // 整个任务是否可跳过
}

// 任务进度跟踪
export interface TaskProgress {
  taskId: TaskId;
  status: TaskStatus;
  currentQuestionIdx: number; // 当前问题索引
  answeredCount: number;      // 已回答问题数
  skippedFields: string[];    // 跳过的字段
}

// ==================== 聊天消息 ====================

export interface ChatMessage {
  role: 'xiaoxue' | 'user' | 'system';
  content: string;
  buttons?: QuestionOption[];
  timestamp: number;
  taskId?: TaskId;            // v4.0: 所属任务
  questionId?: string;
  cardType?: 'fee' | 'therapist' | 'summary' | 'crisis' | 'emotion' | 'task_transition' | 'low_push';
  cardData?: Record<string, unknown>;
}

// 费用计算结果
export interface FeeCalculation {
  tier: string;             // 档位，如 "700"
  duration: number;         // 时长（分钟）
  first_timer: boolean;     // 是否首次
  pack?: 5 | 10;            // 次卡数量
  subtotal: number;         // 小计
  discount: number;         // 优惠金额
  total: number;            // 总价
  manual_review?: boolean;  // 是否需要人工复核
  review_reason?: string;   // 人工复核原因
}

// 用户填写的字段
// v4.0: 3项必填，其余推荐/可跳过
export interface BookingFields {
  // --- 授权（始终需要） ---
  consent_given: boolean;
  xiaoku_summary_consent: boolean;

  // --- INFO 任务：3项必填 ---
  // 1. 预约/服务目标（必填）
  intent?: 'direct_booking' | 'just_looking' | 'exploring' | 'find_match' | 'specific_therapist';
  booking_for?: 'self' | 'partner' | 'family' | 'child' | 'other';
  booking_for_detail?: string;
  core_topics: string[];
  core_topics_open?: string;

  // 2. 可联系方式或明确拒绝（必填二选一）
  contact_method?: 'wechat' | 'phone' | 'email' | 'none_refused';
  contact_value?: string;   // 具体联系方式

  // 3. 城市/国家或时区（跨时区时必填，国内推荐）
  city?: string;
  country?: string;
  timezone?: string;

  // --- INTAKE 任务：推荐字段 ---
  experience?: 'experienced' | 'first_time';
  duration_issue?: string;
  service_mode?: 'offline' | 'online' | 'both';
  // 议题方向已在core_topics中

  // --- MATCHING 任务：推荐字段 ---
  gender_preference?: 'female' | 'male' | 'no_preference';
  language_preference: string[];
  identity_preference?: string;   // 敏感
  concerns: string[];
  other_concerns?: string;
  supplement?: string;
  designated_therapist?: string;  // 用户指定的心理师姓名
  selected_therapist?: string;    // 最终选择的心理师

  // --- BUDGET 任务：推荐字段 ---
  budget?: number;        // 预算上限（单次60分钟）
  budget_open?: string;
  session_duration?: 60 | 90;
  session_mode?: 'online' | 'offline';
  time_preference?: string;
  fee_plan?: 'first' | 'regular' | 'pack5' | 'pack10';
}

// 预约草稿
export interface BookingDraft {
  booking_id: string;
  status: 'draft' | 'submitted' | 'cancelled';
  current_task: TaskId;       // v4.0: 当前任务ID
  task_progress: Record<TaskId, TaskProgress>; // v4.0: 各任务进度
  completed_tasks_count: number; // 已完成任务数
  consent: {
    given: boolean;
    xiaoku_summary: boolean;
    scope: string[];
  };
  fields: BookingFields;
  fee_snapshot?: FeeCalculation;
  manual_review_items: string[];
  change_log: ChangeLogEntry[];
  skipped_fields: string[];
  // v4.0: 推进模式
  push_mode: 'normal' | 'low' | 'crisis_paused'; // 正常推进 / 低推进（用户说只是问问） / 危机暂停
  timestamps: {
    created_at: number;
    updated_at: number;
    submitted_at?: number;
  };
}

// 变更日志
export interface ChangeLogEntry {
  field: string;
  old_value: string;
  new_value: string;
  timestamp: number;
}

// 推荐结果
export interface TherapistRecommendation {
  therapist: Therapist;
  reasons: string[];   // 为什么推荐给用户（不使用百分比/匹配度分数）
}

// 页面状态机
export type PageState = 'LANDING' | 'CHAT' | 'SUMMARY' | 'SUBMITTED';

// 危机关键词检测结果
export interface CrisisCheckResult {
  is_crisis: boolean;
  keywords: string[];
}
