import { z } from 'zod';

export const eventCreateSchema = z
  .object({
    title: z.string().min(1).max(255),
    description: z.string().max(2000).optional().or(z.literal('')),
    startAt: z.string().min(1, 'required'),
    endAt: z.string().optional().or(z.literal('')),
    location: z.string().max(255).optional().or(z.literal('')),
  })
  .refine((v) => !v.endAt || v.endAt >= v.startAt, {
    message: 'endAt must be on or after startAt',
    path: ['endAt'],
  });

export type EventCreateValues = z.infer<typeof eventCreateSchema>;

export interface EventResponse {
  id: number;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string | null;
  location: string | null;
  createdByFullName: string | null;
  createdAt: string;
}
