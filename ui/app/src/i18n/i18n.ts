// src/i18n/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// 👇 Import your translations
import en from './en.json';
import fr from './fr.json';
import am from './am.json';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fr: { translation: fr },
    am: { translation: am },
  },
  lng: 'fr', // or dynamically set later
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
