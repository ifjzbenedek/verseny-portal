import { FormEvent, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Send } from 'lucide-react';

import { PageHeader } from '@/shared/components/PageHeader';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { cn } from '@/shared/lib/utils';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const CHATBOT_URL =
  (import.meta.env.VITE_CHATBOT_URL as string | undefined) ?? 'http://localhost:8000';

export default function ChatPage() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setError(null);
    const nextHistory: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(nextHistory);
    setInput('');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${CHATBOT_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token ?? ''}`,
        },
        body: JSON.stringify({ message: text, history: messages }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`${res.status}: ${body}`);
      }
      const data = (await res.json()) as { reply: string };
      setMessages([...nextHistory, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader title={t('nav.chat')} description="Iskolai AI asszisztens" />
      <Card className="flex h-[60vh] flex-col">
        <CardContent className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Üdv! Kérdezhetsz pl. a jegyeidről, tárgyaidról vagy tanulási tippekről.
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  'max-w-[80%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm',
                  m.role === 'user'
                    ? 'ml-auto bg-primary text-primary-foreground'
                    : 'bg-muted',
                )}
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="text-sm text-muted-foreground">Gondolkodom…</div>
            )}
            {error && (
              <div className="text-sm text-destructive">Hiba: {error}</div>
            )}
            <div ref={endRef} />
          </div>
        </CardContent>
        <form onSubmit={submit} className="flex gap-2 border-t p-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Írd ide a kérdésed..."
            disabled={loading}
            aria-label="chat"
          />
          <Button type="submit" size="icon" disabled={loading || !input.trim()} aria-label="send">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </Card>
    </>
  );
}
