import { supabase } from "@/lib/db";

export interface Project {
  project_id: number;
  user_id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

// ========== Get All Projects ==========
export async function getAllProjects() {
  const { data: rows, error } = await supabase
    .from("projects")
    .select(`
      *,
      flows (
        name,
        blocks (
          block_id
        )
      )
    `);

  if (error) throw error;

  return rows.map((project: any) => {
    const flowsStats: { name: string; block_count: number }[] = [];
    let totalBlockCount = 0;

    if (project.flows && project.flows.length > 0) {
      project.flows.forEach((flow: any) => {
        const count = flow.blocks ? flow.blocks.length : 0;
        totalBlockCount += count;
        if (flow.name) {
          flowsStats.push({ name: flow.name, block_count: count });
        }
      });
    }

    // Remove the nested flows object to keep the payload clean
    const { flows, ...projectData } = project;

    return {
      ...projectData,
      flows_stats: flowsStats,
      block_count: totalBlockCount,
    };
  });
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
  const { data, error: insertError } = await supabase.from("projects").insert([
    { user_id, name, description: description || "" }
  ]).select().single();

  if (insertError) throw insertError;

  return { message: "สร้าง Project สำเร็จ", project: data };
}

// ========== Update Project ==========
export async function updateProject(project_id: number, name: string, description?: string) {
  const { error } = await supabase
    .from("projects")
    .update({ name, description })
    .eq("project_id", project_id);
  if (error) throw error;
  return { message: "แก้ไข Project สำเร็จ" };
}

// ========== Delete Project ==========
export async function deleteProject(project_id: number) {
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("project_id", project_id);
  if (error) throw error;
  return { message: "ลบ Project สำเร็จ" };
}
