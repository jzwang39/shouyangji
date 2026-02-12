import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { logOperation } from "@/lib/operations";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const userId = Number((session.user as any).id);
  const body = await request.json();
  const oldPassword = String(body.oldPassword ?? "");
  const newPassword = String(body.newPassword ?? "");
  if (!oldPassword || !newPassword) {
    return new NextResponse("密码不能为空", { status: 400 });
  }
  const rows = await query(
    "SELECT id, password_hash FROM users WHERE id = ? LIMIT 1",
    [userId]
  );
  if (rows.length === 0) {
    return new NextResponse("用户不存在", { status: 404 });
  }
  const user = rows[0] as { id: number; password_hash: string };
  const ok = await bcrypt.compare(oldPassword, user.password_hash);
  if (!ok) {
    return new NextResponse("原密码错误", { status: 400 });
  }
  const newHash = await bcrypt.hash(newPassword, 10);
  await query("UPDATE users SET password_hash = ? WHERE id = ?", [
    newHash,
    userId
  ]);
  await logOperation({
    userId,
    action: "change_password"
  });
  return new NextResponse(null, { status: 204 });
}

