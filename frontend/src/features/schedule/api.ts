import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/shared/api/client';
import { useAuth } from '@/auth/AuthContext';
import type { Role } from '@/shared/types/api';
import type { ScheduleSlotCreateInput, ScheduleSlotResponse } from './types';

const KEYS = {
  myClass: ['schedule', 'my-class'] as const,
  myTeaching: ['schedule', 'my-teaching'] as const,
  all: ['schedule', 'all'] as const,
};

function endpointFor(role: Role | undefined): string | null {
  switch (role) {
    case 'HALLGATO':
      return '/schedule/my-class';
    case 'OKTATO':
      return '/schedule/my-teaching';
    case 'ADMIN':
    case 'SUPERADMIN':
      return '/schedule';
    default:
      return null;
  }
}

function keyFor(role: Role | undefined): readonly string[] {
  switch (role) {
    case 'HALLGATO':
      return KEYS.myClass;
    case 'OKTATO':
      return KEYS.myTeaching;
    default:
      return KEYS.all;
  }
}

export function useMySchedule() {
  const { user } = useAuth();
  const url = endpointFor(user?.role);
  return useQuery({
    enabled: url !== null,
    queryKey: keyFor(user?.role),
    queryFn: async () => {
      const { data } = await api.get<ScheduleSlotResponse[]>(url!);
      return data;
    },
  });
}

export function useAllSchedule() {
  return useQuery({
    queryKey: KEYS.all,
    queryFn: async () => {
      const { data } = await api.get<ScheduleSlotResponse[]>('/schedule');
      return data;
    },
  });
}

export function useCreateSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ScheduleSlotCreateInput) => {
      const { data } = await api.post<ScheduleSlotResponse>('/schedule', input);
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['schedule'] });
    },
  });
}

export function useDeleteSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/schedule/${id}`);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['schedule'] });
    },
  });
}
