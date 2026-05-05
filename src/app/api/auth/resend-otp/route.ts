import { resendOtpController } from "@/controllers/auth.controller";

export async function POST(req: Request) {
  return resendOtpController(req);
}
