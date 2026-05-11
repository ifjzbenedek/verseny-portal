import { useState, useRef, useEffect, FormEvent } from 'react';

interface Msg {
  role: 'user' | 'assistant';
  content: string;
}

const CHATBOT_URL = (import.meta.env.VITE_CHATBOT_URL as string) || 'http://localhost:8000';

export default function Chat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setError(null);
    const nextHistory: Msg[] = [...messages, { role: 'user', content: text }];
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
        body: JSON.stringify({
          message: text,
          history: messages,
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`${res.status}: ${body}`);
      }
      const data = (await res.json()) as { reply: string };
      setMessages([...nextHistory, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      const m = err instanceof Error ? err.message : String(err);
      setError(m);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', height: '70vh' }}>
      <h2>Chatbot</h2>
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          border: '1px solid #ddd',
          borderRadius: 8,
          padding: 12,
          background: '#fafafa',
        }}
      >
        {messages.length === 0 && (
          <p style={{ color: '#888' }}>
            Üdv! Kérdezhetsz pl. a jegyeidről, tárgyaidról, kurzusokról.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              margin: '8px 0',
              textAlign: m.role === 'user' ? 'right' : 'left',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                padding: '8px 12px',
                borderRadius: 12,
                background: m.role === 'user' ? '#2563eb' : '#e5e7eb',
                color: m.role === 'user' ? 'white' : 'black',
                whiteSpace: 'pre-wrap',
                maxWidth: '80%',
                textAlign: 'left',
              }}
            >
              {m.content}
            </span>
          </div>
        ))}
        {loading && <div style={{ color: '#888' }}>Gondolkodom...</div>}
        <div ref={endRef} />
      </div>
      {error && (
        <div style={{ color: 'crimson', marginTop: 8 }}>Hiba: {error}</div>
      )}
      <form onSubmit={send} style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Írd ide a kérdésed..."
          disabled={loading}
          style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
        />
        <button type="submit" disabled={loading || !input.trim()}>
          Küldés
        </button>
      </form>
    </div>
  );
}
