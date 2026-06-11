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
  const pageParam = Number(searchParams.get("page") ?? "1");
  const pageSizeParam = Number(searchParams.get("pageSize") ?? "100");
  const userKeyword = String(searchParams.get("user") ?? "").trim();
  const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1;
  const pageSize =
    Number.isFinite(pageSizeParam) && pageSizeParam > 0
      ? Math.min(Math.floor(pageSizeParam), 200)
      : 100;
  const offset = (page - 1) * pageSize;
  const whereClause = userKeyword ? "WHERE u.username LIKE ?" : "";
  const queryParams = userKeyword ? [`%${userKeyword}%`] : [];

  const [rows, totalRows] = await Promise.all([
    query(
      `SELECT l.id, l.user_id, u.username, l.action, l.target_type, l.target_id, l.metadata, l.created_at
       FROM operation_logs l
       LEFT JOIN users u ON l.user_id = u.id
       ${whereClause}
       ORDER BY l.id DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, pageSize, offset]
    ),
    query<{ total: number }>(
      `SELECT COUNT(*) AS total
       FROM operation_logs l
       LEFT JOIN users u ON l.user_id = u.id
       ${whereClause}`,
      queryParams
    )
  ]);

  const total = Number((totalRows[0] as any)?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return NextResponse.json({
    items: rows,
    total,
    page,
    pageSize,
    totalPages
  });
}
