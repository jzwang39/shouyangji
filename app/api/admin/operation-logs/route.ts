import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

function assertAdmin(session: any) {
  const role = (session.user as any).role;
  if (role !== "admin" && role !== "super_admin") {
    throw new Error("Forbidden");
  }
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  try {
    assertAdmin(session);
  } catch {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Math.min(Number(limitParam), 200) : 100;
  const rows = await query(
    "SELECT l.id, l.user_id, u.username, l.action, l.target_type, l.target_id, l.metadata, l.created_at FROM operation_logs l LEFT JOIN users u ON l.user_id = u.id ORDER BY l.id DESC LIMIT ?",
    [limit]
  );
  return NextResponse.json(rows);
}

