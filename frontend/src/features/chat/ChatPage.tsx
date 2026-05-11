import { FormEvent, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Send } from 'lucide-react';

import { PageHeader } from '@/shared/components/PageHeader';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { cn } from '@/shared/lib/utils';

interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
  ts: number;
}

const STORAGE_KEY = 'chat.history';

function load(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
  } catch {
    return [];
  }
}

export default function ChatPage() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>(() => load());
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    const now = Date.now();
    const userMsg: ChatMessage = { id: String(now), role: 'user', text: trimmed, ts: now };
    const botMsg: ChatMessage = {
      id: String(now + 1),
      role: 'bot',
      text: t('common.comingSoon') + ' — ' + t('common.stub'),
      ts: now + 1,
    };
    setMessages((prev) => [...prev, userMsg, botMsg]);
    setText('');
  };

  return (
    <>
      <PageHeader title={t('nav.chat')} description={t('common.stub')} />
      <Card className="flex h-[60vh] flex-col">
        <CardContent className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  'max-w-[80%] rounded-lg px-3 py-2 text-sm',
                  m.role === 'user' ? 'ml-auto bg-primary text-primary-foreground' : 'bg-muted',
                )}
              >
                {m.text}
              </div>
            ))}
            <div ref={endRef} />
          </div>
        </CardContent>
        <form onSubmit={submit} className="flex gap-2 border-t p-3">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="..."
            aria-label="chat"
          />
          <Button type="submit" size="icon" aria-label="send">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </Card>
    </>
  );
}
