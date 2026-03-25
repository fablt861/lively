const axios = require('axios');

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

async function translateText(text, targetLang) {
    if (!text || !targetLang) return text;

    // Simuler si pas de clé API (Mock Mode)
    if (!GOOGLE_API_KEY || GOOGLE_API_KEY === 'YOUR_GOOGLE_API_KEY') {
        console.log(`[Mock Translate] to ${targetLang}: ${text}`);
        // Une petite simulation de traduction pour le test
        if (targetLang.startsWith('en')) return `[EN] ${text}`;
        if (targetLang.startsWith('fr')) return `[FR] ${text}`;
        if (targetLang.startsWith('es')) return `[ES] ${text}`;
        if (targetLang.startsWith('pt')) return `[PT] ${text}`;
        return `[${targetLang.toUpperCase()}] ${text}`;
    }

    try {
        const response = await axios.post(
            `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_API_KEY}`,
            {
                q: text,
                target: targetLang
            }
        );

        return response.data.data.translations[0].translatedText;
    } catch (error) {
        console.error('Translation Error:', error.response ? error.response.data : error.message);
        return text; // Retourne le texte original en cas d'échec
    }
}

module.exports = { translateText };
