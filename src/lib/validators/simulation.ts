import { z } from "zod";

export const simulationSchema = z.object({
  flow_id: z.number(),
  target_output: z.number().min(1, "target_output ต้องมากกว่า 0"),
  testcase_id: z.number().nullable().optional(),
});
