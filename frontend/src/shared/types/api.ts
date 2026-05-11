export type Role = 'HALLGATO' | 'OKTATO' | 'ADMIN' | 'SUPERADMIN';

export interface AppUser {
  id: number;
  email: string;
  fullName: string;
  role: Role;
}

export interface AuthResponse {
  token: string;
  email: string;
  fullName: string;
  role: Role;
}

export interface SchoolClassResponse {
  id: number;
  startYear: number;
  identifier: string;
  displayName: string;
  createdAt: string;
}

export interface SubjectResponse {
  id: number;
  name: string;
  description: string | null;
  requiredBook: string | null;
  lessonsJson: string | null;
  createdAt: string;
}

export interface StudentResponse {
  id: number;
  userId: number;
  email: string;
  fullName: string;
  schoolClassId: number;
  schoolClassName: string;
  enrolledAt: string;
}

export interface SubjectAssignmentResponse {
  id: number;
  schoolClassId: number;
  schoolClassName: string;
  subjectId: number;
  subjectName: string;
  teacherId: number;
  teacherName: string;
  year: number;
}

export type GradeType = 'NORMAL' | 'MIDTERM' | 'HALFYEAR' | 'YEAR_END';

export interface GradeResponse {
  id: number;
  studentId: number;
  studentName: string | null;
  assignmentId: number;
  subjectName: string | null;
  schoolClassName: string | null;
  value: number;
  type: GradeType;
  weight: number;
  comment: string | null;
  recordedAt: string;
  recordedById: number | null;
  recordedByName: string | null;
}

export interface SubjectAverageEntry {
  studentId: number;
  studentName: string | null;
  weightedAverage: number;
  gradeCount: number;
}

export interface ClassSubjectAverageResponse {
  schoolClassId: number;
  schoolClassName: string;
  subjectId: number;
  subjectName: string;
  classWeightedAverage: number | null;
  perStudent: SubjectAverageEntry[];
}

export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  traceId?: string;
}

export interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
