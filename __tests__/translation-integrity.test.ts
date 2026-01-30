import fs from 'fs';
import path from 'path';

const DICTIONARIES_DIR = path.join(process.cwd(), 'dictionaries');
const BLACKLIST_PATH = path.join(DICTIONARIES_DIR, 'translation-blacklist.json');

// Load Blacklist
let blacklist: string[] = [];
try {
    const content = fs.readFileSync(BLACKLIST_PATH, 'utf-8');
    blacklist = JSON.parse(content);
} catch (e) {
    console.warn("No blacklist found at", BLACKLIST_PATH);
}

// Helpers
const isNumericOrSymbol = (val: string) => /^[\d\s\W]+$/.test(val);
const isBlacklisted = (val: string) => blacklist.includes(val);

// Recursive Comparison
const compareObjects = (source: any, target: any, lang: string, pathPrefix = "") => {
    Object.keys(source).forEach(key => {
        const fullPath = pathPrefix ? `${pathPrefix}.${key}` : key;

        // Skip technical keys
        if (['id', 'ref', 'code', 'instructor', 'price', 'time', 'level', 'freq', 'price_unit'].includes(key)) {
            return;
        }

        // 1. Check Existence
        if (!target.hasOwnProperty(key)) {
            throw new Error(`Missing key '${fullPath}' in ${lang}`);
        }

        const sourceVal = source[key];
        const targetVal = target[key];

        if (typeof sourceVal === 'object' && sourceVal !== null) {
            // Recurse
            compareObjects(sourceVal, targetVal, lang, fullPath);
        } else {
            // 2. Check Translation
            // If values are identical, it MIGHT be an error, unless allowed.
            if (sourceVal === targetVal) {
                // Allowed if:
                // - Empty string
                // - Blacklisted (e.g. "SmartGerman")
                // - Numeric/Symbols (e.g. "2024", "!!!")

                const isIgnored =
                    sourceVal === "" ||
                    isBlacklisted(sourceVal) ||
                    isNumericOrSymbol(sourceVal) ||
                    ['Email', 'WhatsApp', 'Telegram'].includes(sourceVal);

                if (!isIgnored) {
                    throw new Error(`Untranslated key '${fullPath}' in ${lang}. Value: "${sourceVal}"`);
                }
            }
        }
    });
};

describe('Translation Integrity', () => {
    let de: any;

    beforeAll(() => {
        de = JSON.parse(fs.readFileSync(path.join(DICTIONARIES_DIR, 'de.json'), 'utf-8'));
    });

    const languages = ['en', 'ru', 'tu', 'uk'];

    test.each(languages)('Language Code %s matches structure of DE', (langCode) => {
        const filePath = path.join(DICTIONARIES_DIR, `${langCode}.json`);
        if (!fs.existsSync(filePath)) {
            throw new Error(`Dictionary not found: ${langCode}.json`);
        }
        const target = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

        // Run comparison
        compareObjects(de, target, langCode);
    });
});
