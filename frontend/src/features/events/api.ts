import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/shared/api/client';
import type { EventCreateValues, EventResponse } from './schemas';

const KEY = ['events'] as const;

export function useEvents() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<EventResponse[]>('/events');
      return data;
    },
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: EventCreateValues) => {
      const payload = {
        title: input.title,
        description: input.description || null,
        startAt: input.startAt,
        endAt: input.endAt || null,
        location: input.location || null,
        latitude:
          input.latitude === undefined || input.latitude === ''
            ? null
            : Number(input.latitude),
        longitude:
          input.longitude === undefined || input.longitude === ''
            ? null
            : Number(input.longitude),
      };
      const { data } = await api.post<EventResponse>('/events', payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/events/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
