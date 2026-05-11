import { FormEvent, useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';

interface Course {
  id: number;
  code: string;
  title: string;
  description?: string;
  credits?: number;
  instructor?: { fullName: string };
}

export default function Courses() {
  const { user } = useAuth();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'OKTATO';
  const canDelete = user?.role === 'ADMIN';

  const [items, setItems] = useState<Course[]>([]);
  const [form, setForm] = useState({ code: '', title: '', description: '', credits: 3 });
  const [editingId, setEditingId] = useState<number | null>(null);

  const reload = async () => {
    const { data } = await api.get<Course[]>('/courses');
    setItems(data);
  };

  useEffect(() => { reload(); }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await api.put(`/courses/${editingId}`, form);
    } else {
      await api.post('/courses', form);
    }
    setForm({ code: '', title: '', description: '', credits: 3 });
    setEditingId(null);
    reload();
  };

  const edit = (c: Course) => {
    setEditingId(c.id);
    setForm({ code: c.code, title: c.title, description: c.description ?? '', credits: c.credits ?? 3 });
  };

  const del = async (id: number) => {
    if (!confirm('Biztosan törlöd?')) return;
    await api.delete(`/courses/${id}`);
    reload();
  };

  return (
    <div className="col">
      <div className="card">
        <h2>Kurzusok</h2>
        <table>
          <thead>
            <tr><th>Kód</th><th>Cím</th><th>Kredit</th><th>Oktató</th><th></th></tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id}>
                <td>{c.code}</td>
                <td>{c.title}</td>
                <td>{c.credits}</td>
                <td>{c.instructor?.fullName ?? '—'}</td>
                <td>
                  <div className="row">
                    {canEdit && <button className="secondary" onClick={() => edit(c)}>Szerkeszt</button>}
                    {canDelete && <button className="danger" onClick={() => del(c.id)}>Töröl</button>}
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: '#6b7280' }}>Nincs kurzus.</td></tr>}
          </tbody>
        </table>
      </div>

      {canEdit && (
        <div className="card">
          <h3>{editingId ? 'Kurzus szerkesztése' : 'Új kurzus'}</h3>
          <form className="col" onSubmit={submit}>
            <input placeholder="Kód (pl. VIMIAB00)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            <input placeholder="Cím" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <textarea placeholder="Leírás" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <input type="number" placeholder="Kredit" value={form.credits} onChange={(e) => setForm({ ...form, credits: Number(e.target.value) })} />
            <div className="row">
              <button type="submit">{editingId ? 'Mentés' : 'Létrehoz'}</button>
              {editingId && <button type="button" className="secondary" onClick={() => { setEditingId(null); setForm({ code: '', title: '', description: '', credits: 3 }); }}>Mégse</button>}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
