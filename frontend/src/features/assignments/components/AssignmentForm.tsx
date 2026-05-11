import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { useClasses } from '@/features/classes/api';
import { useSubjects } from '@/features/subjects/api';
import { assignmentFormSchema, type AssignmentFormValues } from '../schemas';
import { useCreateAssignment } from '../api';

interface Props {
  onDone?: () => void;
}

export function AssignmentForm({ onDone }: Props) {
  const { t } = useTranslation();
  const create = useCreateAssignment();
  const { data: classes } = useClasses();
  const { data: subjects } = useSubjects();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: {
      schoolClassId: 0,
      subjectId: 0,
      teacherId: 0,
      year: new Date().getFullYear(),
    },
  });

  const schoolClassId = watch('schoolClassId');
  const subjectId = watch('subjectId');

  const onSubmit = async (values: AssignmentFormValues) => {
    try {
      await create.mutateAsync(values);
      toast.success(t('common.created'));
      onDone?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  };

  const pending = isSubmitting || create.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="assignment-class">{t('assignments.schoolClass')}</Label>
        <Select
          value={schoolClassId ? String(schoolClassId) : ''}
          onValueChange={(v) => setValue('schoolClassId', Number(v))}
        >
          <SelectTrigger id="assignment-class" aria-invalid={Boolean(errors.schoolClassId)}>
            <SelectValue placeholder="..." />
          </SelectTrigger>
          <SelectContent>
            {classes?.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="assignment-subject">{t('assignments.subject')}</Label>
        <Select
          value={subjectId ? String(subjectId) : ''}
          onValueChange={(v) => setValue('subjectId', Number(v))}
        >
          <SelectTrigger id="assignment-subject" aria-invalid={Boolean(errors.subjectId)}>
            <SelectValue placeholder="..." />
          </SelectTrigger>
          <SelectContent>
            {subjects?.map((s) => (
              <SelectItem key={s.id} value={String(s.id)}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="assignment-teacher">{t('assignments.teacher')} (User ID, OKTATO)</Label>
        <Input
          id="assignment-teacher"
          type="number"
          {...register('teacherId', { valueAsNumber: true })}
          aria-invalid={Boolean(errors.teacherId)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="assignment-year">{t('assignments.year')}</Label>
        <Input
          id="assignment-year"
          type="number"
          min={2000}
          max={2100}
          {...register('year', { valueAsNumber: true })}
          aria-invalid={Boolean(errors.year)}
        />
      </div>

      <div className="flex justify-end gap-2">
        {onDone && (
          <Button type="button" variant="secondary" onClick={onDone} disabled={pending}>
            {t('common.cancel')}
          </Button>
        )}
        <Button type="submit" disabled={pending}>
          {t('common.save')}
        </Button>
      </div>
    </form>
  );
}
