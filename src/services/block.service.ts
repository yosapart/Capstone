import { supabase } from "@/lib/db";

// ========== Create Block ==========
export async function createBlock(data: {
  flow_id: number;
  step_order: number;
  type: string;
  name: string;
  description?: string;
  cost_per_unit?: number;
  electricity_per_unit?: number;
  people?: number;
  cost_per_person?: number;
  duration?: number;
}) {
  const {
    flow_id, step_order, type, name, description,
    cost_per_unit, electricity_per_unit, people, cost_per_person, duration
  } = data;

  // ตรวจสอบว่า flow_id มีอยู่จริง
  const { data: flow, error: flowError } = await supabase
    .from("flows")
    .select("*")
    .eq("flow_id", flow_id);

  if (flowError) throw flowError;

  if (!flow || flow.length === 0) {
    throw new Error("FLOW_NOT_FOUND");
  }

  // Insert Block
  const { error: insertError } = await supabase.from("blocks").insert([
    {
      flow_id,
      step_order,
      type,
      name,
      description: description || "",
      cost_per_unit: cost_per_unit || 0,
      electricity_per_unit: electricity_per_unit || 0,
      people: people || 0,
      cost_per_person: cost_per_person || 0,
      duration: duration || 0
    }
  ]);
  if (insertError) throw insertError;
  // 🔥 เพิ่มตรงนี้
  await normalizeStepOrder(flow_id);
  return { message: "สร้าง Block สำเร็จ" };
}

// ========== Get Blocks by Flow ID ==========
export async function getBlocksByFlowId(flow_id: number) {
  const { data: blocks, error } = await supabase
    .from("blocks")
    .select("*")
    .eq("flow_id", flow_id)
    .order("step_order", { ascending: true });

  if (error) throw error;
  return blocks;
}

// ========== Update Block ==========
export async function updateBlock(block_id: number, data: {
  name?: string;
  description?: string;
  cost_per_unit?: number;
  electricity_per_unit?: number;
  people?: number;
  cost_per_person?: number;
  duration?: number;
}) {
  const updates: any = {};
  if (data.name !== undefined) updates.name = data.name;
  if (data.description !== undefined) updates.description = data.description;
  if (data.cost_per_unit !== undefined) updates.cost_per_unit = data.cost_per_unit;
  if (data.electricity_per_unit !== undefined) updates.electricity_per_unit = data.electricity_per_unit;
  if (data.people !== undefined) updates.people = data.people;
  if (data.cost_per_person !== undefined) updates.cost_per_person = data.cost_per_person;
  if (data.duration !== undefined) updates.duration = data.duration;

  const { error: updateError } = await supabase.from("blocks").update(updates).eq("block_id", block_id);

  if (updateError) throw updateError;

  return { message: "อัปเดต Block สำเร็จ" };
}

// ========== Delete Block ==========
export async function deleteBlock(block_id: number, flow_id: number) {
  const { error: deleteError } = await supabase
    .from("blocks")
    .delete()
    .eq("block_id", block_id);

  if (deleteError) throw deleteError;

  // 🔥 เพิ่มตรงนี้
  await normalizeStepOrder(flow_id);

  return { message: "ลบ Block สำเร็จ" };
}
// ========== Reorder Blocks ==========
export async function reorderBlocks(
  flow_id: number,
  items: { block_id: number; step_order: number }[]
) {
  const updates = items.map(async (item) => {
    const { error } = await supabase
      .from("blocks")
      .update({ step_order: item.step_order })
      .eq("block_id", item.block_id);

    if (error) throw error;
  });

  await Promise.all(updates);

  // 🔥 เพิ่มตรงนี้
  await normalizeStepOrder(flow_id);

  return { message: "อัปเดตลำดับสำเร็จ" };
}
async function normalizeStepOrder(flow_id: number) {
  const { data: blocks, error } = await supabase
    .from("blocks")
    .select("*")
    .eq("flow_id", flow_id)
    .order("step_order", { ascending: true });

  if (error) throw error;
  if (!blocks) return;

  const updates = blocks.map((block, index) => {
    const newOrder = index + 1;

    if (block.step_order !== newOrder) {
      return supabase
        .from("blocks")
        .update({ step_order: newOrder })
        .eq("block_id", block.block_id);
    }

    return null;
  });

  await Promise.all(updates.filter(Boolean));
}