import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/shared/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher';
import { ThemeToggle } from '@/shared/components/ThemeToggle';

export default function SettingsPage() {
  const { t } = useTranslation();
  return (
    <>
      <PageHeader title={t('nav.settings')} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('theme.toggle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ThemeToggle />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('language.toggle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <LanguageSwitcher />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
