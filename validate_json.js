const fs = require('fs');
const files = ['de', 'en', 'ru', 'uk', 'tu'];
files.forEach(lang => {
    try {
        const content = fs.readFileSync(`./dictionaries/${lang}.json`, 'utf8');
        JSON.parse(content);
        console.log(`${lang}.json: OK`);
    } catch (e) {
        console.error(`${lang}.json: INVALID - ${e.message}`);
        process.exit(1);
    }
});
console.log("All JSON files are valid.");
