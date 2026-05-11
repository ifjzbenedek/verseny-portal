import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  const choose = (lng: string) => {
    void i18n.changeLanguage(lng);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t('language.toggle')}>
          <Languages className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => choose('hu')}>{t('language.hu')}</DropdownMenuItem>
        <DropdownMenuItem onClick={() => choose('en')}>{t('language.en')}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
