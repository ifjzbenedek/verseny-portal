import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { PageHeader } from '@/shared/components/PageHeader';
import { EmptyState } from '@/shared/components/EmptyState';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { useAuth } from '@/auth/AuthContext';
import {
  useContacts,
  useConversation,
  useInbox,
  useMarkRead,
  useSendMessage,
} from './api';

export default function MessagingPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const inbox = useInbox();
  const contacts = useContacts();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draft, setDraft] = useState('');

  const conversation = useConversation(selectedId);
  const sendMessage = useSendMessage();
  const markRead = useMarkRead();
  const markReadMutate = markRead.mutate;

  const partners = useMemo(() => {
    const map = new Map<number, { id: number; name: string; unread: number; last?: string }>();
    if (contacts.data) {
      for (const c of contacts.data) {
        map.set(c.id, { id: c.id, name: `${c.fullName} (${c.role})`, unread: 0 });
      }
    }
    if (inbox.data) {
      for (const m of inbox.data) {
        if (!m.fromUserId) continue;
        const entry = map.get(m.fromUserId) ?? {
          id: m.fromUserId,
          name: m.fromUserName ?? `#${m.fromUserId}`,
          unread: 0,
        };
        if (!m.readAt) entry.unread += 1;
        if (!entry.last) entry.last = m.body;
        map.set(m.fromUserId, entry);
      }
    }
    return Array.from(map.values()).sort((a, b) => b.unread - a.unread || a.name.localeCompare(b.name));
  }, [contacts.data, inbox.data]);

  useEffect(() => {
    if (!conversation.data || !user) return;
    const unreadForMe = conversation.data.filter((m) => m.toUserId === user.id && !m.readAt);
    for (const m of unreadForMe) {
      markReadMutate(m.id);
    }
  }, [conversation.data, user, markReadMutate]);

  const handleSend = () => {
    if (!selectedId || draft.trim().length === 0) return;
    sendMessage.mutate(
      { toUserId: selectedId, body: draft.trim() },
      {
        onSuccess: () => setDraft(''),
        onError: () => toast.error(t('common.error', { defaultValue: 'Hiba történt' })),
      },
    );
  };

  return (
    <>
      <PageHeader title={t('nav.messages', { defaultValue: 'Üzenetek' })} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[280px_1fr]">
        <Card>
          <CardContent className="p-2">
            <div className="mb-2 px-2 text-sm font-semibold">{t('messaging.contacts', { defaultValue: 'Kontaktok' })}</div>
            {partners.length === 0 ? (
              <EmptyState title={t('messaging.noContacts', { defaultValue: 'Nincs elérhető kontakt' })} />
            ) : (
              <ul className="space-y-1">
                {partners.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(p.id)}
                      className={`flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm hover:bg-accent ${
                        selectedId === p.id ? 'bg-accent' : ''
                      }`}
                    >
                      <span className="truncate">{p.name}</span>
                      {p.unread > 0 && <Badge variant="default">{p.unread}</Badge>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex h-[60vh] flex-col p-4">
            {selectedId === null ? (
              <EmptyState title={t('messaging.selectContact', { defaultValue: 'Válassz egy kontaktot' })} />
            ) : (
              <>
                <div className="flex-1 space-y-2 overflow-y-auto pr-2">
                  {conversation.isLoading ? (
                    <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
                  ) : !conversation.data || conversation.data.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {t('messaging.empty', { defaultValue: 'Még nincs üzenet ezzel a kontakttal.' })}
                    </p>
                  ) : (
                    conversation.data.map((m) => {
                      const mine = m.fromUserId === user?.id;
                      return (
                        <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                              mine
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-foreground'
                            }`}
                          >
                            <div className="whitespace-pre-wrap break-words">{m.body}</div>
                            <div className="mt-1 text-[10px] opacity-70">
                              {new Date(m.sentAt).toLocaleString('hu-HU')}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="mt-3 flex gap-2"
                >
                  <Input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={t('messaging.placeholder', { defaultValue: 'Írd ide az üzeneted…' })}
                  />
                  <Button type="submit" disabled={sendMessage.isPending || draft.trim().length === 0}>
                    {t('messaging.send', { defaultValue: 'Küldés' })}
                  </Button>
                </form>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
