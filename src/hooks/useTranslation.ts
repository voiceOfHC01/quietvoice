import { useState, useEffect } from 'react';
import { en } from '../locales/en';
import { bn } from '../locales/bn';
import { Language } from '../types';

export function useTranslation() {
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('quietvoice_lang') as Language;
    return saved === 'bn' ? 'bn' : 'en';
  });

  useEffect(() => {
    localStorage.setItem('quietvoice_lang', lang);
  }, [lang]);

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'en' ? 'bn' : 'en'));
  };

  const t = lang === 'bn' ? bn : en;

  return { lang, setLang, toggleLanguage, t };
}
