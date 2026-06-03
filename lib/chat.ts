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

export type SpecialMenuKey = "data-management";

export const SPECIAL_MENU_ITEMS: Array<{
  key: SpecialMenuKey;
  name: string;
}> = [{ key: "data-management", name: "数据管理" }];

const DISPLAY_ORDER = [
  "product-one-pager",
  "positioning-helper",
  "four-things",
  "nine-grid",
  "guixin-transaction",
  "course-outline-single-methodology",
  "course-outline",
  "course-transcript",
  "material-tagging-assistant",
  "deterministic-material-capture-assistant",
  "crisis-material-capture-assistant",
  "science-popularization-material-capture-assistant",
  "keyword-material-capture-assistant",
  "experiment-design-assistant"
];

function sortAgentsByDisplayOrder(agents: Agent[]) {
  return agents.sort((a, b) => {
    const indexA = DISPLAY_ORDER.indexOf(a.slug);
    const indexB = DISPLAY_ORDER.indexOf(b.slug);

    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }

    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;

    return 0;
  });
}

export async function listAgents(): Promise<Agent[]> {
  const agents = await query<Agent>(
    "SELECT id, name, slug, description, system_prompt FROM agents WHERE is_active = 1 ORDER BY id ASC"
  );

  return sortAgentsByDisplayOrder(agents);
}

export async function listConversations(
  userId: number,
  allowedAgentIds?: number[]
): Promise<Conversation[]> {
  if (Array.isArray(allowedAgentIds)) {
    if (allowedAgentIds.length === 0) {
      return [];
    }
    const placeholders = allowedAgentIds.map(() => "?").join(", ");
    return query<Conversation>(
      `SELECT id, title, agent_id, draft FROM conversations WHERE user_id = ? AND is_deleted = 0 AND agent_id IN (${placeholders}) ORDER BY updated_at DESC`,
      [userId, ...allowedAgentIds]
    );
  }
  return query<Conversation>(
    "SELECT id, title, agent_id, draft FROM conversations WHERE user_id = ? AND is_deleted = 0 ORDER BY updated_at DESC",
    [userId]
  );
}

async function getUserAssignedAgentRoleId(userId: number) {
  const rows = await query<{ role_id: number }>(
    "SELECT role_id FROM user_agent_roles WHERE user_id = ? LIMIT 1",
    [userId]
  );
  return rows[0]?.role_id ?? null;
}

export async function getUserChatAccess(userId: number, userRole: string) {
  const allAgents = await listAgents();
  const allMenuKeys = SPECIAL_MENU_ITEMS.map((item) => item.key);

  if (userRole === "super_admin") {
    return {
      agents: allAgents,
      allowedAgentIds: allAgents.map((agent) => agent.id),
      menuKeys: allMenuKeys
    };
  }

  const assignedRoleId = await getUserAssignedAgentRoleId(userId);
  if (!assignedRoleId) {
    return {
      agents: allAgents,
      allowedAgentIds: allAgents.map((agent) => agent.id),
      menuKeys: allMenuKeys
    };
  }

  const [agentMembers, menuMembers] = await Promise.all([
    query<{ agent_id: number }>(
      "SELECT agent_id FROM agent_role_members WHERE role_id = ?",
      [assignedRoleId]
    ),
    query<{ menu_key: string }>(
      "SELECT menu_key FROM agent_role_menu_members WHERE role_id = ?",
      [assignedRoleId]
    )
  ]);

  const allowedAgentIds = Array.from(
    new Set(agentMembers.map((row) => row.agent_id))
  );
  const allowedAgents = allAgents.filter((agent) =>
    allowedAgentIds.includes(agent.id)
  );
  const allowedMenuKeySet = new Set(
    menuMembers
      .map((row) => row.menu_key)
      .filter((key): key is SpecialMenuKey =>
        SPECIAL_MENU_ITEMS.some((item) => item.key === key)
      )
  );

  return {
    agents: allowedAgents,
    allowedAgentIds,
    menuKeys: allMenuKeys.filter((key) => allowedMenuKeySet.has(key))
  };
}

export async function canUserAccessSpecialMenu(
  userId: number,
  userRole: string,
  menuKey: SpecialMenuKey
) {
  const access = await getUserChatAccess(userId, userRole);
  return access.menuKeys.includes(menuKey);
}

export async function getConversationMessages(conversationId: number) {
  return query<Message>(
    "SELECT id, role, content, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at ASC",
    [conversationId]
  );
}
