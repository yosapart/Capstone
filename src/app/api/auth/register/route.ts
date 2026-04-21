import { registerController } from "@/controllers/auth.controller";

export async function POST(req: Request) {
  return registerController(req);
}