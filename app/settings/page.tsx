import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import SettingsApp from "@/components/SettingsApp";
import { query } from "@/lib/db";
import { listAgents } from "@/lib/chat";

const INITIAL_LOGS_PAGE_SIZE = 100;

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }
  const role = (session.user as any).role;
  if (role !== "admin" && role !== "super_admin") {
    redirect("/chat");
  }
  const userId = Number((session.user as any).id);

  const [aiSettingsRows, userRows, logRows, logCountRows, agents] = await Promise.all([
    query(
      "SELECT id, model_name, api_key, theme, updated_at FROM ai_settings ORDER BY id DESC LIMIT 1"
    ),
    query(
      "SELECT id, username, role, is_active, is_deleted, created_at FROM users ORDER BY id ASC"
    ),
    query(
      "SELECT l.id, l.user_id, u.username, l.action, l.target_type, l.target_id, l.metadata, l.created_at FROM operation_logs l LEFT JOIN users u ON l.user_id = u.id ORDER BY l.id DESC LIMIT ?",
      [INITIAL_LOGS_PAGE_SIZE]
    ),
    query<{ total: number }>("SELECT COUNT(*) AS total FROM operation_logs"),
    listAgents()
  ]);

  const aiSetting = aiSettingsRows[0]
    ? {
        id: aiSettingsRows[0].id as number,
        modelName: aiSettingsRows[0].model_name as string,
        apiKey: aiSettingsRows[0].api_key as string,
        theme: (aiSettingsRows[0].theme as string) || "blue",
        updatedAt: String(aiSettingsRows[0].updated_at)
      }
    : null;

  return (
    <SettingsApp
      currentUser={{
        id: userId,
        username: session.user.name ?? "",
        role
      }}
      initialAiSetting={aiSetting}
      initialUsers={userRows as any}
      initialLogs={{
        items: logRows as any,
        total: Number((logCountRows[0] as any)?.total ?? 0),
        page: 1,
        pageSize: INITIAL_LOGS_PAGE_SIZE,
        totalPages: Math.max(
          1,
          Math.ceil(Number((logCountRows[0] as any)?.total ?? 0) / INITIAL_LOGS_PAGE_SIZE)
        )
      }}
      initialAgents={agents as any}
    />
  );
}
