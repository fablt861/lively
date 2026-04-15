import path from 'path';
import fs from 'fs/promises';

export type Locale = 'de' | 'en' | 'es' | 'fi' | 'fr' | 'it' | 'nl' | 'no' | 'pt' | 'ro' | 'ru' | 'sv' | 'uk';

export async function getTranslations(locale: string) {
    const filePath = path.join(process.cwd(), 'public', 'locales', `${locale}.json`);
    
    try {
        const fileContent = await fs.readFile(filePath, 'utf8');
        const translations = JSON.parse(fileContent);
        
        return {
            t: (key: string, params?: Record<string, string | number>) => {
                let text = translations[key] || key;
                
                if (params) {
                    Object.entries(params).forEach(([k, v]) => {
                        text = text.replace(`{{${k}}}`, v.toString());
                    });
                }
                
                return text;
            }
        };
    } catch (error) {
        console.error(`Could not load translations for locale: ${locale}`, error);
        // Fallback to empty translations or default locale
        return {
            t: (key: string) => key
        };
    }
}
