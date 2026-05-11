import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/shared/api/client';
import type { AuthResponse, SpringPage, StudentResponse } from '@/shared/types/api';
import type { EnrollStudentValues, RegisterUserValues } from './schemas';

const KEY = ['students'] as const;

export function useStudents(page = 0, size = 20) {
  return useQuery({
    queryKey: [...KEY, page, size],
    queryFn: async () => {
      const { data } = await api.get<SpringPage<StudentResponse>>('/students', {
        params: { page, size, sort: 'id,asc' },
      });
      return data;
    },
  });
}

export function useStudentMe() {
  return useQuery({
    queryKey: ['students', 'me'],
    queryFn: async () => {
      const { data } = await api.get<StudentResponse>('/students/me');
      return data;
    },
    retry: false,
  });
}

export function useRegisterUser() {
  return useMutation({
    mutationFn: async (input: RegisterUserValues) => {
      const { data } = await api.post<AuthResponse>('/auth/register', input);
      return data;
    },
  });
}

export function useEnrollStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: EnrollStudentValues) => {
      const { data } = await api.post<StudentResponse>('/students', input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/students/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
