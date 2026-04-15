const fs = require('fs');
const path = require('path');

const localesDir = path.join(process.cwd(), 'frontend/public/locales');
const locales = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));

const translations = {
    'en.json': 'yo',
    'fr.json': 'ans',
    'es.json': 'años',
    'it.json': 'anni',
    'de.json': 'Jahre',
    'pt.json': 'anos',
    'nl.json': 'jaar',
    'ro.json': 'ani',
    'uk.json': 'р.',
    'ru.json': 'лет',
    'sv.json': 'år',
    'no.json': 'år',
    'fi.json': 'v.'
};

locales.forEach(file => {
    const filePath = path.join(localesDir, file);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Add specifically to 'common' if it didn't exist properly, or just as a flat key
    // The previous check showed keys are flat like "admin.common.amount"
    // So "common.years_old" should be fine as a flat key.
    
    content["common.years_old"] = translations[file] || "ans";
    
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
    console.log(`Updated ${file}`);
});
