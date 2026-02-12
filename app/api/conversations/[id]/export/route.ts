import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { logOperation } from "@/lib/operations";

type Params = {
  params: {
    id: string;
  };
};

export async function GET(_request: Request, context: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const userId = Number((session.user as any).id);
  const conversationId = Number(context.params.id);

  const conversations = await query(
    "SELECT id, title FROM conversations WHERE id = ? AND user_id = ? AND is_deleted = 0",
    [conversationId, userId]
  );
  if (conversations.length === 0) {
    return new NextResponse("Not found", { status: 404 });
  }
  const conversation = conversations[0] as { id: number; title: string };

  const messages = await query<
    { role: "user" | "assistant" | "system"; content: string; created_at: any }
  >(
    "SELECT role, content, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at ASC",
    [conversationId]
  );

  if (messages.length === 0) {
    return new NextResponse("No content", { status: 400 });
  }

  const lines: string[] = [];
  lines.push(`# 对话：${conversation.title}`);
  lines.push("");
  for (const message of messages) {
    const prefix = message.role === "user" ? "用户" : "AI";
    lines.push(`【${prefix}】`);
    lines.push(message.content);
    lines.push("");
  }

  await logOperation({
    userId,
    action: "export_conversation",
    targetType: "conversation",
    targetId: conversationId
  });

  const text = lines.join("\n");
  return new NextResponse(text, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="conversation-${conversationId}.txt"`
    }
  });
}

