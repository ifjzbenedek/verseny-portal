import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import huCommon from './hu/common.json';
import enCommon from './en/common.json';

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'hu',
    supportedLngs: ['hu', 'en'],
    defaultNS: 'common',
    ns: ['common'],
    interpolation: { escapeValue: false },
    resources: {
      hu: { common: huCommon },
      en: { common: enCommon },
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'lng',
    },
  });

export default i18n;
