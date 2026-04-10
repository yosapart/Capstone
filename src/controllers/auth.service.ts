import { NextResponse } from "next/server";
import { loginUser } from "@/services/auth.service";
import { registerUser } from "@/services/auth.service";
import { z } from "zod";


const registerSchema = z
  .object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password ไม่ตรงกัน",
    path: ["confirmPassword"],
  });

export async function registerController(req: Request) {
  try {
    const body = await req.json();

    // 🔥 validate
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    const result = await registerUser({ name, email, password });

    return NextResponse.json(result);

  } catch (error: any) {

    if (error.message === "EMAIL_EXISTS") {
      return NextResponse.json(
        { message: "Email นี้ถูกใช้แล้ว" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "เกิดข้อผิดพลาด" },
      { status: 500 }
    );
  }
}


export async function loginController(req: Request) {
  try {
    const { email, password } = await req.json();

    const result = await loginUser(email, password);

    return NextResponse.json({
      message: "login สำเร็จ",
      ...result,
    });

  } catch (error: any) {

    if (error.message === "USER_NOT_FOUND") {
      return NextResponse.json(
        { message: "ไม่พบ user" },
        { status: 404 }
      );
    }

    if (error.message === "INVALID_PASSWORD") {
      return NextResponse.json(
        { message: "รหัสผ่านผิด" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { message: "error" },
      { status: 500 }
    );
  }
}