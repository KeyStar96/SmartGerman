import fs from 'fs';
import path from 'path';

describe('Translation Integrity', () => {
    const dictionariesDir = path.join(process.cwd(), 'dictionaries');
    const locales = ['en', 'ru', 'uk', 'tu'];
    const masterLocale = 'de';

    let masterDict: any;
    let otherDicts: Record<string, any> = {};

    beforeAll(() => {
        const loadJson = (locale: string) => JSON.parse(fs.readFileSync(path.join(dictionariesDir, `${locale}.json`), 'utf-8'));
        masterDict = loadJson(masterLocale);
        locales.forEach(l => {
            otherDicts[l] = loadJson(l);
        });
    });

    // Recursive helper to get all keys
    const getKeys = (obj: any, prefix = ''): string[] => {
        return Object.keys(obj).reduce((res: string[], k) => {
            const val = obj[k];
            const newKey = prefix ? `${prefix}.${k}` : k;
            if (val && typeof val === 'object' && !Array.isArray(val)) {
                return [...res, ...getKeys(val, newKey)];
            }
            return [...res, newKey];
        }, []);
    };

    test('All dictionaries should exist', () => {
        expect(masterDict).toBeDefined();
        locales.forEach(l => {
            expect(otherDicts[l]).toBeDefined();
        });
    });

    test('All locales should have same keys as Master (DE)', () => {
        const masterKeys = new Set(getKeys(masterDict));

        locales.forEach(locale => {
            const currentKeys = getKeys(otherDicts[locale]);
            const missing = [...masterKeys].filter(k => !currentKeys.includes(k));

            if (missing.length > 0) {
                console.warn(`Missing keys in ${locale}:`, missing);
            }

            expect(missing).toEqual([]);
        });
    });
});
