import { z } from 'zod';

export const assignmentFormSchema = z.object({
  schoolClassId: z.coerce.number().int().positive(),
  subjectId: z.coerce.number().int().positive(),
  teacherId: z.coerce.number().int().positive(),
  year: z.coerce.number().int().min(2000).max(2100),
});

export type AssignmentFormValues = z.infer<typeof assignmentFormSchema>;
