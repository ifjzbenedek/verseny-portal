import { useAuth } from '../auth/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  return (
    <div className="card">
      <h2>Üdv, {user?.fullName}!</h2>
      <p>Szerepkör: <strong>{user?.role}</strong></p>
      <ul>
        <li><strong>HALLGATO</strong>: kurzuslista olvasása</li>
        <li><strong>OKTATO</strong>: kurzus létrehozás + szerkesztés</li>
        <li><strong>ADMIN</strong>: kurzus törlés + minden jog</li>
      </ul>
    </div>
  );
}
