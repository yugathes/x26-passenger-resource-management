import { z } from 'zod';

export const membershipLevelSchema = z.enum(['SILVER', 'GOLD', 'PLATINUM']);

export const createPassengerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1).optional(),
  membership: membershipLevelSchema.optional()
});

export const updateMembershipSchema = z.object({
  membership: membershipLevelSchema
});

export type CreatePassengerInput = z.infer<typeof createPassengerSchema>;
export type UpdateMembershipInput = z.infer<typeof updateMembershipSchema>;
