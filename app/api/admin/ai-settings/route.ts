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
  const rows = await query(
    "SELECT id, model_name, api_key, theme, updated_at FROM ai_settings ORDER BY id DESC LIMIT 1"
  );
  if (rows.length === 0) {
    return NextResponse.json(null);
  }
  const setting = rows[0] as {
    id: number;
    model_name: string;
    api_key: string;
    theme: string;
    updated_at: string;
  };
  return NextResponse.json({
    id: setting.id,
    modelName: setting.model_name,
    apiKey: setting.api_key,
    theme: setting.theme,
    updatedAt: setting.updated_at
  });
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
  const modelName = String(body.modelName ?? "").trim();
  const apiKey = String(body.apiKey ?? "").trim();
  const theme = String(body.theme ?? "blue").trim();
  
  if (!modelName || !apiKey) {
    return new NextResponse("模型名称和 API Key 不能为空", { status: 400 });
  }
  await query(
    "INSERT INTO ai_settings (model_name, api_key, theme, updated_by_user_id) VALUES (?, ?, ?, ?)",
    [modelName, apiKey, theme, userId]
  );
  await logOperation({
    userId,
    action: "update_ai_settings"
  });
  return new NextResponse(null, { status: 204 });
}

