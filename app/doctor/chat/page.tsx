import type { Metadata } from "next";
import { MessageSquareHeart } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import { getChatData } from "@/lib/queries/doctor";
import { PageHeader } from "@/components/ui/dashboard-ui";
import { ChatRoom } from "./chat-room";

export const metadata: Metadata = { title: "Chat · Doctor" };

export default async function ChatPage() {
  const user = await requireRole(["doctor", "receptionist", "admin"]);
  const data = await getChatData(user.id);

  return (
    <div>
      <PageHeader
        title="Doctor Group Chat"
        subtitle={`Communicate securely with fellow doctors${data.memberCount ? ` — ${data.memberCount} member${data.memberCount === 1 ? "" : "s"}` : ""}`}
        action={
          <span className="badge bg-brand-100 text-brand-800">
            <MessageSquareHeart className="mr-1.5 h-3.5 w-3.5" />
            {data.roomName}
          </span>
        }
      />
      <ChatRoom
        roomId={data.roomId}
        initialMessages={data.messages}
        muted={data.muted}
        memberCount={data.memberCount}
      />
    </div>
  );
}
