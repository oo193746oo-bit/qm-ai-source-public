'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { PageLayout } from '@/components/page-layout';
import { CopyableWechat } from '@/components/copyable-wechat';
import { XiaoxueAiPanel } from '@/components/xiaoxue-ai-panel';
import {
  TASKS,
  TASK_ORDER,
  getNextTaskId,
  getTaskById,
  checkRequiredFields,
  findTherapistByName,
  PRICE_REGISTRY,
} from '@/lib/booking/data';
import { calculateFee, getBudgetOptions, getFeeEmotionLine, needsManualReview } from '@/lib/booking/pricing';
import { detectCrisis as detectCrisisUnified } from '@/lib/crisis-detection';
import {
  readXiaoxueSuggestion,
  clearXiaoxueSuggestion,
  type XiaoxueSuggestion,
} from '@/lib/xiaoxue-bridge';
import type {
  BookingDraft,
  BookingFields,
  ChatMessage,
  PageState,
  FeeCalculation,
  Question,
  QuestionOption,
  TaskId,
  TaskStatus,
  TaskProgress,
} from '@/lib/booking/types';

// ==================== 常量 ====================

const STORAGE_KEY_DRAFT = 'booking_draft';
const STORAGE_KEY_SUBMITTED = 'submitted_bookings';

// ==================== 初始字段 ====================

function createEmptyFields(): BookingFields {
  return {
    consent_given: false,
    xiaoku_summary_consent: false,
    core_topics: [],
    language_preference: [],
    concerns: [],
  };
}

// 初始化任务进度
function createTaskProgressMap(): Record<TaskId, TaskProgress> {
  const map = {} as Record<TaskId, TaskProgress>;
  for (const task of TASKS) {
    map[task.id] = {
      taskId: task.id,
      status: 'pending',
      currentQuestionIdx: 0,
      answeredCount: 0,
      skippedFields: [],
    };
  }
  return map;
}

function createEmptyDraft(): BookingDraft {
  const now = Date.now();
  return {
    booking_id: `booking_${now}`,
    status: 'draft',
    current_task: 'INFO',
    task_progress: createTaskProgressMap(),
    completed_tasks_count: 0,
    consent: {
      given: false,
      xiaoku_summary: false,
      scope: ['booking_info'],
    },
    fields: createEmptyFields(),
    manual_review_items: [],
    change_log: [],
    skipped_fields: [],
    push_mode: 'normal',
    timestamps: {
      created_at: now,
      updated_at: now,
    },
  };
}

// ==================== localStorage 工具 ====================

function safeGetItem(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function safeRemoveItem(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

// ==================== 关键词检测 ====================

// v10.3: 危机检测统一使用 src/lib/crisis-detection.ts（direct+indirect 完整词表），
// 不再维护本地缩水版，避免间接危机表述漏判。
function detectCrisis(text: string): { is_crisis: boolean; keywords: string[] } {
  const r = detectCrisisUnified(text);
  return { is_crisis: r.isCrisis, keywords: r.matchedWords };
}

function detectFeeIntent(text: string): boolean {
  const feeKeywords = [
    '多少钱', '价格', '费用', '收费', '贵不贵', '太贵', '便宜',
    '预算', '优惠', '次卡', '退款', '付费', '值不值', '多少钱一次',
    '怎么收费', '怎么算钱',
  ];
  return feeKeywords.some((kw) => text.includes(kw));
}

function detectLowPushIntent(text: string): boolean {
  // 用户说"只是问问/还没准备好"时低推进
  const keywords = [
    '只是问问', '还没准备好', '先了解', '先看看', '不急',
    '再想想', '考虑考虑', '只是聊聊', '还不确定',
  ];
  return keywords.some((kw) => text.includes(kw));
}

function detectFastModeIntent(text: string): boolean {
  const keywords = [
    '快一点', '快点', '赶紧', '还要多久', '还要问多少',
    '太麻烦了', '能不能快', '直接说', '简单点', '太长了',
  ];
  return keywords.some((kw) => text.includes(kw));
}

function detectSkipIntent(text: string): boolean {
  const keywords = [
    '不想说', '不想回答', '不想聊这个', '跳过', '不说这个',
    '这个算了', '不想提', '别问了', '不管我的事',
    '先不填', '以后再说', '暂不',
  ];
  return keywords.some((kw) => text.includes(kw));
}

// 从长文本中抽取信息填充字段
function extractFieldsFromText(text: string, fields: BookingFields): Partial<BookingFields> {
  const extracted: Partial<BookingFields> = {};
  const topics: string[] = [];
  const langs: string[] = [];
  const concerns: string[] = [];

  // 核心议题
  if (text.includes('焦虑') || text.includes('压力')) topics.push('anxiety');
  if (text.includes('分手') || text.includes('失恋') || text.includes('恋爱') || text.includes('感情')) topics.push('relationship');
  if (text.includes('家庭') || text.includes('父母') || text.includes('原生')) topics.push('family');
  if (text.includes('工作') || text.includes('职场') || text.includes('职业')) topics.push('work');
  if (text.includes('创伤') || text.includes('阴影')) topics.push('trauma');
  if (text.includes('ADHD') || text.includes('注意力') || text.includes('多动')) topics.push('adhd');
  if (text.includes('LGBT') || text.includes('同性恋') || text.includes('出柜') || text.includes('性别')) topics.push('lgbtq');
  if (text.includes('身份') || text.includes('自我探索') || text.includes('迷茫')) topics.push('identity');
  if (text.includes('抑郁') || text.includes('失眠') || text.includes('低落')) topics.push('depression');

  if (topics.length > 0) {
    extracted.core_topics = [...new Set([...(fields.core_topics || []), ...topics])];
  }

  // 语言
  if (text.includes('英语') || text.includes('英文') || text.includes('English')) {
    langs.push('english');
    extracted.language_preference = [...new Set([...(fields.language_preference || []), ...langs])];
  }

  // 海外
  if (text.includes('美国') || text.includes('英国') || text.includes('加拿大') || text.includes('澳洲') || text.includes('海外') || text.includes('留学')) {
    extracted.country = extracted.country || text.match(/(美国|英国|加拿大|澳洲|日本|新加坡)/)?.[0];
  }

  // 预算
  const budgetMatch = text.match(/(\d+)\s*(元|块|左右|以内|以下)/);
  if (budgetMatch) {
    const num = parseInt(budgetMatch[1], 10);
    if (num >= 200 && num <= 3000) {
      extracted.budget = num;
    }
  }

  // 顾虑
  if (text.includes('保密') || text.includes('隐私')) concerns.push('privacy');
  if (text.includes('效果')) concerns.push('effectiveness');
  if (text.includes('贵') || text.includes('钱') || text.includes('费用')) concerns.push('cost');
  if (text.includes('时间')) concerns.push('time');
  if (text.includes('安全') || text.includes('身份') || text.includes('出柜')) concerns.push('identity_safety');

  if (concerns.length > 0) {
    extracted.concerns = [...new Set([...(fields.concerns || []), ...concerns])];
  }

  // 城市/国家
  if (text.includes('上海')) extracted.city = '上海';
  if (text.includes('北京')) extracted.city = '北京';
  if (text.includes('广州') || text.includes('深圳')) extracted.city = text.includes('广州') ? '广州' : '深圳';

  return extracted;
}

// ==================== 主组件 ====================

export default function BookingPage() {
  const [pageState, setPageState] = useState<PageState>('LANDING');
  // v6.4.0：AI 对话模式 vs 结构化填写模式（默认 AI）
  const [mode, setMode] = useState<'ai' | 'structured'>('ai');
  const [draft, setDraft] = useState<BookingDraft>(createEmptyDraft());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentTaskId, setCurrentTaskId] = useState<TaskId>('INFO');
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [fastMode, setFastMode] = useState(false);
  const [showCrisis, setShowCrisis] = useState(false);
  const [feeCalc, setFeeCalc] = useState<FeeCalculation | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [comparingName, setComparingName] = useState<string | null>(null);
  const [deepIntroName, setDeepIntroName] = useState<string | null>(null);
  const [editField, setEditField] = useState<string | null>(null);
  // v10.1: 小雪 AI 对话桥接过来的字段建议（仅结构化模式使用）
  const [bridgeSuggestion, setBridgeSuggestion] = useState<XiaoxueSuggestion | null>(null);
  const [bridgeApplied, setBridgeApplied] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null!);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentTask = getTaskById(currentTaskId);
  const currentQuestion = currentTask?.questions[currentQuestionIdx];

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // 初始化：检查localStorage草稿
  useEffect(() => {
    const saved = safeGetItem(STORAGE_KEY_DRAFT);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as BookingDraft;
        if (parsed.status === 'draft') {
          setHasDraft(true);
        }
      } catch {
        // ignore
      }
    }

    // v10.1: 从小雪 AI 对话桥接过来时，自动切换到结构化模式，并读取字段建议
    try {
      const modeSwitch = window.localStorage.getItem('xiaoxue_mode_switch');
      if (modeSwitch === 'structured') {
        setMode('structured');
        window.localStorage.removeItem('xiaoxue_mode_switch');
      }
      const sug = readXiaoxueSuggestion();
      if (sug) {
        setBridgeSuggestion(sug);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // 保存草稿到localStorage
  const saveDraft = useCallback((d: BookingDraft) => {
    safeSetItem(STORAGE_KEY_DRAFT, JSON.stringify(d));
  }, []);

  // 更新草稿
  const updateDraft = useCallback(
    (updater: (prev: BookingDraft) => BookingDraft) => {
      setDraft((prev) => {
        const next = updater(prev);
        next.timestamps.updated_at = Date.now();
        saveDraft(next);
        return next;
      });
    },
    [saveDraft],
  );

  // 更新任务进度
  const updateTaskProgress = useCallback(
    (taskId: TaskId, updates: Partial<TaskProgress>) => {
      updateDraft((prev) => ({
        ...prev,
        task_progress: {
          ...prev.task_progress,
          [taskId]: {
            ...prev.task_progress[taskId],
            ...updates,
          },
        },
      }));
    },
    [updateDraft],
  );

  // 添加小雪消息
  const addXiaoxueMessage = useCallback(
    (content: string, options?: {
      buttons?: QuestionOption[];
      cardType?: ChatMessage['cardType'];
      cardData?: Record<string, unknown>;
      taskId?: TaskId;
      questionId?: string;
    }) => {
      const msg: ChatMessage = {
        role: 'xiaoxue',
        content,
        timestamp: Date.now(),
        taskId: options?.taskId || currentTaskId,
        buttons: options?.buttons,
        cardType: options?.cardType,
        cardData: options?.cardData,
        questionId: options?.questionId,
      };
      setMessages((prev) => [...prev, msg]);
    },
    [currentTaskId],
  );

  // 添加用户消息
  const addUserMessage = useCallback((content: string) => {
    const msg: ChatMessage = {
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, msg]);
  }, []);

  // ==================== 流程控制 ====================

  // v10.1: 把小雪 AI 对话桥接字段映射到 BookingFields（保守映射，不覆盖已有值）
  const mapBridgeToFields = useCallback(
    (sug: XiaoxueSuggestion): Partial<BookingFields> => {
      const f = sug.fields || {};
      const out: Partial<BookingFields> = {};
      if (Array.isArray(f.core_topics) && f.core_topics.length > 0) {
        out.core_topics = f.core_topics;
      }
      if (Array.isArray(f.language_preference) && f.language_preference.length > 0) {
        out.language_preference = f.language_preference;
      }
      if (f.service_mode === 'online' || f.service_mode === 'offline') {
        out.service_mode = f.service_mode;
      }
      if (f.city) out.city = f.city;
      if (f.therapist_preference) out.designated_therapist = f.therapist_preference;
      // 预算档位 → 金额（保守映射，仅在无预算时）
      // 入门档：价格区间 400-500，保守不映射（避免误把 500 档当确定值）
      if (f.budget_level === 'mature') out.budget = 600;
      else if (f.budget_level === 'senior') out.budget = 900;
      else if (f.budget_level === 'expert') out.budget = 1500;
      // 时间偏好 → 文本（与表单枚举一致）
      if (f.availability) {
        const map: Record<string, string> = {
          weekend: '周末',
          weekday_evening: '工作日晚上',
          weekday_day: '工作日白天',
        };
        out.time_preference = map[f.availability] || f.availability;
      }
      if (f.notes) out.supplement = f.notes;
      return out;
    },
    [],
  );

  // v10.1: 应用桥接字段到一个 draft 上（不覆盖已有非空值）
  const applyBridgeToDraft = useCallback(
    (d: BookingDraft): BookingDraft => {
      if (!bridgeSuggestion || bridgeApplied) return d;
      const mapped = mapBridgeToFields(bridgeSuggestion);
      const mergedFields: BookingFields = { ...d.fields };
      let changed = false;
      (Object.keys(mapped) as (keyof BookingFields)[]).forEach((k) => {
        const v = mapped[k];
        if (v === undefined || v === null) return;
        const cur = mergedFields[k];
        const isEmpty =
          cur === undefined ||
          cur === null ||
          cur === '' ||
          (Array.isArray(cur) && cur.length === 0);
        if (isEmpty) {
          // @ts-expect-error 动态键值合并
          mergedFields[k] = v;
          changed = true;
        }
      });
      if (!changed) return d;
      const next: BookingDraft = {
        ...d,
        fields: mergedFields,
        change_log: [
          ...d.change_log,
          {
            timestamp: Date.now(),
            field: 'bridge_apply',
            old_value: '',
            new_value: 'applied_from_xiaoxue_ai',
          },
        ],
      };
      setBridgeApplied(true);
      clearXiaoxueSuggestion();
      return next;
    },
    [bridgeSuggestion, bridgeApplied, mapBridgeToFields],
  );

  // 开始预约
  const startBooking = useCallback(() => {
    const newDraft = createEmptyDraft();
    const finalDraft = bridgeSuggestion ? applyBridgeToDraft(newDraft) : newDraft;
    const appliedFields = bridgeSuggestion && finalDraft !== newDraft
      ? Object.keys(mapBridgeToFields(bridgeSuggestion)).filter((k) => {
          const v = finalDraft.fields[k as keyof BookingFields];
          return v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0);
        })
      : [];
    setDraft(finalDraft);
    setPageState('CHAT');
    setCurrentTaskId('INFO');
    setCurrentQuestionIdx(0);
    setMessages([]);
    setShowCrisis(false);
    setFastMode(false);
    saveDraft(finalDraft);

    // 发送第一个问题
    setTimeout(() => {
      const q = TASKS[0].questions[0];
      const introMsg = appliedFields.length > 0
        ? `我已经把你刚才和小雪聊到的信息带过来了（${appliedFields.length > 3 ? '议题、形式等' : '部分字段'}已预填），接下来的问题里如果已经说过，你可以直接确认或修改。\n\n${q.text}`
        : q.text;
      const msg: ChatMessage = {
        role: 'xiaoxue',
        content: introMsg,
        buttons: q.options,
        timestamp: Date.now(),
        taskId: 'INFO',
        questionId: q.id,
      };
      setMessages([msg]);
    }, 300);
  }, [saveDraft, bridgeSuggestion, applyBridgeToDraft, mapBridgeToFields]);

  // 继续上次进度
  const continueDraft = useCallback(() => {
    const saved = safeGetItem(STORAGE_KEY_DRAFT);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved) as BookingDraft;
      const finalDraft = bridgeSuggestion ? applyBridgeToDraft(parsed) : parsed;
      setDraft(finalDraft);
      if (finalDraft !== parsed) saveDraft(finalDraft);

      const taskId = finalDraft.current_task || 'INFO';
      setCurrentTaskId(taskId);
      setCurrentQuestionIdx(0);

      setPageState('CHAT');
      setMessages([]);
      setShowCrisis(false);

      setTimeout(() => {
        const task = getTaskById(taskId);
        const q = task?.questions[0];
        const msg: ChatMessage = {
          role: 'xiaoxue',
          content: `欢迎回来。我们上次在「${task?.name || '预约准备'}」任务，我帮你接着往下走。${q ? '\n\n' + q.text : ''}`,
          buttons: q?.options,
          timestamp: Date.now(),
          taskId,
          questionId: q?.id,
        };
        setMessages([msg]);
      }, 300);
    } catch {
      startBooking();
    }
  }, [startBooking, bridgeSuggestion, applyBridgeToDraft, saveDraft]);

  // 推进到下一个任务
  const advanceToTask = useCallback(
    (nextTaskId: TaskId) => {
      setCurrentTaskId(nextTaskId);
      setCurrentQuestionIdx(0);

      // 更新草稿当前任务
      updateDraft((prev) => ({
        ...prev,
        current_task: nextTaskId,
        task_progress: {
          ...prev.task_progress,
          [nextTaskId]: {
            ...prev.task_progress[nextTaskId],
            status: 'active',
          },
        },
      }));

      const task = getTaskById(nextTaskId);
      if (!task) return;

      // SUMMARY：跳到摘要页
      if (task.id === 'SUMMARY') {
        setTimeout(() => {
          setPageState('SUMMARY');
        }, 500);
        return;
      }

      // HANDOFF：提交后到达
      if (task.id === 'HANDOFF') {
        return;
      }

      // MATCHING任务：先问问是否需要推荐，不直接展示
      if (task.id === 'MATCHING') {
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              role: 'xiaoxue',
              content: `接下来是「${task.name}」任务。我可以帮你整理偏好和需求，团队会根据你的情况匹配合适的心理师。\n\n你想先了解费用和流程，还是先看看其他信息？`,
              buttons: [
                { label: '了解费用和流程', value: 'skip_matching' },
                { label: '先跳过，继续往下', value: 'skip_matching' },
              ],
              timestamp: Date.now(),
              taskId: 'MATCHING',
              cardType: 'task_transition',
            },
          ]);
        }, 500);
        return;
      }

      // 任务过渡提示
      const transitionText = getTaskTransitionText(nextTaskId);
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            role: 'xiaoxue',
            content: transitionText,
            timestamp: Date.now(),
            taskId: nextTaskId,
            cardType: 'task_transition',
          },
        ]);
      }, 400);

      // 如果该任务有问题，发送第一个问题
      const firstQ = task.questions[0];
      if (firstQ) {
        setTimeout(() => {
          const msg: ChatMessage = {
            role: 'xiaoxue',
            content: firstQ.text,
            buttons: firstQ.options,
            timestamp: Date.now(),
            taskId: task.id,
            questionId: firstQ.id,
          };
          setMessages((prev) => [...prev, msg]);
        }, 900);
      } else if (task.can_skip) {
        // 没有问题且可跳过，直接到下一个任务
        const afterNext = getNextTaskId(nextTaskId);
        if (afterNext) {
          setTimeout(() => {
            advanceToTask(afterNext);
          }, 800);
        }
      }
    },
    [updateDraft],
  );

  // 任务过渡文案
  const getTaskTransitionText = (taskId: TaskId): string => {
    const task = getTaskById(taskId);
    if (!task) return '好的，我们继续。';

    const transitions: Record<TaskId, string> = {
      INFO: '好的，我们先从基本信息开始。',
      INTAKE: '基本信息已经了解了。接下来可以补充一些咨询背景，这些都不是必须的，不想回答可以跳过。',
      MATCHING: '接下来我可以帮你了解心理师推荐。',
      BUDGET: '接下来看看预算和时间安排。',
      SUMMARY: '信息差不多了，我整理成一份摘要给你看看。',
      HANDOFF: '已经提交给人工客服了，后续会有人联系你。',
    };
    return transitions[taskId] || `接下来是「${task.name}」任务。`;
  };

  // 标记当前任务完成
  const markTaskDone = useCallback(
    (taskId: TaskId) => {
      updateTaskProgress(taskId, { status: 'done' });
      updateDraft((prev) => {
        const allProgress = Object.values(prev.task_progress) as TaskProgress[];
        const doneCount = allProgress.filter((t) => t.status === 'done').length;
        return { ...prev, completed_tasks_count: doneCount };
      });
    },
    [updateTaskProgress, updateDraft],
  );

  // 进入下一个问题
  const advanceQuestion = useCallback(() => {
    const task = currentTask;
    if (!task) return;

    const nextQIdx = currentQuestionIdx + 1;

    // 快速模式：只问必填字段
    if (fastMode) {
      let nextRequired = nextQIdx;
      while (
        nextRequired < task.questions.length &&
        !task.questions[nextRequired].required
      ) {
        // 记录跳过
        updateTaskProgress(task.id, {
          skippedFields: [
            ...(draft.task_progress[task.id]?.skippedFields || []),
            task.questions[nextRequired].id,
          ],
        });
        updateDraft((prev) => ({
          ...prev,
          skipped_fields: [...prev.skipped_fields, task.questions[nextRequired].id],
        }));
        nextRequired++;
      }

      if (nextRequired < task.questions.length) {
        setCurrentQuestionIdx(nextRequired);
        const q = task.questions[nextRequired];
        const msg: ChatMessage = {
          role: 'xiaoxue',
          content: q.text,
          buttons: q.options,
          timestamp: Date.now(),
          taskId: task.id,
          questionId: q.id,
        };
        setMessages((prev) => [...prev, msg]);
        return;
      }
    } else if (nextQIdx < task.questions.length) {
      setCurrentQuestionIdx(nextQIdx);
      const q = task.questions[nextQIdx];

      // 低推进模式下，敏感字段主动跳过并提示
      const isLowPush = draft.push_mode === 'low';
      if (isLowPush && q.sensitive && q.skipable) {
        // 跳过敏感字段
        updateTaskProgress(task.id, {
          skippedFields: [
            ...(draft.task_progress[task.id]?.skippedFields || []),
            q.id,
          ],
        });
        updateDraft((prev) => ({
          ...prev,
          skipped_fields: [...prev.skipped_fields, q.id],
        }));
        // 递归前进
        setTimeout(() => {
          setCurrentQuestionIdx(nextQIdx);
          advanceQuestionInternal(nextQIdx + 1);
        }, 100);
        return;
      }

      const msg: ChatMessage = {
        role: 'xiaoxue',
        content: q.text,
        buttons: q.options,
        timestamp: Date.now(),
        taskId: task.id,
        questionId: q.id,
      };
      setMessages((prev) => [...prev, msg]);
      return;
    }

    // 当前任务问题已问完，标记完成并进入下一任务
    markTaskDone(task.id);
    const nextTask = getNextTaskId(task.id);
    if (nextTask) {
      advanceToTask(nextTask);
    }
  }, [
    currentTask,
    currentQuestionIdx,
    fastMode,
    draft.task_progress,
    draft.push_mode,
    markTaskDone,
    advanceToTask,
    updateTaskProgress,
    updateDraft,
  ]);

  // advanceQuestion 的内部辅助（用于递归跳过敏感字段时避免循环引用问题）
  const advanceQuestionInternal = useCallback(
    (startIdx: number) => {
      const task = currentTask;
      if (!task) return;

      let idx = startIdx;
      while (idx < task.questions.length) {
        const q = task.questions[idx];
        const isLowPush = draft.push_mode === 'low';
        if (isLowPush && q.sensitive && q.skipable) {
          updateTaskProgress(task.id, {
            skippedFields: [
              ...(draft.task_progress[task.id]?.skippedFields || []),
              q.id,
            ],
          });
          updateDraft((prev) => ({
            ...prev,
            skipped_fields: [...prev.skipped_fields, q.id],
          }));
          idx++;
        } else {
          break;
        }
      }

      if (idx < task.questions.length) {
        setCurrentQuestionIdx(idx);
        const q = task.questions[idx];
        const msg: ChatMessage = {
          role: 'xiaoxue',
          content: q.text,
          buttons: q.options,
          timestamp: Date.now(),
          taskId: task.id,
          questionId: q.id,
        };
        setMessages((prev) => [...prev, msg]);
      } else {
        markTaskDone(task.id);
        const nextTask = getNextTaskId(task.id);
        if (nextTask) {
          advanceToTask(nextTask);
        }
      }
    },
    [
      currentTask,
      draft.push_mode,
      draft.task_progress,
      updateTaskProgress,
      updateDraft,
      markTaskDone,
      advanceToTask,
    ],
  );

  // ==================== 回答处理 ====================

  // 处理选项点击
  const handleOptionClick = useCallback(
    (option: QuestionOption) => {
      const q = currentQuestion;
      if (!q) return;

      addUserMessage(option.label);

      // 保存答案
      saveAnswer(q, option.value, false);

      // v10.4: consent_start / xiaoku_summary_consent 题目已从 data.ts 移除，相关死代码清理

      if (q.id === 'intent') {
        updateDraft((prev) => ({
          ...prev,
          fields: { ...prev.fields, intent: option.value as BookingFields['intent'] },
          // 如果用户说只是看看，切换到低推进模式
          push_mode: option.value === 'just_looking' || option.value === 'exploring'
            ? 'low'
            : prev.push_mode,
        }));
      }

      if (q.id === 'booking_for') {
        updateDraft((prev) => ({
          ...prev,
          fields: { ...prev.fields, booking_for: option.value as BookingFields['booking_for'] },
        }));
      }

      if (q.id === 'contact_method') {
        const method = option.value as BookingFields['contact_method'];
        updateDraft((prev) => ({
          ...prev,
          fields: { ...prev.fields, contact_method: method },
        }));

        // 如果用户明确拒绝留联系方式，跳过contact_value问题
        if (method === 'none_refused') {
          setTimeout(() => {
            // 跳到location问题
            const task = currentTask;
            if (task) {
              const locationIdx = task.questions.findIndex((q) => q.id === 'location');
              if (locationIdx >= 0) {
                setCurrentQuestionIdx(locationIdx);
                const locQ = task.questions[locationIdx];
                const msg: ChatMessage = {
                  role: 'xiaoxue',
                  content: locQ.text,
                  buttons: locQ.options,
                  timestamp: Date.now(),
                  taskId: task.id,
                  questionId: locQ.id,
                };
                setMessages((prev) => [...prev, msg]);
                return;
              }
            }
            advanceQuestion();
          }, 500);
          return;
        }
      }

      if (q.id === 'budget') {
        const budgetVal = option.value === 'unlimited' ? undefined : parseInt(option.value, 10);
        updateDraft((prev) => ({
          ...prev,
          fields: { ...prev.fields, budget: budgetVal },
        }));
      }

      if (q.id === 'service_mode') {
        updateDraft((prev) => ({
          ...prev,
          fields: { ...prev.fields, service_mode: option.value as BookingFields['service_mode'] },
        }));
      }

      if (q.id === 'gender_preference') {
        updateDraft((prev) => ({
          ...prev,
          fields: { ...prev.fields, gender_preference: option.value as BookingFields['gender_preference'] },
        }));
      }

      if (q.id === 'session_duration') {
        const val = option.value;
        if (val === '60' || val === '90') {
          updateDraft((prev) => ({
            ...prev,
            fields: { ...prev.fields, session_duration: parseInt(val, 10) as 60 | 90 },
          }));
        }
        // unsure 不设置
      }

      if (q.id === 'time_preference') {
        updateDraft((prev) => ({
          ...prev,
          fields: { ...prev.fields, time_preference: option.value },
        }));
      }

      if (q.id === 'duration_issue') {
        updateDraft((prev) => ({
          ...prev,
          fields: { ...prev.fields, duration_issue: option.value },
        }));
      }

      if (q.id === 'experience') {
        updateDraft((prev) => ({
          ...prev,
          fields: { ...prev.fields, experience: option.value as BookingFields['experience'] },
        }));
      }

      setTimeout(() => advanceQuestion(), 400);
    },
    [currentQuestion, currentTask, addUserMessage, advanceQuestion, updateDraft],
  );

  // 保存答案到草稿
  const saveAnswer = useCallback(
    (q: Question, value: string, isMulti: boolean) => {
      updateDraft((prev) => {
        const fields = { ...prev.fields };
        const fieldName = mapQuestionToField(q.id);

        if (isMulti) {
          const current = (fields as unknown as unknown as unknown as unknown as Record<string, string[]>)[fieldName] || [];
          const exists = current.includes(value);
          (fields as unknown as unknown as unknown as unknown as Record<string, string[]>)[fieldName] = exists
            ? current.filter((v) => v !== value)
            : [...current, value];
        } else {
          (fields as unknown as unknown as unknown as unknown as Record<string, string>)[fieldName] = value;
        }

        // 增加回答计数
        const taskProgress = { ...prev.task_progress };
        const tid = prev.current_task;
        if (taskProgress[tid]) {
          taskProgress[tid] = {
            ...taskProgress[tid],
            answeredCount: taskProgress[tid].answeredCount + 1,
          };
        }

        return { ...prev, fields, task_progress: taskProgress };
      });
    },
    [updateDraft],
  );

  // 问题ID到字段名的映射
  const mapQuestionToField = (qid: string): keyof BookingFields => {
    const map: Record<string, keyof BookingFields> = {
      intent: 'intent',
      experience: 'experience',
      booking_for: 'booking_for',
      core_topics: 'core_topics',
      core_topics_open: 'core_topics_open',
      duration_issue: 'duration_issue',
      location: 'city',
      service_mode: 'service_mode',
      gender_preference: 'gender_preference',
      language_preference: 'language_preference',
      identity_preference: 'identity_preference',
      budget: 'budget',
      concerns: 'concerns',
      supplement: 'supplement',
      session_duration: 'session_duration',
      time_preference: 'time_preference',
      contact_method: 'contact_method',
      contact_value: 'contact_value',
    };
    return (map[qid] as keyof BookingFields) || ('supplement' as keyof BookingFields);
  };

  // 处理多选切换
  const handleMultiOptionToggle = useCallback(
    (option: QuestionOption, isSelected: boolean) => {
      const q = currentQuestion;
      if (!q) return;

      saveAnswer(q, option.value, true);

      if (!isSelected) {
        addUserMessage(`选择了：${option.label}`);
      } else {
        addUserMessage(`取消选择：${option.label}`);
      }
    },
    [currentQuestion, saveAnswer, addUserMessage],
  );

  // 处理开放输入提交
  const handleOpenSubmit = useCallback(
    (text: string) => {
      if (!text.trim()) return;

      addUserMessage(text);
      setInputValue('');

      // 危机检测（最高优先级）
      const crisis = detectCrisis(text);
      if (crisis.is_crisis) {
        setShowCrisis(true);
        // 危机时关闭商业推进
        updateDraft((prev) => ({ ...prev, push_mode: 'crisis_paused' }));
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              role: 'xiaoxue',
              content:
                '听到你这么说我很担心。如果你现在感到不安全，请先联系危机热线寻求帮助。\n\nQM心理危机热线：15001930070（备用 13601658763）\n24小时：12356\n\n预约流程我们可以先暂停，等你安全了再继续。',
              timestamp: Date.now(),
              cardType: 'crisis',
            },
          ]);
        }, 300);
        return;
      }

      // 费用相关
      if (detectFeeIntent(text)) {
        respondToFeeQuestion(text);
        return;
      }

      // 低推进意图检测
      if (detectLowPushIntent(text) && draft.push_mode === 'normal') {
        updateDraft((prev) => ({ ...prev, push_mode: 'low' }));
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              role: 'xiaoxue',
              content:
                '明白，你只是先了解一下。我会减少一些问题，只问最基本的信息。\n\n如果之后你想深入了解或预约，随时告诉我。',
              timestamp: Date.now(),
              cardType: 'low_push',
            },
          ]);
        }, 400);
        // 继续推进
        setTimeout(() => {
          if (currentQuestion) {
            advanceQuestion();
          }
        }, 900);
        return;
      }

      // 快一点 / 不耐烦
      if (detectFastModeIntent(text)) {
        setFastMode(true);
        setTimeout(() => {
          const task = currentTask;
          setMessages((prev) => [
            ...prev,
            {
              role: 'xiaoxue',
              content: `好的，我加快节奏。目前在「${task?.name || ''}」任务，还有几项必填信息，很快就好。\n\n你也可以直接查看摘要，觉得信息够了就可以提交。`,
              buttons: [
                { label: '继续快问快答', value: 'fast_continue' },
                { label: '直接看摘要', value: 'go_summary' },
              ],
              timestamp: Date.now(),
            },
          ]);
        }, 400);
        return;
      }

      // 跳过意图
      if (detectSkipIntent(text) && currentQuestion?.skipable) {
        updateTaskProgress(currentTaskId, {
          skippedFields: [
            ...(draft.task_progress[currentTaskId]?.skippedFields || []),
            currentQuestion.id,
          ],
        });
        updateDraft((prev) => ({
          ...prev,
          skipped_fields: [...prev.skipped_fields, currentQuestion.id],
        }));
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              role: 'xiaoxue',
              content: '好的，这个问题我们先跳过。',
              timestamp: Date.now(),
            },
          ]);
        }, 300);
        setTimeout(() => advanceQuestion(), 800);
        return;
      }

      // 长回答抽取
      const extracted = extractFieldsFromText(text, draft.fields);
      if (Object.keys(extracted).length > 0) {
        updateDraft((prev) => ({
          ...prev,
          fields: { ...prev.fields, ...extracted },
        }));
      }

      // 如果有当前问题，保存开放回答并继续
      if (currentQuestion) {
        // 多选题带 placeholder 时，用户输入的自定义文字必须写入对应的 _open 字段，
        // 不能写入数组字段（否则类型错乱）。必须先于 open/placeholder 判断。
        if (currentQuestion.type === 'multi' && currentQuestion.placeholder) {
          const baseField = mapQuestionToField(currentQuestion.id);
          const openField = `${String(baseField)}_open` as keyof BookingFields;
          updateDraft((prev) => ({
            ...prev,
            fields: { ...prev.fields, [openField]: text },
          }));
        } else if (currentQuestion.type === 'open' || currentQuestion.placeholder) {
          const fieldName = mapQuestionToField(currentQuestion.id);
          updateDraft((prev) => ({
            ...prev,
            fields: { ...prev.fields, [fieldName]: text },
          }));
        }

        setTimeout(() => advanceQuestion(), 500);
      } else {
        // 没有当前问题（自由提问阶段）
        respondToFreeText(text);
      }
    },
    [
      addUserMessage,
      currentQuestion,
      currentTask,
      currentTaskId,
      draft.fields,
      draft.push_mode,
      draft.task_progress,
      advanceQuestion,
      updateDraft,
      updateTaskProgress,
    ],
  );

  // 费用问题响应
  const respondToFeeQuestion = useCallback(
    (text: string) => {
      const context = {
        justChecking: text.includes('多少钱') || text.includes('价格'),
        budgetAnxiety: text.includes('太贵') || text.includes('便宜') || text.includes('负担'),
        firstTime: draft.fields.experience === 'first_time',
        longTerm: text.includes('长期') || text.includes('次卡'),
      };

      const emotionLine = getFeeEmotionLine(context);

      // 计算一个示例费用
      const tier = draft.fields.budget ? String(draft.fields.budget) : '700';
      const fee = calculateFee(tier as string, 60, draft.fields.experience === 'first_time');
      setFeeCalc(fee);

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            role: 'xiaoxue',
            content: emotionLine,
            timestamp: Date.now(),
            cardType: 'fee',
            cardData: { fee, tier, context },
          },
        ]);
      }, 400);

      // 额外提供选项
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            role: 'xiaoxue',
            content: '价格以QM官方价格表为准。你想看看哪位心理师的具体收费？或者你更希望控制在什么预算范围内？',
            buttons: [
              { label: '我想控制预算', value: 'budget_control' },
              { label: '帮我算具体方案', value: 'calc_plan' },
              { label: '继续预约流程', value: 'continue' },
            ],
            timestamp: Date.now(),
          },
        ]);
      }, 900);
    },
    [draft.fields],
  );

  // 自由文本响应（非问卷阶段）
  const respondToFreeText = useCallback(
    (text: string) => {
      // 检测是否指定了心理师
      const foundTherapist = findTherapistByName(text);
      if (foundTherapist) {
        updateDraft((prev) => ({
          ...prev,
          fields: { ...prev.fields, designated_therapist: foundTherapist.name },
        }));
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              role: 'xiaoxue',
              content: `好的，我把「${foundTherapist.name}」记录为你的偏好。关于这位心理师的具体排期和背景，建议跟人工客服确认。\n\n我先继续帮你整理其他需求？`,
              buttons: [
                { label: '继续往下走', value: 'continue' },
              ],
              timestamp: Date.now(),
            },
          ]);
        }, 400);
        return;
      }

      // 默认回应
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            role: 'xiaoxue',
            content: '好的，我记下了。我们继续完成预约流程吧。',
            timestamp: Date.now(),
          },
        ]);
      }, 400);

      // 尝试推进到下一任务
      setTimeout(() => {
        const next = getNextTaskId(currentTaskId);
        if (next) {
          advanceToTask(next);
        }
      }, 900);
    },
    [currentTaskId, advanceToTask, updateDraft],
  );

  // ==================== MATCHING 需求收集（v11.0 去推荐化） ====================

  // v11.0: 不再主动推荐心理师，MATCHING 阶段只做偏好收集
  const skipMatching = useCallback(() => {
    updateTaskProgress('MATCHING', { status: 'skipped' });
    updateDraft((prev) => ({
      ...prev,
      skipped_fields: [...prev.skipped_fields, 'matching_task'],
    }));
    setTimeout(() => {
      const nextTask = getNextTaskId('MATCHING');
      if (nextTask) {
        advanceToTask(nextTask);
      }
    }, 300);
  }, [updateTaskProgress, updateDraft, advanceToTask]);

  // 用户选择指定心理师（记录为偏好，不展开背景）
  const selectTherapist = useCallback(
    (name: string) => {
      updateDraft((prev) => ({
        ...prev,
        fields: { ...prev.fields, designated_therapist: name },
      }));
      addUserMessage(`指定了 ${name}`);
      setDeepIntroName(null);

      // 标记MATCHING完成，进入下一任务
      markTaskDone('MATCHING');
      setTimeout(() => {
        const next = getNextTaskId('MATCHING');
        if (next) {
          advanceToTask(next);
        }
      }, 500);
    },
    [updateDraft, addUserMessage, markTaskDone, advanceToTask],
  );

  // v11.0: showDeepIntro 保留为 no-op（深度介绍不再展示）
  const showDeepIntro = useCallback((_name: string) => {
    // 去推荐化：不再展示心理师深度介绍
  }, []);

  // ==================== BUDGET 费用方案 ====================

  const showFeeOptions = useCallback(() => {
    const therapistName = draft.fields.selected_therapist || draft.fields.designated_therapist;
    const therapist = therapistName ? findTherapistByName(therapistName) : null;
    const priceTier = therapist ? String(therapist.price) : '700';
    const isFirst = draft.fields.experience === 'first_time';

    const fee60 = calculateFee(priceTier, 60, isFirst);
    const feeFirst = calculateFee(priceTier, 60, true);
    const feePack5 = calculateFee(priceTier, 60, false, 5);
    const feePack10 = calculateFee(priceTier, 60, false, 10);

    const emotionLine = getFeeEmotionLine({
      firstTime: isFirst,
      longTerm: true,
    });

    setMessages((prev) => [
      ...prev,
      {
        role: 'xiaoxue',
        content: emotionLine,
        timestamp: Date.now(),
        cardType: 'fee',
        cardData: {
          therapist,
          fee60,
          feeFirst,
          feePack5,
          feePack10,
          priceTier,
          isFirst,
        },
      },
    ]);
  }, [draft.fields]);

  // ==================== 提交 ====================

  const submitBooking = useCallback(() => {
    const now = Date.now();

    // 更新草稿状态
    const submitted: BookingDraft = {
      ...draft,
      status: 'submitted',
      current_task: 'HANDOFF',
      completed_tasks_count: TASK_ORDER.length,
      task_progress: {
        ...draft.task_progress,
        HANDOFF: {
          taskId: 'HANDOFF',
          status: 'done',
          currentQuestionIdx: 0,
          answeredCount: 0,
          skippedFields: [],
        },
      },
      timestamps: {
        ...draft.timestamps,
        submitted_at: now,
      },
    };

    // 保存到已提交列表
    const savedSubmitted = safeGetItem(STORAGE_KEY_SUBMITTED);
    let submittedList: BookingDraft[] = [];
    if (savedSubmitted) {
      try {
        submittedList = JSON.parse(savedSubmitted);
      } catch {
        // ignore
      }
    }
    submittedList.push(submitted);
    safeSetItem(STORAGE_KEY_SUBMITTED, JSON.stringify(submittedList));

    // 清除草稿
    safeRemoveItem(STORAGE_KEY_DRAFT);

    setDraft(submitted);
    setPageState('SUBMITTED');
  }, [draft]);

  // 保存草稿并暂停
  const pauseAndSave = useCallback(() => {
    saveDraft(draft);
    setPageState('LANDING');
    setHasDraft(true);
  }, [draft, saveDraft]);

  // 清空草稿
  const clearDraft = useCallback(() => {
    safeRemoveItem(STORAGE_KEY_DRAFT);
    setHasDraft(false);
    setDraft(createEmptyDraft());
    setMessages([]);
    setCurrentTaskId('INFO');
    setCurrentQuestionIdx(0);
    setFastMode(false);
    setShowCrisis(false);
    setFeeCalc(null);
  }, []);

  // 修改字段
  const modifyField = useCallback(
    (field: keyof BookingFields, newValue: string | string[] | number | boolean | undefined) => {
      const oldValue = String(draft.fields[field] ?? '');

      updateDraft((prev) => ({
        ...prev,
        fields: { ...prev.fields, [field]: newValue },
        change_log: [
          ...prev.change_log,
          {
            field: String(field),
            old_value: oldValue,
            new_value: String(newValue ?? ''),
            timestamp: Date.now(),
          },
        ],
      }));
      setEditField(null);
    },
    [draft.fields, updateDraft],
  );

  // ==================== 处理特殊按钮回调 ====================

  const handleSpecialAction = useCallback(
    (value: string) => {
      switch (value) {
        case 'go_xiaoku':
          window.location.href = '/';
          break;
        case 'continue':
          if (currentQuestion) {
            advanceQuestion();
          } else {
            const next = getNextTaskId(currentTaskId);
            if (next) {
              advanceToTask(next);
            }
          }
          break;
        case 'fast_continue':
          setFastMode(true);
          advanceQuestion();
          break;
        case 'go_summary':
          setPageState('SUMMARY');
          break;
        case 'budget_control':
          // 跳到预算任务
          setCurrentTaskId('BUDGET');
          setCurrentQuestionIdx(0);
          const budgetTask = getTaskById('BUDGET');
          if (budgetTask) {
            const firstQ = budgetTask.questions[0];
            setMessages((prev) => [
              ...prev,
              {
                role: 'xiaoxue',
                content: firstQ?.text || '你的预算大概是多少呢？',
                buttons: firstQ?.options,
                timestamp: Date.now(),
                taskId: 'BUDGET',
                questionId: firstQ?.id,
              },
            ]);
          }
          break;
        case 'calc_plan':
          showFeeOptions();
          break;
        case 'show_lowest':
          showBudgetOptions(400);
          break;
        case 'adjust_budget':
          setCurrentTaskId('BUDGET');
          setCurrentQuestionIdx(0);
          const bTask = getTaskById('BUDGET');
          if (bTask) {
            const firstQ = bTask.questions[0];
            setMessages((prev) => [
              ...prev,
              {
                role: 'xiaoxue',
                content: firstQ?.text || '你的预算大概是多少呢？',
                buttons: firstQ?.options,
                timestamp: Date.now(),
                taskId: 'BUDGET',
                questionId: firstQ?.id,
              },
            ]);
          }
          break;
        case 'continue_anyway':
          markTaskDone('MATCHING');
          const nextAfterMatching = getNextTaskId('MATCHING');
          if (nextAfterMatching) {
            advanceToTask(nextAfterMatching);
          }
          break;
        case 'deep_intro':
          // v11.0: 深度介绍不再展示
          break;
        case 'select_therapist':
          if (draft.fields.designated_therapist) {
            selectTherapist(draft.fields.designated_therapist);
          }
          break;
        case 'skip_matching':
          // 跳过MATCHING任务
          skipMatching();
          break;
        default:
          break;
      }
    },
    [
      currentTaskId,
      currentQuestion,
      advanceToTask,
      advanceQuestion,
      showFeeOptions,
      selectTherapist,
      skipMatching,
      markTaskDone,
      updateTaskProgress,
      updateDraft,
      draft.fields.designated_therapist,
    ],
  );

  const showBudgetOptions = useCallback((budget: number) => {
    const { therapists, note } = getBudgetOptions(budget);
    const count = therapists.length;

    let content: string;
    if (count === 0) {
      content = note || '这个预算范围内暂时没有匹配的心理师，我们最低收费档位为400元/60分钟。';
    } else {
      content = `${budget}元及以下档位有${count}位心理师。团队会根据你的需求和偏好匹配合适的人选，人工客服会在工作时间联系你确认。`;
      if (note) {
        content += `\n\n${note}`;
      }
    }

    setMessages((prev) => [
      ...prev,
      {
        role: 'xiaoxue',
        content,
        buttons: [
          { label: '好的，继续预约', value: 'continue' },
        ],
        timestamp: Date.now(),
      },
    ]);
  }, []);

  // ==================== 渲染 ====================

  return (
    <PageLayout title="安排预约" bodyClassName="qm-bg-service">
      {/* v6.4.0 模式切换 */}
      <div className="mb-4 flex items-center gap-2 rounded-full bg-[var(--qm-surface-25)] p-1 w-fit">
        <button
          type="button"
          onClick={() => setMode('ai')}
          className={`min-h-[36px] px-4 rounded-full text-sm transition-colors ${
            mode === 'ai' ? 'text-white shadow-sm' : 'text-[var(--qm-ink-600)] hover:text-[var(--qm-ink-800)]'
          }`}
          style={mode === 'ai' ? { background: '#6B4C9A' } : undefined}
        >
          💬 和小雪聊聊
        </button>
        <button
          type="button"
          onClick={() => setMode('structured')}
          className={`min-h-[36px] px-4 rounded-full text-sm transition-colors ${
            mode === 'structured' ? 'text-white shadow-sm' : 'text-[var(--qm-ink-600)] hover:text-[var(--qm-ink-800)]'
          }`}
          style={mode === 'structured' ? { background: '#6B4C9A' } : undefined}
        >
          📋 结构化填写
        </button>
      </div>

      {mode === 'ai' ? (
        <XiaoxueAiPanel />
      ) : (
      <div className="flex flex-col min-h-[calc(100vh-64px)]">
        {/* LANDING 首屏 */}
        {pageState === 'LANDING' && (
          <LandingView
            hasDraft={hasDraft}
            onStart={startBooking}
            onContinue={continueDraft}
            onClearDraft={clearDraft}
            bridgeSuggestion={bridgeSuggestion}
            onDismissBridge={() => {
              setBridgeSuggestion(null);
              clearXiaoxueSuggestion();
            }}
          />
        )}

        {/* CHAT 对话区 */}
        {pageState === 'CHAT' && (
          <ChatView
            messages={messages}
            currentTask={currentTask}
            currentQuestion={currentQuestion}
            currentTaskId={currentTaskId}
            taskProgress={draft.task_progress}
            pushMode={draft.push_mode}
            completedTasksCount={draft.completed_tasks_count}
            inputValue={inputValue}
            setInputValue={setInputValue}
            onOptionClick={handleOptionClick}
            onMultiToggle={handleMultiOptionToggle}
            onOpenSubmit={handleOpenSubmit}
            onPause={pauseAndSave}
            onSpecialAction={handleSpecialAction}
            showCrisis={showCrisis}
            deepIntroName={deepIntroName}
            onCompare={setComparingName}
            messagesEndRef={messagesEndRef}
            selectedFields={draft.fields}
            feeCalc={feeCalc}
          />
        )}

        {/* SUMMARY 摘要确认 */}
        {pageState === 'SUMMARY' && (
          <SummaryView
            draft={draft}
            onSubmit={submitBooking}
            onSaveDraft={pauseAndSave}
            onModify={modifyField}
            editField={editField}
            setEditField={setEditField}
          />
        )}

        {/* SUBMITTED 提交完成 */}
        {pageState === 'SUBMITTED' && (
          <SubmittedView draft={draft} />
        )}
      </div>
      )}
    </PageLayout>
  );
}

// ==================== 子组件 ====================

// --- 首屏 ---
function LandingView({
  hasDraft,
  onStart,
  onContinue,
  onClearDraft,
  bridgeSuggestion,
  onDismissBridge,
}: {
  hasDraft: boolean;
  onStart: () => void;
  onContinue: () => void;
  onClearDraft: () => void;
  bridgeSuggestion?: XiaoxueSuggestion | null;
  onDismissBridge?: () => void;
}) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // 汇总桥接过来的字段，用于横幅展示
  const bridgeLabels: string[] = [];
  if (bridgeSuggestion) {
    const f = bridgeSuggestion.fields || {};
    const topicLabel: Record<string, string> = {
      anxiety: '焦虑/压力', depression: '抑郁/低落', relationship: '亲密关系',
      family: '家庭', work: '职场', trauma: '创伤', adhd: 'ADHD',
      lgbtq: '性多元/性别', identity: '身份认同', eating: '进食', sleep: '睡眠',
    };
    if (f.core_topics?.length) bridgeLabels.push('议题：' + f.core_topics.map((t) => topicLabel[t] || t).join('、'));
    if (f.city) bridgeLabels.push('城市：' + f.city);
    if (f.service_mode === 'online') bridgeLabels.push('形式：线上');
    else if (f.service_mode === 'offline') bridgeLabels.push('形式：线下');
    if (f.budget_level) {
      const bl: Record<string, string> = { junior: '入门', mature: '成熟等级', senior: '资深等级', expert: '专家等级' };
      bridgeLabels.push('预算：' + (bl[f.budget_level] || f.budget_level));
    }
    if (f.availability) {
      const al: Record<string, string> = { weekend: '周末', weekday_evening: '工作日晚上', weekday_day: '工作日白天' };
      bridgeLabels.push('时间：' + (al[f.availability] || f.availability));
    }
    if (f.therapist_preference) bridgeLabels.push('指定心理师：' + f.therapist_preference);
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 flex-1">
      {/* 小雪头像 */}
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--qm-purple-600)] to-[var(--qm-purple-400)] flex items-center justify-center text-4xl mb-4 shadow-lg">
        ❄️
      </div>

      <h2 className="text-xl font-semibold text-[var(--qm-ink-800)] mb-1">小雪</h2>
      <p className="text-sm text-[var(--qm-ink-500)] mb-2">和小雪一起完成预约前准备</p>

      {/* v10.1: 小雪 AI 对话桥接横幅 */}
      {bridgeSuggestion && bridgeLabels.length > 0 && (
        <div className="w-full max-w-sm mb-4 rounded-xl border border-[#6B4C9A]/30 bg-[#6B4C9A]/8 p-4">
          <div className="flex items-start gap-2">
            <span className="text-base leading-5">❄️</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-[#6B4C9A] mb-1">
                已从你和小雪的对话中识别到这些信息
              </div>
              <ul className="space-y-0.5">
                {bridgeLabels.map((label, i) => (
                  <li key={i} className="text-xs text-[var(--qm-ink-600)] flex items-center gap-1">
                    <span className="text-[#6B4C9A]">✓</span>
                    <span>{label}</span>
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-[var(--qm-ink-400)] mt-2 leading-relaxed">
                点击「开始安排」会带入这些信息作为参考，你可以在填写过程中随时修改。
              </p>
            </div>
            {onDismissBridge && (
              <button
                type="button"
                onClick={onDismissBridge}
                className="text-[var(--qm-ink-400)] hover:text-[var(--qm-ink-600)] text-lg leading-none -mt-1 -mr-1 px-1"
                aria-label="忽略"
              >
                ×
              </button>
            )}
          </div>
        </div>
      )}

      <div className="w-full max-w-sm space-y-2 mb-8 mt-4">
        <div className="flex items-center gap-2 text-sm text-[var(--qm-ink-600)]">
          <span className="text-[var(--qm-purple-600)]">⏱️</span>
          <span>约3-5分钟，可随时暂停</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-[var(--qm-ink-600)]">
          <span className="text-[var(--qm-purple-600)]">🔒</span>
          <span>只有确认提交后才交给人工客服</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-[var(--qm-ink-600)]">
          <span className="text-[var(--qm-purple-600)]">📋</span>
          <span>只需3项基本信息，其余可跳过</span>
        </div>
      </div>

      {/* 主按钮 */}
      <button
        onClick={onStart}
        className="w-full max-w-sm h-12 bg-[var(--qm-purple-600)] text-white rounded-xl font-medium hover:bg-[var(--qm-purple-700)] transition-colors mb-3"
      >
        开始安排
      </button>

      {/* 继续上次进度 */}
      {hasDraft && (
        <>
          <button
            onClick={onContinue}
            className="w-full max-w-sm h-11 border border-[var(--qm-purple-600)]/30 text-[var(--qm-purple-600)] rounded-xl font-medium hover:bg-[var(--qm-purple-600)]/5 transition-colors mb-3"
          >
            继续上次进度
          </button>
          {showClearConfirm ? (
            <div className="w-full max-w-sm flex gap-2">
              <button
                onClick={onClearDraft}
                className="flex-1 h-10 text-sm text-red-500 border border-red-300 rounded-xl hover:bg-red-50 transition-colors"
              >
                确认清空
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 h-10 text-sm text-[var(--qm-ink-500)] border border-[var(--qm-line-100)] rounded-xl hover:bg-[var(--qm-surface-50)] transition-colors"
              >
                取消
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="text-sm text-[var(--qm-ink-500)] underline underline-offset-2 hover:text-[var(--qm-ink-600)]"
            >
              清空之前的草稿
            </button>
          )}
        </>
      )}

      {/* 次要入口 */}
      <div className="w-full max-w-sm mt-8 pt-6 border-t border-[var(--qm-line-100)] space-y-3">
        <Link
          href="/"
          className="block w-full h-11 flex items-center justify-center text-[var(--qm-ink-600)] border border-[var(--qm-line-100)] rounded-xl hover:bg-white/60 transition-colors"
        >
          返回首页
        </Link>
        <Link
          href="/"
          className="block w-full h-11 flex items-center justify-center text-[var(--qm-ink-500)] text-sm hover:text-[var(--qm-ink-600)] transition-colors"
        >
          我只是想聊聊 → 找小酷
        </Link>
      </div>
    </div>
  );
}

// --- 对话区 ---
function ChatView({
  messages,
  currentTask,
  currentQuestion,
  currentTaskId,
  taskProgress,
  pushMode,
  completedTasksCount,
  inputValue,
  setInputValue,
  onOptionClick,
  onMultiToggle,
  onOpenSubmit,
  onPause,
  onSpecialAction,
  showCrisis,
  deepIntroName,
  onCompare,
  messagesEndRef,
  selectedFields,
  feeCalc,
}: {
  messages: ChatMessage[];
  currentTask: ReturnType<typeof getTaskById>;
  currentQuestion: Question | undefined;
  currentTaskId: TaskId;
  taskProgress: Record<TaskId, TaskProgress>;
  pushMode: 'normal' | 'low' | 'crisis_paused';
  completedTasksCount: number;
  inputValue: string;
  setInputValue: (v: string) => void;
  onOptionClick: (opt: QuestionOption) => void;
  onMultiToggle: (opt: QuestionOption, isSelected: boolean) => void;
  onOpenSubmit: (text: string) => void;
  onPause: () => void;
  onSpecialAction: (value: string) => void;
  showCrisis: boolean;
  deepIntroName: string | null;
  onCompare: (name: string | null) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  selectedFields: BookingFields;
  feeCalc: FeeCalculation | null;
}) {
  const [selectedMulti, setSelectedMulti] = useState<Set<string>>(new Set());

  // 估算剩余时间（根据已完成任务数）
  const totalTasks = TASK_ORDER.length;
  const remainingTasks = Math.max(0, totalTasks - completedTasksCount - 1);
  const etaMinutes = Math.max(1, remainingTasks);

  const handleOption = (opt: QuestionOption) => {
    // 特殊action处理
    if (
      [
        'go_xiaoku', 'continue', 'fast_continue', 'go_summary',
        'budget_control', 'calc_plan', 'show_lowest', 'adjust_budget',
        'continue_anyway', 'skip_matching',
      ].includes(opt.value)
    ) {
      onSpecialAction(opt.value);
      return;
    }

    if (currentQuestion?.type === 'multi') {
      const isSelected = selectedMulti.has(opt.value);
      setSelectedMulti((prev) => {
        const next = new Set(prev);
        if (isSelected) {
          next.delete(opt.value);
        } else {
          next.add(opt.value);
        }
        return next;
      });
      onMultiToggle(opt, isSelected);
    } else {
      onOptionClick(opt);
    }
  };

  const lastMsg = messages[messages.length - 1];
  const showButtons =
    lastMsg?.buttons && lastMsg?.buttons.length > 0 && lastMsg.role === 'xiaoxue';

  // v11.0: 不再渲染心理师推荐卡片
  const isFeeCard = lastMsg?.cardType === 'fee';

  // 任务状态标签颜色
  const getTaskChipClass = (status: TaskStatus) => {
    switch (status) {
      case 'done':
        return 'bg-[var(--qm-purple-600)] text-white';
      case 'active':
        return 'bg-[var(--qm-purple-600)]/15 text-[var(--qm-purple-600)] font-medium';
      case 'skipped':
        return 'bg-[var(--qm-ink-100)] text-[var(--qm-ink-500)]';
      default:
        return 'bg-[var(--qm-ink-50)] text-[var(--qm-ink-400)]';
    }
  };

  return (
    <div className="flex flex-col flex-1 relative">
      {/* 顶部任务状态条 sticky */}
      <div className="sticky top-0 z-20 bg-gradient-to-b from-[var(--qm-surface-25)] via-[var(--qm-surface-25)] to-transparent pb-2 -mx-4 px-4">
        <div className="flex items-center justify-between py-2">
          <div className="text-sm font-medium text-[var(--qm-ink-800)]">
            {currentTask?.name || '预约准备'}
            {pushMode === 'low' && (
              <span className="ml-2 text-xs text-[var(--qm-ink-500)] font-normal">（低推进模式）</span>
            )}
            {pushMode === 'crisis_paused' && (
              <span className="ml-2 text-xs text-red-500 font-normal">（已暂停）</span>
            )}
          </div>
          <div className="text-xs text-[var(--qm-ink-500)]">
            约{etaMinutes}分钟完成
          </div>
        </div>

        {/* 任务进度chip */}
        <div className="flex gap-1.5 flex-wrap mb-2">
          {TASK_ORDER.map((tid) => {
            const task = getTaskById(tid);
            const status = taskProgress[tid]?.status || 'pending';
            return (
              <span
                key={tid}
                className={`text-[10px] px-2 py-0.5 rounded-full transition-all ${getTaskChipClass(status)}`}
                title={task?.name}
              >
                {task?.name}
              </span>
            );
          })}
        </div>

        {/* 进度条 */}
        <div className="w-full h-1 bg-[var(--qm-line-100)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--qm-purple-600)] rounded-full transition-all duration-500"
            style={{ width: `${(completedTasksCount / TASK_ORDER.length) * 100}%` }}
          />
        </div>
      </div>

      {/* 消息区 */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-36 pt-2 md:pt-4 space-y-3 md:space-y-4">
        {messages.map((msg, idx) => (
          <ChatBubble key={idx} msg={msg} />
        ))}

        {/* v11.0: 心理师推荐卡和深度介绍面板已移除 */}

        {/* 费用卡片 */}
        {isFeeCard && feeCalc && (
          <FeeCard fee={feeCalc} tier={String(feeCalc.tier)} />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 按钮选项区 */}
      {showButtons && (
        <div className="fixed bottom-16 left-0 right-0 bg-gradient-to-t from-[var(--qm-surface-50)] via-[var(--qm-surface-50)] to-transparent pt-6 pb-2 px-4">
          <div className="max-w-2xl mx-auto">
            <div className={`grid gap-2 ${
              lastMsg?.buttons && lastMsg.buttons.length > 4 ? 'grid-cols-2' :
              lastMsg?.buttons && lastMsg.buttons.length > 2 ? 'grid-cols-2' : 'grid-cols-1'
            }`}>
              {lastMsg?.buttons?.map((btn) => {
                const isSelected = selectedMulti.has(btn.value);
                return (
                  <button
                    key={btn.value}
                    onClick={() => handleOption(btn)}
                    className={`h-11 px-4 rounded-xl text-sm font-medium transition-colors ${
                      currentQuestion?.type === 'multi' && isSelected
                        ? 'bg-[var(--qm-purple-600)] text-white'
                        : 'bg-white text-[var(--qm-ink-800)] border border-[var(--qm-line-100)] hover:border-[var(--qm-purple-600)]/40 hover:bg-[var(--qm-purple-600)]/5'
                    }`}
                  >
                    {btn.label}
                  </button>
                );
              })}
            </div>

            {/* 多选确认按钮 */}
            {currentQuestion?.type === 'multi' && selectedMulti.size > 0 && (
              <button
                onClick={() => onSpecialAction('continue')}
                className="w-full h-11 mt-2 bg-[var(--qm-purple-600)] text-white rounded-xl font-medium"
              >
                确认选择（{selectedMulti.size}）
              </button>
            )}
          </div>
        </div>
      )}

      {/* 底部输入框 + 暂停按钮 */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-[var(--qm-surface-50)] border-t border-[var(--qm-line-100)] p-2 md:p-3 z-20"
        style={{
          paddingBottom: `calc(8px + env(safe-area-inset-bottom, 0px))`,
        }}
      >
        <div className="max-w-2xl md:max-w-3xl mx-auto flex gap-2 items-end">
          <button
            onClick={onPause}
            className="shrink-0 h-10 px-2 md:px-3 text-sm text-[var(--qm-ink-500)] hover:text-[var(--qm-purple-600)] transition-colors min-h-[44px] min-w-[44px] md:min-w-0 flex items-center justify-center"
          >
            <span className="hidden sm:inline">暂停</span>
            <span className="sm:hidden">⏸</span>
          </button>
          <form
            onSubmit={(e) => {
              e.preventDefault();
            }}
            className="flex-1 flex gap-2 items-end"
          >
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={currentQuestion?.placeholder || '直接告诉我你的情况…（Enter 换行）'}
              rows={1}
              className="flex-1 px-3 md:px-4 py-2.5 rounded-2xl bg-white border border-[var(--qm-line-100)] text-sm text-[var(--qm-ink-800)] placeholder:text-[var(--qm-ink-500)] focus:outline-none focus:ring-2 focus:ring-[var(--qm-purple-600)]/20 focus:border-[var(--qm-purple-600)]/40 resize-none leading-relaxed"
              style={{
                minHeight: '40px',
                maxHeight: '120px',
              }}
            />
            <button
              type="button"
              onClick={() => onOpenSubmit(inputValue)}
              disabled={!inputValue.trim()}
              className="h-10 md:h-11 px-3 md:px-4 rounded-full bg-[var(--qm-purple-600)] text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--qm-purple-700)] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0"
              aria-label="发送"
            >
              <span className="hidden sm:inline">发送</span>
              <svg className="w-4 h-4 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
        {/* Enter 行为低干扰提示 */}
        <p className="text-center text-[10px] text-[var(--qm-ink-500)] mt-1.5 mb-0.5">
          Enter 换行 · 点击发送
        </p>
      </div>
    </div>
  );
}

// --- 消息气泡 ---
function ChatBubble({ msg }: { msg: ChatMessage }) {
  const isXiaoxue = msg.role === 'xiaoxue';
  const isUser = msg.role === 'user';

  if (msg.cardType === 'crisis') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm">
        <p className="text-red-600 font-medium mb-2">⚠️ 请先关注安全</p>
        <p className="text-[var(--qm-ink-800)] whitespace-pre-wrap">{msg.content}</p>
      </div>
    );
  }

  if (msg.cardType === 'task_transition') {
    return (
      <div className="flex justify-center">
        <div className="bg-[var(--qm-purple-600)]/10 text-[var(--qm-purple-600)] text-xs px-4 py-2 rounded-full">
          {msg.content}
        </div>
      </div>
    );
  }

  if (msg.cardType === 'emotion') {
    return (
      <div className="flex justify-center">
        <div className="bg-[var(--qm-purple-600)]/10 text-[var(--qm-purple-600)] text-xs px-4 py-2 rounded-full">
          {msg.content}
        </div>
      </div>
    );
  }

  if (msg.cardType === 'low_push') {
    return (
      <div className="flex justify-center">
        <div className="bg-[var(--qm-ink-100)] text-[var(--qm-ink-600)] text-xs px-4 py-2 rounded-full">
          {msg.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className="flex gap-2 max-w-[88%] md:max-w-[75%]">
        {isXiaoxue && (
          <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[var(--qm-purple-600)] to-[var(--qm-purple-400)] flex items-center justify-center text-sm">
            ❄️
          </div>
        )}
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? 'bg-[var(--qm-purple-600)] text-white rounded-tr-md'
              : 'bg-white text-[var(--qm-ink-800)] border border-[var(--qm-line-100)] rounded-tl-md'
          }`}
        >
          <p className="whitespace-pre-wrap">{msg.content}</p>
        </div>
      </div>
    </div>
  );
}

// v11.0: 心理师推荐卡片组件已移除（去推荐化）

// --- 费用卡片 ---
function FeeCard({ fee, tier }: { fee: FeeCalculation; tier: string }) {
  const tierData = PRICE_REGISTRY[tier];

  if (!tierData) return null;

  return (
    <div className="bg-white rounded-2xl border border-[var(--qm-line-100)] p-4">
      <h3 className="font-semibold text-[var(--qm-ink-800)] mb-3">费用方案</h3>
      <p className="text-xs text-[var(--qm-ink-500)] mb-3">
        价格以QM官方价格表为准，以下为{fee.tier}元档位参考。
      </p>

      <div className="space-y-3">
        {/* 标准价格 */}
        <div className="flex justify-between items-center py-2 border-b border-[var(--qm-line-100)]/50">
          <span className="text-sm text-[var(--qm-ink-600)]">标准60分钟</span>
          <span className="text-sm font-medium text-[var(--qm-ink-800)]">{tierData.regular_60}元</span>
        </div>

        <div className="flex justify-between items-center py-2 border-b border-[var(--qm-line-100)]/50">
          <span className="text-sm text-[var(--qm-ink-600)]">标准90分钟</span>
          <span className="text-sm font-medium text-[var(--qm-ink-800)]">{tierData.regular_90}元</span>
        </div>

        {/* 首次优惠 */}
        <div className="flex justify-between items-center py-2 border-b border-[var(--qm-line-100)]/50">
          <div>
            <span className="text-sm text-[var(--qm-ink-600)]">首次优惠 60分钟</span>
            <span className="ml-2 text-xs bg-[var(--qm-purple-600)]/15 text-[var(--qm-purple-600)] px-1.5 py-0.5 rounded">首次专享</span>
          </div>
          <span className="text-sm font-medium text-[var(--qm-purple-600)]">{tierData.first_60}元</span>
        </div>

        <div className="flex justify-between items-center py-2 border-b border-[var(--qm-line-100)]/50">
          <span className="text-sm text-[var(--qm-ink-600)]">首次优惠 90分钟</span>
          <span className="text-sm font-medium text-[var(--qm-purple-600)]">{tierData.first_90}元</span>
        </div>

        {/* 次卡 */}
        <div className="flex justify-between items-center py-2 border-b border-[var(--qm-line-100)]/50">
          <div>
            <span className="text-sm text-[var(--qm-ink-600)]">5小时卡</span>
            <span className="ml-2 text-xs text-[var(--qm-ink-500)]">约{tierData.pack5 / 5}元/小时</span>
          </div>
          <span className="text-sm font-medium text-[var(--qm-ink-800)]">{tierData.pack5}元</span>
        </div>

        <div className="flex justify-between items-center py-2">
          <div>
            <span className="text-sm text-[var(--qm-ink-600)]">10小时卡</span>
            <span className="ml-2 text-xs text-[var(--qm-ink-500)]">约{tierData.pack10 / 10}元/小时</span>
          </div>
          <span className="text-sm font-medium text-[var(--qm-ink-800)]">{tierData.pack10}元</span>
        </div>
      </div>

      {fee.manual_review && (
        <div className="mt-3 text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
          ⚠️ 具体方案需人工客服确认
        </div>
      )}
    </div>
  );
}

// --- 摘要确认页 ---
function SummaryView({
  draft,
  onSubmit,
  onSaveDraft,
  onModify,
  editField,
  setEditField,
}: {
  draft: BookingDraft;
  onSubmit: () => void;
  onSaveDraft: () => void;
  onModify: (field: keyof BookingFields, newValue: string | string[] | number | boolean | undefined) => void;
  editField: string | null;
  setEditField: (v: string | null) => void;
}) {
  const fields = draft.fields;

  // v4.0: 按任务分组显示
  const summaryGroups: {
    groupName: string;
    required: boolean;
    items: { label: string; value: string; field: keyof BookingFields | null; editable: boolean }[];
  }[] = [
    {
      groupName: '基本信息（必填）',
      required: true,
      items: [
        {
          label: '预约目标',
          value: getIntentText(fields.intent),
          field: 'intent',
          editable: true,
        },
        {
          label: '预约对象',
          value: getBookingForText(fields.booking_for),
          field: 'booking_for',
          editable: true,
        },
        {
          label: '核心需求',
          value: [
            ...(fields.core_topics || []).map((t) => getTopicLabel(t)),
            fields.core_topics_open || '',
          ].filter(Boolean).join('、') || '未填写',
          field: 'core_topics',
          editable: true,
        },
        {
          label: '联系方式',
          value: getContactText(fields.contact_method, fields.contact_value),
          field: 'contact_method',
          editable: true,
        },
        {
          label: '所在地',
          value: [fields.city, fields.country, fields.timezone].filter(Boolean).join('，') || '未填写',
          field: 'city',
          editable: true,
        },
      ],
    },
    {
      groupName: '咨询背景（推荐）',
      required: false,
      items: [
        {
          label: '咨询经验',
          value: fields.experience === 'experienced' ? '有咨询经验' : (fields.experience === 'first_time' ? '第一次咨询' : '未填写'),
          field: 'experience',
          editable: true,
        },
        {
          label: '持续时间',
          value: getDurationText(fields.duration_issue) || '未填写',
          field: 'duration_issue',
          editable: true,
        },
        {
          label: '服务方式偏好',
          value: getServiceModeText(fields.service_mode) || '未填写',
          field: 'service_mode',
          editable: true,
        },
      ],
    },
    {
      groupName: '心理师匹配（推荐）',
      required: false,
      items: [
        {
          label: '心理师性别偏好',
          value: getGenderPrefText(fields.gender_preference) || '未填写',
          field: 'gender_preference',
          editable: true,
        },
        {
          label: '语言偏好',
          value: (fields.language_preference || []).map((l) => getLangLabel(l)).join('、') || '未填写',
          field: 'language_preference',
          editable: true,
        },
        {
          label: '身份/文化偏好',
          value: fields.identity_preference || '未填写',
          field: 'identity_preference',
          editable: true,
        },
        {
          label: '主要顾虑',
          value: (fields.concerns || []).map((c) => getConcernLabel(c)).join('、') || '无',
          field: 'concerns',
          editable: true,
        },
        {
          label: '选择的心理师',
          value: fields.selected_therapist || fields.designated_therapist || '待定',
          field: 'selected_therapist',
          editable: false,
        },
      ],
    },
    {
      groupName: '预算与时间（推荐）',
      required: false,
      items: [
        {
          label: '预算范围',
          value: fields.budget ? `${fields.budget}元/60分钟以内` : '未设限',
          field: 'budget',
          editable: true,
        },
        {
          label: '咨询时长',
          value: fields.session_duration ? `${fields.session_duration}分钟` : '待定',
          field: 'session_duration',
          editable: true,
        },
        {
          label: '时间偏好',
          value: getTimePrefText(fields.time_preference) || '未填写',
          field: 'time_preference',
          editable: true,
        },
      ],
    },
    {
      groupName: '补充说明',
      required: false,
      items: [
        {
          label: '补充说明',
          value: fields.supplement || '无',
          field: 'supplement',
          editable: true,
        },
      ],
    },
  ];

  // 检查必填项
  const requiredCheck = checkRequiredFields(fields);

  return (
    <div className="flex flex-col flex-1 pb-32">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-[var(--qm-ink-800)] mb-1">预约摘要</h2>
        <p className="text-sm text-[var(--qm-ink-500)]">
          确认一下下面的信息，没问题就可以提交给人工客服了。
        </p>
      </div>

      {/* 必填项检查提示 */}
      {!requiredCheck.allRequired && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
          <p className="text-sm text-amber-700 font-medium mb-1">还有必填项未填写</p>
          <p className="text-xs text-amber-600">
            提交前需要：预约目标、联系方式（或明确拒绝）、所在地。
            你可以返回补填，也可以先提交让人工客服后续联系你补充。
          </p>
        </div>
      )}

      {/* 各分组 */}
      {summaryGroups.map((group) => (
        <div key={group.groupName} className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-medium text-[var(--qm-ink-700)]">{group.groupName}</h3>
            {group.required && (
              <span className="text-[10px] px-1.5 py-0.5 bg-[var(--qm-purple-600)]/10 text-[var(--qm-purple-600)] rounded">
                必填
              </span>
            )}
          </div>
          <div className="bg-white rounded-2xl border border-[var(--qm-line-100)] overflow-hidden">
            {group.items.map((item, idx) => (
              <div
                key={item.field || idx}
                className={`flex items-start justify-between py-3 px-4 ${
                  idx < group.items.length - 1 ? 'border-b border-[var(--qm-line-100)]/50' : ''
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-[var(--qm-ink-500)] mb-1">{item.label}</div>
                  <div className="text-sm text-[var(--qm-ink-800)] break-words">
                    {item.value}
                  </div>
                </div>
                {item.editable && item.field && (
                  <button
                    onClick={() => setEditField(item.field as string)}
                    className="shrink-0 ml-2 text-xs text-[var(--qm-purple-600)] hover:underline"
                  >
                    修改
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="mt-4 text-xs text-[var(--qm-ink-500)] leading-relaxed">
        提交后，人工客服会看到这份摘要。小雪不会替你确认最终预约。
        正式预约需要人工客服确认排期和收费后才算成功。
      </div>

      {/* 底部固定按钮 */}
      <div className="fixed bottom-0 left-0 right-0 bg-[var(--qm-surface-50)] border-t border-[var(--qm-line-100)] p-3 z-20">
        <div className="max-w-2xl mx-auto space-y-2">
          <button
            onClick={onSubmit}
            className="w-full h-12 bg-[var(--qm-purple-600)] text-white rounded-xl font-medium hover:bg-[var(--qm-purple-700)] transition-colors"
          >
            确认提交给人工客服
          </button>
          <button
            onClick={onSaveDraft}
            className="w-full h-10 text-sm text-[var(--qm-ink-600)] hover:text-[var(--qm-ink-800)] transition-colors"
          >
            暂不提交，保存草稿
          </button>
        </div>
      </div>
    </div>
  );
}

// --- 提交完成页 ---
function SubmittedView({ draft }: { draft: BookingDraft }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 flex-1">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-3xl mb-4">
        ✓
      </div>

      <h2 className="text-xl font-semibold text-[var(--qm-ink-800)] mb-2">已收到你的预约准备信息</h2>
      <p className="text-sm text-[var(--qm-ink-500)] text-center mb-6">
        摘要编号：{draft.booking_id.slice(-8)}
      </p>

      <div className="w-full max-w-sm bg-white rounded-2xl border border-[var(--qm-line-100)] p-4 mb-6">
        <h3 className="font-medium text-[var(--qm-ink-800)] mb-3">接下来</h3>
        <ul className="space-y-2 text-sm text-[var(--qm-ink-600)]">
          <li className="flex gap-2">
            <span className="text-[var(--qm-purple-600)] shrink-0">1.</span>
            <span>人工客服会在1-2个工作日内通过微信或电话联系你</span>
          </li>
          <li className="flex gap-2">
            <span className="text-[var(--qm-purple-600)] shrink-0">2.</span>
            <span>确认排期、心理师和具体费用</span>
          </li>
          <li className="flex gap-2">
            <span className="text-[var(--qm-purple-600)] shrink-0">3.</span>
            <span>完成付款后正式保留时段</span>
          </li>
        </ul>
      </div>

      <div className="w-full max-w-sm bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6">
        <p className="text-sm text-amber-700">
          ⚠️ 请注意：这不是预约成功。人工客服确认排期和收费后，才算正式预约。
        </p>
      </div>

      <div className="w-full max-w-sm text-sm text-[var(--qm-ink-600)] mb-6">
        <p>联系方式：</p>
        <div className="mt-2"><CopyableWechat /></div>
        <p className="text-[var(--qm-ink-800)] mt-2">电话：15001930070（备用 13601658763）</p>
      </div>

      <Link
        href="/"
        className="w-full max-w-sm h-12 flex items-center justify-center bg-[var(--qm-purple-600)] text-white rounded-xl font-medium hover:bg-[var(--qm-purple-700)] transition-colors"
      >
        返回首页
      </Link>
    </div>
  );
}

// ==================== 辅助函数（显示用） ====================

function getIntentText(v?: string): string {
  const map: Record<string, string> = {
    direct_booking: '想直接预约',
    just_looking: '先了解看看',
    exploring: '还在探索中',
    find_match: '想找一位合适的心理师',
    specific_therapist: '已经有想选的心理师',
  };
  return map[v || ''] || '未填写';
}

function getContactText(method?: string, value?: string): string {
  if (!method || method === 'none_refused') {
    return '暂未提供（已明确拒绝）';
  }
  const methodMap: Record<string, string> = {
    wechat: '微信',
    phone: '电话',
    email: '邮箱',
  };
  const methodLabel = methodMap[method] || method;
  return value ? `${methodLabel}：${value}` : methodLabel;
}

function getBookingForText(v?: string): string {
  const map: Record<string, string> = {
    self: '为自己',
    partner: '为伴侣/恋人',
    family: '为家庭',
    child: '为孩子',
    other: '其他',
  };
  return map[v || ''] || '未填写';
}

function getTopicLabel(v: string): string {
  const map: Record<string, string> = {
    anxiety: '焦虑/压力',
    relationship: '亲密关系',
    family: '家庭/原生家庭',
    work: '职场/职业发展',
    trauma: '创伤相关',
    adhd: 'ADHD/注意力',
    lgbtq: 'LGBTQ+/性别多元',
    identity: '身份探索',
    depression: '抑郁/低落',
    other: '其他',
  };
  return map[v] || v;
}

function getDurationText(v?: string): string {
  const map: Record<string, string> = {
    weeks: '最近几周',
    months: '几个月',
    years: '一年以上',
    intermittent: '断断续续很久了',
  };
  return map[v || ''] || '';
}

function getServiceModeText(v?: string): string {
  const map: Record<string, string> = {
    online: '线上咨询',
    offline: '线下到店',
    both: '都可以',
  };
  return map[v || ''] || '';
}

function getGenderPrefText(v?: string): string {
  const map: Record<string, string> = {
    female: '女心理师',
    male: '男心理师',
    no_preference: '都可以',
  };
  return map[v || ''] || '';
}

function getLangLabel(v: string): string {
  const map: Record<string, string> = {
    mandarin: '普通话',
    english: '英语',
    shanghainese: '沪语',
    cantonese: '粤语',
    other: '其他',
  };
  return map[v] || v;
}

function getConcernLabel(v: string): string {
  const map: Record<string, string> = {
    privacy: '保密问题',
    effectiveness: '效果不确定',
    cost: '费用压力',
    time: '时间安排',
    identity_safety: '身份安全',
    other: '其他顾虑',
  };
  return map[v] || v;
}

function getTimePrefText(v?: string): string {
  const map: Record<string, string> = {
    weekday_day: '工作日白天',
    weekday_evening: '工作日晚上',
    weekend: '周末',
    flexible: '都可以',
  };
  return map[v || ''] || '';
}
