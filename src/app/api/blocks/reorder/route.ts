import { NextRequest } from "next/server";
import { reorderBlocksController } from "@/controllers/block.controller";

export async function PUT(req: NextRequest) {
  return reorderBlocksController(req);
}
