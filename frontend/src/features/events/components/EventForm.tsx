import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { eventCreateSchema, type EventCreateValues } from '../schemas';
import { useCreateEvent } from '../api';

interface Props {
  onDone?: () => void;
}

export function EventForm({ onDone }: Props) {
  const { t } = useTranslation();
  const create = useCreateEvent();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EventCreateValues>({
    resolver: zodResolver(eventCreateSchema),
    defaultValues: {
      title: '',
      description: '',
      startAt: '',
      endAt: '',
      location: '',
      latitude: '',
      longitude: '',
    },
  });

  const onSubmit = async (values: EventCreateValues) => {
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
        <Label htmlFor="event-title">{t('events.title')}</Label>
        <Input id="event-title" {...register('title')} aria-invalid={Boolean(errors.title)} />
        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="event-description">{t('events.description')}</Label>
        <Textarea id="event-description" rows={3} {...register('description')} maxLength={2000} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="event-startAt">{t('events.startAt')}</Label>
          <Input
            id="event-startAt"
            type="datetime-local"
            {...register('startAt')}
            aria-invalid={Boolean(errors.startAt)}
          />
          {errors.startAt && <p className="text-sm text-destructive">{errors.startAt.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="event-endAt">{t('events.endAt')}</Label>
          <Input
            id="event-endAt"
            type="datetime-local"
            {...register('endAt')}
            aria-invalid={Boolean(errors.endAt)}
          />
          {errors.endAt && <p className="text-sm text-destructive">{errors.endAt.message}</p>}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="event-location">{t('events.location')}</Label>
        <Input id="event-location" {...register('location')} maxLength={255} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="event-latitude">Szélességi fok</Label>
          <Input
            id="event-latitude"
            type="number"
            step="any"
            placeholder="pl. 47.4731 (BME központ)"
            {...register('latitude')}
            aria-invalid={Boolean(errors.latitude)}
          />
          {errors.latitude && (
            <p className="text-sm text-destructive">{String(errors.latitude.message)}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="event-longitude">Hosszúsági fok</Label>
          <Input
            id="event-longitude"
            type="number"
            step="any"
            placeholder="pl. 19.0598"
            {...register('longitude')}
            aria-invalid={Boolean(errors.longitude)}
          />
          {errors.longitude && (
            <p className="text-sm text-destructive">{String(errors.longitude.message)}</p>
          )}
        </div>
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
