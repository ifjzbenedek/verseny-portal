import { Navigate, Route, Routes } from 'react-router-dom';

import LoginPage from '@/auth/pages/LoginPage';
import RegisterPage from '@/auth/pages/RegisterPage';
import ProtectedRoute from '@/auth/ProtectedRoute';
import RoleGuard from '@/auth/RoleGuard';
import AppLayout from '@/shared/components/AppLayout';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';

import DashboardRouter from '@/features/dashboard/pages/DashboardRouter';
import GradesRoutes from '@/features/grades/pages/GradesRoutes';
import SubjectsPage from '@/features/subjects/SubjectsPage';
import ClassesPage from '@/features/classes/ClassesPage';
import UsersPage from '@/features/users/UsersPage';
import AssignmentsPage from '@/features/assignments/AssignmentsPage';
import SchedulePage from '@/features/schedule/SchedulePage';
import MessagingPage from '@/features/messaging/MessagingPage';
import EventsPage from '@/features/events/EventsPage';
import HomeworkPage from '@/features/homework/HomeworkPage';
import GroupsPage from '@/features/groups/GroupsPage';
import SurveysPage from '@/features/surveys/SurveysPage';
import ChatPage from '@/features/chat/ChatPage';
import SettingsPage from '@/features/settings/SettingsPage';
import LegacyCourses from '@/legacy/Courses';

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardRouter />} />

          <Route path="grades/*" element={<GradesRoutes />} />

          <Route
            path="subjects"
            element={
              <RoleGuard allow={['HALLGATO', 'OKTATO', 'ADMIN', 'SUPERADMIN']}>
                <SubjectsPage />
              </RoleGuard>
            }
          />
          <Route
            path="classes"
            element={
              <RoleGuard allow={['OKTATO', 'ADMIN', 'SUPERADMIN']}>
                <ClassesPage />
              </RoleGuard>
            }
          />
          <Route
            path="users"
            element={
              <RoleGuard allow={['ADMIN', 'SUPERADMIN']}>
                <UsersPage />
              </RoleGuard>
            }
          />
          <Route
            path="assignments"
            element={
              <RoleGuard allow={['ADMIN', 'SUPERADMIN']}>
                <AssignmentsPage />
              </RoleGuard>
            }
          />
          <Route path="schedule" element={<SchedulePage />} />
          <Route path="messages" element={<MessagingPage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="homework" element={<HomeworkPage />} />
          <Route path="groups" element={<GroupsPage />} />
          <Route path="surveys" element={<SurveysPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="legacy/courses" element={<LegacyCourses />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}
