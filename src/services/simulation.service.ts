import { supabase } from "@/lib/db";
import { calculateSimulation, TestcaseData } from "./simulation.engine";

// ========== Run Simulation ==========
export async function runSimulation(flow_id: number, target_output: number, testcase_id?: number | null) {
  // 1️⃣ เช็ค Flow
  const { data: flow, error: flowError } = await supabase
    .from("flows")
    .select("*")
    .eq("flow_id", flow_id);

  if (flowError) throw flowError;

  if (!flow || flow.length === 0) {
    throw new Error("FLOW_NOT_FOUND");
  }

  // 2️⃣ ดึง testcase (ตัวเดียว)
  let testcase: TestcaseData | null = null;

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

  // 3️⃣ ดึง Blocks
  const { data: blocks, error: blocksError } = await supabase
    .from("blocks")
    .select("*")
    .eq("flow_id", flow_id)
    .order("step_order", { ascending: true });

  if (blocksError) throw blocksError;

  if (!blocks || blocks.length === 0) {
    throw new Error("NO_BLOCKS");
  }

  // 4️⃣ Normalize step_order — re-number 1..N sorted by current step_order
  //    เกิดช่องว่างได้จาก reorder / delete → ต้อง normalize ก่อน simulate
  blocks.sort((a: any, b: any) => a.step_order - b.step_order);

  const hasGap = blocks.some((b: any, i: number) => b.step_order !== i + 1);
  if (hasGap) {
    console.warn("step_order has gaps — normalizing before simulation...");
    // Batch update ใน DB ให้ step_order ถูกต้อง
    for (let i = 0; i < blocks.length; i++) {
      const newOrder = i + 1;
      if (blocks[i].step_order !== newOrder) {
        await supabase
          .from("blocks")
          .update({ step_order: newOrder })
          .eq("block_id", blocks[i].block_id);
        blocks[i].step_order = newOrder; // update in-memory ด้วย
      }
    }
  }

  // 5️⃣ สร้าง Simulation
  const { data: simuResult, error: simuError } = await supabase
    .from("simulations")
    .insert([{ flow_id, target_output }])
    .select();

  if (simuError) throw simuError;

  const simu_id = simuResult[0].simu_id;

  // 6️⃣ apply testcase
  let appliedTestcase: TestcaseData | null = null;

  if (testcase) {
    // ผู้ใช้เจาะจงเลือก Testcase นี้มา จึงบังคับให้เกิด 100% (isApplied = true)
    const isApplied = true;

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

  // 7️⃣ Logic คำนวณ (ใช้ engine)
  const output = calculateSimulation(blocks, target_output, appliedTestcase);

  // 8️⃣ เก็บ Results
  const { error: resultError } = await supabase
    .from("results")
    .insert([{ simu_id, output: JSON.stringify(output) }]);

  if (resultError) throw resultError;

  return output;
}
