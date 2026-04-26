/**
 * Chat Moderation Utility
 * Blocks emails, phone numbers, URLs and custom keywords.
 */

const EMAIL_REGEX = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
// Generic phone regex for international formats
const PHONE_REGEX = /(\b(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}\b)|(\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b)/g;
// URL regex
const URL_REGEX = /\b(?:https?:\/\/|www\.)[a-z0-9+&@#\/%?=~_|!:,.;]*[a-z0-9+&@#\/%=~_|]/gi;

/**
 * Normalizes text by removing spaces and special characters for fuzzy matching.
 */
function normalizeText(text) {
    if (!text) return '';
    return text.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Checks if a message contains any violations (Emails, Phones, URLs, or Keywords).
 * Supports fuzzy matching for keywords (e.g. "pay pal" -> "paypal").
 */
function containsViolation(text, keywords = []) {
    if (!text) return false;

    // 1. Direct Regex Checks
    if (EMAIL_REGEX.test(text)) return true;
    if (PHONE_REGEX.test(text)) return true;
    if (URL_REGEX.test(text)) return true;

    // Reset regex lastIndex because of 'g' flag
    EMAIL_REGEX.lastIndex = 0;
    PHONE_REGEX.lastIndex = 0;
    URL_REGEX.lastIndex = 0;

    // 2. Fuzzy Keyword Checks
    const normalizedText = normalizeText(text);
    if (keywords && keywords.length > 0) {
        for (const word of keywords) {
            if (!word || word.trim().length < 3) continue; // Skip very short words to avoid false positives
            const normalizedWord = normalizeText(word);
            if (normalizedWord && normalizedText.includes(normalizedWord)) {
                return true;
            }
        }
    }

    return false;
}

/**
 * Filter a message string based on regex and a list of keywords.
 * @param {string} text - The original message
 * @param {string[]} keywords - Array of custom keywords to block
 * @returns {string} - The filtered message
 */
function filterMessage(text, keywords = []) {
    if (!text) return text;
    let filtered = text;

    // 1. Block Emails
    filtered = filtered.replace(EMAIL_REGEX, "[CENSORED]");

    // 2. Block Phone Numbers
    filtered = filtered.replace(PHONE_REGEX, "[CENSORED]");

    // 3. Block URLs
    filtered = filtered.replace(URL_REGEX, "[CENSORED]");

    // 4. Block Keywords
    if (keywords && keywords.length > 0) {
        keywords.forEach(word => {
            if (!word || word.trim().length === 0) return;
            const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const wordRegex = new RegExp(`\\b${escapedWord}\\b`, 'gi');
            filtered = filtered.replace(wordRegex, "[CENSORED]");
        });
    }

    return filtered;
}

/**
 * Mark two users as "seen" to prevent immediate rematching (Anti-Rebound).
 */
async function markAsSeen(id1, id2) {
    if (!id1 || !id2) return;
    const { getRedisClient } = require('./redis');
    const redis = getRedisClient();
    
    const key1 = `seen:${id1.toLowerCase()}:${id2.toLowerCase()}`;
    const key2 = `seen:${id2.toLowerCase()}:${id1.toLowerCase()}`;
    
    // Cool down for 1 hour (3600 seconds)
    const ttl = (id1.toLowerCase() === id2.toLowerCase()) ? 5 : 3600;
    
    await redis.set(key1, '1', 'EX', ttl);
    await redis.set(key2, '1', 'EX', ttl);
}

module.exports = { filterMessage, containsViolation, markAsSeen };
