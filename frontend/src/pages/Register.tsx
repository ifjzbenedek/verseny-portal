import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, Role } from '../auth/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<Role>('HALLGATO');
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await register(email, password, fullName, role);
      nav('/');
    } catch {
      setErr('Sikertelen regisztráció (létező email?).');
    }
  };

  return (
    <div className="card" style={{ maxWidth: 400, margin: '40px auto' }}>
      <h2>Regisztráció</h2>
      <form className="col" onSubmit={submit}>
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Teljes név" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Jelszó" type="password" />
        <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
          <option value="HALLGATO">Hallgató</option>
          <option value="OKTATO">Oktató</option>
        </select>
        {err && <div style={{ color: '#dc2626' }}>{err}</div>}
        <button type="submit">Regisztráció</button>
      </form>
    </div>
  );
}
