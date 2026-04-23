const rateLimit = require('express-rate-limit');

// Limiteur standard pour toutes les requêtes API (Évite le spam massif)
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Limite chaque IP à 200 requêtes par fenêtre
    standardHeaders: true, 
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' }
});

// Limiteur strict pour la connexion et l'inscription (Évite le Brute-force)
const authLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 5, // Limite à 5 tentatives par minute
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many login attempts, please wait a minute.' }
});

// Limiteur pour les paiements / ajout de crédits
const paymentLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // Limite à 10 tentatives
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many payment requests, please slow down.' }
});

module.exports = {
    apiLimiter,
    authLimiter,
    paymentLimiter
};
