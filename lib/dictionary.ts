import 'server-only';
import { cache } from 'react';

const dictionaries = {
  de: () => import('@/dictionaries/de.json').then((module) => module.default),
  en: () => import('@/dictionaries/en.json').then((module) => module.default),
  uk: () => import('@/dictionaries/uk.json').then((module) => module.default),
  ru: () => import('@/dictionaries/ru.json').then((module) => module.default),
  tr: () => import('@/dictionaries/tr.json').then((module) => module.default),
};

export const getDictionary = cache(async (locale: string) => {
  // Falls die Sprache nicht existiert, nimm Deutsch als Fallback
  const loader = dictionaries[locale as keyof typeof dictionaries] || dictionaries.de;
  return loader();
});
// Re-export type if needed