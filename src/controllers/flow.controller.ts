import { NextResponse } from "next/server";
import { getAllFlows, createFlow } from "@/services/flow.service";
import { flowSchema } from "@/lib/validators/flow";

// ========== GET → ดึง flow ทั้งหมด ==========
export async function getFlowsController() {
  try {
    const rows = await getAllFlows();
    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// ========== POST → สร้าง flow ==========
export async function createFlowController(req: Request) {
  try {
    const body = await req.json();

    // Validate
    const parsed = flowSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });
    }

    const { project_id, name } = parsed.data;

    const result = await createFlow(project_id, name);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error(error);

    if (error.message === "PROJECT_NOT_FOUND") {
      return NextResponse.json({ message: "Project ไม่พบในระบบ" }, { status: 400 });
    }

    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
