"use client";
import { useCallback, useEffect, useRef, useState, type ReactNode, Fragment } from "react";
import Link from "next/link";
import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { useDesktopChat, type ChatMessage } from "@/hooks/use-desktop-chat";
import { useOnboarding } from "@/hooks/use-onboarding";
import { ChatInterface } from "@/components/chat-interface";
import { saveAudio, deleteAudio, getAudio } from "@/lib/voice/audio-store";
import { stopActiveVoicePlayback } from "@/lib/voice/playback-coordinator";
import { Avatar, Icon } from "./icons";
import { DesktopVoiceReplyPlayer } from "./voice-reply-player";
import { UserAudioBar } from "./audio-bar";
import { DesktopRecorder } from "./recorder";
import { ComposerInput, readComposer, type ComposerHandle } from "./composer-input";
import { MessageText } from "./emoticons";
import { EmojiPanel } from "./emoji-panel";
import identityFixture from "./identity-fixture.json";
import { DesktopNavigation } from "@/components/qm-site-shell/desktop-navigation";

function Popup({
  title,
  children,
  onClose,
  variant,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  variant?: string;
}) {
  const opener = useRef<HTMLElement | null>(null);
  return (
    <Dialog.Root
      open
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <Dialog.Overlay className="chat-overlay" />
      <Dialog.Content
        onOpenAutoFocus={() => {
          opener.current =
            document.activeElement instanceof HTMLElement
              ? document.activeElement
              : null;
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          const saved = opener.current;
          if (
            saved?.isConnected &&
            saved !== document.body &&
            !saved.closest('[role="dialog"]')
          )
            saved.focus();
          else {
            const input = document.querySelector<HTMLElement>(
              ".qm-chat-desktop .chat-input",
            );
            if (input?.offsetParent) input.focus();
            else
              document
                .querySelector<HTMLElement>(".qm-chat-desktop .chat-mic")
                ?.focus();
          }
        }}
        className={`chat-dialog ${variant || ""}`}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%,-50%)",
          zIndex: 11,
        }}
      >
        <Dialog.Title asChild>
          <h2>{title}</h2>
        </Dialog.Title>
        <Dialog.Description className="sr-only">{title}</Dialog.Description>
        {children}
        <Dialog.Close asChild>
          <button type="button">关闭</button>
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Root>
  );
}
function Message({
  message,
  continuation,
  hideTime,
  busy,
  prefetch,
  volatileBlob,
  regenerate,
  canRegenerate,
  displayTime,
  allowRegeneration,
}: {
  message: ChatMessage;
  continuation: boolean;
  hideTime: boolean;
  busy: boolean;
  prefetch: boolean;
  volatileBlob?: Blob;
  regenerate: () => void;
  canRegenerate: boolean;
  displayTime?: string;
  allowRegeneration: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const voice = !!message.voiceMeta || message.replyMode === "voice";
  const isUser = message.role === "user";
  const time = displayTime || new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(Number.isFinite(message.timestamp) ? message.timestamp : 0);
  return (
    <div
      className={`chat-row ${isUser ? "user" : "ai"} ${continuation ? "chat-continuation" : ""} ${voice ? "chat-voice-row" : ""} ${!voice && message.content.includes("\n") ? "chat-analysis" : ""}`}
      data-message-id={message.id}
    >
      {!isUser && <Avatar hidden={continuation} />}
      {isUser && voice && <span className="chat-time">{time}</span>}
      <div
        className={`chat-bubble ${voice ? (isUser ? "chat-voice" : "chat-ai-voice") : ""}`}
      >
        {voice &&
          (isUser ? (
            <UserAudioBar
              messageId={message.id}
              seconds={message.voiceMeta?.duration || 0}
              hasAudio={message.voiceMeta?.hasAudio === true}
              volatileBlob={volatileBlob}
            />
          ) : message.delivery !== "pending" &&
            message.delivery !== "failed" &&
            message.delivery !== "stopped" &&
            !busy ? (
            <DesktopVoiceReplyPlayer
              text={message.content}
              role="xiaoku"
              messageId={message.id}
              eagerPrefetch={prefetch}
            />
          ) : null)}
        <div className={isUser && voice ? "chat-voice-bottom" : undefined}>
          {!collapsed && (
            <div className={voice ? "chat-transcript" : ""} onCopy={(event) => {
              const selection = getSelection();
              if (!selection?.rangeCount || selection.isCollapsed) return;
              const range = selection.getRangeAt(0);
              if (!event.currentTarget.contains(range.startContainer) || !event.currentTarget.contains(range.endContainer)) return;
              const fragment = range.cloneContents();
              fragment.querySelectorAll<HTMLElement>('[role="img"][aria-label]').forEach((node) => {
                node.replaceWith(document.createTextNode(`[${node.getAttribute("aria-label")}]`));
              });
              event.preventDefault();
              event.clipboardData.setData("text/plain", readComposer(fragment));
            }}>
              {message.content ? (
                !isUser && voice ? (
                  message.content.split(/\n\n+/).map((p, i) => (
                    <p key={i}>
                      <MessageText text={p} />
                    </p>
                  ))
                ) : (
                  <MessageText text={message.content} />
                )
              ) : (
                <span className={message.delivery === "stopped" || message.delivery === "failed" ? "chat-incomplete" : "chat-pending"} role="status">
                  {message.delivery === "stopped" || message.delivery === "failed" ? "本次尚未收到回复文字" : "小酷正在回复…"}
                </span>
              )}
            </div>
          )}
          {voice && message.content && (
            <button
              type="button"
              className="chat-collapse"
              onClick={() => setCollapsed((v) => !v)}
            >
              {collapsed ? "展开文字" : "收起文字"}
            </button>
          )}
        </div>
        {message.isCrisis && (
          <div className="chat-crisis">
            <p>如果你需要帮助：</p>
            <p>
              心理援助热线：<a href="tel:15001930070">15001930070（主）</a>
            </p>
            <p>
              <a href="tel:13601658763">13601658763（备）</a>
            </p>
            <p>
              <a href="tel:12356">12356（24小时）</a>
            </p>
          </div>
        )}
        {message.delivery === "stopped" && <div className="chat-error" role="status">已停止回复</div>}
        {allowRegeneration && message.replyReceived && ["stopped", "failed"].includes(message.delivery || "") && <button type="button" disabled={!canRegenerate} onClick={regenerate}>重新生成本次回复</button>}
        {message.delivery === "failed" && (
          <div className="chat-error" role="status">
            本次回复未完成
          </div>
        )}
      </div>
      {!(isUser && voice) && (
        <span className={`chat-time ${hideTime ? "chat-group-time" : ""}`}>
          {time}
        </span>
      )}
    </div>
  );
}
function ActiveDesktopChat({ visualFixture, behaviorCandidates = false }: { visualFixture?: "first" | "messages"; behaviorCandidates?: boolean } = {}) {
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const chat = useDesktopChat();
  const { setInput, hydrated, started, startXiaoku } = chat;
  const [today, setToday] = useState("");
  useEffect(() => setToday(new Date().toLocaleDateString("zh-CN")), []);
  const day = (m: ChatMessage) =>
    Number.isFinite(m.timestamp) && m.timestamp > 0
      ? new Date(m.timestamp).toLocaleDateString("zh-CN")
      : "日期未知";
  const [voice, setVoice] = useState(false);
  const [menu, setMenu] = useState<"plus" | "emoji" | null>(null);
  const [popup, setPopup] = useState<
    "account" | "history" | "more" | "photo" | "clear" | null
  >(null);
  const [notice, setNotice] = useState("");
  const [clearing, setClearing] = useState(false);
  const clearingRef = useRef(false);
  const [clearError, setClearError] = useState("");
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  const [recentEmoticons, setRecentEmoticons] = useState<number[]>([]);
  useEffect(() => {
    try {
      const value = JSON.parse(
        localStorage.getItem("qm_chat_emoticon_recent_v1") || "[]",
      );
      if (Array.isArray(value))
        setRecentEmoticons(
          [
            ...new Set(
              value.filter((i) => Number.isInteger(i) && i >= 0 && i < 24),
            ),
          ].slice(0, 8),
        );
    } catch {
      /* No invented recent history on unavailable or malformed storage. */
    }
  }, []);
  const chooseEmoticon = (index: number) => {
    composer.current?.insert(index);
    setVoice(false);
    const next = [index, ...recentEmoticons.filter((i) => i !== index)].slice(
      0,
      8,
    );
    setRecentEmoticons(next);
    try {
      localStorage.setItem("qm_chat_emoticon_recent_v1", JSON.stringify(next));
    } catch {
      setNotice("浏览器没有保存最近使用的表情。");
    }
  };
  const [recordBusy, setRecordBusy] = useState(false);
  const mediaGeneration = useRef(0);
  const [volatileAudio, setVolatileAudio] = useState<Record<string, Blob>>({});
  const [unread, setUnread] = useState(false);
  const composer = useRef<ComposerHandle>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const following = useRef(true);
  const composing = useRef(false);
  const file = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<
    { file: File; url: string; selected: boolean; failed?: boolean }[]
  >([]);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const photosRef = useRef(photos);
  const photoList = useRef<HTMLDivElement>(null);
  const photoListScrollTop = useRef(0);
  const attachPhotoList = useCallback((node: HTMLDivElement | null) => {
    photoList.current = node;
    if (node) node.scrollTop = photoListScrollTop.current;
  }, []);
  function openPhotoPreview(url: string) {
    if (photoList.current) {
      photoListScrollTop.current = photoList.current.scrollTop;
    }
    setPreviewPhoto(url);
  }
  const [draftReady, setDraftReady] = useState(false);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);
  useEffect(
    () => () => {
      photosRef.current.forEach((p) => URL.revokeObjectURL(p.url));
      stopActiveVoicePlayback();
    },
    [],
  );
  useEffect(() => {
    try {
      setInput(sessionStorage.getItem("qm_chat_desktop_draft") || "");
    } catch {}
    setDraftReady(true);
  }, [setInput]);
  useEffect(() => {
    if (draftReady)
      try {
        sessionStorage.setItem("qm_chat_desktop_draft", chat.input);
      } catch {
        setNotice("浏览器没有保存草稿；请保留当前页面。");
      }
  }, [chat.input, draftReady]);
  useEffect(() => {
    if (hydrated && !started && !chat.storageError) startXiaoku();
  }, [hydrated, started, startXiaoku, chat.storageError]);
  useEffect(() => {
    const node = scroller.current;
    if (!node) return;
    if (following.current) {
      node.scrollTop = node.scrollHeight;
      setUnread(false);
    } else setUnread(true);
  }, [chat.messages]);
  useEffect(() => {
    const node = scroller.current;
    if (!node) return;
    const observer = new ResizeObserver(() => {
      if (following.current) node.scrollTop = node.scrollHeight;
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const dismiss = (e: KeyboardEvent) => {
      if (e.key === "Escape" && menu) {
        setMenu(null);
        document
          .querySelector<HTMLElement>(
            menu === "emoji"
              ? ".qm-chat-desktop .chat-smile"
              : ".qm-chat-desktop .chat-plus",
          )
          ?.focus();
      }
    };
    document.addEventListener("keydown", dismiss);
    return () => document.removeEventListener("keydown", dismiss);
  }, [menu]);
  const visualMessages: ChatMessage[] = identityFixture.messages.map((m, i) => ({
    id: `approved-identity-${i}`, role: m.user ? "user" : "assistant", content: m.text,
    timestamp: Date.UTC(2026, 9, 11, Number(m.time.split(":")[0]) - 8, Number(m.time.split(":")[1])),
  }));
  const visible = visualFixture ? (visualFixture === "messages" ? visualMessages : []) : chat.messages.filter((m) => !m.hidden && m.role !== "system" && m.id !== "xiaoku-first-greeting-v1");
  async function send() {
    if (chat.isLoading || recordBusy || !chat.input.trim()) return;
    if (!navigator.onLine) {
      setNotice("网络已断开，草稿保留。连接恢复后请主动发送。");
      return;
    }
    following.current = true;
    await chat.sendMessage();
  }
  function discardPhotos() {
    photoListScrollTop.current = 0;
    if (photoList.current) photoList.current.scrollTop = 0;
    setPreviewPhoto(null);
    photos.forEach((p) => URL.revokeObjectURL(p.url));
    setPhotos([]);
    if (file.current) file.current.value = "";
  }
  async function sendVoice(blob: Blob, seconds: number, text: string) {
    const mediaAttempt = mediaGeneration.current;
    const id = `voice-${crypto.randomUUID()}`;
    await saveAudio(id, blob);
    const audioSaved = !!(await getAudio(id));
    if (!alive.current || mediaAttempt !== mediaGeneration.current) {
      await deleteAudio(id);
      return;
    }
    if (!audioSaved) {
      setVolatileAudio((previous) => ({ ...previous, [id]: blob }));
      setNotice(
        "浏览器没有保存录音；本页仍可播放，刷新后可能无法回放。识别文字已保留。",
      );
    }
    following.current = true;
    // 聊天请求启动后由聊天状态管理等待与失败；录音忙碌态不应一直锁到脑答结束。
    // 用户可在等待回复时切回文字，先写草稿而不重复发送。
    void chat.sendMessage(
      text,
      false,
      {
        hasAudio: audioSaved,
        duration: seconds,
        mimeType: blob.type,
        transcriptStatus: "ready",
      },
      id,
    ).catch(() => setNotice("本次回复未完成，请查看消息状态后重试。"));
  }
  return (
    <div className="qm-chat-desktop" data-hydrated={chat.hydrated}>
      <header className="qm-approved-nav-header">
        <Link className="brand" href="/" aria-label="QM AI 首页">
          <i className="qmark" aria-hidden="true" />
          QM <span>AI</span>
        </Link>
        <DesktopNavigation activePath={visualFixture ? "/chat" : undefined} onOpen={() => { setMenu(null); if (!clearing) setPopup(null); }} />
        <button
          type="button"
          className="login"
          onClick={() => setPopup("account")}
        >
          登录 / 注册 <Icon name="arrow" />
        </button>
      </header>
      <section className="chat-panel chat-identity-panel" aria-label="和小酷聊聊">
        <div className="chat-top">
          <Avatar />
          <div className="chat-identity">
            <div>
              <strong>小酷</strong>
              <span>AI心理陪伴</span>
            </div>
            <p>这里，可以慢慢说。</p>
          </div>
          <button
            type="button"
            className="chat-history"
            onClick={() => setPopup("history")}
          >
            <Icon name="history" />
            聊天记录
          </button>
          <button
            type="button"
            className="chat-more"
            aria-label="更多"
            onClick={() => setPopup("more")}
          >
            <Icon name="more" />
          </button>
        </div>
        <div className="chat-role-layout">
          <ChatRoleProfile />
          <div className="chat-role-conversation">
        <div
          className="chat-messages"
          ref={scroller}
          onScroll={() => {
            const n = scroller.current!;
            following.current =
              n.scrollHeight - n.scrollTop - n.clientHeight < 48;
            if (following.current) setUnread(false);
          }}
        >
          {!chat.hydrated && !visualFixture ? (
            <div role="status">正在读取本地聊天记录…</div>
          ) : !chat.storageError && !visible.length ? (
            <div className="welcome">
              <div className="eyebrow">和小酷聊聊</div>
              <h2>这里，可以慢慢说。</h2>
              <p>不用先想清楚，也不用一次说完。<br />从此刻最想说的事开始就好。</p>
              <div className="start-hint">今天，想从哪里说起？</div>
            </div>
          ) : (
            visible.map((m, i) => (
              <Fragment key={m.id}>
                {(i === 0 || day(m) !== day(visible[i - 1])) && (
                  <div className="chat-date">
                    {visualFixture ? "今天" : day(m) === today ? "今天" : day(m)}
                  </div>
                )}
                <Message
                  message={m}
                  displayTime={visualFixture ? identityFixture.messages[i].time : undefined}
                  regenerate={() => void chat.regenerateReply(m.id)}
                  allowRegeneration={behaviorCandidates && !visualFixture}
                  canRegenerate={!chat.isLoading && !recordBusy && chat.storageReady && !offline}
                  volatileBlob={volatileAudio[m.id]}
                  prefetch={i === visible.length - 1}
                  busy={chat.isLoading && i === visible.length - 1}
                  hideTime={
                    m.role === "assistant" &&
                    i < visible.length - 1 &&
                    visible[i + 1].role === "assistant" &&
                    day(m) === day(visible[i + 1])
                  }
                  continuation={
                    i > 0 &&
                    m.role === "assistant" &&
                    visible[i - 1].role === "assistant" &&
                    day(m) === day(visible[i - 1])
                  }
                />
              </Fragment>
            ))
          )}
        </div>
        {unread && (
          <button
            className="chat-back-bottom"
            type="button"
            onClick={() => {
              following.current = true;
              if (scroller.current)
                scroller.current.scrollTop = scroller.current.scrollHeight;
              setUnread(false);
            }}
          >
            回到最新消息 ↓
          </button>
        )}
        <div className="chat-composer">
          {offline && <div className="chat-status" role="status">网络已断开。你可以继续写草稿，连接恢复后不会自动发送。</div>}
          {chat.isLoading && <div className="chat-status" role="status">小酷正在回复… <button type="button" onClick={chat.stopReply}>停止回复</button></div>}
          {(notice || chat.storageError) && (
            <div className="chat-status" role="status">
              {notice || chat.storageError}
              {chat.storageError && <button type="button" onClick={chat.retryStorage}>重试读取聊天记录</button>}
            </div>
          )}
          <div className="chat-input-row">
            <button
              type="button"
              className="chat-mic"
              aria-label={voice ? "切换文字输入" : "切换语音输入"}
              disabled={recordBusy}
              onClick={() => {
                setVoice((v) => !v);
                setMenu(null);
              }}
            >
              <Icon name={voice ? "keyboard" : "mic"} />
            </button>
            {voice && (
              <DesktopRecorder
                disabled={chat.isLoading || !chat.storageReady}
                onVoice={sendVoice}
                onBusy={setRecordBusy}
                onNotice={setNotice}
                onText={(text) => {
                  chat.setInput((previous) => previous ? `${previous}\n${text}` : text);
                  setVoice(false);
                  requestAnimationFrame(() => document.querySelector<HTMLElement>(".qm-chat-desktop .chat-input")?.focus());
                }}
              />
            )}
            <ComposerInput
              hidden={voice}
              ref={composer}
              value={chat.input}
              onChange={(text) => {
                chat.setInput(text);
                try {
                  sessionStorage.setItem("qm_chat_desktop_draft", text);
                } catch {
                  setNotice("浏览器没有保存草稿；请保留当前页面。");
                }
              }}
              onCompositionStart={() => {
                composing.current = true;
              }}
              onCompositionEnd={() => {
                composing.current = false;
              }}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  !composing.current &&
                  !e.nativeEvent.isComposing
                ) {
                  e.preventDefault();
                  void send();
                }
              }}
            />
            <button
              type="button"
              className="chat-smile"
              aria-label="表情"
              aria-expanded={menu === "emoji"}
              disabled={recordBusy}
              onClick={() => {
                setVoice(false);
                setMenu((v) => (v === "emoji" ? null : "emoji"));
              }}
            >
              <Icon name="smile" />
            </button>
            <button
              type="button"
              className="chat-plus"
              aria-label="更多输入方式"
              aria-expanded={menu === "plus"}
              disabled={recordBusy}
              onClick={() => setMenu((v) => (v === "plus" ? null : "plus"))}
            >
              <Icon name="plus" />
            </button>
            <button
              type="button"
              className="chat-send"
              disabled={
                !chat.hydrated ||
                !chat.storageReady ||
                !chat.input.trim() ||
                chat.isLoading ||
                recordBusy ||
                voice
              }
              onClick={() => void send()}
            >
              发送
            </button>
          </div>
          <p className="chat-note">文字或语音，都可以从这里开始。</p>
        </div>
        {menu === "plus" && (
          <div className="chat-menu">
            <button
              type="button"
              onClick={() => {
                setMenu(null);
                file.current?.click();
              }}
            >
              <Icon name="photo" />
              照片
            </button>
          </div>
        )}
        {menu === "emoji" && (
          <EmojiPanel
            recent={recentEmoticons}
            choose={chooseEmoticon}
            erase={() => composer.current?.erase()}
            send={() => void send()}
            canErase={!!chat.input && !recordBusy && !voice}
            canSend={
              chat.hydrated &&
              chat.storageReady &&
              !!chat.input.trim() &&
              !chat.isLoading &&
              !recordBusy &&
              !voice
            }
          />
        )}
          </div>
        </div>
      </section>
      <input
        ref={file}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          const incoming = [...(e.target.files || [])];
          if (!incoming.length) return;
          const selected = incoming.filter((f) => f.type.startsWith("image/"));
          if (!selected.length) {
            setNotice("请选择图片，暂不支持视频。");
            e.target.value = "";
            return;
          }
          discardPhotos();
          setPhotos(
            selected.map((f) => ({
              file: f,
              url: URL.createObjectURL(f),
              selected: false,
            })),
          );
          setPopup("photo");
        }}
      />
      {popup === "account" && (
        <Popup title="账号功能尚未开放" onClose={() => setPopup(null)}>
          <p>
            你可以先和小酷聊聊。注册与跨次聊天的记忆功能将在账号功能开放后提供。
          </p>
          <button type="button" onClick={() => setPopup(null)}>
            先和小酷聊聊
          </button>
        </Popup>
      )}
      {popup === "history" && (
        <Popup title="聊天记录" onClose={() => setPopup(null)}>
          <p>当前浏览器保存的记录。未接入账号同步。</p>
          {!chat.hydrated && <p role="status">正在读取本机聊天记录…</p>}
          {chat.storageError && <p role="alert">{chat.storageError}<button type="button" onClick={chat.retryStorage}>重试读取聊天记录</button></p>}
          {chat.hydrated && !chat.storageError && !chat.storedMessages.length && <p>当前没有已保存的聊天记录。</p>}
          {chat.storedMessages.map((m) => (
            <p key={m.id}>
              <strong>{m.role === "user" ? "你" : "小酷"}：</strong>
              <MessageText text={m.content} />
              <button type="button" onClick={() => {
                setPopup(null);
                following.current = false;
                requestAnimationFrame(() => {
                  const row = Array.from(document.querySelectorAll<HTMLElement>(".qm-chat-desktop [data-message-id]"))
                    .find((node) => node.dataset.messageId === m.id);
                  row?.scrollIntoView({ block: "center" });
                });
              }}>定位这条消息</button>
            </p>
          ))}
        </Popup>
      )}
      {popup === "more" && (
        <Popup title="更多" onClose={() => setPopup(null)}>
          <p>你可以了解隐私政策，或寻找真人支持。</p>
          {behaviorCandidates && <button type="button" onClick={() => { setClearError(""); setPopup("clear"); }}>清空并重新开始</button>}
          <Link className="chat-account-link" href="/therapists">
            找心理师
          </Link>
          <Link className="chat-account-link" href="/privacy">
            隐私政策
          </Link>
        </Popup>
      )}
      {popup === "clear" && <Popup title="清空并重新开始" onClose={() => { if (!clearing) setPopup(null); }}>
        <p>将删除当前浏览器中本次小酷对话的消息和对应音频，不删除其他对话或长期记忆。这不是云端删除。</p>
        {clearError && <p role="alert">{clearError}</p>}
        {clearError && chat.storageError && <p>{chat.storageError}</p>}
        <button type="button" disabled={clearing || !chat.storageReady} onClick={async () => {
          if (clearingRef.current) return;
          clearingRef.current = true;
          setClearing(true);
          setClearError("");
          mediaGeneration.current++;
          setVoice(false);
          setRecordBusy(false);
          setMenu(null);
          stopActiveVoicePlayback();
          const ok = await chat.newChat();
          clearingRef.current = false;
          if (!alive.current) return;
          setClearing(false);
          if (ok) { stopActiveVoicePlayback(); setVolatileAudio({}); setNotice("本机本次对话已清空。"); setPopup(null); }
          else { setClearError("清空未完成，原页面消息仍保留。请查看存储提示。"); setNotice("清空未完成，原页面消息仍保留。请查看存储提示。"); }
        }}>{clearing ? "正在清空…" : "确认清空本机本次对话"}</button>
        <button type="button" disabled={clearing} onClick={() => setPopup(null)}>取消清空</button>
      </Popup>}
      {popup === "photo" && (
        <Popup
          title={previewPhoto ? "照片预览" : "本机照片"}
          variant="chat-photo-dialog"
          onClose={() => {
            discardPhotos();
            setPopup(null);
          }}
        >
          {previewPhoto ? (
            <div className="chat-photo-preview">
              <button type="button" onClick={() => setPreviewPhoto(null)}>
                返回照片
              </button>
              <div aria-label="预览照片切换">
                <button type="button" disabled={photos.findIndex((photo) => photo.url === previewPhoto) <= 0} onClick={() => {
                  const index = photos.findIndex((photo) => photo.url === previewPhoto);
                  if (index > 0) setPreviewPhoto(photos[index - 1].url);
                }}>上一张</button>
                <button type="button" disabled={photos.findIndex((photo) => photo.url === previewPhoto) >= photos.length - 1} onClick={() => {
                  const index = photos.findIndex((photo) => photo.url === previewPhoto);
                  if (index >= 0 && index < photos.length - 1) setPreviewPhoto(photos[index + 1].url);
                }}>下一张</button>
              </div>
              {photos.find((photo) => photo.url === previewPhoto)?.failed ? (
                <div className="chat-photo-failed" role="status">
                  <p>这张照片暂时无法预览。</p>
                  <button type="button" onClick={() => setPhotos((items) => items.map((photo) =>
                    photo.url === previewPhoto ? { ...photo, failed: false } : photo
                  ))}>重新载入预览</button>
                </div>
              ) : (
                <Image
                  key={previewPhoto}
                  unoptimized
                  src={previewPhoto}
                  width={1200}
                  height={1000}
                  alt="本机照片完整预览"
                  onError={() => setPhotos((items) => items.map((photo) =>
                    photo.url === previewPhoto ? { ...photo, failed: true, selected: false } : photo
                  ))}
                />
              )}
            </div>
          ) : (
            <>
              <button
                type="button"
                className="chat-photo-add"
                onClick={() => file.current?.click()}
              >
                选择本地照片
              </button>
              <div
                className="chat-photo-list"
                role="list"
                aria-label="本机照片"
                ref={attachPhotoList}
                onScroll={(event) => {
                  if (event.currentTarget === photoList.current) {
                    photoListScrollTop.current = event.currentTarget.scrollTop;
                  }
                }}
              >
                {photos.map((p, i) => (
                  <div className="chat-photo-tile" key={p.url} role="listitem" aria-posinset={i + 1} aria-setsize={photos.length}>
                    <button
                      type="button"
                      aria-label={`预览 ${p.file.name}`}
                      disabled={p.failed}
                      onClick={() => openPhotoPreview(p.url)}
                    >
                      {p.failed ? (
                        <span className="chat-photo-failed">照片无法预览</span>
                      ) : (
                        <Image
                          unoptimized
                          src={p.url}
                          width={300}
                          height={300}
                          alt={p.file.name}
                          onError={() =>
                            setPhotos((ps) =>
                              ps.map((x) =>
                                x.url === p.url
                                  ? { ...x, failed: true, selected: false }
                                  : x,
                              ),
                            )
                          }
                        />
                      )}
                    </button>
                    <input
                      type="checkbox"
                      disabled={p.failed}
                      aria-label={`选择 ${p.file.name}`}
                      checked={p.selected}
                      onChange={(e) =>
                        setPhotos((ps) =>
                          ps.map((x, j) =>
                            j === i ? { ...x, selected: e.target.checked } : x,
                          ),
                        )
                      }
                    />
                  </div>
                ))}
              </div>
              <div className="chat-photo-actions">
                <button
                  type="button"
                  disabled={!photos.some((p) => p.selected && !p.failed)}
                  onClick={() =>
                    openPhotoPreview(
                      photos.find((p) => p.selected && !p.failed)!.url,
                    )
                  }
                >
                  预览
                </button>
                <label>
                  <input type="checkbox" disabled />
                  原图
                </label>
                <button type="button" disabled>
                  发送
                  {photos.some((p) => p.selected)
                    ? `（${photos.filter((p) => p.selected).length}）`
                    : ""}
                </button>
              </div>
              <p className="chat-candidate-notice">
                图片发送暂未开放。你仍可选择和预览本机照片。
              </p>
            </>
          )}
        </Popup>
      )}
    </div>
  );
}
function ChatRoleProfile() {
  return (
<aside className="chat-role-profile" aria-label="小酷身份与用途">
            <Image className="chat-role-portrait" src="/visual/chat-desktop/identity-v1.1/xiaoku.png" alt="小酷原人像" width={254} height={320} unoptimized decoding="sync" loading="eager" />
            <h1>小酷</h1>
            <div className="role-label">QM · AI心理陪伴伙伴</div>
            <p className="role-copy">聊情绪、关系与生活里的困扰，<br />一起梳理感受，探索自己。</p>
            <div className="role-boundary">AI陪伴不能替代专业诊疗<br />或紧急援助。</div>
          </aside>
  );
}

/** 首次称呼、读取和错误状态沿用批准身份壳；不制造已完成聊天或后台状态。 */
function DesktopEntryShell({ children }: { children: ReactNode }) {
  const [accountOpen, setAccountOpen] = useState(false);
  return (
    <div className="qm-chat-desktop qm-chat-entry">
      <header className="qm-approved-nav-header">
        <Link className="brand" href="/" aria-label="QM AI 首页"><i className="qmark" aria-hidden="true" />QM <span>AI</span></Link>
        <DesktopNavigation onOpen={() => setAccountOpen(false)} />
        <button type="button" className="login" onClick={() => setAccountOpen(true)}>登录 / 注册 <Icon name="arrow" /></button>
      </header>
      <section className="chat-panel chat-identity-panel" aria-label="和小酷聊聊">
        <div className="chat-top"><Avatar /><div className="chat-identity"><div><strong>小酷</strong><span>AI心理陪伴</span></div><p>这里，可以慢慢说。</p></div></div>
        <div className="chat-role-layout"><ChatRoleProfile /><div className="chat-role-conversation chat-entry-content">{children}</div></div>
      </section>
      {accountOpen && <Popup title="账号功能尚未开放" onClose={() => setAccountOpen(false)}><p>你可以先和小酷聊聊。注册与跨次聊天的记忆功能将在账号功能开放后提供。</p><button type="button" onClick={() => setAccountOpen(false)}>先和小酷聊聊</button></Popup>}
    </div>
  );
}

export function DesktopChat({ behaviorCandidates = false }: { behaviorCandidates?: boolean } = {}) {
  const { profile, isLoaded, profileError, retryProfile } = useOnboarding({ strictPersistence: true });
  const [desktop, setDesktop] = useState<boolean | null>(null);
  useEffect(() => {
    const query = matchMedia("(pointer: coarse) and (max-width: 900px)");
    const update = () => setDesktop(!query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  // 在设备分流完成前保留原读取提示，不把桌面身份壳闪到暂停施工的手机分支。
  if (desktop === null) return <div role="status">正在读取用户状态…</div>;
  if (!isLoaded) return desktop
    ? <DesktopEntryShell><div role="status">正在读取用户状态…</div></DesktopEntryShell>
    : <div role="status">正在读取用户状态…</div>;
  if (!desktop) return <ChatInterface initialView="chat" desktopContinuation={false} />;
  if (profileError) return <DesktopEntryShell><div role="alert">{profileError}<button type="button" onClick={retryProfile}>重试读取用户状态</button></div></DesktopEntryShell>;
  if (!profile.onboardingCompleted)
    return <DesktopEntryShell><ChatInterface initialView="chat" desktopContinuation /></DesktopEntryShell>;
  return <ActiveDesktopChat behaviorCandidates={behaviorCandidates} />;
}

/** 仅由服务器环境门禁的内部采图路由调用；夹具不写入真实消息或发送接口。 */
export function ChatIdentityReview({ state }: { state: "first" | "messages" }) {
  return <div inert><ActiveDesktopChat visualFixture={state} /></div>;
}
