import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/shared/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { GradeForm } from '../components/GradeForm';

export default function RecordGradePage() {
  const { t } = useTranslation();
  const [assignmentId, setAssignmentId] = useState<number>(0);
  const [studentId, setStudentId] = useState<number>(0);

  return (
    <>
      <PageHeader title={t('grades.addGrade')} />
      <Card>
        <CardHeader>
          <CardTitle>{t('grades.addGrade')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="assignmentId">Assignment ID</Label>
              <Input
                id="assignmentId"
                type="number"
                value={assignmentId || ''}
                onChange={(e) => setAssignmentId(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="studentId">Student ID</Label>
              <Input
                id="studentId"
                type="number"
                value={studentId || ''}
                onChange={(e) => setStudentId(Number(e.target.value))}
              />
            </div>
          </div>
          {assignmentId > 0 && studentId > 0 && (
            <GradeForm assignmentId={assignmentId} studentId={studentId} />
          )}
        </CardContent>
      </Card>
    </>
  );
}
