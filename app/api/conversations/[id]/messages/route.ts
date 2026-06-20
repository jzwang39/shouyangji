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

const PENDING_PREFIX = "正在生成，请稍候...";
const EMPTY_AI_REPLY_FALLBACK = "【系统提示】本次生成未返回内容，请重试。";

const AI_AGENT_SLUGS = new Set([
  "positioning-helper",
  "positioning",
  "positioning-assistant",
  "position-helper",
  "product-one-pager",
  "product-one-pager-series",
  "product-one-pager-xingyuefeng",
  "four-things",
  "nine-grid",
  "guixin-transaction",
  "course-outline",
  "course-transcript-single-methodology",
  "course-transcript",
  "material-tagging-assistant",
  "deterministic-material-capture-assistant",
  "crisis-material-capture-assistant",
  "science-popularization-material-capture-assistant",
  "keyword-material-capture-assistant",
  "experiment-design-assistant"
]);

const REVISION_ENABLED_SLUGS = new Set([
  "positioning-helper",
  "positioning",
  "positioning-assistant",
  "position-helper",
  "four-things",
  "nine-grid",
  "course-outline",
  "experiment-design-assistant",
  "deterministic-material-capture-assistant",
  "crisis-material-capture-assistant",
  "science-popularization-material-capture-assistant",
  "keyword-material-capture-assistant"
]);

function normalizeAgentSlug(slug: string) {
  const normalized = String(slug ?? "")
    .trim()
    .toLowerCase();
  if (
    normalized === "deterministic-material-capture" ||
    normalized === "deterministic_material_capture"
  ) {
    return "deterministic-material-capture-assistant";
  }
  if (
    normalized === "crisis-material-capture" ||
    normalized === "crisis_material_capture"
  ) {
    return "crisis-material-capture-assistant";
  }
  if (
    normalized === "science-popularization-material-capture" ||
    normalized === "science_popularization_material_capture"
  ) {
    return "science-popularization-material-capture-assistant";
  }
  if (
    normalized === "keyword-material-capture" ||
    normalized === "keyword_material_capture"
  ) {
    return "keyword-material-capture-assistant";
  }
  return normalized;
}

function isMaterialCaptureAgent(slug: string, agentName: string) {
  const normalizedSlug = normalizeAgentSlug(slug);
  if (
    normalizedSlug === "deterministic-material-capture-assistant" ||
    normalizedSlug === "crisis-material-capture-assistant" ||
    normalizedSlug === "science-popularization-material-capture-assistant" ||
    normalizedSlug === "keyword-material-capture-assistant"
  ) {
    return true;
  }
  const name = String(agentName ?? "").trim();
  return (
    name.includes("确定性素材抓取") ||
    name.includes("危机素材抓取") ||
    name.includes("科普素材抓取") ||
    name.includes("重点词素材抓取")
  );
}

function isAiAgent(slug: string, agentName: string) {
  const normalizedSlug = normalizeAgentSlug(slug);
  if (AI_AGENT_SLUGS.has(normalizedSlug)) return true;
  const name = String(agentName ?? "").trim();
  if (!name) return false;
  return (
    name.includes("产品一页纸") ||
    name.includes("定位") ||
    name.includes("四件事") ||
    name.includes("九宫格") ||
    name.includes("归心成交") ||
    name.includes("课纲") ||
    name.includes("课程") ||
    name.includes("实验设计") ||
    name.includes("实验") ||
    name.includes("素材标记") ||
    name.includes("素材") ||
    name.includes("确定性素材抓取") ||
    name.includes("危机素材抓取") ||
    name.includes("科普素材抓取") ||
    name.includes("重点词素材抓取")
  );
}

function isRevisionEnabledAgent(slug: string, agentName: string) {
  const normalizedSlug = normalizeAgentSlug(slug);
  if (normalizedSlug === "course-outline-single-methodology") {
    return false;
  }
  if (REVISION_ENABLED_SLUGS.has(normalizedSlug)) return true;
  const name = String(agentName ?? "").trim();
  if (!name) return false;
  if (
    name.includes("课纲助手") &&
    (name.includes("单方法论") || name.includes("产品系列"))
  ) {
    return false;
  }
  return (
    name.includes("定位") ||
    name.includes("四件事") ||
    name.includes("九宫格") ||
    name.includes("课纲") ||
    name.includes("实验设计") ||
    name.includes("实验") ||
    name.includes("确定性素材抓取") ||
    name.includes("危机素材抓取") ||
    name.includes("科普素材抓取") ||
    name.includes("重点词素材抓取")
  );
}

function isCourseOutlineConversation(slug: string, agentName: string) {
  const normalizedSlug = normalizeAgentSlug(slug);
  if (normalizedSlug === "course-outline") return true;
  return String(agentName ?? "").trim() === "课纲助手「多方法论」";
}

function isCourseTranscriptConversation(slug: string, agentName: string) {
  const normalizedSlug = normalizeAgentSlug(slug);
  if (normalizedSlug === "course-transcript") return true;
  return String(agentName ?? "").trim() === "课程逐字稿「多方法论」";
}

function isExplicitContinuationCommand(content: string) {
  const normalized = String(content ?? "")
    .trim()
    .replace(/[\s，,。.!！？?、；;：:“”"'‘’（）()【】\[\]]+/g, "");
  if (!normalized) return false;
  return (
    normalized === "继续" ||
    normalized === "执行完" ||
    normalized === "执行" ||
    normalized === "继续输出" ||
    normalized === "继续生成" ||
    normalized === "接着写" ||
    normalized === "接着输出"
  );
}

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
    const rawPromptOverride = String(body.promptOverride ?? "").trim();
    const followupResultContext = String(body.followupResultContext ?? "").trim();
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

    if (isAiAgent(conversation.slug, conversation.agent_name)) {
      console.log(`[API] 处理AI智能体消息，slug: ${conversation.slug}, agent_name: ${conversation.agent_name}`);
      const normalizedConversationSlug = normalizeAgentSlug(conversation.slug);
      const isCourseOutlineMultiConversation = isCourseOutlineConversation(
        conversation.slug,
        conversation.agent_name
      );
      const isCourseTranscriptMultiConversation = isCourseTranscriptConversation(
        conversation.slug,
        conversation.agent_name
      );
      const isCourseOutlineContinuationRequest =
        isCourseOutlineMultiConversation && isExplicitContinuationCommand(content);
      const isCourseTranscriptContinuationRequest =
        isCourseTranscriptMultiConversation && isExplicitContinuationCommand(content);
      const isMaterialCaptureConversation = isMaterialCaptureAgent(
        conversation.slug,
        conversation.agent_name
      );
      const isExperimentDesignConversation =
        normalizedConversationSlug === "experiment-design-assistant" ||
        String(conversation.agent_name ?? "").includes("实验设计");
      const promptOverride =
        !isCourseOutlineContinuationRequest &&
        !isCourseTranscriptContinuationRequest &&
        isRevisionEnabledAgent(conversation.slug, conversation.agent_name) &&
        !isMaterialCaptureConversation &&
        !isExperimentDesignConversation &&
        rawPromptOverride
          ? rawPromptOverride
          : "";
      console.log(`[API] promptOverride: ${promptOverride ? '有值' : '空'}`);
      const isMaterialTaggingConversation =
        normalizedConversationSlug === "material-tagging-assistant" ||
        String(conversation.agent_name ?? "").includes("素材标记");
      
      console.log(`[API] isMaterialTaggingConversation: ${isMaterialTaggingConversation}`);
      console.log(`[API] isMaterialCaptureConversation: ${isMaterialCaptureConversation}`);
      console.log(`[API] followupResultContext: ${followupResultContext ? '有值' : '空'}`);
      
      const promptContent =
        (isMaterialTaggingConversation ||
          isMaterialCaptureConversation) &&
        followupResultContext
          ? `以下是最近一次生成的结果信息：
${followupResultContext}

以下是用户本次的新请求：
${content}`
          : content;
      
      console.log(`[API] promptContent长度: ${promptContent.length}`);
      console.log(`[API] promptOverride: ${promptOverride ? '有值，长度=' + promptOverride.length : '空'}`);
      let prompt =
        promptOverride || (await buildPromptForAgent(conversation.slug, promptContent));
      let aiMessages:
        | Array<{ role: "system" | "user" | "assistant"; content: string }>
        | undefined;

      if (isCourseOutlineContinuationRequest || isCourseTranscriptContinuationRequest) {
        const historyRows = await query<{
          id: number;
          role: "user" | "assistant" | "system";
          content: string;
        }>(
          "SELECT id, role, content FROM messages WHERE conversation_id = ? ORDER BY created_at ASC, id ASC",
          [conversationId]
        );
        const historyMessages = historyRows
          .map((row) => {
            if (
              row.role !== "system" &&
              row.role !== "user" &&
              row.role !== "assistant"
            ) {
              return null;
            }
            let normalizedContent = String(row.content ?? "");
            if (row.role === "assistant" && normalizedContent.startsWith(PENDING_PREFIX)) {
              normalizedContent = normalizedContent
                .slice(PENDING_PREFIX.length)
                .replace(/^\s+/, "");
            }
            const trimmed = normalizedContent.trim();
            if (!trimmed) return null;
            return {
              id: row.id,
              role: row.role,
              content: trimmed
            };
          })
          .filter(
            (
              item
            ): item is {
              id: number;
              role: "system" | "user" | "assistant";
              content: string;
            } => !!item
          );
        const previousMessages = historyMessages.filter((item) => item.id !== messageId);
        let lastAssistantIndex = -1;
        for (let i = previousMessages.length - 1; i >= 0; i -= 1) {
          if (previousMessages[i].role === "assistant") {
            lastAssistantIndex = i;
            break;
          }
        }
        if (lastAssistantIndex !== -1) {
          let baseUserIndex = -1;
          for (let i = lastAssistantIndex - 1; i >= 0; i -= 1) {
            if (
              previousMessages[i].role === "user" &&
              !isExplicitContinuationCommand(previousMessages[i].content)
            ) {
              baseUserIndex = i;
              break;
            }
          }
          const baseUserContent =
            baseUserIndex !== -1 ? previousMessages[baseUserIndex].content : "";
          const assistantContext = previousMessages
            .slice(baseUserIndex === -1 ? 0 : baseUserIndex + 1)
            .filter((item) => item.role === "assistant")
            .map((item) => item.content)
            .join("\n\n")
            .trim();
          if (assistantContext) {
            const basePromptSeed = baseUserContent || promptContent;
            const basePrompt = await buildPromptForAgent(
              conversation.slug,
              basePromptSeed
            );
            prompt = basePrompt;
            aiMessages = [
              { role: "user", content: basePrompt },
              { role: "assistant", content: assistantContext },
              {
                role: "user",
                content:
                  isCourseTranscriptContinuationRequest
                    ? "你上一次的逐字稿输出被截断了。请严格从上文结尾处继续输出剩余内容，不要重复已经输出过的任何内容，保持原有课程标题、讲稿结构、段落顺序和话术风格，直到完整结束。不要使用 ``` 代码块包裹结果。"
                    : "你上一次的输出被截断了。请严格从上文结尾处继续输出剩余内容，不要重复已经输出过的任何内容，保持原有结构、阶段顺序、节次顺序和标题层级，直到完整结束。不要使用 ``` 代码块包裹结果。"
              }
            ];
          }
        }
      }

      if (
        normalizedConversationSlug === "product-one-pager" ||
        normalizedConversationSlug === "product-one-pager-series" ||
        normalizedConversationSlug === "product-one-pager-xingyuefeng" ||
        isMaterialTaggingConversation ||
        isExperimentDesignConversation
      ) {
        const historyRows = await query<{
          id: number;
          role: "user" | "assistant" | "system";
          content: string;
        }>(
          "SELECT id, role, content FROM messages WHERE conversation_id = ? ORDER BY created_at ASC, id ASC",
          [conversationId]
        );
        const historyMessages = historyRows
          .map((row) => {
            if (
              row.role !== "system" &&
              row.role !== "user" &&
              row.role !== "assistant"
            ) {
              return null;
            }
            let normalizedContent = String(row.content ?? "");
            if (row.role === "assistant" && normalizedContent.startsWith(PENDING_PREFIX)) {
              normalizedContent = normalizedContent
                .slice(PENDING_PREFIX.length)
                .replace(/^\s+/, "");
            }
            const trimmed = normalizedContent.trim();
            if (!trimmed) return null;
            return {
              id: row.id,
              role: row.role,
              content: trimmed
            };
          })
          .filter(
            (
              item
            ): item is {
              id: number;
              role: "system" | "user" | "assistant";
              content: string;
            } =>
              !!item
          );

        if (isExperimentDesignConversation) {
          const previousHistory = historyMessages
            .filter((item) => item.id !== messageId)
            .map(({ role, content }) => ({ role, content }));
          aiMessages = [
            { role: "system", content: prompt },
            ...previousHistory,
            { role: "user", content }
          ];
        } else {
          const systemPrompt = await buildPromptForAgent(conversation.slug, "");
          const normalizedHistory = historyMessages.map(({ role, content }) => ({
            role,
            content
          }));
          aiMessages = [{ role: "system", content: systemPrompt }, ...normalizedHistory];
          prompt = systemPrompt;
        }
      }

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
                  agentSlug: conversation.slug,
                  messages: aiMessages,
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
                if (!fullText.trim()) {
                  fullText = EMPTY_AI_REPLY_FALLBACK;
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
          aiText = await callAiWithPrompt(prompt, {
            agentSlug: conversation.slug,
            messages: aiMessages
          });
          if (!String(aiText ?? "").trim()) {
            aiText = EMPTY_AI_REPLY_FALLBACK;
          }
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
