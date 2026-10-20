import { notFound } from "next/navigation";
import { ChatReviewScreen } from "@/components/chat-desktop/review/review-screen";
import { reviewStates } from "@/components/chat-desktop/review/catalog";
import "../../chat/chat-desktop.css";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "内部候选审图",
  robots: { index: false, follow: false },
};
export default async function ReviewPage({
  params,
}: {
  params: Promise<{ state: string }>;
}) {
  if (process.env.QM_CHAT_DESKTOP_REVIEW !== "true") notFound();
  const { state } = await params;
  if (!reviewStates.some((s) => s.id === state)) notFound();
  return <ChatReviewScreen stateId={state} />;
}
