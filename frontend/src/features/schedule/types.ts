export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export interface ScheduleSlotResponse {
  id: number;
  assignmentId: number;
  subjectId: number | null;
  subjectName: string | null;
  schoolClassId: number | null;
  className: string | null;
  teacherId: number | null;
  teacherName: string | null;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  room: string;
}

export interface ScheduleSlotCreateInput {
  assignmentId: number;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  room: string;
}

export const WEEKDAYS: readonly DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
] as const;
