import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { logOperation } from "@/lib/operations";
import { buildPromptForAgent, callAiWithPrompt } from "@/lib/ai";

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
    "SELECT id FROM conversations WHERE id = ? AND user_id = ? AND is_deleted = 0",
    [conversationId, userId]
  );
  if (conversations.length === 0) {
    return new NextResponse("Not found", { status: 404 });
  }

  const messages = await query(
    "SELECT id, role, content, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at ASC",
    [conversationId]
  );
  return NextResponse.json(messages);
}

export async function POST(request: Request, context: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const userId = Number((session.user as any).id);
    const conversationId = Number(context.params.id);
    const body = await request.json();
    const content = String(body.content ?? "").trim();
    if (!content) {
      return new NextResponse("content is required", { status: 400 });
    }

    const conversations = await query(
      "SELECT c.id, c.title, c.agent_id, a.slug FROM conversations c JOIN agents a ON c.agent_id = a.id WHERE c.id = ? AND c.user_id = ? AND c.is_deleted = 0",
      [conversationId, userId]
    );
    if (conversations.length === 0) {
      return new NextResponse("Not found", { status: 404 });
    }

    const conversation = conversations[0] as {
      id: number;
      title: string;
      agent_id: number;
      slug: string;
    };

    const result: any = await query(
      "INSERT INTO messages (conversation_id, role, content) VALUES (?, 'user', ?)",
      [conversationId, content]
    );
    const messageId = result.insertId as number;

    if (conversation.title === "新对话") {
      const title = content.slice(0, 30);
      await query(
        "UPDATE conversations SET title = ?, updated_at = NOW() WHERE id = ?",
        [title, conversationId]
      );
    } else {
      await query(
        "UPDATE conversations SET updated_at = NOW() WHERE id = ?",
        [conversationId]
      );
    }

    await logOperation({
      userId,
      action: "send_message",
      targetType: "message",
      targetId: messageId,
      metadata: { conversationId }
    });

    const [message] = await query(
      "SELECT id, role, content, created_at FROM messages WHERE id = ?",
      [messageId]
    );

    let aiReply: any = null;
    let aiPrompt: string | null = null;

    const aiAgents = new Set([
      "positioning-helper",
      "product-one-pager",
      "four-things",
      "nine-grid",
      "course-outline",
      "course-transcript"
    ]);

    if (aiAgents.has(conversation.slug)) {
      const prompt = buildPromptForAgent(conversation.slug, content);
      aiPrompt = prompt;
      let aiText: string;
      let isError = false;
      try {
        aiText = await callAiWithPrompt(prompt);
      } catch (e: any) {
        let message = "";
        if (typeof e?.message === "string" && e.message) {
          message = e.message;
        }
        const extra: string[] = [];
        if (e?.name && typeof e.name === "string" && e.name !== "Error") {
          extra.push(`错误类型: ${e.name}`);
        }
        if (e?.cause) {
          let causeText = "";
          if (typeof e.cause === "string") {
            causeText = e.cause;
          } else {
            try {
              causeText = JSON.stringify(e.cause);
            } catch {
              causeText = String(e.cause);
            }
          }
          if (causeText) {
            extra.push(`详细原因: ${causeText}`);
          }
        }
        if (!message) {
          message = "调用 AI 接口失败，请稍后重试";
        }
        if (extra.length) {
          message = `${message}\n${extra.join("\n")}`;
        }
        aiText = `【系统提示】${message}`;
        isError = true;
      }
      const aiResult: any = await query(
        "INSERT INTO messages (conversation_id, role, content) VALUES (?, 'assistant', ?)",
        [conversationId, aiText]
      );
      const aiMessageId = aiResult.insertId as number;
      const [aiMessage] = await query(
        "SELECT id, role, content, created_at FROM messages WHERE id = ?",
        [aiMessageId]
      );
      aiReply = aiMessage;
      await logOperation({
        userId,
        action: isError ? "ai_error" : "ai_reply",
        targetType: "message",
        targetId: aiMessageId,
        metadata: {
          conversationId,
          agentSlug: conversation.slug,
          prompt
        }
      });
    }

    return NextResponse.json({ message, aiReply, aiPrompt });
  } catch (e: any) {
    const message =
      typeof e?.message === "string" && e.message
        ? e.message
        : "服务异常，请稍后重试";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
