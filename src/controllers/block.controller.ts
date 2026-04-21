import { NextRequest, NextResponse } from "next/server";
import {
  createBlock,
  getBlocksByFlowId,
  updateBlock,
  deleteBlock,
  reorderBlocks
} from "@/services/block.service";
import { blockSchema, reorderSchema } from "@/lib/validators/block";

// ========== POST → สร้าง Block ==========
export async function createBlockController(req: Request) {
  try {
    const body = await req.json();

    // Validate input ด้วย Zod
    const parsed = blockSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });
    }

    const result = await createBlock(parsed.data);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error(error);

    if (error.message === "FLOW_NOT_FOUND") {
      return NextResponse.json({ message: "Flow ไม่พบ" }, { status: 400 });
    }

    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// ========== GET → ดึง Block ของ Flow หนึ่ง ==========
export async function getBlocksController(req: NextRequest) {
  try {
    const flow_id = Number(req.nextUrl.searchParams.get("flow_id"));

    if (!flow_id) {
      return NextResponse.json({ message: "กรุณาระบุ flow_id" }, { status: 400 });
    }

    const blocks = await getBlocksByFlowId(flow_id);

    return NextResponse.json(blocks);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

// ========== PUT → อัปเดตข้อมูล Block ==========
export async function updateBlockController(req: Request) {
  try {
    const body = await req.json();
    const { block_id, ...updateData } = body;

    if (!block_id) {
      return NextResponse.json({ message: "กรุณาระบุ block_id" }, { status: 400 });
    }

    const result = await updateBlock(block_id, updateData);

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาดในการอัปเดต" }, { status: 500 });
  }
}

// ========== DELETE → ลบ Block ==========
export async function deleteBlockController(req: NextRequest) {
  try {
    const block_id = Number(req.nextUrl.searchParams.get("block_id"));
    const flow_id = Number(req.nextUrl.searchParams.get("flow_id"));

    if (!block_id || !flow_id) {
      return NextResponse.json({ message: "กรุณาระบุ block_id และ flow_id" }, { status: 400 });
    }

    const result = await deleteBlock(block_id, flow_id);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("DELETE Error:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาดในการลบ", error: error.message }, { status: 500 });
  }
}

// ========== PUT → Reorder Blocks ==========
export async function reorderBlocksController(req: NextRequest) {
  try {
    const body = await req.json();

    const parsed = reorderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: "ข้อมูลลำดับใหม่ไม่ถูกต้อง" }, { status: 400 });
    }

    const { flow_id, items } = parsed.data;

    const result = await reorderBlocks(flow_id, items);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Reorder Error:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาดในการอัปเดตลำดับข้ามเซิร์ฟเวอร์" }, { status: 500 });
  }
}
