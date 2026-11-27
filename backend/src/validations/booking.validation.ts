import { z } from "zod";

export const createBookingSchema = z.object({
  cageId: z.coerce.number().int().positive(),
  serviceId: z.coerce.number().int().positive().optional(),
  petName: z.string().min(2),
  petType: z.string().min(2),
  petDescription: z.string().optional(),
  checkInDate: z.string().min(10),
  checkOutDate: z.string().min(10),
});