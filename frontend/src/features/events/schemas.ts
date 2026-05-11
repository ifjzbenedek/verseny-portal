import { z } from 'zod';

export const eventCreateSchema = z
  .object({
    title: z.string().min(1).max(255),
    description: z.string().max(2000).optional().or(z.literal('')),
    startAt: z.string().min(1, 'required'),
    endAt: z.string().optional().or(z.literal('')),
    location: z.string().max(255).optional().or(z.literal('')),
    latitude: z
      .union([z.coerce.number().min(-90).max(90), z.literal('')])
      .optional(),
    longitude: z
      .union([z.coerce.number().min(-180).max(180), z.literal('')])
      .optional(),
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
  latitude: number | null;
  longitude: number | null;
  createdByFullName: string | null;
  createdAt: string;
}
