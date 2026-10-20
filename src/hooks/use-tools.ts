// QM 自助工具 v3.0 - React Hook
// 封装 storage + quick match状态 + FAST MODE状态

import { useState, useEffect, useCallback } from "react";
import {
  saveEvent,
  getHistory,
  deleteEvent,
  getFavorites,
  toggleFavorite,
  saveContextCapsule,
  type HistoryItem,
} from "@/lib/tools/storage";
import {
  TOOL_REGISTRY,
  getToolById,
  getToolsByCategory,
  searchTools,
  CATEGORIES,
} from "@/lib/tools/tool-registry";
import { recommendTools, quickMatchAnswersToContext } from "@/lib/tools/recommend";
import type {
  Tool,
  ToolCategory,
  QuickMatchAnswer,
  ToolRecommendation,
  FastModeStatus,
  ToolEventSource,
} from "@/lib/tools/types";

export function useTools() {
  // 收藏状态
  const [favorites, setFavorites] = useState<string[]>([]);
  // 历史记录
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // 初始化
  useEffect(() => {
    setFavorites(getFavorites());
    setHistory(
      getHistory().map((item) => {
        const tool = getToolById(item.tool_id);
        return { ...item, tool_name: tool?.name || item.tool_id };
      })
    );
  }, []);

  // 切换收藏
  const handleToggleFavorite = useCallback((toolId: string) => {
    const nowFavorited = toggleFavorite(toolId);
    setFavorites(getFavorites());
    return nowFavorited;
  }, []);

  // 删除历史记录
  const handleDeleteEvent = useCallback((eventId: string) => {
    deleteEvent(eventId);
    setHistory(
      getHistory().map((item) => {
        const tool = getToolById(item.tool_id);
        return { ...item, tool_name: tool?.name || item.tool_id };
      })
    );
  }, []);

  // 记录工具事件
  const recordEvent = useCallback(
    (params: {
      tool_id: string;
      event_type: "started" | "paused" | "resumed" | "completed" | "stopped" | "rated" | "deleted";
      source: ToolEventSource;
      metrics?: {
        time_spent_sec?: number;
        step_reached?: number;
        total_steps?: number;
        before_intensity?: number;
        after_intensity?: number;
        helpfulness?: number;
      };
      user_note?: string;
    }) => {
      const event = saveEvent(params);
      // 刷新历史
      if (params.event_type === "completed" || params.event_type === "stopped") {
        setHistory(
          getHistory().map((item) => {
            const tool = getToolById(item.tool_id);
            return { ...item, tool_name: tool?.name || item.tool_id };
          })
        );
      }
      return event;
    },
    []
  );

  // Quick Match → 推荐
  const getRecommendationsFromQuickMatch = useCallback(
    (answers: QuickMatchAnswer[]): ToolRecommendation[] => {
      const ctx = quickMatchAnswersToContext(answers);
      return recommendTools(ctx, { topN: 3 });
    },
    []
  );

  // 保存并生成 Context Capsule（用于回小酷）
  const saveAndBuildCapsule = useCallback(
    (params: {
      tool_id: string;
      completion_status: "completed" | "stopped" | "paused";
      helpfulness?: number;
      user_note?: string;
      current_need_summary?: string;
      source: ToolEventSource;
      time_spent_sec?: number;
    }) => {
      const tool = getToolById(params.tool_id);
      if (!tool) return null;

      // 记录事件
      recordEvent({
        tool_id: params.tool_id,
        event_type: params.completion_status === "paused" ? "paused" : params.completion_status === "completed" ? "completed" : "stopped",
        source: params.source,
        metrics: {
          time_spent_sec: params.time_spent_sec,
          helpfulness: params.helpfulness,
        },
        user_note: params.user_note,
      });

      // 保存 Context Capsule
      const capsule = {
        tool_id: params.tool_id,
        tool_name: tool.name,
        completion_status: params.completion_status,
        helpfulness: params.helpfulness,
        user_note: params.user_note,
        current_need_summary: params.current_need_summary,
      };
      saveContextCapsule(capsule);
      return capsule;
    },
    [recordEvent]
  );

  return {
    // 数据
    tools: TOOL_REGISTRY,
    categories: CATEGORIES as ToolCategory[],
    favorites,
    history,
    // 方法
    getToolById,
    getToolsByCategory,
    searchTools,
    toggleFavorite: handleToggleFavorite,
    deleteEvent: handleDeleteEvent,
    recordEvent,
    getRecommendationsFromQuickMatch,
    saveAndBuildCapsule,
  };
}

// Quick Match Hook
export function useQuickMatch() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<QuickMatchAnswer[]>(
    Array(8).fill(null).map((_, i) => ({
      question_index: i,
      selected_options: [],
      free_text: "",
      skipped: false,
    }))
  );

  const questions = [
    {
      id: "need_type",
      question: "你现在更接近哪一种需要？",
      options: ["想先稳一下情绪", "想理清脑子里的想法", "想和关系有关", "想做点什么行动", "说不清"],
      multi: false,
    },
    {
      id: "intensity",
      question: "当前的强度大约怎样？",
      options: ["很轻", "中等", "很强", "说不清"],
      multi: false,
    },
    {
      id: "time",
      question: "你现在有多少时间？",
      options: ["1-3分钟", "5分钟", "10分钟", "15分钟或更多"],
      multi: false,
    },
    {
      id: "direction",
      question: "你更想从哪个方向开始？",
      options: ["身体感觉", "脑子里的想法", "关系或边界", "行动或目标"],
      multi: false,
    },
    {
      id: "can_close_eyes",
      question: "现在方便闭眼/安静下来吗？",
      options: ["可以", "不太方便", "不确定"],
      multi: false,
    },
    {
      id: "style",
      question: "你想要更直接还是更温柔的引导？",
      options: ["直接一点", "温柔一点", "都可以"],
      multi: false,
    },
    {
      id: "exclude",
      question: "有哪一类工具你现在明确不想做？",
      options: ["不想做呼吸类", "不想写东西", "不想谈关系", "没有，都可以试试"],
      multi: true,
    },
    {
      id: "share",
      question: "如果完成后去找小酷聊，你愿意让小酷知道你用了什么工具吗？",
      options: ["可以", "这次不用", "还没想好"],
      multi: false,
    },
  ];

  const totalQuestions = questions.length;

  const currentQuestion = questions[currentIndex];

  const selectOption = (option: string) => {
    setAnswers((prev) => {
      const next = [...prev];
      const current = { ...next[currentIndex] };

      if (currentQuestion.multi) {
        const selected = current.selected_options || [];
        if (selected.includes(option)) {
          current.selected_options = selected.filter((o) => o !== option);
        } else {
          current.selected_options = [...selected, option];
        }
      } else {
        current.selected_options = [option];
      }
      current.skipped = false;
      next[currentIndex] = current;
      return next;
    });
  };

  const setFreeText = (text: string) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[currentIndex] = { ...next[currentIndex], free_text: text };
      return next;
    });
  };

  const skip = () => {
    setAnswers((prev) => {
      const next = [...prev];
      next[currentIndex] = {
        ...next[currentIndex],
        skipped: true,
        selected_options: [],
      };
      return next;
    });
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((i) => i + 1);
    }
  };

  const next = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((i) => i + 1);
    }
  };

  const prev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  };

  const isLast = currentIndex === totalQuestions - 1;
  const progress = ((currentIndex + 1) / totalQuestions) * 100;
  const remainingSec = (totalQuestions - currentIndex - 1) * 8; // 每题约8秒

  const estimatedRemainingText = () => {
    if (remainingSec < 30) return "还剩约30秒";
    if (remainingSec < 60) return "还剩约1分钟";
    return `还剩约${Math.ceil(remainingSec / 60)}分钟`;
  };

  return {
    questions,
    currentIndex,
    currentQuestion,
    answers,
    totalQuestions,
    isLast,
    progress,
    remainingText: estimatedRemainingText(),
    selectOption,
    setFreeText,
    skip,
    next,
    prev,
  };
}

// FAST MODE Hook
export function useFastMode() {
  const [fastMode, setFastMode] = useState<FastModeStatus>("normal");

  const enterFastMode = useCallback(() => {
    setFastMode("fast");
  }, []);

  const endFastMode = useCallback(() => {
    setFastMode("ended");
  }, []);

  const resetFastMode = useCallback(() => {
    setFastMode("normal");
  }, []);

  // 检测用户输入是否触发 FAST MODE
  const detectFastMode = useCallback((userInput: string) => {
    const triggers = [ `太长", "快一点", "还有多久", "不想做了", "烦", "跳过"`, `太啰嗦", "太慢", "能不能快点", "我想结束"`,
    ];
    const lower = userInput.toLowerCase();
    return triggers.some((t) => lower.includes(t));
  }, []);

  return {
    fastMode,
    enterFastMode,
    endFastMode,
    resetFastMode,
    detectFastMode,
  };
}
