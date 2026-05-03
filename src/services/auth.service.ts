import { supabase } from "@/lib/db";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/authTokens";
import { sendOtpEmail } from "@/lib/mailer";

// ========== Login ==========
export async function loginUser(email: string, password: string) {
  const { data: rows, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email);

  if (error) throw error;

  if (!rows || rows.length === 0) {
    throw new Error("USER_NOT_FOUND");
  }

  const user = rows[0];

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new Error("INVALID_PASSWORD");
  }

  return {
    user: {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
    },
  };
}

// ========== Register ==========
export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
}) {
  const { name, email, password } = data;

  // 🔍 เช็ค email ซ้ำ
  const { data: existing, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email);

  if (error) throw error;

  if (existing && existing.length > 0) {
    throw new Error("EMAIL_EXISTS");
  }

  // 🔐 hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // 📧 แทนที่จะ insert ทันที ให้ส่ง OTP และเก็บข้อมูลไว้ใน metadata แทน
  await generateAndSendOtp(email, { name, hashedPassword });

  return {
    message: "กรุณาตรวจสอบ OTP ในอีเมลของคุณเพื่อยืนยันการสมัคร",
    requiresOtp: true,
    email
  };
}

// ========== Generate & Send OTP ==========
export async function generateAndSendOtp(email: string, metadata: any = null) {
  // 1. ลบ OTP เก่าของอีเมลนี้ทิ้งก่อน (ป้องกันการนำ OTP เก่ามาใช้หากกดสมัครซ้ำ)
  await supabase.from("otps").delete().eq("email", email);

  // 2. Cleanup: ลบ OTP ที่หมดอายุแล้วทั้งหมดในตารางทิ้ง (เพื่อไม่ให้มีข้อมูลขยะค้างใน DB)
  await supabase.from("otps").delete().lt("expires_at", new Date().toISOString());

  // 3. สร้าง OTP 6 หลัก
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

  // 3. บันทึก OTP ลง Database (ตั้งหมดอายุอีก 3 นาที)
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 3);

  const { error: otpError } = await supabase.from("otps").insert([
    {
      email,
      otp: otpCode,
      expires_at: expiresAt.toISOString(),
      metadata, // เก็บข้อมูลเพิ่มเติม (เช่น ข้อมูลสมัครสมาชิก)
    }
  ]);

  if (otpError) {
    console.error("OTP Error:", otpError);
    throw new Error("OTP_CREATE_FAILED");
  }

  // ส่ง OTP ผ่าน Email
  await sendOtpEmail(email, otpCode);
}

// ========== Verify OTP ==========
export async function verifyOtp(email: string, otp: string) {
  // 1. ตรวจสอบในตาราง otps ว่ามีรหัสตรงกับอีเมลนี้หรือไม่
  const { data: records, error } = await supabase
    .from("otps")
    .select("*")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error || !records || records.length === 0) {
    throw new Error("OTP_NOT_FOUND");
  }

  const latestOtp = records[0];

  // 2. ตรวจสอบว่า OTP ตรงกันหรือไม่
  if (latestOtp.otp !== otp) {
    throw new Error("OTP_INVALID");
  }

  // 3. ตรวจสอบว่า OTP หมดอายุหรือยัง
  const now = new Date();
  const expiresAt = new Date(latestOtp.expires_at);
  if (now > expiresAt) {
    throw new Error("OTP_EXPIRED");
  }

  // 4. OTP ถูกต้อง! ลบ OTP เก่าทิ้งเพื่อความปลอดภัย
  await supabase.from("otps").delete().eq("email", email);

  let user = null;

  // 5. ถ้ามี metadata (เป็นการสมัครสมาชิกใหม่) ให้ทำการ insert เข้าตาราง users
  if (latestOtp.metadata) {
    const { name, hashedPassword } = latestOtp.metadata;
    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert([{ name, email, password: hashedPassword }])
      .select("user_id, name, email")
      .single();

    if (insertError) {
      console.error("Insert User Error:", insertError);
      throw insertError;
    }
    user = newUser;
  } else {
    // กรณี login ปกติ ให้ดึงข้อมูล User จากตาราง users
    const { data: users, error: userError } = await supabase
      .from("users")
      .select("user_id, name, email")
      .eq("email", email)
      .limit(1);

    if (userError || !users || users.length === 0) {
      throw new Error("USER_NOT_FOUND_AFTER_OTP");
    }
    user = users[0];
  }

  // 6. ออก JWT Token จริง
  const token = await signToken({ user_id: user.user_id, email: user.email });

  return { user, token };
}