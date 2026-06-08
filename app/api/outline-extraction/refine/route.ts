import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { buildPromptForAgent, callAiWithPrompt } from "@/lib/ai";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const mergedText = String(body.mergedText ?? "").trim();

    if (!mergedText) {
      return new NextResponse("文件合并结果不能为空", { status: 400 });
    }

    const prompt = await buildPromptForAgent("ai-outline-refinement", mergedText);
    const refinedOutline = await callAiWithPrompt(prompt, {
      agentSlug: "ai-outline-refinement"
    });

    return NextResponse.json({
      refinedOutline: String(refinedOutline ?? "").trim()
    });
  } catch (e: any) {
    const message =
      typeof e?.message === "string" && e.message.trim()
        ? e.message.trim()
        : "AI 提炼大纲失败，请稍后重试";
    return new NextResponse(message, { status: 500 });
  }
}
