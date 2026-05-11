import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import type { SubjectResponse } from '@/shared/types/api';
import { subjectFormSchema, type SubjectFormValues } from '../schemas';
import { useCreateSubject, useUpdateSubject } from '../api';

interface Props {
  subject?: SubjectResponse | null;
  onDone?: () => void;
}

export function SubjectForm({ subject, onDone }: Props) {
  const { t } = useTranslation();
  const create = useCreateSubject();
  const update = useUpdateSubject();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SubjectFormValues>({
    resolver: zodResolver(subjectFormSchema),
    defaultValues: {
      name: subject?.name ?? '',
      description: subject?.description ?? '',
      requiredBook: subject?.requiredBook ?? '',
      lessonsJson: subject?.lessonsJson ?? '',
    },
  });

  useEffect(() => {
    reset({
      name: subject?.name ?? '',
      description: subject?.description ?? '',
      requiredBook: subject?.requiredBook ?? '',
      lessonsJson: subject?.lessonsJson ?? '',
    });
  }, [subject, reset]);

  const onSubmit = async (values: SubjectFormValues) => {
    try {
      if (subject) {
        await update.mutateAsync({ id: subject.id, ...values });
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
        <Label htmlFor="subject-name">{t('subjects.name')}</Label>
        <Input id="subject-name" {...register('name')} aria-invalid={Boolean(errors.name)} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="subject-description">{t('subjects.description')}</Label>
        <Input id="subject-description" {...register('description')} maxLength={2000} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="subject-requiredBook">{t('subjects.requiredBook')}</Label>
        <Input id="subject-requiredBook" {...register('requiredBook')} maxLength={255} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="subject-lessonsJson">{t('subjects.lessonsJson')}</Label>
        <Input id="subject-lessonsJson" {...register('lessonsJson')} maxLength={4000} />
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
