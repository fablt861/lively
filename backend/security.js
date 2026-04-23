const rateLimit = require('express-rate-limit');

// Limiteur standard pour toutes les requêtes API (Évite le spam massif)
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Limite chaque IP à 200 requêtes par fenêtre
    standardHeaders: true, 
    legacyHeaders: false,
    message: { error: 'api.error.too_many_requests' }
});

// Limiteur strict pour la connexion et l'inscription (Évite le Brute-force)
const authLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 5, // Limite à 5 tentatives par minute
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'auth.error.too_many_attempts' }
});

// Limiteur pour les paiements / ajout de crédits
const paymentLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // Limite à 10 tentatives
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'payment.error.too_many_requests' }
});

module.exports = {
    apiLimiter,
    authLimiter,
    paymentLimiter
};
