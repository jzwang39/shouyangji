import { query } from "@/lib/db";

export async function logOperation(options: {
  userId: number | null;
  action: string;
  targetType?: string;
  targetId?: number | null;
  metadata?: unknown;
}) {
  const { userId, action, targetType, targetId, metadata } = options;
  await query(
    "INSERT INTO operation_logs (user_id, action, target_type, target_id, metadata) VALUES (?, ?, ?, ?, ?)",
    [
      userId,
      action,
      targetType ?? null,
      targetId ?? null,
      metadata ? JSON.stringify(metadata) : null
    ]
  );
}

