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
  const agents = await query<Agent>(
    "SELECT id, name, slug, description, system_prompt FROM agents WHERE is_active = 1 ORDER BY id ASC"
  );
  
  // 定义固定的显示顺序
  const displayOrder = [
    "product-one-pager",
    "positioning-helper",
    "four-things",
    "nine-grid",
    "course-outline",
    "course-transcript",
    "material-tagging-assistant",
    "deterministic-material-capture-assistant",
    "experiment-design-assistant"
  ];
  
  // 按照displayOrder排序
  return agents.sort((a, b) => {
    const indexA = displayOrder.indexOf(a.slug);
    const indexB = displayOrder.indexOf(b.slug);
    
    // 如果都在displayOrder中，按照displayOrder的顺序排序
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    
    // 如果只有一个在displayOrder中，在displayOrder中的排在前面
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    
    // 如果都不在displayOrder中，保持原来的顺序
    return 0;
  });
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

