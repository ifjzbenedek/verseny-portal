import { Routes, Route, Link, Navigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';

export default function App() {
  const { user, logout } = useAuth();
  return (
    <>
      <nav className="topbar">
        <Link to="/"><strong>Portál</strong></Link>
        {user && <Link to="/courses">Kurzusok</Link>}
        <div className="spacer" />
        {user ? (
          <>
            <span>{user.fullName} ({user.role})</span>
            <button className="secondary" onClick={logout}>Kilépés</button>
          </>
        ) : (
          <>
            <Link to="/login">Bejelentkezés</Link>
            <Link to="/register">Regisztráció</Link>
          </>
        )}
      </nav>
      <div className="container">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/courses" element={<ProtectedRoute><Courses /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </>
  );
}
