import 'server-only';

const dictionaries = {
  de: () => import('@/dictionaries/de.json').then((module) => module.default),
  en: () => import('@/dictionaries/en.json').then((module) => module.default),
  uk: () => import('@/dictionaries/uk.json').then((module) => module.default),
  ru: () => import('@/dictionaries/ru.json').then((module) => module.default),
  tu: () => import('@/dictionaries/tu.json').then((module) => module.default),
};

export const getDictionary = async (locale: string) => {
  // Falls die Sprache nicht existiert, nimm Deutsch als Fallback
  const loader = dictionaries[locale as keyof typeof dictionaries] || dictionaries.de;
  return loader();
};