import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/auth/AuthContext';
import { EmptyState } from '@/shared/components/EmptyState';
import { PageHeader } from '@/shared/components/PageHeader';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';

import { useMySchedule } from './api';
import type { DayOfWeek, ScheduleSlotResponse } from './types';
import { WEEKDAYS } from './types';

const HOURS = [8, 9, 10, 11, 12, 13, 14] as const;

function todayWeekday(): DayOfWeek {
  const idx = new Date().getDay();
  switch (idx) {
    case 1:
      return 'MONDAY';
    case 2:
      return 'TUESDAY';
    case 3:
      return 'WEDNESDAY';
    case 4:
      return 'THURSDAY';
    case 5:
      return 'FRIDAY';
    default:
      return 'MONDAY';
  }
}

function parseHour(time: string): number {
  return parseInt(time.slice(0, 2), 10);
}

function slotAt(slots: ScheduleSlotResponse[], day: DayOfWeek, hour: number) {
  return slots.find((s) => s.dayOfWeek === day && parseHour(s.startTime) === hour);
}

export default function SchedulePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data, isLoading, error } = useMySchedule();
  const [activeDay, setActiveDay] = useState<DayOfWeek>(() => todayWeekday());

  const slots = useMemo(() => data ?? [], [data]);

  const isStudent = user?.role === 'HALLGATO';
  const isTeacher = user?.role === 'OKTATO';
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';

  if (isLoading) {
    return (
      <>
        <PageHeader title={t('nav.schedule')} />
        <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader title={t('nav.schedule')} />
        <p className="text-sm text-destructive">{t('schedule.loadError')}</p>
      </>
    );
  }

  if (!slots || slots.length === 0) {
    return (
      <>
        <PageHeader title={t('nav.schedule')} />
        <EmptyState title={t('schedule.empty')} />
      </>
    );
  }

  if (isAdmin) {
    return <AdminScheduleList slots={slots} />;
  }

  return (
    <>
      <PageHeader title={t('nav.schedule')} />

      {/* Mobile: day tabs */}
      <div className="md:hidden">
        <Tabs value={activeDay} onValueChange={(v) => setActiveDay(v as DayOfWeek)}>
          <TabsList className="grid w-full grid-cols-5">
            {WEEKDAYS.map((d) => (
              <TabsTrigger key={d} value={d}>
                {t(`schedule.daysShort.${d}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="mt-4 space-y-2">
          {HOURS.map((h) => {
            const slot = slotAt(slots, activeDay, h);
            return (
              <SlotCell
                key={h}
                hour={h}
                slot={slot}
                showTeacher={isStudent}
                showClass={isTeacher}
              />
            );
          })}
        </div>
      </div>

      {/* Desktop: weekly grid */}
      <div className="hidden md:block">
        <div className="grid grid-cols-[64px_repeat(5,1fr)] gap-1">
          <div />
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-sm font-semibold uppercase tracking-wide">
              {t(`schedule.days.${d}`)}
            </div>
          ))}

          {HOURS.map((h) => (
            <Row
              key={h}
              hour={h}
              slots={slots}
              showTeacher={isStudent}
              showClass={isTeacher}
            />
          ))}
        </div>
      </div>
    </>
  );
}

function Row({
  hour,
  slots,
  showTeacher,
  showClass,
}: {
  hour: number;
  slots: ScheduleSlotResponse[];
  showTeacher: boolean;
  showClass: boolean;
}) {
  const label = `${String(hour).padStart(2, '0')}:00`;
  return (
    <>
      <div className="flex items-center justify-end pr-2 text-xs text-muted-foreground">
        {label}
      </div>
      {WEEKDAYS.map((d) => {
        const slot = slotAt(slots, d, hour);
        return (
          <SlotCell key={d} hour={hour} slot={slot} showTeacher={showTeacher} showClass={showClass} />
        );
      })}
    </>
  );
}

function SlotCell({
  hour,
  slot,
  showTeacher,
  showClass,
}: {
  hour: number;
  slot: ScheduleSlotResponse | undefined;
  showTeacher: boolean;
  showClass: boolean;
}) {
  if (!slot) {
    return (
      <Card className="min-h-[68px] bg-muted/30">
        <CardContent className="flex h-full items-center justify-center p-2 text-xs text-muted-foreground md:hidden">
          {String(hour).padStart(2, '0')}:00
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="min-h-[68px]">
      <CardContent className="space-y-0.5 p-2 text-xs">
        <div className="font-semibold leading-tight">{slot.subjectName ?? '—'}</div>
        <div className="text-muted-foreground">
          {slot.startTime.slice(0, 5)}–{slot.endTime.slice(0, 5)} · {slot.room}
        </div>
        {showTeacher && slot.teacherName && (
          <div className="truncate text-muted-foreground">{slot.teacherName}</div>
        )}
        {showClass && slot.className && (
          <div className="truncate text-muted-foreground">{slot.className}</div>
        )}
      </CardContent>
    </Card>
  );
}

function AdminScheduleList({ slots }: { slots: ScheduleSlotResponse[] }) {
  const { t } = useTranslation();
  return (
    <>
      <PageHeader title={t('nav.schedule')} />
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b text-left">
              <tr>
                <th className="px-3 py-2">{t('schedule.col.day')}</th>
                <th className="px-3 py-2">{t('schedule.col.time')}</th>
                <th className="px-3 py-2">{t('schedule.col.class')}</th>
                <th className="px-3 py-2">{t('schedule.col.subject')}</th>
                <th className="px-3 py-2">{t('schedule.col.teacher')}</th>
                <th className="px-3 py-2">{t('schedule.col.room')}</th>
              </tr>
            </thead>
            <tbody>
              {slots.map((s) => (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="px-3 py-2">{t(`schedule.days.${s.dayOfWeek}`)}</td>
                  <td className="px-3 py-2">
                    {s.startTime.slice(0, 5)}–{s.endTime.slice(0, 5)}
                  </td>
                  <td className="px-3 py-2">{s.className ?? '—'}</td>
                  <td className="px-3 py-2">{s.subjectName ?? '—'}</td>
                  <td className="px-3 py-2">{s.teacherName ?? '—'}</td>
                  <td className="px-3 py-2">{s.room}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </>
  );
}
