import { NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { z } from "zod";

// Schema สำหรับ POST
const flowSchema = z.object({
  project_id: z.number({
    error: "Project ID ต้องเป็นตัวเลข",
  }),
  name: z.string().min(1, "Name ของ Flow ต้องไม่ว่าง"),
});

// GET → ดึง flow ทั้งหมด
export async function GET() {
  try {
    const [rows]: any = await db.query("SELECT * FROM Flows");
    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// POST → สร้าง flow
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate
    const parsed = flowSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });
    }

    const { project_id, name } = parsed.data;

    // เช็คว่า project_id มีอยู่จริงใน Projects
    const [project]: any = await db.query("SELECT * FROM Projects WHERE project_id = ?", [project_id]);
    if (project.length === 0) {
      return NextResponse.json({ message: "Project ไม่พบในระบบ" }, { status: 400 });
    }

    // Insert
    await db.query(
      "INSERT INTO Flows (project_id, name) VALUES (?, ?)",
      [project_id, name]
    );

    return NextResponse.json({ message: "สร้าง Flow สำเร็จ" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}