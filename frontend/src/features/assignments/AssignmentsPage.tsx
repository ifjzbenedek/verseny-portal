import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/auth/AuthContext';
import { PageHeader } from '@/shared/components/PageHeader';
import { EmptyState } from '@/shared/components/EmptyState';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { useAssignments, useDeleteAssignment, type AssignmentFilters } from './api';
import { AssignmentForm } from './components/AssignmentForm';

export default function AssignmentsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';
  const [filters, setFilters] = useState<AssignmentFilters>({});
  const { data, isLoading } = useAssignments(filters);
  const del = useDeleteAssignment();
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
        title={t('assignments.list')}
        actions={
          canEdit ? (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4" />
                  {t('assignments.create')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('assignments.create')}</DialogTitle>
                </DialogHeader>
                <AssignmentForm onDone={() => setCreateOpen(false)} />
              </DialogContent>
            </Dialog>
          ) : null
        }
      />

      <Card className="mb-6">
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="filter-year">{t('assignments.filters.year')}</Label>
            <Input
              id="filter-year"
              type="number"
              value={filters.year ?? ''}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  year: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="filter-class">{t('assignments.filters.classId')}</Label>
            <Input
              id="filter-class"
              type="number"
              value={filters.classId ?? ''}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  classId: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="filter-teacher">{t('assignments.filters.teacherId')}</Label>
            <Input
              id="filter-teacher"
              type="number"
              value={filters.teacherId ?? ''}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  teacherId: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
      ) : !data || data.length === 0 ? (
        <EmptyState title={t('common.noData')} />
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('assignments.year')}</TableHead>
                <TableHead>{t('assignments.schoolClass')}</TableHead>
                <TableHead>{t('assignments.subject')}</TableHead>
                <TableHead>{t('assignments.teacher')}</TableHead>
                {canEdit && <TableHead className="text-right">{t('common.actions')}</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{a.year}</TableCell>
                  <TableCell>{a.schoolClassName}</TableCell>
                  <TableCell>{a.subjectName}</TableCell>
                  <TableCell>{a.teacherName}</TableCell>
                  {canEdit && (
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(a.id)}
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
      )}
    </>
  );
}
