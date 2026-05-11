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
import { gradeFormSchema, type GradeFormValues } from '../schemas';
import { useCreateGrade } from '../api';

interface Props {
  assignmentId: number;
  studentId: number;
  onSuccess?: () => void;
}

const TYPES: GradeFormValues['type'][] = ['NORMAL', 'MIDTERM', 'HALFYEAR', 'YEAR_END'];

export function GradeForm({ assignmentId, studentId, onSuccess }: Props) {
  const { t } = useTranslation();
  const create = useCreateGrade();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<GradeFormValues>({
    resolver: zodResolver(gradeFormSchema),
    defaultValues: {
      value: 5,
      type: 'NORMAL',
      weight: 1,
      comment: '',
      assignmentId,
      studentId,
    },
  });

  const onSubmit = async (values: GradeFormValues) => {
    try {
      await create.mutateAsync(values);
      toast.success(t('grades.saved'));
      reset({ value: 5, type: 'NORMAL', weight: 1, comment: '', assignmentId, studentId });
      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(message);
    }
  };

  const currentType = watch('type');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" {...register('assignmentId', { valueAsNumber: true })} />
      <input type="hidden" {...register('studentId', { valueAsNumber: true })} />

      <div className="space-y-1.5">
        <Label htmlFor="value">{t('grades.value')}</Label>
        <Input
          id="value"
          type="number"
          min={1}
          max={5}
          {...register('value', { valueAsNumber: true })}
          aria-invalid={Boolean(errors.value)}
          aria-describedby={errors.value ? 'value-error' : undefined}
        />
        {errors.value && (
          <p id="value-error" className="text-sm text-destructive">
            {t('grades.errors.value')}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="type">{t('grades.type')}</Label>
        <Select value={currentType} onValueChange={(v) => setValue('type', v as GradeFormValues['type'])}>
          <SelectTrigger id="type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPES.map((tp) => (
              <SelectItem key={tp} value={tp}>
                {t(`grades.types.${tp}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="weight">{t('grades.weight')}</Label>
        <Input
          id="weight"
          type="number"
          step="0.1"
          min={0.1}
          {...register('weight', { valueAsNumber: true })}
          aria-invalid={Boolean(errors.weight)}
        />
        {errors.weight && <p className="text-sm text-destructive">{t('grades.errors.weight')}</p>}
      </div>

      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="comment">{t('grades.comment')}</Label>
        <Input id="comment" {...register('comment')} maxLength={1000} />
      </div>

      <div className="sm:col-span-2">
        <Button type="submit" disabled={isSubmitting || create.isPending}>
          {t('common.save')}
        </Button>
      </div>
    </form>
  );
}
