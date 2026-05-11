import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('admin@portal.hu');
  const [password, setPassword] = useState('password');
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      nav('/');
    } catch {
      setErr('Hibás email vagy jelszó.');
    }
  };

  return (
    <div className="card" style={{ maxWidth: 400, margin: '40px auto' }}>
      <h2>Bejelentkezés</h2>
      <form className="col" onSubmit={submit}>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Jelszó" type="password" />
        {err && <div style={{ color: '#dc2626' }}>{err}</div>}
        <button type="submit">Belépés</button>
      </form>
      <p style={{ fontSize: 13, color: '#6b7280', marginTop: 16 }}>
        Teszt: admin@portal.hu / oktato@portal.hu / hallgato@portal.hu — jelszó: <code>password</code>
      </p>
    </div>
  );
}
