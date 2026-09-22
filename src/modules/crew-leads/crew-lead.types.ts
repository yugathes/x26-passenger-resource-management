import { z } from 'zod';

export const createCrewLeadSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.string().min(1)
});

export type CreateCrewLeadInput = z.infer<typeof createCrewLeadSchema>;
