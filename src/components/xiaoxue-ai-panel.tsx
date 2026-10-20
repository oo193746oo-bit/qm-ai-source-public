"use client";

/**
 * 小雪 AI 对话面板（v6.4.0 新增）
 * - 流式调用 /api/xiaoxue
 * - 独立维护消息，不影响原结构化流程 draft
 * - 危机关键词前端兜底拦截
 * PENDING_ASSET: 小雪正式人物图（真实人物资产未到位），禁 AI 生成人物，留位至素材到位后替换。
 */

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { XIAOXUE_BUILD_ID } from "@/lib/qm-version";
import { CRISIS_KEYWORDS } from "@/lib/crisis-detection";
import {
  saveXiaoxueSuggestion,
  extractSuggestionFromMessages,
} from "@/lib/xiaoxue-bridge";
import {
  createInitialState,
  type XiaoxueSessionState,
} from "@/lib/xiaoxue-state";

interface AiMsg {
  role: "user" | "assistant";
  content: string;
  isCrisis?: boolean;
  ts: number;
}

function detectCrisisLocal(text: string): boolean {
  const lower = text.toLowerCase();
  if (CRISIS_KEYWORDS.direct.some((w) => lower.includes(w.toLowerCase()))) return true;
  const indirectHits = CRISIS_KEYWORDS.indirect.filter((w) => lower.includes(w.toLowerCase()));
  return indirectHits.length >= 2;
}

const CRISIS_CARD_TEXT = `小雪听到你说这些，非常担心你的安全。

如果你正在经历危机，请立刻联系：
📞 24 小时心理援助热线：15001930070（半夜也有人接）
📞 13601658763（备用，24小时）
📞 12356（24小时）

如果你身边有人，请告诉他们你现在的感受，不要一个人待着。`;

function readHandoff() {
  try {
    const raw = localStorage.getItem("xiaoku_handoff_payload");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const QUICK_PROMPTS = [
  "我想先了解一下费用和流程",
  "我想找一位合适的心理师",
  "我已经有想选的心理师",
  "还不确定，先聊聊",
];

const STORAGE_KEY_MESSAGES = "xiaoxue_ai_messages_v1";
const STORAGE_KEY_TS = "xiaoxue_ai_updated_at";
const STORAGE_KEY_STATE = "qm_xiaoxue_state_v1";

function loadMessages(): AiMsg[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MESSAGES);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed as AiMsg[];
  } catch {
    return null;
  }
}

function saveMessages(msgs: AiMsg[]) {
  try {
    localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(msgs));
    localStorage.setItem(STORAGE_KEY_TS, String(Date.now()));
  } catch {
    /* ignore */
  }
}

function loadXiaoxueState(): XiaoxueSessionState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STATE);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.state) {
      return {
        state: parsed.state,
        collectedFields: parsed.collectedFields || {},
        knownIntents: parsed.knownIntents || [],
        xiaokuOffered: !!parsed.xiaokuOffered,
        xiaokuDeclined: !!parsed.xiaokuDeclined,
        humanDeclined: !!parsed.humanDeclined,
        lastGoal: parsed.lastGoal,
        turnCount: typeof parsed.turnCount === "number" ? parsed.turnCount : 0,
      };
    }
  } catch {
    /* ignore */
  }
  return createInitialState();
}

function saveXiaoxueState(state: XiaoxueSessionState) {
  try {
    localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function XiaoxueAiPanel() {
  const [messages, setMessages] = useState<AiMsg[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [sessionState, setSessionState] = useState<XiaoxueSessionState>(createInitialState);
  const scrollRef = useRef<HTMLDivElement>(null);
  const initRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 50);
  }, []);

  // 开场白 + 历史恢复
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const handoff = readHandoff();
    const saved = loadMessages();
    if (saved && saved.length > 0) {
      setMessages(saved);
    } else {
      const opening = handoff
        ? "您好，我是小雪。小酷已经帮您整理了预约方向，我就从还缺的部分继续。今天想先了解哪一部分？"
        : "您好，我是小雪，QM 的 AI 预约前置顾问。我可以陪您了解费用、流程、服务方向，帮您把预约前的准备工作整理好。我不是真人心理师，不能推荐匹配心理师、查实时档期或办理预约付费，但可以把您的信息整理好交给人工跟进。\n\n如需真人客服，可添加微信：queermental2（仅处理预约与行政事务）。若您正处于危机中，请直接拨打页面上的心理援助热线。\n\n今天想先聊点什么？";
      setMessages([{ role: "assistant", content: opening, ts: Date.now() }]);
    }
    setSessionState(loadXiaoxueState());
    setHydrated(true);
  }, []);

  // 消息持久化
  useEffect(() => {
    if (hydrated && messages.length > 0) {
      saveMessages(messages);
    }
  }, [messages, hydrated]);

  // v13.1: 状态持久化
  useEffect(() => {
    if (hydrated) {
      saveXiaoxueState(sessionState);
    }
  }, [sessionState, hydrated]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  function startNewChat() {
    const handoff = readHandoff();
    const opening = handoff
      ? "您好，我是小雪。小酷已经帮您整理了预约方向，我就从还缺的部分继续。今天想先了解哪一部分？"
      : "您好，我是小雪，QM 的 AI 预约前置顾问。我可以陪您了解费用、流程、心理师方向，帮您把预约前的准备工作整理好。我不是真人心理师，不能查实时档期或直接锁定时间，但可以帮您把信息整理好交给人工跟进。\n\n今天想先聊点什么？";
    setMessages([{ role: "assistant", content: opening, ts: Date.now() }]);
    setInput("");
    const freshState = createInitialState();
    setSessionState(freshState);
    try {
      localStorage.removeItem(STORAGE_KEY_MESSAGES);
      localStorage.removeItem(STORAGE_KEY_TS);
      localStorage.removeItem(STORAGE_KEY_STATE);
    } catch {
      /* ignore */
    }
  }

  /**
   * 把当前 AI 对话中已经提到的信息桥接到结构化填写
   * 用户在结构化表单里可以看到"从小雪对话带来"的预填字段
   */
  function bridgeToStructured() {
    try {
      const plain = messages.map((m) => ({ role: m.role, content: m.content }));
      const fields = extractSuggestionFromMessages(plain);
      const hasAny = Object.values(fields).some(
        (v) => Array.isArray(v) ? v.length > 0 : Boolean(v),
      );
      if (hasAny) {
        saveXiaoxueSuggestion({
          schemaVersion: 1,
          updatedAt: Date.now(),
          fields,
          source: "xiaoxue_ai",
        });
      }
    } catch {
      /* ignore */
    }
    // 触发 booking 页面切换到 structured 模式
    try {
      localStorage.setItem("xiaoxue_mode_switch", "structured");
      window.location.reload();
    } catch {
      /* ignore */
    }
  }

  async function send(text: string) {
    const content = text.trim();
    if (!content || isStreaming) return;

    const userMsg: AiMsg = { role: "user", content, ts: Date.now() };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");

    // 危机前端兜底
    if (detectCrisisLocal(content)) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: CRISIS_CARD_TEXT, isCrisis: true, ts: Date.now() },
      ]);
      return;
    }

    setIsStreaming(true);
    const placeholder: AiMsg = { role: "assistant", content: "", ts: Date.now() };
    setMessages((m) => [...m, placeholder]);

    try {
      const handoff = readHandoff();
      const res = await fetch("/api/xiaoxue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
          handoffPayload: handoff,
          shareAllowed: true,
          clientContext: { xiaoxueState: sessionState },
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`);
      }

      // 口令纯文本响应
      const contentType = res.headers.get("Content-Type") || "";
      if (contentType.includes("text/plain")) {
        const text = await res.text();
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: text, ts: Date.now() };
          return copy;
        });
        setIsStreaming(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") continue;
          try {
            const data = JSON.parse(payload);
            // v13.1: 接收状态更新
            if (data.type === "state_update" && data.state) {
              setSessionState(data.state as XiaoxueSessionState);
            }
            if (data.content) {
              // v11.5.1: verifier block 时后端发送 replaceOutput:true，
              // 用 fallback 内容替换已流式输出的违规内容，trim 前导换行。
              if (data.replaceOutput) {
                full = data.content.replace(/^\n+/, "");
              } else {
                full += data.content;
              }
              setMessages((m) => {
                const copy = [...m];
                copy[copy.length - 1] = {
                  role: "assistant",
                  content: full,
                  isCrisis: !!data.isCrisis,
                  ts: Date.now(),
                };
                return copy;
              });
            }
          } catch {
            /* ignore */
          }
        }
      }
    } catch (err) {
      console.error("[XiaoxueAI] stream error", err);
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = {
          role: "assistant",
          content:
            "抱歉，小雪这边刚刚连接不太稳定。您可以稍后再试，或切换到下方的「结构化填写」继续。",
          ts: Date.now(),
        };
        return copy;
      });
    } finally {
      setIsStreaming(false);
    }
  }

  if (!hydrated) {
    return (
      <div className="flex flex-col h-[calc(100dvh-140px)] md:h-[calc(100dvh-160px)] items-center justify-center">
        <div className="text-sm text-[var(--qm-ink-400)]">小雪正在准备…</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-140px)] md:h-[calc(100dvh-160px)] qm-glass-panel rounded-3xl p-4 md:p-5">
      {/* 模式说明 */}
      {/* E1 xiaoxue portrait intro (batch E) */}
      <div className="mb-3 flex items-center gap-3 rounded-2xl border border-[var(--qm-line-100)] bg-gradient-to-r from-[#FDF4E8] via-[#FDEBE3] to-[#F6E3EC] px-3 py-2.5">
        <img
          src="/visual/char/xiaoxue_portrait_4x5.png"
          alt="小雪立绘"
          loading="lazy"
          className="h-14 w-11 flex-none rounded-lg object-cover object-top shadow-[var(--qm-shadow-soft)]"
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--qm-ink-950)]">
            小雪 <span className="text-xs font-normal text-[var(--qm-ink-500)]">Xiaoxue · AI 预约前置顾问</span>
          </p>
          <p className="mt-0.5 text-xs leading-snug text-[var(--qm-ink-600)]">陪你把预约前的费用、流程与方向整理好，信息交给真人跟进</p>
        </div>
      </div>
      <div className="px-4 py-3 text-xs text-[var(--qm-ink-500)] bg-[var(--qm-surface-25)] rounded-xl mb-3 border border-[var(--qm-line-100)] flex items-center justify-between gap-2 flex-wrap">
        <span>💬 您正在和小雪 AI 自由对话。聊完可以把信息带到结构化填写继续。</span>
        <div className="flex items-center gap-2 shrink-0">
          {messages.length > 1 && (
            <button
              type="button"
              onClick={bridgeToStructured}
              className="px-2.5 py-1 rounded-full border border-[#6B4C9A]/40 text-[#6B4C9A] hover:bg-[#6B4C9A]/5 transition-colors font-medium"
            >
              带到结构化填写 →
            </button>
          )}
          {messages.length > 1 && (
            <button
              type="button"
              onClick={startNewChat}
              className="px-2.5 py-1 rounded-full border border-[var(--qm-line-200)] text-[var(--qm-ink-500)] hover:text-[#6B4C9A] hover:border-[#6B4C9A]/40 transition-colors"
            >
              新对话
            </button>
          )}
        </div>
      </div>

      {/* 消息区 */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-3 pr-1"
      >
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] md:max-w-[75%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                m.role === "user"
                  ? "text-white"
                  : m.isCrisis
                    ? "bg-red-50 border border-red-200 text-[var(--qm-ink-800)]"
                    : "bg-white text-[var(--qm-ink-800)] border border-[var(--qm-line-100)]"
              }`}
              style={
                m.role === "user"
                  ? { background: "#6B4C9A" }
                  : undefined
              }
            >
              {m.content || (isStreaming && idx === messages.length - 1 ? "…" : "")}
            </div>
          </div>
        ))}
      </div>

      {/* 快捷短语 */}
      {messages.length <= 2 && !isStreaming && (
        <div className="flex flex-wrap gap-2 py-3">
          {QUICK_PROMPTS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => send(p)}
              className="text-xs px-3 py-2 rounded-full border border-[var(--qm-line-200)] bg-white hover:bg-[var(--qm-purple-50)] text-[var(--qm-ink-700)] transition-colors min-h-[36px]"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* 输入区 */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2 pt-3 border-t border-[var(--qm-line-100)]"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isStreaming ? "小雪正在回复…" : "和小雪说点什么…"}
          disabled={isStreaming}
          className="flex-1 min-h-[44px] rounded-full border border-[var(--qm-line-200)] px-4 text-sm outline-none focus:border-[#6B4C9A] disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={isStreaming || !input.trim()}
          className="min-h-[44px] px-5 rounded-full text-white text-sm font-medium transition-colors disabled:opacity-50"
          style={{ background: "#6B4C9A" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#62428B")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#6B4C9A")}
        >
          发送
        </button>
      </form>

      {/* 转人工客服终点 */}
      <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-[var(--qm-line-200)] bg-white px-3 py-2.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[#07C160]/10 px-2 py-0.5 font-medium text-[#07C160]">人工客服</span>
          <span className="text-[var(--qm-ink-600)]">加微信 <b></b> 联系真人跟进（预约/行政事务）</span>
        </div>
        <span className="shrink-0 text-[var(--qm-ink-400)]">危机请拨热线</span>
      </div>

      {/* 底部水印 + 切换 */}
      <div className="pt-3 flex items-center justify-between text-[10px] text-[var(--qm-ink-400)]">
        <span>小雪 · {XIAOXUE_BUILD_ID}</span>
        <Link href="/" className="hover:text-[#6B4C9A]">
          返回首页
        </Link>
      </div>
    </div>
  );
}
