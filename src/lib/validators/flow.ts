import { z } from "zod";

export const flowSchema = z.object({
  project_id: z.number({
    error: "Project ID ต้องเป็นตัวเลข",
  }),
  name: z.string().min(1, "Name ของ Flow ต้องไม่ว่าง"),
});
