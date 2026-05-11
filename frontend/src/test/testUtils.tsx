import { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, MemoryRouterProps } from 'react-router-dom';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import huCommon from '@/i18n/hu/common.json';
import enCommon from '@/i18n/en/common.json';

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    lng: 'hu',
    fallbackLng: 'hu',
    defaultNS: 'common',
    ns: ['common'],
    resources: {
      hu: { common: huCommon },
      en: { common: enCommon },
    },
    interpolation: { escapeValue: false },
  });
}

interface Options extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: MemoryRouterProps['initialEntries'];
}

export function renderWithProviders(ui: ReactElement, options: Options = {}) {
  const { initialEntries = ['/'], ...rest } = options;
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>
  );

  return { ...render(ui, { wrapper: Wrapper, ...rest }), queryClient };
}
