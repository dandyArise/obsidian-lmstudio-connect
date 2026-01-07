import i18next from 'i18next';
import en from './en.json';
import ja from './ja.json';
import { getLanguage } from 'obsidian';

export const i18n = i18next.createInstance();
const lng = getLanguage();

i18n.init({
  lng,
  fallbackLng: 'en',
  resources: {
    en: { translation: en },
	ja: { translation: ja }
  },
  interpolation: {
    escapeValue: false
  }
});

export const t = i18n.t.bind(i18n);
