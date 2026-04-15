const fs = require('fs');
const path = require('path');

const localesPath = '/Users/fabrice/APPS/LC Bis/lively/frontend/public/locales';
const translations = {
    "en.json": "A request is already pending.",
    "fr.json": "Une demande est déjà en cours.",
    "es.json": "Una solicitud ya está pendiente.",
    "de.json": "Eine Anfrage steht bereits aus.",
    "it.json": "Una richiesta è già in sospeso.",
    "pt.json": "Um pedido já está pendente.",
    "nl.json": "Er is al een verzoek in behandeling.",
    "ro.json": "O cerere este deja în curs de procesare.",
    "ru.json": "Запрос уже находится на рассмотрении.",
    "uk.json": "Запит уже перебуває на розгляді.",
    "sv.json": "En begäran väntar redan.",
    "no.json": "En forespørsel venter allerede.",
    "fi.json": "Pyyntö on jo vireillä."
};

Object.entries(translations).forEach(([file, value]) => {
    const filePath = path.join(localesPath, file);
    if (fs.existsSync(filePath)) {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        content["auth.error.request_pending"] = value;
        fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
        console.log(`Updated ${file}`);
    } else {
        console.warn(`File ${file} not found`);
    }
});
