const { translateText } = require('./translate');

function setupSignaling(io, socket) {
    socket.on('offer', (payload) => {
        socket.to(socket.currentRoom).emit('offer', payload);
    });

    socket.on('answer', (payload) => {
        socket.to(socket.currentRoom).emit('answer', payload);
    });

    socket.on('ice-candidate', (payload) => {
        socket.to(socket.currentRoom).emit('ice-candidate', payload);
    });

    socket.on('chat_message', async (message) => {
        if (!socket.currentRoom) return;

        // Trouver le partenaire dans la room pour connaître sa langue
        const roomSockets = await io.in(socket.currentRoom).fetchSockets();
        const partnerSocket = roomSockets.find(s => s.id !== socket.id);
        const targetLang = partnerSocket ? (partnerSocket.language || 'en') : 'en';
        const sourceLang = socket.language || 'en';

        // Skip translation if languages are the same (comparing first 2 chars, e.g. "fr" vs "fr-FR")
        const normalizedTarget = targetLang.split('-')[0].toLowerCase();
        const normalizedSource = sourceLang.split('-')[0].toLowerCase();

        let translated = message;
        if (normalizedTarget !== normalizedSource) {
            translated = await translateText(message, targetLang);
        }

        // Envoyer à l'autre personne
        socket.to(socket.currentRoom).emit('chat_message', {
            senderId: socket.id,
            text: translated, // Texte traduit
            originalText: message, // Texte original
            timestamp: Date.now()
        });
    });
}

module.exports = { setupSignaling };
