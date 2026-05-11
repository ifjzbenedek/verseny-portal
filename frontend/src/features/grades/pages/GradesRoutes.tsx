import { Navigate, Route, Routes } from 'react-router-dom';

import RoleGuard from '@/auth/RoleGuard';
import { useAuth } from '@/auth/AuthContext';
import MyGradesPage from './MyGradesPage';
import RecordGradePage from './RecordGradePage';
import ClassAveragesPage from './ClassAveragesPage';

export default function GradesRoutes() {
  const { user } = useAuth();
  const defaultPath =
    user?.role === 'HALLGATO' ? 'me' : user?.role === 'OKTATO' ? 'record' : 'averages';
  return (
    <Routes>
      <Route index element={<Navigate to={defaultPath} replace />} />
      <Route
        path="me"
        element={
          <RoleGuard allow={['HALLGATO']}>
            <MyGradesPage />
          </RoleGuard>
        }
      />
      <Route
        path="record"
        element={
          <RoleGuard allow={['OKTATO']}>
            <RecordGradePage />
          </RoleGuard>
        }
      />
      <Route
        path="averages"
        element={
          <RoleGuard allow={['OKTATO', 'ADMIN', 'SUPERADMIN']}>
            <ClassAveragesPage />
          </RoleGuard>
        }
      />
    </Routes>
  );
}
