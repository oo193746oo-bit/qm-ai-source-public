"use client";

import { useChat, ChatMessage } from "@/hooks/use-chat";
import { useOnboarding, SURVEY_QUESTIONS, SurveyQuestion } from "@/hooks/use-onboarding";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./sidebar";
import { HomeHub } from "./home-hub";
import { ChatHeader } from "./chat-header";
import { XiaokuEntryPage } from "./xiaoku-entry-page";
import { XIAOKU_BUILD_ID, QM_BUILD_LABEL, XIAOKU_PROMPT_SHA } from "@/lib/qm-version";
import { XiaokuToolCard } from "./tools/xiaoku-tool-card";
import { isToolRecommendationDisabled } from "@/lib/tools/storage";
import { recommendTools, shouldRecommendInChat } from "@/lib/tools/recommend";
import type { Tool, ToolRecommendation } from "@/lib/tools/types";
import { getToolById } from "@/lib/tools/tool-registry";
import { VoiceInputDraft } from "./voice/voice-input-draft";
import { VoiceReplyPlayer } from "./voice/voice-reply-player";
import { VoiceMessageBubble } from "./voice/voice-message-bubble";
import { saveAudio, getAudio } from "@/lib/voice/audio-store";
import type { VoiceMeta, VoiceTranscriptionResponse } from "@/lib/voice/types";
import { VOICE_TRANSCRIBE_ENDPOINT } from "@/lib/voice/config";
import { convertRecordingToWav } from "@/lib/voice/wav";
import { resetVoicePerf } from "@/lib/voice/performance";

export function ChatInterface({ initialView = "auto", desktopContinuation = false }: { initialView?: "auto" | "chat"; desktopContinuation?: boolean } = {}) {
  const router = useRouter();
  const {
    messages,
    isLoading,
    input,
    setInput,
    sendMessage,
    addPendingVoiceMessage,
    resolveVoiceMessage,
    failVoiceTranscript,
    messagesEndRef,
    hydrated,
    started: xiaokuStarted,
    hasHistory,
    startXiaoku,
    newChat,
  } = useChat();
  const {
    profile,
    isLoaded,
    profileError,
    retryProfile,
    goToMemory,
    goToSurvey,
    goToReady,
    enableMemory,
    setNickname: saveNickname,
    answerQuestion,
    completeOnboarding,
    resetOnboarding,
  } = useOnboarding({ strictPersistence: desktopContinuation });

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [surveyIndex, setSurveyIndex] = useState(0);
  const [textValue, setTextValue] = useState("");
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const firstRenderRef = useRef(true);

  // ===== Home Hub 状态 =====
  const [showHomeHub, setShowHomeHub] = useState(false);
  const homeHubInitializedRef = useRef(false);

  // ===== 切换AI上下文授权弹窗状态 =====
  const [showBridgeConsent, setShowBridgeConsent] = useState(false);
  const bridgeTargetRef = useRef<"xiaoxue" | null>(null);

  // ===== 小雪预约上线状态 =====
  const [showBookingComingSoon, setShowBookingComingSoon] = useState(false);

  // ===== 新对话确认弹窗 =====
  const [showNewChatConfirm, setShowNewChatConfirm] = useState(false);

  // ===== 语音音频 URL 缓存（messageId → object URL）=====
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({});
  const [voiceMode, setVoiceMode] = useState(false);
  const audioUrlsRef = useRef<Record<string, string>>({});
  useEffect(() => {
    try { setVoiceMode(localStorage.getItem("qm_voice_input_mode_v1") === "voice"); } catch {}
  }, []);
  const changeVoiceMode = (voice: boolean) => {
    setVoiceMode(voice);
    try { localStorage.setItem("qm_voice_input_mode_v1", voice ? "voice" : "text"); } catch {}
  };

  const handleNewChat = () => {
    newChat();
    setShowNewChatConfirm(false);
    // 清空后回到小酷入口页
    setShowHomeHub(false);
    // 清空音频 URL 缓存（IndexedDB 由 newChat 内部 clearAllAudio 清理）
    Object.values(audioUrlsRef.current).forEach((url) => URL.revokeObjectURL(url));
    audioUrlsRef.current = {};
    setAudioUrls({});
  };

  // ===== 语音音频：页面刷新后从 IndexedDB 异步恢复 =====
  useEffect(() => {
    if (!hydrated) return;

    // 找出所有有 voiceMeta 但还没有 audioUrl 的消息
    const missingIds = messages
      .filter(
        (m) =>
          m.role === "user" &&
          m.voiceMeta?.hasAudio &&
          !audioUrlsRef.current[m.id],
      )
      .map((m) => m.id);

    if (missingIds.length === 0) return;

    // 异步从 IndexedDB 加载
    missingIds.forEach(async (id) => {
      const blob = await getAudio(id);
      if (blob) {
        const url = URL.createObjectURL(blob);
        audioUrlsRef.current = { ...audioUrlsRef.current, [id]: url };
        setAudioUrls((prev) => ({ ...prev, [id]: url }));
      }
    });
  }, [messages, hydrated]);

  // 组件卸载时 revoke 所有 object URLs
  useEffect(() => {
    return () => {
      Object.values(audioUrlsRef.current).forEach((url) => URL.revokeObjectURL(url));
      audioUrlsRef.current = {};
    };
  }, []);

  // ===== 工具联动状态 =====
  // 工具推荐卡
  const [toolRecommendations, setToolRecommendations] = useState<ToolRecommendation[]>([]);
  const [showToolCard, setShowToolCard] = useState(false);
  const [toolCardEmpathy, setToolCardEmpathy] = useState("");
  // 连续短回复计数（用于FAST MODE检测）
  const shortReplyCountRef = useRef(0);

  // Onboarding 是否进行中
  const isOnboarding = isLoaded && !profile.onboardingCompleted;

  // 每次问卷题变化时，重置选项
  useEffect(() => {
    if (!isOnboarding) return;
    const q = SURVEY_QUESTIONS[surveyIndex];
    if (!q) return;

    let existing: string[] = [];
    switch (q.id) {
      case "nickname":
        setTextValue(profile.nickname || "");
        return;
      case "pronoun":
        existing = profile.pronoun ? [profile.pronoun] : [];
        break;
      case "concerns":
        existing = profile.concerns || [];
        break;
      case "gender":
        existing = profile.genderIdentity ? [profile.genderIdentity] : [];
        break;
      case "duration":
        existing = profile.duration ? [profile.duration] : [];
        break;
      case "preference":
        existing = profile.preference ? [profile.preference] : [];
        break;
      case "experience":
        existing = profile.priorExperience ? [profile.priorExperience] : [];
        break;
      case "speech":
        existing = profile.speechStyle ? [profile.speechStyle] : [];
        break;
    }
    setSelectedOptions(existing);
  }, [surveyIndex, isOnboarding, profile]);

  // Onboarding 完成后，进入 Home Hub
  // v7.1：若小酷已有未完成对话（hasHistory），则直接回到聊天，不展示首页
  useEffect(() => {
    if (!isLoaded) return;
    if (!hydrated) return;

    if (!profile.onboardingCompleted && profile.onboardingStep !== "ready") {
      return;
    }

    if (firstRenderRef.current) {
      firstRenderRef.current = false;
    }

    if (homeHubInitializedRef.current) return;

    // 有小酷历史 → 直接进入聊天（startXiaoku 会补首句但不覆盖历史）
    if (hasHistory) {
      homeHubInitializedRef.current = true;
      startXiaoku();
      return;
    }

    if (profile.onboardingStep === "ready" && !profile.onboardingCompleted) {
      homeHubInitializedRef.current = true;
      setShowHomeHub(true);
      completeOnboarding();
      try {
        localStorage.setItem("qm_seen_home_hub", "true");
      } catch (e) {
        // ignore
      }
      return;
    }

    if (profile.onboardingCompleted) {
      homeHubInitializedRef.current = true;
      if (initialView === "chat") {
        startXiaoku();
      } else {
        setShowHomeHub(true);
      }
      try {
        localStorage.setItem("qm_seen_home_hub", "true");
      } catch (e) {
        // ignore
      }
    }
  }, [
    profile.onboardingStep,
    profile.onboardingCompleted,
    isLoaded,
    hydrated,
    hasHistory,
    startXiaoku,
    initialView,
  ]);

  // v7.1：所有入口（侧栏自由对话 / 首页CTA / 小雪切换）统一走这里。
  // 不再调 LLM 生成开场白，改为本地固定首句 seed（在 useChat.startXiaoku 内幂等插入）。
  const handleStartXiaoku = () => {
    setShowHomeHub(false);
    startXiaoku();
  };

  const handleResetOnboarding = () => {
    setShowHomeHub(false);
    resetOnboarding();
  };

  const handleStartXiaoxue = () => {
    try {
      router.push("/therapists");
    } catch {
      setShowBookingComingSoon(true);
    }
  };

  const transferContextToXiaoxue = () => {
    try {
      const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
      if (lastUserMsg) {
        const bridgeCapsule = {
          source: "xiaoku",
          target: "xiaoxue",
          last_user_message: lastUserMsg.content,
          transferred_at: Date.now(),
        };
        sessionStorage.setItem("qm_bridge_xiaoku_to_xiaoxue", JSON.stringify(bridgeCapsule));
      }
    } catch (e) {
      // ignore
    }
  };

  const handleBridgeConsentYes = () => {
    try {
      localStorage.setItem("qm_bridge_consent_xiaoku_to_xiaoxue", "true");
    } catch (e) {
      // ignore
    }
    transferContextToXiaoxue();
    setShowBridgeConsent(false);
    bridgeTargetRef.current = null;
    router.push("/therapists");
  };

  const handleBridgeConsentNo = () => {
    try {
      localStorage.setItem("qm_bridge_consent_xiaoku_to_xiaoxue", "false");
      sessionStorage.removeItem("qm_bridge_xiaoku_to_xiaoxue");
    } catch (e) {
      // ignore
    }
    setShowBridgeConsent(false);
    bridgeTargetRef.current = null;
    router.push("/therapists");
  };

  const handleBackHome = () => {
    setShowHomeHub(true);
  };

  const getLastXiaokuAt = (): number | undefined => {
    try {
      const val = localStorage.getItem("qm_last_xiaoku_at");
      return val ? parseInt(val, 10) : undefined;
    } catch {
      return undefined;
    }
  };

  const quickPrompts = [
    "最近心情不太好",
    "我有点焦虑",
    "感觉压力很大",
    "想找人聊聊",
  ];

  const handleQuickPrompt = (prompt: string) => {
    if (isLoading) return;
    setInput(prompt);
  };

  // ===== 工具推荐检测 =====
  const maybeRecommendTool = (userMessage: string) => {
    // 用户关闭了推荐就不推荐
    if (isToolRecommendationDisabled()) return;

    // 简单的意图判断 + 关键词触发
    const recs = shouldRecommendInChat(userMessage, {
      need_text: userMessage,
      intent_type: "B",
    });

    if (recs && recs.length > 0) {
      setToolRecommendations(recs);
      setToolCardEmpathy("如果你愿意，我们可以先不继续分析。");
      setShowToolCard(true);
    }
  };

  // 检测用户输入是否触发 FAST MODE
  const checkFastMode = (userMessage: string) => {
    const triggers = ["太长", "快一点", "还有多久", "不想做了", "烦", "跳过", "太啰嗦", "太慢"];
    const lower = userMessage.toLowerCase();
    const isTriggered = triggers.some((t) => lower.includes(t));

    if (isTriggered) {
      // POC阶段由LLM处理
      shortReplyCountRef.current += 1;
    } else {
      shortReplyCountRef.current = 0;
    }
  };

  // ===== 微信式语音消息：先出气泡，后台 ASR 完成后再走现有 /api/chat =====
  const handleSendVoice = async (data: {
    audioBlob: Blob;
    duration: number;
    mimeType: string;
    initialText: string;
  }): Promise<string> => {
    const { audioBlob, duration, mimeType, initialText } = data;
    const messageId = `user-${Date.now()}`;
    const voiceMeta: VoiceMeta = {
      hasAudio: true,
      duration,
      mimeType,
      transcriptStatus: "pending",
    };

    void saveAudio(messageId, audioBlob);
    const url = URL.createObjectURL(audioBlob);
    audioUrlsRef.current = { ...audioUrlsRef.current, [messageId]: url };
    setAudioUrls((prev) => ({ ...prev, [messageId]: url }));

    addPendingVoiceMessage({
      id: messageId,
      role: "user",
      content: initialText.trim() || "转写中…",
      timestamp: Date.now(),
      voiceMeta,
    });
    return messageId;
  };

  const handleTranscriptResult = async (data: {
    messageId: string;
    text?: string;
    error?: string;
    duration?: number;
    mimeType?: string;
  }) => {
    if (data.error) {
      failVoiceTranscript(data.messageId, data.error);
      return;
    }
    if (!data.text?.trim()) {
      failVoiceTranscript(data.messageId, "转写失败，点击重试");
      return;
    }
    const current = messages.find((m) => m.id === data.messageId);
    const meta: VoiceMeta = current?.voiceMeta || {
      hasAudio: true,
      duration: data.duration || 0,
      mimeType: data.mimeType || "",
      transcriptStatus: "pending",
    };
    // 这里调用现有 sendMessage -> /api/chat。
    // 因而现有危机检测、角色治理、BM25、认知链路全部保留。
    await resolveVoiceMessage(data.messageId, data.text.trim(), meta);
  };

  const retryVoiceTranscript = async (messageId: string) => {
    const message = messages.find((m) => m.id === messageId);
    if (!message?.voiceMeta) return;
    const blob = await getAudio(messageId);
    if (!blob) {
      failVoiceTranscript(messageId, "原录音已不可用，请重新录制");
      return;
    }
    failVoiceTranscript(messageId, "正在重试转写…");
    try {
      const wav = await convertRecordingToWav(blob, 16000);
      const form = new FormData();
      form.append("file", wav, "voice-input.wav");
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 30000);
      let response: Response;
      try {
        response = await fetch(VOICE_TRANSCRIBE_ENDPOINT, { method: "POST", body: form, signal: controller.signal });
      } finally {
        window.clearTimeout(timeout);
      }
      const result = (await response.json()) as VoiceTranscriptionResponse;
      if (!response.ok || !result.ok || !result.text?.trim()) throw new Error("ASR");
      const existingText = message.content === "转写中…" ? "" : message.content;
      const combined = [existingText.trim(), result.text.trim()].filter(Boolean).join("\n");
      await resolveVoiceMessage(messageId, combined, message.voiceMeta);
    } catch {
      failVoiceTranscript(messageId, "转写失败，点击重试");
    }
  };

  // 发送消息时检测
  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;
    resetVoicePerf();
    const msg = input.trim();
    // v6.4.0 诊断口令：本地拦截，不送 LLM
    if (msg === "QM_XIAOKU_BUILD_CHECK") {
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content: "QM_XIAOKU_BUILD_CHECK" }],
          }),
        });
        const serverBuild = res.headers.get("X-QM-Build") || "";
        const serverSha = res.headers.get("X-QM-Prompt-Sha") || "";
        const info = [
          `小酷构建版本：${XIAOKU_BUILD_ID}`,
          `前端打包：${QM_BUILD_LABEL}`,
          `服务端构建：${serverBuild || "未返回"}`,
          `SP SHA（前端记录）：${XIAOKU_PROMPT_SHA.slice(0, 12)}`,
          `SP SHA（服务端返回）：${serverSha ? serverSha.slice(0, 12) : "未返回"}`,
          `匹配状态：${serverBuild === XIAOKU_BUILD_ID ? "✅ 一致" : "⚠️ 不一致，请检查部署"}`,
        ].join("\n");
        // 把诊断信息作为一条助手消息显示
        sendMessage(`【构建诊断】\n${info}`, true);
      } catch (e) {
        sendMessage(
          `【构建诊断】请求失败：${e instanceof Error ? e.message : String(e)}\n前端记录：${XIAOKU_BUILD_ID} / ${XIAOKU_PROMPT_SHA.slice(0, 12)}`,
          true
        );
      }
      return;
    }

    checkFastMode(msg);
    // 发送后由LLM决定是否推荐，不自动插卡
    sendMessage();
  };

  // 开始工具练习
  const handleStartTool = (tool: Tool) => {
    setShowToolCard(false);
    // 跳转到工具页，带source=xiaoku参数
    if (typeof window !== "undefined") {
      window.location.href = `/tools?source=xiaoku&tool_id=${tool.tool_id}`;
    }
  };

  // 继续聊天（不做工具）
  const handleContinueChat = () => {
    setShowToolCard(false);
  };

  // === 问卷导航 ===
  const currentQ = SURVEY_QUESTIONS[surveyIndex];
  const isLastQuestion = surveyIndex === SURVEY_QUESTIONS.length - 1;

  const handleOptionToggle = (value: string) => {
    if (!currentQ) return;

    if (currentQ.type === "single") {
      answerQuestion(currentQ.id, value);
      setTimeout(() => goNextQuestion(), 200);
    } else if (currentQ.type === "multi") {
      const max = currentQ.maxSelect || 3;
      setSelectedOptions((prev) => {
        if (prev.includes(value)) {
          return prev.filter((v) => v !== value);
        }
        if (prev.length >= max) return prev;
        return [...prev, value];
      });
    }
  };

  const goNextQuestion = () => {
    if (isLastQuestion) {
      goToReady();
    } else {
      setSurveyIndex((i) => i + 1);
    }
  };

  const goPrevQuestion = () => {
    setSurveyIndex((i) => Math.max(0, i - 1));
  };

  const handleMultiConfirm = () => {
    if (!currentQ || currentQ.type !== "multi") return;
    answerQuestion(currentQ.id, selectedOptions);
    goNextQuestion();
  };

  const handleTextSubmit = () => {
    if (!currentQ) return;
    if (currentQ.id === "nickname") {
      if (saveNickname(textValue) === false) return;
      // 3 步 Onboarding：称呼是最后一步，完成后进入对话
      goToReady();
      return;
    }
    goNextQuestion();
  };

  const skipQuestion = () => {
    if (desktopContinuation && currentQ?.id === "nickname") goToReady();
    else goNextQuestion();
  };

  // ===== 渲染 =====

  // Onboarding 界面（完全保留原逻辑，零修改）
  if (isOnboarding) {
    return (
      <div className="min-h-dvh" style={{ background: "var(--qm-gradient-soft)" }}>
        <div className="flex-1 flex flex-col relative">
          {desktopContinuation && profileError && <div role="alert" className="mx-auto w-full max-w-lg rounded-2xl border bg-white p-4">{profileError}<button type="button" onClick={retryProfile}>重试读取用户状态</button></div>}
          <OnboardingScreen
            profile={profile}
            currentQ={currentQ}
            surveyIndex={surveyIndex}
            totalQuestions={desktopContinuation ? 1 : SURVEY_QUESTIONS.length}
            textValue={textValue}
            setTextValue={setTextValue}
            selectedOptions={selectedOptions}
            onOptionToggle={handleOptionToggle}
            onTextSubmit={handleTextSubmit}
            onMultiConfirm={handleMultiConfirm}
            onSkip={skipQuestion}
            onPrev={goPrevQuestion}
            onGoMemory={goToMemory}
            onEnableMemory={() => {
              if (enableMemory() === false) return;
              goToSurvey();
            }}
          />
        </div>
      </div>
    );
  }

  // Home Hub 界面
  if (showHomeHub && initialView !== "chat") {
    return (
      <HomeHub
        onStartXiaoku={handleStartXiaoku}
        onStartXiaoxue={handleStartXiaoxue}
        nickname={profile.nickname}
        lastXiaokuAt={getLastXiaokuAt()}
        onResetOnboarding={handleResetOnboarding}
      />
    );
  }

  // v7.1：hydration 完成前显示轻量骨架，禁止渲染空白聊天页再闪回
  if (!hydrated) {
    return (
      <div
        className="min-h-dvh flex items-center justify-center"
        style={{ background: "var(--qm-gradient-soft)" }}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl qm-xiaoku-avatar flex items-center justify-center animate-pulse" />
          <p className="text-xs text-[var(--qm-ink-400)]">加载中…</p>
        </div>
      </div>
    );
  }

  // v7.1：小酷入口页（ENTRY 状态：未开始 或 无任何历史）
  if (!xiaokuStarted) {
    return (
      <XiaokuEntryPage
        hasHistory={hasHistory}
        onStart={handleStartXiaoku}
        onFindXiaoxue={handleStartXiaoxue}
        onLogoClick={handleBackHome}
        sidebarOpen={sidebarOpen}
        onCloseSidebar={() => setSidebarOpen(false)}
        sidebarCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
      />
    );
  }

  // 聊天界面（小酷对话）
  return (
    <div className="min-h-dvh flex qm-bg-chat bg-cover bg-center">
      {/* 侧边栏：Mobile抽屉 / Desktop常驻（纯CSS） */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        onLogoClick={handleBackHome}
      />

      {/* 主区域：Desktop端左侧预留侧栏空间（纯CSS） */}
      <div
        className={`
          flex-1 flex flex-col relative
          min-h-dvh
          ${sidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-60"}
        `}
      >
        {/* 顶部栏 */}
        <ChatHeader
          currentAI="xiaoku"
          onBackHome={handleBackHome}
          onNewChat={() => setShowNewChatConfirm(true)}
        />

        {/* 对话区域 */}
        <>
          <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-6">
            <div className="max-w-2xl md:max-w-3xl lg:max-w-[900px] mx-auto space-y-6">
              {messages.length === 0 && !isLoading && (
                <div className="text-center py-12 md:py-16">
                  <div className="w-20 h-24 md:w-24 md:h-28 mx-auto mb-4 overflow-hidden">
                    <img src="/visual/char/xiaoku_portrait_4x5.png" alt="小酷" className="w-full h-full object-contain" loading="lazy" />
                  </div>
                  <h2 className="text-lg md:text-xl font-medium text-[var(--qm-ink-800)] mb-2">想说什么都可以</h2>
                  <p className="text-sm text-[var(--qm-ink-500)] max-w-sm mx-auto leading-relaxed">
                    小酷会认真倾听，不评判、不催促。从最近发生的一件事说起就好。
                  </p>
                </div>
              )}

              {messages.filter((m) => !m.hidden).map((msg, idx, visible) => (
                <MessageBubble
                  key={idx}
                  message={msg}
                  audioUrl={audioUrls[msg.id] ?? null}
                  onRetryVoiceTranscript={retryVoiceTranscript}
                  eagerVoicePrefetch={isLoading && msg.role === "assistant" && idx === visible.length - 1}
                />
              ))}

              {isLoading && <TypingIndicator />}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* 快捷回复 */}
          {messages.length === 0 && !isLoading && (
            <div className="px-4 md:px-6 pb-2">
              <div className="max-w-2xl md:max-w-3xl lg:max-w-[900px] mx-auto flex flex-wrap gap-2 justify-center">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleQuickPrompt(prompt)}
                    className="px-4 py-2 text-sm text-[var(--qm-ink-600)] bg-white/80 border border-[var(--qm-line-100)] rounded-full
                               hover:bg-[var(--qm-surface-25)] hover:border-[var(--qm-line-200)]
                               transition-all duration-200
                               min-h-[40px]"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 输入区 */}
          <div
            className="chat-composer px-4 md:px-6 pt-2"
            style={{
              background: "linear-gradient(to top, var(--qm-surface-25), transparent)",
              paddingBottom: `calc(24px + env(safe-area-inset-bottom, 0px))`,
            }}
          >
            {/*
              Enter 行为统一规则（v2.1，零修改）
              - Enter = 换行
              - Shift+Enter = 换行
              - 只有点击【发送】按钮才发送
            */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
              }}
              className="max-w-2xl md:max-w-3xl lg:max-w-[900px] mx-auto"
            >
              <div className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={() => changeVoiceMode(!voiceMode)}
                  className="min-h-[44px] min-w-[44px] rounded-full border border-[var(--qm-line-200)] bg-white text-[var(--qm-ink-600)]"
                  aria-label={voiceMode ? "切换到键盘输入" : "切换到语音输入"}
                >
                  {voiceMode ? "⌨" : "🎤"}
                </button>
                <div className="relative flex-1">
                  {voiceMode ? (
                    <VoiceInputDraft
                      disabled={isLoading}
                      initialText={input}
                      onSendVoice={handleSendVoice}
                      onTranscriptResult={handleTranscriptResult}
                    />
                  ) : (
                    <>
                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="说点什么...（Enter 换行）"
                        rows={2}
                        className="w-full px-5 py-4 pr-16 bg-white/90 border border-[var(--qm-line-200)] rounded-3xl resize-none focus:outline-none focus:ring-2 focus:ring-[var(--qm-purple-400)]/40 focus:border-[var(--qm-purple-400)] transition-all text-[var(--qm-ink-800)] placeholder-[var(--qm-ink-500)] text-sm leading-relaxed text-left"
                        style={{ minHeight: "56px", maxHeight: "200px" }}
                      />
                      <button
                        type="button"
                        onClick={() => { if (!isLoading && input.trim()) void handleSendMessage(); }}
                        disabled={isLoading || !input.trim()}
                        className="absolute right-2 bottom-2 w-11 h-11 md:w-12 md:h-12 rounded-full bg-[var(--qm-purple-600)] text-white flex items-center justify-center transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px] min-w-[44px]"
                        aria-label="发送"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
              <p className="enter-hint">
                Enter 换行 · 点击发送
              </p>
              <p className="text-xs text-[var(--qm-ink-500)] text-center mt-2 leading-relaxed">
                <a href="/disclaimer" className="underline hover:text-[var(--qm-purple-600)]">QM AI 不能替代专业心理咨询</a>。如果你正经历危机，请拨打 15001930070（备 13601658763）
              </p>
            </form>
          </div>
        </>
      </div>

      {/* 上下文授权弹窗 */}
      {false && showBridgeConsent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowBridgeConsent(false)}
          />
          <div className="relative bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-xl">
            <div className="text-center mb-5">
              <div className="w-12 h-12 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: "rgba(107, 76, 154, 0.1)" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--qm-purple-600)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 1l4 4-4 4" />
                  <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                  <path d="M7 23l-4-4 4-4" />
                  <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[var(--qm-ink-800)] mb-3">切换到小雪</h3>
              <p className="text-sm text-[var(--qm-ink-700)] leading-relaxed">
                你正在从小酷切换到小雪。为了不让你重复说明，我可以把你刚刚主动提到的相关摘要带过去吗？
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleBridgeConsentYes}
                className="w-full py-3.5 bg-[var(--qm-purple-600)] text-white text-sm font-medium rounded-xl hover:bg-[var(--qm-purple-700)] transition-colors min-h-[44px]"
              >
                可以，带过去
              </button>
              <button
                onClick={handleBridgeConsentNo}
                className="w-full py-3.5 bg-white text-[var(--qm-ink-700)] text-sm font-medium rounded-xl border border-[var(--qm-line-200)] hover:bg-[var(--qm-surface-25)] transition-colors min-h-[44px]"
              >
                不用，我重新说
              </button>
            </div>

            <p className="text-xs text-[var(--qm-ink-500)] text-center mt-5 leading-relaxed">
              只传递必要摘要，不复制完整对话历史。你可以随时在设置中关闭。
            </p>
          </div>
        </div>
      )}

      {/* 小雪预约即将上线提示 */}
      {false && showBookingComingSoon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowBookingComingSoon(false)}
          />
          <div className="relative bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-xl text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: "var(--qm-indigo-100)" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--qm-indigo-600)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[var(--qm-ink-800)] mb-2">小雪预约即将上线</h3>
            <p className="text-sm text-[var(--qm-ink-700)] leading-relaxed mb-5">
              小雪预约功能正在准备中，很快就会和你见面。你可以先体验小酷，或通过其他方式联系我们。
            </p>
            <button
              onClick={() => setShowBookingComingSoon(false)}
              className="w-full py-3.5 text-white text-sm font-medium rounded-xl transition-colors min-h-[44px]"
              style={{ background: "var(--qm-indigo-600)" }}
            >
              知道了
            </button>
          </div>
        </div>
      )}

      {/* 新对话确认弹窗（v7.1） */}
      {showNewChatConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowNewChatConfirm(false)}
          />
          <div className="relative bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-semibold text-[var(--qm-ink-800)] mb-2 text-center">开始新对话？</h3>
            <p className="text-sm text-[var(--qm-ink-700)] leading-relaxed mb-6 text-center">
              这会清空当前与小酷的聊天记录，并回到介绍页。POC 阶段记录只保存在你本机，清空后无法恢复。
            </p>
            <div className="space-y-3">
              <button
                onClick={handleNewChat}
                className="w-full py-3.5 text-white text-sm font-medium rounded-xl transition-colors min-h-[44px]"
                style={{ background: "#6B4C9A" }}
              >
                确认清空并重新开始
              </button>
              <button
                onClick={() => setShowNewChatConfirm(false)}
                className="w-full py-3.5 bg-white text-[var(--qm-ink-700)] text-sm font-medium rounded-xl border border-[var(--qm-line-200)] hover:bg-[var(--qm-surface-25)] transition-colors min-h-[44px]"
              >
                再想想
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// Onboarding 全屏界面（完全保留，零修改视觉微调）
// ==========================================
function OnboardingScreen({
  profile,
  currentQ,
  surveyIndex,
  totalQuestions,
  textValue,
  setTextValue,
  selectedOptions,
  onOptionToggle,
  onTextSubmit,
  onMultiConfirm,
  onSkip,
  onPrev,
  onGoMemory,
  onEnableMemory,
}: {
  profile: ReturnType<typeof useOnboarding>["profile"];
  currentQ: SurveyQuestion | undefined;
  surveyIndex: number;
  totalQuestions: number;
  textValue: string;
  setTextValue: (v: string) => void;
  selectedOptions: string[];
  onOptionToggle: (value: string) => void;
  onTextSubmit: () => void;
  onMultiConfirm: () => void;
  onSkip: () => void;
  onPrev: () => void;
  onGoMemory: () => void;
  onEnableMemory: () => void;
}) {
  const step = profile.onboardingStep;

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-8 overflow-y-auto">
      <div className="w-full max-w-lg">
        {/* 进度指示 */}
        <div className="mb-8">
          {step === "survey" && (
            <>
              <div className="flex justify-between text-xs text-[var(--qm-ink-500)] mb-2">
                <span>认识一下</span>
                <span>
                  {surveyIndex + 1} / {totalQuestions}
                </span>
              </div>
              <div className="h-1 bg-[var(--qm-line-200)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${((surveyIndex + 1) / totalQuestions) * 100}%`,
                    background: "var(--qm-gradient-warm)",
                  }}
                />
              </div>
            </>
          )}
        </div>

        {/* 欢迎页 */}
        {step === "welcome" && (
          <div className="text-center space-y-6 animate-fade-in">
            <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center" style={{ background: "rgba(107, 76, 154, 0.15)" }}>
              <span className="text-4xl">🤍</span>
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl font-medium text-[var(--qm-ink-800)] leading-snug">
                生活没有标准答案，
              </h2>
              <p className="text-[var(--qm-ink-600)] leading-relaxed">
                但你可以有一个人陪你一起找。
              </p>
            </div>

            <div className="bg-white/70 rounded-3xl p-6 text-left space-y-3 border border-[var(--qm-line-100)]">
              <p className="text-sm text-[var(--qm-ink-700)] leading-relaxed">
                我是 <span className="font-medium">小酷</span>，QM AI 的心理支持伙伴。
              </p>
              <p className="text-sm text-[var(--qm-ink-700)] leading-relaxed">
                我不是真人心理师，但我带着 QM 多年多元文化咨询的经验来陪你聊天。
              </p>
              <p className="text-sm text-[var(--qm-ink-700)] leading-relaxed">
                这里是一个安全的空间，你可以放心地说出你的感受和心事。小酷会认真倾听，不评判、不催促。
              </p>
              <p className="text-sm text-[var(--qm-danger)] leading-relaxed pt-3 border-t border-[var(--qm-line-100)]">
                如果你正在经历紧急的心理危机，建议优先拨打{" "}
                <span className="font-medium">心理援助热线 15001930070（备 13601658763）</span>
                ，真人心理师能更快帮到你。
              </p>
            </div>

            <button
              onClick={onGoMemory}
              className="w-full py-4 text-white font-medium rounded-2xl transition-all duration-300 hover:bg-[#62428B] min-h-[48px]"
              style={{ background: "#6B4C9A" }}
            >
              继续，我们先简单认识一下
            </button>
          </div>
        )}

        {/* 记忆与隐私 */}
        {step === "memory" && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: "rgba(47, 138, 106, 0.12)" }}>
                <svg className="w-8 h-8" style={{ color: "var(--qm-success)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-xl font-medium text-[var(--qm-ink-800)] mb-2">关于记忆</h2>
            </div>

            <div className="bg-white/70 rounded-3xl p-6 space-y-4 border border-[var(--qm-line-100)]">
              <p className="text-sm text-[var(--qm-ink-700)] leading-relaxed">
                为了让你每次来的时候不用从头说起，小酷会记住你分享的内容——具体的人、事、感受。
              </p>
              <p className="text-sm text-[var(--qm-ink-700)] leading-relaxed">
                比如你上次说到跟某个人发生了什么、你的心情如何，下次对话时小酷都会记得。
              </p>
              <p className="text-sm text-[var(--qm-ink-700)] leading-relaxed">
                QM 团队在你需要转介真人心理师时可能查看对话，除此之外没有其他人能看到。
              </p>
              <div className="pt-3 border-t border-[var(--qm-line-100)] space-y-2">
                <p className="text-sm text-[var(--qm-ink-600)]">
                  你可以随时说「忘掉 XXX」删除某条记忆，也可以说「清除所有记忆」重新开始。
                </p>
                <p className="text-sm text-[var(--qm-ink-600)] font-medium">
                  你的记忆受到保护，不会用于训练、不会出售。
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={onEnableMemory}
                className="w-full py-4 text-white font-medium rounded-2xl transition-all duration-300 hover:bg-[#62428B] min-h-[48px]"
                style={{ background: "#6B4C9A" }}
              >
                了解并继续
              </button>
            </div>
          </div>
        )}

        {/* 问卷题目 */}
        {step === "survey" && currentQ && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-2">
              <span className="text-xs font-medium text-[var(--qm-purple-600)] uppercase tracking-wide">
                第 {currentQ.index} 题
              </span>
              <h2 className="text-xl font-medium text-[var(--qm-ink-800)] leading-snug">
                {currentQ.title}
              </h2>
              {currentQ.subtitle && (
                <p className="text-sm text-[var(--qm-ink-500)]">{currentQ.subtitle}</p>
              )}
            </div>

            {/* 文本题 */}
            {(currentQ.type === "text" || currentQ.type === "text_optional") && (
              <div className="space-y-4">
                <input
                  type="text"
                  value={textValue}
                  onChange={(e) => setTextValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.nativeEvent.isComposing && e.nativeEvent.keyCode !== 229) {
                      e.preventDefault();
                      onTextSubmit();
                    }
                  }}
                  placeholder={currentQ.placeholder || "输入..."}
                  autoFocus
                  className="w-full px-5 py-4 bg-white/90 border border-[var(--qm-line-200)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[var(--qm-purple-400)]/30 focus:border-[var(--qm-purple-400)]/50 transition-all text-[var(--qm-ink-800)] placeholder-[var(--qm-ink-500)] text-sm"
                />
                <div className="flex gap-3">
                  {currentQ.optional && (
                    <button
                      onClick={onSkip}
                      className="flex-1 py-3 bg-white/70 text-[var(--qm-ink-500)] font-medium rounded-2xl border border-[var(--qm-line-200)] hover:bg-white transition-all duration-300 text-sm min-h-[44px]"
                    >
                      跳过
                    </button>
                  )}
                  <button
                    onClick={onTextSubmit}
                    className="flex-1 py-3 text-white font-medium rounded-2xl transition-all duration-300 text-sm hover:bg-[#62428B] min-h-[44px]"
                    style={{ background: "#6B4C9A" }}
                  >
                    {textValue.trim() ? "继续" : "先不填，继续"}
                  </button>
                </div>
              </div>
            )}

            {/* 单选 / 多选选项 */}
            {(currentQ.type === "single" || currentQ.type === "multi") && currentQ.options && (
              <div className="space-y-3">
                {currentQ.options.map((opt) => {
                  const isSelected = selectedOptions.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      onClick={() => onOptionToggle(opt.value)}
                      className="w-full text-left px-5 py-4 rounded-2xl transition-all text-sm leading-relaxed min-h-[48px]"
                      style={{
                        background: isSelected
                          ? "rgba(107, 76, 154, 0.1)"
                          : "rgba(0, 0, 0, 0.02)",
                        border: isSelected ? "2px solid var(--qm-purple-400)" : "2px solid transparent",
                        color: isSelected ? "var(--qm-purple-700)" : "var(--qm-ink-800)",
                        fontWeight: isSelected ? 500 : 400,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        {currentQ.type === "multi" && (
                          <div
                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                              isSelected
                                ? "border-transparent"
                                : "border-[var(--qm-line-300)]"
                            }`}
                            style={isSelected ? { background: "var(--qm-gradient-warm)" } : {}}
                          >
                            {isSelected && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        )}
                        <span className="flex-1">{opt.label}</span>
                        {currentQ.type === "single" && (
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                              isSelected
                                ? ""
                                : ""
                            }`}
                            style={{
                              borderColor: isSelected ? "var(--qm-purple-400)" : "var(--qm-line-300)",
                            }}
                          >
                            {isSelected && (
                              <div className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--qm-gradient-warm)" }} />
                            )}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 多选题的确认按钮 */}
            {currentQ.type === "multi" && (
              <div className="flex gap-3 pt-2">
                <button
                  onClick={onPrev}
                  disabled={surveyIndex === 0}
                  className="px-6 py-3 bg-white/70 text-[var(--qm-ink-500)] font-medium rounded-2xl border border-[var(--qm-line-200)] hover:bg-white transition-all duration-300 text-sm disabled:opacity-50 min-h-[44px]"
                >
                  上一题
                </button>
                <button
                  onClick={onMultiConfirm}
                  disabled={selectedOptions.length === 0}
                  className="flex-1 py-3 text-white font-medium rounded-2xl transition-all duration-300 text-sm disabled:opacity-40 hover:bg-[#62428B] min-h-[44px]"
                  style={{ background: "#6B4C9A" }}
                >
                  {surveyIndex === totalQuestions - 1 ? "完成" : "继续"}（{selectedOptions.length}）
                </button>
              </div>
            )}

            {currentQ.type === "single" && currentQ.optional && (
              <div className="flex gap-3 pt-2">
                <button
                  onClick={onPrev}
                  disabled={surveyIndex === 0}
                  className="px-6 py-3 bg-white/70 text-[var(--qm-ink-500)] font-medium rounded-2xl border border-[var(--qm-line-200)] hover:bg-white transition-all duration-300 text-sm disabled:opacity-50 min-h-[44px]"
                >
                  上一题
                </button>
                <button
                  onClick={onSkip}
                  className="flex-1 py-3 bg-white/70 text-[var(--qm-ink-500)] font-medium rounded-2xl border border-[var(--qm-line-200)] hover:bg-white transition-all duration-300 text-sm min-h-[44px]"
                >
                  跳过这题
                </button>
              </div>
            )}

            {currentQ.type === "single" && !currentQ.optional && surveyIndex > 0 && (
              <div className="pt-2">
                <button
                  onClick={onPrev}
                  className="w-full py-3 text-[var(--qm-ink-500)] text-sm hover:text-[var(--qm-ink-700)] transition-colors min-h-[40px]"
                >
                  ← 上一题
                </button>
              </div>
            )}

            {currentQ.type === "multi" && currentQ.maxSelect && (
              <p className="text-xs text-[var(--qm-ink-500)] text-center">
                最多选 {currentQ.maxSelect} 个
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 消息气泡（视觉v2.0升级）
// ==========================================
function MessageBubble({
  message,
  audioUrl,
  onRetryVoiceTranscript,
  eagerVoicePrefetch,
}: {
  message: ChatMessage;
  audioUrl: string | null;
  onRetryVoiceTranscript: (messageId: string) => void;
  eagerVoicePrefetch: boolean;
}) {
  const isUser = message.role === "user";
  const hasVoice = isUser && !!message.voiceMeta?.hasAudio;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} animate-message-in`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full flex-shrink-0 mr-3 shadow-sm overflow-hidden">
          <img src="/visual/char/xiaoku_avatar_square.png" alt="小酷" className="w-full h-full object-cover" loading="lazy" />
        </div>
      )}

      <div
        className={`message-bubble px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? "text-white rounded-tr-sm"
            : "rounded-tl-sm border border-[var(--qm-line-100)]"
        }`}
        style={{
          whiteSpace: hasVoice ? "normal" : "pre-wrap",
          wordBreak: "break-word",
          background: isUser
            ? "var(--qm-purple-600)"
            : "var(--qm-surface-0)",
          color: isUser ? "white" : "var(--qm-ink-800)",
          maxWidth: hasVoice ? "320px" : undefined,
        }}
      >
        {/* 用户语音消息：显示语音气泡（含可折叠转写文字） */}
        {hasVoice && message.voiceMeta ? (
          <VoiceMessageBubble
            messageId={message.id}
            audioUrl={audioUrl}
            duration={message.voiceMeta.duration}
            transcript={message.content === "转写中…" ? "" : message.content}
            transcriptStatus={message.voiceMeta.transcriptStatus}
            transcriptError={message.voiceMeta.transcriptError}
            onRetryTranscript={() => onRetryVoiceTranscript(message.id)}
          />
        ) : (
          message.content
        )}

        {/* AI 消息：文字 + 语音回复播放器 */}
        {!isUser && message.content && (
          <VoiceReplyPlayer text={message.content} role="xiaoku" messageId={message.id} eagerPrefetch={eagerVoicePrefetch} />
        )}

        {/* 危机干预 UI（不破坏现有逻辑） */}
        {message.isCrisis && (
          <div className="mt-3 pt-3 border-t border-white/20">
            <p className="text-xs text-white/90 mb-2">如果你需要帮助：</p>
            <div className="text-xs space-y-1 text-white/95">
              <p>📞 心理援助热线：15001930070（主）</p>
              <p>📞 13601658763（备）</p>
              <p>📞 12356（24小时）</p>
            </div>
          </div>
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full flex-shrink-0 ml-3 flex items-center justify-center" style={{ background: "var(--qm-purple-100)" }}>
          <span className="text-xs font-medium" style={{ color: "var(--qm-purple-700)" }}>你</span>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 打字指示器
// ==========================================
function TypingIndicator() {
  return (
    <div className="flex justify-start animate-message-in">
      <div className="w-8 h-8 rounded-full qm-xiaoku-avatar flex-shrink-0 mr-3 flex items-center justify-center shadow-sm">
        <span className="text-white text-xs font-medium">Q</span>
      </div>
      <div className="bg-white border border-[var(--qm-line-100)] rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full animate-typing-bounce"
              style={{
                animationDelay: `${i * 0.2}s`,
                background: "var(--qm-ink-500)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
