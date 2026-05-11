import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/shared/api/client';
import type { SchoolClassResponse, StudentResponse } from '@/shared/types/api';
import type { ClassFormValues } from './schemas';

const KEY = ['classes'] as const;

export function useClasses() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data } = await api.get<SchoolClassResponse[]>('/classes');
      return data;
    },
  });
}

export function useClassStudents(classId: number | null) {
  return useQuery({
    enabled: classId !== null,
    queryKey: classId ? [...KEY, classId, 'students'] : ['classes', 'students', 'none'],
    queryFn: async () => {
      const { data } = await api.get<StudentResponse[]>(`/classes/${classId}/students`);
      return data;
    },
  });
}

export function useCreateClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ClassFormValues) => {
      const { data } = await api.post<SchoolClassResponse>('/classes', input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: ClassFormValues & { id: number }) => {
      const { data } = await api.put<SchoolClassResponse>(`/classes/${id}`, input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/classes/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
