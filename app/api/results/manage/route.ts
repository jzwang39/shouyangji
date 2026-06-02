import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { canUserAccessSpecialMenu } from "@/lib/chat";

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

const PRODUCT_ONE_PAGER_AGENT_NAME = "产品一页纸「单一产品」";
const PRODUCT_ONE_PAGER_AGENT_NAME_ALIASES = [
  PRODUCT_ONE_PAGER_AGENT_NAME,
  "产品一页纸"
];
const COURSE_OUTLINE_AGENT_NAME = "课纲助手「单一产品」";
const COURSE_OUTLINE_AGENT_NAME_ALIASES = [
  COURSE_OUTLINE_AGENT_NAME,
  "课纲助手",
  "课纲"
];

function normalizeAgentNameForDisplay(agentName: string) {
  if (PRODUCT_ONE_PAGER_AGENT_NAME_ALIASES.includes(agentName)) {
    return PRODUCT_ONE_PAGER_AGENT_NAME;
  }
  if (COURSE_OUTLINE_AGENT_NAME_ALIASES.includes(agentName)) {
    return COURSE_OUTLINE_AGENT_NAME;
  }
  return agentName;
}

function canViewAll(role: string) {
  return role === "admin" || role === "super_admin";
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const userId = Number((session.user as any).id);
  const userRole = String((session.user as any).role ?? "");
  const hasAccess = await canUserAccessSpecialMenu(
    userId,
    userRole,
    "data-management"
  );
  if (!hasAccess) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const allowAll = canViewAll(userRole);
  const url = new URL(request.url);
  const productName = String(url.searchParams.get("productName") ?? "").trim();
  const operatorName = String(url.searchParams.get("operatorName") ?? "").trim();
  const agentName = String(url.searchParams.get("agentName") ?? "").trim();

  const conditions: string[] = [];
  const params: Array<string | number> = [];

  if (!allowAll) {
    conditions.push("operator_user_id = ?");
    params.push(userId);
  }
  if (productName) {
    conditions.push("product_name LIKE ?");
    params.push(`%${productName}%`);
  }
  if (operatorName) {
    conditions.push("operator_name LIKE ?");
    params.push(`%${operatorName}%`);
  }
  if (agentName) {
    if (PRODUCT_ONE_PAGER_AGENT_NAME_ALIASES.includes(agentName)) {
      conditions.push(
        `agent_name IN (${PRODUCT_ONE_PAGER_AGENT_NAME_ALIASES.map(() => "?").join(", ")})`
      );
      params.push(...PRODUCT_ONE_PAGER_AGENT_NAME_ALIASES);
    } else if (COURSE_OUTLINE_AGENT_NAME_ALIASES.includes(agentName)) {
      conditions.push(
        `agent_name IN (${COURSE_OUTLINE_AGENT_NAME_ALIASES.map(() => "?").join(", ")})`
      );
      params.push(...COURSE_OUTLINE_AGENT_NAME_ALIASES);
    } else {
      conditions.push("agent_name LIKE ?");
      params.push(`%${agentName}%`);
    }
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = await query<AgentResultRow>(
    `SELECT id, product_name, agent_name, lesson_count, operator_user_id, operator_name, result_content, created_at, updated_at
     FROM agent_results
     ${whereClause}
     ORDER BY updated_at DESC, id DESC
     LIMIT 300`,
    params
  );

  return NextResponse.json(
    rows.map((row) => ({
      id: row.id,
      productName: row.product_name,
      agentName: normalizeAgentNameForDisplay(row.agent_name),
      lessonCount: row.lesson_count,
      operatorUserId: row.operator_user_id,
      operatorName: row.operator_name,
      resultContent: row.result_content,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }))
  );
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const userId = Number((session.user as any).id);
  const userRole = String((session.user as any).role ?? "");
  const hasAccess = await canUserAccessSpecialMenu(
    userId,
    userRole,
    "data-management"
  );
  if (!hasAccess) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const allowAll = canViewAll(userRole);
  const body = await request.json();
  const id = Number(body.id);
  const resultContent = String(body.resultContent ?? "").trim();

  if (!Number.isFinite(id) || id <= 0) {
    return new NextResponse("数据 ID 无效", { status: 400 });
  }
  if (!resultContent) {
    return new NextResponse("结果内容不能为空", { status: 400 });
  }

  const ownershipCondition = allowAll ? "" : " AND operator_user_id = ?";
  const ownershipParams = allowAll ? [id] : [id, userId];
  const existingRows = await query<AgentResultRow>(
    `SELECT id, product_name, agent_name, lesson_count, operator_user_id, operator_name, result_content, created_at, updated_at
     FROM agent_results
     WHERE id = ?${ownershipCondition}
     LIMIT 1`,
    ownershipParams
  );

  if (!existingRows.length) {
    return new NextResponse("结果数据不存在或无权限修改", { status: 404 });
  }

  await query(
    "UPDATE agent_results SET result_content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [resultContent, id]
  );

  const rows = await query<AgentResultRow>(
    `SELECT id, product_name, agent_name, lesson_count, operator_user_id, operator_name, result_content, created_at, updated_at
     FROM agent_results
     WHERE id = ?
     LIMIT 1`,
    [id]
  );
  const row = rows[0];

  return NextResponse.json({
    id: row.id,
    productName: row.product_name,
    agentName: normalizeAgentNameForDisplay(row.agent_name),
    lessonCount: row.lesson_count,
    operatorUserId: row.operator_user_id,
    operatorName: row.operator_name,
    resultContent: row.result_content,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  });
}
