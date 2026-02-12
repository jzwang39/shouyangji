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
  const conversationId = Number(context.params.id);
  const body = await request.json();

  if (typeof body.title === "string") {
    await query(
      "UPDATE conversations SET title = ?, updated_at = NOW() WHERE id = ? AND user_id = ?",
      [body.title, conversationId, userId]
    );
    await logOperation({
      userId,
      action: "rename_conversation",
      targetType: "conversation",
      targetId: conversationId,
      metadata: { title: body.title }
    });
  }

  if (typeof body.draft === "string") {
    await query(
      "UPDATE conversations SET draft = ?, updated_at = NOW() WHERE id = ? AND user_id = ?",
      [body.draft, conversationId, userId]
    );
  }

  const [conversation] = await query(
    "SELECT id, title, agent_id, draft FROM conversations WHERE id = ? AND user_id = ?",
    [conversationId, userId]
  );
  return NextResponse.json(conversation);
}

export async function DELETE(_request: Request, context: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const userId = Number((session.user as any).id);
  const conversationId = Number(context.params.id);

  await query(
    "UPDATE conversations SET is_deleted = 1, deleted_at = NOW(), updated_at = NOW() WHERE id = ? AND user_id = ?",
    [conversationId, userId]
  );

  await logOperation({
    userId,
    action: "delete_conversation",
    targetType: "conversation",
    targetId: conversationId
  });

  return new NextResponse(null, { status: 204 });
}

