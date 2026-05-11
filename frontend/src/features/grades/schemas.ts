import { z } from 'zod';

export const gradeTypeSchema = z.enum(['NORMAL', 'MIDTERM', 'HALFYEAR', 'YEAR_END']);

export const gradeFormSchema = z.object({
  value: z.coerce.number().int().min(1).max(5),
  type: gradeTypeSchema,
  weight: z.coerce.number().positive().max(10),
  comment: z.string().max(1000).optional().or(z.literal('')),
  assignmentId: z.coerce.number().int().positive(),
  studentId: z.coerce.number().int().positive(),
});

export type GradeFormValues = z.infer<typeof gradeFormSchema>;

export const gradeResponseSchema = z.object({
  id: z.number(),
  studentId: z.number(),
  assignmentId: z.number(),
  subjectName: z.string().optional(),
  teacherName: z.string().optional(),
  value: z.number(),
  type: gradeTypeSchema,
  weight: z.number(),
  comment: z.string().optional().nullable(),
  recordedAt: z.string(),
  recordedByName: z.string().optional(),
});

export type GradeResponse = z.infer<typeof gradeResponseSchema>;
