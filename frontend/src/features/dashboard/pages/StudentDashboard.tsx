import { useTranslation } from 'react-i18next';

import { useAuth } from '@/auth/AuthContext';
import { PageHeader } from '@/shared/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';

export default function StudentDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  return (
    <>
      <PageHeader title={t('dashboard.welcome', { name: user?.fullName ?? '' })} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard title={t('dashboard.student.recentGrades')} value="—" />
        <DashboardCard title={t('dashboard.student.todaySchedule')} value="—" />
        <DashboardCard title={t('dashboard.student.upcomingEvents')} value="—" />
        <DashboardCard title={t('dashboard.student.unreadMessages')} value="—" />
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
