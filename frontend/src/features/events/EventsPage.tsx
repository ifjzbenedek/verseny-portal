import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarDays, LocateFixed, MapPin, Navigation, Plus, Trash2, User } from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/auth/AuthContext';
import { PageHeader } from '@/shared/components/PageHeader';
import { EmptyState } from '@/shared/components/EmptyState';
import { Badge } from '@/shared/components/ui/badge';
import { useGeolocation } from '@/shared/hooks/useGeolocation';
import { formatDistance, haversineKm } from '@/shared/lib/distance';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/components/ui/alert-dialog';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import { useDeleteEvent, useEvents } from './api';
import { EventForm } from './components/EventForm';
import type { EventResponse } from './schemas';

export default function EventsPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';
  const { data, isLoading } = useEvents();
  const del = useDeleteEvent();
  const [createOpen, setCreateOpen] = useState(false);
  const { position, error: geoError, loading: geoLoading, request: requestGeo } = useGeolocation();

  useEffect(() => {
    if (geoError) toast.error(geoError);
  }, [geoError]);

  const dateFmt = new Intl.DateTimeFormat(i18n.language, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleDelete = async (e: EventResponse) => {
    try {
      await del.mutateAsync(e.id);
      toast.success(t('common.deleted'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <>
      <PageHeader
        title={t('nav.events')}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={requestGeo}
              disabled={geoLoading}
              aria-label={t('events.locateMe')}
            >
              <LocateFixed className="h-4 w-4" />
              {geoLoading ? t('common.loading') : t('events.locateMe')}
            </Button>
            {canEdit ? (
              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4" />
                    {t('events.create')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('events.create')}</DialogTitle>
                  </DialogHeader>
                  <EventForm onDone={() => setCreateOpen(false)} />
                </DialogContent>
              </Dialog>
            ) : null}
          </div>
        }
      />

      {position && (
        <p className="mb-4 text-xs text-muted-foreground">
          {t('events.yourPosition', {
            lat: position.latitude.toFixed(4),
            lng: position.longitude.toFixed(4),
          })}
        </p>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
      ) : !data || data.length === 0 ? (
        <EmptyState title={t('common.noData')} icon={<CalendarDays className="h-8 w-8" />} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((e) => (
            <Card key={e.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-start justify-between gap-2">
                  <span>{e.title}</span>
                  {canEdit && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t('common.delete')}
                          className="-mr-2 -mt-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t('events.deleteTitle')}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t('events.deleteDescription', { title: e.title })}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(e)}>
                            {t('common.delete')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  <span>
                    {dateFmt.format(new Date(e.startAt))}
                    {e.endAt ? ` – ${dateFmt.format(new Date(e.endAt))}` : ''}
                  </span>
                </div>
                {e.location && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{e.location}</span>
                  </div>
                )}
                {e.latitude !== null && e.longitude !== null && position && (
                  <Badge variant="secondary" className="w-fit gap-1">
                    <Navigation className="h-3 w-3" />
                    {formatDistance(
                      haversineKm(
                        position.latitude,
                        position.longitude,
                        e.latitude,
                        e.longitude,
                      ),
                    )}
                  </Badge>
                )}
                {e.description && (
                  <p className="text-sm text-foreground/90 line-clamp-4">{e.description}</p>
                )}
                {e.createdByFullName && (
                  <div className="mt-auto flex items-center gap-2 pt-2 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>{e.createdByFullName}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
