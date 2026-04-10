import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/db";
import { z } from "zod";

// ✅ Zod validate (เลือกได้ 1 testcase)
const simulationSchema = z.object({
  flow_id: z.number(),
  target_output: z.number().min(1, "target_output ต้องมากกว่า 0"),
  testcase_id: z.number().optional(), // 🔥 เปลี่ยนตรงนี้
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

    const { flow_id, target_output, testcase_id } = parsed.data;

    // 2️⃣ เช็ค Flow
    const { data: flow, error: flowError } = await supabase
      .from("flows")
      .select("*")
      .eq("flow_id", flow_id);

    if (flowError) throw flowError;

    if (!flow || flow.length === 0) {
      return NextResponse.json(
        { message: "Flow ไม่พบ" },
        { status: 400 }
      );
    }

    // 3️⃣ ดึง testcase (ตัวเดียว)
    let testcase: any = null;

    if (testcase_id) {
      const { data, error } = await supabase
        .from("testcases")
        .select("*")
        .eq("tc_id", testcase_id)
        .single();

      if (error) throw error;

      testcase = data;
    }

    console.log("TESTCASE:", testcase);

    // 4️⃣ ดึง Blocks
    const { data: blocks, error: blocksError } = await supabase
      .from("blocks")
      .select("*")
      .eq("flow_id", flow_id)
      .order("step_order", { ascending: true });

    if (blocksError) throw blocksError;

    if (!blocks || blocks.length === 0) {
      return NextResponse.json(
        { message: "Flow นี้ไม่มี Block" },
        { status: 400 }
      );
    }

    // 5️⃣ เช็ค step_order
    const orders = blocks.map((b: any) => b.step_order).sort((a: number, b: number) => a - b);

    for (let i = 0; i < orders.length; i++) {
      if (orders[i] !== i + 1) {
        return NextResponse.json(
          { message: "step_order ต้องเรียง 1,2,3,... ต่อเนื่อง" },
          { status: 400 }
        );
      }
    }

    // 6️⃣ สร้าง Simulation
    const { data: simuResult, error: simuError } = await supabase
      .from("simulations")
      .insert([{ flow_id, target_output }])
      .select();

    if (simuError) throw simuError;

    const simu_id = simuResult[0].simu_id;

    // 7️⃣ random testcase
    let appliedTestcase: any = null;

    if (testcase) {
      const isApplied = Math.random() < Number(testcase.probability);

      await supabase.from("event").insert([
        {
          simu_id,
          tc_id: testcase.tc_id,
          applied: isApplied,
        },
      ]);

      if (isApplied) {
        appliedTestcase = testcase;
      }
    }

    console.log("APPLIED:", appliedTestcase);

    // 8️⃣ Logic คำนวณ
    let total_cost = 0;
    let total_electricity = 0;
    let total_duration = 0;

    const steps: any[] = [];



    for (const block of blocks) {
      // 🔥 START block
      if (block.type === "start") {
        steps.push({
          step_order: block.step_order,
          name: block.name,
          type: "start",
        });
        continue;
      }

      // 🔥 END block
      if (block.type === "end") {
        steps.push({
          step_order: block.step_order,
          name: block.name,
          type: "end",
        });
        break; // จบ flow
      }
      let cost_per_unit = Number(block.cost_per_unit) || 0;
      let electricity_per_unit = Number(block.electricity_per_unit) || 0;
      let people = Number(block.people) || 0;
      let cost_per_person = Number(block.cost_per_person) || 0;
      let duration = Number(block.duration) || 0;

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

      let skipBlock = false;

      // 🔥 apply testcase
      if (appliedTestcase) {
        const tc = appliedTestcase;

        if (tc.type === "labor") {
          people = people * (1 - Number(tc.value));
        }

        if (tc.type === "electricity") {
          electricity_per_unit = electricity_per_unit * (1 + Number(tc.value));
        }

        if (tc.type === "material") {
          cost_per_unit = cost_per_unit * (1 + Number(tc.value));
        }

        if (tc.type === "machine") {
          skipBlock = true;
          duration += 10; // เพิ่มเวลา
        }
      }

      // 🔥 skip block ถ้าเครื่องเสีย
      if (skipBlock) {
        total_duration += duration;

        steps.push({
          step_order: block.step_order,
          name: block.name,
          skipped: true,
          duration,
        });

        continue;
      }

      const block_cost =
        cost_per_unit * target_output + people * cost_per_person;

      const block_electricity =
        electricity_per_unit * target_output;

      total_cost += block_cost;
      total_electricity += block_electricity;
      total_duration += duration;

      steps.push({
        step_order: block.step_order,
        name: block.name,
        cost: block_cost,
        electricity: block_electricity,
        duration,
      });
    }

    // 9️⃣ รวม output
    const output = {
      total_cost,
      total_electricity,
      total_duration,
      target_output,
      testcase: appliedTestcase?.name || "none",
      steps,
    };

    // 🔟 เก็บ Results
    const { error: resultError } = await supabase
      .from("results")
      .insert([{ simu_id, output: JSON.stringify(output) }]);

    if (resultError) throw resultError;

    return NextResponse.json({
      message: "Simulation สำเร็จ",
      data: output,
    });

  } catch (error: any) {
    console.error("Simulation Error: ", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาด", error: error.message || error },
      { status: 500 }
    );
  }
}