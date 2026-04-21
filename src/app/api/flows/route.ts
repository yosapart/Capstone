import { getFlowsController, createFlowController } from "@/controllers/flow.controller";

export async function GET() {
  return getFlowsController();
}

export async function POST(req: Request) {
  return createFlowController(req);
}