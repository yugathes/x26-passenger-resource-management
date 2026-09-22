import { z } from 'zod';
import { membershipLevelSchema } from '../passengers/passenger.types';

export const resourceStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'DECOMMISSIONED']);

export const createResourceSchema = z.object({
  name: z.string().trim().min(1),
  type: z.string().trim().min(1),
  minMembership: membershipLevelSchema.optional()
}).strict();

export const updateResourceSchema = z.object({
  name: z.string().trim().min(1).optional(),
  type: z.string().trim().min(1).optional(),
  minMembership: membershipLevelSchema.optional()
}).strict().refine((input) => Object.keys(input).length > 0, 'At least one resource field is required');

export const setResourceStatusSchema = z.object({
  status: z.enum(['INACTIVE', 'DECOMMISSIONED'])
}).strict();

export type CreateResourceInput = z.infer<typeof createResourceSchema>;
export type UpdateResourceInput = z.infer<typeof updateResourceSchema>;
export type SetResourceStatusInput = z.infer<typeof setResourceStatusSchema>;
