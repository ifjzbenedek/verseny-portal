import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/shared/components/PageHeader';
import { EmptyState } from '@/shared/components/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
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
import { useClassAverage } from '../api';

export default function ClassAveragesPage() {
  const { t } = useTranslation();
  const [classId, setClassId] = useState<number | null>(null);
  const [subjectId, setSubjectId] = useState<number | null>(null);
  const { data, isLoading } = useClassAverage(classId, subjectId);

  return (
    <>
      <PageHeader title={t('grades.weightedAverage')} />
      <Card className="mb-6">
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="classId">Class ID</Label>
            <Input
              id="classId"
              type="number"
              value={classId ?? ''}
              onChange={(e) => setClassId(e.target.value ? Number(e.target.value) : null)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="subjectId">Subject ID</Label>
            <Input
              id="subjectId"
              type="number"
              value={subjectId ?? ''}
              onChange={(e) => setSubjectId(e.target.value ? Number(e.target.value) : null)}
            />
          </div>
        </CardContent>
      </Card>

      {!classId || !subjectId ? (
        <EmptyState title={t('common.noData')} description="Adj meg osztály és tárgy ID-t." />
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
      ) : !data || data.perStudent.length === 0 ? (
        <EmptyState title={t('common.noData')} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-baseline justify-between gap-2">
              <span>
                {data.schoolClassName} — {data.subjectName}
              </span>
              <span className="text-base font-normal text-muted-foreground">
                {t('grades.weightedAverage')}:{' '}
                <span className="font-semibold text-foreground">
                  {data.classWeightedAverage?.toFixed(2) ?? '—'}
                </span>
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Diák</TableHead>
                  <TableHead>{t('grades.weightedAverage')}</TableHead>
                  <TableHead>Db</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.perStudent.map((s) => (
                  <TableRow key={s.studentId}>
                    <TableCell>{s.studentName ?? '—'}</TableCell>
                    <TableCell className="font-medium">{s.weightedAverage.toFixed(2)}</TableCell>
                    <TableCell className="text-muted-foreground">{s.gradeCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  );
}
