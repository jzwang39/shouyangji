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

  const rows = await query<{ user_id: number; role_id: number }>(
    "SELECT user_id, role_id FROM user_agent_roles"
  );

  return NextResponse.json(
    rows.map((row) => ({
      userId: row.user_id,
      roleId: row.role_id
    }))
  );
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
  const targetUserId = Number(body.userId);
  const roleIdRaw = body.roleId;
  const targetRoleId =
    roleIdRaw === null || roleIdRaw === "" || roleIdRaw === undefined
      ? null
      : Number(roleIdRaw);

  if (!targetUserId) {
    return new NextResponse("userId is required", { status: 400 });
  }

  const users = await query(
    "SELECT id FROM users WHERE id = ? AND is_deleted = 0",
    [targetUserId]
  );
  if (users.length === 0) {
    return new NextResponse("User not found", { status: 404 });
  }

  if (targetRoleId !== null) {
    const roles = await query(
      "SELECT id FROM agent_roles WHERE id = ?",
      [targetRoleId]
    );
    if (roles.length === 0) {
      return new NextResponse("Role not found", { status: 404 });
    }
    await query(
      "INSERT INTO user_agent_roles (user_id, role_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE role_id = VALUES(role_id)",
      [targetUserId, targetRoleId]
    );
  } else {
    await query("DELETE FROM user_agent_roles WHERE user_id = ?", [
      targetUserId
    ]);
  }

  await logOperation({
    userId,
    action: "update_user_agent_role",
    targetType: "user",
    targetId: targetUserId,
    metadata: {
      roleId: targetRoleId
    }
  });

  return new NextResponse(null, { status: 204 });
}

