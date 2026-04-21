import { NextResponse } from "next/server";
import { loginUser, registerUser, generateAndSendOtp, verifyOtp } from "@/services/auth.service";
import { registerSchema } from "@/lib/validators/auth";
import { z } from "zod";

const verifySchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6, "OTP ต้องมี 6 หลัก"),
});

// ========== Register ==========
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

    // 🔒 เช็คว่าเป็น gmail.com
    if (!email.endsWith("@gmail.com")) {
      return NextResponse.json(
        { message: "ระบบรองรับเฉพาะ @gmail.com เท่านั้น" },
        { status: 400 }
      );
    }

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

// ========== Login ==========
export async function loginController(req: Request) {
  try {
    const { email, password } = await req.json();

    // 1. ตรวจสอบรหัสผ่านพื้นฐาน
    const result = await loginUser(email, password);

    // 2. เช็คว่าเป็น gmail.com
    if (!result.user.email.endsWith("@gmail.com")) {
      return NextResponse.json({ message: "ระบบรองรับเฉพาะ @gmail.com เท่านั้น" }, { status: 400 });
    }

    // 3. สร้างและส่ง OTP
    await generateAndSendOtp(result.user.email);

    // 4. แจ้ง Frontend ว่าต้องกรอก OTP
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

    if (error.message === "OTP_CREATE_FAILED") {
      return NextResponse.json(
        { message: "ไม่สามารถสร้าง OTP ได้ กรุณาเชื่อมต่อ Database otps table" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "error" },
      { status: 500 }
    );
  }
}

// ========== Verify OTP ==========
export async function verifyOtpController(req: Request) {
  try {
    const body = await req.json();
    const parsed = verifySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }

    const { email, otp } = parsed.data;

    const { user, token } = await verifyOtp(email, otp);

    const res = NextResponse.json({
      message: "ยืนยัน OTP ล็อกอินสำเร็จ",
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
      }
    });

    // ตั้งค่า HTTPOnly Cookie
    res.cookies.set({
      name: "auth_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 // 1 วัน
    });

    return res;

  } catch (error: any) {
    console.error("Verify OTP Error:", error);

    if (error.message === "OTP_NOT_FOUND") {
      return NextResponse.json({ message: "ไม่พบรหัส OTP โปรดล็อกอินใหม่" }, { status: 400 });
    }
    if (error.message === "OTP_INVALID") {
      return NextResponse.json({ message: "รหัส OTP ไม่ถูกต้อง" }, { status: 400 });
    }
    if (error.message === "OTP_EXPIRED") {
      return NextResponse.json({ message: "รหัส OTP หมดอายุแล้ว โปรดล็อกอินใหม่" }, { status: 400 });
    }
    if (error.message === "USER_NOT_FOUND_AFTER_OTP") {
      return NextResponse.json({ message: "ไม่พบข้อมูลผู้ใช้ในระบบ" }, { status: 404 });
    }

    return NextResponse.json({ message: "เกิดข้อผิดพลาดในการตรวจสอบ OTP" }, { status: 500 });
  }
}
