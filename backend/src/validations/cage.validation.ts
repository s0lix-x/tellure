import { z } from "zod";

export const createCageSchema = z.object({
  name: z.string().min(3),
  price: z.coerce.number().int().positive(),
  description: z.string().optional(),
});