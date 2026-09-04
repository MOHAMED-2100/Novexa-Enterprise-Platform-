import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslation from './locales/en.json' with { type: 'json' };
import arTranslation from './locales/ar.json' with { type: 'json' };

const resources = {
  en: { translation: enTranslation },
  ar: { translation: arTranslation },
};

// Initial language detection or default to English
const savedLanguage = typeof window !== 'undefined' ? localStorage.getItem('novexa_lang') || 'en' : 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

export function setLanguageDirection(lang: string) {
  if (typeof document !== 'undefined') {
    const isRtl = lang === 'ar';
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    localStorage.setItem('novexa_lang', lang);
  }
}

// Ensure direction is synchronized on initial load and upon any language change
setLanguageDirection(savedLanguage);

i18n.on('languageChanged', (lng) => {
  setLanguageDirection(lng);
});

export default i18n;
