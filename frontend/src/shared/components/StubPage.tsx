import { useTranslation } from 'react-i18next';
import { Construction } from 'lucide-react';

import { PageHeader } from './PageHeader';
import { EmptyState } from './EmptyState';

interface Props {
  titleKey: string;
}

export function StubPage({ titleKey }: Props) {
  const { t } = useTranslation();
  return (
    <>
      <PageHeader title={t(titleKey)} />
      <EmptyState
        title={t('common.comingSoon')}
        description={t('common.stub')}
        icon={<Construction className="h-8 w-8" />}
      />
    </>
  );
}
