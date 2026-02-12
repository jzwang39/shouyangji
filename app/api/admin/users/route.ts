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
  const rows = await query(
    "SELECT id, username, role, is_active, is_deleted, created_at FROM users ORDER BY id ASC"
  );
  return NextResponse.json(rows);
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
  const username = String(body.username ?? "").trim();
  const password = String(body.password ?? "").trim();
  const role = String(body.role ?? "user") as
    | "super_admin"
    | "admin"
    | "user";
  if (!username || !password) {
    return new NextResponse("用户名和密码不能为空", { status: 400 });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  try {
    await query(
      "INSERT INTO users (username, password_hash, role, is_active, is_deleted) VALUES (?, ?, ?, 1, 0)",
      [username, passwordHash, role]
    );
  } catch (error: any) {
    if (error.code === "ER_DUP_ENTRY") {
      return new NextResponse("用户名已存在", { status: 400 });
    }
    throw error;
  }
  await logOperation({
    userId,
    action: "create_user",
    metadata: { username, role }
  });
  return new NextResponse(null, { status: 201 });
}

