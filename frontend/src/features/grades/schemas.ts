import { z } from 'zod';

export const gradeTypeSchema = z.enum(['NORMAL', 'MIDTERM', 'HALFYEAR', 'YEAR_END']);

export const gradeCreateSchema = z.object({
  studentId: z.coerce.number().int().positive(),
  assignmentId: z.coerce.number().int().positive(),
  value: z.coerce.number().int().min(1).max(5),
  type: gradeTypeSchema,
  weight: z.coerce.number().min(0.1).max(10),
  comment: z.string().max(1000).optional().or(z.literal('')),
});

export type GradeCreateInput = z.infer<typeof gradeCreateSchema>;

export const gradeUpdateSchema = z.object({
  value: z.coerce.number().int().min(1).max(5),
  type: gradeTypeSchema,
  weight: z.coerce.number().min(0.1).max(10),
  comment: z.string().max(1000).optional().or(z.literal('')),
});

export type GradeUpdateInput = z.infer<typeof gradeUpdateSchema>;

export const gradeResponseSchema = z.object({
  id: z.number(),
  studentId: z.number(),
  studentName: z.string().nullable(),
  assignmentId: z.number(),
  subjectName: z.string().nullable(),
  schoolClassName: z.string().nullable(),
  value: z.number(),
  type: gradeTypeSchema,
  weight: z.number(),
  comment: z.string().nullable(),
  recordedAt: z.string(),
  recordedById: z.number().nullable(),
  recordedByName: z.string().nullable(),
});

export type GradeResponse = z.infer<typeof gradeResponseSchema>;
