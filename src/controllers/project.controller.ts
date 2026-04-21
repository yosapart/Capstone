import { NextResponse } from "next/server";
import { getAllProjects, createProject } from "@/services/project.service";
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
