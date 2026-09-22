import { z } from 'zod';

export const accessResourceSchema = z.object({
  passengerId: z.string().uuid(),
  resourceId: z.string().uuid()
}).strict();

export type AccessResourceInput = z.infer<typeof accessResourceSchema>;
