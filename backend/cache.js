const { getRedisClient } = require('./redis');
const redis = getRedisClient();

/**
 * Tente de récupérer une donnée dans le cache.
 * Si absente, exécute 'fetcher' et stocke le résultat.
 * @param {string} key - Clé unique du cache
 * @param {function} fetcher - Fonction asynchrone pour récupérer les données (ex: DB query)
 * @param {number} ttl - Temps de vie en secondes (default: 1 heure)
 */
async function getOrSet(key, fetcher, ttl = 3600) {
    try {
        const cached = await redis.get(key);
        if (cached) {
            // console.log(`[Cache] HIT: ${key}`);
            return JSON.parse(cached);
        }

        // console.log(`[Cache] MISS: ${key}. Fetching from source...`);
        const data = await fetcher();
        
        if (data !== undefined && data !== null) {
            await redis.set(key, JSON.stringify(data), 'EX', ttl);
        }
        
        return data;
    } catch (err) {
        console.error(`[Cache Error] ${key}:`, err.message);
        // En cas d'erreur de cache, on retourne quand même la source pour éviter de bloquer l'app
        return fetcher();
    }
}

/**
 * Supprime une clé du cache (utile après un Update)
 */
async function invalidate(key) {
    try {
        await redis.del(key);
        // console.log(`[Cache] Invalidated: ${key}`);
    } catch (err) {
        console.error(`[Cache Invalidation Error] ${key}:`, err.message);
    }
}

module.exports = {
    getOrSet,
    invalidate
};
