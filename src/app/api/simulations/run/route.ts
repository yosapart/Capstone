import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import { z } from "zod";

// ✅ Zod validate
const simulationSchema = z.object({
  flow_id: z.number(),
  target_output: z.number().min(1, "target_output ต้องมากกว่า 0"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1️⃣ Validate input
    const parsed = simulationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { flow_id, target_output } = parsed.data;

    // 2️⃣ เช็ค Flow
    const [flow]: any = await db.query(
      "SELECT * FROM Flows WHERE flow_id = ?",
      [flow_id]
    );

    if (flow.length === 0) {
      return NextResponse.json(
        { message: "Flow ไม่พบ" },
        { status: 400 }
      );
    }

    // 3️⃣ ดึง Blocks
    const [blocks]: any = await db.query(
      "SELECT * FROM Blocks WHERE flow_id = ? ORDER BY step_order ASC",
      [flow_id]
    );

    if (blocks.length === 0) {
      return NextResponse.json(
        { message: "Flow นี้ไม่มี Block" },
        { status: 400 }
      );
    }

    // 4️⃣ เช็ค step_order ต่อเนื่อง
    const orders = blocks.map((b: any) => b.step_order).sort((a: number, b: number) => a - b);

    for (let i = 0; i < orders.length; i++) {
      if (orders[i] !== i + 1) {
        return NextResponse.json(
          { message: "step_order ต้องเรียง 1,2,3,... ต่อเนื่อง" },
          { status: 400 }
        );
      }
    }

    // 5️⃣ Logic คำนวณ + breakdown
    let total_cost = 0;
    let total_electricity = 0;
    let total_duration = 0;

    const steps: any[] = [];

    for (const block of blocks) {
      const cost_per_unit = Number(block.cost_per_unit) || 0;
      const electricity_per_unit = Number(block.electricity_per_unit) || 0;
      const people = Number(block.people) || 0;
      const cost_per_person = Number(block.cost_per_person) || 0;
      const duration = Number(block.duration) || 0;

      // ❗ กันค่าติดลบ
      if (
        cost_per_unit < 0 ||
        electricity_per_unit < 0 ||
        people < 0 ||
        cost_per_person < 0 ||
        duration < 0
      ) {
        return NextResponse.json(
          { message: "ค่าของ Block ต้องไม่ติดลบ" },
          { status: 400 }
        );
      }

      const block_cost =
        cost_per_unit * target_output + people * cost_per_person;

      const block_electricity =
        electricity_per_unit * target_output;

      total_cost += block_cost;
      total_electricity += block_electricity;
      total_duration += duration;

      // 🔥 เก็บรายละเอียดแต่ละ step
      steps.push({
        step_order: block.step_order,
        name: block.name,
        cost: block_cost,
        electricity: block_electricity,
        duration: duration,
      });
    }

    // 6️⃣ สร้าง Simulation
    const [simuResult]: any = await db.query(
      "INSERT INTO Simulations (flow_id, target_output) VALUES (?, ?)",
      [flow_id, target_output]
    );

    const simu_id = simuResult.insertId;

    // 7️⃣ รวม output
    const output = {
      total_cost,
      total_electricity,
      total_duration,
      target_output,
      steps, // 🔥 เพิ่ม breakdown
    };

    // 8️⃣ เก็บ Results
    await db.query(
      "INSERT INTO Results (simu_id, output) VALUES (?, ?)",
      [simu_id, JSON.stringify(output)]
    );

    return NextResponse.json({
      message: "Simulation สำเร็จ",
      data: output,
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาด" },
      { status: 500 }
    );
  }
}