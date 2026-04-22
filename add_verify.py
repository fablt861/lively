import json
import glob

locales_dir = 'frontend/public/locales/'
files = glob.glob(locales_dir + '*.json')

verify_translations = {
    'en': 'Verify',
    'fr': 'Vérifier',
    'es': 'Verificar',
    'de': 'Überprüfen',
    'it': 'Verifica',
    'nl': 'Verifiëren',
    'pt': 'Verificar',
    'ro': 'Verifică',
    'ru': 'Подтвердить',
    'sv': 'Verifiera',
    'uk': 'Підтвердити',
    'no': 'Bekreft',
    'fi': 'Vahvista'
}

for file in files:
    lang = file.split('/')[-1].replace('.json', '')
    if lang not in verify_translations:
        lang = 'en'
    
    with open(file, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    data['common.verify'] = verify_translations[lang]
    
    with open(file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
        print(f"Added common.verify to {lang}")

