import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/auth/AuthContext';
import { PageHeader } from '@/shared/components/PageHeader';
import { EmptyState } from '@/shared/components/EmptyState';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import type { SubjectResponse } from '@/shared/types/api';
import { useDeleteSubject, useSubjects } from './api';
import { SubjectForm } from './components/SubjectForm';

export default function SubjectsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';
  const { data, isLoading } = useSubjects();
  const del = useDeleteSubject();
  const [editing, setEditing] = useState<SubjectResponse | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const handleDelete = async (id: number) => {
    if (!confirm(t('common.deleteConfirm'))) return;
    try {
      await del.mutateAsync(id);
      toast.success(t('common.deleted'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <>
      <PageHeader
        title={t('subjects.list')}
        actions={
          canEdit ? (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4" />
                  {t('subjects.create')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('subjects.create')}</DialogTitle>
                </DialogHeader>
                <SubjectForm onDone={() => setCreateOpen(false)} />
              </DialogContent>
            </Dialog>
          ) : null
        }
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
      ) : !data || data.length === 0 ? (
        <EmptyState title={t('common.noData')} />
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('subjects.name')}</TableHead>
                <TableHead>{t('subjects.description')}</TableHead>
                <TableHead>{t('subjects.requiredBook')}</TableHead>
                {canEdit && <TableHead className="text-right">{t('common.actions')}</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="max-w-md truncate text-muted-foreground">
                    {s.description ?? '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{s.requiredBook ?? '—'}</TableCell>
                  {canEdit && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditing(s)}
                          aria-label={t('common.edit')}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(s.id)}
                          aria-label={t('common.delete')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('subjects.edit')}</DialogTitle>
          </DialogHeader>
          {editing && <SubjectForm subject={editing} onDone={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
