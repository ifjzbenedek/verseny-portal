import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/shared/api/client';
import type { SubjectAssignmentResponse } from '@/shared/types/api';
import type { AssignmentFormValues } from './schemas';

const KEY = ['assignments'] as const;

export interface AssignmentFilters {
  year?: number;
  classId?: number;
  teacherId?: number;
}

export function useAssignments(filters: AssignmentFilters = {}) {
  return useQuery({
    queryKey: [...KEY, filters],
    queryFn: async () => {
      const { data } = await api.get<SubjectAssignmentResponse[]>('/assignments', {
        params: filters,
      });
      return data;
    },
  });
}

export function useMyTeaching() {
  return useQuery({
    queryKey: [...KEY, 'my-teaching'],
    queryFn: async () => {
      const { data } = await api.get<SubjectAssignmentResponse[]>('/assignments/my-teaching');
      return data;
    },
  });
}

export function useMySubjects() {
  return useQuery({
    queryKey: [...KEY, 'my-subjects'],
    queryFn: async () => {
      const { data } = await api.get<SubjectAssignmentResponse[]>('/assignments/my-subjects');
      return data;
    },
  });
}

export function useCreateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AssignmentFormValues) => {
      const { data } = await api.post<SubjectAssignmentResponse>('/assignments', input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/assignments/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
