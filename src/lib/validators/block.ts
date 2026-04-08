import { z } from "zod";

export const blockSchema = z.object({
  flow_id: z.number({ error: "Flow ID ต้องเป็นตัวเลข" }),
  step_order: z.number({ error: "Step order ต้องเป็นตัวเลข" }),
  type: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  cost_per_unit: z.number().optional(),
  electricity_per_unit: z.number().optional(),
  people: z.number().optional(),
  cost_per_person: z.number().optional(),
  duration: z.number().optional(),
});