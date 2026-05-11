import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, UserPlus } from 'lucide-react';
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
import { useDeleteStudent, useStudents } from './api';
import { RegisterUserForm } from './components/RegisterUserForm';
import { EnrollStudentForm } from './components/EnrollStudentForm';

export default function UsersPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';
  const [page, setPage] = useState(0);
  const size = 20;
  const { data, isLoading } = useStudents(page, size);
  const del = useDeleteStudent();
  const [regOpen, setRegOpen] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);

  const dateFmt = new Intl.DateTimeFormat(i18n.language, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

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
        title={t('users.list')}
        actions={
          canEdit ? (
            <div className="flex gap-2">
              <Dialog open={regOpen} onOpenChange={setRegOpen}>
                <DialogTrigger asChild>
                  <Button variant="secondary">
                    <UserPlus className="h-4 w-4" />
                    {t('users.registerUser')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('users.registerUser')}</DialogTitle>
                  </DialogHeader>
                  <RegisterUserForm onDone={() => setRegOpen(false)} />
                </DialogContent>
              </Dialog>

              <Dialog open={enrollOpen} onOpenChange={setEnrollOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4" />
                    {t('users.createStudent')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('users.createStudent')}</DialogTitle>
                  </DialogHeader>
                  <EnrollStudentForm onDone={() => setEnrollOpen(false)} />
                </DialogContent>
              </Dialog>
            </div>
          ) : null
        }
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
      ) : !data || data.content.length === 0 ? (
        <EmptyState title={t('common.noData')} description={t('users.noStudent')} />
      ) : (
        <>
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('auth.fullName')}</TableHead>
                  <TableHead>{t('auth.email')}</TableHead>
                  <TableHead>{t('users.schoolClass')}</TableHead>
                  <TableHead>{t('users.enrolledAt')}</TableHead>
                  {canEdit && <TableHead className="text-right">{t('common.actions')}</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.content.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.fullName}</TableCell>
                    <TableCell className="text-muted-foreground">{s.email}</TableCell>
                    <TableCell>{s.schoolClassName}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {s.enrolledAt ? dateFmt.format(new Date(s.enrolledAt)) : '—'}
                    </TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(s.id)}
                          aria-label={t('common.delete')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {data.number * data.size + 1}–
              {Math.min((data.number + 1) * data.size, data.totalElements)} / {data.totalElements}
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                {t('common.previous')}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page + 1 >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                {t('common.next')}
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
