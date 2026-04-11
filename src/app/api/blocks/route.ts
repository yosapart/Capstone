import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/db";
import { blockSchema } from "../../../lib/validators/block";

export const dynamic = "force-dynamic";

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
export async function GET(req: NextRequest) {
  try {
    const flow_id = Number(req.nextUrl.searchParams.get("flow_id"));

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

// PUT → อัปเดตข้อมูล Block
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { block_id, type, name, description, cost_per_unit, electricity_per_unit, people, cost_per_person, duration } = body;

    if (!block_id) {
      return NextResponse.json({ message: "กรุณาระบุ block_id" }, { status: 400 });
    }

    const { error: updateError } = await supabase.from("blocks").update({
      name,
      description: description || "",
      cost_per_unit: cost_per_unit || 0,
      electricity_per_unit: electricity_per_unit || 0,
      people: people || 0,
      cost_per_person: cost_per_person || 0,
      duration: duration || 0
    }).eq("block_id", block_id);

    if (updateError) throw updateError;

    return NextResponse.json({ message: "อัปเดต Block สำเร็จ" });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาดในการอัปเดต" }, { status: 500 });
  }
}

// DELETE → ลบ Block
export async function DELETE(req: NextRequest) {
  try {
    const block_id = Number(req.nextUrl.searchParams.get("block_id"));

    if (!block_id) {
      return NextResponse.json({ message: "กรุณาระบุ block_id" }, { status: 400 });
    }

    const { error: deleteError } = await supabase.from("blocks").delete().eq("block_id", block_id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ message: "ลบ Block สำเร็จ" });

  } catch (error: any) {
    console.error("DELETE Error:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาดในการลบ", error: error.message }, { status: 500 });
  }
}