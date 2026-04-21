import { supabase } from "@/lib/db";

// ========== Get All Projects ==========
export async function getAllProjects() {
  const { data: rows, error } = await supabase.from("projects").select("*");
  if (error) throw error;
  return rows;
}

// ========== Create Project ==========
export async function createProject(user_id: number, name: string, description?: string) {
  // เช็คว่า user_id มีอยู่จริงใน Users
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("user_id", user_id);

  if (userError) throw userError;

  if (!user || user.length === 0) {
    throw new Error("USER_NOT_FOUND");
  }

  // Insert
  const { error: insertError } = await supabase.from("projects").insert([
    { user_id, name, description: description || "" }
  ]);
  if (insertError) throw insertError;

  return { message: "สร้าง Project สำเร็จ" };
}
