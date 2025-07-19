// src/i18n/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Type-safe resources object
const resources: Record<string, { translation: Record<string, string> }> = {};

// Dynamically require all .json files from ./locales
const context = require.context('./locales', false, /\.json$/);

context.keys().forEach((key: string) => {
  const match = key.match(/\.\/(.*)\.json$/);
  if (match && match[1]) {
    const lang = match[1];
    const translation = context(key) as Record<string, string>;
    resources[lang] = { translation };
  }
});

i18n.use(initReactI18next).init({
  debug: false,
  resources,
  lng: 'en', // default language
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
