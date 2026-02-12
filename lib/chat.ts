import { query } from "@/lib/db";

export type Agent = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  system_prompt: string | null;
};

export type Conversation = {
  id: number;
  title: string;
  agent_id: number;
  draft: string | null;
};

export type Message = {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
};

export async function listAgents(): Promise<Agent[]> {
  return query<Agent>(
    "SELECT id, name, slug, description, system_prompt FROM agents WHERE is_active = 1 ORDER BY id ASC"
  );
}

export async function listConversations(userId: number): Promise<Conversation[]> {
  return query<Conversation>(
    "SELECT id, title, agent_id, draft FROM conversations WHERE user_id = ? AND is_deleted = 0 ORDER BY updated_at DESC",
    [userId]
  );
}

export async function getConversationMessages(conversationId: number) {
  return query<Message>(
    "SELECT id, role, content, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at ASC",
    [conversationId]
  );
}

