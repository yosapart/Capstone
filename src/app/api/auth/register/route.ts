import { registerController } from "@/controllers/auth.service";

export async function POST(req: Request) {
  return registerController(req);
}