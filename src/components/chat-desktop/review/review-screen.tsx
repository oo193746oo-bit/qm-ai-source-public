"use client";
import { useState } from "react";
import { reviewStates } from "./catalog";
import { Wave } from "../icons";
export function ChatReviewScreen({ stateId }: { stateId: string }) {
  const item = reviewStates.find((s) => s.id === stateId)!;
  const [closed, setClosed] = useState(false);
  return (
    <div className="qm-chat-desktop" data-review-only="true">
      <iframe
        title="批准聊天视觉底图；内部候选审图用，不是真实聊天"
        src="/chat-review/reference"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          border: 0,
        }}
      />
      {!closed && (
        <>
          <div className="chat-overlay" />
          <section
            className={
              item.group === "录音" &&
              ["recording", "cancel-slide", "convert-slide"].includes(item.id)
                ? "chat-record-card"
                : "chat-dialog"
            }
            role="dialog"
            aria-label={item.title}
            style={{
              position: "absolute",
              zIndex: 12,
              left: "50%",
              top: "50%",
              transform: "translate(-50%,-50%)",
            }}
          >
            <h2>{item.title}</h2>
            {item.group === "录音" &&
              ["recording", "cancel-slide", "convert-slide"].includes(
                item.id,
              ) && <Wave />}
            {item.lines.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {item.buttons.map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setClosed(true)}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
