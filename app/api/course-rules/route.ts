import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const rules = await query("SELECT * FROM course_rules ORDER BY created_at DESC");
    return NextResponse.json(rules);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, lesson_count, rule_content } = await request.json();
    if (!name || !lesson_count || !rule_content) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    await query(
      "INSERT INTO course_rules (name, lesson_count, rule_content) VALUES (?, ?, ?)",
      [name, lesson_count, rule_content]
    );
    return NextResponse.json({ message: "Course rule created successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
