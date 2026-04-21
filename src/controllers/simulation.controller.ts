import { NextResponse } from "next/server";
import { runSimulation } from "@/services/simulation.service";
import { simulationSchema } from "@/lib/validators/simulation";

// ========== POST → Run Simulation ==========
export async function runSimulationController(req: Request) {
  try {
    const body = await req.json();

    // Validate input
    const parsed = simulationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { flow_id, target_output, testcase_id } = parsed.data;

    const output = await runSimulation(flow_id, target_output, testcase_id);

    return NextResponse.json({
      message: "Simulation สำเร็จ",
      data: output,
    });

  } catch (error: any) {
    console.error("Simulation Error: ", error);

    if (error.message === "FLOW_NOT_FOUND") {
      return NextResponse.json({ message: "Flow ไม่พบ" }, { status: 400 });
    }
    if (error.message === "NO_BLOCKS") {
      return NextResponse.json({ message: "Flow นี้ไม่มี Block" }, { status: 400 });
    }
    if (error.message === "INVALID_STEP_ORDER") {
      return NextResponse.json({ message: "step_order ต้องเรียง 1,2,3,... ต่อเนื่อง" }, { status: 400 });
    }
    if (error.message === "NEGATIVE_VALUES") {
      return NextResponse.json({ message: "ค่าของ Block ต้องไม่ติดลบ" }, { status: 400 });
    }

    return NextResponse.json(
      { message: "เกิดข้อผิดพลาด", error: error.message || error },
      { status: 500 }
    );
  }
}
