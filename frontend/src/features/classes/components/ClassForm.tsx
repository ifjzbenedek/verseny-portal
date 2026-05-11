import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import type { SchoolClassResponse } from '@/shared/types/api';
import { classFormSchema, type ClassFormValues } from '../schemas';
import { useCreateClass, useUpdateClass } from '../api';

interface Props {
  schoolClass?: SchoolClassResponse | null;
  onDone?: () => void;
}

export function ClassForm({ schoolClass, onDone }: Props) {
  const { t } = useTranslation();
  const create = useCreateClass();
  const update = useUpdateClass();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClassFormValues>({
    resolver: zodResolver(classFormSchema),
    defaultValues: {
      startYear: schoolClass?.startYear ?? new Date().getFullYear(),
      identifier: schoolClass?.identifier ?? '',
    },
  });

  useEffect(() => {
    reset({
      startYear: schoolClass?.startYear ?? new Date().getFullYear(),
      identifier: schoolClass?.identifier ?? '',
    });
  }, [schoolClass, reset]);

  const onSubmit = async (values: ClassFormValues) => {
    try {
      if (schoolClass) {
        await update.mutateAsync({ id: schoolClass.id, ...values });
        toast.success(t('common.saved'));
      } else {
        await create.mutateAsync(values);
        toast.success(t('common.created'));
      }
      onDone?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  };

  const pending = isSubmitting || create.isPending || update.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="class-startYear">{t('classes.startYear')}</Label>
        <Input
          id="class-startYear"
          type="number"
          min={1990}
          max={2100}
          {...register('startYear', { valueAsNumber: true })}
          aria-invalid={Boolean(errors.startYear)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="class-identifier">{t('classes.identifier')}</Label>
        <Input
          id="class-identifier"
          {...register('identifier')}
          maxLength={16}
          aria-invalid={Boolean(errors.identifier)}
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
