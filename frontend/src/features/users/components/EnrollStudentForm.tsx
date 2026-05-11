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
import { enrollStudentSchema, type EnrollStudentValues } from '../schemas';
import { useEnrollStudent } from '../api';

interface Props {
  onDone?: () => void;
}

export function EnrollStudentForm({ onDone }: Props) {
  const { t } = useTranslation();
  const enroll = useEnrollStudent();
  const { data: classes } = useClasses();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EnrollStudentValues>({
    resolver: zodResolver(enrollStudentSchema),
    defaultValues: { userId: 0, schoolClassId: 0 },
  });
  const schoolClassId = watch('schoolClassId');

  const onSubmit = async (values: EnrollStudentValues) => {
    try {
      await enroll.mutateAsync(values);
      toast.success(t('common.created'));
      onDone?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  };

  const pending = isSubmitting || enroll.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="enroll-userId">{t('users.userId')}</Label>
        <Input
          id="enroll-userId"
          type="number"
          {...register('userId', { valueAsNumber: true })}
          aria-invalid={Boolean(errors.userId)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="enroll-class">{t('users.schoolClass')}</Label>
        <Select
          value={schoolClassId ? String(schoolClassId) : ''}
          onValueChange={(v) => setValue('schoolClassId', Number(v))}
        >
          <SelectTrigger id="enroll-class" aria-invalid={Boolean(errors.schoolClassId)}>
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
