"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  getMemoryContextString,
  extractAndSaveMemory,
  clearAllMemory,
} from "@/lib/memory-store";
import { readRecentTreeholeContext } from "@/lib/context/treehole-context-client";
import { acknowledgePendingContext, peekPendingContext } from "@/lib/context/pending-context";
import { deleteConversationAudioChecked } from "@/lib/voice/audio-store";
import type { VoiceMeta } from "@/lib/voice/types";
import { emoticons } from "@/components/chat-desktop/emoticons";
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
  replyMode?: "text" | "voice";
  replyTo?: string;
  replyReceived?: boolean;
  delivery?: "pending" | "complete" | "failed" | "stopped";
}

interface UseChatReturn {
  messages: ChatMessage[];
  storedMessages: ChatMessage[];
  isLoading: boolean;
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  sendMessage: (
    text?: string,
    isSystem?: boolean,
    voiceMeta?: ChatMessage["voiceMeta"],
    userId?: string,
    regeneration?: { userId: string },
  ) => Promise<void>;
  regenerateReply: (replyId: string) => Promise<void>;
  addPendingVoiceMessage: (message: ChatMessage) => void;
  resolveVoiceMessage: (
    messageId: string,
    text: string,
    voiceMeta: ChatMessage["voiceMeta"],
  ) => Promise<void>;
  failVoiceTranscript: (messageId: string, error: string) => void;
  clearChat: () => Promise<boolean>;
  stopReply: () => void;
  // ===== v7.1 小酷入口状态机 =====
  /** 本地存储已读取完成（hydration），在此之前不渲染聊天/入口，避免闪烁空白 */
  hydrated: boolean;
  storageError: string;
  storageReady: boolean;
  retryStorage: () => void;
  /** 用户是否已经进入过小酷对话（ENTRY 之外的状态） */
  started: boolean;
  /** 是否存在真实的可展示聊天历史 */
  hasHistory: boolean;
  /** 用户点击「开始对话 / 继续上次对话」：幂等插入本地固定首句，不调用 LLM */
  startXiaoku: () => void;
  /** 清空对话并回到入口页（同时清 started / 首句标记） */
  newChat: () => Promise<boolean>;
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
  return CLEAR_MEMORY_TRIGGERS.some(
    (t) => text.includes(t) || lower.includes(t),
  );
}

/** 仅持久化可展示的真实消息（排除 hidden 系统消息与首句 seed，首句由状态机自动重建） */
function persistable(messages: ChatMessage[]): ChatMessage[] {
  return messages.filter(
    (m) =>
      !m.hidden &&
      m.role !== "system" &&
      m.id !== FIRST_GREETING_ID &&
      (m.content.trim().length > 0 || ["stopped", "failed", "pending"].includes(m.delivery || "")),
  );
}

export function useDesktopChat(): UseChatReturn {
  const busyRef = useRef(false);
  const generation = useRef(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState("");
  const inputRevision = useRef(0);
  const activeDraftRef = useRef<{ text: string; revision: number } | null>(null);
  const editInput = useCallback<React.Dispatch<React.SetStateAction<string>>>((value) => {
    inputRevision.current++;
    setInput(value);
  }, []);
  const [hydrated, setHydrated] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [storageRetry, setStorageRetry] = useState(0);
  const retryStorage = useCallback(() => setStorageRetry((value) => value + 1), []);
  const [started, setStarted] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);
  const activeReplyId = useRef<string | null>(null);
  const stopReply = useCallback(() => {
    if (!busyRef.current) return;
    const id = activeReplyId.current;
    activeDraftRef.current = null;
    generation.current++;
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    busyRef.current = false;
    activeReplyId.current = null;
    setIsLoading(false);
    setMessages((previous) => {
      const next = previous.map((message) => message.id === id ? { ...message, delivery: "stopped" as const } : message);
      messagesRef.current = next;
      return next;
    });
  }, []);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  // hydration 完成前不允许写 localStorage，避免用空数组覆盖旧历史
  const readyPersistRef = useRef(false);
  const lastStoredMessagesRef = useRef<string | null>(null);
  const skipHydrationPersistRef = useRef(false);
  const pauseForStorageConflict = useCallback(() => {
    const draft = activeDraftRef.current;
    if (draft && inputRevision.current === draft.revision) setInput(draft.text);
    activeDraftRef.current = null;
    readyPersistRef.current = false;
    generation.current++;
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    busyRef.current = false;
    const replyId = activeReplyId.current;
    activeReplyId.current = null;
    setIsLoading(false);
    setMessages((previous) => previous.map((message) =>
      message.id === replyId && message.delivery === "pending"
        ? { ...message, delivery: "failed" as const }
        : message,
    ));
    setStorageError("另一标签页已更新聊天记录；当前内容和草稿仍保留，请重试读取后继续，避免覆盖记录。");
  }, []);
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (!readyPersistRef.current || event.storageArea !== localStorage) return;
      if (event.key === null || (event.key === LS_MESSAGES && event.newValue !== lastStoredMessagesRef.current)) {
        pauseForStorageConflict();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [pauseForStorageConflict]);

  // Desktop view owns scroll: reading older messages must not jump on each token.
  useEffect(
    () => () => {
      generation.current++;
      abortControllerRef.current?.abort();
    },
    [],
  );

  // ===== hydration：只在 client mount 后读取 localStorage，防止 SSR/CSR 错位闪烁 =====
  useEffect(() => {
    if (typeof window === "undefined") return;
    readyPersistRef.current = false;
    try {
      const startedRaw = localStorage.getItem(LS_STARTED);
      const wasStarted = startedRaw === "true";

      let loaded: ChatMessage[] = [];
      const raw = localStorage.getItem(LS_MESSAGES);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (!Array.isArray(parsed)) throw new Error("聊天记录格式错误");
          const storedIds = new Set<string>();
          for (const m of parsed) {
            if (!m || typeof m.id !== "string" || !m.id.trim() ||
              storedIds.has(m.id) || !["user", "assistant"].includes(m.role) ||
              typeof m.content !== "string") throw new Error("聊天记录格式错误");
            storedIds.add(m.id);
            if (m.hidden != null && typeof m.hidden !== "boolean")
              throw new Error("聊天记录显示状态错误");
            if (m.voiceMeta != null) {
              if (typeof m.voiceMeta !== "object" || Array.isArray(m.voiceMeta) ||
                (m.voiceMeta.hasAudio != null && typeof m.voiceMeta.hasAudio !== "boolean"))
                throw new Error("录音记录格式错误");
              const value = m.voiceMeta.duration;
              if (value != null && typeof value !== "number" && typeof value !== "string")
                throw new Error("录音记录时长错误");
              const duration = value == null ? 0 : Number(value);
              if (!Number.isFinite(duration) || duration < 0)
                throw new Error("录音记录时长错误");
            }
          }
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
                if (typeof m.hidden === "boolean") msg.hidden = m.hidden;
                if (typeof m.replyTo === "string") msg.replyTo = m.replyTo;
                if (typeof m.replyReceived === "boolean") msg.replyReceived = m.replyReceived;
                if (m.replyMode === "voice" || m.replyMode === "text")
                  msg.replyMode = m.replyMode;
                if (["pending", "complete", "failed", "stopped"].includes(m.delivery))
                  msg.delivery =
                    m.delivery === "pending" ? "failed" : m.delivery;
                if (m.isCrisis !== undefined) msg.isCrisis = m.isCrisis;
                if (m.crisisLevel !== undefined)
                  msg.crisisLevel = m.crisisLevel;
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
          try {
            localStorage.setItem("xiaoku_chat_corrupt_backup_v1", raw);
          } catch {
            /* preserve if storage permits */
          }
          setStorageError("浏览器未能读取聊天记录；原记录没有被清除。请重试读取。");
          return;
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

      setStorageError("");
      lastStoredMessagesRef.current = raw;
      skipHydrationPersistRef.current = true;
      messagesRef.current = loaded;
      setMessages(loaded);
      setStarted(wasStarted);
      readyPersistRef.current = true;
    } catch {
      setStorageError(
        "浏览器未能读取聊天记录；旧记录没有被清除。请保留当前页面。",
      );
      return;
    } finally {
      setHydrated(true);
    }
  }, [storageRetry]);

  // ===== 持久化：消息变化时写回 localStorage =====
  useEffect(() => {
    if (!readyPersistRef.current || !hydrated) return;
    if (typeof window === "undefined") return;
    try {
      // Reading a tab must not rewrite the stored history merely to reorder
      // JSON fields or omit optional defaults, interrupting the active tab.
      if (skipHydrationPersistRef.current) {
        skipHydrationPersistRef.current = false;
        return;
      }
      // Check again before writing: a storage event can arrive after this
      // render, and this tab must not replace a newer tab's complete history.
      if (localStorage.getItem(LS_MESSAGES) !== lastStoredMessagesRef.current) {
        pauseForStorageConflict();
        return;
      }
      const toSave = persistable(messages);
      if (toSave.length > 0) {
        const serialized = JSON.stringify(toSave);
        localStorage.setItem(LS_MESSAGES, serialized);
        lastStoredMessagesRef.current = serialized;
        localStorage.setItem(LS_UPDATED, String(Date.now()));
      } else {
        localStorage.removeItem(LS_MESSAGES);
        lastStoredMessagesRef.current = null;
        localStorage.removeItem(LS_UPDATED);
      }
    } catch {
      setStorageError("浏览器没有保存聊天记录；请保留当前页面。");
    }
  }, [messages, hydrated, pauseForStorageConflict]);

  // started 状态持久化
  useEffect(() => {
    if (!readyPersistRef.current || !hydrated) return;
    if (typeof window === "undefined") return;
    try {
      if (started) localStorage.setItem(LS_STARTED, "true");
      else localStorage.removeItem(LS_STARTED);
    } catch {
      setStorageError("浏览器没有保存对话状态；请保留当前页面。");
    }
  }, [started, hydrated]);

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
  const newChat = async (): Promise<boolean> => {
    if (!readyPersistRef.current) return false;
    const keys = [LS_MESSAGES, LS_UPDATED, LS_STARTED];
    let snapshot: (string | null)[] = [];
    let draftSnapshot: string | null = null;
    const audioIds = messagesRef.current.filter((message) => message.voiceMeta?.hasAudio || message.replyMode === "voice").map((message) => message.id);
    generation.current++;
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    activeReplyId.current = null;
    activeDraftRef.current = null;
    busyRef.current = false;
    setIsLoading(false);
    readyPersistRef.current = false;
    try {
      snapshot = keys.map((key) => localStorage.getItem(key));
      draftSnapshot = sessionStorage.getItem("qm_chat_desktop_draft");
      sessionStorage.removeItem("qm_chat_desktop_draft");
      keys.forEach((key) => localStorage.removeItem(key));
      await deleteConversationAudioChecked(audioIds);
      lastStoredMessagesRef.current = null;
      messagesRef.current = [];
      setMessages([]);
      setStarted(false);
      editInput("");
      setStorageError("");
      readyPersistRef.current = true;
      return true;
    } catch {
      let restored = snapshot.length === keys.length;
      if (restored) {
        try {
          keys.forEach((key, index) => snapshot[index] === null ? localStorage.removeItem(key) : localStorage.setItem(key, snapshot[index]!));
          if (draftSnapshot === null) sessionStorage.removeItem("qm_chat_desktop_draft");
          else sessionStorage.setItem("qm_chat_desktop_draft", draftSnapshot);
        } catch { restored = false; }
      }
      if (restored) lastStoredMessagesRef.current = snapshot[0];
      readyPersistRef.current = restored;
      setStorageError(restored ? "本机对话没有清空，原记录已保留。请重试。" : "本机清空未完成，存储状态需要重试读取；当前消息仍保留在页面。");
      return false;
    }
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
          ? {
              ...m,
              voiceMeta: m.voiceMeta
                ? {
                    ...m.voiceMeta,
                    transcriptStatus: "error" as const,
                    transcriptError: error,
                  }
                : m.voiceMeta,
            }
          : m,
      );
      messagesRef.current = next;
      return next;
    });
  };

  const resolveVoiceMessage = async (
    messageId: string,
    text: string,
    voiceMeta: ChatMessage["voiceMeta"],
  ) => {
    await sendMessage(
      text,
      false,
      voiceMeta
        ? {
            ...voiceMeta,
            transcriptStatus: "ready",
            transcriptError: undefined,
          }
        : voiceMeta,
      messageId,
    );
  };

  const sendMessage = async (
    text?: string,
    isSystem = false,
    voiceMeta?: ChatMessage["voiceMeta"],
    userId?: string,
    regeneration?: { userId: string },
  ) => {
    const messageText = text ?? input;
    if (!hydrated || !readyPersistRef.current || !messageText.trim() || busyRef.current) return;

    const trimmedText = messageText.trim();
    const draftRevisionAtSend = inputRevision.current;

    // === 清除记忆指令（仅对真实用户消息生效，不影响系统注入消息）===
    if (!regeneration && !isSystem && shouldClearMemory(trimmedText)) {
      clearAllMemory();
      const confirmMsg: ChatMessage = {
        id: userId || `user-${crypto.randomUUID()}`,
        role: "user",
        content: trimmedText,
        timestamp: Date.now(),
      };
      if (voiceMeta) confirmMsg.voiceMeta = voiceMeta;
      const assistantId = `assistant-${crypto.randomUUID()}`;
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content:
          "好的，我已经清除了所有在本地保存的记忆——包括你的称呼和安全标记。\n\n接下来的对话会像我们第一次见面一样重新开始。如果你愿意，可以再告诉我怎么称呼你 🤍",
        timestamp: Date.now(),
      };
      assistantMsg.replyMode = voiceMeta ? "voice" : "text";
      assistantMsg.delivery = "complete";
      setMessages((prev) => [...prev, confirmMsg, assistantMsg]);
      if (!voiceMeta) setInput("");
      return;
    }

    const originalUser = regeneration ? messagesRef.current.find((message) => message.id === regeneration.userId && message.role === "user") : undefined;
    if (regeneration && !originalUser) return;
    const userMessage: ChatMessage = originalUser || {
      id: userId || `user-${crypto.randomUUID()}`,
      role: isSystem ? "system" : "user",
      content: messageText,
      hidden: isSystem,
      timestamp: Date.now(),
    };

    // 语音消息附加 voiceMeta
    if (voiceMeta) {
      userMessage.voiceMeta = voiceMeta;
    }

    busyRef.current = true;
    const attempt = ++generation.current;
    const priorMessages = messagesRef.current;
    const assistantId = `assistant-${crypto.randomUUID()}`;
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      replyMode: voiceMeta ? "voice" : "text",
      delivery: "pending",
      replyTo: userMessage.id,
      replyReceived: false,
      timestamp: Date.now(),
    };

    activeReplyId.current = assistantId;
    activeDraftRef.current = !voiceMeta && !regeneration && !isSystem
      ? { text: messageText, revision: draftRevisionAtSend }
      : null;

    const existingVoice =
      !!userId && messagesRef.current.some((m) => m.id === userId);
    setMessages((prev) => {
      const next = regeneration ? [...prev, assistantMessage] : existingVoice
        ? [
            ...prev.map((m) => (m.id === userId ? userMessage : m)),
            assistantMessage,
          ]
        : [...prev, userMessage, assistantMessage];
      messagesRef.current = next;
      return next;
    });
    if (!voiceMeta && !regeneration) setInput("");
    setIsLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // === 组装发送给 API 的消息列表 ===
    // 1. 历史消息（去除空 assistant 占位与隐藏系统消息）
    const historyBaseRaw = regeneration ? priorMessages.slice(0, priorMessages.findIndex((message) => message.id === regeneration.userId) + 1) : existingVoice
      ? priorMessages.map((m) => (m.id === userId ? userMessage : m))
      : [...priorMessages, userMessage];
    // 补丁四：history 上限 16 轮（最近 31 条 + 最早 1 条 user），保留昵称/开场防"不记得我"，抑制 token 膨胀
    const firstUserMsg = historyBaseRaw.find((m) => m.role === "user");
    const historyTail = historyBaseRaw.slice(-31);
    const historyBase =
      firstUserMsg && !historyTail.includes(firstUserMsg)
        ? [firstUserMsg, ...historyTail]
        : historyTail;
    const historyForApi = historyBase
      .filter(
        (m) =>
          m.content &&
          m.content.trim().length > 0 &&
          !m.hidden &&
          !["failed", "stopped", "pending"].includes(m.delivery || "") &&
          m.content !== "转写中…",
      )
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    // 2. 注入本地记忆上下文（作为 system message 置于最前）
    const memoryContext = getMemoryContextString();
    if (memoryContext) {
      historyForApi.unshift({ role: "system", content: memoryContext });
    }

    // 2.1 跨模块摘要在完整回复前保留；网络失败或停止后重试仍能带上。
    const pendingCtx = peekPendingContext();
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
      let escaped = msg
        .replace(/\[QM表情:(\d+)\]/g, (raw, id) =>
          emoticons[Number(id)]
            ? `[${emoticons[Number(id)][0].replace(/^最近/, "")}]`
            : raw,
        )
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      // 剥离事件处理器（onerror= 等）
      escaped = escaped.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, "");
      escaped = escaped.replace(/\s+on\w+\s*=\s*\S+/gi, "");
      return escaped;
    };

    // 对历史消息进行转义
    const escapedHistoryForApi = historyForApi.map((m) => ({
      ...m,
      content: m.role === "user" ? escapeMessage(m.content) : m.content,
    }));

    let timeout: ReturnType<typeof setTimeout> | undefined;
    let accumulatedText = "";
    const update = (fields: Partial<ChatMessage>) => {
      if (generation.current !== attempt) return;
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, ...fields } : m)),
      );
    };
    try {
      markVoicePerf("llmRequestAt");
      timeout = setTimeout(
        () => controller.abort(new Error("回复超时")),
        30000,
      );
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: escapedHistoryForApi,
          clientContext: { treehole: treeholeContext },
        }),
        signal: controller.signal,
      });
      if (!response.ok || !response.body)
        throw new Error(`HTTP ${response.status}`);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let terminalReceived = false;
      let crisis = false;
      let crisisLevel: ChatMessage["crisisLevel"];
      const consume = (frame: string) => {
        const data = frame
          .split("\n")
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).trimStart())
          .join("\n");
        if (!data || terminalReceived) return;
        if (data.trim() === "[DONE]") {
          terminalReceived = true;
          return;
        }
        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch {
          throw new Error("回复数据不完整");
        }
        if (parsed.error) throw new Error(String(parsed.error));
        if (typeof parsed.content !== "string") return;
        if (!accumulatedText && parsed.content)
          markVoicePerf("llmFirstTokenAt");
        accumulatedText = parsed.replaceOutput
          ? parsed.content.replace(/^\n+/, "")
          : accumulatedText + parsed.content;
        crisis ||= parsed.isCrisis === true;
        crisisLevel = parsed.crisisLevel ?? crisisLevel;
        update({ content: accumulatedText, replyReceived: !!accumulatedText, isCrisis: crisis, crisisLevel });
        // The existing API sends a readable fallback and [DONE] after a
        // generation timeout. Preserve that text, but never acknowledge the
        // attempt or run successful-reply memory effects for this terminal.
        if (parsed.isTimeout === true) throw new Error("回复超时");
      };
      for (;;) {
        const { done, value } = await reader.read();
        if (generation.current !== attempt) {
          await reader.cancel();
          return;
        }
        if (done) break;
        clearTimeout(timeout);
        timeout = setTimeout(
          () => controller.abort(new Error("回复中断")),
          30000,
        );
        buffer = (buffer + decoder.decode(value, { stream: true })).replace(
          /\r\n/g,
          "\n",
        );
        let end;
        while (!terminalReceived && (end = buffer.indexOf("\n\n")) >= 0) {
          consume(buffer.slice(0, end));
          buffer = buffer.slice(end + 2);
        }
        if (terminalReceived) {
          clearTimeout(timeout);
          // The existing API terminates replies with [DONE]. Do not wait for
          // transport EOF, or accept bytes arriving after that terminal frame.
          void reader.cancel().catch(() => undefined);
          break;
        }
      }
      if (!terminalReceived) {
        buffer += decoder.decode();
        if (buffer.trim()) consume(buffer);
      }
      if (!terminalReceived) throw new Error("回复中断，未收到结束标记");
      if (!accumulatedText.trim()) throw new Error("没有收到回复");
      update({ delivery: "complete" });
      if (pendingCtx) acknowledgePendingContext(pendingCtx);
      if (generation.current === attempt) {
        try {
          extractAndSaveMemory(
            [
              ...priorMessages,
              userMessage,
              { ...assistantMessage, content: accumulatedText },
            ].map((m) => ({ role: m.role, content: m.content })),
          );
        } catch {
          /* existing memory extraction must not prevent chat */
        }
      }
    } catch {
      if (generation.current !== attempt) return;
      controller.abort();
      update({
        content: accumulatedText,
        delivery: "failed",
      });
      // Never overwrite a draft typed while this request was pending.
      if (!voiceMeta && !regeneration && inputRevision.current === draftRevisionAtSend)
        setInput(messageText);
    } finally {
      clearTimeout(timeout);
      if (generation.current === attempt) {
        busyRef.current = false;
        setIsLoading(false);
        abortControllerRef.current = null;
        activeReplyId.current = null;
        activeDraftRef.current = null;
      }
    }
  };

  const regenerateReply = async (replyId: string) => {
    const reply = messagesRef.current.find((message) => message.id === replyId);
    if (!reply?.replyReceived || !reply.replyTo || !["failed", "stopped"].includes(reply.delivery || "")) return;
    const user = messagesRef.current.find((message) => message.id === reply.replyTo && message.role === "user");
    if (!user) return;
    await sendMessage(user.content, false, user.voiceMeta, user.id, { userId: user.id });
  };

  // 兼容旧调用：清空为一条欢迎语（v7.1 起由 newChat + 入口页取代，保留以防外部引用）
  const clearChat = () => newChat();

  return {
    messages,
    storedMessages: persistable(messages),
    isLoading,
    input,
    setInput: editInput,
    sendMessage,
    regenerateReply,
    addPendingVoiceMessage,
    resolveVoiceMessage,
    failVoiceTranscript,
    clearChat,
    stopReply,
    hydrated,
    storageError,
    storageReady: hydrated && readyPersistRef.current,
    retryStorage,
    started,
    hasHistory,
    startXiaoku,
    newChat,
  };
}
