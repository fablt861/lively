import json
import os

languages = {
    "en": {
        "busy": "IN PRIVATE SESSION",
        "join": "JOIN"
    },
    "fr": {
        "busy": "EN SESSION PRIVÉE",
        "join": "REJOINDRE"
    },
    "es": {
        "busy": "EN SESIÓN PRIVADA",
        "join": "UNIRSE"
    },
    "de": {
        "busy": "IN PRIVATER SITZUNG",
        "join": "BEITRETEN"
    },
    "it": {
        "busy": "IN SESSIONE PRIVATA",
        "join": "UNIRSI"
    },
    "nl": {
        "busy": "IN PRIVÉSESSIE",
        "join": "DEELNEMEN"
    },
    "pt": {
        "busy": "EM SESSÃO PRIVADA",
        "join": "ENTRAR"
    },
    "ru": {
        "busy": "В ПРИВАТНОЙ СЕССИИ",
        "join": "ПРИСОЕДИНИТЬСЯ"
    },
    "uk": {
        "busy": "У ПРИВАТНІЙ СЕСІЇ",
        "join": "ПРИЄДНАТИСЯ"
    },
    "ro": {
        "busy": "ÎN SESIUNE PRIVATĂ",
        "join": "ALĂTURĂ-TE"
    },
    "sv": {
        "busy": "I PRIVAT SESSION",
        "join": "GÅ MED"
    },
    "no": {
        "busy": "I PRIVAT SESJON",
        "join": "BLI MED"
    },
    "fi": {
        "busy": "YKSITYISESSÄ ISTUNNOSSA",
        "join": "LIITY"
    }
}

base_path = "frontend/public/locales"

for lang, trans in languages.items():
    file_path = f"{base_path}/{lang}.json"
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        data["dashboard.model_busy"] = trans["busy"]
        data["dashboard.join"] = trans["join"]
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2, sort_keys=True)
        print(f"Updated {lang}.json")
    else:
        print(f"Skipped {lang}.json (not found)")
