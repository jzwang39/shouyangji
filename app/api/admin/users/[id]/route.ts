import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { logOperation } from "@/lib/operations";

function assertAdmin(session: any) {
  const role = (session.user as any).role;
  if (role !== "admin" && role !== "super_admin") {
    throw new Error("Forbidden");
  }
}

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
  try {
    assertAdmin(session);
  } catch {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const currentUserId = Number((session.user as any).id);
  const currentUserRole = String((session.user as any).role);
  const targetId = Number(context.params.id);
  const body = await request.json();

  const rows = await query(
    "SELECT id, role FROM users WHERE id = ? LIMIT 1",
    [targetId]
  );
  if (rows.length === 0) {
    return new NextResponse("Not found", { status: 404 });
  }
  const target = rows[0] as { id: number; role: string };
  if (target.role === "super_admin" && currentUserId !== target.id) {
    return new NextResponse("无法修改超级管理员", { status: 400 });
  }

  const fields: string[] = [];
  const values: any[] = [];

  if (body.role) {
    const newRole = String(body.role);
    if (target.role === "super_admin") {
      return new NextResponse("无法修改超级管理员角色", { status: 400 });
    }
    if (currentUserRole === "admin") {
      if (target.role !== "user") {
        return new NextResponse("管理员只能修改使用者权限", { status: 400 });
      }
      if (newRole === "super_admin") {
        return new NextResponse("管理员不能设置超级管理员权限", { status: 400 });
      }
      if (newRole !== "user" && newRole !== "admin") {
        return new NextResponse("非法的权限变更", { status: 400 });
      }
    }
    if (currentUserRole === "super_admin") {
      if (newRole === "super_admin" && target.id !== currentUserId) {
        return new NextResponse("只能将自己设置为超级管理员", { status: 400 });
      }
    }
    fields.push("role = ?");
    values.push(newRole);
  }

  if (typeof body.isActive === "boolean") {
    fields.push("is_active = ?");
    values.push(body.isActive ? 1 : 0);
  }

  if (body.password) {
    const passwordHash = await bcrypt.hash(String(body.password), 10);
    fields.push("password_hash = ?");
    values.push(passwordHash);
  }

  if (fields.length === 0) {
    return new NextResponse(null, { status: 204 });
  }

  values.push(targetId);
  await query(
    `UPDATE users SET ${fields.join(", ")}, updated_at = NOW() WHERE id = ?`,
    values
  );

  await logOperation({
    userId: currentUserId,
    action: "update_user",
    targetType: "user",
    targetId
  });

  return new NextResponse(null, { status: 204 });
}

export async function DELETE(_request: Request, context: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  try {
    assertAdmin(session);
  } catch {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const currentUserId = Number((session.user as any).id);
  const currentUserRole = String((session.user as any).role);
  const targetId = Number(context.params.id);

  const rows = await query(
    "SELECT id, role FROM users WHERE id = ? LIMIT 1",
    [targetId]
  );
  if (rows.length === 0) {
    return new NextResponse("Not found", { status: 404 });
  }
  const target = rows[0] as { id: number; role: string };
  if (target.role === "super_admin") {
    return new NextResponse("无法删除超级管理员", { status: 400 });
  }
  if (currentUserRole === "admin" && target.role === "admin") {
    return new NextResponse("管理员不能删除管理员或超级管理员", { status: 400 });
  }

  await query(
    "UPDATE users SET is_deleted = 1, is_active = 0, updated_at = NOW() WHERE id = ?",
    [targetId]
  );

  await logOperation({
    userId: currentUserId,
    action: "delete_user",
    targetType: "user",
    targetId
  });

  return new NextResponse(null, { status: 204 });
}
