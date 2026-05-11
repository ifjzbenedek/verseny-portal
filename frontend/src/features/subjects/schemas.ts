import { z } from 'zod';

export const subjectFormSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional().or(z.literal('')),
  requiredBook: z.string().max(255).optional().or(z.literal('')),
  lessonsJson: z.string().max(4000).optional().or(z.literal('')),
});

export type SubjectFormValues = z.infer<typeof subjectFormSchema>;
