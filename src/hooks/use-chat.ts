"use client";

import { useState, useRef, useEffect } from "react";
import {
  getMemoryContextString,
  extractAndSaveMemory,
  clearAllMemory,
} from "@/lib/memory-store";
import { readRecentTreeholeContext } from "@/lib/context/treehole-context-client";
import { consumePendingContext } from "@/lib/context/pending-context";
import { clearAllAudio } from "@/lib/voice/audio-store";
import type { VoiceMeta } from "@/lib/voice/types";
import { markVoicePerf } from "@/lib/voice/performance";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  isCrisis?: boolean;
  crisisLevel?: "direct" | "indirect";
  hidden?: boolean; // 系统消息不展示
  timestamp: number;
  /** 语音消息元数据（音频 Blob 存 IndexedDB，不在此对象中） */
  voiceMeta?: VoiceMeta;
}

interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  input: string;
  setInput: (value: string) => void;
  sendMessage: (text?: string, isSystem?: boolean, voiceMeta?: ChatMessage["voiceMeta"], userId?: string) => Promise<void>;
  addPendingVoiceMessage: (message: ChatMessage) => void;
  resolveVoiceMessage: (messageId: string, text: string, voiceMeta: ChatMessage["voiceMeta"]) => Promise<void>;
  failVoiceTranscript: (messageId: string, error: string) => void;
  clearChat: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  // ===== v7.1 小酷入口状态机 =====
  /** 本地存储已读取完成（hydration），在此之前不渲染聊天/入口，避免闪烁空白 */
  hydrated: boolean;
  /** 用户是否已经进入过小酷对话（ENTRY 之外的状态） */
  started: boolean;
  /** 是否存在真实的可展示聊天历史 */
  hasHistory: boolean;
  /** 用户点击「开始对话 / 继续上次对话」：幂等插入本地固定首句，不调用 LLM */
  startXiaoku: () => void;
  /** 清空对话并回到入口页（同时清 started / 首句标记） */
  newChat: () => void;
}

// 清除记忆的触发词
const CLEAR_MEMORY_TRIGGERS = [
  "清除所有记忆",
  "清空所有记忆",
  "忘掉所有",
  "忘记所有",
  "删除所有记忆",
  "清除全部记忆",
];

// ===== v7.1 小酷入口本地存储键 =====
const LS_MESSAGES = "xiaoku_chat_messages_v1";
const LS_STARTED = "xiaoku_chat_started";
const LS_UPDATED = "xiaoku_chat_updated_at";
const FIRST_GREETING_ID = "xiaoku-first-greeting-v1";

// 小酷主动首句（本地固定 seed，不调用 LLM）
const FIRST_GREETING =
  "你好呀，我是小酷 👋\n\n不用想好要怎么说才开始。你可以告诉我最近发生的一件事、现在的心情，或者只是随便聊聊。\n\n你现在比较想从哪里说起？";

function shouldClearMemory(text: string): boolean {
  const lower = text.toLowerCase();
  return CLEAR_MEMORY_TRIGGERS.some((t) => text.includes(t) || lower.includes(t));
}

/** 仅持久化可展示的真实消息（排除 hidden 系统消息与首句 seed，首句由状态机自动重建） */
function persistable(messages: ChatMessage[]): ChatMessage[] {
  return messages.filter(
    (m) =>
      !m.hidden &&
      m.role !== "system" &&
      m.id !== FIRST_GREETING_ID &&
      m.content.trim().length > 0,
  );
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [started, setStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  // hydration 完成前不允许写 localStorage，避免用空数组覆盖旧历史
  const readyPersistRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ===== hydration：只在 client mount 后读取 localStorage，防止 SSR/CSR 错位闪烁 =====
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const startedRaw = localStorage.getItem(LS_STARTED);
      const wasStarted = startedRaw === "true";

      let loaded: ChatMessage[] = [];
      const raw = localStorage.getItem(LS_MESSAGES);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            loaded = parsed
              .filter(
                (m) =>
                  m &&
                  typeof m.id === "string" &&
                  (m.role === "user" || m.role === "assistant") &&
                  typeof m.content === "string",
              )
              .map((m) => {
                // 解析 voiceMeta 字段（如果存在）
                const msg: ChatMessage = {
                  id: m.id,
                  role: m.role,
                  content: m.content,
                  timestamp: m.timestamp,
                };
                if (m.isCrisis !== undefined) msg.isCrisis = m.isCrisis;
                if (m.crisisLevel !== undefined) msg.crisisLevel = m.crisisLevel;
                if (m.voiceMeta && typeof m.voiceMeta === "object") {
                  msg.voiceMeta = {
                    hasAudio: !!m.voiceMeta.hasAudio,
                    duration: Number(m.voiceMeta.duration) || 0,
                    mimeType: String(m.voiceMeta.mimeType || ""),
                    transcriptStatus:
                      m.voiceMeta.transcriptStatus === "pending" ||
                      m.voiceMeta.transcriptStatus === "ready" ||
                      m.voiceMeta.transcriptStatus === "error"
                        ? m.voiceMeta.transcriptStatus
                        : undefined,
                    transcriptError:
                      typeof m.voiceMeta.transcriptError === "string"
                        ? m.voiceMeta.transcriptError
                        : undefined,
                  };
                }
                return msg;
              });
          }
        } catch {
          loaded = [];
        }
      }

      // 真值表修复：started=true 但没有真实历史（脏数据）→ 自动补首句，绝不允许空白聊天页
      if (wasStarted && loaded.length === 0) {
        loaded = [
          {
            id: FIRST_GREETING_ID,
            role: "assistant",
            content: FIRST_GREETING,
            timestamp: Date.now(),
          },
        ];
      }

      setMessages(loaded);
      setStarted(wasStarted);
    } finally {
      readyPersistRef.current = true;
      setHydrated(true);
    }
  }, []);

  // ===== 持久化：消息变化时写回 localStorage =====
  useEffect(() => {
    if (!readyPersistRef.current) return;
    if (typeof window === "undefined") return;
    try {
      const toSave = persistable(messages);
      if (toSave.length > 0) {
        localStorage.setItem(LS_MESSAGES, JSON.stringify(toSave));
        localStorage.setItem(LS_UPDATED, String(Date.now()));
      } else {
        localStorage.removeItem(LS_MESSAGES);
        localStorage.removeItem(LS_UPDATED);
      }
    } catch {
      // 存储失败（隐私模式/配额）不影响对话
    }
  }, [messages]);

  // started 状态持久化
  useEffect(() => {
    if (!readyPersistRef.current) return;
    if (typeof window === "undefined") return;
    try {
      if (started) localStorage.setItem(LS_STARTED, "true");
      else localStorage.removeItem(LS_STARTED);
    } catch {
      // ignore
    }
  }, [started]);

  const hasHistory = persistable(messages).length > 0;

  // ===== v7.1：插入本地固定首句（幂等），不调用 LLM =====
  const insertGreetingIfNeeded = () => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === FIRST_GREETING_ID)) return prev;
      return [
        ...prev,
        {
          id: FIRST_GREETING_ID,
          role: "assistant",
          content: FIRST_GREETING,
          timestamp: Date.now(),
        },
      ];
    });
  };

  // 用户点击「开始对话 / 继续上次对话」
  const startXiaoku = () => {
    setStarted(true);
    // 无真实历史时插入首句；有历史则直接进入，不重复
    if (!hasHistory) {
      insertGreetingIfNeeded();
    }
    try {
      localStorage.setItem("qm_last_xiaoku_at", String(Date.now()));
    } catch {
      // ignore
    }
  };

  // 清空对话 → 回到入口页，同时清空 IndexedDB 音频
  const newChat = () => {
    abortControllerRef.current?.abort();
    setMessages([]);
    setStarted(false);
    setInput("");
    try {
      localStorage.removeItem(LS_MESSAGES);
      localStorage.removeItem(LS_UPDATED);
      localStorage.removeItem(LS_STARTED);
    } catch {
      // ignore
    }
    // 异步清空所有音频存储，不 await（不阻塞 UI）
    void clearAllAudio();
  };

  const addPendingVoiceMessage = (message: ChatMessage) => {
    setMessages((prev) => {
      const next = [...prev, message];
      messagesRef.current = next;
      return next;
    });
  };

  const failVoiceTranscript = (messageId: string, error: string) => {
    setMessages((prev) => {
      const next = prev.map((m) =>
        m.id === messageId
          ? { ...m, voiceMeta: m.voiceMeta ? { ...m.voiceMeta, transcriptStatus: "error" as const, transcriptError: error } : m.voiceMeta }
          : m
      );
      messagesRef.current = next;
      return next;
    });
  };

  const resolveVoiceMessage = async (messageId: string, text: string, voiceMeta: ChatMessage["voiceMeta"]) => {
    await sendMessage(text, false, voiceMeta ? { ...voiceMeta, transcriptStatus: "ready", transcriptError: undefined } : voiceMeta, messageId);
  };

  const sendMessage = async (text?: string, isSystem = false, voiceMeta?: ChatMessage["voiceMeta"], userId?: string) => {
    const messageText = text ?? input;
    if (!messageText.trim() || isLoading) return;

    const trimmedText = messageText.trim();

    // === 清除记忆指令（仅对真实用户消息生效，不影响系统注入消息）===
    if (!isSystem && shouldClearMemory(trimmedText)) {
      clearAllMemory();
      const confirmMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: trimmedText,
        timestamp: Date.now(),
      };
      const assistantId = `assistant-${Date.now()}`;
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content:
          "好的，我已经清除了所有在本地保存的记忆——包括你的称呼和安全标记。\n\n接下来的对话会像我们第一次见面一样重新开始。如果你愿意，可以再告诉我怎么称呼你 🤍",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, confirmMsg, assistantMsg]);
      setInput("");
      return;
    }

    const userMessage: ChatMessage = {
      id: userId || `user-${Date.now()}`,
      role: isSystem ? "system" : "user",
      content: trimmedText,
      hidden: isSystem,
      timestamp: Date.now(),
    };

    // 语音消息附加 voiceMeta
    if (voiceMeta) {
      userMessage.voiceMeta = voiceMeta;
    }

    const assistantId = `assistant-${Date.now()}`;
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
    };

    const existingVoice = !!userId && messagesRef.current.some((m) => m.id === userId);
    setMessages((prev) => {
      const next = existingVoice
        ? [...prev.map((m) => m.id === userId ? userMessage : m), assistantMessage]
        : [...prev, userMessage, assistantMessage];
      messagesRef.current = next;
      return next;
    });
    setInput("");
    setIsLoading(true);

    abortControllerRef.current = new AbortController();

    // === 组装发送给 API 的消息列表 ===
    // 1. 历史消息（去除空 assistant 占位与隐藏系统消息）
    const historyBaseRaw = existingVoice
      ? messagesRef.current.map((m) => m.id === userId ? userMessage : m)
      : [...messagesRef.current, userMessage];
    // 补丁四：history 上限 16 轮（最近 31 条 + 最早 1 条 user），保留昵称/开场防"不记得我"，抑制 token 膨胀
    const firstUserMsg = historyBaseRaw.find((m) => m.role === "user");
    const historyTail = historyBaseRaw.slice(-31);
    const historyBase =
      firstUserMsg && !historyTail.includes(firstUserMsg) ? [firstUserMsg, ...historyTail] : historyTail;
    const historyForApi = historyBase
      .filter((m) => m.content && m.content.trim().length > 0 && !m.hidden && m.content !== "转写中…")
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    // 2. 注入本地记忆上下文（作为 system message 置于最前）
    const memoryContext = getMemoryContextString();
    if (memoryContext) {
      historyForApi.unshift({ role: "system", content: memoryContext });
    }

    // 2.1 Wave2 跨模块桥：一次性消费「带结果/问小酷」上下文（心理测试/知识/工具/树洞）
    // 消费后立即清除，刷新不重复注入；不经过 URL，避免敏感数据暴露。
    const pendingCtx = consumePendingContext();
    if (pendingCtx && pendingCtx.summary) {
      historyForApi.unshift({
        role: "system",
        content:
          `[跨模块上下文 · 来源 ${pendingCtx.source}] 用户此前主动带来了下面这段内容，供你在回答时参考，但不要提及"跨模块上下文"这类字眼，自然融入即可。\n` +
          pendingCtx.summary,
      });
    }

    // 3. v13.2: 读取树洞上下文（仅小酷 chat 请求，不注入小雪）
    const treeholeContext = readRecentTreeholeContext(7, 8);

    // P1.8 H10 缺口4：前端消息转义，防止网关 444 拒绝
    // 转义 < > 及事件处理器（onerror 等），使含尖括号的正常倾诉不再触发网关 444
    const escapeMessage = (msg: string): string => {
      // 转义尖括号
      let escaped = msg.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      // 剥离事件处理器（onerror= 等）
      escaped = escaped.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
      escaped = escaped.replace(/\s+on\w+\s*=\s*\S+/gi, '');
      return escaped;
    };
    
    // 对历史消息进行转义
    const escapedHistoryForApi = historyForApi.map(m => ({
      ...m,
      content: m.role === 'user' ? escapeMessage(m.content) : m.content,
    }));

    try {
      markVoicePerf("llmRequestAt");
      let firstTokenMarked = false;
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: escapedHistoryForApi,
          clientContext: { treehole: treeholeContext },
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        // P1.8 H10 缺口4：按状态码分支文案
        const status = response.status;
        let errorMessage = '';
        if (status === 444) {
          errorMessage = '你刚才的消息里有一些特殊符号没能发出去，你输入的内容已经帮你保留在输入框，可以直接删掉特殊符号重发。';
          // 保留输入框内容，不清空
          setInput(trimmedText);
        } else if (status === 400) {
          errorMessage = '消息格式有点问题，可以检查一下再发。';
        } else if (status === 500) {
          errorMessage = '服务器暂时有点忙，稍后再试试。';
        } else {
          errorMessage = '网络好像出了点问题，稍后再试试。';
        }
        throw new Error(errorMessage);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";
      let sseLineBuffer = "";
      let parseFailCount = 0;
      
      // P1.7 F5：前端超时兜底 - 30s 无首字/心跳事件显示超时提示
      const FIRST_TOKEN_TIMEOUT_MS = 30000;
      const firstTokenTimer = setTimeout(() => {
        if (!firstTokenMarked) {
          // 30s 内无首字，显示超时提示
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id !== assistantId) return m;
              return {
                ...m,
                content: accumulatedText + "\n\n网络有点慢，可以再等等，或者重新发送试试。",
                isTimeout: true,
              };
            }),
          );
        }
      }, FIRST_TOKEN_TIMEOUT_MS);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          // 收到首个 chunk，清除超时计时器
          if (!firstTokenMarked) {
            clearTimeout(firstTokenTimer);
          }

          const chunk = decoder.decode(value, { stream: true });
          sseLineBuffer += chunk;
          const lines = sseLineBuffer.split("\n\n");
          sseLineBuffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  if (!firstTokenMarked) {
                    firstTokenMarked = true;
                    markVoicePerf("llmFirstTokenAt");
                  }
                  // v11.5.1: verifier block 时后端发送 replaceOutput:true，
                  // 前端需用 fallback 内容替换已流式输出的违规内容，
                  // 而不是在违规内容后追加，避免用户看到两段拼接。
                  if (parsed.replaceOutput) {
                    accumulatedText = parsed.content.replace(/^\n+/, "");
                  } else {
                    accumulatedText += parsed.content;
                  }
                  setMessages((prev) =>
                    prev.map((m) => {
                      if (m.id !== assistantId) return m;
                      // 危机标记粘滞：isCrisis 只允许被显式 true 置位，绝不被后续帧抹回 false
                      const nextIsCrisis = parsed.isCrisis === true ? true : m.isCrisis;
                      return {
                        ...m,
                        content: accumulatedText,
                        isCrisis: nextIsCrisis,
                        crisisLevel: parsed.crisisLevel ?? m.crisisLevel,
                      };
                    }),
                  );
                }
                if (parsed.error) {
                  throw new Error(parsed.error);
                }
              } catch (e) {
                parseFailCount++;
                if (parseFailCount <= 3) {
                  console.warn(`[use-chat] SSE parse fail #${parseFailCount}:`, e);
                }
              }
            }
          }
        }

        // flush 剩余 buffer
        if (sseLineBuffer.startsWith("data: ")) {
          const data = sseLineBuffer.slice(6);
          if (data !== "[DONE]") {
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                if (parsed.replaceOutput) {
                  accumulatedText = parsed.content.replace(/^\n+/, "");
                } else {
                  accumulatedText += parsed.content;
                }
                setMessages((prev) =>
                  prev.map((m) => {
                    if (m.id !== assistantId) return m;
                    const nextIsCrisis = parsed.isCrisis === true ? true : m.isCrisis;
                    return {
                      ...m,
                      content: accumulatedText,
                      isCrisis: nextIsCrisis,
                      crisisLevel: parsed.crisisLevel ?? m.crisisLevel,
                    };
                  }),
                );
              }
            } catch (e) {
              parseFailCount++;
              console.warn(`[use-chat] SSE flush parse fail:`, e);
            }
          }
        }
      }

      // === AI 回复完成后，从对话中提取并保存记忆 ===
      try {
        const allForExtract = [...messages, userMessage];
        if (accumulatedText) {
          allForExtract.push({
            id: assistantId,
            role: "assistant",
            content: accumulatedText,
            timestamp: Date.now(),
          });
        }
        extractAndSaveMemory(
          allForExtract.map((m) => ({ role: m.role, content: m.content })),
        );
      } catch {
        // 记忆提取失败不影响对话
      }
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      
      // P1.9 I6：按错误类型分支文案（替换旧"忙乱"文案）
      let errorMessage = "网络好像有点问题，要不要再试一次？";
      if (error instanceof Error) {
        if (error.message.includes("444") || error.message.includes("特殊符号")) {
          errorMessage = "你刚才的消息里有一些特殊符号没能发出去，你输入的内容已经帮你保留在输入框，可以直接删掉特殊符号重发";
        } else if (error.message.includes("400") || error.message.includes("格式")) {
          errorMessage = "消息格式有点问题，请检查一下再发";
        } else if (error.message.includes("500") || error.message.includes("服务器")) {
          errorMessage = "服务器有点忙，请稍后再试";
        }
      }
      
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content: errorMessage,
              }
            : m,
        ),
      );
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  // 兼容旧调用：清空为一条欢迎语（v7.1 起由 newChat + 入口页取代，保留以防外部引用）
  const clearChat = () => {
    newChat();
  };

  return {
    messages,
    isLoading,
    input,
    setInput,
    sendMessage,
    addPendingVoiceMessage,
    resolveVoiceMessage,
    failVoiceTranscript,
    clearChat,
    messagesEndRef,
    hydrated,
    started,
    hasHistory,
    startXiaoku,
    newChat,
  };
}
