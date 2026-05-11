import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/shared/api/client';
import type { SubjectResponse } from '@/shared/types/api';
import type { SubjectFormValues } from './schemas';

const KEY = ['subjects'] as const;

export function useSubjects() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<SubjectResponse[]>('/subjects');
      return data;
    },
  });
}

export function useCreateSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SubjectFormValues) => {
      const { data } = await api.post<SubjectResponse>('/subjects', input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: SubjectFormValues & { id: number }) => {
      const { data } = await api.put<SubjectResponse>(`/subjects/${id}`, input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/subjects/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
