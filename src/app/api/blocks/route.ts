import { NextRequest } from "next/server";
import {
  createBlockController,
  getBlocksController,
  updateBlockController,
  deleteBlockController,
} from "@/controllers/block.controller";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return createBlockController(req);
}

export async function GET(req: NextRequest) {
  return getBlocksController(req);
}

export async function PUT(req: Request) {
  return updateBlockController(req);
}

export async function DELETE(req: NextRequest) {
  return deleteBlockController(req);
}