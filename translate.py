import json
import os
import glob

locales_dir = 'frontend/public/locales/'
files = glob.glob(locales_dir + '*.json')

translations = {
  'en': {
    "profile.2fa_title": "Two-Factor Auth",
    "profile.2fa_enabled_desc": "Secured by App",
    "profile.2fa_disabled_desc": "Not Active",
    "profile.2fa_enable": "Enable",
    "profile.2fa_scan_qr": "Scan this QR code with Google Authenticator.",
    "profile.2fa_enter_code": "Current 6-digit Code",
    "profile.2fa_disable": "Disable 2FA",
    "auth.2fa_required_title": "2FA Required",
    "auth.2fa_required_desc": "Enter the 6-digit code from your authenticator app.",
    "auth.error.invalid_totp": "Invalid 2FA code."
  },
  'fr': {
    "profile.2fa_title": "Double Authentification",
    "profile.2fa_enabled_desc": "Sécurisé par App",
    "profile.2fa_disabled_desc": "Inactif",
    "profile.2fa_enable": "Activer",
    "profile.2fa_scan_qr": "Scannez ce QR code avec Google Authenticator.",
    "profile.2fa_enter_code": "Code actuel à 6 chiffres",
    "profile.2fa_disable": "Désactiver",
    "auth.2fa_required_title": "Vérification 2FA requise",
    "auth.2fa_required_desc": "Veuillez entrer le code généré par votre application.",
    "auth.error.invalid_totp": "Code 2FA invalide."
  },
  'es': {
    "profile.2fa_title": "Autenticación de dos factores",
    "profile.2fa_enabled_desc": "Asegurado por App",
    "profile.2fa_disabled_desc": "Inactivo",
    "profile.2fa_enable": "Habilitar",
    "profile.2fa_scan_qr": "Escanee este código QR con Google Authenticator.",
    "profile.2fa_enter_code": "Código actual de 6 dígitos",
    "profile.2fa_disable": "Desactivar 2FA",
    "auth.2fa_required_title": "2FA Requerido",
    "auth.2fa_required_desc": "Ingrese el código de 6 dígitos de su aplicación de autenticación.",
    "auth.error.invalid_totp": "Código 2FA no válido."
  },
  'de': {
    "profile.2fa_title": "Zwei-Faktor-Authentifizierung",
    "profile.2fa_enabled_desc": "Gesichert durch App",
    "profile.2fa_disabled_desc": "Nicht aktiv",
    "profile.2fa_enable": "Aktivieren",
    "profile.2fa_scan_qr": "Scannen Sie diesen QR-Code mit Google Authenticator.",
    "profile.2fa_enter_code": "Aktueller 6-stelliger Code",
    "profile.2fa_disable": "2FA deaktivieren",
    "auth.2fa_required_title": "2FA Erforderlich",
    "auth.2fa_required_desc": "Geben Sie den 6-stelligen Code aus Ihrer Authentifizierungs-App ein.",
    "auth.error.invalid_totp": "Ungültiger 2FA-Code."
  },
  'it': {
    "profile.2fa_title": "Autenticazione a due fattori",
    "profile.2fa_enabled_desc": "Protetto da App",
    "profile.2fa_disabled_desc": "Non attivo",
    "profile.2fa_enable": "Abilita",
    "profile.2fa_scan_qr": "Scansiona questo codice QR con Google Authenticator.",
    "profile.2fa_enter_code": "Codice attuale a 6 cifre",
    "profile.2fa_disable": "Disabilita 2FA",
    "auth.2fa_required_title": "2FA Richiesto",
    "auth.2fa_required_desc": "Inserire il codice a 6 cifre dall'app di autenticazione.",
    "auth.error.invalid_totp": "Codice 2FA non valido."
  },
  'nl': {
    "profile.2fa_title": "Tweefactorauthenticatie",
    "profile.2fa_enabled_desc": "Beveiligd via App",
    "profile.2fa_disabled_desc": "Niet actief",
    "profile.2fa_enable": "Inschakelen",
    "profile.2fa_scan_qr": "Scan deze QR-code met Google Authenticator.",
    "profile.2fa_enter_code": "Huidige 6-cijferige code",
    "profile.2fa_disable": "2FA uitschakelen",
    "auth.2fa_required_title": "2FA Vereist",
    "auth.2fa_required_desc": "Voer de 6-cijferige code van uw authenticatie-app in.",
    "auth.error.invalid_totp": "Ongeldige 2FA-code."
  },
  'pt': {
    "profile.2fa_title": "Autenticação de dois fatores",
    "profile.2fa_enabled_desc": "Protegido por App",
    "profile.2fa_disabled_desc": "Inativo",
    "profile.2fa_enable": "Ativar",
    "profile.2fa_scan_qr": "Digitalize este código QR com o Google Authenticator.",
    "profile.2fa_enter_code": "Código atual de 6 dígitos",
    "profile.2fa_disable": "Desativar 2FA",
    "auth.2fa_required_title": "2FA Necessário",
    "auth.2fa_required_desc": "Insira o código de 6 dígitos do seu aplicativo de autenticação.",
    "auth.error.invalid_totp": "Código 2FA inválido."
  },
  'ro': {
    "profile.2fa_title": "Autentificare în doi factori",
    "profile.2fa_enabled_desc": "Securizat prin aplicație",
    "profile.2fa_disabled_desc": "Inactiv",
    "profile.2fa_enable": "Activați",
    "profile.2fa_scan_qr": "Scanați acest cod QR cu Google Authenticator.",
    "profile.2fa_enter_code": "Codul actual din 6 cifre",
    "profile.2fa_disable": "Dezactivați 2FA",
    "auth.2fa_required_title": "2FA Necesar",
    "auth.2fa_required_desc": "Introduceți codul din 6 cifre din aplicația de autentificare.",
    "auth.error.invalid_totp": "Cod 2FA invalid."
  },
  'ru': {
    "profile.2fa_title": "Двухфакторная аутентификация",
    "profile.2fa_enabled_desc": "Защищено приложением",
    "profile.2fa_disabled_desc": "Неактивно",
    "profile.2fa_enable": "Включить",
    "profile.2fa_scan_qr": "Отсканируйте этот QR-код с помощью Google Authenticator.",
    "profile.2fa_enter_code": "Текущий 6-значный код",
    "profile.2fa_disable": "Отключить 2FA",
    "auth.2fa_required_title": "Требуется 2FA",
    "auth.2fa_required_desc": "Введите 6-значный код из приложения для аутентификации.",
    "auth.error.invalid_totp": "Неверный код 2FA."
  },
  'sv': {
    "profile.2fa_title": "Tvåfaktorsautentisering",
    "profile.2fa_enabled_desc": "Säkrat via app",
    "profile.2fa_disabled_desc": "Inaktiv",
    "profile.2fa_enable": "Aktivera",
    "profile.2fa_scan_qr": "Skanna denna QR-kod med Google Authenticator.",
    "profile.2fa_enter_code": "Aktuell 6-siffrig kod",
    "profile.2fa_disable": "Inaktivera 2FA",
    "auth.2fa_required_title": "2FA Krävs",
    "auth.2fa_required_desc": "Ange den 6-siffriga koden från din autentiseringsapp.",
    "auth.error.invalid_totp": "Ogiltig 2FA-kod."
  },
  'uk': {
    "profile.2fa_title": "Двофакторна автентифікація",
    "profile.2fa_enabled_desc": "Захищено додатком",
    "profile.2fa_disabled_desc": "Неактивно",
    "profile.2fa_enable": "Увімкнути",
    "profile.2fa_scan_qr": "Відскануйте цей QR-код за допомогою Google Authenticator.",
    "profile.2fa_enter_code": "Поточний 6-значний код",
    "profile.2fa_disable": "Вимкнути 2FA",
    "auth.2fa_required_title": "Потрібна 2FA",
    "auth.2fa_required_desc": "Введіть 6-значний код із програми для автентифікації.",
    "auth.error.invalid_totp": "Недійсний код 2FA."
  },
  'no': {
    "profile.2fa_title": "Tofaktorautentisering",
    "profile.2fa_enabled_desc": "Sikret med app",
    "profile.2fa_disabled_desc": "Inaktiv",
    "profile.2fa_enable": "Aktiver",
    "profile.2fa_scan_qr": "Skann denne QR-koden med Google Authenticator.",
    "profile.2fa_enter_code": "Nåværende 6-sifret kode",
    "profile.2fa_disable": "Deaktiver 2FA",
    "auth.2fa_required_title": "2FA Kreves",
    "auth.2fa_required_desc": "Skriv inn den 6-sifrede koden fra autentiseringsappen din.",
    "auth.error.invalid_totp": "Ugyldig 2FA-kode."
  },
  'fi': {
    "profile.2fa_title": "Kaksivaiheinen todennus",
    "profile.2fa_enabled_desc": "Sovelluksen suojaama",
    "profile.2fa_disabled_desc": "Ei aktiivinen",
    "profile.2fa_enable": "Ota käyttöön",
    "profile.2fa_scan_qr": "Skannaa tämä QR-koodi Google Authenticatorilla.",
    "profile.2fa_enter_code": "Nykyinen 6-numeroinen koodi",
    "profile.2fa_disable": "Poista 2FA käytöstä",
    "auth.2fa_required_title": "2FA Vaaditaan",
    "auth.2fa_required_desc": "Anna 6-numeroinen koodi todennussovelluksestasi.",
    "auth.error.invalid_totp": "Virheellinen 2FA-koodi."
  }
}

for file in files:
    lang = os.path.basename(file).replace('.json', '')
    if lang not in translations:
        lang = 'en'
    
    with open(file, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    for k, v in translations[lang].items():
        parts = k.split('.')
        if len(parts) == 2:
            if parts[0] not in data:
                data[parts[0]] = {}
            data[parts[0]][parts[1]] = v
            
    with open(file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
        print(f"Updated {file}")

