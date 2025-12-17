import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HttpBackend, { HttpBackendOptions } from 'i18next-http-backend'

i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init<HttpBackendOptions>({
    lng: "en",
    fallbackLng: "en",  
    supportedLngs: ["en", "fr", "am"],
    ns: ["common","dashboard"],
    defaultNS: "common",
    backend: {
      loadPath: "/locales/{{lng}}.{{ns}}.json",
    },

    interpolation: {
      escapeValue: false,
    },

    react: {
      useSuspense: true,
    },
  });

export default i18n;
