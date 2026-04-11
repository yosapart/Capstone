import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { signToken } from "@/lib/authTokens";
import { z } from "zod";

const verifySchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6, "OTP ต้องมี 6 หลัก"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = verifySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }

    const { email, otp } = parsed.data;

    // 1. ตรวจสอบในตาราง otps ว่ามีรหัสตรงกับอีเมลนี้หรือไม่
    const { data: records, error } = await supabase
      .from("otps")
      .select("*")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error || !records || records.length === 0) {
      return NextResponse.json({ message: "ไม่พบรหัส OTP โปรดล็อกอินใหม่" }, { status: 400 });
    }

    const latestOtp = records[0];

    // 2. ตรวจสอบว่า OTP ตรงกันหรือไม่
    if (latestOtp.otp !== otp) {
      return NextResponse.json({ message: "รหัส OTP ไม่ถูกต้อง" }, { status: 400 });
    }

    // 3. ตรวจสอบว่า OTP หมดอายุหรือยัง
    const now = new Date();
    const expiresAt = new Date(latestOtp.expires_at);
    if (now > expiresAt) {
      return NextResponse.json({ message: "รหัส OTP หมดอายุแล้ว โปรดล็อกอินใหม่" }, { status: 400 });
    }

    // 4. OTP ถูกต้อง! ลบ OTP เก่าทิ้งเพื่อความปลอดภัย
    await supabase.from("otps").delete().eq("email", email);

    // 5. ดึงข้อมูล User จากตาราง users
    const { data: users, error: userError } = await supabase
      .from("users")
      .select("user_id, name, email")
      .eq("email", email)
      .limit(1);

    if (userError || !users || users.length === 0) {
       return NextResponse.json({ message: "ไม่พบข้อมูลผู้ใช้ในระบบ" }, { status: 404 });
    }

    const user = users[0];

    // 6. ออก JWT Token จริง
    const token = await signToken({ user_id: user.user_id, email: user.email });

    const res = NextResponse.json({
      message: "ยืนยัน OTP ล็อกอินสำเร็จ",
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
      }
    });

    // 7. ตั้งค่า HTTPOnly Cookie
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

  } catch (error) {
    console.error("Verify OTP Error:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาดในการตรวจสอบ OTP" }, { status: 500 });
  }
}
