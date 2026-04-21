import { loginController } from "@/controllers/auth.controller";

export async function POST(req: Request) {
    return loginController(req);
}