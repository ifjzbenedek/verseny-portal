import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/shared/api/client';
import type { GradeFormValues, GradeResponse } from './schemas';

const KEYS = {
  me: ['grades', 'me'] as const,
  student: (studentId: number) => ['grades', 'student', studentId] as const,
  classAverage: (classId: number, subjectId: number) =>
    ['grades', 'class', classId, 'subject', subjectId, 'average'] as const,
};

export function useMyGrades(subjectId?: number) {
  return useQuery({
    queryKey: subjectId ? [...KEYS.me, subjectId] : KEYS.me,
    queryFn: async () => {
      const { data } = await api.get<GradeResponse[]>('/grades/me', {
        params: subjectId ? { subjectId } : undefined,
      });
      return data;
    },
  });
}

export function useStudentGrades(studentId: number | null) {
  return useQuery({
    enabled: studentId !== null,
    queryKey: studentId ? KEYS.student(studentId) : ['grades', 'student', 'none'],
    queryFn: async () => {
      const { data } = await api.get<GradeResponse[]>(`/grades/student/${studentId}`);
      return data;
    },
  });
}

export function useClassAverage(classId: number | null, subjectId: number | null) {
  return useQuery({
    enabled: classId !== null && subjectId !== null,
    queryKey:
      classId && subjectId ? KEYS.classAverage(classId, subjectId) : ['grades', 'avg', 'none'],
    queryFn: async () => {
      const { data } = await api.get<{
        students: Array<{ studentId: number; studentName: string; average: number; count: number }>;
      }>(`/grades/class/${classId}/subject/${subjectId}/average`);
      return data;
    },
  });
}

export function useCreateGrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: GradeFormValues) => {
      const { data } = await api.post<GradeResponse>('/grades', input);
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['grades'] });
    },
  });
}

export function useUpdateGrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: GradeFormValues & { id: number }) => {
      const { data } = await api.put<GradeResponse>(`/grades/${id}`, input);
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['grades'] });
    },
  });
}

export function useDeleteGrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/grades/${id}`);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['grades'] });
    },
  });
}

export function weightedAverage(grades: GradeResponse[]): number {
  const filtered = grades.filter((g) => g.type !== 'YEAR_END');
  if (filtered.length === 0) return 0;
  const sum = filtered.reduce((acc, g) => acc + g.value * g.weight, 0);
  const weight = filtered.reduce((acc, g) => acc + g.weight, 0);
  return weight === 0 ? 0 : sum / weight;
}
