import { z } from "zod";

export const blockSchema = z.object({
  flow_id: z.number(),
  step_order: z.number(),
  type: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  cost_per_unit: z.number().optional(),
  electricity_per_unit: z.number().optional(),
  people: z.number().optional(),
  cost_per_person: z.number().optional(),
  duration: z.number().optional(),
});

export const reorderSchema = z.object({
  flow_id: z.number(),
  items: z.array(
    z.object({
      block_id: z.number(),
      step_order: z.number(),
    })
  ),
});