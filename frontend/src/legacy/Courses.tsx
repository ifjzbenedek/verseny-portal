import { FormEvent, useEffect, useState } from 'react';

import { api } from '@/shared/api/client';
import { useAuth } from '@/auth/AuthContext';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';

interface Course {
  id: number;
  code: string;
  title: string;
  description?: string;
  credits?: number;
  instructor?: { fullName: string };
}

export default function LegacyCourses() {
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

  useEffect(() => {
    void reload();
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (editingId) await api.put(`/courses/${editingId}`, form);
    else await api.post('/courses', form);
    setForm({ code: '', title: '', description: '', credits: 3 });
    setEditingId(null);
    void reload();
  };

  const edit = (c: Course) => {
    setEditingId(c.id);
    setForm({
      code: c.code,
      title: c.title,
      description: c.description ?? '',
      credits: c.credits ?? 3,
    });
  };

  const del = async (id: number) => {
    if (!confirm('Biztosan törlöd?')) return;
    await api.delete(`/courses/${id}`);
    void reload();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-4">
        <h2 className="mb-3 text-xl font-semibold">Kurzusok (legacy)</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kód</TableHead>
              <TableHead>Cím</TableHead>
              <TableHead>Kredit</TableHead>
              <TableHead>Oktató</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.code}</TableCell>
                <TableCell>{c.title}</TableCell>
                <TableCell>{c.credits}</TableCell>
                <TableCell>{c.instructor?.fullName ?? '—'}</TableCell>
                <TableCell className="space-x-2">
                  {canEdit && (
                    <Button variant="secondary" size="sm" onClick={() => edit(c)}>
                      Szerkeszt
                    </Button>
                  )}
                  {canDelete && (
                    <Button variant="destructive" size="sm" onClick={() => void del(c.id)}>
                      Töröl
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {canEdit && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 text-lg font-semibold">{editingId ? 'Kurzus szerkesztése' : 'Új kurzus'}</h3>
          <form className="grid gap-3" onSubmit={submit}>
            <Input
              placeholder="Kód (pl. VIMIAB00)"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
            />
            <Input
              placeholder="Cím"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <Input
              placeholder="Leírás"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <Input
              type="number"
              placeholder="Kredit"
              value={form.credits}
              onChange={(e) => setForm({ ...form, credits: Number(e.target.value) })}
            />
            <div className="flex gap-2">
              <Button type="submit">{editingId ? 'Mentés' : 'Létrehoz'}</Button>
              {editingId && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setEditingId(null);
                    setForm({ code: '', title: '', description: '', credits: 3 });
                  }}
                >
                  Mégse
                </Button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
