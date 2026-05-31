import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getUserChatAccess, listConversations } from "@/lib/chat";
import ChatApp from "@/components/ChatApp";

export default async function ChatPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }
  const userId = Number((session.user as any).id);
  const userRole = (session.user as any).role ?? "user";
  const access = await getUserChatAccess(userId, userRole);
  const conversations = await listConversations(userId, access.allowedAgentIds);
  return (
    <ChatApp
      user={{
        id: userId,
        username: session.user.name ?? "",
        role: userRole
      }}
      agents={access.agents}
      allowedMenuKeys={access.menuKeys}
      initialConversations={conversations}
    />
  );
}
