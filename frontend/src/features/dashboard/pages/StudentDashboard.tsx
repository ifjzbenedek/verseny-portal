import { useTranslation } from 'react-i18next';

import { useAuth } from '@/auth/AuthContext';
import { PageHeader } from '@/shared/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { useMyGrades, weightedAverage } from '@/features/grades/api';
import { useMySubjects } from '@/features/assignments/api';
import { GradeTable } from '@/features/grades/components/GradeTable';

export default function StudentDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: grades } = useMyGrades();
  const { data: subjects } = useMySubjects();

  const avg = grades ? weightedAverage(grades) : 0;
  const recent = grades
    ? [...grades].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt)).slice(0, 5)
    : [];

  return (
    <>
      <PageHeader title={t('dashboard.welcome', { name: user?.fullName ?? '' })} />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <DashboardCard title={t('grades.weightedAverage')} value={avg ? avg.toFixed(2) : '—'} />
        <DashboardCard title={t('grades.myGrades')} value={String(grades?.length ?? 0)} />
        <DashboardCard title={t('subjects.list')} value={String(subjects?.length ?? 0)} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.student.recentGrades')}</CardTitle>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('grades.noGrades')}</p>
          ) : (
            <GradeTable grades={recent} showSubject />
          )}
        </CardContent>
      </Card>
    </>
  );
}

function DashboardCard({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
