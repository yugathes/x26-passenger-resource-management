import { z } from 'zod';

export const membershipLevelSchema = z.enum(['SILVER', 'GOLD', 'PLATINUM']);

export const createPassengerSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().email(),
  phone: z.string().trim().min(1).optional(),
  membership: membershipLevelSchema.optional()
}).strict();

export const updateMembershipSchema = z.object({
  membership: membershipLevelSchema
}).strict();

export type CreatePassengerInput = z.infer<typeof createPassengerSchema>;
export type UpdateMembershipInput = z.infer<typeof updateMembershipSchema>;
