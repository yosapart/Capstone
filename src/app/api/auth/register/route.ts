import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

// 1️⃣ สร้าง schema สำหรับ validate
const registerSchema = z
  .object({
    name: z.string().min(2, "Name ต้องมีอย่างน้อย 2 ตัวอักษร"),
    email: z.string().email("รูปแบบ email ไม่ถูกต้อง"),
    password: z.string().min(6, "Password ต้องมีอย่างน้อย 6 ตัวอักษร"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password กับ Confirm Password ต้องตรงกัน",
    path: ["confirmPassword"],
  });

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 2️⃣ validate ด้วย Zod
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    // 3️⃣ เช็ค email ซ้ำใน DB
    const { data: existing, error: existingError } = await supabase.from("users").select("*").eq("email", email);
    if (existingError) throw existingError;

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { message: "Email นี้ถูกใช้แล้ว" },
        { status: 400 }
      );
    }

    // 4️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5️⃣ Insert user
    const { error: insertError } = await supabase.from("users").insert([
      { name, email, password: hashedPassword }
    ]);
    if (insertError) throw insertError;

    return NextResponse.json({ message: "สมัครสำเร็จ" });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาด" },
      { status: 500 }
    );
  }
}