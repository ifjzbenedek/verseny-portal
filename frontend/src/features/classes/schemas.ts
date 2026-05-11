import { z } from 'zod';

export const classFormSchema = z.object({
  startYear: z.coerce.number().int().min(1990).max(2100),
  identifier: z.string().min(1).max(16),
});

export type ClassFormValues = z.infer<typeof classFormSchema>;
