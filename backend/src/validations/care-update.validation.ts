import { z } from "zod";

export const createCareUpdateSchema = z.object({
  bookingId: z.coerce.number().int().positive(),
  type: z.enum(["feeding", "bathing", "playtime", "health_check"]),
  note: z.string().min(3).optional(),
});