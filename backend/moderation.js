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

module.exports = { filterMessage };
