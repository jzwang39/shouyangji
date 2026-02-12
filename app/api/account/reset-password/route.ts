import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import { logOperation } from "@/lib/operations";

export async function POST(request: Request) {
  const body = await request.json();
  const username = String(body.username ?? "").trim();
  const newPassword = String(body.newPassword ?? "");
  const token = String(body.token ?? "");
  if (!username || !newPassword || !token) {
    return new NextResponse("参数不完整", { status: 400 });
  }
  const secret = process.env.RESET_PASSWORD_TOKEN;
  if (!secret || token !== secret) {
    return new NextResponse("重置令牌无效", { status: 403 });
  }
  const rows = await query(
    "SELECT id FROM users WHERE username = ? AND is_deleted = 0 LIMIT 1",
    [username]
  );
  if (rows.length === 0) {
    return new NextResponse("用户不存在", { status: 404 });
  }
  const user = rows[0] as { id: number };
  const hash = await bcrypt.hash(newPassword, 10);
  await query("UPDATE users SET password_hash = ? WHERE id = ?", [
    hash,
    user.id
  ]);
  await logOperation({
    userId: user.id,
    action: "reset_password_by_token"
  });
  return new NextResponse(null, { status: 204 });
}

