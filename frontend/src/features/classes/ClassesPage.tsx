import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Plus, Trash2, Users } from 'lucide-react';
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
import type { SchoolClassResponse } from '@/shared/types/api';
import { useClasses, useClassStudents, useDeleteClass } from './api';
import { ClassForm } from './components/ClassForm';

export default function ClassesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';
  const { data, isLoading } = useClasses();
  const del = useDeleteClass();
  const [editing, setEditing] = useState<SchoolClassResponse | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [studentsFor, setStudentsFor] = useState<SchoolClassResponse | null>(null);
  const { data: students, isLoading: studentsLoading } = useClassStudents(studentsFor?.id ?? null);

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
        title={t('classes.list')}
        actions={
          canEdit ? (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4" />
                  {t('classes.create')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('classes.create')}</DialogTitle>
                </DialogHeader>
                <ClassForm onDone={() => setCreateOpen(false)} />
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
                <TableHead>{t('classes.displayName')}</TableHead>
                <TableHead>{t('classes.startYear')}</TableHead>
                <TableHead>{t('classes.identifier')}</TableHead>
                <TableHead className="text-right">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.displayName}</TableCell>
                  <TableCell>{c.startYear}</TableCell>
                  <TableCell>{c.identifier}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setStudentsFor(c)}
                        aria-label={t('users.list')}
                      >
                        <Users className="h-4 w-4" />
                      </Button>
                      {canEdit && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditing(c)}
                            aria-label={t('common.edit')}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(c.id)}
                            aria-label={t('common.delete')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('classes.edit')}</DialogTitle>
          </DialogHeader>
          {editing && <ClassForm schoolClass={editing} onDone={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(studentsFor)} onOpenChange={(open) => !open && setStudentsFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {studentsFor?.displayName} — {t('users.list')}
            </DialogTitle>
          </DialogHeader>
          {studentsLoading ? (
            <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
          ) : !students || students.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('common.noData')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('auth.fullName')}</TableHead>
                  <TableHead>{t('auth.email')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.fullName}</TableCell>
                    <TableCell className="text-muted-foreground">{s.email}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
