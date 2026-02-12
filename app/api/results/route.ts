import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

type AgentResultRow = {
  id: number;
  product_name: string;
  agent_name: string;
  lesson_count: number;
  operator_user_id: number;
  operator_name: string;
  result_content: string;
  created_at: string;
  updated_at: string;
};

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const userId = Number((session.user as any).id);
  const url = new URL(request.url);
  const productName = url.searchParams.get("productName");
  const agentName = url.searchParams.get("agentName");
  const lessonCountRaw = url.searchParams.get("lessonCount");
  if (productName && agentName && lessonCountRaw !== null) {
    const lessonCount = Number(lessonCountRaw);
    if (!Number.isFinite(lessonCount) || lessonCount < 0) {
      return new NextResponse("课程节数必须为大于等于 0 的数字", {
        status: 400
      });
    }
    const rows = await query<AgentResultRow>(
      "SELECT id, product_name, agent_name, lesson_count, operator_user_id, operator_name, result_content, created_at, updated_at FROM agent_results WHERE product_name = ? AND agent_name = ? AND lesson_count = ? AND operator_user_id = ? LIMIT 1",
      [productName, agentName, lessonCount, userId]
    );
    if (!rows.length) {
      return NextResponse.json(null);
    }
    const row = rows[0];
    return NextResponse.json({
      id: row.id,
      productName: row.product_name,
      agentName: row.agent_name,
      lessonCount: row.lesson_count,
      operatorUserId: row.operator_user_id,
      operatorName: row.operator_name,
      resultContent: row.result_content,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }
  if (productName && agentName && lessonCountRaw === null) {
    const rows = await query<AgentResultRow>(
      "SELECT id, product_name, agent_name, lesson_count, operator_user_id, operator_name, result_content, created_at, updated_at FROM agent_results WHERE product_name = ? AND agent_name = ? AND operator_user_id = ? ORDER BY lesson_count ASC LIMIT 1",
      [productName, agentName, userId]
    );
    if (!rows.length) {
      return NextResponse.json(null);
    }
    const row = rows[0];
    return NextResponse.json({
      id: row.id,
      productName: row.product_name,
      agentName: row.agent_name,
      lessonCount: row.lesson_count,
      operatorUserId: row.operator_user_id,
      operatorName: row.operator_name,
      resultContent: row.result_content,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }
  const rows = await query<{ product_name: string }>(
    "SELECT DISTINCT product_name FROM agent_results ORDER BY product_name ASC"
  );
  const names = rows
    .map((row) => row.product_name)
    .filter((name) => !!name);
  return NextResponse.json(names);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const userId = Number((session.user as any).id);
  const operatorName = String((session.user as any).name ?? "");
  const body = await request.json();
  const productName = String(body.productName ?? "").trim();
  const agentName = String(body.agentName ?? "").trim();
  const lessonCountRaw = body.lessonCount;
  const resultContent = String(body.resultContent ?? "").trim();
  if (!productName) {
    return new NextResponse("产品名称不能为空", { status: 400 });
  }
  if (!agentName) {
    return new NextResponse("智能体名称不能为空", { status: 400 });
  }
  const lessonCount = Number(lessonCountRaw);
  if (!Number.isFinite(lessonCount) || lessonCount < 0) {
    return new NextResponse("课程节数必须为大于等于 0 的数字", {
      status: 400
    });
  }
  if (!resultContent) {
    return new NextResponse("结果内容不能为空", { status: 400 });
  }
  try {
    await query(
      "INSERT INTO agent_results (product_name, agent_name, lesson_count, operator_user_id, operator_name, result_content) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE result_content = VALUES(result_content), operator_user_id = VALUES(operator_user_id), operator_name = VALUES(operator_name), updated_at = CURRENT_TIMESTAMP",
      [
        productName,
        agentName,
        lessonCount,
        userId,
        operatorName || productName,
        resultContent
      ]
    );
    const rows = await query<AgentResultRow>(
      "SELECT id, product_name, agent_name, lesson_count, operator_user_id, operator_name, result_content, created_at, updated_at FROM agent_results WHERE product_name = ? AND agent_name = ? AND lesson_count = ? AND operator_user_id = ? LIMIT 1",
      [productName, agentName, lessonCount, userId]
    );
    const row = rows[0];
    return NextResponse.json({
      id: row.id,
      productName: row.product_name,
      agentName: row.agent_name,
      lessonCount: row.lesson_count,
      operatorUserId: row.operator_user_id,
      operatorName: row.operator_name,
      resultContent: row.result_content,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  } catch (e: any) {
    const message =
      typeof e?.message === "string" && e.message
        ? e.message
        : "保存结果失败";
    return new NextResponse(message, { status: 500 });
  }
}
