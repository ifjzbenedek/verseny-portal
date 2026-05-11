import { z } from 'zod';

export const registerUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
  fullName: z.string().min(2),
  role: z.enum(['HALLGATO', 'OKTATO', 'ADMIN', 'SUPERADMIN']),
});

export type RegisterUserValues = z.infer<typeof registerUserSchema>;

export const enrollStudentSchema = z.object({
  userId: z.coerce.number().int().positive(),
  schoolClassId: z.coerce.number().int().positive(),
});

export type EnrollStudentValues = z.infer<typeof enrollStudentSchema>;
