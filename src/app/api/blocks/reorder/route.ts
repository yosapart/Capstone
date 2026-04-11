import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../lib/db";
import { z } from "zod";

const reorderSchema = z.array(z.object({
  block_id: z.number(),
  step_order: z.number()
}));

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = reorderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: "ข้อมูลลำดับใหม่ไม่ถูกต้อง" }, { status: 400 });
    }

    const updates = parsed.data.map(async (item) => {
      const { error } = await supabase
        .from("blocks")
        .update({ step_order: item.step_order })
        .eq("block_id", item.block_id);
      
      if (error) throw error;
    });

    // We execute updates concurrently since there shouldn't be too many locks
    await Promise.all(updates);

    return NextResponse.json({ message: "อัปเดตลำดับสำเร็จ" });
  } catch (error) {
    console.error("Reorder Error:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาดในการอัปเดตลำดับข้ามเซิร์ฟเวอร์" }, { status: 500 });
  }
}
