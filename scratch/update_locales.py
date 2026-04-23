import json
import os

locales_path = 'frontend/public/locales'
files = ['de.json', 'en.json', 'es.json', 'fi.json', 'fr.json', 'it.json', 'nl.json', 'no.json', 'pt.json', 'ro.json', 'ru.json', 'sv.json', 'uk.json']

translations = {
    'en': {
        "billing.error_all_fields": "Please complete all mandatory fields.",
        "billing.error_bank_country": "Please select the bank's country.",
        "billing.error_paxum": "Please enter a valid Paxum email.",
        "billing.error_crypto": "Please enter a valid Wallet address (Polygon).",
        "billing.error_required": "This field is required."
    },
    'fr': {
        "billing.error_all_fields": "Veuillez remplir tous les champs obligatoires.",
        "billing.error_bank_country": "Veuillez sélectionner le pays de la banque.",
        "billing.error_paxum": "Veuillez entrer un email Paxum valide.",
        "billing.error_crypto": "Veuillez entrer une adresse de portefeuille valide (Polygon).",
        "billing.error_required": "Ce champ est obligatoire."
    },
    'es': {
        "billing.error_all_fields": "Por favor, complete todos los campos obligatorios.",
        "billing.error_bank_country": "Por favor, seleccione el país del banco.",
        "billing.error_paxum": "Por favor, ingrese un correo electrónico de Paxum válido.",
        "billing.error_crypto": "Por favor, ingrese una dirección de billetera válida (Polygon).",
        "billing.error_required": "Este campo es obligatorio."
    },
    'de': {
        "billing.error_all_fields": "Bitte füllen Sie alle Pflichtfelder aus.",
        "billing.error_bank_country": "Bitte wählen Sie das Land der Bank aus.",
        "billing.error_paxum": "Bitte geben Sie eine gültige Paxum-E-Mail-Adresse ein.",
        "billing.error_crypto": "Bitte geben Sie eine gültige Wallet-Adresse ein (Polygon).",
        "billing.error_required": "Dieses Feld ist erforderlich."
    },
    'it': {
        "billing.error_all_fields": "Si prega di completare tutti i campi obbligatori.",
        "billing.error_bank_country": "Si prega di selezionare il paese della banca.",
        "billing.error_paxum": "Si prega di inserire un'email Paxum valida.",
        "billing.error_crypto": "Si prega di inserire un indirizzo di portafoglio valido (Polygon).",
        "billing.error_required": "Questo campo è obbligatorio."
    },
    'nl': {
        "billing.error_all_fields": "Vul a.u.b. alle verplichte velden in.",
        "billing.error_bank_country": "Selecteer a.u.b. het land van de bank.",
        "billing.error_paxum": "Voer a.u.b. een geldig Paxum-e-mailadres in.",
        "billing.error_crypto": "Voer a.u.b. een geldig Wallet-adres in (Polygon).",
        "billing.error_required": "Dit veld is verplicht."
    },
    'pt': {
        "billing.error_all_fields": "Por favor, preencha todos os campos obrigatórios.",
        "billing.error_bank_country": "Por favor, selecione o país do banco.",
        "billing.error_paxum": "Por favor, insira um e-mail do Paxum válido.",
        "billing.error_crypto": "Por favor, insira um endereço de carteira válido (Polygon).",
        "billing.error_required": "Este campo é obrigatório."
    },
    'ru': {
        "billing.error_all_fields": "Пожалуйста, заполните все обязательные поля.",
        "billing.error_bank_country": "Пожалуйста, выберите страну банка.",
        "billing.error_paxum": "Пожалуйста, введите действительный адрес электронной почты Paxum.",
        "billing.error_crypto": "Пожалуйста, введите действительный адрес кошелька (Polygon).",
        "billing.error_required": "Это поле обязательно для заполнения."
    },
    'ro': {
        "billing.error_all_fields": "Vă rugăm să completați toate câmpurile obligatorii.",
        "billing.error_bank_country": "Vă rugăm să selectați țara băncii.",
        "billing.error_paxum": "Vă rugăm să introduceți o adresă de e-mail Paxum validă.",
        "billing.error_crypto": "Vă rugăm să introduceți o adresă de portofel validă (Polygon).",
        "billing.error_required": "Acest câmp este obligatoriu."
    },
    'uk': {
        "billing.error_all_fields": "Будь ласка, заповніть усі обов'язкові поля.",
        "billing.error_bank_country": "Будь ласка, виберіть країну банку.",
        "billing.error_paxum": "Будь ласка, введіть дійсну адресу електронної пошти Paxum.",
        "billing.error_crypto": "Будь ласка, введіть дійсну адресу гаманця (Polygon).",
        "billing.error_required": "Це поле обов'язкове для заповнення."
    },
    'sv': {
        "billing.error_all_fields": "Vänligen fyll i alla obligatoriska fält.",
        "billing.error_bank_country": "Vänligen välj bankens land.",
        "billing.error_paxum": "Vänligen ange en giltig Paxum-e-postadress.",
        "billing.error_crypto": "Vänligen ange en giltig plånboksadress (Polygon).",
        "billing.error_required": "Detta fält är obligatoriskt."
    },
    'no': {
        "billing.error_all_fields": "Vennligst fyll ut alle obligatoriske felt.",
        "billing.error_bank_country": "Vennligst velg bankens land.",
        "billing.error_paxum": "Vennligst oppgi en gyldig Paxum-e-postadresse.",
        "billing.error_crypto": "Vennligst oppgi en gyldig lommebokadresse (Polygon).",
        "billing.error_required": "Dette feltet er obligatorisk."
    },
    'fi': {
        "billing.error_all_fields": "Ole hyvä ja täytä kaikki pakolliset kentät.",
        "billing.error_bank_country": "Ole hyvä ja valitse pankin maa.",
        "billing.error_paxum": "Ole hyvä ja syötä voimassa oleva Paxum-sähköpostiosoite.",
        "billing.error_crypto": "Ole hyvä ja syötä voimassa oleva lompakon osoite (Polygon).",
        "billing.error_required": "Tämä kenttä on pakollinen."
    }
}

for filename in files:
    lang = filename.split('.')[0]
    filepath = os.path.join(locales_path, filename)
    
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    new_trans = translations.get(lang, translations['en'])
    data.update(new_trans)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"Updated {filename}")
