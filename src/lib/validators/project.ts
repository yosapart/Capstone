import { z } from "zod";

export const projectSchema = z.object({
    user_id: z.number(),
    name: z.string().min(1, "Name ของ Project ต้องไม่ว่าง"),
    description: z.string().optional(),
});
