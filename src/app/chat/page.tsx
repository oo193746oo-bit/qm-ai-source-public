import { DesktopChat } from "@/components/chat-desktop/desktop-chat";
import { ChatInterface } from "@/components/chat-interface";
import "./chat-desktop.css";
export const dynamic = "force-dynamic";
export const metadata = { title: "和小酷聊聊 | QM AI" };
// Candidate is opt-in until all visual states, dependencies and gates pass.
export default function ChatPage() {
  return process.env.QM_CHAT_DESKTOP_CANDIDATE === "true" ? (
    <DesktopChat behaviorCandidates={process.env.QM_CHAT_DESKTOP_REVIEW === "true"} />
  ) : (
    <ChatInterface initialView="chat" />
  );
}
