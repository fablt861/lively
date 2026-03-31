import fs from 'fs';
import path from 'path';

async function generate() {
    try {
        const res = await fetch('https://restcountries.com/v3.1/all?fields=cca2,translations,idd,flags');
        const data = await res.json();

        // restcountries "flags" object vs "flag" string? The v3.1 API gives `flag` emoji directly or we can map it via unicode chars.
        // Actually, just fetching from `https://restcountries.com/v3.1/all` for standard data.
        
        // Wait, fetching `flag` explicitly earlier was fine. Let's just use regular v3.1.
        const res31 = await fetch('https://restcountries.com/v3.1/all');
        const data31 = await res31.json();

        const formatted = data31.map(c => {
            const code = c.cca2;
            const nameFr = c.translations?.fra?.common || c.translations?.eng?.common || c.name?.common || 'Unknown';
            const nameEn = c.translations?.eng?.common || c.name?.common || nameFr;
            
            let dialCode = '';
            if (c.idd && c.idd.root) {
                // Keep only the first valid one if multiple exist
                dialCode = c.idd.root + (c.idd.suffixes && c.idd.suffixes.length === 1 ? c.idd.suffixes[0] : '');
            }

            return {
                code,
                nameFr,
                nameEn,
                dialCode,
                flag: c.flag // The emoji
            };
        }).filter(c => c.dialCode && c.nameFr !== 'Unknown');

        // Sort by French name
        formatted.sort((a, b) => a.nameFr.localeCompare(b.nameFr, 'fr', { sensitivity: 'base' }));

        const fileContent = `export type CountryData = {
    code: string;
    nameFr: string;
    nameEn: string;
    dialCode: string;
    flag: string;
};

export const countries: CountryData[] = ${JSON.stringify(formatted, null, 4)};\n`;

        const outPath = path.join(process.cwd(), 'src', 'utils', 'countries.ts');
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        fs.writeFileSync(outPath, fileContent, 'utf-8');
        console.log('Successfully wrote', formatted.length, 'countries to', outPath);
    } catch (e) {
        console.error('Error generating countries:', e);
        process.exit(1);
    }
}

generate();
