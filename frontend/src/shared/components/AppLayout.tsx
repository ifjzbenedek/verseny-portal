import { useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BookOpen,
  Calendar,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  MessageSquare,
  School,
  Settings,
  Sparkles,
  Users,
  UsersRound,
} from 'lucide-react';

import { useAuth } from '@/auth/AuthContext';
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/components/ui/sheet';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './ThemeToggle';
import type { Role } from '@/shared/types/api';
import { cn } from '@/shared/lib/utils';

interface NavItem {
  to: string;
  labelKey: string;
  icon: typeof LayoutDashboard;
  roles: Role[];
}

const NAV: NavItem[] = [
  {
    to: '/',
    labelKey: 'nav.dashboard',
    icon: LayoutDashboard,
    roles: ['HALLGATO', 'OKTATO', 'ADMIN', 'SUPERADMIN'],
  },
  {
    to: '/grades',
    labelKey: 'nav.grades',
    icon: GraduationCap,
    roles: ['HALLGATO', 'OKTATO', 'ADMIN', 'SUPERADMIN'],
  },
  {
    to: '/subjects',
    labelKey: 'nav.subjects',
    icon: BookOpen,
    roles: ['HALLGATO', 'OKTATO', 'ADMIN', 'SUPERADMIN'],
  },
  {
    to: '/classes',
    labelKey: 'nav.classes',
    icon: School,
    roles: ['OKTATO', 'ADMIN', 'SUPERADMIN'],
  },
  { to: '/users', labelKey: 'nav.users', icon: Users, roles: ['ADMIN', 'SUPERADMIN'] },
  {
    to: '/assignments',
    labelKey: 'nav.assignments',
    icon: ListChecks,
    roles: ['ADMIN', 'SUPERADMIN'],
  },
  {
    to: '/schedule',
    labelKey: 'nav.schedule',
    icon: Calendar,
    roles: ['HALLGATO', 'OKTATO', 'ADMIN', 'SUPERADMIN'],
  },
  {
    to: '/messages',
    labelKey: 'nav.messages',
    icon: MessageSquare,
    roles: ['HALLGATO', 'OKTATO', 'ADMIN', 'SUPERADMIN'],
  },
  {
    to: '/events',
    labelKey: 'nav.events',
    icon: CalendarDays,
    roles: ['HALLGATO', 'OKTATO', 'ADMIN', 'SUPERADMIN'],
  },
  {
    to: '/homework',
    labelKey: 'nav.homework',
    icon: ClipboardList,
    roles: ['HALLGATO', 'OKTATO', 'ADMIN', 'SUPERADMIN'],
  },
  {
    to: '/groups',
    labelKey: 'nav.groups',
    icon: UsersRound,
    roles: ['HALLGATO', 'OKTATO', 'ADMIN', 'SUPERADMIN'],
  },
  {
    to: '/surveys',
    labelKey: 'nav.surveys',
    icon: ListChecks,
    roles: ['HALLGATO', 'OKTATO', 'ADMIN', 'SUPERADMIN'],
  },
  {
    to: '/chat',
    labelKey: 'nav.chat',
    icon: Sparkles,
    roles: ['HALLGATO', 'OKTATO', 'ADMIN', 'SUPERADMIN'],
  },
  {
    to: '/settings',
    labelKey: 'nav.settings',
    icon: Settings,
    roles: ['HALLGATO', 'OKTATO', 'ADMIN', 'SUPERADMIN'],
  },
];

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const items = useMemo(() => NAV.filter((item) => user && item.roles.includes(user.role)), [user]);
  return (
    <nav className="flex flex-col gap-1 px-2">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )
            }
          >
            <Icon className="h-4 w-4" />
            <span>{t(item.labelKey)}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

export default function AppLayout() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label={t('nav.dashboard')}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="border-b p-4">
              <SheetTitle>{t('app.name')}</SheetTitle>
            </SheetHeader>
            <div className="py-3">
              <NavList onNavigate={() => setOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>

        <Link to="/" className="font-semibold tracking-tight">
          {t('app.shortName')}
        </Link>

        <div className="flex-1" />

        <Badge variant="secondary" className="hidden md:inline-flex">
          {t(`roles.${user.role}`)}
        </Badge>
        <ThemeToggle />
        <LanguageSwitcher />

        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{initials(user.fullName)}</AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium md:inline">{user.fullName}</span>
        </div>

        <Button variant="ghost" size="icon" onClick={handleLogout} aria-label={t('auth.logout')}>
          <LogOut className="h-4 w-4" />
        </Button>
      </header>

      <div className="grid md:grid-cols-[16rem_1fr]">
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] overflow-y-auto border-r py-4 md:block">
          <NavList />
        </aside>

        <main className="container max-w-6xl py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
