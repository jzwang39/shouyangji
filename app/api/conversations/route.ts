import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { logOperation } from "@/lib/operations";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const userId = Number((session.user as any).id);
  const conversations = await query(
    "SELECT id, title, agent_id, draft FROM conversations WHERE user_id = ? AND is_deleted = 0 ORDER BY updated_at DESC",
    [userId]
  );
  return NextResponse.json(conversations);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const userId = Number((session.user as any).id);
  const body = await request.json();
  const agentId = Number(body.agentId);
  if (!agentId) {
    return new NextResponse("agentId is required", { status: 400 });
  }
  const title = "新对话";
  const result: any = await query(
    "INSERT INTO conversations (user_id, agent_id, title) VALUES (?, ?, ?)",
    [userId, agentId, title]
  );
  const conversationId = result.insertId as number;
  await logOperation({
    userId,
    action: "create_conversation",
    targetType: "conversation",
    targetId: conversationId
  });
  const [conversation] = await query(
    "SELECT id, title, agent_id, draft FROM conversations WHERE id = ?",
    [conversationId]
  );
  return NextResponse.json(conversation);
}

