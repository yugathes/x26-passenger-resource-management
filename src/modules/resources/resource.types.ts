import { z } from 'zod';
import { membershipLevelSchema } from '../passengers/passenger.types';

export const resourceStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'DECOMMISSIONED']);

export const createResourceSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  minMembership: membershipLevelSchema.optional()
});

export const updateResourceSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.string().min(1).optional(),
  minMembership: membershipLevelSchema.optional()
});

export const setResourceStatusSchema = z.object({
  status: z.enum(['INACTIVE', 'DECOMMISSIONED'])
});

export type CreateResourceInput = z.infer<typeof createResourceSchema>;
export type UpdateResourceInput = z.infer<typeof updateResourceSchema>;
export type SetResourceStatusInput = z.infer<typeof setResourceStatusSchema>;
