import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/shared/api/client';
import type {
  MessageContact,
  MessageResponse,
  UnreadCountResponse,
} from '@/shared/types/api';

const KEYS = {
  inbox: ['messages', 'inbox'] as const,
  conversation: (userId: number) => ['messages', 'with', userId] as const,
  unread: ['messages', 'unread'] as const,
  contacts: ['messages', 'contacts'] as const,
};

export function useInbox() {
  return useQuery({
    queryKey: KEYS.inbox,
    queryFn: async () => {
      const { data } = await api.get<MessageResponse[]>('/messages/inbox');
      return data;
    },
  });
}

export function useConversation(userId: number | null) {
  return useQuery({
    enabled: userId !== null,
    queryKey: userId ? KEYS.conversation(userId) : ['messages', 'with', 'none'],
    queryFn: async () => {
      const { data } = await api.get<MessageResponse[]>(`/messages/with/${userId}`);
      return data;
    },
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: KEYS.unread,
    queryFn: async () => {
      const { data } = await api.get<UnreadCountResponse>('/messages/unread-count');
      return data.count;
    },
  });
}

export function useContacts() {
  return useQuery({
    queryKey: KEYS.contacts,
    queryFn: async () => {
      const { data } = await api.get<MessageContact[]>('/messages/contacts');
      return data;
    },
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { toUserId: number; body: string }) => {
      const { data } = await api.post<MessageResponse>('/messages', input);
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.patch<MessageResponse>(`/messages/${id}/read`);
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}
