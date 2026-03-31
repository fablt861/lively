const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function generate() {
    console.log('Fetching stable countries github source...');
    // Increase maxBuffer because countries.json is > 1MB
    const rawData = execSync('curl -s https://raw.githubusercontent.com/mledoze/countries/master/countries.json', { maxBuffer: 1024 * 1024 * 10 }).toString();
    const data = JSON.parse(rawData);

    const formatted = [];
    for (const c of data) {
        if (!c.idd || !c.idd.root) continue;
        
        const code = c.cca2 || '';
        let nameFr = (c.translations && c.translations.fra && c.translations.fra.common) || '';
        if (!nameFr) nameFr = (c.name && c.name.common) || 'Unknown';
        
        let nameEn = (c.name && c.name.common) || '';
        if (nameFr === 'Unknown') continue;
        
        const root = c.idd.root;
        const suffixes = c.idd.suffixes || [];
        const dialCode = root + (suffixes.length === 1 ? suffixes[0] : '');

        const flag = c.flag || '';
        
        formatted.push({ code, nameFr, nameEn, dialCode, flag });
    }

    formatted.sort((a, b) => a.nameFr.localeCompare(b.nameFr, 'fr', { sensitivity: 'base' }));

    const fileContent = `export type CountryData = {
    code: string;
    nameFr: string;
    nameEn: string;
    dialCode: string;
    flag: string;
};

export const countries: CountryData[] = ${JSON.stringify(formatted, null, 4)};\n`;

    const outPath = path.join(__dirname, 'src', 'utils', 'countries.ts');
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, fileContent, 'utf-8');
    console.log('Successfully wrote', formatted.length, 'countries to', outPath);
}

generate();
