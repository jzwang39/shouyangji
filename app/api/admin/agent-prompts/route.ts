import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { logOperation } from "@/lib/operations";

export const dynamic = "force-dynamic";

function assertSuperAdmin(session: any) {
  const role = (session.user as any).role;
  if (role !== "super_admin") {
    throw new Error("Forbidden");
  }
}

const allowedSlugs = [
  "product-one-pager",
  "positioning-helper",
  "four-things",
  "nine-grid",
  "course-outline",
  "course-transcript"
] as const;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  try {
    assertSuperAdmin(session);
  } catch {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const placeholders = allowedSlugs.map(() => "?").join(",");
  const order = allowedSlugs.map(() => "?").join(",");
  const rows = await query<{
    id: number;
    slug: string;
    name: string;
    prompt: string | null;
    system_prompt: string | null;
  }>(
    `SELECT a.id, a.slug, a.name, p.prompt, a.system_prompt
     FROM agents a
     LEFT JOIN agent_prompts p ON p.agent_slug = a.slug
     WHERE a.slug IN (${placeholders})
     ORDER BY FIELD(a.slug, ${order})`,
    [...allowedSlugs, ...allowedSlugs]
  );

  return NextResponse.json(
    rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      systemPrompt: row.prompt ?? row.system_prompt ?? ""
    })),
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  try {
    assertSuperAdmin(session);
  } catch {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const userId = Number((session.user as any).id);
  let body: any = null;
  try {
    body = await request.json();
  } catch {
    return new NextResponse("请求体不是合法 JSON", { status: 400 });
  }
  const slug = String(body.slug ?? "").trim();
  const systemPrompt = String(body.systemPrompt ?? "");

  if (!slug) {
    return new NextResponse("slug 不能为空", { status: 400 });
  }
  if (!allowedSlugs.includes(slug as any)) {
    return new NextResponse("不支持的智能体", { status: 400 });
  }
  if (!systemPrompt.trim()) {
    return new NextResponse("提示词不能为空", { status: 400 });
  }

  const agents = await query<{ id: number }>(
    "SELECT id FROM agents WHERE slug = ? LIMIT 1",
    [slug]
  );
  if (agents.length === 0) {
    return new NextResponse("智能体不存在", { status: 404 });
  }
  const agentId = Number((agents[0] as any).id);

  await query(
    "INSERT INTO agent_prompts (agent_slug, prompt) VALUES (?, ?) ON DUPLICATE KEY UPDATE prompt = VALUES(prompt)",
    [slug, systemPrompt]
  );
  await query("UPDATE agents SET system_prompt = ? WHERE slug = ?", [
    systemPrompt,
    slug
  ]);
  await logOperation({
    userId,
    action: "update_agent_prompt",
    targetType: "agent",
    targetId: agentId,
    metadata: { slug }
  });

  return new NextResponse(null, {
    status: 204,
    headers: {
      "Cache-Control": "no-store"
    }
  });
}
