"use client";
import { Emoticon, emoticons } from "./emoticons";
import { Icon } from "./icons";
export function EmojiPanel({
  recent,
  choose,
  erase,
  send,
  canSend,
  canErase,
}: {
  recent: number[];
  choose: (index: number) => void;
  erase: () => void;
  send: () => void;
  canSend: boolean;
  canErase: boolean;
}) {
  const item = (index: number) => (
    <button
      key={index}
      type="button"
      aria-label={`插入表情：${emoticons[index][0]}`}
      onClick={() => choose(index)}
    >
      <Emoticon index={index} />
    </button>
  );
  return (
    <div
      className="chat-menu chat-emoticon-panel"
      role="region"
      aria-label="表情面板"
    >
      <div className="chat-emoticon-tabs">
        <span aria-label="默认表情">
          <Icon name="smile" />
        </span>
      </div>
      <div className="chat-emoticon-group">
        <span>最近使用</span>
        <div className="chat-recent-items">
          {recent.length ? (
            recent.map(item)
          ) : (
            <p className="chat-recent-empty">暂无最近使用</p>
          )}
        </div>
      </div>
      <div className="chat-emoticon-group chat-all-group">
        <span>所有表情</span>
        <div className="chat-all-items">
          {Array.from({ length: 24 }, (_, i) => item(i))}
        </div>
      </div>
      <div className="chat-emoticon-actions">
        <button
          type="button"
          aria-label="删除输入内容"
          disabled={!canErase}
          onClick={erase}
        >
          <Icon name="erase" />
        </button>
        <button type="button" disabled={!canSend} onClick={send}>
          发送
        </button>
      </div>
    </div>
  );
}
