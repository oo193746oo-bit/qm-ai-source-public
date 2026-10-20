// QM 自助工具 v3.0 类型定义

export interface ToolStep {
  step: number;
  instruction: string;
}

export interface ToolDataCapture {
  required: string[];
  optional: string[];
  never_infer: string[];
}

export interface ToolNavigation {
  home: string;
  xiaoku: string;
}

export interface Tool {
  tool_id: string;
  name: string;
  category_id: string;
  category_name: string;
  time_estimate_min: number;
  difficulty: number;
  theory_basis: string;
  mechanism: string;
  scenarios: string[];
  steps: ToolStep[];
  pre_guidance: string;
  mid_guidance_pool: string[];
  completion_message: string;
  safety_note: string;
  variants: string[];
  keywords: string[];
  data_capture: ToolDataCapture;
  navigation: ToolNavigation;
  is_diary: boolean;
}

export interface ToolCategory {
  id: string;
  name: string;
  purpose: string;
}

export type ToolEventType =
  | 'started'
  | 'paused'
  | 'resumed'
  | 'completed'
  | 'stopped'
  | 'rated'
  | 'deleted';

export type ToolEventSource =
  | 'xiaoku'
  | 'tools_home'
  | 'quick_match'
  | 'history'
  | 'library';

export interface ToolEventMetrics {
  time_spent_sec?: number;
  step_reached?: number;
  total_steps?: number;
  before_intensity?: number; // 0-10
  after_intensity?: number; // 0-10
  helpfulness?: number; // 1-5
}

export interface ToolEventConsent {
  save_to_device: boolean;
  share_summary_with_xiaoku: boolean;
}

export interface ToolEvent {
  event_id: string;
  user_or_device_id: string;
  tool_id: string;
  event_type: ToolEventType;
  timestamp: string; // ISO-8601
  source: ToolEventSource;
  metrics?: ToolEventMetrics;
  user_note?: string;
  consent: ToolEventConsent;
}

// 小酷 ↔ 工具 Context Capsule
export interface ContextCapsule {
  tool_id: string;
  tool_name: string;
  completion_status: 'completed' | 'stopped' | 'paused';
  helpfulness?: number;
  user_note?: string;
  current_need_summary?: string; // 用户授权时才传
}

// Quick Match 答案
export interface QuickMatchAnswer {
  question_index: number;
  selected_options?: string[];
  free_text?: string;
  skipped: boolean;
}

// Quick Match 状态
export interface QuickMatchState {
  current_index: number;
  answers: QuickMatchAnswer[];
}

// 推荐结果
export interface ToolRecommendation {
  tool: Tool;
  score: number; // 仅内部使用，不展示给用户
  reason: string;
}

// FAST MODE 状态
export type FastModeStatus = 'normal' | 'fast' | 'ended';

// 视图类型
export type ToolsView =
  | 'hero'
  | 'quick-match'
  | 'library'
  | 'detail'
  | 'player'
  | 'complete'
  | 'history';
