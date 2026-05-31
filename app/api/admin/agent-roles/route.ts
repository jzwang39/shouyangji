import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPool, query } from "@/lib/db";
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
  const [members, menuMembers] = await Promise.all([
    query<{ role_id: number; agent_id: number }>(
      "SELECT role_id, agent_id FROM agent_role_members"
    ),
    query<{ role_id: number; menu_key: string }>(
      "SELECT role_id, menu_key FROM agent_role_menu_members"
    )
  ]);

  const roleMap = new Map<
    number,
    { id: number; name: string; agentIds: number[]; menuKeys: string[] }
  >();
  for (const role of roles) {
    roleMap.set(role.id, {
      id: role.id,
      name: role.name,
      agentIds: [],
      menuKeys: []
    });
  }
  for (const member of members) {
    const role = roleMap.get(member.role_id);
    if (role) {
      role.agentIds.push(member.agent_id);
    }
  }
  for (const member of menuMembers) {
    const role = roleMap.get(member.role_id);
    if (role) {
      role.menuKeys.push(member.menu_key);
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
  const menuKeys = Array.isArray(body.menuKeys)
    ? Array.from(
        new Set(
          body.menuKeys
            .map((key: any) => String(key ?? "").trim())
            .filter((key: string) => !!key)
        )
      )
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
  if (menuKeys.length > 0) {
    const values: any[] = [];
    const placeholders: string[] = [];
    for (const menuKey of menuKeys) {
      placeholders.push("(?, ?)");
      values.push(roleId, menuKey);
    }
    await query(
      `INSERT INTO agent_role_menu_members (role_id, menu_key) VALUES ${placeholders.join(
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
      agentIds,
      menuKeys
    }
  });

  return new NextResponse(null, { status: 201 });
}

export async function PUT(request: Request) {
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
  const roleId = Number(body.id);
  const name = String(body.name ?? "").trim();
  const agentIds = Array.isArray(body.agentIds)
    ? Array.from(
        new Set(
          body.agentIds
            .map((id: any) => Number(id))
            .filter((id: number) => id > 0)
        )
      )
    : [];
  const menuKeys = Array.isArray(body.menuKeys)
    ? Array.from(
        new Set(
          body.menuKeys
            .map((key: any) => String(key ?? "").trim())
            .filter((key: string) => !!key)
        )
      )
    : [];

  if (!Number.isFinite(roleId) || roleId <= 0) {
    return new NextResponse("角色 ID 不合法", { status: 400 });
  }
  if (!name) {
    return new NextResponse("角色名称不能为空", { status: 400 });
  }
  if (agentIds.length === 0) {
    return new NextResponse("请至少选择一个智能体", { status: 400 });
  }

  const exists = await query<{ id: number }>(
    "SELECT id FROM agent_roles WHERE id = ? LIMIT 1",
    [roleId]
  );
  if (exists.length === 0) {
    return new NextResponse("Not found", { status: 404 });
  }

  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    await conn.query("UPDATE agent_roles SET name = ? WHERE id = ?", [
      name,
      roleId
    ]);
    await conn.query("DELETE FROM agent_role_members WHERE role_id = ?", [
      roleId
    ]);
    await conn.query("DELETE FROM agent_role_menu_members WHERE role_id = ?", [
      roleId
    ]);

    const values: any[] = [];
    const placeholders: string[] = [];
    for (const agentId of agentIds) {
      placeholders.push("(?, ?)");
      values.push(roleId, agentId);
    }
    await conn.query(
      `INSERT INTO agent_role_members (role_id, agent_id) VALUES ${placeholders.join(
        ", "
      )}`,
      values
    );
    if (menuKeys.length > 0) {
      const menuValues: any[] = [];
      const menuPlaceholders: string[] = [];
      for (const menuKey of menuKeys) {
        menuPlaceholders.push("(?, ?)");
        menuValues.push(roleId, menuKey);
      }
      await conn.query(
        `INSERT INTO agent_role_menu_members (role_id, menu_key) VALUES ${menuPlaceholders.join(
          ", "
        )}`,
        menuValues
      );
    }
    await conn.commit();
  } catch (e) {
    try {
      await conn.rollback();
    } catch {}
    throw e;
  } finally {
    conn.release();
  }

  await logOperation({
    userId,
    action: "update_agent_role",
    targetType: "agent_role",
    targetId: roleId,
    metadata: {
      name,
      agentIds,
      menuKeys
    }
  });

  return new NextResponse(null, { status: 204 });
}

export async function DELETE(request: Request) {
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
  const roleId = Number(body.id);
  if (!Number.isFinite(roleId) || roleId <= 0) {
    return new NextResponse("角色 ID 不合法", { status: 400 });
  }

  const exists = await query<{ id: number }>(
    "SELECT id FROM agent_roles WHERE id = ? LIMIT 1",
    [roleId]
  );
  if (exists.length === 0) {
    return new NextResponse("Not found", { status: 404 });
  }

  const used = await query<{ cnt: number }>(
    "SELECT COUNT(*) AS cnt FROM user_agent_roles WHERE role_id = ?",
    [roleId]
  );
  if ((used[0]?.cnt ?? 0) > 0) {
    return new NextResponse("该角色已被用户使用，无法删除", { status: 400 });
  }

  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    await conn.query("DELETE FROM agent_role_members WHERE role_id = ?", [
      roleId
    ]);
    await conn.query("DELETE FROM agent_role_menu_members WHERE role_id = ?", [
      roleId
    ]);
    await conn.query("DELETE FROM agent_roles WHERE id = ?", [roleId]);
    await conn.commit();
  } catch (e) {
    try {
      await conn.rollback();
    } catch {}
    throw e;
  } finally {
    conn.release();
  }

  await logOperation({
    userId,
    action: "delete_agent_role",
    targetType: "agent_role",
    targetId: roleId
  });

  return new NextResponse(null, { status: 204 });
}
