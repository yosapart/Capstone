import { loginController } from "@/controllers/auth.service";

export async function POST(req: Request) {
    return loginController(req);
}