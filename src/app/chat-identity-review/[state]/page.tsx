import { notFound } from "next/navigation";
import { ChatIdentityReview } from "@/components/chat-desktop/desktop-chat";
import "../../chat/chat-desktop.css";
export const dynamic = "force-dynamic";
export const metadata = { title: "内部批准身份对图", robots: { index: false, follow: false } };
export default async function Page({ params }: { params: Promise<{state:string}> }) {
 if (process.env.QM_CHAT_DESKTOP_REVIEW !== "true") notFound();
 const {state} = await params;
 if (state !== "first" && state !== "messages") notFound();
 return <ChatIdentityReview state={state} />;
}
