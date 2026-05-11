import { useTranslation } from 'react-i18next';

import { useAuth } from '@/auth/AuthContext';
import { PageHeader } from '@/shared/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { useSubjects } from '@/features/subjects/api';
import { useClasses } from '@/features/classes/api';
import { useStudents } from '@/features/users/api';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: subjects } = useSubjects();
  const { data: classes } = useClasses();
  const { data: students } = useStudents(0, 1);

  return (
    <>
      <PageHeader title={t('dashboard.welcome', { name: user?.fullName ?? '' })} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DashboardCard
          title={t('dashboard.admin.userCount')}
          value={students ? String(students.totalElements) : '—'}
        />
        <DashboardCard
          title={t('dashboard.admin.classCount')}
          value={classes ? String(classes.length) : '—'}
        />
        <DashboardCard
          title={t('dashboard.admin.subjectCount')}
          value={subjects ? String(subjects.length) : '—'}
        />
      </div>
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
