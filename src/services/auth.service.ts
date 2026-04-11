import { supabase } from "@/lib/db";
import bcrypt from "bcryptjs";

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

  // 💾 insert
  const { error: insertError } = await supabase
    .from("users")
    .insert([{ name, email, password: hashedPassword }]);

  if (insertError) throw insertError;

  return {
    message: "สมัครสำเร็จ",
  };
}