import { NextResponse } from "next/server";
import { supabase } from "../../../lib/db";
import { blockSchema } from "../../../lib/validators/block";

// POST → สร้าง Block
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate input ด้วย Zod
    const parsed = blockSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });
    }

    const {
      flow_id, step_order, type, name, description,
      cost_per_unit, electricity_per_unit, people, cost_per_person, duration
    } = parsed.data;

    // ตรวจสอบว่า flow_id มีอยู่จริง
    const { data: flow, error: flowError } = await supabase.from("flows").select("*").eq("flow_id", flow_id);
    if (flowError) throw flowError;

    if (!flow || flow.length === 0) {
      return NextResponse.json({ message: "Flow ไม่พบ" }, { status: 400 });
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

    return NextResponse.json({ message: "สร้าง Block สำเร็จ" });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// GET → ดึง Block ของ Flow หนึ่ง
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const flow_id = Number(url.searchParams.get("flow_id"));

    if (!flow_id) {
      return NextResponse.json({ message: "กรุณาระบุ flow_id" }, { status: 400 });
    }

    const { data: blocks, error: blocksError } = await supabase
      .from("blocks")
      .select("*")
      .eq("flow_id", flow_id)
      .order("step_order", { ascending: true });

    if (blocksError) throw blocksError;

    return NextResponse.json(blocks);

  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}