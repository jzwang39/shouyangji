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

export async function POST(_request: Request, context: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const userId = Number((session.user as any).id);
  const conversationId = Number(context.params.id);

  const conversations = await query(
    "SELECT id FROM conversations WHERE id = ? AND user_id = ? AND is_deleted = 0",
    [conversationId, userId]
  );
  if (conversations.length === 0) {
    return new NextResponse("Not found", { status: 404 });
  }

  await query("DELETE FROM messages WHERE conversation_id = ?", [
    conversationId
  ]);

  await logOperation({
    userId,
    action: "clear_conversation",
    targetType: "conversation",
    targetId: conversationId
  });

  return new NextResponse(null, { status: 204 });
}

