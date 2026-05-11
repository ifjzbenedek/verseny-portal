export type Role = 'HALLGATO' | 'OKTATO' | 'ADMIN' | 'SUPERADMIN';

export interface AppUser {
  id: number;
  email: string;
  fullName: string;
  role: Role;
}

export interface SchoolClass {
  id: number;
  startYear: number;
  identifier: string;
  createdAt?: string;
}

export interface Subject {
  id: number;
  name: string;
  description?: string;
  requiredBook?: string;
  lessonsJson?: string;
  createdAt?: string;
}

export interface Student {
  id: number;
  user: AppUser;
  schoolClass: SchoolClass;
  enrolledAt?: string;
}

export interface SubjectAssignment {
  id: number;
  schoolClass: SchoolClass;
  subject: Subject;
  teacher: AppUser;
  year: number;
}

export type GradeType = 'NORMAL' | 'MIDTERM' | 'HALFYEAR' | 'YEAR_END';

export interface Grade {
  id: number;
  studentId: number;
  assignmentId: number;
  subjectName?: string;
  teacherName?: string;
  value: number;
  type: GradeType;
  weight: number;
  comment?: string;
  recordedAt: string;
  recordedByName?: string;
}

export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  traceId?: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
