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
  const messageId = Number(context.params.id);

  const messages = await query<
    { id: number; role: string; conversation_id: number; user_id: number }
  >(
    "SELECT m.id, m.role, m.conversation_id, c.user_id FROM messages m JOIN conversations c ON m.conversation_id = c.id WHERE m.id = ?",
    [messageId]
  );
  const message = messages[0];
  if (!message || message.user_id !== userId || message.role !== "assistant") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  await logOperation({
    userId,
    action: "regenerate_message",
    targetType: "message",
    targetId: messageId
  });

  return new NextResponse(
    "尚未接入真实模型，稍后可以在此处调用 API 并覆盖该条回复内容",
    { status: 501 }
  );
}

