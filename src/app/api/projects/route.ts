import { NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { z } from "zod";


// Schema สำหรับ POST
const projectSchema = z.object({
    user_id: z.number({ error: "User ID ต้องเป็นตัวเลข" }),
    name: z.string().min(1, "Name ของ Project ต้องไม่ว่าง"),
    description: z.string().optional(),
});

// GET → ดึง project ทั้งหมด
export async function GET() {
    try {
        const [rows]: any = await db.query("SELECT * FROM Projects");
        return NextResponse.json(rows);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
    }
}

// POST → สร้าง project
export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Validate
        const parsed = projectSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });
        }

        const { user_id, name, description } = parsed.data;

        // เช็คว่า user_id มีอยู่จริงใน Users
        const [user]: any = await db.query("SELECT * FROM Users WHERE user_id = ?", [user_id]);
        if (user.length === 0) {
            return NextResponse.json({ message: "User ไม่พบในระบบ" }, { status: 400 });
        }

        // Insert
        await db.query(
            "INSERT INTO Projects (user_id, name, description) VALUES (?, ?, ?)",
            [user_id, name, description || ""]
        );

        return NextResponse.json({ message: "สร้าง Project สำเร็จ" });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
    }
}