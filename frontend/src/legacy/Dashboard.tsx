import { useAuth } from '@/auth/AuthContext';

export default function LegacyDashboard() {
  const { user } = useAuth();
  return (
    <div className="rounded-lg border bg-card p-6">
      <h2 className="text-xl font-semibold">Üdv, {user?.fullName}!</h2>
      <p className="mt-1 text-muted-foreground">
        Szerepkör: <strong>{user?.role}</strong>
      </p>
      <ul className="mt-4 list-disc pl-6 text-sm text-muted-foreground">
        <li>
          <strong>HALLGATO</strong>: kurzuslista olvasása
        </li>
        <li>
          <strong>OKTATO</strong>: kurzus létrehozás + szerkesztés
        </li>
        <li>
          <strong>ADMIN</strong>: kurzus törlés + minden jog
        </li>
      </ul>
    </div>
  );
}
