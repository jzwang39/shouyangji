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
    const wantsStream =
      body?.stream === true ||
      (request.headers.get("accept") ?? "").includes("text/event-stream");
    if (!content) {
      return new NextResponse("content is required", { status: 400 });
    }

    const conversations = await query(
      "SELECT c.id, c.title, c.agent_id, a.slug, a.name as agent_name FROM conversations c JOIN agents a ON c.agent_id = a.id WHERE c.id = ? AND c.user_id = ? AND c.is_deleted = 0",
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
      agent_name: string;
    };

    const result: any = await query(
      "INSERT INTO messages (conversation_id, role, content) VALUES (?, 'user', ?)",
      [conversationId, content]
    );
    const messageId = result.insertId as number;

    if (conversation.title === "新对话") {
      // Initialize with a cleaned version of content to ensure fallback is clean
      // Remove common brackets and quotes
      let productName = content
        .replace(/['"《》\[\]【】（）()]/g, "")
        .trim();
      
      if (productName.length > 20) {
        productName = productName.slice(0, 20);
      } else if (productName.length === 0) {
        // If cleanup resulted in empty string (unlikely), revert to raw content slice
        productName = content.slice(0, 20);
      }
      
      try {
        // Use AI to extract product name intelligently
        const extractionPrompt = `请从以下输入信息里提取产品或方案名称。
规则：
1. 只返回名称本身，不要包含任何标点符号、解释性文字或“产品名称：”等前缀。
2. 比如输入“[江小养纳豆红曲四步疗法]”，应提取“江小养纳豆红曲”。
3. 如果找不到明确的产品名称，请总结一个简短的主题（不超过10个字）。
4. 忽略方括号、书名号等包裹符号。

输入信息：
${content}`;
        
        const extracted = await callAiWithPrompt(extractionPrompt);
        const trimmed = extracted?.trim();
        if (trimmed) {
           // Cleanup any remaining quotes or brackets just in case
           const cleaned = trimmed.replace(/['"《》\[\]【】（）()]/g, "");
           if (cleaned) {
             productName = cleaned;
             if (productName.length > 20) productName = productName.slice(0, 20);
           }
        }
      } catch (e) {
        console.error("Failed to extract product name via AI:", e);
        // Fallback to the already cleaned productName
      }

      const title = `${productName}-${conversation.agent_name}`;
      await query(
        "UPDATE conversations SET title = ?, updated_at = NOW() WHERE id = ?",
        [title, conversationId]
      );
      conversation.title = title; // Update local variable to send back
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

    if (!message) {
      // Fallback if SELECT fails
      // We know messageId and content because we just inserted it
      // This ensures we always have a message to send back
      // and prevents the user message from disappearing
      (message as any) = {
        id: messageId,
        role: "user",
        content,
        created_at: new Date()
      };
    }

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
      const prompt = await buildPromptForAgent(conversation.slug, content);
      aiPrompt = prompt;
      const pendingPrefix = "正在生成，请稍候...";
      const aiResult: any = await query(
        "INSERT INTO messages (conversation_id, role, content) VALUES (?, 'assistant', ?)",
        [conversationId, pendingPrefix]
      );
      const aiMessageId = aiResult.insertId as number;
      const [aiMessage] = await query(
        "SELECT id, role, content, created_at FROM messages WHERE id = ?",
        [aiMessageId]
      );
      aiReply = aiMessage;

      if (wantsStream) {
        const encoder = new TextEncoder();
        const stream = new ReadableStream<Uint8Array>({
          start(controller) {
            const send = (payload: unknown) => {
              try {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
                );
              } catch {
              }
            };

            send({
              type: "meta",
              message,
              aiReply,
              aiPrompt,
              aiReplyPending: true,
              conversationTitle: conversation.title
            });

            void (async () => {
              let fullText = "";
              let isError = false;
              let lastPersistAt = 0;

              const persist = async (force: boolean) => {
                const now = Date.now();
                if (!force && now - lastPersistAt < 900) return;
                lastPersistAt = now;
                const dbContent = `${pendingPrefix}\n\n${fullText}`;
                await query(
                  "UPDATE messages SET content = ?, updated_at = NOW() WHERE id = ?",
                  [dbContent, aiMessageId]
                );
              };

              try {
                const final = await callAiWithPrompt(prompt, {
                  onDelta: async (delta) => {
                    if (!delta) return;
                    console.log(`[Route] onDelta called with length: ${delta.length}`);
                    fullText += delta;
                    send({ type: "delta", delta });
                    await persist(false);
                  }
                });

                const finalText = typeof final === "string" ? final : "";
                if (finalText && finalText !== fullText) {
                  fullText = finalText;
                }
                send({ type: "final", content: fullText });

                await query(
                  "UPDATE messages SET content = ?, updated_at = NOW() WHERE id = ?",
                  [fullText, aiMessageId]
                );
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
                fullText = `【系统提示】${message}`;
                isError = true;
                await query(
                  "UPDATE messages SET content = ?, updated_at = NOW() WHERE id = ?",
                  [fullText, aiMessageId]
                );
                send({ type: "error", message: fullText });
              } finally {
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
                send({ type: "done" });
                controller.close();
              }
            })();
          }
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no"
          }
        });
      }

      void (async () => {
        let aiText = "";
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

        await query("UPDATE messages SET content = ?, updated_at = NOW() WHERE id = ?", [
          aiText,
          aiMessageId
        ]);
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
      })();
    }

    return NextResponse.json({
      message,
      aiReply,
      aiPrompt,
      aiReplyPending: aiReply?.content === "正在生成，请稍候...",
      conversationTitle: conversation.title
    });
  } catch (e: any) {
    const message =
      typeof e?.message === "string" && e.message
        ? e.message
        : "服务异常，请稍后重试";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
