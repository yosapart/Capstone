import { NextResponse } from "next/server";
import { loginUser } from "@/services/auth.service";
import { registerUser } from "@/services/auth.service";
import { z } from "zod";


const registerSchema = z
  .object({
    name: z.string().min(2),
    email: z.string().email().refine((val) => val.endsWith("@gmail.com"), {
      message: "รองรับเฉพาะอีเมล @gmail.com เท่านั้น",
    }),
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


import { signToken } from "@/lib/authTokens";
import { supabase } from "@/lib/db";
import { sendOtpEmail } from "@/lib/mailer";

export async function loginController(req: Request) {
  try {
    const { email, password } = await req.json();

    // 1. ตรวจสอบรหัสผ่านพื้นฐาน
    const result = await loginUser(email, password);

    // 2. ถ้าผู้ใช้นี้ไม่ใช่ gmail.com จะบล็อกการส่ง OTP ไหม? 
    // ถ้าอยากบังคับแบบเข้มงวดให้ใช้เฉพาะ gmail:
    if (!result.user.email.endsWith("@gmail.com")) {
      return NextResponse.json({ message: "ระบบรองรับเฉพาะ @gmail.com เท่านั้น" }, { status: 400 });
    }

    // 3. สร้าง OTP 6 หลัก
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // 4. บันทึก OTP ลง Database Supabase Table 'otps' (ตั้งหมดอายุอีก 5 นาที)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    const { error: otpError } = await supabase.from("otps").insert([
      {
        email: result.user.email,
        otp: otpCode,
        expires_at: expiresAt.toISOString(),
      }
    ]);

    if (otpError) {
      console.error("OTP Error:", otpError);
      return NextResponse.json({ message: "ไม่สามารถสร้าง OTP ได้ กรุณาเชื่อมต่อ Database otps table" }, { status: 500 });
    }

    // 5. ส่ง OTP ผ่าน Email
    await sendOtpEmail(result.user.email, otpCode);

    // 6. แจ้ง Frontend ว่าต้องกรอก OTP ชั่วคราว แทนที่จะส่ง JWT ทันที
    return NextResponse.json({
      message: "รหัสผ่านถูกต้อง กรุณาเช็ค OTP ในอีเมลของคุณ",
      requiresOtp: true,
      email: result.user.email
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