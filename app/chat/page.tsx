import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { listAgents, listConversations } from "@/lib/chat";
import ChatApp from "@/components/ChatApp";

export default async function ChatPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }
  const userId = Number((session.user as any).id);
  const [agents, conversations] = await Promise.all([
    listAgents(),
    listConversations(userId)
  ]);
  return (
    <ChatApp
      user={{
        id: userId,
        username: session.user.name ?? "",
        role: (session.user as any).role ?? "user"
      }}
      agents={agents}
      initialConversations={conversations}
    />
  );
}

