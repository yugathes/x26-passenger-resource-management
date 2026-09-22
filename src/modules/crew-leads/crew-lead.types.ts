import { z } from 'zod';

export const createCrewLeadSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().email(),
  role: z.string().trim().min(1)
}).strict();

export type CreateCrewLeadInput = z.infer<typeof createCrewLeadSchema>;
