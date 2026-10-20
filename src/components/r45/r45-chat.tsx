"use client";

import { useEffect, useRef, useState } from "react";
import { R45_CONVERSATION_ENDPOINT } from "@/lib/r45-config";

interface R45Message {
  role: "user" | "assistant";
  content: string;
  isCrisis?: boolean;
}

// 主站会话标识：稳定 user_id，本地生成持久化
function getR45UserId(): string {
  const KEY = "qm_r45_user_id";
  try {
    const existing = localStorage.getItem(KEY);
    if (existing) return existing;
    const id = `qm_r45_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(KEY, id);
    return id;
  } catch {
    return `qm_r45_${Date.now().toString(36)}`;
  }
}

export default function R45Chat() {
  const [messages, setMessages] = useState<R45Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const userIdRef = useRef<string>("");

  useEffect(() => {
    userIdRef.current = getR45UserId();
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;
    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");
    setLoading(true);
    const assistantId = `r45a_${Date.now()}`;
    setMessages((m) => [...m, { role: "assistant", content: "" }]);

    try {
      const response = await fetch(R45_CONVERSATION_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, userId: userIdRef.current }),
      });
      if (!response.ok) {
        let errMsg = "服务暂时不可用，请稍后再试。";
        try {
          const j = await response.json();
          if (j?.error) errMsg = j.error;
        } catch {
          /* ignore */
        }
        throw new Error(errMsg);
      }
      const reader = response.body?.getReader();
      if (!reader) throw new Error("网络异常，请稍后再试。");
      const decoder = new TextDecoder();
      let buffer = "";
      let isCrisis = false;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.isCrisis) isCrisis = true;
            if (parsed.content) {
              setMessages((prev) =>
                prev.map((mm) =>
                  mm.role === "assistant" && mm.content === ""
                    ? { role: "assistant", content: parsed.content, isCrisis }
                    : mm,
                ),
              );
            }
          } catch {
            /* ignore */
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "网络异常，请稍后再试。";
      setMessages((prev) =>
        prev.map((mm) =>
          mm.role === "assistant" && mm.content === "" ? { role: "assistant", content: msg } : mm,
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[560px] flex-col overflow-hidden rounded-[24px] border border-[var(--qm-line-100)] bg-white">
      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5">
        {messages.length === 0 && (
          <p className="pt-10 text-center text-sm leading-relaxed text-[var(--qm-ink-500)]">
            欢迎使用意定监护与预先照护规划对话。
            <br />
            你可以问：「什么是意定监护？」「监护人和被监护人各有哪些权利义务？」等。
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] whitespace-pre-wrap rounded-[18px] px-4 py-3 text-sm leading-relaxed ${
                m.role === "user"
                  ? "rounded-br-md bg-gradient-to-r from-[var(--qm-amber-500)] to-[var(--qm-rose-500)] text-white"
                  : m.isCrisis
                    ? "rounded-bl-md border border-[var(--qm-rose-100)] bg-[var(--qm-rose-50)] text-[var(--qm-ink-800)]"
                    : "rounded-bl-md bg-[var(--qm-ink-50)] text-[var(--qm-ink-800)]"
              }`}
            >
              {m.content || "…"}
            </div>
          </div>
        ))}
        {loading && <div ref={endRef} />}
      </div>
      <div className="flex items-center gap-2 border-t border-[var(--qm-line-100)] bg-[var(--qm-ink-50)/50] px-4 py-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="输入你想了解的意定监护问题…"
          className="flex-1 rounded-full border border-[var(--qm-line-100)] bg-white px-4 py-2 text-sm text-[var(--qm-ink-800)] outline-none placeholder:text-[var(--qm-ink-400)] disabled:opacity-60 focus:border-[var(--qm-amber-400)]"
          disabled={loading}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="shrink-0 rounded-full bg-gradient-to-r from-[var(--qm-amber-500)] to-[var(--qm-rose-500)] px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "思考中…" : "发送"}
        </button>
      </div>
    </div>
  );
}