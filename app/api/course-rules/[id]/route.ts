import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const { name, lesson_count, rule_content } = await request.json();
    if (!name || !lesson_count || !rule_content) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    await query(
      "UPDATE course_rules SET name = ?, lesson_count = ?, rule_content = ? WHERE id = ?",
      [name, lesson_count, rule_content, id]
    );
    return NextResponse.json({ message: "Course rule updated successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    await query("DELETE FROM course_rules WHERE id = ?", [id]);
    return NextResponse.json({ message: "Course rule deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
