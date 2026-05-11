import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/shared/components/PageHeader';
import { EmptyState } from '@/shared/components/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { useMyGrades, weightedAverage } from '../api';
import { GradeTable } from '../components/GradeTable';
import type { GradeResponse } from '../schemas';

export default function MyGradesPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useMyGrades();

  const grouped = useMemo(() => {
    if (!data) return new Map<string, GradeResponse[]>();
    const map = new Map<string, GradeResponse[]>();
    for (const g of data) {
      const key = g.subjectName ?? '—';
      const arr = map.get(key);
      if (arr) arr.push(g);
      else map.set(key, [g]);
    }
    return map;
  }, [data]);

  return (
    <>
      <PageHeader title={t('grades.myGrades')} />
      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
      ) : !data || data.length === 0 ? (
        <EmptyState title={t('grades.noGrades')} />
      ) : (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([subject, grades]) => {
            const avg = weightedAverage(grades);
            return (
              <Card key={subject}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>{subject}</CardTitle>
                  <div className="text-sm text-muted-foreground">
                    {t('grades.weightedAverage')}:{' '}
                    <span className="font-semibold text-foreground">{avg.toFixed(2)}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <GradeTable grades={grades} showSubject={false} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
