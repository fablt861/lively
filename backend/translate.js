const axios = require('axios');

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// Simple in-memory cache to reduce costs and latency
const translationCache = new Map();

async function translateText(text, targetLang) {
    if (!text || !targetLang) return text;

    // Normalize text to avoid redundant translations
    const cleanText = text.trim();
    const cacheKey = `${targetLang}:${cleanText}`;

    if (translationCache.has(cacheKey)) {
        return translationCache.get(cacheKey);
    }

    // Fallback to Mock Mode if API key is missing
    if (!GOOGLE_API_KEY || GOOGLE_API_KEY === 'YOUR_GOOGLE_API_KEY') {
        const mockResult = getMockTranslation(cleanText, targetLang);
        translationCache.set(cacheKey, mockResult);
        return mockResult;
    }

    try {
        const response = await axios.post(
            `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_API_KEY}`,
            {
                q: cleanText,
                target: targetLang
            }
        );

        const translatedText = decodeHTMLEntities(response.data.data.translations[0].translatedText);

        // Cache management: basic limit of 1000 entries
        if (translationCache.size > 1000) translationCache.clear();
        translationCache.set(cacheKey, translatedText);

        return translatedText;
    } catch (error) {
        console.error('Translation Error:', error.response ? error.response.data : error.message);
        return text;
    }
}

function getMockTranslation(text, targetLang) {
    if (targetLang.startsWith('en')) return `[EN] ${text}`;
    if (targetLang.startsWith('fr')) return `[FR] ${text}`;
    if (targetLang.startsWith('es')) return `[ES] ${text}`;
    if (targetLang.startsWith('pt')) return `[PT] ${text}`;
    return `[${targetLang.toUpperCase()}] ${text}`;
}

function decodeHTMLEntities(text) {
    if (!text) return text;
    const entities = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&apos;': "'",
        '&#39;': "'"
    };
    // 1. Decode named entities
    let decoded = text.replace(/&amp;|&lt;|&gt;|&quot;|&apos;|&#39;/g, m => entities[m]);
    // 2. Decode numeric entities (like &#124;)
    decoded = decoded.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec));
    // 3. Decode hex entities (like &#x27;)
    decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)));

    return decoded;
}

module.exports = { translateText };
