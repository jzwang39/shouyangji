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

export async function PATCH(request: Request, context: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const userId = Number((session.user as any).id);
  const messageId = Number(context.params.id);
  const body = await request.json();
  const content = String(body.content ?? "").trim();
  if (!content) {
    return new NextResponse("content is required", { status: 400 });
  }

  const messages = await query<
    { id: number; role: string; conversation_id: number; user_id: number }
  >(
    "SELECT m.id, m.role, m.conversation_id, c.user_id FROM messages m JOIN conversations c ON m.conversation_id = c.id WHERE m.id = ?",
    [messageId]
  );
  const message = messages[0];
  if (!message || message.user_id !== userId || message.role !== "user") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  await query(
    "UPDATE messages SET content = ?, updated_at = NOW() WHERE id = ?",
    [content, messageId]
  );

  await logOperation({
    userId,
    action: "edit_message",
    targetType: "message",
    targetId: messageId
  });

  const [updated] = await query(
    "SELECT id, role, content, created_at FROM messages WHERE id = ?",
    [messageId]
  );
  return NextResponse.json(updated);
}

