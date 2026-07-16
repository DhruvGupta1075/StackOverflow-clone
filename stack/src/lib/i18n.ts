import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HttpBackend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";

if (!i18n.isInitialized) {
  i18n
    .use(HttpBackend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      fallbackLng: "en",
      supportedLngs: ["en", "es", "hi", "pt", "zh", "fr"],
      backend: {
        loadPath: "/locales/{{lng}}/translation.json",
      },
      detection: {
        order: ["localStorage", "cookie", "htmlTag", "path", "subdomain"],
        caches: ["localStorage"],
      },
      interpolation: {
        escapeValue: false, // React already safeguards from XSS
      },
      react: {
        useSuspense: false,
      },
    });
}

export default i18n;
