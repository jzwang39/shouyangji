import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logOperation } from "@/lib/operations";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const userId = Number((session.user as any).id);
  const body = await request.json();
  await logOperation({
    userId,
    action: String(body.action),
    targetType: body.targetType ? String(body.targetType) : undefined,
    targetId:
      typeof body.targetId === "number"
        ? body.targetId
        : body.targetId
        ? Number(body.targetId)
        : undefined,
    metadata: body.metadata
  });
  return new NextResponse(null, { status: 204 });
}

