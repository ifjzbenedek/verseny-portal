import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';

import RoleGuard from './RoleGuard';
import type { Role } from '@/shared/types/api';
import { AuthProvider, useAuth } from './AuthContext';
import { renderWithProviders } from '@/test/testUtils';

function LoginStub() {
  return <div>login-page</div>;
}

function HomeStub() {
  return <div>home-page</div>;
}

function PrimeAuth({ role }: { role: Role }) {
  const stored = JSON.stringify({ id: 1, email: 'x@y.hu', fullName: 'X Y', role });
  localStorage.setItem('user', stored);
  localStorage.setItem('token', 'fake');
  return null;
}

function ConsumeAndRender() {
  const { user } = useAuth();
  return <span data-testid="role">{user?.role}</span>;
}

describe('RoleGuard', () => {
  it('renders children when user role is allowed', () => {
    localStorage.setItem('token', 'fake');
    localStorage.setItem(
      'user',
      JSON.stringify({ id: 1, email: 'a@b.hu', fullName: 'A', role: 'ADMIN' }),
    );
    renderWithProviders(
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomeStub />} />
          <Route
            path="/admin"
            element={
              <RoleGuard allow={['ADMIN']}>
                <div>admin-only</div>
              </RoleGuard>
            }
          />
          <Route path="/login" element={<LoginStub />} />
        </Routes>
      </AuthProvider>,
      { initialEntries: ['/admin'] },
    );
    expect(screen.getByText('admin-only')).toBeInTheDocument();
  });

  it('redirects to / when user role is not allowed', () => {
    localStorage.setItem('token', 'fake');
    localStorage.setItem(
      'user',
      JSON.stringify({ id: 1, email: 'a@b.hu', fullName: 'A', role: 'HALLGATO' }),
    );
    renderWithProviders(
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomeStub />} />
          <Route
            path="/admin"
            element={
              <RoleGuard allow={['ADMIN']}>
                <div>admin-only</div>
              </RoleGuard>
            }
          />
          <Route path="/login" element={<LoginStub />} />
        </Routes>
      </AuthProvider>,
      { initialEntries: ['/admin'] },
    );
    expect(screen.getByText('home-page')).toBeInTheDocument();
    expect(screen.queryByText('admin-only')).not.toBeInTheDocument();
  });

  it('redirects to /login when no user is set', () => {
    localStorage.clear();
    renderWithProviders(
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomeStub />} />
          <Route
            path="/admin"
            element={
              <RoleGuard allow={['ADMIN']}>
                <div>admin-only</div>
              </RoleGuard>
            }
          />
          <Route path="/login" element={<LoginStub />} />
        </Routes>
      </AuthProvider>,
      { initialEntries: ['/admin'] },
    );
    expect(screen.getByText('login-page')).toBeInTheDocument();
  });

  it('renders custom fallback if provided', () => {
    localStorage.setItem('token', 'fake');
    localStorage.setItem(
      'user',
      JSON.stringify({ id: 1, email: 'a@b.hu', fullName: 'A', role: 'HALLGATO' }),
    );
    renderWithProviders(
      <AuthProvider>
        <RoleGuard allow={['ADMIN']} fallback={<div>no-access</div>}>
          <div>admin-only</div>
        </RoleGuard>
      </AuthProvider>,
    );
    expect(screen.getByText('no-access')).toBeInTheDocument();
  });

  // unused helper for type completeness
  void PrimeAuth;
  void ConsumeAndRender;
});
