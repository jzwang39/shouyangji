import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getUserChatAccess, listConversations } from "@/lib/chat";
import ChatApp from "@/components/ChatApp";

function normalizeAgentSlug(slug: string) {
  return String(slug ?? "")
    .trim()
    .toLowerCase();
}

export default async function ChatPage({
  searchParams
}: {
  searchParams?: {
    agent?: string;
    mode?: string;
    panel?: string;
  };
}) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }
  const userId = Number((session.user as any).id);
  const userRole = (session.user as any).role ?? "user";
  const access = await getUserChatAccess(userId, userRole);
  const conversations = await listConversations(userId, access.allowedAgentIds);
  const requestedPanel = String(searchParams?.panel ?? "").trim();
  const initialActivePanel =
    requestedPanel === "outline-extraction" &&
    access.menuKeys.includes("outline-extraction")
      ? "outline-extraction"
      : requestedPanel === "data-management" &&
          access.menuKeys.includes("data-management")
        ? "data-management"
        : "chat";
  const requestedAgentSlug = normalizeAgentSlug(String(searchParams?.agent ?? ""));
  const initialSelectedAgentId =
    access.agents.find(
      (agent) => normalizeAgentSlug(agent.slug) === requestedAgentSlug
    )?.id ?? null;
  const initialStartNewConversation =
    initialActivePanel === "chat" &&
    String(searchParams?.mode ?? "").trim() === "new" &&
    !!initialSelectedAgentId;

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
      initialActivePanel={initialActivePanel}
      initialSelectedAgentId={initialSelectedAgentId}
      initialStartNewConversation={initialStartNewConversation}
    />
  );
}
