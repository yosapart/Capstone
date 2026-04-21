import { supabase } from "@/lib/db";

// ========== Get All Flows ==========
export async function getAllFlows() {
  const { data: rows, error } = await supabase.from("flows").select("*");
  if (error) throw error;
  return rows;
}

// ========== Create Flow ==========
export async function createFlow(project_id: number, name: string) {
  // เช็คว่า project_id มีอยู่จริงใน Projects
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("project_id", project_id);

  if (projectError) throw projectError;

  if (!project || project.length === 0) {
    throw new Error("PROJECT_NOT_FOUND");
  }

  // Insert
  const { error: insertError } = await supabase.from("flows").insert([
    { project_id, name }
  ]);
  if (insertError) throw insertError;

  return { message: "สร้าง Flow สำเร็จ" };
}
