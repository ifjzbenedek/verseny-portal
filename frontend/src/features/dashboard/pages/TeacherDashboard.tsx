import { useTranslation } from 'react-i18next';

import { useAuth } from '@/auth/AuthContext';
import { PageHeader } from '@/shared/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { useMyTeaching } from '@/features/assignments/api';

export default function TeacherDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: teaching } = useMyTeaching();

  return (
    <>
      <PageHeader title={t('dashboard.welcome', { name: user?.fullName ?? '' })} />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <DashboardCard
          title={t('dashboard.teacher.myTeaching')}
          value={String(teaching?.length ?? 0)}
        />
        <DashboardCard title={t('dashboard.teacher.todayLessons')} value="—" />
        <DashboardCard title={t('dashboard.teacher.pendingHomework')} value="—" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.teacher.myTeaching')}</CardTitle>
        </CardHeader>
        <CardContent>
          {!teaching || teaching.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('common.noData')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('assignments.schoolClass')}</TableHead>
                  <TableHead>{t('assignments.subject')}</TableHead>
                  <TableHead>{t('assignments.year')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teaching.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{a.schoolClassName}</TableCell>
                    <TableCell>{a.subjectName}</TableCell>
                    <TableCell>{a.year}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
