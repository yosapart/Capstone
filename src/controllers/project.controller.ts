import { NextResponse } from "next/server";
import { getAllProjects, createProject, updateProject, deleteProject } from "@/services/project.service";
import { projectSchema } from "@/lib/validators/project";

// ========== GET → ดึง project ทั้งหมด ==========
export async function getProjectsController() {
  try {
    const rows = await getAllProjects();
    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// ========== POST → สร้าง project ==========
export async function createProjectController(req: Request) {
  try {
    const body = await req.json();

    // Validate
    const parsed = projectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });
    }

    const { user_id, name, description } = parsed.data;

    const result = await createProject(user_id, name, description);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error(error);

    if (error.message === "USER_NOT_FOUND") {
      return NextResponse.json({ message: "User ไม่พบในระบบ" }, { status: 400 });
    }

    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// ========== PUT → แก้ไข project ==========
export async function updateProjectController(req: Request) {
  try {
    const body = await req.json();
    const { project_id, name, description } = body;
    if (!project_id || !name) return NextResponse.json({ message: "ข้อมูลไม่ครบ" }, { status: 400 });
    const result = await updateProject(project_id, name, description);
    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// ========== DELETE → ลบ project ==========
export async function deleteProjectController(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("project_id");
    if (!projectId) return NextResponse.json({ message: "โปรดระบุ project_id" }, { status: 400 });
    const result = await deleteProject(Number(projectId));
    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
