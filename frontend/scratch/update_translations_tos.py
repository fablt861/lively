import json
import os

languages = {
    "en": {
        "prefix": "I am over 18 and I accept the",
        "link": "terms and conditions",
        "suffix": "of Kinky."
    },
    "fr": {
        "prefix": "J'ai plus de 18 ans et j'accepte les",
        "link": "conditions générales",
        "suffix": "de Kinky."
    },
    "es": {
        "prefix": "Soy mayor de 18 años y acepto los",
        "link": "términos y condiciones",
        "suffix": "de Kinky."
    },
    "de": {
        "prefix": "Ich bin über 18 Jahre alt und akzeptiere die",
        "link": "Allgemeinen Geschäftsbedingungen",
        "suffix": "von Kinky."
    },
    "it": {
        "prefix": "Ho più di 18 anni e accetto i",
        "link": "termini e le condizioni",
        "suffix": "di Kinky."
    },
    "nl": {
        "prefix": "Ik ben ouder dan 18 en ga akkoord met de",
        "link": "voorwaarden",
        "suffix": "van Kinky."
    },
    "pt": {
        "prefix": "Tenho mais de 18 anos e aceito os",
        "link": "termos e condições",
        "suffix": "do Kinky."
    },
    "ru": {
        "prefix": "Мне больше 18 лет, и я принимаю",
        "link": "условия и положения",
        "suffix": "Kinky."
    },
    "uk": {
        "prefix": "Мені більше 18 років, і я приймаю",
        "link": "умови та положення",
        "suffix": "Kinky."
    },
    "ro": {
        "prefix": "Am peste 18 ani și accept",
        "link": "termenii și condițiile",
        "suffix": "Kinky."
    },
    "sv": {
        "prefix": "Jag är över 18 år och accepterar",
        "link": "villkoren",
        "suffix": "för Kinky."
    },
    "no": {
        "prefix": "Jeg er over 18 år og godtar",
        "link": "vilkårene",
        "suffix": "for Kinky."
    },
    "fi": {
        "prefix": "Olen yli 18-vuotias ja hyväksyn",
        "link": "ehdot",
        "suffix": "Kinkyssä."
    }
}

base_path = "frontend/public/locales"

for lang, trans in languages.items():
    file_path = f"{base_path}/{lang}.json"
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        data["signup.terms_label_prefix"] = trans["prefix"]
        data["signup.terms_label_link"] = trans["link"]
        data["signup.terms_label_suffix"] = trans["suffix"]
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2, sort_keys=True)
        print(f"Updated {lang}.json")
    else:
        print(f"Skipped {lang}.json (not found)")
