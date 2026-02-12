import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { logOperation } from "@/lib/operations";

function assertAdmin(session: any) {
  const role = (session.user as any).role;
  if (role !== "admin" && role !== "super_admin") {
    throw new Error("Forbidden");
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  try {
    assertAdmin(session);
  } catch {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const roles = await query<{ id: number; name: string }>(
    "SELECT id, name FROM agent_roles ORDER BY id ASC"
  );
  const members = await query<{ role_id: number; agent_id: number }>(
    "SELECT role_id, agent_id FROM agent_role_members"
  );

  const roleMap = new Map<
    number,
    { id: number; name: string; agentIds: number[] }
  >();
  for (const role of roles) {
    roleMap.set(role.id, { id: role.id, name: role.name, agentIds: [] });
  }
  for (const member of members) {
    const role = roleMap.get(member.role_id);
    if (role) {
      role.agentIds.push(member.agent_id);
    }
  }

  return NextResponse.json(Array.from(roleMap.values()));
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  try {
    assertAdmin(session);
  } catch {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const userId = Number((session.user as any).id);
  const body = await request.json();
  const name = String(body.name ?? "").trim();
  const agentIds = Array.isArray(body.agentIds)
    ? body.agentIds.map((id: any) => Number(id)).filter((id: number) => id > 0)
    : [];

  if (!name) {
    return new NextResponse("角色名称不能为空", { status: 400 });
  }

  const result: any = await query(
    "INSERT INTO agent_roles (name, created_by_user_id) VALUES (?, ?)",
    [name, userId]
  );
  const roleId = result.insertId as number;

  if (agentIds.length > 0) {
    const values: any[] = [];
    const placeholders: string[] = [];
    for (const agentId of agentIds) {
      placeholders.push("(?, ?)");
      values.push(roleId, agentId);
    }
    await query(
      `INSERT INTO agent_role_members (role_id, agent_id) VALUES ${placeholders.join(
        ", "
      )}`,
      values
    );
  }

  await logOperation({
    userId,
    action: "create_agent_role",
    targetType: "agent_role",
    targetId: roleId,
    metadata: {
      name,
      agentIds
    }
  });

  return new NextResponse(null, { status: 201 });
}

