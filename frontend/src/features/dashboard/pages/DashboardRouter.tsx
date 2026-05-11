import { useAuth } from '@/auth/AuthContext';
import StudentDashboard from './StudentDashboard';
import TeacherDashboard from './TeacherDashboard';
import AdminDashboard from './AdminDashboard';
import SuperAdminDashboard from './SuperAdminDashboard';

export default function DashboardRouter() {
  const { user } = useAuth();
  if (!user) return null;
  switch (user.role) {
    case 'HALLGATO':
      return <StudentDashboard />;
    case 'OKTATO':
      return <TeacherDashboard />;
    case 'ADMIN':
      return <AdminDashboard />;
    case 'SUPERADMIN':
      return <SuperAdminDashboard />;
    default:
      return null;
  }
}
