import { Moon, Sun, Monitor, Contrast } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { useTheme, type ThemeMode } from '@/shared/hooks/useTheme';

const ICONS: Record<ThemeMode, JSX.Element> = {
  light: <Sun className="h-4 w-4" />,
  dark: <Moon className="h-4 w-4" />,
  'high-contrast': <Contrast className="h-4 w-4" />,
  system: <Monitor className="h-4 w-4" />,
};

export function ThemeToggle() {
  const { t } = useTranslation();
  const { mode, setMode } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t('theme.toggle')}>
          {ICONS[mode]}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setMode('light')}>
          <Sun className="mr-2 h-4 w-4" /> {t('theme.light')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setMode('dark')}>
          <Moon className="mr-2 h-4 w-4" /> {t('theme.dark')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setMode('high-contrast')}>
          <Contrast className="mr-2 h-4 w-4" /> {t('theme.highContrast')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setMode('system')}>
          <Monitor className="mr-2 h-4 w-4" /> {t('theme.system')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
