import { approvedChatReference } from "@/components/chat-desktop/review/reference";
export function GET() {
  if (process.env.QM_CHAT_DESKTOP_REVIEW !== "true")
    return new Response("Not found", { status: 404 });
  return new Response(approvedChatReference, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
