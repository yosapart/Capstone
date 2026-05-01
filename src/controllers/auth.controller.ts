import { NextResponse } from "next/server";
import { loginUser, registerUser, generateAndSendOtp, verifyOtp } from "@/services/auth.service";
import { registerSchema } from "@/lib/validators/auth";
import { z } from "zod";

const verifySchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6, "The OTP must be 6 digits."),
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

    //เช็คว่าเป็น gmail.com
    if (!email.endsWith("@gmail.com")) {
      return NextResponse.json(
        { message: "Only @gmail.com addresses are supported." },
        { status: 400 }
      );
    }

    const result = await registerUser({ name, email, password });

    return NextResponse.json(result);

  } catch (error: any) {

    if (error.message === "EMAIL_EXISTS") {
      return NextResponse.json(
        { message: "This email has already been taken." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "An error has occurred." },
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
      return NextResponse.json({ message: "Only @gmail.com addresses are supported." }, { status: 400 });
    }

    // 3. สร้างและส่ง OTP
    await generateAndSendOtp(result.user.email);

    // 4. แจ้ง Frontend ว่าต้องกรอก OTP
    return NextResponse.json({
      message: "Password verified. Please check your email for the OTP code.",
      requiresOtp: true,
      email: result.user.email
    });

  } catch (error: any) {

    if (error.message === "USER_NOT_FOUND") {
      return NextResponse.json(
        { message: "User not found." },
        { status: 404 }
      );
    }

    if (error.message === "INVALID_PASSWORD") {
      return NextResponse.json(
        { message: "Incorrect password." },
        { status: 401 }
      );
    }

    if (error.message === "OTP_CREATE_FAILED") {
      return NextResponse.json(
        { message: "Failed to create OTP. Please check the connection to the \"otps\" table." },
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
      return NextResponse.json({ message: "Invalid data." }, { status: 400 });
    }

    const { email, otp } = parsed.data;

    const { user, token } = await verifyOtp(email, otp);

    const res = NextResponse.json({
      message: "OTP verified. Login successful.",
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
      }
    });

    // ตั้งค่า HTTPOnly Cookie ให้เป็น Session Cookie (หายไปเมื่อปิดเบราว์เซอร์)
    res.cookies.set({
      name: "auth_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    return res;

  } catch (error: any) {
    console.error("Verify OTP Error:", error);

    if (error.message === "OTP_NOT_FOUND") {
      return NextResponse.json({ message: "OTP not found. Please log in again." }, { status: 400 });
    }
    if (error.message === "OTP_INVALID") {
      return NextResponse.json({ message: "Invalid OTP." }, { status: 400 });
    }
    if (error.message === "OTP_EXPIRED") {
      return NextResponse.json({ message: "OTP has expired. Please log in again." }, { status: 400 });
    }
    if (error.message === "USER_NOT_FOUND_AFTER_OTP") {
      return NextResponse.json({ message: "User data not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "An error occurred while verifying OTP." }, { status: 500 });
  }
}
